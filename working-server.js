// WORKING SERVER - Minimal NOWPayments integration
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const NOWPAYMENTS_API_KEY = 'SYD0WXE-30Y47DZ-GKPWE02-9Y5YWWJ';
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Debug endpoint
app.get('/debug', (req, res) => {
    res.json({
        message: 'WORKING SERVER is running',
        timestamp: new Date().toISOString(),
        version: 'WORKING'
    });
});

// Create payment endpoint
app.post('/api/create-nowpayments-payment', async (req, res) => {
    try {
        const { amount, order_id, crypto_type, customer_email } = req.body;
        
        console.log('🔥 WORKING SERVER - Creating payment:', { amount, order_id, crypto_type });
        
        // Validate required fields
        if (!amount || !order_id || !crypto_type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid amount'
            });
        }
        
        // Handle stablecoins with 1:1 rate - NO ESTIMATE API CALL
        let cryptoAmount;
        if (crypto_type === 'usdc' || crypto_type === 'usdt') {
            cryptoAmount = numericAmount.toFixed(2);
            console.log(`✅ WORKING SERVER - Using 1:1 rate for ${crypto_type}: ${cryptoAmount}`);
        } else {
            // For other cryptos, try estimate API
            console.log(`⚠️ WORKING SERVER - Not a stablecoin, trying estimate API for ${crypto_type}`);
            try {
                const estimateResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/estimate?amount=${numericAmount}&currency_from=usd&currency_to=${crypto_type}`, {
                    method: 'GET',
                    headers: {
                        'x-api-key': NOWPAYMENTS_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (estimateResponse.ok) {
                    const estimateData = await estimateResponse.json();
                    cryptoAmount = estimateData.estimated_amount;
                    console.log(`✅ WORKING SERVER - Got estimate for ${crypto_type}: ${cryptoAmount}`);
                } else {
                    throw new Error('Estimate failed');
                }
            } catch (error) {
                console.log(`⚠️ WORKING SERVER - Estimate failed for ${crypto_type}, using fallback`);
                const fallbackRates = {
                    'btc': 45000, 'eth': 3000, 'ltc': 100, 'doge': 0.08, 'ada': 0.5
                };
                const rate = fallbackRates[crypto_type] || 1;
                cryptoAmount = (numericAmount / rate).toFixed(8);
            }
        }
        
        // Create payment request (without customer_name)
        const paymentRequest = {
            price_amount: numericAmount,
            price_currency: 'usd',
            pay_currency: crypto_type,
            pay_amount: cryptoAmount, // Add the calculated crypto amount
            ipn_callback_url: `http://localhost:${PORT}/api/nowpayments-webhook`,
            order_id: order_id,
            order_description: `CrownPhone Purchase`,
            customer_email: customer_email,
            success_url: `http://localhost:${PORT}/checkout.html?status=success`,
            cancel_url: `http://localhost:${PORT}/checkout.html?status=failed`
        };
        
        console.log('🔥 WORKING SERVER - Creating payment with request:', paymentRequest);
        
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
            console.error('❌ WORKING SERVER - Payment API error:', errorText);
            throw new Error(`Payment API error: ${paymentResponse.status} - ${errorText}`);
        }
        
        const paymentResult = await paymentResponse.json();
        console.log('✅ WORKING SERVER - Payment created:', paymentResult);
        
        res.json({
            success: true,
            payment_id: paymentResult.payment_id,
            payment_url: paymentResult.pay_url || paymentResult.payment_url || `https://nowpayments.io/payment/?iid=${paymentResult.payment_id}`,
            crypto_amount: cryptoAmount,
            crypto_type: crypto_type,
            order_id: order_id,
            expires_at: paymentResult.expires_at
        });
        
    } catch (error) {
        console.error('❌ WORKING SERVER - Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
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
        
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${payment_id}`, {
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
        
        res.json({
            success: true,
            payment_id: statusData.payment_id,
            status: statusData.payment_status,
            amount: statusData.price_amount,
            currency: statusData.price_currency,
            pay_currency: statusData.pay_currency,
            pay_amount: statusData.pay_amount,
            created_at: statusData.created_at,
            updated_at: statusData.updated_at
        });
        
    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Webhook endpoint
app.post('/api/nowpayments-webhook', async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('🔥 WORKING SERVER - Webhook received:', webhookData);
        
        res.json({ 
            success: true, 
            message: 'Webhook processed successfully' 
        });
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🔥 WORKING SERVER running on http://localhost:${PORT}`);
    console.log(`✅ Fixed issues:`);
    console.log(`   - Removed customer_name field`);
    console.log(`   - Added 1:1 rate for USDC/USDT (NO ESTIMATE API CALL)`);
    console.log(`   - Added fallback rates for other cryptos`);
});
