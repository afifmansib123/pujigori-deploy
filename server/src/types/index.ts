import { Document, Model } from "mongoose";

export enum ProjectStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  FUNDED = "funded",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

export enum ProjectCategory {
  TECHNOLOGY = "technology",
  ARTS = "arts",
  HEALTH = "health",
  EDUCATION = "education",
  ENVIRONMENT = "environment",
  COMMUNITY = "community",
  BUSINESS = "business",
  CHARITY = "charity",
  OTHER = "other",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PAID = "paid",
}

export enum RewardRedemptionStatus {
  PENDING = "pending",
  REDEEMED = "redeemed",
  EXPIRED = "expired",
}

// User Interface (placeholder for your auth system)
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: Date;
}

// Reward Tier Interface
export interface IRewardTier {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  minimumAmount: number; // in BDT
  maxBackers?: number;
  currentBackers: number;
  estimatedDelivery: Date;
  isActive: boolean;
  items: string[]; // Array of reward items/benefits
}

// Project Interface
export interface IProject extends Document {
  _id: string;
  creator: string; // User ID
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: ProjectCategory;
  targetAmount: number; // in BDT
  currentAmount: number; // in BDT
  adminFeeAmount: number; // 3% of total raised
  backerCount: number;
  startDate: Date;
  endDate: Date;
  status: ProjectStatus;
  images: string[]; // S3 URLs
  videoUrl?: string; // S3 URL
  location: {
    district: string;
    division: string;
  };
  rewardTiers: IRewardTier[];
  story: string; // Rich text content
  risks: string; // Project risks
  updates: IProjectUpdate[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  canReceiveDonations(): boolean;
}

// Project Update Interface
export interface IProjectUpdate {
  _id?: string;
  title: string;
  content: string;
  images?: string[];
  createdAt: Date;
}

// Donation Interface
export interface IDonation extends Document {
  _id: string;
  donor: string; // User ID (can be anonymous)
  project: string | IProject; // ✅ Changed: Can be string OR populated Project
  projectCreator: string; // ✅ NEW: cognitoId of project creator
  amount: number; // Original donation amount in BDT
  adminFee: number; // 5% admin fee
  netAmount: number; // Amount after admin fee
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionId?: string; // SSLCommerz transaction ID
  bankTransactionId?: string; // Bank reference
  sessionKey?: string; // SSLCommerz session key
  rewardTier?: string; // Reward tier ID if applicable
  rewardValue: number; // Calculated reward value
  rewardStatus: RewardRedemptionStatus;
  qrCodeData?: string; // QR code content
  qrCodeUrl?: string; // S3 URL for QR code image
  isAnonymous: boolean;
  message?: string; // Optional donor message
  donorDisplayName?: string; // ADD THIS - Display name for donor (used in admin controller)
  donorInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isSuccessful(): boolean;
  isRefundable(): boolean;
  canRedeemReward(): boolean;
  redeemReward(): Promise<IDonation>;
}

export interface IDonationModel extends Model<IDonation> {
  findByProject(
    projectId: string,
    status?: PaymentStatus
  ): Promise<IDonation[]>;
  findSuccessful(): Promise<IDonation[]>;
  getTotalRaised(projectId: string): Promise<any[]>;
  getStatistics(startDate?: Date, endDate?: Date): Promise<any[]>;
  findPendingRewards(): Promise<IDonation[]>;
}

// Payment Request Interface (for creators to withdraw funds)
export interface IPaymentRequest extends Document {
  _id: string;
  creator: string; // User ID
  project: string; // Project ID
  requestedAmount: number; // Amount requested in BDT
  adminFeeDeducted: number; // Admin fee amount
  netAmount: number; // Amount after admin fee
  status: PaymentRequestStatus;
  bankDetails: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    branchName: string;
  };
  adminNotes?: string;
  processedBy?: string; // Admin user ID
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  canBeApproved(): boolean;
  canBeRejected(): boolean;
  canBeMarkedAsPaid(): boolean;
  approve(adminId: string, notes?: string): Promise<IPaymentRequest>;
  reject(adminId: string, reason: string): Promise<IPaymentRequest>;
  markAsPaid(adminId: string, notes?: string): Promise<IPaymentRequest>;
}

export interface IPaymentRequestModel extends Model<IPaymentRequest> {
  getStatistics(startDate?: Date, endDate?: Date): Promise<any[]>;
  getTotalAdminFees(startDate?: Date, endDate?: Date): Promise<any[]>; // ADD THIS
  findPendingRequests(): Promise<IPaymentRequest[]>;
  findByProject(projectId: string): Promise<IPaymentRequest[]>;
  findByCreator(creatorId: string): Promise<IPaymentRequest[]>;
}

// SSLCommerz Payment Data Interface
export interface ISSLCommerzPayment {
  store_id: string;
  store_passwd: string;
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_city: string;
  cus_country: string;
  cus_phone: string;
  shipping_method: string;
  product_name: string;
  product_category: string;
  product_profile: string;
}

// SSLCommerz Response Interface
export interface ISSLCommerzResponse {
  status: string;
  failedreason?: string;
  sessionkey: string;
  gw: {
    gateway: string;
    r_flag: string;
    logo: string;
    name: string;
    redirect_url: string;
  }[];
  redirectGatewayURL?: string;
  GatewayPageURL?: string;
}

// SSLCommerz IPN (Instant Payment Notification) Interface
export interface ISSLCommerzIPN {
  val_id: string;
  store_id: string;
  store_passwd: string;
  v1: string;
  v2: string;
  amount: number;
  currency: string;
  store_amount: number;
  verify_sign: string;
  verify_key: string;
  verify_sign_sha2: string;
  tran_date: string;
  tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  status: string;
  reason: string;
  bank_tran_id: string;
  currency_type: string;
  currency_amount: number;
  currency_rate: number;
  base_fair: number;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  risk_level: string;
  risk_title: string;
}

// QR Code Data Interface
export interface IQRCodeData {
  donationId: string;
  projectId: string;
  amount: number;
  rewardTier?: string;
  rewardValue: number;
  donorName: string;
  createdAt: string;
  expiresAt?: string;
  donorEmail?: string;
}

// API Response Interface
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// File Upload Interface
export interface IFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// S3 Upload Response Interface
export interface IS3UploadResponse {
  url: string;
  key: string;
  bucket: string;
  location: string;
}

// Admin Statistics Interface
export interface IAdminStats {
  totalProjects: number;
  activeProjects: number;
  totalRaised: number; // in BDT
  totalAdminFees: number; // in BDT
  totalDonations: number;
  totalUsers: number;
  pendingPaymentRequests: number;
  thisMonthStats: {
    newProjects: number;
    totalRaised: number;
    totalDonations: number;
    adminFees: number;
  };
}

// Pagination Interface
export interface IPagination {
  page: number;
  limit: number;
  sort?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  filters?: Record<string, any>;
}

// Express Request Extensions
export interface IAuthenticatedRequest extends Request {
  user?: IUser;
}

// Database Connection Options
export interface IDBOptions {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  family: number;
}

// Error Response Interface
export interface IErrorResponse {
  message: string;
  statusCode: number;
  stack?: string;
  errors?: any[];
}

// Validation Error Interface
export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}
