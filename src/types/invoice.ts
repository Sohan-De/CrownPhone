export interface Customer {
  id: string;
  email: string;
  name: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  phone?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax_amount: number;
  tax_rate: number;
  total_amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'card' | 'crypto' | 'bank_transfer';
  payment_intent_id?: string;
  transaction_id?: string;
  created_at: string;
  due_date: string;
  paid_at?: string;
  notes?: string;
  company_info: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo_url?: string;
  };
}

export interface PaymentWebhookData {
  id: string;
  object: string;
  type: string;
  data: {
    object: {
      id: string;
      object: string;
      amount: number;
      currency: string;
      status: string;
      payment_intent?: string;
      customer?: string;
      metadata?: Record<string, string>;
      created: number;
    };
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface InvoiceEmailData {
  customer_email: string;
  customer_name: string;
  invoice: Invoice;
  pdf_attachment: {
    filename: string;
    content: Buffer;
    type: string;
  };
}
