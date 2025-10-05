export interface StripePaymentIntent {
  id: string;
  object: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
  payment_method?: string;
  receipt_email?: string;
  created: number;
}

export interface CryptoPaymentData {
  currency: 'BTC' | 'ETH' | 'USDC' | 'USDT';
  amount: number;
  address: string;
  transaction_hash?: string;
  confirmation_count?: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface PaymentResult {
  success: boolean;
  payment_intent_id?: string;
  transaction_id?: string;
  error?: string;
  amount: number;
  currency: string;
  payment_method: 'card' | 'crypto' | 'bank_transfer';
  customer_id?: string;
  metadata?: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string;
    idempotency_key: string;
  };
}
