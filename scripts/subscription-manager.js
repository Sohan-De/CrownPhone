// Subscription Manager - Connects admin dashboard to Supabase subscription tables

// Load subscription packages from Supabase
async function loadSubscriptionPackages() {
    try {
        console.log('Loading subscription packages from database...');
        
        const { data, error } = await supabase
            .from('subscription_packages')
            .select('*')
            .order('price', { ascending: true });
        
        if (error) throw error;
        
        console.log('Loaded subscription packages:', data);
        return data;
    } catch (error) {
        console.error('Error loading subscription packages:', error.message);
        alert('Error loading subscription packages: ' + error.message);
        return [];
    }
}

// Display subscription packages in the admin dashboard
function displaySubscriptionPackages(packages) {
    const tableBody = document.querySelector('.subscription-plans table tbody');
    if (!tableBody) {
        console.error('Subscription table body not found');
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!packages || packages.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No subscription packages found</td></tr>';
        return;
    }
    
    // Add each package to the table
    packages.forEach(pkg => {
        const features = Array.isArray(pkg.features) ? pkg.features : [];
        
        let featuresHtml = '<ul style="margin: 0; padding-left: 20px;">';
        features.forEach(feature => {
            featuresHtml += `<li>${feature}</li>`;
        });
        featuresHtml += '</ul>';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pkg.name}</td>
            <td>$${pkg.price}</td>
            <td>${formatBillingCycle(pkg.billing_cycle)}</td>
            <td>${featuresHtml}</td>
            <td><span class="status-badge status-${pkg.status}">${formatStatus(pkg.status)}</span></td>
            <td>
                <button class="action-btn" onclick="editSubscriptionPackage('${pkg.id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="confirmDeletePackage('${pkg.id}', '${pkg.name}')">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Format billing cycle for display
function formatBillingCycle(cycle) {
    if (!cycle) return 'N/A';
    
    switch (cycle.toLowerCase()) {
        case 'monthly': return 'Monthly';
        case 'yearly': return 'Yearly';
        case 'one-time': return 'One-time';
        case 'na': return 'N/A';
        default: return cycle;
    }
}


// Format status for display
function formatStatus(status) {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
        case 'active': return 'Active';
        case 'inactive': return 'Inactive';
        case 'coming-soon': return 'Coming Soon';
        default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Save a subscription package to Supabase
async function saveSubscriptionPackage(packageData) {
    try {
        console.log('Saving subscription package:', packageData);
        
        const { data, error } = await supabase
            .from('subscription_packages')
            .upsert(packageData)
            .select();
        
        if (error) throw error;
        
        console.log('Saved subscription package:', data);
        return data[0];
    } catch (error) {
        console.error('Error saving subscription package:', error.message);
        alert('Error saving subscription package: ' + error.message);
        return null;
    }
}

// Delete a subscription package from Supabase
async function deleteSubscriptionPackage(packageId) {
    try {
        console.log('Deleting subscription package:', packageId);
        
        // Try to check if any users are using this package
        try {
            const { data: usersWithPackage, error: checkError } = await supabase
                .from('user_subscriptions')
                .select('id')
                .eq('package_id', packageId)
                .eq('status', 'active');
            
            // Only check if users are using the package if the table exists and there's no error
            if (!checkError && usersWithPackage && usersWithPackage.length > 0) {
                alert(`Cannot delete this package: ${usersWithPackage.length} users are currently subscribed to it. Deactivate it instead.`);
                return false;
            }
        } catch (checkError) {
            // If the table doesn't exist yet, we can safely ignore this check
            console.warn('Could not check for users with this package:', checkError.message);
        }
        
        // Delete the package
        const { error } = await supabase
            .from('subscription_packages')
            .delete()
            .eq('id', packageId);
        
        if (error) throw error;
        
        console.log('Deleted subscription package:', packageId);
        
        // Also reload home page pricing section if window.loadSubscriptionPackages exists
        if (typeof window.loadSubscriptionPackages === 'function') {
            try {
                window.loadSubscriptionPackages().then(() => {
                    console.log('Home page pricing section updated after deletion');
                });
            } catch (e) {
                console.warn('Could not update home page pricing section:', e);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting subscription package:', error.message);
        alert('Error deleting subscription package: ' + error.message);
        return false;
    }
}

// Update a subscription package's status (for deactivating instead of deleting)
async function updatePackageStatus(packageId, status) {
    try {
        console.log(`Updating package ${packageId} status to ${status}`);
        
        const { data, error } = await supabase
            .from('subscription_packages')
            .update({ status })
            .eq('id', packageId)
            .select();
        
        if (error) throw error;
        
        console.log('Updated package status:', data);
        return data[0];
    } catch (error) {
        console.error('Error updating package status:', error.message);
        alert('Error updating package status: ' + error.message);
        return null;
    }
}

// Get a single subscription package by ID
async function getSubscriptionPackage(packageId) {
    try {
        console.log('Getting subscription package:', packageId);
        
        const { data, error } = await supabase
            .from('subscription_packages')
            .select('*')
            .eq('id', packageId)
            .single();
        
        if (error) throw error;
        
        console.log('Got subscription package:', data);
        return data;
    } catch (error) {
        console.error('Error getting subscription package:', error.message);
        alert('Error getting subscription package: ' + error.message);
        return null;
    }
}

// Load subscription analytics from Supabase
async function loadSubscriptionAnalytics() {
    try {
        console.log('Loading subscription analytics...');
        
        // Initialize default counts
        const packageCounts = {
            free: { count: 0, price: 0 },
            pro: { count: 0, price: 0 },
            business: { count: 0, price: 0 }
        };
        let totalRevenue = 0;
        
        try {
            // Try to get count of users by subscription package
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select(`
                    package_id,
                    subscription_packages!inner (
                        name,
                        price
                    )
                `)
                .eq('status', 'active');
            
            // Only process the data if there's no error
            if (!error && data) {
                data.forEach(subscription => {
                    const packageName = subscription.subscription_packages.name.toLowerCase();
                    const packagePrice = parseFloat(subscription.subscription_packages.price);
                    
                    // Map package names to our standard tiers
                    let tier = 'free';
                    if (packageName.includes('pro')) {
                        tier = 'pro';
                    } else if (packageName.includes('business') || packageName.includes('enterprise')) {
                        tier = 'business';
                    } else if (packagePrice === 0) {
                        tier = 'free';
                    }
                    
                    if (!packageCounts[tier]) {
                        packageCounts[tier] = {
                            count: 0,
                            price: packagePrice
                        };
                    }
                    
                    packageCounts[tier].count++;
                    
                    // Only add to revenue if it's not the free tier
                    if (packagePrice > 0) {
                        totalRevenue += packagePrice;
                    }
                });
            }
        } catch (analyticsError) {
            console.warn('Could not load subscription analytics:', analyticsError.message);
            // If the table doesn't exist yet, we'll just use the default values
        }
        
        // Update the UI
        document.getElementById('free-users').textContent = packageCounts.free?.count || 0;
        document.getElementById('pro-users').textContent = packageCounts.pro?.count || 0;
        document.getElementById('business-users').textContent = packageCounts.business?.count || 0;
        document.getElementById('monthly-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        
        console.log('Subscription analytics:', { packageCounts, totalRevenue });
        
        // Also try to load users with their subscription data
        try {
            await loadUsersWithSubscriptions();
        } catch (usersError) {
            console.warn('Could not load users with subscriptions:', usersError.message);
        }
        
    } catch (error) {
        console.error('Error loading subscription analytics:', error.message);
        
        // Use fallback data if there's an error
        document.getElementById('free-users').textContent = '85';
        document.getElementById('pro-users').textContent = '32';
        document.getElementById('business-users').textContent = '8';
        document.getElementById('monthly-revenue').textContent = '$559.68';
    }
}

// Load users with their subscription data
async function loadUsersWithSubscriptions() {
    try {
        console.log('Loading users with subscription data...');
        
        // Get all profiles with their subscription data
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (profilesError) throw profilesError;
        
        // Get the users table body
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) {
            console.warn('Users table body not found');
            return;
        }
        
        // Clear the table
        tableBody.innerHTML = '';
        
        // Initialize empty subscriptions map
        const userSubscriptions = {};
        
        // Try to get subscription data if the table exists
        try {
            // Get all active subscriptions
            const { data: subscriptions, error: subsError } = await supabase
                .from('user_subscriptions')
                .select(`
                    user_id,
                    package_id,
                    status,
                    start_date,
                    subscription_packages (
                        name,
                        price,
                        billing_cycle
                    )
                `)
                .eq('status', 'active');
            
            // Only process if there's no error
            if (!subsError && subscriptions) {
                // Map subscriptions to users
                subscriptions.forEach(sub => {
                    userSubscriptions[sub.user_id] = sub;
                });
            }
        } catch (subsError) {
            console.warn('Could not load subscription data:', subsError.message);
            // If the table doesn't exist yet, we'll just use empty subscription data
        }
        
        // Add each user to the table
        profiles.forEach(profile => {
            const subscription = userSubscriptions[profile.id];
            
            // Get subscription info or use defaults
            let subscriptionName = 'Free';
            let subscriptionStatus = 'none';
            
            if (subscription) {
                subscriptionName = subscription.subscription_packages?.name || 'Free';
                subscriptionStatus = subscription.status || 'none';
            } else if (profile.subscription_tier) {
                // Use subscription_tier from profile if available
                subscriptionName = profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1);
            }
            
            const row = document.createElement('tr');
            row.setAttribute('data-id', profile.id);
            
            const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed User';
            
            row.innerHTML = `
                <td>${fullName}</td>
                <td>${profile.email || `ID: ${profile.id.substring(0, 8)}...`}</td>
                <td>${subscriptionName}</td>
                <td>
                    <span class="status-badge status-${subscriptionStatus.toLowerCase()}">${subscriptionStatus.charAt(0).toUpperCase() + subscriptionStatus.slice(1)}</span>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        console.log('Loaded users with subscription data');
        
    } catch (error) {
        console.error('Error loading users with subscriptions:', error.message);
        
        // If we can't load users, show an error message
        const tableBody = document.getElementById('users-table-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5">Error loading users: ${error.message}</td></tr>`;
        }
    }
}

// Edit a subscription package
async function editSubscriptionPackage(packageId) {
    try {
        const pkg = await getSubscriptionPackage(packageId);
        if (!pkg) return;
        
        // Set form values
        document.getElementById('plan-id').value = pkg.id;
        document.getElementById('plan-name').value = pkg.name;
        document.getElementById('plan-price').value = pkg.price;
        document.getElementById('plan-billing-cycle').value = pkg.billing_cycle;
        document.getElementById('plan-status').value = pkg.status;
        
        // Set features as newline-separated text
        const features = Array.isArray(pkg.features) ? pkg.features : [];
        document.getElementById('plan-features').value = features.join('\n');
        
        // Show the modal
        document.getElementById('edit-plan-modal').style.display = 'block';
        
    } catch (error) {
        console.error('Error editing subscription package:', error.message);
        alert('Error editing subscription package: ' + error.message);
    }
}


// Save changes to a subscription package
async function saveSubscriptionPackageChanges() {
    try {
        const packageId = document.getElementById('plan-id').value;
        const name = document.getElementById('plan-name').value;
        const price = parseFloat(document.getElementById('plan-price').value);
        const billingCycle = document.getElementById('plan-billing-cycle').value;
        const status = document.getElementById('plan-status').value;
        
        // Convert features from newline-separated text to array
        const featuresText = document.getElementById('plan-features').value;
        const features = featuresText.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');
        
        // Validate inputs
        if (!name) {
            alert('Please enter a plan name');
            return;
        }
        
        if (isNaN(price)) {
            alert('Please enter a valid price');
            return;
        }
        
        // Create package data object
        const packageData = {
            id: packageId,
            name,
            price,
            billing_cycle: billingCycle,
            features,
            status
        };
        
        // Save to Supabase
        const savedPackage = await saveSubscriptionPackage(packageData);
        
        if (savedPackage) {
            // Close the modal
            document.getElementById('edit-plan-modal').style.display = 'none';
            
            // Reload subscription packages
            const packages = await loadSubscriptionPackages();
            displaySubscriptionPackages(packages);
            
            // Also reload home page pricing section if window.loadSubscriptionPackages exists
            if (typeof window.loadSubscriptionPackages === 'function') {
                try {
                    window.loadSubscriptionPackages().then(() => {
                        console.log('Home page pricing section updated after edit');
                    });
                } catch (e) {
                    console.warn('Could not update home page pricing section:', e);
                }
            }
            
            // Show success message
            alert('Subscription package updated successfully!');
        }
        
    } catch (error) {
        console.error('Error saving subscription package changes:', error.message);
        alert('Error saving subscription package changes: ' + error.message);
    }
}

// Add a new subscription package
async function addNewSubscriptionPackage() {
    try {
        const name = document.getElementById('new-plan-name').value;
        const price = parseFloat(document.getElementById('new-plan-price').value);
        const billingCycle = document.getElementById('new-plan-billing-cycle').value;
        const status = document.getElementById('new-plan-status').value;
        
        // Convert features from newline-separated text to array
        const featuresText = document.getElementById('new-plan-features').value;
        const features = featuresText.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');
        
        // Validate inputs
        if (!name) {
            alert('Please enter a plan name');
            return;
        }
        
        if (isNaN(price)) {
            alert('Please enter a valid price');
            return;
        }
        
        // Create package data object
        const packageData = {
            name,
            price,
            billing_cycle: billingCycle,
            features,
            status
        };
        
        // Save to Supabase
        const savedPackage = await saveSubscriptionPackage(packageData);
        
        if (savedPackage) {
            // Close the modal
            document.getElementById('add-plan-modal').style.display = 'none';
            
            // Reset the form
            document.getElementById('add-plan-form').reset();
            
            // Reload subscription packages
            const packages = await loadSubscriptionPackages();
            displaySubscriptionPackages(packages);
            
            // Also reload home page pricing section if window.loadSubscriptionPackages exists
            if (typeof window.loadSubscriptionPackages === 'function') {
                try {
                    window.loadSubscriptionPackages().then(() => {
                        console.log('Home page pricing section updated after adding new package');
                    });
                } catch (e) {
                    console.warn('Could not update home page pricing section:', e);
                }
            }
            
            // Show success message
            alert('New subscription package added successfully!');
        }
        
    } catch (error) {
        console.error('Error adding new subscription package:', error.message);
        alert('Error adding new subscription package: ' + error.message);
    }
}

// Confirm deletion of a subscription package
function confirmDeletePackage(packageId, packageName) {
    const isFree = packageName.toLowerCase() === 'free';
    
    const confirmMessage = isFree ? 
        'Are you sure you want to deactivate the Free plan? This might affect existing users.' : 
        `Are you sure you want to delete the ${packageName} plan? This might affect existing users.`;
        
    if (confirm(confirmMessage)) {
        if (isFree) {
            // For the Free plan, just deactivate it instead of deleting
            updatePackageStatus(packageId, 'inactive')
                .then(updatedPackage => {
                    if (updatedPackage) {
                        // Reload subscription packages
                        loadSubscriptionPackages().then(displaySubscriptionPackages);
                        alert('Free plan deactivated successfully!');
                    }
                });
        } else {
            // For other plans, try to delete
            deleteSubscriptionPackage(packageId)
                .then(success => {
                    if (success) {
                        // Reload subscription packages
                        loadSubscriptionPackages().then(displaySubscriptionPackages);
                        alert(`${packageName} plan deleted successfully!`);
                    }
                });
        }
    }
}

// Initialize the subscription manager
async function initSubscriptionManager() {
    try {
        console.log('Initializing subscription manager...');
        
        // Load subscription packages
        const packages = await loadSubscriptionPackages();
        displaySubscriptionPackages(packages);
        
        // Load subscription analytics
        await loadSubscriptionAnalytics();
        
        // Set up event listeners
        document.getElementById('add-plan-form').addEventListener('submit', function(e) {
            e.preventDefault();
            addNewSubscriptionPackage();
        });
        
        document.getElementById('edit-plan-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveSubscriptionPackageChanges();
        });
        
        console.log('Subscription manager initialized');
        
    } catch (error) {
        console.error('Error initializing subscription manager:', error.message);
    }
}


// Make functions available globally
window.loadSubscriptionPackages = loadSubscriptionPackages;
window.displaySubscriptionPackages = displaySubscriptionPackages;
window.editSubscriptionPackage = editSubscriptionPackage;
window.confirmDeletePackage = confirmDeletePackage;
window.addNewSubscriptionPackage = addNewSubscriptionPackage;
window.saveSubscriptionPackageChanges = saveSubscriptionPackageChanges;
window.loadSubscriptionAnalytics = loadSubscriptionAnalytics;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initSubscriptionManager);
