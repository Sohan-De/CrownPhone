// NOWPayments API Integration - Serverless Function
// This function creates a payment request with NOWPayments and returns a payment URL

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

// Main handler function
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }
    
    try {
        const { amount, order_id, crypto_type, customer_email, customer_name } = req.body;
        
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
        
        console.log('Creating NOWPayments payment:', {
            amount: numericAmount,
            order_id,
            crypto_type: crypto_type.toLowerCase(),
            customer_email,
            customer_name
        });
        
        // Create payment request with NOWPayments
        const paymentData = await createNOWPaymentsPayment({
            amount: numericAmount,
            order_id,
            crypto_type: crypto_type.toLowerCase(),
            customer_email: customer_email || 'customer@example.com',
            customer_name: customer_name || 'Customer'
        });
        
        if (paymentData.success) {
            return res.status(200).json({
                success: true,
                payment_id: paymentData.payment_id,
                payment_url: paymentData.payment_url,
                crypto_amount: paymentData.crypto_amount,
                crypto_type: paymentData.crypto_type,
                order_id: paymentData.order_id,
                expires_at: paymentData.expires_at
            });
        } else {
            return res.status(400).json({
                success: false,
                error: paymentData.error || 'Failed to create payment'
            });
        }
        
    } catch (error) {
        console.error('NOWPayments API error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
    }
}

// Create payment with NOWPayments API
async function createNOWPaymentsPayment(paymentData) {
    try {
        const { amount, order_id, crypto_type, customer_email, customer_name } = paymentData;
        
        // Step 1: Get estimated amount in cryptocurrency
        const estimateResponse = await fetch(`${NOWPAYMENTS_BASE_URL}/estimate?amount=${amount}&currency_from=usd&currency_to=${crypto_type}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!estimateResponse.ok) {
            const errorText = await estimateResponse.text();
            throw new Error(`Estimate API error: ${estimateResponse.status} - ${errorText}`);
        }
        
        const estimateData = await estimateResponse.json();
        const cryptoAmount = estimateData.estimated_amount;
        
        console.log('NOWPayments estimate:', {
            usd_amount: amount,
            crypto_type,
            crypto_amount: cryptoAmount
        });
        
        // Step 2: Create payment
        const paymentRequest = {
            price_amount: amount,
            price_currency: 'usd',
            pay_currency: crypto_type,
            ipn_callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/api/nowpayments-webhook`,
            order_id: order_id,
            order_description: `CrownPhone Purchase - ${customer_name}`,
            customer_email: customer_email,
            customer_name: customer_name,
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/checkout.html?status=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'}/checkout.html?status=failed`
        };
        
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
            throw new Error(`Payment API error: ${paymentResponse.status} - ${errorText}`);
        }
        
        const paymentResult = await paymentResponse.json();
        
        console.log('NOWPayments payment created:', paymentResult);
        
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
        console.error('Error creating NOWPayments payment:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Check payment status
export async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`${NOWPAYMENTS_BASE_URL}/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Status check failed: ${response.status}`);
        }
        
        const statusData = await response.json();
        return {
            success: true,
            status: statusData.payment_status,
            payment_id: statusData.payment_id,
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