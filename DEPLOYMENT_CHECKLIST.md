# 🚀 Libre Deployment Checklist

**Production-ready deployment guide for Libre RideShare DApp**

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

#### Required (Production)
```env
# Server
PORT=5000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/libre
STORAGE_ENGINE=drizzle  # or 'mem' for dev

# Firebase Auth
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Persona Identity Verification
PERSONA_API_KEY=your_persona_api_key
PERSONA_TEMPLATE_ID=your_template_id
PERSONA_WEBHOOK_SECRET=your_webhook_secret

# ZeroDev Account Abstraction
ZERO_DEV_PROJECT_ID=your_zerodev_project_id

# Base Network (Web3)
NEXT_PUBLIC_BASE_CHAIN_ID=84532  # Base Sepolia testnet
NEXT_PUBLIC_ALCHEMY_BASE_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
TREASURY_PRIVATE_KEY=0x...  # Treasury wallet (testnet only!)
USDC_CONTRACT_ADDRESS_TESTNET=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# UploadThing
UPLOADTHING_API_KEY=your_uploadthing_key
UPLOADTHING_SECRET=your_uploadthing_secret

# Email (Resend)
RESEND_API_KEY=re_...

# Analytics
VITE_POSTHOG_PROJECT_ID=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com

# App URL
APP_URL=https://libre.app  # Your production domain
```

#### Optional (Production)
```env
# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Push Notifications (OneSignal)
ONESIGNAL_APP_ID=...
ONESIGNAL_API_KEY=...

# Redis (for production scaling)
REDIS_URL=redis://host:6379
```

---

### 2. Database Setup

#### Production Database (PostgreSQL)
```bash
# 1. Create database
createdb libre_production

# 2. Run migrations
psql $DATABASE_URL -f migrations/001_init.sql

# 3. Verify schema
psql $DATABASE_URL -c "\dt"
```

#### Drizzle ORM (Alternative)
```bash
# Set storage engine
STORAGE_ENGINE=drizzle npm run db:push
```

---

### 3. Build & Test

#### Build Client
```bash
npm run build
# Output: dist/ folder
```

#### Build Server
```bash
npm run build
# Output: dist/index.js
```

#### Test Locally
```bash
# Test production build
npm run start

# Verify endpoints
curl http://localhost:5000/api/admin/stats
```

---

## 🌐 Deployment Options

### Option 1: Vercel (Client) + Render (Server) ⭐ Recommended

#### Client (Vercel)
1. **Connect GitHub repo**
2. **Build settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

3. **Environment variables:**
   - Add all `VITE_*` variables
   - Add `NEXT_PUBLIC_*` variables

4. **Deploy**

#### Server (Render)
1. **Create Web Service**
2. **Settings:**
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Environment: Node 20

3. **Environment variables:**
   - Add all server-side variables
   - **NO** `VITE_*` or `NEXT_PUBLIC_*` variables

4. **Health check:**
   - Path: `/api/admin/stats`

5. **Deploy**

---

### Option 2: Railway (Full Stack)

1. **Create project**
2. **Add services:**
   - Client (Vite)
   - Server (Node.js)
   - PostgreSQL

3. **Configure:**
   - Client: Build from `client/`
   - Server: Build from root
   - Database: Auto-provisioned

4. **Add environment variables**
5. **Deploy**

---

### Option 3: Fly.io (Full Stack)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Add secrets
fly secrets set DATABASE_URL=...
fly secrets set FIREBASE_ADMIN_PRIVATE_KEY=...

# Deploy
fly deploy
```

---

## 🔒 Security Checklist

### ✅ Before Going Live

- [ ] **Environment variables** - All secrets in hosting provider (never in code)
- [ ] **HTTPS only** - Force SSL redirect
- [ ] **CORS** - Configure allowed origins
- [ ] **Rate limiting** - Add to API endpoints
- [ ] **Webhook signatures** - Verify Persona webhooks
- [ ] **Firebase Admin** - Token verification enabled
- [ ] **Database** - Connection string encrypted
- [ ] **Private keys** - Treasury key in secure vault (not in env)
- [ ] **API keys** - Rotate all keys before production

---

## 📊 Monitoring Setup

### 1. Error Tracking
- [ ] **Sentry** or **Rollbar** configured
- [ ] Error boundaries in React
- [ ] Server error logging

### 2. Analytics
- [ ] **PostHog** production project
- [ ] Key events tracked:
  - `aa_signup_success`
  - `rider_ride_requested`
  - `driver_onboarding_complete`
  - `referral_claim`

### 3. Uptime Monitoring
- [ ] **UptimeRobot** or **Pingdom**
- [ ] Monitor: `/api/admin/stats`
- [ ] Alert on downtime

---

## 🧪 Pre-Launch Testing

### Critical Paths
- [ ] **Email signup** → Wallet created
- [ ] **Google/Apple login** → Wallet linked
- [ ] **Ride request** → Matching works
- [ ] **Driver signup** → Profile created
- [ ] **Identity verification** → Persona flow
- [ ] **Referral claim** → USDC payment
- [ ] **WebSocket** → Live stats update

### Browser Testing
- [ ] Chrome (desktop + mobile)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge

### Network Testing
- [ ] Slow 3G connection
- [ ] Offline mode handling
- [ ] WebSocket reconnection

---

## 🚀 Launch Day Checklist

### Morning (Pre-Launch)
- [ ] Final database backup
- [ ] All environment variables verified
- [ ] DNS records configured
- [ ] SSL certificates active
- [ ] Monitoring alerts configured

### Launch
- [ ] Deploy client
- [ ] Deploy server
- [ ] Verify health checks
- [ ] Test critical paths
- [ ] Monitor error logs

### Post-Launch (First 24h)
- [ ] Monitor error rates
- [ ] Check analytics events
- [ ] Verify webhook deliveries
- [ ] Test payment flows
- [ ] User feedback collection

---

## 📱 Mobile App Store (Future)

### iOS App Store
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect setup
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] App screenshots
- [ ] App description
- [ ] Age rating (17+ for rideshare)

### Google Play Store
- [ ] Google Play Developer account ($25 one-time)
- [ ] Privacy policy URL
- [ ] Content rating
- [ ] App screenshots
- [ ] Feature graphic

---

## 🔄 Post-Deployment

### Daily
- [ ] Check error logs
- [ ] Monitor analytics
- [ ] Review user feedback

### Weekly
- [ ] Database backups verified
- [ ] Security updates applied
- [ ] Performance metrics reviewed

### Monthly
- [ ] API key rotation
- [ ] Dependency updates
- [ ] Cost optimization review

---

## 🆘 Rollback Plan

### If Critical Issues

1. **Immediate:**
   ```bash
   # Revert to previous deployment
   # Vercel: Dashboard → Deployments → Rollback
   # Render: Deployments → Rollback
   ```

2. **Database:**
   ```bash
   # Restore from backup
   pg_restore -d libre_production backup.dump
   ```

3. **Environment:**
   - Revert environment variable changes
   - Verify all services running

---

## ✅ Production URLs

After deployment, update:
- [ ] `APP_URL` in environment variables
- [ ] Firebase authorized domains
- [ ] Persona webhook URL
- [ ] UploadThing callback URLs
- [ ] CORS allowed origins

---

## 📝 Post-Launch Tasks

- [ ] **SEO** - Add meta tags, sitemap
- [ ] **Analytics** - Set up conversion funnels
- [ ] **Support** - Set up help desk (Intercom/Zendesk)
- [ ] **Legal** - Terms of service, privacy policy
- [ ] **Marketing** - Launch announcement, social media

---

## 🎯 Success Metrics

Track these KPIs:
- **Signup conversion rate** (Landing → Rider)
- **Verification completion rate**
- **Ride request success rate**
- **Driver onboarding completion**
- **Referral claim rate**
- **Average time to first ride**

---

**Status**: ✅ Ready for production deployment!

**Next**: Choose hosting provider → Deploy → Monitor → Iterate 🚀

