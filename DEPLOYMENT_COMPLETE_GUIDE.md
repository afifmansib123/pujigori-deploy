# 🚀 PujiGori - Complete Deployment Guide

Full-stack deployment guide for your crowdfunding platform.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         PRODUCTION                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐           ┌───────────────┐             │
│  │   Vercel     │           │   AWS EC2     │             │
│  │  (Frontend)  │◄─────────►│   (Backend)   │             │
│  │   Next.js    │   HTTPS    │   Express     │             │
│  └──────────────┘           └───────┬───────┘             │
│        │                            │                      │
│        │                            ├─► MongoDB Atlas     │
│        │                            │   (Database)        │
│        │                            │                      │
│        │                            ├─► AWS S3            │
│        │                            │   (File Storage)    │
│        │                            │                      │
│        │                            └─► SSLCommerz        │
│        │                                (Payments)         │
│        │                                                   │
│        └─────────────► AWS Cognito                        │
│                       (Authentication)                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment Strategy Summary

| Component | Service | Why | Cost |
|-----------|---------|-----|------|
| **Frontend** | Vercel | Perfect for Next.js, auto HTTPS, CDN | Free |
| **Backend** | AWS EC2 | Complex operations, persistent connections | $0-15/mo |
| **Database** | MongoDB Atlas | Managed MongoDB, automatic backups | Free-$9/mo |
| **Storage** | AWS S3 | Scalable file storage | ~$1/mo |
| **Auth** | AWS Cognito | Already implemented in your code | Free tier |
| **Payments** | SSLCommerz | Bangladesh payment gateway | Per transaction |

**Total Estimated Cost**: $0-25/month

---

## 📋 Prerequisites Checklist

Before starting deployment, ensure you have:

### Accounts
- [ ] GitHub account
- [ ] AWS account (you have this ✅)
- [ ] Vercel account (free)
- [ ] MongoDB Atlas account (free)
- [ ] SSLCommerz merchant account
- [ ] Domain name (optional but recommended)

### Services to Setup
- [ ] AWS S3 bucket created
- [ ] AWS Cognito user pool configured
- [ ] MongoDB Atlas cluster
- [ ] SSLCommerz store credentials

### Local Setup
- [ ] Git configured
- [ ] Node.js 18+ installed
- [ ] All local environment variables working

---

## 🚀 Deployment Order

Follow this order for smooth deployment:

### Phase 1: Setup Cloud Services (30 minutes)
1. ✅ MongoDB Atlas cluster
2. ✅ AWS S3 bucket
3. ✅ AWS Cognito (if not done)
4. ✅ Collect all credentials

### Phase 2: Deploy Backend (45 minutes)
1. ✅ Launch EC2 instance
2. ✅ Install Node.js, PM2
3. ✅ Clone repo and configure
4. ✅ Start application
5. ✅ Test API health

### Phase 3: Deploy Frontend (15 minutes)
1. ✅ Connect Vercel to GitHub
2. ✅ Configure environment variables
3. ✅ Deploy
4. ✅ Test application

### Phase 4: Connect & Test (30 minutes)
1. ✅ Update CORS settings
2. ✅ Test authentication
3. ✅ Test file uploads
4. ✅ Test payment flow

**Total Time**: ~2 hours

---

## 📚 Detailed Guides

### 1. Backend (Express) → AWS EC2
📖 **See**: `server/DEPLOYMENT.md`

**Quick Steps:**
```bash
# On EC2 instance
git clone https://github.com/afifmansib123/pujigori-deploy.git ~/pujigori-backend
cd ~/pujigori-backend/server
cp .env.example .env
nano .env  # Add your credentials
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
```

**Result**: Backend running at `http://YOUR_EC2_IP:5000`

---

### 2. Frontend (Next.js) → Vercel
📖 **See**: `client/DEPLOYMENT.md`

**Quick Steps:**
1. Go to https://vercel.com
2. Import `afifmansib123/pujigori-deploy`
3. Set root directory: `client`
4. Add environment variables
5. Deploy

**Result**: Frontend live at `https://your-app.vercel.app`

---

## 🔐 Environment Variables Reference

### Backend (.env on EC2)
```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pujigori

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=pujigori-uploads
AWS_REGION=ap-southeast-1

# SSLCommerz
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASS=your-password
SSLCOMMERZ_IS_SANDBOX=true
SSLCOMMERZ_SUCCESS_URL=http://YOUR_EC2_IP:5000/api/payments/success
SSLCOMMERZ_FAIL_URL=http://YOUR_EC2_IP:5000/api/payments/fail
SSLCOMMERZ_CANCEL_URL=http://YOUR_EC2_IP:5000/api/payments/cancel
SSLCOMMERZ_IPN_URL=http://YOUR_EC2_IP:5000/api/payments/ipn

# CORS
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Frontend (Vercel Environment Variables)
```env
# API
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:5000/api

# AWS Cognito
NEXT_PUBLIC_AWS_REGION=ap-southeast-1
NEXT_PUBLIC_AWS_USER_POOL_ID=ap-southeast-1_xxxxx
NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=xxxxx
NEXT_PUBLIC_AWS_OAUTH_DOMAIN=your-domain.auth.region.amazoncognito.com

# Optional
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🧪 Testing Your Deployment

### 1. Test Backend Health
```bash
curl http://YOUR_EC2_IP:5000/health
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

### 2. Test Frontend
- Visit `https://your-app.vercel.app`
- Check if pages load
- Open browser console, check for errors

### 3. Test API Connection
- Sign up for an account
- Try creating a project
- Upload an image
- Make a test donation

### 4. Test Payment Flow
- Start a payment
- Check SSLCommerz sandbox
- Verify payment callbacks work

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS (Critical!)

On EC2, update backend `.env`:
```env
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-*.vercel.app
```

Restart:
```bash
pm2 restart pujigori-backend
```

### 2. Configure Payment Webhooks

In SSLCommerz merchant panel:
- Update IPN URL: `http://YOUR_EC2_IP:5000/api/payments/ipn`
- Update success URL: `https://your-app.vercel.app/payment/success`

### 3. Setup MongoDB Backups

In MongoDB Atlas:
- Enable automatic backups
- Set retention period
- Test restore process

### 4. Configure Domain (Optional)

**For Backend:**
- Point subdomain (api.yourdomain.com) to EC2 IP
- Setup SSL with Let's Encrypt (see server/DEPLOYMENT.md)

**For Frontend:**
- Add domain in Vercel dashboard
- Update DNS CNAME records

---

## 📊 Monitoring & Maintenance

### Backend Monitoring

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check PM2 status
pm2 status

# View logs
pm2 logs pujigori-backend

# Monitor resources
pm2 monit

# Check disk space
df -h

# Check memory
free -h
```

### Frontend Monitoring

- Vercel Dashboard → Your Project
- Check "Deployments" for build status
- Check "Analytics" for traffic
- Check "Logs" for errors

### Database Monitoring

- MongoDB Atlas Dashboard
- Check connection count
- Monitor slow queries
- Check disk usage

---

## 🐛 Common Issues & Solutions

### Issue: Frontend can't connect to backend
**Solution:**
1. Check backend is running: `pm2 status`
2. Check CORS allows frontend URL
3. Check EC2 security group allows port 5000
4. Verify `NEXT_PUBLIC_API_URL` is correct

### Issue: MongoDB connection failed
**Solution:**
1. Check MongoDB Atlas network access allows EC2 IP
2. Verify connection string is correct
3. Check database user has proper permissions

### Issue: S3 uploads failing
**Solution:**
1. Verify AWS credentials are correct
2. Check S3 bucket policy allows uploads
3. Check IAM user has S3 permissions
4. Verify `AWS_S3_BUCKET` matches bucket name

### Issue: Payment gateway not working
**Solution:**
1. Verify SSLCommerz is in sandbox mode for testing
2. Check callback URLs are accessible from internet
3. Verify store credentials are correct
4. Check backend logs: `pm2 logs pujigori-backend`

### Issue: Authentication failing
**Solution:**
1. Verify Cognito credentials in frontend
2. Check Cognito user pool is active
3. Verify JWT_SECRET matches in backend
4. Check token expiry settings

---

## 🔄 Updating Your Application

### Update Backend

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Run deployment script
cd ~/pujigori-backend/server
./deploy-ec2.sh
```

Or manually:
```bash
git pull origin main
npm ci
npm run build
pm2 restart pujigori-backend
```

### Update Frontend

Vercel auto-deploys when you push to GitHub:
```bash
# On your local machine
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel automatically builds and deploys! ✨

---

## 💰 Cost Breakdown

### Monthly Costs

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Hobby | $0 | 100GB bandwidth |
| EC2 t2.micro | Free tier | $0 | First 12 months |
| EC2 t3.small | Standard | $15 | After free tier |
| MongoDB Atlas | Free | $0 | 512MB storage |
| MongoDB Atlas | Shared | $9 | 2GB storage |
| AWS S3 | Standard | ~$1 | First 5GB free |
| Data Transfer | Standard | ~$0 | First 100GB free |
| AWS Cognito | Free tier | $0 | 50,000 MAU |

**Year 1 Total**: $0-10/month
**Year 2 Total**: $15-25/month

### Ways to Reduce Costs

1. Use EC2 Reserved Instances (save 40%)
2. Use S3 Intelligent Tiering
3. Enable CloudFront caching
4. Optimize images before upload
5. Use MongoDB compression

---

## 🎯 Production Checklist

Before going live:

### Security
- [ ] All environment variables secure
- [ ] JWT secret is strong (32+ characters)
- [ ] EC2 security group restricts SSH to your IP only
- [ ] MongoDB Atlas network access configured
- [ ] S3 bucket has proper permissions
- [ ] HTTPS enabled (via Nginx + Let's Encrypt)
- [ ] CORS properly configured

### Performance
- [ ] Database indexes created
- [ ] S3 images optimized
- [ ] Next.js build optimized
- [ ] CDN caching configured
- [ ] PM2 cluster mode enabled (if needed)

### Monitoring
- [ ] PM2 monitoring active
- [ ] MongoDB Atlas alerts configured
- [ ] AWS CloudWatch alarms set
- [ ] Vercel analytics enabled
- [ ] Error logging configured

### Backup & Recovery
- [ ] MongoDB automatic backups enabled
- [ ] S3 versioning enabled
- [ ] EC2 snapshot schedule created
- [ ] Disaster recovery plan documented

### Testing
- [ ] All API endpoints work
- [ ] Authentication flow works
- [ ] File uploads work
- [ ] Payment flow works
- [ ] Email notifications work (if any)
- [ ] Mobile responsiveness tested

---

## 📞 Support Resources

### Documentation
- [AWS EC2 Docs](https://docs.aws.amazon.com/ec2/)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)

### Tools
- [AWS Console](https://console.aws.amazon.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [MongoDB Atlas](https://cloud.mongodb.com/)
- [SSLCommerz Merchant Portal](https://merchant.sslcommerz.com/)

---

## 🎉 Success!

If you've followed all steps, you now have:

✅ **Scalable Frontend** on Vercel with automatic HTTPS and global CDN
✅ **Reliable Backend** on EC2 with PM2 process management
✅ **Managed Database** on MongoDB Atlas with automatic backups
✅ **Cloud Storage** on S3 for user uploads
✅ **Secure Authentication** via AWS Cognito
✅ **Payment Processing** via SSLCommerz
✅ **Monitoring** and logging configured
✅ **Cost-effective** infrastructure ($0-25/month)

**Your crowdfunding platform is production-ready! 🚀**

---

## 📈 Next Steps

1. **Setup CI/CD**: Automate deployments with GitHub Actions
2. **Add Monitoring**: Setup error tracking (Sentry)
3. **Performance**: Add CloudFront CDN
4. **Scale**: Configure auto-scaling for EC2
5. **Analytics**: Add Google Analytics
6. **SEO**: Optimize meta tags and sitemap
7. **Email**: Setup email service (AWS SES)
8. **Testing**: Add automated tests

---

**Need help?** Create an issue in your GitHub repo or refer to the detailed guides in:
- `server/DEPLOYMENT.md` - Backend deployment
- `client/DEPLOYMENT.md` - Frontend deployment

Good luck with your crowdfunding platform! 🎊
