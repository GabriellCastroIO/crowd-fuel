import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfinitepayUser } from '@/hooks/useInfinitepay';

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

enum PaymentMethod {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export default function TapPayment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [apoio, setApoio] = useState<Apoio | null>(null);
  const [loading, setLoading] = useState(true);
  const [tapPaymentLoading, setTapPaymentLoading] = useState(false);
  
  // Use the same hook as DetalhesApoio
  const { user: currentUser, loading: userLoading } = useInfinitepayUser();
  
  // Form state
  const [tapValor, setTapValor] = useState('');
  const [tapClientName, setTapClientName] = useState('');
  const [tapClientEmail, setTapClientEmail] = useState('');
  const [tapPaymentMethod, setTapPaymentMethod] = useState<'credit' | 'debit'>('debit');
  const [tapInstallments, setTapInstallments] = useState('1');

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

  const handleTapValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numericOnly = input.replace(/[^\d]/g, '');

    if (numericOnly.length <= 6) {
      const formattedValue = formatCurrency(numericOnly);
      setTapValor(formattedValue);
    }
  };

  const handleTapClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 50) {
      setTapClientName(input);
    }
  };

  const handleTapClientEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.length <= 100) {
      setTapClientEmail(input);
    }
  };

  useEffect(() => {
    if (!id) return;
    if (userLoading) {
      console.log('🔧 DEBUG TapPayment: User ainda carregando...');
      return;
    }
    if (!currentUser) {
      console.log('🔧 DEBUG TapPayment: Usuário não logado, redirecionando...');
      toast({
        title: 'Acesso negado',
        description: 'Você precisa estar logado para acessar esta funcionalidade.',
        variant: 'destructive',
      });
      navigate(`/apoio/${id}`);
      return;
    }

    const fetchApoio = async () => {
      try {
        const { data: apoioData, error: apoioError } = await supabase
          .from('apoios')
          .select('*')
          .eq('id', id)
          .single();

        if (apoioError) throw apoioError;
        setApoio(apoioData);

        // Check if user is the owner (using the same logic as DetalhesApoio)
        const isOwner = currentUser && apoioData && 
          String(apoioData.user_id).trim() === String(currentUser.id).trim();

        console.log('🔧 DEBUG TapPayment ownership check:', {
          currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : null,
          apoioData: apoioData ? { id: apoioData.id, user_id: apoioData.user_id, titulo: apoioData.titulo } : null,
          isOwner,
          stringComparison: currentUser && apoioData ? String(apoioData.user_id).trim() === String(currentUser.id).trim() : false
        });

        if (!isOwner) {
          toast({
            title: 'Acesso negado',
            description: 'Apenas o criador da campanha pode usar o pagamento por tap.',
            variant: 'destructive',
          });
          navigate(`/apoio/${id}`);
          return;
        }
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
  }, [id, toast, navigate, currentUser, userLoading]);

  const handleTapPayment = async () => {
    if (!apoio || !tapValor || !tapClientName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e o nome do cliente para continuar.',
        variant: 'destructive',
      });
      return;
    }

    const valorCentavos = parseValueToCents(tapValor);

    if (valorCentavos < 100) {
      toast({
        title: 'Valor inválido',
        description: 'O valor mínimo para cobrança é R$ 1,00.',
        variant: 'destructive',
      });
      return;
    }

    if (tapClientName.length < 3) {
      toast({
        title: 'Nome inválido',
        description: 'O nome do cliente deve ter pelo menos 3 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validate email if provided
    if (tapClientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tapClientEmail)) {
        toast({
          title: 'Email inválido',
          description: 'Por favor, insira um endereço de email válido ou deixe em branco.',
          variant: 'destructive',
        });
        return;
      }
    }

    setTapPaymentLoading(true);

    try {
      const orderNsu = `TAP_${Date.now()}_${apoio.id}`;

      // Check if InfinitePay is available
      if (!window.Infinitepay || typeof window.Infinitepay.receiveTapPayment !== 'function') {
        toast({
          title: 'InfinitePay não disponível',
          description: 'A funcionalidade de tap payment não está disponível neste ambiente.',
          variant: 'destructive',
        });
        return;
      }

      // Call InfinitePay API
      const response = await window.Infinitepay.receiveTapPayment({
        amount: valorCentavos,
        orderNsu: orderNsu,
        installments: tapPaymentMethod === 'debit' ? 1 : parseInt(tapInstallments),
        paymentMethod: tapPaymentMethod === 'credit' ? PaymentMethod.CREDIT : PaymentMethod.DEBIT,
      });

      console.log('Resposta do tap payment:', response);

      if (response.status === 'success' && response.data) {
        const paymentResult = response.data;

        // Check if transaction already exists to prevent duplicates
        const { data: existingTransaction } = await supabase
          .from('apoiadores')
          .select('id')
          .eq('transaction_nsu', paymentResult.transactionNsu)
          .maybeSingle();

        let saveError = null;

        if (!existingTransaction) {
          // Save tap payment to database only if transaction doesn't exist
          const { error } = await supabase
            .from('apoiadores')
            .insert({
              apoio_id: apoio.id,
              nome: tapClientName,
              email: tapClientEmail || 'tap@payment.local',
              valor: valorCentavos,
              transaction_nsu: paymentResult.transactionNsu,
            });
          saveError = error;
        }

        if (saveError) {
          console.error('Erro ao salvar tap payment:', saveError);
          toast({
            title: 'Erro ao salvar',
            description: 'Pagamento processado, mas houve erro ao salvar no banco de dados.',
            variant: 'destructive',
          });
        } else {
          // Navigate to success page with payment details
          const successUrl = new URL(`${window.location.origin}/apoio/${apoio.id}/tap-sucesso`);
          successUrl.searchParams.set('valor', valorCentavos.toString());
          successUrl.searchParams.set('clientName', tapClientName);
          successUrl.searchParams.set('campaignTitle', apoio.titulo);
          
          navigate(successUrl.pathname + successUrl.search);
        }
      } else {
        toast({
          title: 'Erro no pagamento',
          description: 'Não foi possível processar o pagamento. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro no tap payment:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setTapPaymentLoading(false);
    }
  };

  if (loading || userLoading) {
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
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tap Payment Form */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CreditCard className="h-5 w-5 text-primary" />
              Cobrar por Tap - Pagamento Presencial
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Use esta funcionalidade para cobrar pagamentos presenciais dos seus apoiadores.
            </p>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <Label htmlFor="tapValor" className="text-sm sm:text-base">Valor a cobrar (R$)</Label>
                <Input
                  id="tapValor"
                  type="text"
                  placeholder="Digite o valor (ex: 25,00)"
                  value={tapValor}
                  onChange={handleTapValorChange}
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
                <Label htmlFor="tapClientName" className="text-sm sm:text-base">Nome do cliente</Label>
                <Input
                  id="tapClientName"
                  placeholder="Nome do apoiador (mín. 3 chars)"
                  value={tapClientName}
                  onChange={handleTapClientNameChange}
                  maxLength={50}
                  className="text-base"
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {tapClientName.length}/50 caracteres
                </p>
              </div>

              <div>
                <Label htmlFor="tapClientEmail" className="text-sm sm:text-base">Email do cliente (opcional)</Label>
                <Input
                  id="tapClientEmail"
                  type="email"
                  placeholder="cliente@email.com"
                  value={tapClientEmail}
                  onChange={handleTapClientEmailChange}
                  className="text-base"
                  style={{ 
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Para confirmação do pagamento
                </p>
              </div>

              <div>
                <Label className="text-sm sm:text-base">Método de pagamento</Label>
                <Select value={tapPaymentMethod} onValueChange={(value: 'credit' | 'debit') => setTapPaymentMethod(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Débito</SelectItem>
                    <SelectItem value="credit">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tapPaymentMethod === 'credit' && (
                <div>
                  <Label className="text-sm sm:text-base">Parcelas</Label>
                  <Select value={tapInstallments} onValueChange={setTapInstallments}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione as parcelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                      <SelectItem value="3">3x</SelectItem>
                      <SelectItem value="4">4x</SelectItem>
                      <SelectItem value="5">5x</SelectItem>
                      <SelectItem value="6">6x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleTapPayment}
                disabled={tapPaymentLoading || !tapValor || !tapClientName}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {tapPaymentLoading
                  ? 'Processando...'
                  : `Cobrar R$ ${tapValor || '0,00'}`
                }
              </Button>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
