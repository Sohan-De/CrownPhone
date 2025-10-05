import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'CrownPhone Invoice System',
  description: 'Automatic PDF invoice generation and email delivery system',
  keywords: ['invoice', 'pdf', 'email', 'payments', 'stripe', 'resend'],
  authors: [{ name: 'CrownPhone Team' }],
  openGraph: {
    title: 'CrownPhone Invoice System',
    description: 'Automatic PDF invoice generation and email delivery system',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={`${poppins.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
