# How to Update Products in Supabase

## Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `itrumucqoahjpqoystvi`

## Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query"

## Step 3: Run the Migration
1. Copy the entire content from `migrations/replace_products_with_new_data.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the migration

## What This Migration Does:
- **Deletes** all existing products (3 old products)
- **Inserts** 10 new products with proper categorization:
  - **3 Featured Products**: VoltShield Pro, FortiBox 3000, CoreProtect X-Series
  - **3 New Products**: CircuitVault X1, PulseGuard Enclosure, AeroGuard Casing
  - **4 Regular Products**: SafeCore Unit, ThermaFlow Case, NexaVault Enclosure, EdgeShield Enclosure

## Product Categories:
- **Featured + New**: VoltShield Pro, FortiBox 3000 (will show in both sections)
- **Featured Only**: CoreProtect X-Series (will show in featured section)
- **New Only**: CircuitVault X1, PulseGuard Enclosure, AeroGuard Casing (will show in new arrivals swiper)
- **Regular**: SafeCore Unit, ThermaFlow Case, NexaVault Enclosure, EdgeShield Enclosure (will show in product list)

## After Running the Migration:
1. Your home page will show the new featured products
2. The new arrivals swiper will show the new products
3. The product list page will show all 10 products
4. The admin dashboard will allow you to manage these new products

## Verification:
The migration includes a SELECT query at the end to verify all products were inserted correctly.
