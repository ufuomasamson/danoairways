# Paystack Webhook Configuration Guide

## Quick Setup Instructions

### 1. Configure Paystack Dashboard

1. **Login to your Paystack Dashboard**: https://dashboard.paystack.com/
2. **Go to Settings > Webhooks**
3. **Add these webhook URLs:**

#### Live Environment:
- **Webhook URL**: `https://danoairways.vercel.app/api/payment/paystack/webhook`
- **Events to subscribe to**:
  - `charge.success` ✅ (Required)
  - `charge.failed` (Optional but recommended)

#### Test Environment (if testing):
- **Webhook URL**: `https://danoairways.vercel.app/api/payment/paystack/webhook`
- **Events**: Same as live

### 2. Configure Callback URLs

1. **In Paystack Dashboard > Settings > API Keys & Webhooks**
2. **Set Callback URL**: `https://danoairways.vercel.app/payment/callback`

### 3. Environment Variables

Ensure these are set in your Vercel environment:

```env
PAYSTACK_SECRET_KEY=sk_live_your_secret_key_here
PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_public_key_here
```

## How It Works

### Payment Flow:
1. **User initiates payment** → InlinePaymentModal
2. **Payment processed** → Paystack charge API
3. **3D Secure (if required)** → Direct redirect to Paystack
4. **Payment completed** → User redirected to callback URL
5. **Webhook triggered** → Automatic booking status update
6. **User sees success** → Booking confirmed

### Webhook Process:
1. **Paystack sends webhook** → `/api/payment/paystack/webhook`
2. **Signature verified** → Ensures request is from Paystack
3. **Event processed** → `charge.success` updates booking
4. **Database updated** → Booking status set to 'confirmed', paid = true
5. **Payment record created** → For tracking and reconciliation

## Testing the Setup

### 1. Manual Payment Verification
- Visit: `https://danoairways.vercel.app/verify-payment`
- Enter payment reference
- Click "Verify Payment" or "Fix Booking Status"

### 2. Debug Payment Issues
- Visit: `https://danoairways.vercel.app/api/debug-payment?reference=YOUR_REFERENCE`
- Check payment status and booking details

### 3. Test Webhook
You can test the webhook manually by sending a POST request to:
`https://danoairways.vercel.app/api/payment/paystack/webhook`

## Troubleshooting

### If payments succeed but bookings don't update:
1. Check webhook is configured correctly in Paystack dashboard
2. Verify webhook URL is accessible
3. Use manual verification page as backup
4. Check Vercel function logs for webhook errors

### If 3D Secure fails:
1. Ensure callback URL is set in Paystack dashboard
2. Check that redirect URLs are properly configured
3. Verify SSL certificate is valid

### If users get "close page" instead of redirect:
1. Configure callback URL in Paystack dashboard
2. Ensure webhook is processing payments
3. Check that payment references are being stored correctly

## Monitoring

### Check Webhook Delivery:
1. **Paystack Dashboard > Settings > Webhooks**
2. **View webhook delivery logs**
3. **Check for failed deliveries**

### Monitor Payments:
1. **Paystack Dashboard > Transactions**
2. **Filter by status and date**
3. **Cross-reference with booking database**

### Application Logs:
1. **Vercel Dashboard > Functions tab**
2. **Check webhook function logs**
3. **Monitor for errors in payment processing**

## Important Notes

- ✅ **Webhook is the primary method** for updating booking status
- ✅ **Manual verification page** is backup for failed webhooks  
- ✅ **Debug endpoints** available for troubleshooting
- ✅ **All payments use live Paystack keys**
- ✅ **Default currency is USD** (users can change via switcher)
- ✅ **3D Secure redirects directly** to Paystack (bypasses broken internal page)

## Security

- Webhook signatures are verified using Paystack secret key
- Payment references are validated before processing
- Database queries use parameterized statements
- Error handling prevents sensitive data exposure

---

**Status**: Ready for production ✅  
**Next Step**: Configure webhook URL in Paystack dashboard  
**Backup**: Manual verification available at `/verify-payment`
