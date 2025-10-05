'use client';

import { useState } from 'react';

interface InvoiceData {
  customer: {
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
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    category?: string;
  }>;
  payment_method: 'card' | 'crypto' | 'bank_transfer';
  notes?: string;
}

export function InvoiceDemo() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<InvoiceData>({
    customer: {
      email: 'customer@example.com',
      name: 'John Doe',
      address: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'United States',
      },
      phone: '+1 (555) 123-4567',
    },
    items: [
      {
        name: 'CrownPhone Pro Plan',
        description: 'Advanced screen sharing with premium features',
        quantity: 1,
        unit_price: 9.99,
        category: 'subscription',
      },
    ],
    payment_method: 'card',
    notes: 'Thank you for your purchase!',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          category: 'general',
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateCustomer = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customer: { ...prev.customer, [field]: value },
    }));
  };

  const updateAddress = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        address: { ...prev.customer.address, [field]: value },
      },
    }));
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Create Invoice Demo</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Customer Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={formData.customer.name}
                onChange={(e) => updateCustomer('name', e.target.value)}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.customer.email}
                onChange={(e) => updateCustomer('email', e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.customer.phone || ''}
              onChange={(e) => updateCustomer('phone', e.target.value)}
              className="input-field"
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-white">Address</h4>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.customer.address?.line1 || ''}
                onChange={(e) => updateAddress('line1', e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.customer.address?.line2 || ''}
                onChange={(e) => updateAddress('line2', e.target.value)}
                className="input-field"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.customer.address?.city || ''}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.customer.address?.state || ''}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.customer.address?.postal_code || ''}
                  onChange={(e) => updateAddress('postal_code', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.customer.address?.country || ''}
                onChange={(e) => updateAddress('country', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Invoice Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary text-sm"
            >
              Add Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="grid md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Unit Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Method */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Payment Method</h3>
          
          <div className="flex gap-4">
            {(['card', 'crypto', 'bank_transfer'] as const).map((method) => (
              <label key={method} className="flex items-center">
                <input
                  type="radio"
                  name="payment_method"
                  value={method}
                  checked={formData.payment_method === method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                  className="mr-2"
                />
                <span className="text-white capitalize">
                  {method === 'bank_transfer' ? 'Bank Transfer' : method}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="input-field"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50"
          >
            {loading ? 'Creating Invoice...' : 'Create & Send Invoice'}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-4">✅ Invoice Created Successfully!</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Invoice ID:</strong> {result.invoice.id}</p>
            <p><strong>Invoice Number:</strong> {result.invoice.invoice_number}</p>
            <p><strong>Total Amount:</strong> ${result.invoice.total_amount}</p>
            <p><strong>Status:</strong> {result.invoice.status}</p>
            <p><strong>Email Sent:</strong> {result.email.sent ? 'Yes' : 'No'}</p>
            {result.email.message_id && (
              <p><strong>Message ID:</strong> {result.email.message_id}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Error</h3>
          <p className="text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
