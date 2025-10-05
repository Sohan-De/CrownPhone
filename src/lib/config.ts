export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'CrownPhone',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  company: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'CrownPhone',
    address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '123 Tech Street, Digital City, DC 12345',
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '+1 (555) 123-4567',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@crownphone.com',
    website: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    fromEmail: process.env.FROM_EMAIL || 'noreply@crownphone.com',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  },
  invoice: {
    taxRate: 0.08, // 8% tax rate
    currency: 'USD',
    dueDays: 30,
  },
} as const;

// Validation function to ensure required environment variables are present
export function validateConfig() {
  const required = [
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
