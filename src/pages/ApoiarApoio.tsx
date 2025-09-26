import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Heart, ArrowLeft, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCheckoutPayment } from '@/hooks/useInfinitepay';
import { useIsMobile, useDeviceInfo } from '@/hooks/use-mobile';

interface Apoio {
  id: string;
  titulo: string;
  descricao: string;
  meta_valor: number;
  valor_atual: number;
  imagem_url?: string;
  handle_infinitepay: string;
  user_id: string;
  created_at: string;
  status?: string;
}

export default function ApoiarApoio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executePayment, loading: paymentLoading } = useCheckoutPayment();
  const isMobile = useIsMobile();
  const { isWebView } = useDeviceInfo();
  
  const [apoio, setApoio] = useState<Apoio | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form state
  const [valor, setValor] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  // Utility functions for currency formatting
  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '');

    if (!numericValue || numericValue === '0' || numericValue === '00') {
      return '';
    }

    const cents = parseInt(numericValue);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;

    return `${reais},${centavos.toString().padStart(2, '0')}`;
  };

  const parseValueToCents = (value: string): number => {
    if (!value) return 0;
    const numericValue = value.replace(/[^\d]/g, '');
    return parseInt(numericValue || '0');
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numericOnly = input.replace(/[^\d]/g, '');

    if (numericOnly.length <= 6) {
      const formattedValue = formatCurrency(numericOnly);
      setValor(formattedValue);
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 20) {
      setNome(input);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 100) {
      setEmail(input);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchApoio = async () => {
      try {
        const { data: apoioData, error: apoioError } = await supabase
          .from('apoios')
          .select('*')
          .eq('id', id)
          .single();

        if (apoioError) throw apoioError;
        setApoio(apoioData);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Erro ao carregar apoio:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do apoio.',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchApoio();
  }, [id, toast, navigate]);

  const handleApoiar = async () => {
    if (!apoio || !valor || !nome || !email) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para continuar.',
        variant: 'destructive',
      });
      return;
    }

    // Check if campaign is already completed
    if (apoio.valor_atual >= apoio.meta_valor || apoio.status === 'concluido') {
      toast({
        title: 'Campanha finalizada',
        description: 'Esta campanha foi finalizada e não pode receber mais apoios.',
        variant: 'destructive',
      });
      return;
    }

    // Validate name length
    if (nome.length < 3) {
      toast({
        title: 'Nome inválido',
        description: 'O nome deve ter pelo menos 3 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um endereço de email válido.',
        variant: 'destructive',
      });
      return;
    }

    const valorCentavos = parseValueToCents(valor);

    if (valorCentavos < 100) {
      toast({
        title: 'Valor inválido',
        description: 'O valor mínimo para apoio é R$ 1,00.',
        variant: 'destructive',
      });
      return;
    }

    // Check if value exceeds remaining amount needed
    const valorRestante = apoio.meta_valor - apoio.valor_atual;
    if (valorCentavos > valorRestante) {
      const valorRestanteReais = valorRestante / 100;
      toast({
        title: 'Valor muito alto',
        description: `O valor máximo que pode ser apoiado é R$ ${valorRestanteReais.toFixed(2).replace('.', ',')}.`,
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Create checkout via edge function
      const orderNsu = `APOIO_${Date.now()}_${apoio.id}`;
      const redirectUrl = new URL(`${window.location.origin}/apoio-sucesso`);

      // Add verification parameters to redirect URL
      redirectUrl.searchParams.set('apoio_id', apoio.id);
      redirectUrl.searchParams.set('nome', nome);
      redirectUrl.searchParams.set('email', email);
      redirectUrl.searchParams.set('valor', valorCentavos.toString());

      const response = await fetch('https://tuiwratkqezsiweocbpu.supabase.co/functions/v1/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: apoio.handle_infinitepay,
          order_nsu: orderNsu,
          items: [{
            quantity: 1,
            price: valorCentavos,
            description: `Apoio para: ${apoio.titulo}`
          }],
          customer: {
            name: nome,
            email: email
          },
          redirect_url: redirectUrl.toString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        toast({
          title: 'Erro ao processar pagamento',
          description: 'Não foi possível gerar o link de pagamento. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      const { url } = result;

      // Check if InfinitePay is available before trying to process payment
      const isInfinitepayAvailable = typeof window !== 'undefined' && window.Infinitepay;

      if (isInfinitepayAvailable) {
        try {
          const paymentResult = await executePayment(url);

          if (paymentResult) {
            // Check if transaction already exists to prevent duplicates
            const { data: existingTransaction } = await supabase
              .from('apoiadores')
              .select('id')
              .eq('transaction_nsu', paymentResult.transactionNsu)
              .maybeSingle();

            if (!existingTransaction) {
              // Save supporter data only if transaction doesn't exist
              await supabase
                .from('apoiadores')
                .insert({
                  apoio_id: apoio.id,
                  nome,
                  email,
                  valor: valorCentavos,
                  transaction_nsu: paymentResult.transactionNsu
                });
            }

            toast({
              title: 'Apoio realizado!',
              description: 'Obrigado por apoiar esta causa.',
            });

            navigate('/apoio-sucesso');
            return;
          }
        } catch (paymentError) {
          console.log('InfinitePay payment failed, falling back to checkout URL:', paymentError);
        }
      }

      // Fallback: redirect to checkout URL if InfinitePay is not available or payment failed
      console.log('Using checkout URL fallback');

      toast({
        title: 'Redirecionando para pagamento',
        description: 'Você será redirecionado para completar o pagamento.',
      });

      // Open checkout URL in new tab/window
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao processar apoio:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar seu apoio. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!apoio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Apoio não encontrado</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para início
          </Button>
        </div>
      </div>
    );
  }

  const progresso = (apoio.valor_atual / apoio.meta_valor) * 100;
  const valorAtualReais = apoio.valor_atual / 100;
  const metaValorReais = apoio.meta_valor / 100;
  const campanhaFinalizada = apoio.valor_atual >= apoio.meta_valor || apoio.status === 'concluido';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 sm:px-4 py-4 sm:py-8 max-w-2xl">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/apoio/${apoio.id}`)}
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Voltar para campanha
          </Button>
        </div>

        {/* Campaign Info */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              {apoio.imagem_url && (
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                  <img
                    src={apoio.imagem_url}
                    alt={apoio.titulo}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl mb-2">{apoio.titulo}</CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
                  {apoio.descricao}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                  <span>R$ {valorAtualReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}</span>
                  <span>de R$ {metaValorReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}</span>
                  <span>{progresso.toFixed(1)}% concluído</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Support Form */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Heart className="h-5 w-5 text-primary" />
              Apoiar: {apoio.titulo}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="valor" className="text-sm sm:text-base">Valor do apoio (R$)</Label>
                <Input
                  id="valor"
                  type="text"
                  placeholder="Digite o valor (ex: 10,50)"
                  value={valor}
                  onChange={handleValorChange}
                  className="text-base"
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Valor mínimo: R$ 1,00
                </p>
              </div>

              <div>
                <Label htmlFor="nome" className="text-sm sm:text-base">Seu nome</Label>
                <Input
                  id="nome"
                  placeholder="Como você quer aparecer (mín. 3 chars)"
                  value={nome}
                  onChange={handleNomeChange}
                  maxLength={20}
                  className="text-base"
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {nome.length}/20 caracteres
                </p>
              </div>
                
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">Email para contato</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={handleEmailChange}
                  className="text-base"
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Usado para confirmação do apoio
                </p>
              </div>

              <Button
                onClick={handleApoiar}
                disabled={campanhaFinalizada || paymentLoading || !valor || !nome || !email}
                className="w-full"
                size="lg"
              >
                <Heart className="h-4 w-4 mr-2" />
                {campanhaFinalizada
                  ? 'Campanha finalizada'
                  : paymentLoading
                    ? 'Processando...'
                    : `Apoiar com R$ ${valor || '0,00'}`
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
