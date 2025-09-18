// Key Manager - Admin Dashboard Key Management System
// Connects to Supabase Key table for comprehensive key management

class KeyManager {
    constructor() {
        this.keys = [];
        this.planNames = {
            1: 'Free',
            2: 'Pro', 
            3: 'Business'
        };
        this.init();
    }

    // Initialize the key manager
    init() {
        console.log('Key Manager initialized');
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Auto-load keys when keys tab is clicked
        const keysTab = document.querySelector('[onclick="openTab(\'keys-tab\')"]');
        if (keysTab) {
            keysTab.addEventListener('click', () => {
                setTimeout(() => this.loadKeys(), 100);
            });
        }

        // Add event listener for Enter key in modal
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.id === 'new-key-value') {
                this.addNewKey();
            }
        });
    }

    // Load all keys from Supabase
    async loadKeys() {
        try {
            console.log('Loading keys from Supabase...');
            
            if (typeof supabase === 'undefined') {
                console.error('Supabase client not available');
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            // Show loading state
            this.showLoadingState();

            // Fetch keys from Supabase
            const { data: keys, error } = await supabase
                .from('Key')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading keys:', error);
                this.showNotification('Error loading keys: ' + error.message, 'error');
                this.showErrorState();
                return;
            }

            console.log('Loaded keys:', keys);
            this.keys = keys;
            
            // Update statistics
            this.updateKeyStatistics();
            
                // Display keys in table
                this.displayKeys();
                
                // Don't show notification when loading keys automatically
                // this.showNotification('Keys loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading keys:', error);
            this.showNotification('Error loading keys: ' + error.message, 'error');
        }
    }

    // Show loading state
    showLoadingState() {
        const tableBody = document.getElementById('keys-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr class="loading-row"><td colspan="7">Loading keys...</td></tr>';
        }
    }

    // Show error state
    showErrorState() {
        const tableBody = document.getElementById('keys-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7">Error loading keys</td></tr>';
        }
    }

    // Update key statistics
    updateKeyStatistics() {
        const totalKeys = this.keys.length;
        const usedKeys = this.keys.filter(key => key.used === true).length;
        const availableKeys = totalKeys - usedKeys;
        
        // Count keys by plan
        const freeKeys = this.keys.filter(key => key.plan_id === 1).length;
        const proKeys = this.keys.filter(key => key.plan_id === 2).length;
        const businessKeys = this.keys.filter(key => key.plan_id === 3).length;

        // Update UI elements
        this.updateElement('total-keys', totalKeys);
        this.updateElement('used-keys', usedKeys);
        this.updateElement('available-keys', availableKeys);
        this.updateElement('free-keys', freeKeys);
        this.updateElement('pro-keys', proKeys);
        this.updateElement('business-keys', businessKeys);
    }

    // Update element text content
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // Display keys in table
    displayKeys() {
        const tableBody = document.getElementById('keys-table-body');
        
        if (!tableBody) {
            console.error('Keys table body not found');
            return;
        }
        
        if (!this.keys || this.keys.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No keys found</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        this.keys.forEach(key => {
            const row = document.createElement('tr');
            row.setAttribute('data-key-id', key.id);
            
            // Format dates
            const createdDate = new Date(key.created_at).toLocaleDateString();
            const updatedDate = new Date(key.updated_at).toLocaleDateString();
            
            // Get plan name
            const planName = this.planNames[key.plan_id] || 'Unknown';
            
            // Status badge
            const statusClass = key.used ? 'status-used' : 'status-available';
            const statusText = key.used ? 'Used' : 'Available';
            
                row.innerHTML = `
                    <td>${key.id}</td>
                    <td><code>${key.key_value}</code></td>
                    <td>${planName}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${createdDate}</td>
                    <td>${updatedDate}</td>
                    <td>
                        <button class="action-btn" onclick="keyManager.editKey('${key.id}', '${key.key_value}', ${key.plan_id}, ${key.used})" 
                                title="Edit Key">
                            ✏️
                        </button>
                        <button class="action-btn delete-btn" onclick="keyManager.confirmDeleteKey('${key.id}')" 
                                title="Delete Key">
                            🗑️
                        </button>
                        <button class="action-btn" onclick="keyManager.copyKey('${key.key_value}')" 
                                title="Copy Key">
                            📋
                        </button>
                    </td>
                `;
            
            tableBody.appendChild(row);
        });
    }


    // Add new key
    async addNewKey() {
        try {
            const keyValue = document.getElementById('new-key-value').value.trim();
            const planId = parseInt(document.getElementById('new-key-plan').value);

            if (!keyValue) {
                this.showNotification('Please enter a key value', 'error');
                return;
            }

            if (keyValue.length !== 16) {
                this.showNotification('Key must be exactly 16 characters long', 'error');
                return;
            }

            console.log('Adding new key:', { keyValue, planId });

            if (typeof supabase === 'undefined') {
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            // Check if key already exists
            const { data: existingKey, error: checkError } = await supabase
                .from('Key')
                .select('key_value')
                .eq('key_value', keyValue)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing key:', checkError);
                
                // Handle RLS error for key check
                if (checkError.code === '42501' || checkError.code === '403') {
                    this.showNotification('Access denied: Cannot check existing keys. Please check RLS policies.', 'error');
                } else {
                    this.showNotification('Error checking key: ' + checkError.message, 'error');
                }
                return;
            }

            if (existingKey) {
                this.showNotification('Key already exists', 'error');
                return;
            }

            // Insert new key
            const { data, error } = await supabase
                .from('Key')
                .insert({
                    key_value: keyValue,
                    plan_id: planId,
                    used: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select();

            if (error) {
                console.error('Error adding key:', error);
                
                // Handle specific RLS error
                if (error.code === '42501') {
                    this.showNotification('Access denied: Please check RLS policies for Key table. Contact admin.', 'error');
                } else if (error.code === '403') {
                    this.showNotification('Forbidden: You do not have permission to add keys.', 'error');
                } else {
                    this.showNotification('Error adding key: ' + error.message, 'error');
                }
                return;
            }

            console.log('Key added successfully:', data);
            
            // Clear form
            document.getElementById('new-key-value').value = '';
            
            // Close modal
            const modal = document.getElementById('add-key-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reload keys
            await this.loadKeys();
            
            // Don't show notification for add operation
            // this.showNotification('Key added successfully', 'success');

        } catch (error) {
            console.error('Error adding key:', error);
            this.showNotification('Error adding key: ' + error.message, 'error');
        }
    }

    // Generate random key
    generateRandomKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('new-key-value').value = result;
    }

    // Toggle key status (used/available)
    async toggleKeyStatus(keyId, currentStatus) {
        try {
            console.log('Toggling key status:', keyId, currentStatus);

            if (typeof supabase === 'undefined') {
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            const { error } = await supabase
                .from('Key')
                .update({ 
                    used: !currentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', keyId);

            if (error) {
                console.error('Error updating key status:', error);
                this.showNotification('Error updating key: ' + error.message, 'error');
                return;
            }

            // Reload keys
            await this.loadKeys();
            
            // Don't show notification for toggle operation
            // this.showNotification(`Key marked as ${!currentStatus ? 'used' : 'available'}`, 'success');

        } catch (error) {
            console.error('Error toggling key status:', error);
            this.showNotification('Error updating key: ' + error.message, 'error');
        }
    }

    // Delete key
    async deleteKey(keyId) {
        try {
            console.log('Deleting key:', keyId);

            if (typeof supabase === 'undefined') {
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            const { error } = await supabase
                .from('Key')
                .delete()
                .eq('id', keyId);

            if (error) {
                console.error('Error deleting key:', error);
                this.showNotification('Error deleting key: ' + error.message, 'error');
                return;
            }

            // Reload keys
            await this.loadKeys();
            
            // Don't show notification for delete operation
            // this.showNotification('Key deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting key:', error);
            this.showNotification('Error deleting key: ' + error.message, 'error');
        }
    }

    // Confirm delete key
    confirmDeleteKey(keyId) {
        // Remove browser alert - delete directly
        this.deleteKey(keyId);
    }

    // Copy key to clipboard
    async copyKey(keyValue) {
        try {
            await navigator.clipboard.writeText(keyValue);
            // Don't show notification for copy operation
            // this.showNotification('Key copied to clipboard', 'success');
        } catch (error) {
            console.error('Error copying key:', error);
            this.showNotification('Error copying key', 'error');
        }
    }


    // Edit key
    editKey(keyId, keyValue, planId, isUsed) {
        // Create edit modal if it doesn't exist
        let modal = document.getElementById('edit-key-modal');
        if (!modal) {
            modal = this.createEditKeyModal();
        }
        
        // Populate form with current values
        document.getElementById('edit-key-id').value = keyId;
        document.getElementById('edit-key-value').value = keyValue;
        document.getElementById('edit-key-plan').value = planId;
        document.getElementById('edit-key-status').checked = isUsed;
        
        modal.style.display = 'block';
    }

    // Create edit key modal
    createEditKeyModal() {
        const modal = document.createElement('div');
        modal.id = 'edit-key-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                    <h3 style="color: #00d4ff; margin: 0; font-size: 20px; font-weight: 600;">Edit Key</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'" style="background: none; border: none; color: #00d4ff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0, 212, 255, 0.1)'" onmouseout="this.style.background='none'">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <input type="hidden" id="edit-key-id">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="edit-key-value" style="display: block; color: #00d4ff; margin-bottom: 8px; font-weight: 500;">Key Value (16 characters)</label>
                        <input type="text" id="edit-key-value" placeholder="Enter key value (e.g., A1B2C3D4E5F6G7H8)" maxlength="16" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.6); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); border-radius: 6px; font-family: 'Courier New', monospace; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; transition: all 0.3s ease;" onfocus="this.style.borderColor='#00d4ff'; this.style.boxShadow='0 0 10px rgba(0, 212, 255, 0.3)'" onblur="this.style.borderColor='rgba(0, 212, 255, 0.5)'; this.style.boxShadow='none'">
                    </div>
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="edit-key-plan" style="display: block; color: #00d4ff; margin-bottom: 8px; font-weight: 500;">Plan</label>
                        <select id="edit-key-plan" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); border-radius: 6px; font-size: 14px; transition: all 0.3s ease;" onfocus="this.style.borderColor='#00d4ff'; this.style.boxShadow='0 0 10px rgba(0, 212, 255, 0.3)'" onblur="this.style.borderColor='rgba(0, 212, 255, 0.5)'; this.style.boxShadow='none'">
                            <option value="1" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Free Plan</option>
                            <option value="2" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Pro Plan</option>
                            <option value="3" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Business Plan</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label style="display: flex; align-items: center; color: #00d4ff; font-weight: 500; cursor: pointer;">
                            <input type="checkbox" id="edit-key-status" style="margin-right: 10px; width: 18px; height: 18px; accent-color: #00d4ff;">
                            Mark as Used
                        </label>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" onclick="keyManager.generateRandomKeyForEdit()" style="background: linear-gradient(45deg, #ff9800, #ffc107); color: #1a1a2e; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">Generate Random</button>
                        <button class="btn btn-primary" onclick="keyManager.updateKey()" style="background: linear-gradient(45deg, #00d4ff, #00ff88); color: #1a1a2e; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">Update Key</button>
                        <button class="btn btn-outline" onclick="this.closest('.modal').style.display='none'" style="background: rgba(0, 0, 0, 0.3); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0, 212, 255, 0.1)'; this.style.borderColor='#00d4ff'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.borderColor='rgba(0, 212, 255, 0.5)'">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    // Generate random key for edit modal
    generateRandomKeyForEdit() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        document.getElementById('edit-key-value').value = result;
    }

    // Update key
    async updateKey() {
        try {
            const keyId = document.getElementById('edit-key-id').value;
            const keyValue = document.getElementById('edit-key-value').value.trim();
            const planId = parseInt(document.getElementById('edit-key-plan').value);
            const isUsed = document.getElementById('edit-key-status').checked;

            if (!keyValue) {
                this.showNotification('Please enter a key value', 'error');
                return;
            }

            if (keyValue.length !== 16) {
                this.showNotification('Key must be exactly 16 characters long', 'error');
                return;
            }

            console.log('Updating key:', { keyId, keyValue, planId, isUsed });

            if (typeof supabase === 'undefined') {
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            // Check if key already exists (excluding current key)
            const { data: existingKey, error: checkError } = await supabase
                .from('Key')
                .select('key_value')
                .eq('key_value', keyValue)
                .neq('id', keyId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing key:', checkError);
                
                if (checkError.code === '42501' || checkError.code === '403') {
                    this.showNotification('Access denied: Cannot check existing keys. Please check RLS policies.', 'error');
                } else {
                    this.showNotification('Error checking key: ' + checkError.message, 'error');
                }
                return;
            }

            if (existingKey) {
                this.showNotification('Key already exists', 'error');
                return;
            }

            // Update key
            const { data, error } = await supabase
                .from('Key')
                .update({
                    key_value: keyValue,
                    plan_id: planId,
                    used: isUsed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', keyId)
                .select();

            if (error) {
                console.error('Error updating key:', error);
                
                if (error.code === '42501') {
                    this.showNotification('Access denied: Please check RLS policies for Key table. Contact admin.', 'error');
                } else if (error.code === '403') {
                    this.showNotification('Forbidden: You do not have permission to update keys.', 'error');
                } else {
                    this.showNotification('Error updating key: ' + error.message, 'error');
                }
                return;
            }

            console.log('Key updated successfully:', data);
            
            // Close modal
            const modal = document.getElementById('edit-key-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Reload keys
            await this.loadKeys();
            
            // Don't show notification for update operation
            // this.showNotification('Key updated successfully', 'success');

        } catch (error) {
            console.error('Error updating key:', error);
            this.showNotification('Error updating key: ' + error.message, 'error');
        }
    }

    // Show add key modal
    showAddKeyModal() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('add-key-modal');
        if (!modal) {
            modal = this.createAddKeyModal();
        }
        modal.style.display = 'block';
    }

    // Create add key modal
    createAddKeyModal() {
        const modal = document.createElement('div');
        modal.id = 'add-key-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
                <div class="modal-header" style="padding: 20px; border-bottom: 1px solid rgba(0, 212, 255, 0.2);">
                    <h3 style="color: #00d4ff; margin: 0; font-size: 20px; font-weight: 600;">Add New Key</h3>
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'" style="background: none; border: none; color: #00d4ff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0, 212, 255, 0.1)'" onmouseout="this.style.background='none'">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div class="form-group" style="margin-bottom: 20px;">
                        <label for="new-key-value" style="display: block; color: #00d4ff; margin-bottom: 8px; font-weight: 500;">Key Value (16 characters)</label>
                        <input type="text" id="new-key-value" placeholder="Enter key value (e.g., A1B2C3D4E5F6G7H8)" maxlength="16" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.6); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); border-radius: 6px; font-family: 'Courier New', monospace; letter-spacing: 1px; text-transform: uppercase; font-size: 14px; transition: all 0.3s ease;" onfocus="this.style.borderColor='#00d4ff'; this.style.boxShadow='0 0 10px rgba(0, 212, 255, 0.3)'" onblur="this.style.borderColor='rgba(0, 212, 255, 0.5)'; this.style.boxShadow='none'">
                    </div>
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label for="new-key-plan" style="display: block; color: #00d4ff; margin-bottom: 8px; font-weight: 500;">Plan</label>
                        <select id="new-key-plan" style="width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.8); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); border-radius: 6px; font-size: 14px; transition: all 0.3s ease;" onfocus="this.style.borderColor='#00d4ff'; this.style.boxShadow='0 0 10px rgba(0, 212, 255, 0.3)'" onblur="this.style.borderColor='rgba(0, 212, 255, 0.5)'; this.style.boxShadow='none'">
                            <option value="1" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Free Plan</option>
                            <option value="2" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Pro Plan</option>
                            <option value="3" style="background: rgba(0, 0, 0, 0.9); color: #00d4ff;">Business Plan</option>
                        </select>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-outline" onclick="keyManager.generateRandomKey()" style="background: linear-gradient(45deg, #ff9800, #ffc107); color: #1a1a2e; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">Generate Random</button>
                        <button class="btn btn-primary" onclick="keyManager.addNewKey()" style="background: linear-gradient(45deg, #00d4ff, #00ff88); color: #1a1a2e; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-2px)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)'">Add Key</button>
                        <button class="btn btn-outline" onclick="this.closest('.modal').style.display='none'" style="background: rgba(0, 0, 0, 0.3); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.5); padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(0, 212, 255, 0.1)'; this.style.borderColor='#00d4ff'" onmouseout="this.style.background='rgba(0, 0, 0, 0.3)'; this.style.borderColor='rgba(0, 212, 255, 0.5)'">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Bulk operations
    async bulkGenerateKeys(count, planId) {
        try {
            console.log(`Generating ${count} keys for plan ${planId}`);
            
            const keys = [];
            for (let i = 0; i < count; i++) {
                const keyValue = this.generateKeyValue();
                keys.push({
                    key_value: keyValue,
                    plan_id: planId,
                    used: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }

            if (typeof supabase === 'undefined') {
                this.showNotification('Supabase client not available', 'error');
                return;
            }

            const { data, error } = await supabase
                .from('Key')
                .insert(keys)
                .select();

            if (error) {
                console.error('Error bulk generating keys:', error);
                this.showNotification('Error generating keys: ' + error.message, 'error');
                return;
            }

            // Reload keys
            await this.loadKeys();
            
            this.showNotification(`${count} keys generated successfully`, 'success');

        } catch (error) {
            console.error('Error bulk generating keys:', error);
            this.showNotification('Error generating keys: ' + error.message, 'error');
        }
    }

    // Generate a unique key value
    generateKeyValue() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Get key statistics
    getKeyStatistics() {
        const totalKeys = this.keys.length;
        const usedKeys = this.keys.filter(key => key.used === true).length;
        const availableKeys = totalKeys - usedKeys;
        
        const freeKeys = this.keys.filter(key => key.plan_id === 1).length;
        const proKeys = this.keys.filter(key => key.plan_id === 2).length;
        const businessKeys = this.keys.filter(key => key.plan_id === 3).length;

        return {
            total: totalKeys,
            used: usedKeys,
            available: availableKeys,
            free: freeKeys,
            pro: proKeys,
            business: businessKeys
        };
    }
}

// Global functions for backward compatibility
let keyManager;

// Initialize key manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    keyManager = new KeyManager();
    
    // Make functions globally available
    window.loadKeys = () => keyManager.loadKeys();
    window.addNewKey = () => keyManager.addNewKey();
    window.generateRandomKey = () => keyManager.generateRandomKey();
    window.editKey = (keyId, keyValue, planId, isUsed) => keyManager.editKey(keyId, keyValue, planId, isUsed);
    window.updateKey = () => keyManager.updateKey();
    window.generateRandomKeyForEdit = () => keyManager.generateRandomKeyForEdit();
    window.confirmDeleteKey = (keyId) => keyManager.confirmDeleteKey(keyId);
    window.deleteKey = (keyId) => keyManager.deleteKey(keyId);
    window.copyKey = (keyValue) => keyManager.copyKey(keyValue);
    window.showAddKeyModal = () => keyManager.showAddKeyModal();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeyManager;
}
