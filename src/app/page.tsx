'use client';

import { useState } from 'react';
import { InvoiceDemo } from '@/components/InvoiceDemo';

export default function Home() {
  return (
    <div className="invoice-container min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            CrownPhone Invoice System
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Automatic PDF invoice generation and email delivery
          </p>
          <div className="flex justify-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Stripe Integration
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Resend Email Service
            </span>
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              PDF Generation
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Automatic Email</h3>
            <p className="text-white/70">
              Automatically sends PDF invoices to customers after successful payments
            </p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2 text-white">PDF Generation</h3>
            <p className="text-white/70">
              Beautiful, professional PDF invoices with company branding
            </p>
          </div>
          
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Real-time</h3>
            <p className="text-white/70">
              Instant processing with Stripe webhooks and Resend email delivery
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <InvoiceDemo />

        {/* API Documentation */}
        <div className="card p-8 mt-12">
          <h2 className="text-2xl font-bold mb-6 text-white">API Endpoints</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="font-semibold text-white">POST /api/webhooks/stripe</h3>
              <p className="text-white/70 text-sm">
                Stripe webhook endpoint for automatic invoice generation
              </p>
            </div>
            
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="font-semibold text-white">POST /api/invoices/create</h3>
              <p className="text-white/70 text-sm">
                Create and send invoice manually
              </p>
            </div>
            
            <div className="border-l-4 border-purple-400 pl-4">
              <h3 className="font-semibold text-white">GET /api/invoices/[id]/pdf</h3>
              <p className="text-white/70 text-sm">
                Download invoice PDF by ID
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/60">
          <p>Built with Next.js, TypeScript, Stripe, and Resend</p>
        </div>
      </div>
    </div>
  );
}
