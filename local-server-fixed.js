// Local development server for NOWPayments API testing - FIXED VERSION
// Run with: node local-server-fixed.js

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// NOWPayments API configuration
const NOWPAYMENTS_API_KEY = 'SYD0WXE-30Y47DZ-GKPWE02-9Y5YWWJ';
const NOWPAYMENTS_PUBLIC_KEY = '3824d638-d192-4283-ad55-e0c4c6f84a06';
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Supported cryptocurrencies
const SUPPORTED_CRYPTOS = {
    'btc': 'btc',
    'eth': 'eth', 
    'usdc': 'usdc',
    'usdt': 'usdt',
    'ltc': 'ltc',
    'doge': 'doge',
    'ada': 'ada',
    'dot': 'dot',
    'xrp': 'xrp',
    'bch': 'bch'
};

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        message: 'Fixed server is running',
        timestamp: new Date().toISOString(),
        version: 'fixed'
    });
});

// Create payment endpoint
app.post('/api/create-nowpayments-payment', async (req, res) => {
    try {
        const { amount, order_id, crypto_type, customer_email, customer_name } = req.body;
        
        console.log('Creating NOWPayments payment:', {
            amount, order_id, crypto_type, customer_email, customer_name
        });
        
        // Validate required fields
        if (!amount || !order_id || !crypto_type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, order_id, crypto_type'
            });
        }
        
        // Validate crypto type
        if (!SUPPORTED_CRYPTOS[crypto_type.toLowerCase()]) {
            return res.status(400).json({
                success: false,
                error: `Unsupported cryptocurrency: ${crypto_type}. Supported: ${Object.keys(SUPPORTED_CRYPTOS).join(', ')}`
            });
        }
        
        // Validate amount
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount. Must be a positive number.'
            });
        }
        
        // Create payment with NOWPayments
        const paymentData = await createNOWPaymentsPayment({
            amount: numericAmount,
            order_id,
            crypto_type: crypto_type.toLowerCase(),
            customer_email: customer_email || 'customer@example.com',
            customer_name: customer_name || 'Customer'
        });
        
        if (paymentData.success) {
            res.json({
                success: true,
                payment_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                crypto_amount: paymentData.crypto_amount,
                crypto_type: paymentData.crypto_type,
                order_id: paymentData.order_id,
                expires_at: paymentData.expires_at
            });
        } else {
            res.status(400).json({
                success: false,
                error: paymentData.error || 'Failed to create payment'
            });
        }
        
    } catch (error) {
        console.error('NOWPayments API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Check payment status endpoint
app.get('/api/check-payment-status', async (req, res) => {
    try {
        const { payment_id } = req.query;
        
        if (!payment_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing payment_id parameter'
            });
        }
        
        console.log('Checking payment status for:', payment_id);
        
        const statusData = await checkPaymentStatus(payment_id);
        
        if (statusData.success) {
            res.json({
                success: true,
                payment_id: statusData.payment_id,
                status: statusData.status,
                amount: statusData.amount,
                currency: statusData.currency,
                pay_currency: statusData.pay_currency,
                pay_amount: statusData.pay_amount,
                created_at: statusData.created_at,
                updated_at: statusData.updated_at
            });
        } else {
            res.status(400).json({
                success: false,
                error: statusData.error || 'Failed to check payment status'
            });
        }
        
    } catch (error) {
        console.error('Payment status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Webhook endpoint
app.post('/api/nowpayments-webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('NOWPayments webhook received:', webhookData);
        
        // Process webhook data
        const result = await processWebhook(webhookData);
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Webhook processed successfully' 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
});

// Create payment with NOWPayments API - FIXED VERSION
async function createNOWPaymentsPayment(paymentData) {
    try {
        const { amount, order_id, crypto_type, customer_email, customer_name } = paymentData;
        
        // Step 1: Get estimated amount in cryptocurrency
        let cryptoAmount;
        
        // For stablecoins like USDC/USDT, use 1:1 rate and skip estimate API completely
        console.log(`🔍 Checking crypto_type: ${crypto_type}`);
        if (crypto_type === 'usdc' || crypto_type === 'usdt') {
            cryptoAmount = amount.toFixed(2);
            console.log(`✅ Using 1:1 rate for stablecoin ${crypto_type}: ${cryptoAmount}`);
        } else {
            console.log(`⚠️ Not a stablecoin, trying estimate API for ${crypto_type}`);
            // For other cryptocurrencies, try to get real-time estimate
            try {
                const estimateResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/estimate?amount=${amount}&currency_from=usd&currency_to=${crypto_type}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': NOWPAYMENTS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (estimateResponse.ok) {
                    const estimateData = await estimateResponse.json();
                    cryptoAmount = estimateData.estimated_amount;
                    console.log(`✅ Got real-time estimate for ${crypto_type}: ${cryptoAmount}`);
                } else {
                    // If direct estimate fails, use fallback rates
                    console.log(`⚠️ Direct estimate failed for ${crypto_type}, using fallback calculation...`);
                    throw new Error('Direct estimate not available');
                }
            } catch (error) {
                console.log(`⚠️ Estimate API failed for ${crypto_type}, using fallback calculation...`);
                
                // Fallback: Use approximate exchange rates for common cryptos
                const fallbackRates = {
                    'btc': 45000,
                    'eth': 3000,
                    'ltc': 100,
                    'doge': 0.08,
                    'ada': 0.5,
                    'dot': 6,
                    'xrp': 0.6,
                    'bch': 300
                };
                
                const rate = fallbackRates[crypto_type] || 1;
                cryptoAmount = (amount / rate).toFixed(8);
                console.log(`✅ Using fallback rate for ${crypto_type}: $${rate}, calculated amount: ${cryptoAmount}`);
            }
        }
        
        console.log('NOWPayments estimate:', {
            usd_amount: amount,
            crypto_type,
            crypto_amount: cryptoAmount
        });
        
        // Step 2: Create payment (without customer_name field)
        const paymentRequest = {
            price_amount: amount,
            price_currency: 'usd',
            pay_currency: crypto_type,
            ipn_callback_url: `http://localhost:${PORT}/api/nowpayments-webhook`,
            order_id: order_id,
            order_description: `CrownPhone Purchase - ${customer_name}`,
            customer_email: customer_email,
            success_url: `http://localhost:${PORT}/checkout.html?status=success`,
            cancel_url: `http://localhost:${PORT}/checkout.html?status=failed`
        };
        
        console.log('Creating payment with request:', paymentRequest);
        
        const paymentResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/payment`, {
            method: 'POST',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentRequest)
        });
        
        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('Payment API error response:', errorText);
            throw new Error(`Payment API error: ${paymentResponse.status} - ${errorText}`);
        }
        
        const paymentResult = await paymentResponse.json();
        
        console.log('✅ NOWPayments payment created successfully:', paymentResult);
        
        return {
            success: true,
            payment_id: paymentResult.payment_id,
            payment_url: paymentResult.pay_url,
            crypto_amount: cryptoAmount,
            crypto_type: crypto_type,
            order_id: order_id,
            expires_at: paymentResult.expires_at
        };
        
    } catch (error) {
        console.error('❌ Error creating NOWPayments payment:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Check payment status with NOWPayments API
async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Status check failed: ${response.status} - ${errorText}`);
        }
        
        const statusData = await response.json();
        
        console.log('Payment status retrieved:', statusData);
        
        return {
            success: true,
            payment_id: statusData.payment_id,
            status: statusData.payment_status,
            amount: statusData.price_amount,
            currency: statusData.price_currency,
            pay_currency: statusData.pay_currency,
            pay_amount: statusData.pay_amount,
            created_at: statusData.created_at,
            updated_at: statusData.updated_at
        };
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Process webhook data
async function processWebhook(webhookData) {
    try {
        const { 
            payment_id, 
            payment_status, 
            order_id, 
            price_amount, 
            price_currency, 
            pay_currency, 
            pay_amount,
            customer_email,
            customer_name
        } = webhookData;
        
        console.log('Processing webhook for payment:', {
            payment_id,
            payment_status,
            order_id,
            price_amount,
            price_currency,
            pay_currency,
            pay_amount
        });
        
        // Handle different payment statuses
        switch (payment_status) {
            case 'finished':
                console.log('✅ Payment completed successfully:', {
                    payment_id,
                    order_id,
                    amount: `${price_amount} ${price_currency}`,
                    crypto_amount: `${pay_amount} ${pay_currency}`,
                    customer: customer_email
                });
                break;
                
            case 'failed':
            case 'refunded':
                console.log('❌ Payment failed:', {
                    payment_id,
                    order_id,
                    status: payment_status
                });
                break;
                
            case 'partially_paid':
                console.log('⚠️ Partial payment received:', {
                    payment_id,
                    order_id,
                    expected: price_amount,
                    received: pay_amount
                });
                break;
                
            case 'expired':
                console.log('⏰ Payment expired:', {
                    payment_id,
                    order_id
                });
                break;
                
            default:
                console.log('Unhandled payment status:', payment_status);
                break;
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        return { 
            success: false, 
            error: error.message 
        };
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 FIXED Local server running on http://localhost:${PORT}`);
    console.log(`📱 Test your NOWPayments integration at http://localhost:${PORT}/test-nowpayments.html`);
    console.log(`🛒 Checkout page at http://localhost:${PORT}/checkout.html`);
    console.log(`🔑 API endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/create-nowpayments-payment`);
    console.log(`   GET  http://localhost:${PORT}/api/check-payment-status`);
    console.log(`   POST http://localhost:${PORT}/api/nowpayments-webhook`);
    console.log(`✅ Fixed issues:`);
    console.log(`   - Removed customer_name field (not allowed by NOWPayments)`);
    console.log(`   - Added 1:1 rate for USDC/USDT (no estimate API needed)`);
    console.log(`   - Added fallback rates for other cryptocurrencies`);
});
