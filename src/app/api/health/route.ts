import { NextResponse } from 'next/server';
import { validateConfig } from '@/lib/config';

export async function GET() {
  try {
    // Validate configuration
    validateConfig();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        resend: 'configured',
        stripe: 'configured',
        pdf: 'ready',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
