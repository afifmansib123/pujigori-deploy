import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { ISSLCommerzPayment, ISSLCommerzResponse } from '../types';

class SSLCommerzService {
  private readonly storeId: string;
  private readonly storePassword: string;
  private readonly isSandbox: boolean;
  private readonly baseUrl: string;

  constructor() {
    this.storeId = process.env.SSLCOMMERZ_STORE_ID || '';
    this.storePassword = process.env.SSLCOMMERZ_STORE_PASS || '';
    this.isSandbox = process.env.SSLCOMMERZ_IS_SANDBOX === 'true';
    
    if (!this.storeId || !this.storePassword) {
      throw new Error('SSLCommerz store ID and password are required');
    }

    // Set URLs based on sandbox/live environment
    this.baseUrl = this.isSandbox 
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';
  }

  /**
   * Initialize payment session with SSLCommerz
   */
  public async initiatePayment(paymentData: {
    transactionId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    productName: string;
    productCategory: string;
    successUrl?: string;
    failUrl?: string;
    cancelUrl?: string;
    ipnUrl?: string;
  }): Promise<ISSLCommerzResponse> {
    try {
      const sslData: ISSLCommerzPayment = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        total_amount: paymentData.amount,
        currency: 'BDT',
        tran_id: paymentData.transactionId,
        success_url: paymentData.successUrl || process.env.SSLCOMMERZ_SUCCESS_URL || '',
        fail_url: paymentData.failUrl || process.env.SSLCOMMERZ_FAIL_URL || '',
        cancel_url: paymentData.cancelUrl || process.env.SSLCOMMERZ_CANCEL_URL || '',
        ipn_url: paymentData.ipnUrl || process.env.SSLCOMMERZ_IPN_URL || '',
        cus_name: paymentData.customerName,
        cus_email: paymentData.customerEmail,
        cus_add1: paymentData.customerAddress,
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        cus_phone: paymentData.customerPhone,
        shipping_method: 'NO',
        product_name: paymentData.productName,
        product_category: paymentData.productCategory,
        product_profile: 'general'
      };

      console.log('Initiating SSLCommerz payment with data:', {
        ...sslData,
        store_passwd: '***hidden***'
      });

      const response: AxiosResponse<ISSLCommerzResponse> = await axios.post(
        `${this.baseUrl}/gwprocess/v4/api.php`,
        sslData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 30000
        }
      );

      console.log('SSLCommerz response:', {
        status: response.data.status,
        sessionkey: response.data.sessionkey ? 'present' : 'missing',
        redirectGatewayURL: response.data.redirectGatewayURL ? 'present' : 'missing'
      });

      if (response.data.status === 'SUCCESS') {
        return response.data;
      } else {
        throw new Error(response.data.failedreason || 'Payment initiation failed');
      }

    } catch (error) {
      console.error('SSLCommerz initiation error:', error);
      throw new Error(
        axios.isAxiosError(error) 
          ? `Payment gateway error: ${error.message}`
          : 'Failed to initiate payment'
      );
    }
  }

  /**
   * Query transaction status directly from SSLCommerz
   */
  public async queryTransaction(transactionId: string): Promise<{
    status: string;
    amount?: number;
    currency?: string;
    bankTransactionId?: string;
    cardType?: string;
    riskLevel?: string;
  }> {
    try {
      const queryData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        tran_id: transactionId
      };

      const queryUrl = `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`;

      console.log('Querying transaction status:', transactionId);

      const response = await axios.post(queryUrl, queryData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      console.log('Transaction query response:', response.data);

      return {
        status: response.data.status || 'UNKNOWN',
        amount: response.data.amount ? parseFloat(response.data.amount) : undefined,
        currency: response.data.currency,
        bankTransactionId: response.data.bank_tran_id,
        cardType: response.data.card_type,
        riskLevel: response.data.risk_level
      };

    } catch (error) {
      console.error('Transaction query error:', error);
      return {
        status: 'ERROR'
      };
    }
  }

  /**
   * Refund transaction
   */
  public async refundTransaction(
    bankTransactionId: string,
    refundAmount: number,
    refundReason: string
  ): Promise<{
    success: boolean;
    refundRefId?: string;
    message: string;
  }> {
    try {
      const refundData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        bank_tran_id: bankTransactionId,
        refund_amount: refundAmount,
        refund_remarks: refundReason,
        refe_id: this.generateRefundReferenceId(),
        format: 'json'
      };

      const refundUrl = `${this.baseUrl}/validator/api/merchantTransIDvalidationAPI.php`;

      console.log('Processing refund for bank transaction:', bankTransactionId);

      const response = await axios.post(refundUrl, refundData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      if (response.data.status === 'SUCCESS') {
        return {
          success: true,
          refundRefId: response.data.refund_ref_id,
          message: 'Refund processed successfully'
        };
      } else {
        return {
          success: false,
          message: response.data.errorReason || 'Refund failed'
        };
      }

    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        message: 'Refund processing failed'
      };
    }
  }

  /**
   * Generate secure transaction ID
   */
  public generateTransactionId(prefix = 'PG'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Generate refund reference ID
   */
  private generateRefundReferenceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `REF_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Basic webhook signature verification
   */
  public verifyWebhookSignature(data: any): boolean {
    try {
      // Basic validation - ensure required fields are present
      const requiredFields = ['tran_id', 'amount', 'status', 'store_id'];
      const hasRequiredFields = requiredFields.every(field => data[field] !== undefined);
      
      if (!hasRequiredFields) {
        console.error('Missing required webhook fields');
        return false;
      }

      // Verify store ID matches
      if (data.store_id !== this.storeId) {
        console.error('Store ID mismatch in webhook');
        return false;
      }

      return true;

    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  /**
   * Get payment gateway information
   */
  public getGatewayInfo(): {
    environment: 'sandbox' | 'live';
    storeId: string;
    baseUrl: string;
  } {
    return {
      environment: this.isSandbox ? 'sandbox' : 'live',
      storeId: this.storeId,
      baseUrl: this.baseUrl
    };
  }

  /**
   * Format amount for SSLCommerz (must be in BDT with 2 decimal places)
   */
  public formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Validate amount for SSLCommerz (minimum 10 BDT)
   */
  public isValidAmount(amount: number): boolean {
    return amount >= 10 && amount <= 500000; // SSLCommerz limits
  }
}

// Export singleton instance
const sslCommerzService = new SSLCommerzService();
export default sslCommerzService;

// Export class for testing
export { SSLCommerzService };