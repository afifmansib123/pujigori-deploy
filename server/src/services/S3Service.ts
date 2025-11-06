import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { IFileUpload, IS3UploadResponse } from '../types';

class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    // Configure AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-southeast-1'
    });

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      signatureVersion: 'v4'
    });

    this.bucketName = process.env.AWS_S3_BUCKET || '';

    if (!this.bucketName) {
      throw new Error('AWS S3 bucket name is required');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required');
    }
  }

  /**
   * Upload file to S3
   */
  public async uploadFile(
    file: IFileUpload,
    folder: string = 'uploads',
    options?: {
      makePublic?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<IS3UploadResponse> {
    try {
      // Validate file
      this.validateFile(file);

      // Process file if it's an image
      let fileBuffer = file.buffer;
      let contentType = file.mimetype;

      if (this.isImage(file.mimetype)) {
        const processedImage = await this.processImage(file.buffer, options);
        fileBuffer = processedImage.buffer;
        contentType = processedImage.contentType;
      }

      // Generate unique filename
      const fileName = this.generateFileName(file.originalname);
      const key = `${folder}/${fileName}`;

      // Upload parameters
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ContentDisposition: 'inline',
        CacheControl: 'max-age=31536000', // 1 year cache
        Metadata: {
          'original-name': file.originalname,
          'upload-timestamp': new Date().toISOString(),
          'file-size': file.size.toString()
        }
      };

      // Upload to S3
      const result = await this.s3.upload(uploadParams).promise();

      return {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        location: result.Location
      };

    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple files
   */
  public async uploadMultipleFiles(
    files: IFileUpload[],
    folder: string = 'uploads',
    options?: {
      makePublic?: boolean;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<IS3UploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, folder, options)
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Multiple files upload error:', error);
      throw error;
    }
  }

  /**
   * Delete file from S3
   */
  public async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      console.log(`File deleted successfully: ${key}`);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple files from S3
   */
  public async deleteMultipleFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const deleteParams: AWS.S3.DeleteObjectsRequest = {
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: false
        }
      };

      await this.s3.deleteObjects(deleteParams).promise();
      console.log(`${keys.length} files deleted successfully`);
    } catch (error) {
      console.error('S3 multiple delete error:', error);
      throw new Error(`Failed to delete files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned URL for direct upload
   */
  public async getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    folder: string = 'uploads',
    expiresIn: number = 3600
  ): Promise<{
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }> {
    try {
      const key = `${folder}/${this.generateFileName(fileName)}`;

      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
        Expires: expiresIn,
      });

      const publicUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        key,
        publicUrl
      };
    } catch (error) {
      console.error('Presigned URL generation error:', error);
      throw new Error('Failed to generate presigned upload URL');
    }
  }

  /**
   * Generate presigned URL for file download
   */
  public async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      return await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      });
    } catch (error) {
      console.error('Presigned download URL generation error:', error);
      throw new Error('Failed to generate presigned download URL');
    }
  }

  /**
   * Check if file exists in S3
   */
  public async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  public async getFileMetadata(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata: { [key: string]: string };
  } | null> {
    try {
      const result = await this.s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }).promise();

      return {
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType || '',
        metadata: result.Metadata || {}
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Copy file within S3
   */
  public async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await this.s3.copyObject({
        Bucket: this.bucketName,
        CopySource: `${this.bucketName}/${sourceKey}`,
        Key: destinationKey,
      }).promise();

      console.log(`File copied from ${sourceKey} to ${destinationKey}`);
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('Failed to copy file');
    }
  }

  /**
   * List files in folder
   */
  public async listFiles(folder: string, maxKeys: number = 1000): Promise<{
    files: Array<{
      key: string;
      size: number;
      lastModified: Date;
      publicUrl: string;
    }>;
    isTruncated: boolean;
    continuationToken?: string;
  }> {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys
      }).promise();

      const files = (result.Contents || []).map(obj => ({
        key: obj.Key || '',
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        publicUrl: this.getPublicUrl(obj.Key || '')
      }));

      return {
        files,
        isTruncated: result.IsTruncated || false,
        continuationToken: result.NextContinuationToken
      };
    } catch (error) {
      console.error('S3 list files error:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Process image (resize, compress, convert)
   */
  private async processImage(
    buffer: Buffer,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    }
  ): Promise<{ buffer: Buffer; contentType: string }> {
    try {
      let sharpImage = sharp(buffer);

      // Get image metadata
      const metadata = await sharpImage.metadata();

      // Resize if dimensions are specified
      if (options?.maxWidth || options?.maxHeight) {
        sharpImage = sharpImage.resize(
          options.maxWidth || metadata.width,
          options.maxHeight || metadata.height,
          {
            fit: 'inside',
            withoutEnlargement: true
          }
        );
      }

      // Convert to JPEG for better compression
      const processedBuffer = await sharpImage
        .jpeg({
          quality: options?.quality || 85,
          progressive: true
        })
        .toBuffer();

      return {
        buffer: processedBuffer,
        contentType: 'image/jpeg'
      };
    } catch (error) {
      console.error('Image processing error:', error);
      // Return original buffer if processing fails
      return {
        buffer,
        contentType: 'image/jpeg'
      };
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: IFileUpload): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    // Check filename
    if (!file.originalname || file.originalname.length === 0) {
      throw new Error('File name is required');
    }

    // Check for malicious file extensions
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.php', '.jsp', '.asp'];
    const fileExtension = this.getFileExtension(file.originalname).toLowerCase();
    
    if (dangerousExtensions.includes(fileExtension)) {
      throw new Error('File type is not allowed for security reasons');
    }
  }

  /**
   * Check if file is an image
   */
  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const extension = this.getFileExtension(originalName);
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    return `${timestamp}_${uuid}_${sanitizedName}`;
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
  }

  /**
   * Get public URL for S3 object
   */
  public getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Extract key from S3 URL
   */
  public extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts.slice(1).join('/'); // Remove leading slash
    } catch (error) {
      return null;
    }
  }

  /**
   * Get S3 bucket info
   */
  public getBucketInfo(): {
    bucketName: string;
    region: string;
    publicBaseUrl: string;
  } {
    return {
      bucketName: this.bucketName,
      region: process.env.AWS_REGION || 'ap-southeast-1',
      publicBaseUrl: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`
    };
  }

  /**
   * Health check for S3 service
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    bucketExists: boolean;
    canWrite: boolean;
    region: string;
    error?: string;
  }> {
    try {
      // Check if bucket exists and we have access
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();

      // Test write permission with a small test file
      const testKey = 'health-check/test.txt';
      await this.s3.putObject({
        Bucket: this.bucketName,
        Key: testKey,
        Body: 'health check',
        ContentType: 'text/plain'
      }).promise();

      // Clean up test file
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: testKey
      }).promise();

      return {
        status: 'healthy',
        bucketExists: true,
        canWrite: true,
        region: process.env.AWS_REGION || 'ap-southeast-1'
      };

    } catch (error) {
      console.error('S3 health check failed:', error);
      return {
        status: 'unhealthy',
        bucketExists: false,
        canWrite: false,
        region: process.env.AWS_REGION || 'ap-southeast-1',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<{
    totalObjects: number;
    totalSize: number;
    folderStats: Array<{
      folder: string;
      objectCount: number;
      totalSize: number;
    }>;
  }> {
    try {
      const result = await this.s3.listObjectsV2({
        Bucket: this.bucketName
      }).promise();

      const objects = result.Contents || [];
      const folderStats = new Map<string, { count: number; size: number }>();

      let totalSize = 0;

      objects.forEach(obj => {
        const size = obj.Size || 0;
        totalSize += size;

        // Extract folder from key
        const folder = obj.Key?.split('/')[0] || 'root';
        const current = folderStats.get(folder) || { count: 0, size: 0 };
        folderStats.set(folder, {
          count: current.count + 1,
          size: current.size + size
        });
      });

      return {
        totalObjects: objects.length,
        totalSize,
        folderStats: Array.from(folderStats.entries()).map(([folder, stats]) => ({
          folder,
          objectCount: stats.count,
          totalSize: stats.size
        }))
      };

    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalObjects: 0,
        totalSize: 0,
        folderStats: []
      };
    }
  }
}

// Export singleton instance
const s3Service = new S3Service();
export default s3Service;

// Export class for testing
export { S3Service };