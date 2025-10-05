# CrownPhone Invoice System

A complete Next.js application that automatically generates PDF invoices and sends them via email after successful payments using Stripe and Resend.com.

## 🚀 Features

- **Automatic Invoice Generation**: Creates professional PDF invoices after successful payments
- **Email Delivery**: Sends invoices via Resend.com with beautiful HTML templates
- **Stripe Integration**: Webhook-based payment processing with automatic triggers
- **PDF Generation**: High-quality PDF invoices with company branding
- **TypeScript**: Fully typed for better development experience
- **Responsive Design**: Modern UI with Tailwind CSS
- **Real-time Processing**: Instant invoice generation and email delivery

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Generation**: jsPDF
- **Email Service**: Resend.com
- **Payment Processing**: Stripe
- **Date Handling**: date-fns
- **Validation**: Zod

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Stripe account with API keys
- A Resend.com account with API key
- Git installed

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd crownphone-invoice-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# Resend.com Configuration
RESEND_API_KEY=re_your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME=CrownPhone
NEXT_PUBLIC_COMPANY_ADDRESS=123 Tech Street, Digital City, DC 12345
NEXT_PUBLIC_COMPANY_PHONE=+1 (555) 123-4567
NEXT_PUBLIC_COMPANY_EMAIL=support@crownphone.com
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Stripe Setup

1. **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: 
   - Go to Developers > API Keys
   - Copy your Publishable key and Secret key
3. **Create Webhook Endpoint**:
   - Go to Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
   - Copy the webhook signing secret

### Resend Setup

1. **Create a Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Get API Key**: 
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)
3. **Verify Domain**: Add and verify your sending domain
4. **Set From Email**: Use a verified email address

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── webhooks/      # Stripe webhooks
│   │   └── invoices/      # Invoice management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   └── InvoiceDemo.tsx    # Demo component
├── lib/                   # Utilities
│   └── config.ts          # Configuration
├── services/              # Business logic
│   ├── email-service.ts   # Email handling
│   ├── invoice-service.ts # Invoice management
│   └── pdf-generator.ts   # PDF generation
└── types/                 # TypeScript types
    ├── invoice.ts         # Invoice types
    └── payment.ts         # Payment types
```

## 🔌 API Endpoints

### Webhook Endpoints

#### `POST /api/webhooks/stripe`
Handles Stripe webhook events for automatic invoice generation.

**Events Handled:**
- `payment_intent.succeeded` - Creates and sends invoice
- `payment_intent.payment_failed` - Logs failed payments
- `checkout.session.completed` - Handles checkout completions

### Invoice Endpoints

#### `POST /api/invoices/create`
Creates a new invoice and sends it via email.

**Request Body:**
```json
{
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "address": {
      "line1": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "postal_code": "10001",
      "country": "United States"
    },
    "phone": "+1 (555) 123-4567"
  },
  "items": [
    {
      "name": "CrownPhone Pro Plan",
      "description": "Advanced screen sharing",
      "quantity": 1,
      "unit_price": 9.99,
      "category": "subscription"
    }
  ],
  "payment_method": "card",
  "notes": "Thank you for your purchase!"
}
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": "inv_1234567890_abc123",
    "invoice_number": "INV-20241201-001",
    "status": "paid",
    "total_amount": 10.79,
    "currency": "USD",
    "created_at": "2024-12-01T10:00:00Z"
  },
  "email": {
    "sent": true,
    "message_id": "msg_1234567890"
  }
}
```

#### `GET /api/invoices/[id]/pdf`
Downloads the PDF invoice by ID.

**Response:** PDF file with appropriate headers.

## 🎨 Customization

### Company Information

Update company details in `src/lib/config.ts`:

```typescript
export const config = {
  company: {
    name: 'Your Company Name',
    address: 'Your Company Address',
    phone: '+1 (555) 123-4567',
    email: 'support@yourcompany.com',
    website: 'https://yourcompany.com',
  },
  // ... other config
};
```

### Invoice Styling

Modify the PDF generation in `src/services/pdf-generator.ts`:

- Colors: Update the color scheme
- Logo: Add company logo
- Layout: Customize invoice layout
- Fonts: Change typography

### Email Templates

Customize email templates in `src/services/email-service.ts`:

- HTML templates for invoice emails
- Payment confirmation emails
- Company branding and styling

## 🧪 Testing

### Manual Testing

1. **Test Invoice Creation**:
   - Use the demo form on the homepage
   - Fill in customer and item details
   - Submit and check email delivery

2. **Test Stripe Webhook**:
   - Use Stripe CLI for local testing
   - Forward webhooks to local server
   - Process test payments

### Stripe CLI Testing

```bash
# Install Stripe CLI
npm install -g @stripe/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   - Import your GitHub repository to Vercel
   - Configure build settings

2. **Environment Variables**:
   - Add all environment variables in Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` to your domain

3. **Deploy**:
   - Deploy automatically on push to main branch
   - Update Stripe webhook URL to production

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use Next.js build command
- **Railway**: Deploy with environment variables
- **DigitalOcean**: Use App Platform
- **AWS**: Deploy with Amplify or ECS

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **Input Validation**: Use Zod schemas for all inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **HTTPS**: Always use HTTPS in production

## 🐛 Troubleshooting

### Common Issues

1. **Email Not Sending**:
   - Check Resend API key
   - Verify domain authentication
   - Check email address format

2. **PDF Generation Fails**:
   - Ensure jsPDF is properly installed
   - Check for missing dependencies
   - Verify invoice data structure

3. **Stripe Webhook Issues**:
   - Verify webhook secret
   - Check endpoint URL
   - Ensure proper event handling

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:

- Email: support@crownphone.com
- Documentation: [Project Wiki](https://github.com/your-repo/wiki)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Stripe](https://stripe.com/) - Payment processing
- [Resend](https://resend.com/) - Email delivery
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Built with ❤️ by the CrownPhone Team**
