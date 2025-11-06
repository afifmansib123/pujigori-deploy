# PujiGori Backend - AWS EC2 Deployment Guide

Complete step-by-step guide to deploy your Express backend on AWS EC2.

---

## 📋 Prerequisites

- AWS Account (already setup ✅)
- MongoDB Atlas account (or MongoDB instance)
- AWS S3 bucket configured
- SSLCommerz merchant account
- Domain name (optional but recommended)

---

## 🚀 Part 1: Setup MongoDB Atlas (If not already done)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier

2. **Create a Cluster**
   - Choose AWS as provider
   - Select region closest to your EC2 (e.g., Singapore)
   - Create cluster (takes 5-10 minutes)

3. **Setup Database Access**
   - Go to "Database Access"
   - Create a new user with password
   - Save username and password securely

4. **Setup Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (allow from anywhere) - for development
   - For production: Add specific EC2 IP later

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

---

## 🖥️ Part 2: Launch AWS EC2 Instance

### Step 1: Create EC2 Instance

1. **Login to AWS Console**
   - Go to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   - **Name**: `pujigori-backend-server`
   - **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type**: `t3.small` or `t2.micro` (free tier)
   - **Key Pair**: Create new or use existing (SAVE THE .pem FILE!)

3. **Network Settings**
   - Create security group named `pujigori-backend-sg`
   - Add rules:
     * SSH (22) - Your IP only
     * Custom TCP (5000) - Anywhere (0.0.0.0/0)
     * HTTPS (443) - Anywhere (if using domain)
     * HTTP (80) - Anywhere (if using domain)

4. **Storage**
   - 20 GB gp3 (free tier allows 30GB)

5. **Launch Instance**
   - Wait for instance to start
   - Note down the **Public IP address**

### Step 2: Connect to EC2 Instance

```bash
# Change permissions of your key file
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## ⚙️ Part 3: Setup EC2 Environment

Run these commands on your EC2 instance:

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 18+

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs (it will be specific to your system)
```

### Step 4: Install Git

```bash
sudo apt install -y git
```

### Step 5: Install Build Tools (for Sharp library)

```bash
sudo apt install -y build-essential libvips-dev
```

---

## 📦 Part 4: Deploy Your Application

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/afifmansib123/pujigori-deploy.git pujigori-backend
cd pujigori-backend/server
```

### Step 2: Setup Environment Variables

```bash
# Create .env file
nano .env
```

Paste your environment variables (use your actual values):

```env
NODE_ENV=production
PORT=5000

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pujigori?retryWrites=true&w=majority

# Generate a strong JWT secret
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Your AWS credentials (from AWS IAM)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-southeast-1

# SSLCommerz credentials
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASS=your-store-password
SSLCOMMERZ_IS_SANDBOX=true

# Update these URLs with your EC2 public IP
SSLCOMMERZ_SUCCESS_URL=http://YOUR_EC2_IP:5000/api/payments/success
SSLCOMMERZ_FAIL_URL=http://YOUR_EC2_IP:5000/api/payments/fail
SSLCOMMERZ_CANCEL_URL=http://YOUR_EC2_IP:5000/api/payments/cancel
SSLCOMMERZ_IPN_URL=http://YOUR_EC2_IP:5000/api/payments/ipn

# Your Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Install Dependencies and Build

```bash
# Install dependencies
npm ci

# Build TypeScript
npm run build

# Verify build was successful
ls -la dist/
```

### Step 4: Start Application with PM2

```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs pujigori-backend
```

### Step 5: Test Your API

```bash
# On EC2
curl http://localhost:5000/health

# From your local machine
curl http://YOUR_EC2_IP:5000/health
```

You should see a healthy response!

---

## 🔧 Part 5: Optional - Setup Nginx Reverse Proxy

This is recommended for production (adds HTTPS, better performance):

### Step 1: Install Nginx

```bash
sudo apt install -y nginx
```

### Step 2: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/pujigori-backend
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP;  # Or your domain name

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
```

### Step 3: Enable and Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/pujigori-backend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

Now your API is accessible at: `http://YOUR_EC2_IP/` (no port needed)

---

## 🔐 Part 6: Optional - Add SSL Certificate (HTTPS)

If you have a domain name:

### Step 1: Point Domain to EC2

- Go to your domain registrar
- Add an A record pointing to your EC2 public IP

### Step 2: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 3: Get SSL Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow prompts, certificate auto-renews!

---

## 📊 Part 7: Monitoring & Maintenance

### Useful PM2 Commands

```bash
# View logs
pm2 logs pujigori-backend

# Monitor CPU/Memory
pm2 monit

# Restart app
pm2 restart pujigori-backend

# Stop app
pm2 stop pujigori-backend

# View detailed info
pm2 describe pujigori-backend
```

### Check Application Health

```bash
# Health endpoint
curl http://localhost:5000/health

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Monitoring

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

---

## 🔄 Part 8: Update/Redeploy Your Application

### Option 1: Manual Update

```bash
cd ~/pujigori-backend/server
git pull origin main
npm ci
npm run build
pm2 restart pujigori-backend
```

### Option 2: Use Deployment Script

```bash
# Make script executable
chmod +x deploy-ec2.sh

# Run deployment
./deploy-ec2.sh
```

---

## 🌐 Part 9: Connect Frontend to Backend

Update your Next.js frontend `.env.local`:

```env
# If using domain
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# If using EC2 IP directly
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:5000/api
```

Update CORS in backend `.env`:

```env
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
```

Restart backend:
```bash
pm2 restart pujigori-backend
```

---

## 🐛 Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs pujigori-backend --lines 100

# Check if port is in use
sudo lsof -i :5000

# Verify environment variables
cat .env
```

### MongoDB connection issues

```bash
# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"

# Check if IP is whitelisted in MongoDB Atlas Network Access
```

### S3 upload issues

```bash
# Verify AWS credentials
aws configure list

# Test S3 access
aws s3 ls s3://your-bucket-name
```

### Can't access API from internet

```bash
# Check security group allows port 5000
# Check if application is running
pm2 status

# Check if Nginx is running (if using)
sudo systemctl status nginx

# Test local connection
curl http://localhost:5000/health
```

---

## 💰 Estimated Costs

- **EC2 t3.small**: ~$15/month (or free tier t2.micro)
- **MongoDB Atlas**: Free (512MB) or $9/month (2GB)
- **S3 Storage**: ~$0.023/GB/month
- **Data Transfer**: First 100GB/month free

**Total**: $0-25/month depending on usage

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] EC2 instance launched and security group configured
- [ ] Node.js, PM2, and build tools installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured in `.env`
- [ ] Application built successfully (`npm run build`)
- [ ] PM2 running and saved (`pm2 save`)
- [ ] API health check returns success
- [ ] (Optional) Nginx reverse proxy configured
- [ ] (Optional) SSL certificate installed
- [ ] Frontend connected and CORS configured
- [ ] Payment webhooks tested with SSLCommerz

---

## 📚 Next Steps

1. Setup automated backups for MongoDB
2. Configure CloudWatch monitoring
3. Setup CI/CD with GitHub Actions
4. Enable AWS CloudFront CDN for better performance
5. Setup log aggregation (e.g., CloudWatch Logs)
6. Configure auto-scaling (if needed)

---

## 🆘 Need Help?

- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- AWS EC2 Guide: https://docs.aws.amazon.com/ec2/
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Nginx Documentation: https://nginx.org/en/docs/

---

**🎉 Your backend is now production-ready on AWS EC2!**
