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
    console.log('Verifying payment via Supabase function:', { handle, transactionNsu, externalOrderNsu, slug });

    // Use Supabase client to call edge function (avoids CORS issues)
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        handle,
        transaction_nsu: transactionNsu,
        external_order_nsu: externalOrderNsu,
        slug
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    console.log('Payment verification result:', data);
    return data as PaymentVerificationResponse;
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