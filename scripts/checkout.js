// Checkout Page JavaScript with Stripe Integration

// Load EmailJS for key delivery
const emailjsScript = document.createElement('script');
emailjsScript.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
document.head.appendChild(emailjsScript);

// Stripe configuration
const stripe = Stripe('pk_test_51QH7ScFv00fKIACqGfORYO5j1VPJRwZgxxY2P1662qAIwfbm1vv3nfJi4Ig4UUrCoPDoMuslLPGRUja9NQZl6ecq003TypD8pF');

// Global variables
let elements;
let cardElement;
let currentPackage = null;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Checkout page loaded');
    
    // Check for payment status in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('status');
    
    if (paymentStatus) {
        handlePaymentReturn(paymentStatus);
        return;
    }
    
    // Check if Stripe is available
    if (typeof Stripe === 'undefined') {
        console.error('Stripe library not loaded');
        showError('Payment system not available. Please refresh the page.');
        return;
    }
    
    console.log('Stripe library loaded:', typeof Stripe);
    console.log('Stripe instance:', stripe);
    
    // Get package from URL parameters and show package details
    await loadPackageFromURL();
    
    // Initialize Stripe directly (no auth required)
    initializeStripe();
    setupFormValidation();
    setupPaymentMethodToggle();
    setupCryptoPayments();
    
    // Update button text based on plan type
    if (currentPackage && currentPackage.price === 0) {
        updateButtonText('Get Free Plan');
    } else {
        updateButtonText('Pay Now');
    }
    
    // Show checkout form directly
    showCheckoutForm();
    
    console.log('Checkout page initialization complete');
});

// Handle payment return from Zerocryptopay
function handlePaymentReturn(status) {
    console.log('Payment return status:', status);
    
    if (status === 'success') {
        // Payment was successful
        showSuccess();
    } else if (status === 'failed') {
        // Payment failed
        showError('Payment was cancelled or failed. Please try again.');
    } else if (status === 'processing') {
        // Payment is being processed
        showLoading(true);
        updateButtonText('Processing Payment...');
        
        // Check payment status periodically
        setTimeout(() => {
            // In a real implementation, you would check the payment status
            // For now, we'll assume it succeeded after 5 seconds
            showSuccess();
        }, 5000);
    }
}

// Mock package data for direct checkout (no Supabase required)
const mockPackages = {
    'free': {
        id: 'free',
        name: 'Free',
        price: 0,
        billing_cycle: 'na',
        features: ['Basic screen sharing', 'Up to 3 devices', '720p resolution', 'Standard support']
    },
    'pro': {
        id: 'pro',
        name: 'Pro',
        price: 29.99,
        billing_cycle: 'monthly',
        features: ['Advanced screen sharing', 'Up to 10 devices', '1080p resolution', 'Recording feature', 'Priority support', 'Custom branding']
    },
    'business': {
        id: 'business',
        name: 'Business',
        price: 99.99,
        billing_cycle: 'monthly',
        features: ['Premium screen sharing', 'Unlimited devices', '4K resolution', 'Recording & editing features', 'Priority support', 'Custom branding', 'Analytics dashboard', 'Team management']
    }
};

// Load package details from cart data
async function loadPackageFromURL() {
    try {
        // Load cart data instead of URL parameters
        const cart = JSON.parse(localStorage.getItem('crownphone_cart') || '[]');
        
        console.log('Cart data:', cart);
        
        if (cart.length === 0) {
            console.error('No items in cart');
            showError('Your cart is empty. Please add items to cart first.');
            // Redirect to cart page after 2 seconds
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 2000);
            return;
        }

        // Calculate cart totals (exact cart amount without additional tax)
        const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Round to 2 decimal places to fix floating point precision
        const exactTotal = Math.round(cartTotal * 100) / 100;

        // Create a package object from cart data
        if (cart.length === 1) {
            // Single item package
            const item = cart[0];
            const itemTotal = Math.round((item.price * item.quantity) * 100) / 100;
            currentPackage = {
                id: 'cart-single-item',
                name: item.name,
                description: `Quantity: ${item.quantity}`,
                price: itemTotal,
                billing_cycle: 'one-time',
                features: [`${item.name} - ${item.quantity} item(s)`]
            };
        } else {
            // Multiple items package
            currentPackage = {
                id: 'cart-multiple-items',
                name: 'CrownPhone Package',
                description: `${cart.length} items in your cart`,
                price: exactTotal,
                billing_cycle: 'one-time',
                features: cart.map(item => `${item.name} (${item.quantity}x - $${item.price.toFixed(2)})`)
            };
        }

        console.log('Created package from cart:', currentPackage);
        
        // Update the display with cart data
        updatePackageDisplay();
        updateTotals();
        
    } catch (error) {
        console.error('Error loading cart data:', error);
        showError('Error loading cart data. Please try again.');
        // Redirect to cart page if error
        setTimeout(() => {
            window.location.href = 'cart.html';
        }, 2000);
    }
}

// Update package display in the UI
function updatePackageDisplay() {
    if (!currentPackage) return;
    
    // Update package name
    const packageName = document.getElementById('package-name');
    
    if (packageName) {
        packageName.textContent = currentPackage.name;
    }
    
    // Update package description
    const packageDescription = document.getElementById('package-description');
    if (packageDescription) {
        packageDescription.textContent = getPackageDescription(currentPackage.name);
    }
    
    // Update price
    const priceAmount = document.getElementById('price-amount');
    if (priceAmount) {
        priceAmount.textContent = `$${currentPackage.price}`;
        console.log('Updated price display to:', `$${currentPackage.price}`);
    }
    
    // Update billing period
    const pricePeriod = document.getElementById('price-period');
    if (pricePeriod) {
        pricePeriod.textContent = getBillingPeriodText(currentPackage.billing_cycle);
    }
    
    // Update features grid
    const featuresGrid = document.getElementById('features-grid');
    if (featuresGrid && Array.isArray(currentPackage.features)) {
        featuresGrid.innerHTML = '';
        currentPackage.features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item';
            featureItem.innerHTML = `
                <span class="feature-icon">✓</span>
                <span>${feature}</span>
            `;
            featuresGrid.appendChild(featureItem);
        });
    }
    
    // Update totals
    updateTotals();
}

// Get package description based on name
function getPackageDescription(packageName) {
    const descriptions = {
        'Free': 'Basic screen sharing for casual users',
        'Pro': 'Advanced screen sharing with premium features',
        'Business': 'Enterprise-level screen sharing for teams'
    };
    return descriptions[packageName] || 'Premium screen sharing solution';
}

// Get billing period text
function getBillingPeriodText(billingCycle) {
    const periods = {
        'monthly': '/month',
        'yearly': '/year',
        'one-time': '/one-time',
        'na': '/free'
    };
    return periods[billingCycle] || '/month';
}

// Update totals section
function updateTotals() {
    if (!currentPackage) return;
    
    // Use exact cart amount without floating point issues
    const cartTotal = Math.round(currentPackage.price * 100) / 100;
    const subtotal = cartTotal;
    const tax = 0; // No additional tax - cart amount is final
    const total = subtotal;
    
    console.log('Updating totals - Cart amount:', currentPackage.price);
    console.log('Exact subtotal:', subtotal);
    console.log('Final total:', total);
    
    // Update subtotal
    const subtotalElement = document.getElementById('subtotal');
    if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
    
    // Update tax
    const taxElement = document.getElementById('tax');
    if (taxElement) {
        taxElement.textContent = `$${tax.toFixed(2)}`;
    }
    
    // Update total
    const totalElement = document.getElementById('total');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}

// Initialize Stripe
function initializeStripe() {
    try {
        // Check if Stripe is loaded
        if (typeof Stripe === 'undefined') {
            throw new Error('Stripe library not loaded');
        }
        
        // Check if this is a free plan
        if (currentPackage && currentPackage.price === 0) {
            console.log('Free plan detected, skipping Stripe initialization');
            showFreePlanCheckout();
            return;
        }
        
        // Create card element with proper styling for paid plans
        elements = stripe.elements({
            mode: 'payment',
            amount: currentPackage ? Math.round(currentPackage.price * 100) : 999,
            currency: 'usd'
        });
        
        cardElement = elements.create('card', {
            style: {
                base: {
                    color: '#ffffff',
                    fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontSize: '16px',
                    lineHeight: '1.5',
                    '::placeholder': {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '0',
                    padding: '0',
                    boxShadow: 'none',
                    iconColor: '#00d4ff'
                },
                invalid: {
                    color: '#ff6b6b',
                    iconColor: '#ff6b6b'
                },
                complete: {
                    color: '#00ff88',
                    iconColor: '#00ff88'
                }
            },
            hidePostalCode: true
        });
        
        // Mount the card element
        cardElement.mount('#card-element');
        
        // Handle card validation
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.style.display = 'block';
            } else {
                displayError.textContent = '';
                displayError.style.display = 'none';
            }
        });
        
        // Handle card ready event
        cardElement.on('ready', function() {
            console.log('Card element is ready');
        });
        
        console.log('Stripe initialized successfully');
        
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        
        // Show a fallback card input if Stripe fails
        const cardElement = document.getElementById('card-element');
        if (cardElement) {
            cardElement.innerHTML = `
                <div class="fallback-card-input">
                    <div class="card-row">
                        <input type="text" placeholder="Card number" class="fallback-input" maxlength="19">
                        <input type="text" placeholder="MM/YY" class="fallback-input" maxlength="5">
                        <input type="text" placeholder="CVC" class="fallback-input" maxlength="4">
                    </div>
                    <p class="fallback-note">Payment processing will be handled securely</p>
                </div>
            `;
        }
        
        showError('Payment system temporarily unavailable. Please try again later.');
    }
}

// Show free plan checkout (no payment required)
function showFreePlanCheckout() {
    console.log('Setting up free plan checkout');
    
    // Hide payment-related elements
    const paymentSection = document.querySelector('.payment-section');
    const cardElement = document.getElementById('card-element');
    const paymentMethods = document.querySelector('.payment-methods');
    const cryptoSection = document.querySelector('.crypto-section');
    
    if (paymentSection) paymentSection.style.display = 'none';
    if (cardElement) cardElement.style.display = 'none';
    if (paymentMethods) paymentMethods.style.display = 'none';
    if (cryptoSection) cryptoSection.style.display = 'none';
    
    // Show free plan message
    const checkoutForm = document.querySelector('.checkout-form');
    if (checkoutForm) {
        const freeMessage = document.createElement('div');
        freeMessage.className = 'free-plan-message';
        freeMessage.innerHTML = `
            <div class="free-plan-content">
                <div class="free-plan-icon">🎉</div>
                <h3>Free Plan Selected!</h3>
                <p>You've selected the free plan. No payment information is required.</p>
                <div class="free-plan-features">
                    <h4>Your Free Plan Includes:</h4>
                    <ul>
                        ${currentPackage.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
                    </ul>
                </div>
                <div class="free-plan-note">
                    <p><strong>Note:</strong> You can upgrade to a paid plan anytime to unlock additional features.</p>
                </div>
            </div>
        `;
        
        // Insert the message before the form
        checkoutForm.insertBefore(freeMessage, checkoutForm.firstChild);
    }
    
    // Update button text and behavior
    updateButtonText('Get Free Plan');
    
    // Update form validation to not require payment method
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.onclick = handleFreePlanSubmission;
    }
}

// Handle free plan submission
async function handleFreePlanSubmission() {
    if (!currentPackage) {
        showError('Missing package information. Please refresh the page.');
        return;
    }
    
    try {
        // Show loading state
        showLoading(true);
        updateButtonText('Processing...');
        
        // Validate basic form (email, name, terms)
        if (!validateBasicForm()) {
            showLoading(false);
            updateButtonText('Get Free Plan');
            return;
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update user subscription (free plan)
        await updateUserSubscription({ id: 'free_' + Math.random().toString(36).substr(2, 9), status: 'succeeded' });
        showSuccess();
        
    } catch (error) {
        console.error('Free plan submission error:', error);
        showError(error.message || 'Failed to activate free plan. Please try again.');
    } finally {
        showLoading(false);
        updateButtonText('Get Free Plan');
    }
}

// Validate basic form (without payment requirements)
function validateBasicForm() {
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const terms = document.getElementById('terms').checked;
    
    if (!email || !name || !terms) {
        showError('Please fill in all required fields and accept the terms.');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    return true;
}

// Set up form validation
function setupFormValidation() {
    const form = document.querySelector('.checkout-form');
    const submitButton = document.getElementById('submit-button');
    const termsCheckbox = document.getElementById('terms');
    
    // Enable/disable submit button based on terms checkbox
    if (termsCheckbox && submitButton) {
        termsCheckbox.addEventListener('change', function() {
            submitButton.disabled = !this.checked;
            if (this.checked) {
                updateButtonText('Pay Now');
            } else {
                updateButtonText('Accept Terms to Continue');
            }
        });
    }
    
    // Handle form submission
    if (submitButton) {
        submitButton.addEventListener('click', handlePayment);
    }
}

// Handle payment submission
async function handlePayment() {
    if (!currentPackage) {
        showError('Missing package information. Please refresh the page.');
        return;
    }
    
    // Check if this is a free plan
    if (currentPackage.price === 0) {
        await handleFreePlanSubmission();
        return;
    }
    
    try {
        // Show loading state
        showLoading(true);
        updateButtonText('Processing...');
        
        // Validate form
        if (!validateForm()) {
            showLoading(false);
            updateButtonText('Pay Now');
            return;
        }
        
        // Check payment method
        const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
        if (!selectedPaymentMethod) {
            showError('Please select a payment method.');
            showLoading(false);
            updateButtonText('Pay Now');
            return;
        }
        
        if (selectedPaymentMethod.value === 'crypto') {
            // Check if crypto is selected
            const selectedCrypto = document.querySelector('.crypto-option.selected');
            if (!selectedCrypto) {
                showError('Please select a cryptocurrency to pay with.');
                showLoading(false);
                updateButtonText('Pay Now');
                return;
            }
            // Process crypto payment
            await processCryptoPayment();
        } else {
            // Process Stripe payment
            await processStripePayment();
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        showError(error.message || 'Payment failed. Please try again.');
    } finally {
        showLoading(false);
        updateButtonText('Pay Now');
    }
}

// Process Stripe payment
async function processStripePayment() {
    try {
        console.log('Processing Stripe payment for package:', currentPackage.name);
        
        // For demo purposes, simulate a successful payment
        // In a real app, you would create a payment intent and confirm it
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock successful payment
        const mockPaymentIntent = {
            id: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
            status: 'succeeded'
        };
        
        // Update user subscription
        await updateUserSubscription(mockPaymentIntent);
        showSuccess();
        
    } catch (error) {
        console.error('Stripe payment error:', error);
        throw new Error('Card payment failed. Please try again.');
    }
}



// Update user subscription in Supabase
async function updateUserSubscription(paymentIntent) {
    try {
        console.log('Updating user subscription...');
        
        // Get current user
        const { user, error: userError } = await getCurrentUser();
        if (userError || !user) {
            throw new Error('User not authenticated');
        }
        
        // Handle package ID - currentPackage might have a numeric ID
        let packageId = null;
        
        console.log('Current package data:', currentPackage);
        
        // Check if currentPackage has an id field that might be numeric
        if (currentPackage.id) {
            console.log('Package has ID field:', currentPackage.id, typeof currentPackage.id);
            
            // If it's a number, convert to string and check if it's a valid UUID
            const idString = currentPackage.id.toString();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (uuidRegex.test(idString)) {
                packageId = idString;
                console.log('Using package ID from currentPackage:', packageId);
            } else {
                console.warn('Package ID is not a valid UUID:', idString);
            }
        }
        
        // If no valid package ID found, try to get it from database
        if (!packageId) {
            try {
                const { data: packageData, error: packageError } = await supabase
                    .from('subscription_packages')
                    .select('id')
                    .eq('name', currentPackage.name)
                    .single();
                    
                if (packageData && packageData.id) {
                    const dbId = packageData.id;
                    console.log('Found package in database:', dbId, typeof dbId);
                    
                    // Convert numeric ID to UUID format
                    if (typeof dbId === 'number' || /^\d+$/.test(dbId.toString())) {
                        // Convert number to UUID format: pad with zeros and add UUID structure
                        const paddedId = dbId.toString().padStart(8, '0');
                        packageId = `${paddedId}-0000-0000-0000-000000000000`;
                        console.log('Converted numeric ID to UUID format:', packageId);
                    } else {
                        packageId = dbId;
                        console.log('Using database ID as-is:', packageId);
                    }
                } else {
                    console.warn('Could not find package in database');
                }
            } catch (error) {
                console.warn('Error fetching package from database:', error.message);
            }
        }
        
        // If still no package ID found, use a mock UUID
        if (!packageId) {
            packageId = '00000000-0000-0000-0000-000000000000'; // Mock UUID
            console.warn('Using mock UUID for package_id');
        }
        
        console.log('Final package ID being used:', packageId);
        
        // Deactivate any existing active subscriptions
        const { error: deactivateError } = await supabase
            .from('user_subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', user.id)
            .eq('status', 'active');
            
        if (deactivateError) {
            console.warn('Could not deactivate existing subscriptions:', deactivateError.message);
        }
        
        // Create new subscription record
        const subscriptionData = {
            user_id: user.id,
            package_id: packageId,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            payment_intent_id: paymentIntent.id,
            payment_method: paymentIntent.payment_method || 'card',
            amount: currentPackage.price,
            currency: 'USD',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        console.log('Creating subscription with data:', subscriptionData);
        
        console.log('Attempting to insert subscription data:', JSON.stringify(subscriptionData, null, 2));
        
        const { data: subscription, error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionData)
            .select()
            .single();
            
        if (subscriptionError) {
            console.error('Error creating subscription:', subscriptionError);
            console.error('Full error details:', JSON.stringify(subscriptionError, null, 2));
            throw new Error('Failed to create subscription record: ' + subscriptionError.message);
        }
        
        console.log('Subscription created successfully:', subscription);
        
        // Update user profile with subscription tier
        const subscriptionTier = currentPackage.name.toLowerCase().replace(' plan', '');
        console.log('Updating profile subscription tier to:', subscriptionTier);
        console.log('User ID for profile update:', user.id);
        
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ 
                subscription_tier: subscriptionTier,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
        if (profileError) {
            console.error('Error updating profile subscription tier:', profileError);
            console.error('Full profile error details:', JSON.stringify(profileError, null, 2));
        } else {
            console.log('Profile subscription tier updated successfully to:', subscriptionTier);
        }
        
        console.log(`User subscribed to ${currentPackage.name} plan`);
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Subscription created:', subscription);
        
        // Simulate a small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('User subscription updated successfully');
        
    } catch (error) {
        console.error('Error updating user subscription:', error);
        throw new Error('Payment successful but failed to update subscription. Please contact support.');
    }
}

// Validate form
function validateForm() {
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const terms = document.getElementById('terms').checked;
    
    if (!email || !name || !terms) {
        showError('Please fill in all required fields and accept the terms.');
        return false;
    }
    
    if (!email.includes('@')) {
        showError('Please enter a valid email address.');
        return false;
    }
    
    return true;
}

// Show loading state
function showLoading(show = true) {
    const overlay = document.getElementById('loading-overlay');
    const submitButton = document.getElementById('submit-button');
    
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
    
    if (submitButton) {
        const spinner = submitButton.querySelector('.spinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }
}

// Hide loading state
function hideLoading() {
    showLoading(false);
}

// Update button text
function updateButtonText(text) {
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        const btnText = submitButton.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = text;
        }
    }
}

// Setup payment method toggle
function setupPaymentMethodToggle() {
    const paymentMethodInputs = document.querySelectorAll('input[name="payment-method"]');
    const stripeContainer = document.getElementById('stripe-container');
    const cryptoContainer = document.getElementById('crypto-container');
    
    paymentMethodInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'stripe') {
                stripeContainer.style.display = 'block';
                cryptoContainer.style.display = 'none';
                updateButtonText('Pay with Card');
            } else if (this.value === 'crypto') {
                stripeContainer.style.display = 'none';
                cryptoContainer.style.display = 'block';
                updateButtonText('Pay with Crypto');
                updateCryptoAmounts();
            }
        });
    });
}

// Setup crypto payments
function setupCryptoPayments() {
    // Crypto option selection
    const cryptoOptions = document.querySelectorAll('.crypto-option');
    cryptoOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            cryptoOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
            
            const selectedCrypto = this.dataset.crypto;
            console.log('Selected crypto:', selectedCrypto);
            
            // Update payment button text
            updateButtonText(`Pay with ${selectedCrypto.toUpperCase()}`);
        });
    });
    
    // Enable payment button immediately (no wallet connection needed)
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
        submitButton.disabled = false;
    }
}

// Update crypto amounts based on current price
async function updateCryptoAmounts() {
    if (!currentPackage || !currentPackage.price) return;
    
    const totalUSD = currentPackage.price;
    
    try {
        // Fetch real-time crypto prices from CoinGecko API
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,usd-coin,tether&vs_currencies=usd');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const prices = await response.json();
        console.log('Real-time crypto prices fetched:', prices);
        
        // Calculate amounts with real prices
        const btcAmount = (totalUSD / (prices.bitcoin?.usd || 45000)).toFixed(6);
        const ethAmount = (totalUSD / (prices.ethereum?.usd || 3000)).toFixed(6);
        const usdcAmount = totalUSD.toFixed(2);
        const usdtAmount = totalUSD.toFixed(2);
        
        // Update display with real amounts
        document.getElementById('btc-amount').textContent = `${btcAmount} BTC`;
        document.getElementById('eth-amount').textContent = `${ethAmount} ETH`;
        document.getElementById('usdc-amount').textContent = `${usdcAmount} USDC`;
        document.getElementById('usdt-amount').textContent = `${usdtAmount} USDT`;
        
        // Add price info as tooltips
        document.getElementById('btc-amount').title = `~$${prices.bitcoin?.usd || 45000} per BTC`;
        document.getElementById('eth-amount').title = `~$${prices.ethereum?.usd || 3000} per ETH`;
        document.getElementById('usdc-amount').title = `~$${prices['usd-coin']?.usd || 1} per USDC`;
        document.getElementById('usdt-amount').title = `~$${prices.tether?.usd || 1} per USDT`;
        
        // Update timestamp
        const timestamp = document.getElementById('price-timestamp');
        if (timestamp) {
            const now = new Date();
            timestamp.textContent = `Prices updated: ${now.toLocaleTimeString()}`;
        }
        
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        
        // Show error state
        document.getElementById('btc-amount').textContent = 'Price unavailable';
        document.getElementById('eth-amount').textContent = 'Price unavailable';
        document.getElementById('usdc-amount').textContent = 'Price unavailable';
        document.getElementById('usdt-amount').textContent = 'Price unavailable';
        
        // Show error message
        const walletStatus = document.getElementById('wallet-status');
        if (walletStatus) {
            walletStatus.innerHTML = '<span class="status-text error">Unable to fetch crypto prices. Please try again.</span>';
        }
    }
}

// Connect wallet
async function connectWallet(walletType) {
    const walletStatus = document.getElementById('wallet-status');
    const walletBtn = document.querySelector(`[data-wallet="${walletType}"]`);
    
    try {
        walletStatus.innerHTML = '<span class="status-text">Connecting to ' + walletType + '...</span>';
        
        let connectedAccount = null;
        
        if (walletType === 'metamask') {
            // Connect to MetaMask
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    connectedAccount = accounts[0];
                    console.log('MetaMask connected:', connectedAccount);
                } catch (error) {
                    if (error.code === 4001) {
                        throw new Error('User rejected connection');
                    } else {
                        throw new Error('MetaMask connection failed');
                    }
                }
            } else {
                throw new Error('MetaMask not installed. Please install MetaMask extension from metamask.io');
            }
        } else if (walletType === 'walletconnect') {
            // WalletConnect integration would go here
            throw new Error('WalletConnect integration coming soon. Please use MetaMask for now.');
        } else if (walletType === 'coinbase') {
            // Coinbase Wallet integration would go here
            throw new Error('Coinbase Wallet integration coming soon. Please use MetaMask for now.');
        } else {
            throw new Error('Unsupported wallet type');
        }
        
        if (connectedAccount) {
            // Update status
            walletStatus.innerHTML = `<span class="status-text connected">Connected: ${connectedAccount.substring(0, 6)}...${connectedAccount.substring(38)}</span>`;
            walletBtn.classList.add('connected');
            walletBtn.textContent = 'Connected';
            
            // Enable payment button
            const submitButton = document.getElementById('submit-button');
            if (submitButton) {
                submitButton.disabled = false;
            }
            
            console.log('Wallet connected successfully:', walletType, connectedAccount);
        }
        
    } catch (error) {
        console.error('Wallet connection failed:', error);
        walletStatus.innerHTML = `<span class="status-text error">Connection failed: ${error.message}</span>`;
    }
}

// Process crypto payment with Zerocryptopay (Server-side approach)
async function processCryptoPayment() {
    const selectedCrypto = document.querySelector('.crypto-option.selected');
    if (!selectedCrypto) {
        showError('Please select a cryptocurrency to pay with.');
        return;
    }
    
    const cryptoType = selectedCrypto.dataset.crypto;
    
    try {
        console.log('Processing crypto payment with Zerocryptopay:', cryptoType);
        
        // Show loading state
        showLoading(true);
        updateButtonText('Creating Payment...');
        
        // Generate unique order ID
        const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Call our server endpoint to create payment
        const response = await fetch('/api/create-crypto-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: currentPackage.price,
                order_id: orderId,
                crypto_type: cryptoType
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Payment created successfully:', result);
            console.log('Redirecting to:', result.paymentUrl);
            
            // Redirect to Zerocryptopay payment page
            window.location.href = result.paymentUrl;
        } else {
            throw new Error(result.error || 'Failed to create payment');
        }
        
    } catch (error) {
        console.error('Crypto payment failed:', error);
        showError('Failed to create crypto payment: ' + error.message);
        showLoading(false);
        updateButtonText('Pay with Crypto');
    }
}

// Check which wallets are available
function checkWalletAvailability() {
    const walletButtons = document.querySelectorAll('.wallet-btn');
    
    walletButtons.forEach(button => {
        const walletType = button.dataset.wallet;
        
        if (walletType === 'metamask') {
            if (typeof window.ethereum !== 'undefined') {
                button.classList.add('available');
                button.title = 'MetaMask is available';
            } else {
                button.classList.add('unavailable');
                button.title = 'MetaMask not installed';
                button.disabled = true;
            }
        } else if (walletType === 'walletconnect') {
            button.classList.add('coming-soon');
            button.title = 'WalletConnect coming soon';
            button.disabled = true;
        } else if (walletType === 'coinbase') {
            button.classList.add('coming-soon');
            button.title = 'Coinbase Wallet coming soon';
            button.disabled = true;
        }
    });
}

// Refresh crypto prices manually
function refreshCryptoPrices() {
    const refreshBtn = document.querySelector('.refresh-prices-btn');
    if (refreshBtn) {
        refreshBtn.textContent = '🔄 Updating...';
        refreshBtn.disabled = true;
    }
    
    updateCryptoAmounts().finally(() => {
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refresh Prices';
            refreshBtn.disabled = false;
        }
    });
}

// Show success modal and deliver key
async function showSuccess() {
    try {
        // Get user information from form
        const userEmail = document.getElementById('email').value;
        const userName = document.getElementById('name').value;
        const packageName = currentPackage ? currentPackage.name : 'Unknown Package';
        
        console.log('Payment successful! Delivering key to:', userEmail);
        console.log('User name:', userName);
        console.log('Package:', packageName);
        
        // Initialize key delivery service
        if (typeof KeyDeliveryService !== 'undefined') {
            const keyDeliveryService = new KeyDeliveryService();
            
                    // Get plan ID from package name
        let planId = null;
        if (packageName.toLowerCase() === 'free') {
            planId = 1;
        } else if (packageName.toLowerCase() === 'pro') {
            planId = 2;
        } else if (packageName.toLowerCase() === 'business') {
            planId = 3;
        }
        
        console.log('Package:', packageName, 'Plan ID:', planId);
        
        // Process key delivery with plan ID
        const result = await keyDeliveryService.processSuccessfulPayment(
            userEmail,
            userName,
            packageName,
            planId
        );
            
            if (result.success) {
                console.log('✅ Key delivered successfully:', result.key);
            } else {
                console.error('❌ Key delivery failed:', result.error);
            }
        } else {
            console.error('❌ KeyDeliveryService not loaded');
        }
        
        // Show success modal
        if (typeof showSuccessModal === 'function') {
            showSuccessModal();
        } else {
            const modal = document.getElementById('success-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        }
        
    } catch (error) {
        console.error('Error in showSuccess:', error);
        // Show success modal even if key delivery fails
        if (typeof showSuccessModal === 'function') {
            showSuccessModal();
        } else {
            const modal = document.getElementById('success-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
        }
    }
}

// Show error
function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    }
}

// Modal functions
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
        // Stop the Lottie animation when modal is closed
        if (typeof successAnimation !== 'undefined' && successAnimation) {
            successAnimation.stop();
        }
    }
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function goToHome() {
    // Redirect to home page
    window.location.href = 'index.html';
}

// Show checkout form
function showCheckoutForm() {
    const checkoutForm = document.querySelector('.checkout-form');
    if (checkoutForm) {
        checkoutForm.style.display = 'block';
    }
}
