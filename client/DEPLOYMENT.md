# PujiGori Frontend - Vercel Deployment Guide

Quick guide to deploy your Next.js frontend on Vercel.

---

## 🚀 Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub** (if not already done)

2. **Go to Vercel**
   - Visit https://vercel.com
   - Sign in with GitHub

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select your repository: `afifmansib123/pujigori-deploy`
   - Click "Import"

4. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Add Environment Variables**

   Click "Environment Variables" and add:

   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:5000/api
   # Or if using domain: https://api.yourdomain.com/api

   # AWS Amplify (Authentication)
   NEXT_PUBLIC_AWS_REGION=your-region
   NEXT_PUBLIC_AWS_USER_POOL_ID=your-user-pool-id
   NEXT_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=your-client-id
   NEXT_PUBLIC_AWS_OAUTH_DOMAIN=your-oauth-domain

   # Mapbox (if used)
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

   # Other configs
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

6. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at `https://your-app.vercel.app`

---

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? pujigori-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

---

## 🔧 Configure Custom Domain (Optional)

1. **In Vercel Dashboard**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your domain (e.g., `www.pujigori.com`)

2. **Update DNS Records**
   - Go to your domain registrar
   - Add CNAME record:
     - Name: `www`
     - Value: `cname.vercel-dns.com`
   - Or A record pointing to Vercel IP

3. **Vercel automatically provisions SSL** ✅

---

## 🔄 Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to any other branch or PR

---

## 🌐 Connect Frontend to Backend

### Step 1: Update Backend CORS

On your EC2 server, update `/server/.env`:

```env
# Add your Vercel URL
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-branch.vercel.app
```

Restart backend:
```bash
pm2 restart pujigori-backend
```

### Step 2: Update SSLCommerz URLs

Update payment callback URLs in backend `.env`:

```env
SSLCOMMERZ_SUCCESS_URL=https://your-app.vercel.app/payment/success
SSLCOMMERZ_FAIL_URL=https://your-app.vercel.app/payment/fail
SSLCOMMERZ_CANCEL_URL=https://your-app.vercel.app/payment/cancel
```

### Step 3: Test Connection

Visit your Vercel app and test:
- API calls work
- Authentication works
- Payment flow works

---

## 📊 Monitoring

### Vercel Dashboard

- **Analytics**: View page views, performance
- **Logs**: Real-time function logs
- **Speed Insights**: Core Web Vitals

### Check Deployment Status

```bash
vercel ls
```

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Check build locally first
cd client
npm run build

# Check for TypeScript errors
npm run lint
```

### Environment Variables Not Working

- Ensure variables start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables
- Check "Environment Variables" tab in Vercel

### API Connection Issues

- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend CORS allows your Vercel domain
- Check backend EC2 is running

---

## 💰 Costs

- **Vercel Hobby Plan**: Free
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS
  - Edge Network

- **Vercel Pro**: $20/month (if you need more)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Backend CORS updated with Vercel URL
- [ ] API connection working
- [ ] Authentication working
- [ ] Payment flow tested
- [ ] Custom domain configured (optional)

---

## 🎉 Done!

Your Next.js frontend is now live on Vercel with:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments
- ✅ Serverless functions
- ✅ Edge caching

**Frontend**: https://your-app.vercel.app
**Backend**: http://YOUR_EC2_IP:5000 or https://api.yourdomain.com
