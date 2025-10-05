import { Invoice, Customer, InvoiceItem } from '@/types/invoice';
import { PaymentResult } from '@/types/payment';
import { config } from '@/lib/config';
import { addDays } from 'date-fns';

export class InvoiceService {
  /**
   * Create a new invoice from payment data
   */
  async createInvoiceFromPayment(
    paymentResult: PaymentResult,
    customer: Customer,
    items: InvoiceItem[],
    metadata?: Record<string, string>
  ): Promise<Invoice> {
    const invoiceId = this.generateInvoiceId();
    const invoiceNumber = this.generateInvoiceNumber();
    const now = new Date();
    const dueDate = addDays(now, config.invoice.dueDays);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = Math.round(subtotal * config.invoice.taxRate * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoice: Invoice = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      customer,
      items,
      subtotal,
      tax_amount: taxAmount,
      tax_rate: config.invoice.taxRate,
      total_amount: totalAmount,
      currency: config.invoice.currency,
      status: paymentResult.success ? 'paid' : 'sent',
      payment_method: paymentResult.payment_method,
      payment_intent_id: paymentResult.payment_intent_id,
      transaction_id: paymentResult.transaction_id,
      created_at: now.toISOString(),
      due_date: dueDate.toISOString(),
      paid_at: paymentResult.success ? now.toISOString() : undefined,
      company_info: {
        name: config.company.name,
        address: config.company.address,
        phone: config.company.phone,
        email: config.company.email,
        website: config.company.website,
      },
    };

    // In a real application, you would save this to your database here
    // await this.saveInvoiceToDatabase(invoice);

    return invoice;
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: string,
    status: Invoice['status'],
    paymentIntentId?: string,
    transactionId?: string
  ): Promise<Invoice | null> {
    // In a real application, you would update the database here
    // const invoice = await this.getInvoiceFromDatabase(invoiceId);
    // if (!invoice) return null;
    
    // invoice.status = status;
    // if (paymentIntentId) invoice.payment_intent_id = paymentIntentId;
    // if (transactionId) invoice.transaction_id = transactionId;
    // if (status === 'paid') invoice.paid_at = new Date().toISOString();
    
    // await this.saveInvoiceToDatabase(invoice);
    // return invoice;

    // For demo purposes, return null
    return null;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    // In a real application, you would fetch from database
    // return await this.getInvoiceFromDatabase(invoiceId);
    return null;
  }

  /**
   * Get invoices by customer ID
   */
  async getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
    // In a real application, you would fetch from database
    // return await this.getInvoicesFromDatabase(customerId);
    return [];
  }

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const day = String(new Date().getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Create sample invoice items from payment metadata
   */
  createSampleInvoiceItems(metadata?: Record<string, string>): InvoiceItem[] {
    // This would typically come from your product database
    // For demo purposes, we'll create sample items based on metadata
    
    const items: InvoiceItem[] = [];
    
    if (metadata?.product_name && metadata?.product_price) {
      const quantity = parseInt(metadata.quantity || '1');
      const unitPrice = parseFloat(metadata.product_price);
      
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: metadata.product_name,
        description: metadata.product_description || 'Digital product purchase',
        quantity,
        unit_price: unitPrice,
        total_price: unitPrice * quantity,
        category: metadata.product_category || 'digital',
      });
    } else {
      // Default sample item
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: 'CrownPhone Pro Plan',
        description: 'Advanced screen sharing with premium features',
        quantity: 1,
        unit_price: 9.99,
        total_price: 9.99,
        category: 'subscription',
      });
    }

    return items;
  }

  /**
   * Create customer from payment data
   */
  createCustomerFromPayment(
    email: string,
    name?: string,
    address?: Customer['address'],
    phone?: string
  ): Customer {
    return {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: name || email.split('@')[0],
      address,
      phone,
    };
  }
}

// Export a singleton instance
export const invoiceService = new InvoiceService();
