import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Heart, Home, Share2, AlertCircle, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { verifyPayment } from '@/lib/payment-verification';

export default function ApoioSucesso() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const verifyWebPayment = async () => {
      // Check if we have payment verification parameters from redirect
      const receipt_url = searchParams.get('receipt_url');
      const transaction_id = searchParams.get('transaction_id');
      const order_nsu = searchParams.get('order_nsu');
      const slug = searchParams.get('slug');

      if (!receipt_url || !transaction_id || !order_nsu || !slug) {
        // No payment params, likely came from InfinitePay direct payment
        return;
      }

      setVerifying(true);
      setVerificationError(null);

      try {
        // Extract apoio data from order_nsu (format: APOIO_timestamp_apoioId)
        const orderParts = order_nsu.split('_');
        if (orderParts.length < 2 || orderParts[0] !== 'APOIO') {
          throw new Error('Invalid order NSU format');
        }

        // Get apoio data to extract handle
        const apoioId = searchParams.get('apoio_id');
        if (!apoioId) {
          throw new Error('Missing apoio ID');
        }

        const { data: apoio, error: apoioError } = await supabase
          .from('apoios')
          .select('handle_infinitepay, titulo')
          .eq('id', apoioId)
          .single();

        if (apoioError) throw apoioError;

        // Verify payment with InfinitePay
        const verification = await verifyPayment(
          apoio.handle_infinitepay,
          transaction_id,
          order_nsu,
          slug
        );

        if (!verification.success || !verification.paid) {
          throw new Error('Payment verification failed');
        }

        // Payment verified, check if transaction already exists
        const nome = searchParams.get('nome');
        const email = searchParams.get('email');
        const valor = searchParams.get('valor');

        if (!nome || !email || !valor) {
          throw new Error('Missing supporter information');
        }

        // Check if transaction already exists to prevent duplicates
        const { data: existingTransaction } = await supabase
          .from('apoiadores')
          .select('id')
          .eq('transaction_nsu', transaction_id)
          .maybeSingle();

        if (existingTransaction) {
          // Transaction already saved, skip insertion but show success
          console.log('Transaction already exists, skipping duplicate save');
        } else {
          // Save new transaction to database
          await supabase
            .from('apoiadores')
            .insert({
              apoio_id: apoioId,
              nome,
              email,
              valor: parseInt(valor),
              transaction_nsu: transaction_id
            });
        }

        toast({
          title: 'Pagamento verificado!',
          description: 'Seu apoio foi confirmado com sucesso.',
        });

      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationError(error instanceof Error ? error.message : 'Erro na verificação');
        toast({
          title: 'Erro na verificação',
          description: 'Não foi possível verificar o pagamento.',
          variant: 'destructive',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyWebPayment();
  }, [searchParams, toast]);

  const compartilhar = async () => {
    // Em mobile, tenta compartilhar nativamente
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'ApoiaAI',
          text: 'Acabei de apoiar uma causa importante! Venha conhecer outros apoios incríveis.',
          url: window.location.origin,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
        // Se falhar no mobile, copia para clipboard como fallback
        navigator.clipboard.writeText(window.location.origin);
        toast({
          title: 'Link copiado!',
          description: 'O link foi copiado para a área de transferência.',
        });
      }
    } else {
      // Em desktop, sempre copia para área de transferência
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6 sm:pt-8 px-4 sm:px-8 pb-6 sm:pb-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Ícone de sucesso/loading/erro */}
            <div className="flex justify-center">
              <div className={`w-14 sm:w-16 h-14 sm:h-16 rounded-full flex items-center justify-center ${
                verifying
                  ? 'bg-blue-100 dark:bg-blue-900'
                  : verificationError
                    ? 'bg-red-100 dark:bg-red-900'
                    : 'bg-green-100 dark:bg-green-900'
              }`}>
                {verifying ? (
                  <Loader2 className="h-7 sm:h-8 w-7 sm:w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                ) : verificationError ? (
                  <AlertCircle className="h-7 sm:h-8 w-7 sm:w-8 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle className="h-7 sm:h-8 w-7 sm:w-8 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>

            {/* Título e mensagem */}
            <div className="space-y-2">
              <h1 className={`text-xl sm:text-2xl font-bold ${
                verifying
                  ? 'text-blue-600 dark:text-blue-400'
                  : verificationError
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
              }`}>
                {verifying
                  ? 'Verificando Pagamento...'
                  : verificationError
                    ? 'Erro na Verificação'
                    : 'Apoio Realizado!'
                }
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground px-2">
                {verifying
                  ? 'Aguarde enquanto verificamos seu pagamento.'
                  : verificationError
                    ? 'Não foi possível verificar seu pagamento. Entre em contato conosco.'
                    : 'Obrigado por apoiar esta causa! Seu apoio faz toda a diferença.'
                }
              </p>
            </div>

            {/* Ilustração */}
            <div className="py-3 sm:py-4">
              <Heart className="h-10 sm:h-12 w-10 sm:w-12 text-primary mx-auto animate-pulse" />
            </div>

            {/* Informações adicionais */}
            <div className="bg-muted/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
              <p>
                O valor será destinado diretamente para o criador do apoio.
              </p>
            </div>

            {/* Botões de ação */}
            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={() => navigate('/')}
                className="w-full"
                size={isMobile ? "default" : "lg"}
              >
                <Home className="h-4 w-4 mr-2" />
                Ver outros apoios
              </Button>
              
              <Button 
                variant="outline"
                onClick={compartilhar}
                className="w-full"
                size={isMobile ? "default" : "default"}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Mensagem motivacional */}
            <div className="pt-3 sm:pt-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground">
                💡 <strong>Você sabia?</strong> Cada apoio, por menor que seja, 
                pode transformar a vida de alguém. Continue espalhando o bem!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}