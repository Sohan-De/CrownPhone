# NOWPayments Integration Deployment Guide

## Overview
This guide explains how to deploy the NOWPayments crypto checkout integration for your CrownPhone project.

## Files Created
- `api/create-nowpayments-payment.js` - Creates payment requests with NOWPayments
- `api/nowpayments-webhook.js` - Handles payment status updates
- `api/check-payment-status.js` - Checks payment status
- Updated `scripts/checkout.js` - Frontend integration
- Updated `checkout.html` - UI updates

## API Keys
Your NOWPayments credentials are already configured:
- API Key: `SYD0WXE-30Y47DZ-GKPWE02-9Y5YWWJ`
- Public Key: `3824d638-d192-4283-ad55-e0c4c6f84a06`

## Deployment Options

### Option 1: Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. The API routes will be automatically deployed as serverless functions

### Option 2: Netlify Functions
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Create `netlify.toml`:
```toml
[build]
  functions = "api"
  publish = "."
```

### Option 3: AWS Lambda
1. Use Serverless Framework: `npm i -g serverless`
2. Create `serverless.yml`:
```yaml
service: crownphone-nowpayments
provider:
  name: aws
  runtime: nodejs18.x
functions:
  createPayment:
    handler: api/create-nowpayments-payment.handler
    events:
      - http:
          path: /api/create-nowpayments-payment
          method: post
  webhook:
    handler: api/nowpayments-webhook.handler
    events:
      - http:
          path: /api/nowpayments-webhook
          method: post
  checkStatus:
    handler: api/check-payment-status.handler
    events:
      - http:
          path: /api/check-payment-status
          method: get
```

## Environment Variables
Set these in your deployment platform:
- `NEXT_PUBLIC_BASE_URL` - Your domain (e.g., https://yourdomain.com)

## Webhook Configuration
1. In your NOWPayments dashboard, set the webhook URL to:
   `https://yourdomain.com/api/nowpayments-webhook`
2. The webhook will handle payment status updates automatically

## Testing
1. Deploy your API functions
2. Update the API URLs in `checkout.js` if needed
3. Test with small amounts first
4. Check the webhook logs for payment confirmations

## Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- USDC
- USDT
- Litecoin (LTC)
- Dogecoin (DOGE)
- Cardano (ADA)
- Polkadot (DOT)
- XRP
- Bitcoin Cash (BCH)

## Security Notes
- API keys are kept secure on the server side
- All payment processing happens through NOWPayments
- Webhook verification should be implemented in production
- Use HTTPS for all endpoints

## Troubleshooting
- Check API function logs for errors
- Verify webhook URL is accessible
- Ensure CORS is properly configured
- Test with NOWPayments sandbox first

## Support
- NOWPayments Documentation: https://documenter.getpostman.com/view/7907941/S1a32n38
- NOWPayments Support: https://nowpayments.io/support
