// NOWPayments Webhook Handler
// This function handles payment status updates from NOWPayments

const NOWPAYMENTS_API_KEY = 'SYD0WXE-30Y47DZ-GKPWE02-9Y5YWWJ';

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
        const webhookData = req.body;
        
        console.log('NOWPayments webhook received:', webhookData);
        
        // Verify webhook signature (if NOWPayments provides one)
        // Note: NOWPayments may not provide signature verification
        // In production, you should implement proper verification
        
        // Process the webhook data
        const result = await processWebhook(webhookData);
        
        if (result.success) {
            return res.status(200).json({ 
                success: true, 
                message: 'Webhook processed successfully' 
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: result.error 
            });
        }
        
    } catch (error) {
        console.error('Webhook processing error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error: ' + error.message
        });
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
                await handleSuccessfulPayment({
                    payment_id,
                    order_id,
                    price_amount,
                    price_currency,
                    pay_currency,
                    pay_amount,
                    customer_email,
                    customer_name
                });
                break;
                
            case 'failed':
            case 'refunded':
                await handleFailedPayment({
                    payment_id,
                    order_id,
                    payment_status
                });
                break;
                
            case 'partially_paid':
                await handlePartialPayment({
                    payment_id,
                    order_id,
                    price_amount,
                    pay_amount
                });
                break;
                
            case 'expired':
                await handleExpiredPayment({
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

// Handle successful payment
async function handleSuccessfulPayment(paymentData) {
    try {
        const { 
            payment_id, 
            order_id, 
            price_amount, 
            price_currency, 
            pay_currency, 
            pay_amount,
            customer_email,
            customer_name
        } = paymentData;
        
        console.log('Payment successful:', paymentData);
        
        // Here you would typically:
        // 1. Update your database with the successful payment
        // 2. Send confirmation email to customer
        // 3. Generate and deliver license keys
        // 4. Update order status
        
        // For now, we'll just log the success
        console.log('✅ Payment completed successfully:', {
            payment_id,
            order_id,
            amount: `${price_amount} ${price_currency}`,
            crypto_amount: `${pay_amount} ${pay_currency}`,
            customer: customer_email
        });
        
        // You can add database updates here
        // await updateOrderStatus(order_id, 'completed');
        // await sendConfirmationEmail(customer_email, order_id);
        // await generateLicenseKeys(order_id);
        
    } catch (error) {
        console.error('Error handling successful payment:', error);
        throw error;
    }
}

// Handle failed payment
async function handleFailedPayment(paymentData) {
    try {
        const { payment_id, order_id, payment_status } = paymentData;
        
        console.log('Payment failed:', paymentData);
        
        // Update order status to failed
        console.log('❌ Payment failed:', {
            payment_id,
            order_id,
            status: payment_status
        });
        
        // You can add database updates here
        // await updateOrderStatus(order_id, 'failed');
        
    } catch (error) {
        console.error('Error handling failed payment:', error);
        throw error;
    }
}

// Handle partial payment
async function handlePartialPayment(paymentData) {
    try {
        const { payment_id, order_id, price_amount, pay_amount } = paymentData;
        
        console.log('Partial payment received:', paymentData);
        
        // Handle partial payment logic
        console.log('⚠️ Partial payment received:', {
            payment_id,
            order_id,
            expected: price_amount,
            received: pay_amount
        });
        
    } catch (error) {
        console.error('Error handling partial payment:', error);
        throw error;
    }
}

// Handle expired payment
async function handleExpiredPayment(paymentData) {
    try {
        const { payment_id, order_id } = paymentData;
        
        console.log('Payment expired:', paymentData);
        
        // Update order status to expired
        console.log('⏰ Payment expired:', {
            payment_id,
            order_id
        });
        
        // You can add database updates here
        // await updateOrderStatus(order_id, 'expired');
        
    } catch (error) {
        console.error('Error handling expired payment:', error);
        throw error;
    }
}