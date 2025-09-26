// InfinitePay API Integration
declare global {
  interface Window {
    Infinitepay?: {
      getUserData(): Promise<ApiResponse<UserData>>;
      receiveTapPayment(params: TapPaymentParams): Promise<ApiResponse<PaymentData>>;
      sendCheckoutPayment(url: string): Promise<ApiResponse<PaymentData>>;
    };
  }
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface UserData {
  id: string;
  name: string;
  handle: string;
  role: string;
}

export interface PaymentData {
  transactionNsu: string;
  amount: number;
  receiptUrl?: string;
}

export enum PaymentMethod {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export interface TapPaymentParams {
  amount: number;
  orderNsu: string;
  installments: number;
  paymentMethod: PaymentMethod | 'credit' | 'debit';
}

export interface TapPaymentData {
  amount: number;
  installments: number;
  paymentMethod: string;
  transactionNsu: string;
  orderNsu: string;
}

// Wait for InfinitePay API injection
export const waitForInfinitepay = async (): Promise<void> => {
  let attempts = 0;
  const maxAttempts = 20;

  while (!window.Infinitepay && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.Infinitepay) {
    throw new Error('InfinitePay API not available');
  }
};

// Get current user data
export const getInfinitepayUser = async (): Promise<UserData> => {
  await waitForInfinitepay();
  
  const response = await window.Infinitepay!.getUserData();
  
  if (response.status === 'success' && response.data) {
    return response.data;
  } else {
    throw new Error(response.message || 'Failed to get user data');
  }
};

// Process checkout payment
export const processCheckoutPayment = async (checkoutUrl: string): Promise<PaymentData> => {
  await waitForInfinitepay();
  
  const response = await window.Infinitepay!.sendCheckoutPayment(checkoutUrl);
  
  if (response.status === 'success' && response.data) {
    return response.data;
  } else {
    throw new Error(response.message || 'Payment failed');
  }
};

// Process tap payment (in-person card payment)
export const processTapPayment = async (params: TapPaymentParams): Promise<TapPaymentData> => {
  await waitForInfinitepay();
  
  const response = await window.Infinitepay!.receiveTapPayment(params);
  
  if (response.status === 'success' && response.data) {
    return response.data as TapPaymentData;
  } else {
    throw new Error(response.message || 'Payment failed');
  }
};