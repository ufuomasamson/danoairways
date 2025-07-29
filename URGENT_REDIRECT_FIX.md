# 🚨 URGENT: Fix Paystack Redirect Issue

## Problem
✅ **Payment Status**: Working - booking status updates to paid/approved  
❌ **User Redirect**: Users see "close page" instead of success redirect

## Root Cause
Paystack dashboard callback URL not configured properly.

---

## 🎯 IMMEDIATE FIX REQUIRED

### Step 1: Configure Paystack Dashboard Callback URL

1. **Login to Paystack Dashboard**: https://dashboard.paystack.com/
2. **Navigate to**: Settings → API Keys & Webhooks
3. **Find**: "Callback URL" section
4. **Set Live Callback URL** to:
   ```
   https://danoairways.vercel.app/payment/callback
   ```

### Step 2: Configure Webhooks (For Backup)

1. **In same Settings page**: Find "Webhooks" section
2. **Add Webhook URL**:
   ```
   https://danoairways.vercel.app/api/payment/paystack/webhook
   ```
3. **Select Events**: `charge.success` ✅

### Step 3: Test the Flow

1. **Make a test payment**
2. **Complete 3D Secure authentication**
3. **Verify redirect** goes to your callback page (not "close page")

---

## 🔧 Technical Details

### What We Fixed in Code:
- ✅ Enhanced callback URL with unique reference
- ✅ Added custom fields for better tracking
- ✅ Improved metadata structure

### What You Need to Configure:
- 🔧 **Paystack Dashboard Callback URL** (Most Important)
- 🔧 **Webhook URL** (For reliability)

---

## 🎯 Expected Flow After Fix:

1. **User completes payment** → Paystack processes
2. **3D Secure completed** → Paystack redirects to YOUR callback URL
3. **Callback page loads** → Shows payment verification
4. **Webhook triggers** → Updates booking status (backup)
5. **User sees success** → Redirected to booking confirmation

---

## 🚨 If Still Not Working:

### Check Paystack Dashboard:
1. **Settings → API Keys & Webhooks**
2. **Verify Callback URL** is set correctly
3. **Check webhook delivery logs**

### Manual Override:
- Visit: `https://danoairways.vercel.app/verify-payment`
- Enter payment reference
- Click "Verify Payment"

---

## 📱 Quick Test:

After configuring Paystack dashboard:
1. Make a small test payment
2. Complete 3D Secure
3. Should redirect to: `https://danoairways.vercel.app/payment/callback?reference=...`
4. Should NOT see "close page"

---

**Status**: Code Fixed ✅ | Dashboard Config Needed 🔧  
**Priority**: HIGH - Users can't see payment success  
**ETA**: 5 minutes to configure dashboard
