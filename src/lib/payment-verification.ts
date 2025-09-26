// Payment verification utilities

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
  const url = `https://api.infinitepay.io/invoices/public/checkout/payment_check/${handle}`;

  const params = new URLSearchParams({
    transaction_nsu: transactionNsu,
    external_order_nsu: externalOrderNsu,
    slug: slug
  });

  try {
    const response = await fetch(`${url}?${params}`);

    if (!response.ok) {
      throw new Error(`Payment verification failed: ${response.status}`);
    }

    const data: PaymentVerificationResponse = await response.json();
    return data;
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