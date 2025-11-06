# PujiGori Backend Implementation Guide

## 🎯 Notes 



### Step 1 : Initial Project Setup

1. **Create Project Directory**
   -> Manually created the folder and started the project
   mkdir pujigori-backend
   cd pujigori-backend

2. **Copy All Configuration Files**
   ->Created these files in project root:
   - `package.json`
   - `tsconfig.json`
   - `.env.example`
   - `.gitignore`
   - `nodemon.json`
   - `.eslintrc.js`
   - `jest.config.js`

3. **Install Dependencies**
   ->Installed package afterwards.
   npm install

4. **Create Directory Structure**
   -> Initiating directories for the project setup
   mkdir -p src/{config,models,services,types,utils,controllers,routes,middleware,tests}
   mkdir -p dist logs uploads docs

### Step 2 : DataBase Models , Serices & App, index.ts.

1. **Create Core Type Definitions**
   - Copy `src/types/index.ts` with all interfaces and enums

2. **Create Database Configuration**
   - Copy `src/config/database.ts` with MongoDB connection management

3. **Create Database Models** (Advanced Databse options explained at advancedModel.md)
   - Copy `src/models/Project.ts`
   - Copy `src/models/Donation.ts`
   - Copy `src/models/PaymentRequest.ts`

4. **Create Core Services**
   - Copy `src/services/SSLCommerzService.ts`
   - Copy `src/services/S3Service.ts`
   - Copy `src/services/QRService.ts`

5. **Create Utility Functions**
   - Copy `src/utils/index.ts`

6. **Create Application Setup**
   - Copy `src/app.ts`
   - Copy `src/index.ts`

### Step 3: Environment Configuration (To do)

1. **Create Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Configure Required Variables**
   ```bash
   # Database
   MONGODB_URI=mongodb://localhost:27017/pujigori

   # JWT (placeholder for your auth)
   JWT_SECRET=your-super-secret-jwt-key-here

   # SSLCommerz (get from SSLCommerz account)
   SSLCOMMERZ_STORE_ID=your-store-id
   SSLCOMMERZ_STORE_PASS=your-store-password
   SSLCOMMERZ_IS_SANDBOX=true

   # AWS S3 (get from AWS console)
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=ap-southeast-1
   AWS_S3_BUCKET=your-bucket-name

   # URLs
   FRONTEND_URL=http://localhost:3000
   ```

### Step 4: External Services Setup

#### MongoDB Setup
1. **Install MongoDB locally** or **use MongoDB Atlas**
   ```bash
      normal mongodb uri connection
   ```

#### AWS S3 Setup
1. **Create S3 Bucket**
   - Go to AWS Console → S3
   - Create new bucket (e.g., `pujigori-uploads`)
   - Enable public read access
   - Configure CORS policy

2. **Create IAM User**
   - Go to AWS Console → IAM
   - Create user with programmatic access
   - Attach S3 policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-bucket-name",
           "arn:aws:s3:::your-bucket-name/*"
         ]
       }
     ]
   }
   ```

#### SSLCommerz Setup
1. **Register with SSLCommerz**
   - Go to https://www.sslcommerz.com/
   - Register for account
   - Get Store ID and Store Password
   - Use sandbox mode for development

2. **Configure Webhook URLs**
   - Success URL: `http://localhost:5000/api/payments/success`
   - Fail URL: `http://localhost:5000/api/payments/fail`
   - Cancel URL: `http://localhost:5000/api/payments/cancel`
   - IPN URL: `http://localhost:5000/api/payments/webhook`

### Step 5: Test Basic Setup

1. **Start the Server**
   ```bash
   npm run dev
   ```

2. **Test Health Check**
   ```bash
   curl http://localhost:5000/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "Service is healthy",
     "data": {
       "status": "healthy",
       "services": {
         "database": { "status": "connected" },
         "storage": { "status": "healthy" }
       }
     }
   }
   ```

3. **Test API Version**
   ```bash
   curl http://localhost:5000/api/version
   ```

### Step 6.1: Next Phase - Controllers

Now you're ready to implement the API endpoints. Here's what to create next:

#### 1. Create Controllers (Priority 1)

**src/controllers/ProjectController.ts**
**src/controllers/DonationController.ts**
**src/controllers/AdminController.ts**
**src/controllers/UploadController.ts**

Check the file and has nice controllers for all crud operations

### Step 6.2: Next Phase -  Routes

**src/routes/projects.ts , admin.ts etc. created all routes**

#### Step 6.3. Updated App.ts to Use Routes

### Step 7: Testing and Validation

initially have the simple-test.js


### -----------------------------------------------------------Break Since creating Frontend--------------------------------------------- ####


### Step 8 : Commit (2.1) 

created controllers , routes for paymentrequest : for witdrawal of project funds by project owners
