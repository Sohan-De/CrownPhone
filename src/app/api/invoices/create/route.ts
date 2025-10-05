import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { invoiceService } from '@/services/invoice-service';
import { pdfGenerator } from '@/services/pdf-generator';
import { emailService } from '@/services/email-service';
import { validateConfig } from '@/lib/config';

// Validation schema for invoice creation
const createInvoiceSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    address: z.object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      postal_code: z.string().min(1),
      country: z.string().min(1),
    }).optional(),
    phone: z.string().optional(),
  }),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    category: z.string().optional(),
  })),
  payment_method: z.enum(['card', 'crypto', 'bank_transfer']),
  payment_intent_id: z.string().optional(),
  transaction_id: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validate configuration
    validateConfig();

    const body = await request.json();
    
    // Validate request body
    const validatedData = createInvoiceSchema.parse(body);
    
    // Create customer object
    const customer = invoiceService.createCustomerFromPayment(
      validatedData.customer.email,
      validatedData.customer.name,
      validatedData.customer.address,
      validatedData.customer.phone
    );

    // Create invoice items
    const items = validatedData.items.map((item, index) => ({
      id: `item_${Date.now()}_${index}`,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      category: item.category,
    }));

    // Create invoice
    const invoice = await invoiceService.createInvoiceFromPayment(
      {
        success: true,
        payment_intent_id: validatedData.payment_intent_id,
        transaction_id: validatedData.transaction_id,
        amount: items.reduce((sum, item) => sum + item.total_price, 0),
        currency: 'USD',
        payment_method: validatedData.payment_method,
        customer_id: customer.id,
      },
      customer,
      items
    );

    // Add notes if provided
    if (validatedData.notes) {
      invoice.notes = validatedData.notes;
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice);

    // Send invoice email
    const emailResult = await emailService.sendInvoiceEmail({
      customer_email: customer.email,
      customer_name: customer.name,
      invoice,
      pdf_attachment: {
        filename: `invoice-${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
        type: 'application/pdf',
      },
    });

    if (!emailResult.success) {
      console.error('Failed to send invoice email:', emailResult.error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invoice created but email failed to send',
          invoice_id: invoice.id,
          email_error: emailResult.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        status: invoice.status,
        total_amount: invoice.total_amount,
        currency: invoice.currency,
        created_at: invoice.created_at,
      },
      email: {
        sent: true,
        message_id: emailResult.messageId,
      },
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create invoice' 
      },
      { status: 500 }
    );
  }
}
