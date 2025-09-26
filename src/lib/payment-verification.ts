// Payment verification utilities
import { supabase } from '@/integrations/supabase/client';

export interface PaymentVerificationParams {
  receipt_url: string;
  transaction_id: string;
  capture_method: string;
  order_nsu: string;
  slug: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  paid: boolean;
}

export async function verifyPayment(
  handle: string,
  transactionNsu: string,
  externalOrderNsu: string,
  slug: string
): Promise<PaymentVerificationResponse> {
  try {
    // Call InfinitePay API directly from frontend
    const url = `https://api.infinitepay.io/invoices/public/checkout/payment_check/${handle}`;
    const params = new URLSearchParams({
      transaction_nsu: transactionNsu,
      external_order_nsu: externalOrderNsu,
      slug
    });

    console.log('Verifying payment with InfinitePay:', { handle, transactionNsu, externalOrderNsu, slug });

    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('InfinitePay API error:', response.status, response.statusText);
      return {
        success: false,
        paid: false
      };
    }

    const verificationResult: PaymentVerificationResponse = await response.json();
    console.log('Payment verification result:', verificationResult);

    return verificationResult;
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      paid: false
    };
  }
}

export function parsePaymentParams(url: string): PaymentVerificationParams | null {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    const receipt_url = params.get('receipt_url');
    const transaction_id = params.get('transaction_id');
    const capture_method = params.get('capture_method');
    const order_nsu = params.get('order_nsu');
    const slug = params.get('slug');

    if (!receipt_url || !transaction_id || !capture_method || !order_nsu || !slug) {
      return null;
    }

    return {
      receipt_url,
      transaction_id,
      capture_method,
      order_nsu,
      slug
    };
  } catch (error) {
    console.error('Error parsing payment params:', error);
    return null;
  }
}