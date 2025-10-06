// Check NOWPayments Payment Status
// This function checks the status of a payment with NOWPayments

const NOWPAYMENTS_API_KEY = 'SYD0WXE-30Y47DZ-GKPWE02-9Y5YWWJ';
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

// Main handler function
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Only allow GET and POST requests
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }
    
    try {
        let paymentId;
        
        if (req.method === 'GET') {
            paymentId = req.query.payment_id;
        } else {
            paymentId = req.body.payment_id;
        }
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                error: 'Missing payment_id parameter'
            });
        }
        
        console.log('Checking payment status for:', paymentId);
        
        // Check payment status with NOWPayments
        const statusData = await checkPaymentStatus(paymentId);
        
        if (statusData.success) {
            return res.status(200).json({
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
            return res.status(400).json({
                success: false,
                error: statusData.error || 'Failed to check payment status'
            });
        }
        
    } catch (error) {
        console.error('Payment status check error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
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