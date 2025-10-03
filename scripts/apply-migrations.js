// Apply database migrations script
// Run this script to set up or update the database schema

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Starting database migrations...');
    
    try {
        // Check if Supabase is initialized
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Apply migrations in order
        await applyMigration('create_products_table.sql');
        await applyMigration('add_long_description_and_specifications.sql');
        await applyMigration('add_multiple_images_support.sql');
        await applyMigration('create_user_purchases_table.sql');
        await applyMigration('replace_products_with_new_data.sql');
        
        console.log('All migrations completed successfully!');
        showSuccess();
        
    } catch (error) {
        console.error('Migration failed:', error);
        showError('Database migration failed: ' + error.message);
    }
});

// Apply a single migration file
async function applyMigration(filename) {
    try {
        console.log(`Applying migration: ${filename}...`);
        
        // Fetch migration SQL from file
        const response = await fetch(`/migrations/${filename}`);
        
        if (!response.ok) {
            throw new Error(`Could not load migration file: ${filename}`);
        }
        
        const sql = await response.text();
        
        // Execute SQL using Supabase
        const { error } = await supabase.rpc('apply_migration', { sql_content: sql });
        
        if (error) {
            console.error(`Migration error in ${filename}:`, error);
            throw new Error(`Migration ${filename} failed: ${error.message}`);
        }
        
        console.log(`Migration ${filename} applied successfully`);
        
    } catch (error) {
        console.error(`Error applying migration ${filename}:`, error);
        throw error;
    }
}

// Show success message
function showSuccess() {
    const container = document.getElementById('migration-container');
    if (container) {
        container.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>Database Setup Complete</h3>
                <p>All migrations have been applied successfully.</p>
                <button class="btn btn-primary" onclick="window.location.href='index.html'">Go to Homepage</button>
            </div>
        `;
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById('migration-container');
    if (container) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Migration Error</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">Try Again</button>
            </div>
        `;
    }
}
