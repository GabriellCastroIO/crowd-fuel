import { useState, useEffect, useCallback } from 'react';
import { 
  getInfinitepayUser, 
  processCheckoutPayment, 
  processTapPayment,
  UserData, 
  PaymentData, 
  TapPaymentParams, 
  TapPaymentData 
} from '@/lib/infinitepay';

export function useInfinitepayAvailability() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = () => {
      setLoading(true);
      const available = typeof window !== 'undefined' && !!window.Infinitepay;
      setIsAvailable(available);
      setLoading(false);
    };

    // Check immediately
    checkAvailability();

    // Check after a delay to account for async loading
    const timeout = setTimeout(checkAvailability, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return { isAvailable, loading };
}

export function useInfinitepayUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await getInfinitepayUser();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading, error };
}

export function useCheckoutPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executePayment = useCallback(async (checkoutUrl: string): Promise<PaymentData | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await processCheckoutPayment(checkoutUrl);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executePayment, loading, error };
}

export function useTapPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeTapPayment = useCallback(async (params: TapPaymentParams): Promise<TapPaymentData | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await processTapPayment(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeTapPayment, loading, error };
}
