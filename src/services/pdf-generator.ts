import jsPDF from 'jspdf';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { config } from '@/lib/config';
import { format } from 'date-fns';

export class PDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  /**
   * Generate a PDF invoice from invoice data
   */
  async generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
    this.doc = new jsPDF();
    
    // Set up the document
    this.setupDocument();
    
    // Add header
    this.addHeader(invoice);
    
    // Add customer information
    this.addCustomerInfo(invoice);
    
    // Add invoice details
    this.addInvoiceDetails(invoice);
    
    // Add items table
    this.addItemsTable(invoice.items);
    
    // Add totals
    this.addTotals(invoice);
    
    // Add footer
    this.addFooter();
    
    // Return as Buffer
    return Buffer.from(this.doc.output('arraybuffer'));
  }

  private setupDocument() {
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
  }

  private addHeader(invoice: Invoice) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Company logo and info (left side)
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 212, 255); // Primary blue color
    this.doc.text(config.company.name, margin, 30);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(config.company.address, margin, 40);
    this.doc.text(`Phone: ${config.company.phone}`, margin, 45);
    this.doc.text(`Email: ${config.company.email}`, margin, 50);
    
    // Invoice title and number (right side)
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('INVOICE', pageWidth - margin - 30, 30);
    
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`#${invoice.invoice_number}`, pageWidth - margin - 30, 40);
    
    // Status badge
    this.addStatusBadge(invoice.status, pageWidth - margin - 30, 50);
    
    // Add a line separator
    this.doc.setDrawColor(0, 212, 255);
    this.doc.setLineWidth(0.5);
    this.doc.line(margin, 60, pageWidth - margin, 60);
  }

  private addStatusBadge(status: string, x: number, y: number) {
    const statusColors: Record<string, [number, number, number]> = {
      'paid': [0, 255, 136], // Green
      'sent': [0, 212, 255], // Blue
      'overdue': [255, 87, 51], // Red
      'draft': [128, 128, 128], // Gray
      'cancelled': [255, 87, 51], // Red
    };
    
    const color = statusColors[status] || [128, 128, 128];
    this.doc.setFillColor(color[0], color[1], color[2]);
    this.doc.roundedRect(x - 15, y - 5, 30, 8, 2, 2, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(status.toUpperCase(), x - 12, y + 1);
  }

  private addCustomerInfo(invoice: Invoice) {
    const margin = 20;
    let yPosition = 80;
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Bill To:', margin, yPosition);
    
    yPosition += 10;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(invoice.customer.name, margin, yPosition);
    
    if (invoice.customer.address) {
      yPosition += 5;
      this.doc.text(invoice.customer.address.line1, margin, yPosition);
      
      if (invoice.customer.address.line2) {
        yPosition += 5;
        this.doc.text(invoice.customer.address.line2, margin, yPosition);
      }
      
      yPosition += 5;
      this.doc.text(
        `${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.postal_code}`,
        margin,
        yPosition
      );
      
      yPosition += 5;
      this.doc.text(invoice.customer.address.country, margin, yPosition);
    }
    
    if (invoice.customer.phone) {
      yPosition += 5;
      this.doc.text(`Phone: ${invoice.customer.phone}`, margin, yPosition);
    }
    
    yPosition += 5;
    this.doc.text(`Email: ${invoice.customer.email}`, margin, yPosition);
  }

  private addInvoiceDetails(invoice: Invoice) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    const rightColumn = pageWidth - margin - 60;
    let yPosition = 80;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Invoice date
    this.doc.text('Invoice Date:', rightColumn, yPosition);
    this.doc.text(format(new Date(invoice.created_at), 'MMM dd, yyyy'), rightColumn + 40, yPosition);
    
    yPosition += 8;
    this.doc.text('Due Date:', rightColumn, yPosition);
    this.doc.text(format(new Date(invoice.due_date), 'MMM dd, yyyy'), rightColumn + 40, yPosition);
    
    yPosition += 8;
    this.doc.text('Payment Method:', rightColumn, yPosition);
    this.doc.text(this.formatPaymentMethod(invoice.payment_method), rightColumn + 40, yPosition);
    
    if (invoice.payment_intent_id) {
      yPosition += 8;
      this.doc.text('Transaction ID:', rightColumn, yPosition);
      this.doc.text(invoice.payment_intent_id, rightColumn + 40, yPosition);
    }
  }

  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      'card': 'Credit/Debit Card',
      'crypto': 'Cryptocurrency',
      'bank_transfer': 'Bank Transfer',
    };
    return methods[method] || method;
  }

  private addItemsTable(items: InvoiceItem[]) {
    const margin = 20;
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const tableWidth = pageWidth - (margin * 2);
    let yPosition = 140;
    
    // Table header
    this.doc.setFillColor(0, 212, 255);
    this.doc.rect(margin, yPosition - 8, tableWidth, 8, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    this.doc.text('Item', margin + 5, yPosition - 2);
    this.doc.text('Description', margin + 60, yPosition - 2);
    this.doc.text('Qty', margin + 120, yPosition - 2);
    this.doc.text('Unit Price', margin + 140, yPosition - 2);
    this.doc.text('Total', margin + 170, yPosition - 2);
    
    // Table rows
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
    
    items.forEach((item, index) => {
      yPosition += 8;
      
      // Alternate row colors
      if (index % 2 === 0) {
        this.doc.setFillColor(248, 249, 250);
        this.doc.rect(margin, yPosition - 8, tableWidth, 8, 'F');
      }
      
      this.doc.text(item.name, margin + 5, yPosition - 2);
      this.doc.text(item.description || '', margin + 60, yPosition - 2);
      this.doc.text(item.quantity.toString(), margin + 120, yPosition - 2);
      this.doc.text(`$${item.unit_price.toFixed(2)}`, margin + 140, yPosition - 2);
      this.doc.text(`$${item.total_price.toFixed(2)}`, margin + 170, yPosition - 2);
    });
  }

  private addTotals(invoice: Invoice) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    const rightColumn = pageWidth - margin - 60;
    let yPosition = 200;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(0, 0, 0);
    
    // Subtotal
    this.doc.text('Subtotal:', rightColumn, yPosition);
    this.doc.text(`$${invoice.subtotal.toFixed(2)}`, rightColumn + 40, yPosition);
    
    yPosition += 8;
    this.doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(1)}%):`, rightColumn, yPosition);
    this.doc.text(`$${invoice.tax_amount.toFixed(2)}`, rightColumn + 40, yPosition);
    
    // Total line
    yPosition += 12;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Total:', rightColumn, yPosition);
    this.doc.text(`$${invoice.total_amount.toFixed(2)}`, rightColumn + 40, yPosition);
    
    // Add a line above total
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    this.doc.line(rightColumn, yPosition - 4, rightColumn + 60, yPosition - 4);
  }

  private addFooter() {
    const pageHeight = this.doc.internal.pageSize.getHeight();
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const margin = 20;
    const yPosition = pageHeight - 30;
    
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);
    
    this.doc.text('Thank you for your business!', margin, yPosition);
    this.doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy')}`, pageWidth - margin - 50, yPosition);
    
    // Add company website
    this.doc.text(`Visit us at: ${config.company.website}`, margin, yPosition + 8);
  }
}

// Export a singleton instance
export const pdfGenerator = new PDFGenerator();
