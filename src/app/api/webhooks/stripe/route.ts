import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { config, validateConfig } from '@/lib/config';
import { invoiceService } from '@/services/invoice-service';
import { pdfGenerator } from '@/services/pdf-generator';
import { emailService } from '@/services/email-service';
import { WebhookEvent } from '@/types/payment';

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    validateConfig();

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: WebhookEvent;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        config.stripe.webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(event: WebhookEvent) {
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log('Payment succeeded:', paymentIntent.id);

    // Extract customer information
    const customerEmail = paymentIntent.receipt_email || 
                         (paymentIntent.customer ? await getCustomerEmail(paymentIntent.customer as string) : null);
    
    if (!customerEmail) {
      console.error('No customer email found for payment intent:', paymentIntent.id);
      return;
    }

    // Create customer object
    const customer = invoiceService.createCustomerFromPayment(
      customerEmail,
      paymentIntent.metadata?.customer_name,
      undefined, // address would come from customer object in real app
      paymentIntent.metadata?.customer_phone
    );

    // Create invoice items from metadata or use defaults
    const items = invoiceService.createSampleInvoiceItems(paymentIntent.metadata);

    // Create invoice
    const invoice = await invoiceService.createInvoiceFromPayment(
      {
        success: true,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        payment_method: 'card',
        customer_id: customer.id,
        metadata: paymentIntent.metadata,
      },
      customer,
      items,
      paymentIntent.metadata
    );

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice);

    // Send invoice email
    const emailResult = await emailService.sendInvoiceEmail({
      customer_email: customerEmail,
      customer_name: customer.name,
      invoice,
      pdf_attachment: {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        type: 'application/pdf',
      },
    });

    if (emailResult.success) {
      console.log('Invoice email sent successfully:', emailResult.messageId);
    } else {
      console.error('Failed to send invoice email:', emailResult.error);
    }

    // Send payment confirmation email
    const confirmationResult = await emailService.sendPaymentConfirmationEmail(
      customerEmail,
      customer.name,
      invoice
    );

    if (confirmationResult.success) {
      console.log('Payment confirmation email sent successfully:', confirmationResult.messageId);
    } else {
      console.error('Failed to send confirmation email:', confirmationResult.error);
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(event: WebhookEvent) {
  try {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    console.log('Payment failed:', paymentIntent.id);
    
    // In a real application, you might want to:
    // 1. Update invoice status to 'failed'
    // 2. Send a payment failed notification email
    // 3. Log the failure for analysis
    
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

/**
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(event: WebhookEvent) {
  try {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('Checkout session completed:', session.id);

    // This is useful for handling Stripe Checkout sessions
    // You can extract line items and customer information here
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

/**
 * Get customer email from Stripe customer ID
 */
async function getCustomerEmail(customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer && !customer.deleted && customer.email) {
      return customer.email;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return null;
  }
}
