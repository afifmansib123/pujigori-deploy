import { Request, Response, NextFunction } from "express";
import s3Service from "../services/S3Service";
import { IFileUpload } from "../types";
import { ResponseUtils, FileUtils, ValidationUtils } from "../utils";

class UploadController {
  /**
   * POST /api/upload/single
   * Upload single file
   */
  async uploadSingle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json(ResponseUtils.error("No file uploaded"));
        return;
      }

      const file = req.file as IFileUpload;
      const { folder = "uploads", resize, quality } = req.body;

      // Validate file
      if (!FileUtils.isAllowedFileType(file.mimetype)) {
        res
          .status(400)
          .json(
            ResponseUtils.error(
              "File type not allowed. Supported types: JPG, PNG, GIF, WebP, MP4, WebM, PDF, TXT"
            )
          );
        return;
      }

      // Process upload options
      const uploadOptions: any = {
        makePublic: true,
      };

      if (FileUtils.isImage(file.mimetype)) {
        if (resize) {
          const [width, height] = resize.split("x").map(Number);
          if (width) uploadOptions.maxWidth = width;
          if (height) uploadOptions.maxHeight = height;
        }
        if (quality) {
          uploadOptions.quality = Number(quality);
        }
      }

      // Upload file
      const result = await s3Service.uploadFile(file, folder, uploadOptions);

      const response = {
        success: true,
        file: {
          originalName: file.originalname,
          fileName: result.key.split("/").pop(),
          url: result.url,
          key: result.key,
          size: file.size,
          mimeType: file.mimetype,
          folder,
        },
      };

      res.json(ResponseUtils.success("File uploaded successfully", response));
    } catch (error) {
      console.error("Single file upload error:", error);
      next(error);
    }
  }

  /**
   * POST /api/upload/multiple
   * Upload multiple files
   */
  async uploadMultiple(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json(ResponseUtils.error("No files uploaded"));
        return;
      }

      const files = req.files as IFileUpload[];
      const { folder = "uploads", resize, quality } = req.body;

      // Validate file count (max 10 files)
      if (files.length > 10) {
        res
          .status(400)
          .json(ResponseUtils.error("Maximum 10 files allowed per upload"));
        return;
      }

      // Validate all files
      for (const file of files) {
        if (!FileUtils.isAllowedFileType(file.mimetype)) {
          res
            .status(400)
            .json(
              ResponseUtils.error(
                `File type not allowed for ${file.originalname}. Supported types: JPG, PNG, GIF, WebP, MP4, WebM, PDF, TXT`
              )
            );
          return;
        }
      }

      // Process upload options
      const uploadOptions: any = {
        makePublic: true,
      };

      if (resize) {
        const [width, height] = resize.split("x").map(Number);
        if (width) uploadOptions.maxWidth = width;
        if (height) uploadOptions.maxHeight = height;
      }
      if (quality) {
        uploadOptions.quality = Number(quality);
      }

      // Upload all files
      const results = await s3Service.uploadMultipleFiles(
        files,
        folder,
        uploadOptions
      );

      const response = {
        success: true,
        files: results.map((result, index) => ({
          originalName: files[index].originalname,
          fileName: result.key.split("/").pop(),
          url: result.url,
          key: result.key,
          size: files[index].size,
          mimeType: files[index].mimetype,
          folder,
        })),
        totalUploaded: results.length,
      };

      res.json(
        ResponseUtils.success(
          `${results.length} files uploaded successfully`,
          response
        )
      );
    } catch (error) {
      console.error("Multiple files upload error:", error);
      next(error);
    }
  }
 
  /**
   * POST /api/upload/presigned-url
   * Generate presigned URL for direct upload
   */
  async getPresignedUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        fileName,
        fileType,
        folder = "uploads",
        expiresIn = 3600,
      } = req.body;

      if (!fileName || !fileType) {
        res
          .status(400)
          .json(ResponseUtils.error("fileName and fileType are required"));
        return;
      }

      // Validate file type
      if (!FileUtils.isAllowedFileType(fileType)) {
        res.status(400).json(ResponseUtils.error("File type not allowed"));
        return;
      }

      const result = await s3Service.getPresignedUploadUrl(
        fileName,
        fileType,
        folder,
        expiresIn
      );

      res.json(
        ResponseUtils.success("Presigned URL generated successfully", {
          uploadUrl: result.uploadUrl,
          key: result.key,
          publicUrl: result.publicUrl,
          expiresIn,
          instructions: {
            method: "PUT",
            headers: {
              "Content-Type": fileType,
            },
          },
        })
      );
    } catch (error) {
      console.error("Presigned URL generation error:", error);
      next(error);
    }
  }

  /**
   * DELETE /api/upload/:key
   * Delete uploaded file
   */
  async deleteFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json(ResponseUtils.error("File key is required"));
        return;
      }

      // Decode URL-encoded key
      const decodedKey = decodeURIComponent(key);

      // Check if file exists
      const exists = await s3Service.fileExists(decodedKey);
      if (!exists) {
        res.status(404).json(ResponseUtils.error("File not found"));
        return;
      }

      await s3Service.deleteFile(decodedKey);

      res.json(
        ResponseUtils.success("File deleted successfully", { key: decodedKey })
      );
    } catch (error) {
      console.error("File deletion error:", error);
      next(error);
    }
  }

  /**
   * POST /api/upload/delete-multiple
   * Delete multiple files
   */
  async deleteMultipleFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { keys } = req.body;

      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        res
          .status(400)
          .json(
            ResponseUtils.error("Keys array is required and must not be empty")
          );
        return;
      }

      if (keys.length > 100) {
        res
          .status(400)
          .json(
            ResponseUtils.error("Maximum 100 files can be deleted at once")
          );
        return;
      }

      // Decode keys
      const decodedKeys = keys.map((key) => decodeURIComponent(key));

      await s3Service.deleteMultipleFiles(decodedKeys);

      res.json(
        ResponseUtils.success(
          `${decodedKeys.length} files deleted successfully`,
          { deletedKeys: decodedKeys }
        )
      );
    } catch (error) {
      console.error("Multiple files deletion error:", error);
      next(error);
    }
  }

  /**
   * GET /api/upload/file-info/:key
   * Get file metadata
   */
  async getFileInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json(ResponseUtils.error("File key is required"));
        return;
      }

      const decodedKey = decodeURIComponent(key);
      const metadata = await s3Service.getFileMetadata(decodedKey);

      if (!metadata) {
        res.status(404).json(ResponseUtils.error("File not found"));
        return;
      }

      const fileInfo = {
        key: decodedKey,
        url: s3Service.getPublicUrl(decodedKey),
        size: metadata.size,
        sizeFormatted: FileUtils.formatFileSize(metadata.size),
        contentType: metadata.contentType,
        lastModified: metadata.lastModified,
        metadata: metadata.metadata,
      };

      res.json(
        ResponseUtils.success(
          "File information retrieved successfully",
          fileInfo
        )
      );
    } catch (error) {
      console.error("File info retrieval error:", error);
      next(error);
    }
  }

  /**
   * GET /api/upload/list/:folder
   * List files in folder
   */
  async listFiles(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { folder } = req.params;
      const { maxKeys = 100, continuationToken } = req.query;

      if (!folder) {
        res.status(400).json(ResponseUtils.error("Folder name is required"));
        return;
      }

      const result = await s3Service.listFiles(folder, Number(maxKeys));

      const files = result.files.map((file) => ({
        key: file.key,
        fileName: file.key.split("/").pop(),
        url: file.publicUrl,
        size: file.size,
        sizeFormatted: FileUtils.formatFileSize(file.size),
        lastModified: file.lastModified,
        isImage: FileUtils.isImage(file.key.split(".").pop() || ""),
        isVideo: FileUtils.isVideo(file.key.split(".").pop() || ""),
      }));

      res.json(
        ResponseUtils.success("Files listed successfully", {
          folder,
          files,
          totalFiles: files.length,
          isTruncated: result.isTruncated,
          continuationToken: result.continuationToken,
        })
      );
    } catch (error) {
      console.error("File listing error:", error);
      next(error);
    }
  }

  /**
   * POST /api/upload/copy
   * Copy file within S3
   */
  async copyFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sourceKey, destinationKey } = req.body;

      if (!sourceKey || !destinationKey) {
        res
          .status(400)
          .json(
            ResponseUtils.error("sourceKey and destinationKey are required")
          );
        return;
      }

      // Check if source file exists
      const exists = await s3Service.fileExists(sourceKey);
      if (!exists) {
        res.status(404).json(ResponseUtils.error("Source file not found"));
        return;
      }

      await s3Service.copyFile(sourceKey, destinationKey);

      res.json(
        ResponseUtils.success("File copied successfully", {
          sourceKey,
          destinationKey,
          destinationUrl: s3Service.getPublicUrl(destinationKey),
        })
      );
    } catch (error) {
      console.error("File copy error:", error);
      next(error);
    }
  }

  /**
   * GET /api/upload/download/:key
   * Generate presigned download URL
   */
  async getDownloadUrl(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { key } = req.params;
      const { expiresIn = 3600 } = req.query;

      if (!key) {
        res.status(400).json(ResponseUtils.error("File key is required"));
        return;
      }

      const decodedKey = decodeURIComponent(key);

      // Check if file exists
      const exists = await s3Service.fileExists(decodedKey);
      if (!exists) {
        res.status(404).json(ResponseUtils.error("File not found"));
        return;
      }

      const downloadUrl = await s3Service.getPresignedDownloadUrl(
        decodedKey,
        Number(expiresIn)
      );

      res.json(
        ResponseUtils.success("Download URL generated successfully", {
          key: decodedKey,
          downloadUrl,
          expiresIn: Number(expiresIn),
          expiresAt: new Date(
            Date.now() + Number(expiresIn) * 1000
          ).toISOString(),
        })
      );
    } catch (error) {
      console.error("Download URL generation error:", error);
      next(error);
    }
  }

  /**
   * GET /api/upload/storage-stats
   * Get storage statistics (admin only)
   */
  async getStorageStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await s3Service.getStorageStats();

      const formattedStats = {
        totalObjects: stats.totalObjects,
        totalSize: stats.totalSize,
        totalSizeFormatted: FileUtils.formatFileSize(stats.totalSize),
        folderStats: stats.folderStats.map((folder) => ({
          folder: folder.folder,
          objectCount: folder.objectCount,
          totalSize: folder.totalSize,
          totalSizeFormatted: FileUtils.formatFileSize(folder.totalSize),
          averageSize:
            folder.objectCount > 0
              ? Math.round(folder.totalSize / folder.objectCount)
              : 0,
          averageSizeFormatted:
            folder.objectCount > 0
              ? FileUtils.formatFileSize(
                  Math.round(folder.totalSize / folder.objectCount)
                )
              : "0 Bytes",
        })),
        generatedAt: new Date().toISOString(),
      };

      res.json(
        ResponseUtils.success(
          "Storage statistics retrieved successfully",
          formattedStats
        )
      );
    } catch (error) {
      console.error("Storage stats error:", error);
      next(error);
    }
  }

  /**
   * POST /api/upload/validate
   * Validate file before upload (client-side validation helper)
   */
  async validateFile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { fileName, fileSize, fileType } = req.body;

      if (!fileName || !fileSize || !fileType) {
        res
          .status(400)
          .json(
            ResponseUtils.error("fileName, fileSize, and fileType are required")
          );
        return;
      }

      const validation = {
        fileName: {
          isValid: true,
          error: null as string | null,
        },
        fileSize: {
          isValid: true,
          error: null as string | null,
        },
        fileType: {
          isValid: true,
          error: null as string | null,
        },
      };

      // Validate file name
      if (fileName.length > 255) {
        validation.fileName.isValid = false;
        validation.fileName.error = "File name too long (max 255 characters)";
      }

      const dangerousExtensions = [
        ".exe",
        ".bat",
        ".sh",
        ".php",
        ".jsp",
        ".asp",
      ];
      const extension = FileUtils.getExtension(fileName).toLowerCase();
      if (dangerousExtensions.includes(extension)) {
        validation.fileName.isValid = false;
        validation.fileName.error =
          "File type not allowed for security reasons";
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileSize > maxSize) {
        validation.fileSize.isValid = false;
        validation.fileSize.error = `File too large (max ${FileUtils.formatFileSize(
          maxSize
        )})`;
      }

      // Validate file type
      if (!FileUtils.isAllowedFileType(fileType)) {
        validation.fileType.isValid = false;
        validation.fileType.error = "File type not supported";
      }

      const isOverallValid =
        validation.fileName.isValid &&
        validation.fileSize.isValid &&
        validation.fileType.isValid;

      res.json(
        ResponseUtils.success(
          isOverallValid ? "File validation passed" : "File validation failed",
          {
            isValid: isOverallValid,
            validation,
            supportedTypes: [
              "image/jpeg",
              "image/jpg",
              "image/png",
              "image/gif",
              "image/webp",
              "video/mp4",
              "video/webm",
              "application/pdf",
              "text/plain",
            ],
            maxFileSize: maxSize,
            maxFileSizeFormatted: FileUtils.formatFileSize(maxSize),
          }
        )
      );
    } catch (error) {
      console.error("File validation error:", error);
      next(error);
    }
  }

  /**
   * GET /api/upload/health
   * Check S3 service health
   */
  async getUploadHealth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const health = await s3Service.healthCheck();

      if (health.status === "healthy") {
        res.json(ResponseUtils.success("Upload service is healthy", health));
      } else {
        res
          .status(503)
          .json(
            ResponseUtils.error(
              "Upload service is unhealthy",
              [health.error || "Unknown error"],
              503
            )
          );
      }
    } catch (error) {
      console.error("Upload health check error:", error);
      res
        .status(503)
        .json(
          ResponseUtils.error(
            "Upload health check failed",
            [error instanceof Error ? error.message : "Unknown error"],
            503
          )
        );
    }
  }
}

export default new UploadController();
