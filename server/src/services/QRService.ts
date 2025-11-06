import QRCode from 'qrcode';
import { IQRCodeData, IDonation, IProject } from '../types';
import s3Service from './S3Service';

class QRService {
  /**
   * Generate QR code for donation with reward information
   */
public async generateDonationQR(
  donation: IDonation,
  project: IProject,
  options?: {
    size?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<{
  qrCodeData: string;
  qrCodeBuffer: Buffer;
  qrCodeUrl?: string;
}> {
  try {
    // ✅ Create a verification URL instead of JSON
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-reward/${donation._id}`;

    // Keep JSON data for database storage
    const qrData: IQRCodeData = {
      donationId: donation._id,
      projectId: donation.project,
      amount: donation.amount,
      rewardTier: donation.rewardTier,
      rewardValue: donation.rewardValue,
      donorName: donation.isAnonymous 
        ? 'Anonymous'
        : donation.donorInfo?.name || 'Registered User',
      donorEmail: donation.isAnonymous
        ? undefined
        : donation.donorInfo?.email,
      createdAt: donation.createdAt.toISOString(),
      expiresAt: this.calculateExpiryDate(donation.createdAt).toISOString()
    };

    const qrDataString = JSON.stringify(qrData);

    // ✅ Generate QR code with the URL instead of JSON
    const qrCodeBuffer = await this.generateQRBuffer(verificationUrl, options);

    // Upload to S3
    let qrCodeUrl: string | undefined;
    try {
      const uploadResult = await s3Service.uploadFile(
        {
          fieldname: 'qrcode',
          originalname: `donation-${donation._id}-qr.png`,
          encoding: '7bit',
          mimetype: 'image/png',
          buffer: qrCodeBuffer,
          size: qrCodeBuffer.length
        },
        'qrcodes',
        { makePublic: true }
      );
      qrCodeUrl = uploadResult.url;
    } catch (uploadError) {
      console.error('Failed to upload QR code to S3:', uploadError);
    }

    return {
      qrCodeData: qrDataString, // Keep JSON for database reference
      qrCodeBuffer,
      qrCodeUrl
    };

  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

  /**
   * Generate QR code for project information
   */
  public async generateProjectQR(
    project: IProject,
    options?: {
      size?: number;
      includeStats?: boolean;
    }
  ): Promise<{
    qrCodeData: string;
    qrCodeBuffer: Buffer;
    qrCodeUrl?: string;
  }> {
    try {
      // Create project QR data
      const projectData = {
        type: 'project',
        projectId: project._id,
        title: project.title,
        slug: project.slug,
        targetAmount: project.targetAmount,
        currentAmount: options?.includeStats ? project.currentAmount : undefined,
        fundingProgress: options?.includeStats ? Math.round((project.currentAmount / project.targetAmount) * 100) : undefined,
        endDate: project.endDate.toISOString(),
        projectUrl: `${process.env.FRONTEND_URL}/projects/${project.slug}`,
        createdAt: new Date().toISOString()
      };

      const qrDataString = JSON.stringify(projectData);
      const qrCodeBuffer = await this.generateQRBuffer(qrDataString, options);

      // Upload to S3
      let qrCodeUrl: string | undefined;
      try {
        const uploadResult = await s3Service.uploadFile(
          {
            fieldname: 'qrcode',
            originalname: `project-${project.slug}-qr.png`,
            encoding: '7bit',
            mimetype: 'image/png',
            buffer: qrCodeBuffer,
            size: qrCodeBuffer.length
          },
          'qrcodes/projects',
          { makePublic: true }
        );
        qrCodeUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Failed to upload project QR code to S3:', uploadError);
      }

      return {
        qrCodeData: qrDataString,
        qrCodeBuffer,
        qrCodeUrl
      };

    } catch (error) {
      console.error('Project QR code generation error:', error);
      throw new Error('Failed to generate project QR code');
    }
  }

  /**
   * Generate QR code for payment link
   */
  public async generatePaymentQR(
    transactionId: string,
    amount: number,
    projectTitle: string,
    paymentUrl: string
  ): Promise<{
    qrCodeData: string;
    qrCodeBuffer: Buffer;
  }> {
    try {
      const paymentData = {
        type: 'payment',
        transactionId,
        amount,
        projectTitle,
        paymentUrl,
        currency: 'BDT',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };

      const qrDataString = JSON.stringify(paymentData);
      const qrCodeBuffer = await this.generateQRBuffer(qrDataString, {
        size: 300,
        errorCorrectionLevel: 'M'
      });

      return {
        qrCodeData: qrDataString,
        qrCodeBuffer
      };

    } catch (error) {
      console.error('Payment QR code generation error:', error);
      throw new Error('Failed to generate payment QR code');
    }
  }

  /**
   * Generate simple text QR code
   */
  public async generateTextQR(
    text: string,
    options?: {
      size?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  ): Promise<Buffer> {
    try {
      return await this.generateQRBuffer(text, options);
    } catch (error) {
      console.error('Text QR code generation error:', error);
      throw new Error('Failed to generate text QR code');
    }
  }

  /**
   * Generate QR code as data URL (base64)
   */
  public async generateQRDataURL(
    data: string,
    options?: {
      size?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      margin?: number;
    }
  ): Promise<string> {
    try {
      const qrOptions = {
        type: 'image/png' as const,
        width: options?.size || 256,
        margin: options?.margin || 2,
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      return await QRCode.toDataURL(data, qrOptions);
    } catch (error) {
      console.error('QR code data URL generation error:', error);
      throw new Error('Failed to generate QR code data URL');
    }
  }

  /**
   * Validate QR code data
   */
  public validateQRData(qrDataString: string): {
    isValid: boolean;
    data?: IQRCodeData | any;
    error?: string;
  } {
    try {
      const data = JSON.parse(qrDataString);

      // Check if it's donation QR data
      if (data.donationId && data.projectId) {
        if (!this.isValidDonationQRData(data)) {
          return {
            isValid: false,
            error: 'Invalid donation QR data structure'
          };
        }

        // Check if expired
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          return {
            isValid: false,
            error: 'QR code has expired'
          };
        }

        return {
          isValid: true,
          data
        };
      }

      // Check if it's project QR data
      if (data.type === 'project' && data.projectId) {
        return {
          isValid: true,
          data
        };
      }

      // Check if it's payment QR data
      if (data.type === 'payment' && data.transactionId) {
        // Check if expired
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          return {
            isValid: false,
            error: 'Payment QR code has expired'
          };
        }

        return {
          isValid: true,
          data
        };
      }

      return {
        isValid: false,
        error: 'Unknown QR data format'
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Generate QR code buffer with options
   */
  private async generateQRBuffer(
    data: string,
    options?: {
      size?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    }
  ): Promise<Buffer> {
    const qrOptions = {
      type: 'png' as const,
      width: options?.size || 256,
      margin: options?.margin || 2,
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M' as const,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      }
    };

    return await QRCode.toBuffer(data, qrOptions);
  }

  /**
   * Calculate expiry date for donation QR codes (30 days from creation)
   */
  private calculateExpiryDate(createdAt: Date): Date {
    const expiryDate = new Date(createdAt);
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days expiry
    return expiryDate;
  }

  /**
   * Validate donation QR data structure
   */
  private isValidDonationQRData(data: any): data is IQRCodeData {
    return (
      typeof data.donationId === 'string' &&
      typeof data.projectId === 'string' &&
      typeof data.amount === 'number' &&
      typeof data.rewardValue === 'number' &&
      typeof data.donorName === 'string' &&
      typeof data.createdAt === 'string'
    );
  }

  /**
   * Get QR code info without generating
   */
  public getQRCodeInfo(data: string): {
    estimatedSize: number;
    complexity: 'low' | 'medium' | 'high';
    recommendedErrorCorrection: 'L' | 'M' | 'Q' | 'H';
  } {
    const dataLength = data.length;

    let complexity: 'low' | 'medium' | 'high' = 'low';
    let recommendedErrorCorrection: 'L' | 'M' | 'Q' | 'H' = 'L';

    if (dataLength < 100) {
      complexity = 'low';
      recommendedErrorCorrection = 'L';
    } else if (dataLength < 500) {
      complexity = 'medium';
      recommendedErrorCorrection = 'M';
    } else {
      complexity = 'high';
      recommendedErrorCorrection = 'H';
    }

    // Estimate QR code size based on data length
    const estimatedSize = Math.max(256, Math.min(1024, dataLength * 2));

    return {
      estimatedSize,
      complexity,
      recommendedErrorCorrection
    };
  }

  /**
   * Batch generate QR codes
   */
  public async generateBatchQR(
    items: Array<{
      data: string;
      filename: string;
      options?: any;
    }>
  ): Promise<Array<{
    filename: string;
    buffer: Buffer;
    success: boolean;
    error?: string;
  }>> {
    const results = [];

    for (const item of items) {
      try {
        const buffer = await this.generateQRBuffer(item.data, item.options);
        results.push({
          filename: item.filename,
          buffer,
          success: true
        });
      } catch (error) {
        results.push({
          filename: item.filename,
          buffer: Buffer.alloc(0),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

// Export singleton instance
const qrService = new QRService();
export default qrService;

// Export class for testing
export { QRService };