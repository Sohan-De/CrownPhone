# 🚀 NOWPayments Quick Start Guide

## The Problem
You're getting a 405 Method Not Allowed error because the API endpoints aren't running locally. The serverless functions I created need to be deployed to work, but for local testing, we need a local server.

## ✅ Solution: Local Development Server

I've created a local Express server that will handle the NOWPayments API calls for testing.

### Step 1: Install Dependencies
Run this in your project directory:
```bash
npm install
```

Or double-click `setup-nowpayments.bat` on Windows.

### Step 2: Start the Local Server
```bash
npm start
```

This will start a server on `http://localhost:3001`

### Step 3: Test the Integration
1. Open `http://localhost:3001/checkout.html` in your browser
2. Or test the API directly at `http://localhost:3001/test-nowpayments.html`

## 🔧 What I Fixed

1. **Created `local-server.js`** - A local Express server that handles NOWPayments API calls
2. **Updated `checkout.js`** - Changed API URLs to point to localhost:3001
3. **Created `package.json`** - Dependencies for the local server
4. **Created `setup-nowpayments.bat`** - Easy setup script for Windows

## 🧪 Testing

The local server includes:
- ✅ Payment creation endpoint
- ✅ Payment status checking
- ✅ Webhook handling
- ✅ Error handling
- ✅ CORS support

## 📱 How to Use

1. Start the server: `npm start`
2. Go to `http://localhost:3001/checkout.html`
3. Select a cryptocurrency
4. Fill in your details
5. Click "Pay with Crypto"
6. You'll be redirected to NOWPayments payment page

## 🚀 For Production

When you're ready to go live:
1. Deploy the API functions to Vercel, Netlify, or AWS Lambda
2. Update the API URLs in `checkout.js` to your production domain
3. Configure webhooks in NOWPayments dashboard

## 🐛 Troubleshooting

If you still get errors:
1. Make sure the local server is running (`npm start`)
2. Check the console for any error messages
3. Verify your NOWPayments API key is correct
4. Test with the test page first: `http://localhost:3001/test-nowpayments.html`

## 📞 Support

The local server logs all API calls and responses, so you can see exactly what's happening in the terminal where you ran `npm start`.
