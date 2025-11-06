# 🚀 Quick Start Deployment

**TL;DR** - Get your app deployed in 2 hours!

---

## ⚡ Super Quick Overview

1. **Frontend (Next.js)** → Vercel (Free, 10 minutes)
2. **Backend (Express)** → AWS EC2 ($0-15/mo, 45 minutes)
3. **Database** → MongoDB Atlas (Free, 10 minutes)

**Total Time**: ~2 hours | **Total Cost**: $0-15/month

---

## 📝 Before You Start

Collect these credentials:

```
MongoDB:
[ ] Connection string (from Atlas)
[ ] Database username
[ ] Database password

AWS:
[ ] Access Key ID
[ ] Secret Access Key
[ ] S3 Bucket name
[ ] Cognito Pool ID
[ ] Cognito Client ID

SSLCommerz:
[ ] Store ID
[ ] Store Password

Other:
[ ] JWT Secret (generate: openssl rand -base64 32)
[ ] EC2 Key Pair (.pem file)
```

---

## 🎯 3-Step Deployment

### Step 1: Setup MongoDB (10 min)
```bash
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP: 0.0.0.0/0
5. Get connection string
```

### Step 2: Deploy Backend to EC2 (45 min)
```bash
# Launch EC2 instance (Ubuntu 22.04, t2.micro/t3.small)
# SSH into EC2:
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Run these commands:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git build-essential libvips-dev
sudo npm install -g pm2

git clone https://github.com/afifmansib123/pujigori-deploy.git ~/pujigori-backend
cd ~/pujigori-backend/server

# Create .env file with your credentials
nano .env
# (paste your environment variables - see .env.example)

npm ci
npm run build
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it outputs

# Test it works:
curl http://localhost:5000/health
```

### Step 3: Deploy Frontend to Vercel (10 min)
```bash
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import: afifmansib123/pujigori-deploy
5. Root Directory: client
6. Add Environment Variables:
   - NEXT_PUBLIC_API_BASE_URL=http://YOUR_EC2_IP:5000/api
   - NEXT_PUBLIC_AWS_COGNITO_USER_POOL_ID=your-pool-id
   - NEXT_PUBLIC_AWS_COGNITO_USER_POOL_CLIENT_ID=your-client-id
   - NEXT_PUBLIC_AWS_COGNITO_DOMAIN=https://your-domain.auth.region.amazoncognito.com
   - (see client/.env.example for all required variables)
7. Click Deploy
8. Wait 2-3 minutes
9. Done! Your app is live!
```

---

## 🔗 Connect Frontend & Backend

### Update Backend CORS
```bash
# On EC2:
cd ~/pujigori-backend/server
nano .env

# Add:
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Restart:
pm2 restart pujigori-backend
```

---

## ✅ Quick Test

### Test Backend:
```bash
curl http://YOUR_EC2_IP:5000/health
# Should return: {"success": true, "message": "Service is healthy"}
```

### Test Frontend:
```bash
# Visit: https://your-app.vercel.app
# Open browser console
# Check for API connection
```

---

## 🐛 Quick Fixes

### Backend won't start?
```bash
pm2 logs pujigori-backend --lines 50
# Check error messages
```

### Frontend can't connect to backend?
```bash
# 1. Check EC2 security group allows port 5000
# 2. Check CORS in backend .env
# 3. Verify NEXT_PUBLIC_API_BASE_URL is correct (includes /api)
# 4. Check browser console for API errors
```

### MongoDB connection failed?
```bash
# 1. Check Network Access in MongoDB Atlas
# 2. Verify connection string in .env
# 3. Test: mongo "your-connection-string"
```

---

## 📚 Full Documentation

- **Complete Guide**: `DEPLOYMENT_COMPLETE_GUIDE.md`
- **Backend Details**: `server/DEPLOYMENT.md`
- **Frontend Details**: `client/DEPLOYMENT.md`

---

## 💡 Quick Commands

### Backend (EC2)
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart
pm2 monit              # Monitor CPU/Memory
```

### Update Backend
```bash
cd ~/pujigori-backend/server
git pull
npm ci
npm run build
pm2 restart pujigori-backend
```

### Update Frontend
```bash
# Just push to GitHub - Vercel auto-deploys!
git push origin main
```

---

## 🎯 Production URLs

After deployment:

- **Frontend**: https://your-app.vercel.app
- **Backend**: http://YOUR_EC2_IP:5000
- **API Health**: http://YOUR_EC2_IP:5000/health
- **API Docs**: http://YOUR_EC2_IP:5000/api

---

## 💰 Costs

- Vercel: **Free**
- EC2 t2.micro: **Free** (12 months)
- EC2 t3.small: **~$15/month**
- MongoDB Atlas: **Free** (512MB)
- S3: **~$1/month**

**Total: $0-16/month**

---

## 🆘 Need Help?

1. Check full guides in `/server` and `/client` folders
2. Check environment variables are correct
3. Check logs: `pm2 logs`
4. Check security groups allow required ports
5. Verify all services are running

---

**🎉 That's it! Your app should be live now!**

If you need more details, see `DEPLOYMENT_COMPLETE_GUIDE.md`
