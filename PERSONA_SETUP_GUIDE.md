# 🪪 Persona Identity Verification Setup Guide

Follow these steps to enable ID verification (ID scan + selfie + liveness).

---

## ✅ Step 1: Create Persona Account

1. Go to: https://withpersona.com
2. Click **"Sign up"** or **"Get started"**
3. Create account (email + password)
4. Verify your email

✅ **Done when you can log into Persona dashboard**

---

## ✅ Step 2: Create Workspace

1. In Persona dashboard, create a new workspace
2. Workspace name: `libre-dev` (or `libre-prod`)
3. Select **"Sandbox"** mode (for testing)

⚠️ **Sandbox mode**:
- Free testing
- No real verifications
- Perfect for development

✅ **Workspace created**

---

## ✅ Step 3: Create Verification Template

1. In Persona dashboard, go to **"Inquiries"** → **"Templates"**
2. Click **"Create template"**
3. Template name: `libre-identity-verification`
4. **Add verification steps**:
   - ✅ **Government ID** (Driver's license, passport, state ID)
   - ✅ **Selfie photo** (Face match)
   - ✅ **Liveness check** (Anti-spoof video)
   - ✅ **Name matching** (ID name vs. account name)

5. Click **"Save template"**
6. **Copy the Template ID** (starts with `itmpl_`)

✅ **Template ID copied**

---

## ✅ Step 4: Get API Key

1. In Persona dashboard, go to **"Settings"** → **"API Keys"**
2. Click **"Create API key"**
3. Key name: `libre-server-key`
4. **Copy the API key** (starts with `per_test_` for sandbox)

⚠️ **Keep this secret!** Don't commit to git.

✅ **API key copied**

---

## ✅ Step 5: Set Up Webhook (For Production)

1. In Persona dashboard, go to **"Settings"** → **"Webhooks"**
2. Click **"Add webhook"**
3. Webhook URL: `https://your-api.com/webhooks/persona`
   - For local testing: Use ngrok or similar
   - For production: Your actual API URL
4. **Events to subscribe**:
   - ✅ `inquiry.completed`
   - ✅ `inquiry.status-changed`

5. **Copy the webhook secret** (for signature verification)

✅ **Webhook configured**

---

## ✅ Step 6: Add Environment Variables

Add to your `.env` file:

```env
# Persona Identity Verification
PERSONA_API_KEY=per_test_xxx
PERSONA_TEMPLATE_ID=itmpl_xxx
PERSONA_WEBHOOK_SECRET=your_webhook_secret_here
PERSONA_ENV=sandbox
```

⚠️ **For production**, change:
- `PERSONA_ENV=production`
- Use production API key (starts with `per_live_`)

✅ **Restart server after adding these**

---

## ✅ Step 7: Test Verification Flow

1. **Start verification**:
   - Go to `/verify` page
   - Click **"Start Verification"**
   - Should redirect to Persona

2. **Complete verification** (in sandbox):
   - Upload test ID (use Persona's test images)
   - Take selfie
   - Complete liveness check

3. **Check webhook**:
   - Persona sends webhook to your server
   - Server updates `user.identityVerified = true`
   - User can now request rides/drive

✅ **If webhook updates user → Persona is working!**

---

## 🐛 Troubleshooting

### Error: "PERSONA_API_KEY not configured"
- ✅ Check `.env` file has `PERSONA_API_KEY`
- ✅ Restart server after adding env vars
- ✅ Verify API key starts with `per_test_` (sandbox) or `per_live_` (prod)

### Error: "Template not found"
- ✅ Check `PERSONA_TEMPLATE_ID` matches your template
- ✅ Verify template is active in Persona dashboard

### Webhook not receiving events
- ✅ Check webhook URL is accessible (use ngrok for local)
- ✅ Verify webhook secret matches
- ✅ Check server logs for webhook requests

### Verification always fails
- ✅ In sandbox, use Persona's test images
- ✅ Check template configuration in Persona dashboard
- ✅ Verify all required steps are enabled

---

## ✅ Sandbox vs Production

### Sandbox (Development)
- ✅ Free testing
- ✅ Test images provided
- ✅ No real verifications
- ✅ API keys start with `per_test_`
- ✅ Base URL: `https://sandbox.withpersona.com/api/v1`

### Production
- ✅ Real verifications
- ✅ Paid (per verification)
- ✅ API keys start with `per_live_`
- ✅ Base URL: `https://withpersona.com/api/v1`
- ✅ Requires webhook URL to be publicly accessible

---

## ✅ Next Steps

Once Persona works:
1. ✅ Test verification flow end-to-end
2. ✅ Add verification gates to protected routes
3. ✅ Test webhook updates user status
4. ✅ Switch to production when ready

---

**Status**: Ready for Persona setup! Follow steps 1-7 above. 🚀

