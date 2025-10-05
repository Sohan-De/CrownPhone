import { Resend } from 'resend';
import { Invoice, InvoiceEmailData, EmailTemplate } from '@/types/invoice';
import { config } from '@/lib/config';
import { format } from 'date-fns';

export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(config.resend.apiKey);
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(emailData: InvoiceEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.generateInvoiceEmailTemplate(emailData.invoice);
      
      const { data, error } = await this.resend.emails.send({
        from: config.resend.fromEmail,
        to: [emailData.customer_email],
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: [
          {
            filename: emailData.pdf_attachment.filename,
            content: emailData.pdf_attachment.content,
            type: emailData.pdf_attachment.type,
          },
        ],
        tags: [
          { name: 'type', value: 'invoice' },
          { name: 'invoice_id', value: emailData.invoice.id },
          { name: 'customer_id', value: emailData.invoice.customer.id },
        ],
      });

      if (error) {
        console.error('Resend email error:', error);
        return { success: false, error: error.message };
      }

      console.log('Invoice email sent successfully:', data);
      return { success: true, messageId: data?.id };

    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmationEmail(
    customerEmail: string,
    customerName: string,
    invoice: Invoice
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const template = this.generatePaymentConfirmationTemplate(customerName, invoice);
      
      const { data, error } = await this.resend.emails.send({
        from: config.resend.fromEmail,
        to: [customerEmail],
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'type', value: 'payment_confirmation' },
          { name: 'invoice_id', value: invoice.id },
          { name: 'customer_id', value: invoice.customer.id },
        ],
      });

      if (error) {
        console.error('Resend email error:', error);
        return { success: false, error: error.message };
      }

      console.log('Payment confirmation email sent successfully:', data);
      return { success: true, messageId: data?.id };

    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate invoice email template
   */
  private generateInvoiceEmailTemplate(invoice: Invoice): EmailTemplate {
    const invoiceDate = format(new Date(invoice.created_at), 'MMMM dd, yyyy');
    const dueDate = format(new Date(invoice.due_date), 'MMMM dd, yyyy');
    
    const subject = `Invoice #${invoice.invoice_number} from ${config.company.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${invoice.invoice_number}</title>
          <style>
            body {
              font-family: 'Poppins', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
              color: white;
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              opacity: 0.9;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .invoice-info h3 {
              color: #00d4ff;
              margin: 0 0 10px 0;
            }
            .invoice-info p {
              margin: 5px 0;
              color: #666;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background: #00d4ff;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            .items-table td {
              padding: 12px;
              border-bottom: 1px solid #eee;
            }
            .items-table tr:nth-child(even) {
              background: #f8f9fa;
            }
            .total-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
            }
            .total-final {
              font-weight: bold;
              font-size: 18px;
              color: #00d4ff;
              border-top: 2px solid #00d4ff;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            .footer p {
              margin: 5px 0;
              color: #666;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(45deg, #00d4ff, #00ff88);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #00ff88; color: white; }
            .status-sent { background: #00d4ff; color: white; }
            .status-overdue { background: #ff5733; color: white; }
            .status-draft { background: #999; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice #${invoice.invoice_number}</h1>
            <p>Thank you for your business!</p>
          </div>
          
          <div class="content">
            <div class="invoice-details">
              <div class="invoice-info">
                <h3>Invoice Details</h3>
                <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
                <p><strong>Due Date:</strong> ${dueDate}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status}</span></p>
                <p><strong>Payment Method:</strong> ${this.formatPaymentMethod(invoice.payment_method)}</p>
              </div>
              <div class="invoice-info">
                <h3>Bill To</h3>
                <p><strong>${invoice.customer.name}</strong></p>
                <p>${invoice.customer.email}</p>
                ${invoice.customer.address ? `
                  <p>${invoice.customer.address.line1}</p>
                  ${invoice.customer.address.line2 ? `<p>${invoice.customer.address.line2}</p>` : ''}
                  <p>${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postal_code}</p>
                  <p>${invoice.customer.address.country}</p>
                ` : ''}
                ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unit_price.toFixed(2)}</td>
                    <td>$${item.total_price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>$${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax (${(invoice.tax_rate * 100).toFixed(1)}%):</span>
                <span>$${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div class="total-row total-final">
                <span>Total:</span>
                <span>$${invoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            ${invoice.status === 'paid' ? `
              <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #00ff88;">✅ Payment Received</h3>
                <p>Thank you for your payment! Your invoice has been marked as paid.</p>
              </div>
            ` : `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${config.app.url}/pay/${invoice.id}" class="cta-button">Pay Now</a>
              </div>
            `}

            ${invoice.notes ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #333;">Notes:</h4>
                <p style="margin: 0; color: #666;">${invoice.notes}</p>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <p><strong>${config.company.name}</strong></p>
            <p>${config.company.address}</p>
            <p>Phone: ${config.company.phone} | Email: ${config.company.email}</p>
            <p>Visit us at: <a href="${config.company.website}">${config.company.website}</a></p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              This invoice was generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'h:mm a')}
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Invoice #${invoice.invoice_number} from ${config.company.name}

Invoice Details:
- Invoice Date: ${invoiceDate}
- Due Date: ${dueDate}
- Status: ${invoice.status}
- Payment Method: ${this.formatPaymentMethod(invoice.payment_method)}

Bill To:
${invoice.customer.name}
${invoice.customer.email}
${invoice.customer.address ? `
${invoice.customer.address.line1}
${invoice.customer.address.line2 || ''}
${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postal_code}
${invoice.customer.address.country}
` : ''}
${invoice.customer.phone ? `Phone: ${invoice.customer.phone}` : ''}

Items:
${invoice.items.map(item => 
  `${item.name} - ${item.description || ''} | Qty: ${item.quantity} | Unit Price: $${item.unit_price.toFixed(2)} | Total: $${item.total_price.toFixed(2)}`
).join('\n')}

Totals:
Subtotal: $${invoice.subtotal.toFixed(2)}
Tax (${(invoice.tax_rate * 100).toFixed(1)}%): $${invoice.tax_amount.toFixed(2)}
Total: $${invoice.total_amount.toFixed(2)}

${invoice.status === 'paid' ? 
  '✅ Payment Received - Thank you for your payment!' : 
  `Pay Now: ${config.app.url}/pay/${invoice.id}`
}

${config.company.name}
${config.company.address}
Phone: ${config.company.phone} | Email: ${config.company.email}
Website: ${config.company.website}

Generated on ${format(new Date(), 'MMMM dd, yyyy')} at ${format(new Date(), 'h:mm a')}
    `;

    return { subject, html, text };
  }

  /**
   * Generate payment confirmation email template
   */
  private generatePaymentConfirmationTemplate(customerName: string, invoice: Invoice): EmailTemplate {
    const subject = `Payment Confirmation - Invoice #${invoice.invoice_number}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
          <style>
            body {
              font-family: 'Poppins', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              background: linear-gradient(45deg, #00ff88, #00d4ff);
              color: white;
              padding: 30px;
              border-radius: 12px 12px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              background: white;
              padding: 30px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .success-icon {
              text-align: center;
              font-size: 48px;
              color: #00ff88;
              margin: 20px 0;
            }
            .confirmation-details {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Payment Confirmed!</h1>
            <p>Thank you for your payment</p>
          </div>
          
          <div class="content">
            <div class="success-icon">✅</div>
            
            <h2>Hello ${customerName},</h2>
            
            <p>We're pleased to confirm that your payment has been successfully processed!</p>
            
            <div class="confirmation-details">
              <h3>Payment Details</h3>
              <p><strong>Invoice Number:</strong> #${invoice.invoice_number}</p>
              <p><strong>Amount Paid:</strong> $${invoice.total_amount.toFixed(2)}</p>
              <p><strong>Payment Method:</strong> ${this.formatPaymentMethod(invoice.payment_method)}</p>
              <p><strong>Transaction Date:</strong> ${format(new Date(), 'MMMM dd, yyyy')}</p>
              ${invoice.payment_intent_id ? `<p><strong>Transaction ID:</strong> ${invoice.payment_intent_id}</p>` : ''}
            </div>

            <p>Your invoice has been marked as paid and a receipt has been generated. You can download your invoice PDF from the attachment in this email.</p>
            
            <p>If you have any questions about this payment or need assistance, please don't hesitate to contact our support team.</p>
          </div>

          <div class="footer">
            <p><strong>${config.company.name}</strong></p>
            <p>${config.company.address}</p>
            <p>Phone: ${config.company.phone} | Email: ${config.company.email}</p>
            <p>Visit us at: <a href="${config.company.website}">${config.company.website}</a></p>
          </div>
        </body>
      </html>
    `;

    const text = `
Payment Confirmation - Invoice #${invoice.invoice_number}

Hello ${customerName},

We're pleased to confirm that your payment has been successfully processed!

Payment Details:
- Invoice Number: #${invoice.invoice_number}
- Amount Paid: $${invoice.total_amount.toFixed(2)}
- Payment Method: ${this.formatPaymentMethod(invoice.payment_method)}
- Transaction Date: ${format(new Date(), 'MMMM dd, yyyy')}
${invoice.payment_intent_id ? `- Transaction ID: ${invoice.payment_intent_id}` : ''}

Your invoice has been marked as paid and a receipt has been generated. You can download your invoice PDF from the attachment in this email.

If you have any questions about this payment or need assistance, please don't hesitate to contact our support team.

${config.company.name}
${config.company.address}
Phone: ${config.company.phone} | Email: ${config.company.email}
Website: ${config.company.website}
    `;

    return { subject, html, text };
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'card': 'Credit/Debit Card',
      'crypto': 'Cryptocurrency',
      'bank_transfer': 'Bank Transfer',
    };
    return methods[method] || method;
  }
}

// Export a singleton instance
export const emailService = new EmailService();
