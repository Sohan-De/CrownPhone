const crypto = require('crypto');

export default async function handler(req, res) {
    // Enable CORS for your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { amount, order_id, crypto_type } = req.body;
        
        const login = 'tobibelaw@gmail.com';
        const token = 'VF66zc55lt5o2g5qlJv12Dek6kR55QHv55c';
        const secret_key = '7AA7ywFuhQdB727NpF0U7bNUH7a2JPS1x57';
        
        const signString = `${amount}${secret_key}${order_id}${login}`;
        const signature = crypto.createHash('sha256').update(signString).digest('hex');
        
        // Try different parameter formats that Zerocryptopay might expect
        const postData = new URLSearchParams({
            login: login,
            amount: amount.toString(),
            token: token,
            order_id: order_id,
            signature: signature
            // Note: crypto_type might not be needed for the API call
        });
        
        console.log('Calling Zerocryptopay with:', {
            login,
            amount,
            order_id,
            crypto_type: crypto_type || 'BTC',
            signature: signature.substring(0, 10) + '...'
        });
        
        console.log('Full postData:', postData.toString());
        
        // Use a proxy service with static IP
        const response = await fetch('https://api.codetabs.com/v1/proxy?quest=https://zerocryptopay.com/pay/newtrack', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: postData
        });
        
        console.log('Zerocryptopay response status:', response.status);
        const responseText = await response.text();
        console.log('Zerocryptopay response:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', responseText);
            return res.status(500).json({ 
                success: false, 
                error: 'Invalid response from payment provider: ' + responseText.substring(0, 100) 
            });
        }
        
        if (result.status) {
            res.json({ success: true, paymentUrl: result.url_to_pay });
        } else {
            res.status(400).json({ success: false, error: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
