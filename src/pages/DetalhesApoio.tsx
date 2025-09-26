import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Heart, ArrowLeft, Calendar, User, Info, Gift, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInfinitepayUser, useInfinitepayAvailability } from '@/hooks/useInfinitepay';
import { useIsMobile, useDeviceInfo, useIsWebView } from '@/hooks/use-mobile';
import { PaymentMethod } from '@/lib/infinitepay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Apoio {
  id: string;
  titulo: string;
  descricao: string;
  beneficios?: string;
  meta_valor: number;
  valor_atual: number;
  imagem_url?: string;
  handle_infinitepay: string;
  created_at: string;
  status?: string;
  user_id?: string;
}

interface Apoiador {
  id: string;
  nome: string;
  valor: number;
  created_at: string;
}

export default function DetalhesApoio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useInfinitepayUser();
  const { isAvailable: isInfinitepayAvailable } = useInfinitepayAvailability();
  const isMobile = useIsMobile();
  const isWebView = useIsWebView();
  const { isIOS, isAndroid } = useDeviceInfo();
  
  const [apoio, setApoio] = useState<Apoio | null>(null);
  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tap payment form state (for remaining inline functionality)
  const [tapValor, setTapValor] = useState('');
  const [tapInstallments, setTapInstallments] = useState('1');
  const [tapPaymentMethod, setTapPaymentMethod] = useState<'credit' | 'debit'>('debit');
  const [tapClientName, setTapClientName] = useState('');
  const [tapClientEmail, setTapClientEmail] = useState('');

  // Utility functions for currency formatting
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');

    // Don't allow empty or just zeros
    if (!numericValue || numericValue === '0' || numericValue === '00') {
      return '';
    }

    // Convert to cents first, then format
    const cents = parseInt(numericValue);
    const reais = Math.floor(cents / 100);
    const centavos = cents % 100;

    // Always show format X,XX
    return `${reais},${centavos.toString().padStart(2, '0')}`;
  };

  const parseValueToCents = (value: string): number => {
    if (!value) return 0;
    // Extract just the numbers
    const numericValue = value.replace(/[^\d]/g, '');
    return parseInt(numericValue || '0');
  };

  
  const handleTapValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const numericOnly = input.replace(/[^\d]/g, '');
    if (numericOnly.length <= 8) { // Limit to R$ 999999,99
      const formattedValue = formatCurrency(numericOnly);
      setTapValor(formattedValue);
    }
  };
  
  // Check if current user is the campaign owner
  // Converte ambos para string para garantir comparação correta
  // Também remove espaços em branco caso existam
  const isOwner = currentUser && apoio && 
    String(apoio.user_id).trim() === String(currentUser.id).trim();
  
  // Verifica se a função de tap payment está disponível
  // Se está disponível, significa que estamos no webview do app InfinitePay
  const isTapPaymentAvailable = isInfinitepayAvailable && 
    window.Infinitepay && 
    typeof window.Infinitepay.receiveTapPayment === 'function';
  
  // Apenas o dono da campanha pode usar o tap payment
  // Debug: adicione ?forceTap=true na URL para testar
  const urlParams = new URLSearchParams(window.location.search);
  const forceTapForDebug = urlParams.get('forceTap') === 'true';
  
  if (forceTapForDebug && isTapPaymentAvailable) {
    console.warn('⚠️ Tap payment forçado via URL param ?forceTap=true');
  }
  
  const canUseTapPayment = (isOwner && isTapPaymentAvailable) || 
    (forceTapForDebug && isTapPaymentAvailable);

  // Debug específico para canUseTapPayment
  console.log('🔧 DEBUG canUseTapPayment:', {
    isOwner,
    isTapPaymentAvailable,
    forceTapForDebug,
    canUseTapPayment,
    currentUserId: currentUser?.id,
    apoioUserId: apoio?.user_id,
    stringComparison: currentUser && apoio ? String(apoio.user_id).trim() === String(currentUser.id).trim() : false
  });
  
      // Debug logs para verificar por que o botão não aparece
  useEffect(() => {
    // Log direto do window.Infinitepay
    console.log('🚀 window.Infinitepay:', window.Infinitepay);
    console.log('🚀 typeof window:', typeof window);
    console.log('🚀 window keys:', typeof window !== 'undefined' ? Object.keys(window).filter(k => k.toLowerCase().includes('infinit')) : 'window não disponível');
    
    // Log detalhado dos IDs para debug de tipos
    if (currentUser && apoio) {
      console.log('🔑 ID Comparison Debug:', {
        currentUserId: currentUser.id,
        currentUserIdType: typeof currentUser.id,
        apoioUserId: apoio.user_id,
        apoioUserIdType: typeof apoio.user_id,
        directComparison: apoio.user_id === currentUser.id,
        stringComparison: String(apoio.user_id) === String(currentUser.id),
        isOwner: isOwner
      });
    }
    
    console.log('🔍 Debug Tap Payment:', {
        user: currentUser ? {
          id: currentUser?.id,
          idType: typeof currentUser?.id,
          name: currentUser?.name,
          handle: currentUser?.handle,
        } : 'Não logado',
        campaign: apoio ? {
          id: apoio?.id,
          user_id: apoio?.user_id,
          userIdType: typeof apoio?.user_id,
          titulo: apoio?.titulo,
        } : 'Carregando...',
        conditions: {
          isOwner: isOwner,
          isInfinitepayAvailable: isInfinitepayAvailable,
          isTapPaymentAvailable: isTapPaymentAvailable,
          canUseTapPayment: canUseTapPayment,
        },
        infinitepayAPI: {
          hasWindow: typeof window !== 'undefined',
          hasInfinitepay: window.Infinitepay !== undefined,
          hasReceiveTapPayment: window.Infinitepay?.receiveTapPayment !== undefined,
          typeOfReceiveTapPayment: typeof window.Infinitepay?.receiveTapPayment,
        },
        environment: {
          userAgent: navigator.userAgent,
          isWebView: isWebView,
          isMobile: isMobile,
      }
    });
  }, [currentUser, apoio, isOwner, isInfinitepayAvailable, isTapPaymentAvailable, canUseTapPayment, isWebView, isMobile]);
  
  const handleTapPayment = async () => {
    // Verificar se a API está disponível antes de prosseguir
    if (!window.Infinitepay || typeof window.Infinitepay.receiveTapPayment !== 'function') {
      toast({
        title: 'API não disponível',
        description: 'A função de pagamento por tap não está disponível. Certifique-se de estar usando o app InfinitePay.',
        variant: 'destructive',
      });
      console.error('window.Infinitepay.receiveTapPayment não está disponível');
      console.log('window.Infinitepay:', window.Infinitepay);
      return;
    }
    
    if (!tapValor || !tapClientName) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e nome do cliente.',
        variant: 'destructive',
      });
      return;
    }
    
    const valorCentavos = parseValueToCents(tapValor);
    
    if (valorCentavos < 100) { // Minimum R$ 1,00
      toast({
        title: 'Valor inválido',
        description: 'O valor mínimo é R$ 1,00.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate installments for credit card
    if (tapPaymentMethod === 'credit') {
      const installmentNum = parseInt(tapInstallments);
      const minPerInstallment = valorCentavos / installmentNum;
      if (minPerInstallment < 100) { // Min R$ 1,00 per installment
        toast({
          title: 'Parcelas inválidas',
          description: 'O valor mínimo por parcela é R$ 1,00.',
          variant: 'destructive',
        });
        return;
      }
    }
    
    try {
      const orderNsu = `TAP_${Date.now()}`;
      
      console.log('Executando tap payment com window.Infinitepay.receiveTapPayment:', {
        amount: valorCentavos,
        orderNsu: orderNsu,
        installments: tapPaymentMethod === 'debit' ? 1 : parseInt(tapInstallments),
        paymentMethod: tapPaymentMethod === 'credit' ? PaymentMethod.CREDIT : PaymentMethod.DEBIT,
      });

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
              apoio_id: apoio!.id,
              nome: tapClientName,
              email: tapClientEmail || 'tap@payment.local',
              valor: valorCentavos,
              transaction_nsu: paymentResult.transactionNsu,
            });
          saveError = error;
        }
        
        if (saveError) {
          console.error('Erro ao salvar pagamento:', saveError);
          toast({
            title: 'Aviso',
            description: 'Pagamento processado mas houve erro ao salvar. Entre em contato com suporte.',
            variant: 'destructive',
          });
        } else {
          // Update campaign current amount
          const { error: updateError } = await supabase
            .from('apoios')
            .update({ 
              valor_atual: (apoio!.valor_atual || 0) + valorCentavos 
            })
            .eq('id', apoio!.id);
          
          if (!updateError) {
            setApoio(prev => prev ? {...prev, valor_atual: prev.valor_atual + valorCentavos} : null);
          }
          
          toast({
            title: 'Pagamento realizado!',
            description: `Recebido R$ ${(valorCentavos / 100).toFixed(2).replace('.', ',')} de ${tapClientName}`,
          });
          
          // Reset form
          setTapValor('');
          setTapClientName('');
          setTapClientEmail('');
          setTapInstallments('1');
          setTapPaymentMethod('debit');
          
          // Reload supporters list
          const { data: newApoiadores } = await supabase
            .from('apoiadores')
            .select('*')
            .eq('apoio_id', apoio!.id)
            .order('created_at', { ascending: false });
          
          if (newApoiadores) {
            setApoiadores(newApoiadores);
          }
        }
      } else {
        toast({
          title: 'Erro no pagamento',
          description: 'Não foi possível processar o pagamento. Tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro no pagamento por tap:', error);
      toast({
        title: 'Erro no pagamento',
        description: error instanceof Error ? error.message : 'Não foi possível processar o pagamento.',
        variant: 'destructive',
      });
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

        const { data: apoiadoresData, error: apoiadoresError } = await supabase
          .from('apoiadores')
          .select('*')
          .eq('apoio_id', id)
          .order('created_at', { ascending: false });

        if (apoiadoresError) throw apoiadoresError;
        setApoiadores(apoiadoresData || []);
      } catch (error) {
        console.error('Erro ao carregar apoio:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do apoio.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApoio();
  }, [id, toast]);


  const compartilhar = async () => {
    // Em mobile, tenta compartilhar nativamente
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: apoio?.titulo,
          text: apoio?.descricao,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
        // Se falhar no mobile, copia para clipboard como fallback
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link copiado!',
          description: 'O link foi copiado para a área de transferência.',
        });
      }
    } else {
      // Em desktop, sempre copia para área de transferência
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4 sm:space-y-6">
            <div className="h-6 sm:h-8 bg-muted rounded w-1/4"></div>
            <div className="aspect-video bg-muted rounded-lg"></div>
            <div className="h-6 sm:h-8 bg-muted rounded w-3/4"></div>
            <div className="h-16 sm:h-20 bg-muted rounded"></div>
          </div>
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
      <div className="container mx-auto px-6 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Voltar
          </Button>
          
          <Button
            variant="outline"
            size={isMobile ? "sm" : "sm"}
            onClick={compartilhar}
          >
            {isMobile ? "Compartilhar" : "Compartilhar"}
            <Share2 className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-4 sm:space-y-6">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold">{apoio.titulo}</h1>

          {/* Campaign completion message - Desktop */}
          {campanhaFinalizada && (
            <div className="hidden lg:block bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium text-base">
                {apoio.status === 'concluido'
                  ? '🏁 Esta campanha foi finalizada pelo criador.'
                  : '🎉 Parabéns! Esta campanha atingiu sua meta de arrecadação!'
                }
              </p>
            </div>
          )}

          {/* Desktop Layout - Image and Progress Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
            {/* Image - Desktop */}
            <div className="overflow-hidden rounded-lg">
              <img
                src={apoio.imagem_url || "/placeholder.svg"}
                alt={apoio.titulo}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Progress Component - Desktop */}
            <Card className="flex flex-col">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-xl">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                    Progresso da campanha
                  </div>
                  {campanhaFinalizada && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      META ATINGIDA
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0 flex-1 flex flex-col">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium">
                      R$ {valorAtualReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}
                    </span>
                    <span className="text-muted-foreground">
                      de R$ {metaValorReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(progresso, 100)} 
                    className="h-3 sm:h-4 bg-secondary"
                  />
                  
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{progresso.toFixed(1)}% concluído</span>
                    <span>{apoiadores.length} apoiadores</span>
                  </div>
                </div>

                {/* Support Button - Desktop */}
                <div className="mt-auto space-y-3">
                   {/* Tap Payment Button - Only for campaign owner */}
                   {canUseTapPayment && (
                     <Button
                       className="w-full"
                       size="lg"
                       variant="outline"
                       onClick={() => navigate(`/apoio/${apoio.id}/tap-payment`)}
                     >
                       <CreditCard className="h-4 w-4 mr-2" />
                       Cobrar por Tap (Presencial)
                     </Button>
                   )}
                  
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={campanhaFinalizada}
                    onClick={() => navigate(`/apoio/${apoio.id}/apoiar`)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {campanhaFinalizada ? 'Meta atingida!' : 'Apoiar agora'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Layout - Image and Progress Stacked */}
          <div className="lg:hidden space-y-4 sm:space-y-6">
            {/* Image - Mobile */}
            <div className="aspect-video overflow-hidden rounded-lg">
              <img
                src={apoio.imagem_url || "/placeholder.svg"}
                alt={apoio.titulo}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Progress Component - Mobile */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-xl">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                    Progresso da campanha
                  </div>
                  {campanhaFinalizada && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      META ATINGIDA
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-medium">
                      R$ {valorAtualReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}
                    </span>
                    <span className="text-muted-foreground">
                      de R$ {metaValorReais.toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}
                    </span>
                  </div>
                  
                  <Progress 
                    value={Math.min(progresso, 100)} 
                    className="h-3 sm:h-4 bg-secondary"
                  />
                  
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{progresso.toFixed(1)}% concluído</span>
                    <span>{apoiadores.length} apoiadores</span>
                  </div>
                </div>

                {/* Campaign completion message */}
                {campanhaFinalizada && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium text-sm sm:text-base">
                      {apoio.status === 'concluido'
                        ? '🏁 Esta campanha foi finalizada pelo criador.'
                        : '🎉 Parabéns! Esta campanha atingiu sua meta de arrecadação!'
                      }
                    </p>
                  </div>
                )}

                {/* Support Buttons - Mobile */}
                <div className="space-y-3">
                   {/* Tap Payment Button - Only for campaign owner */}
                   {canUseTapPayment && (
                     <Button
                       className="w-full"
                       size="default"
                       variant="outline"
                       onClick={() => navigate(`/apoio/${apoio.id}/tap-payment`)}
                     >
                       <CreditCard className="h-4 w-4 mr-2" />
                       Cobrar por Tap (Presencial)
                     </Button>
                   )}
                  
                  {/* Regular Support Button */}
                  <Button
                    className="w-full"
                    size="default"
                    disabled={campanhaFinalizada}
                    onClick={() => navigate(`/apoio/${apoio.id}/apoiar`)}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {campanhaFinalizada ? 'Meta atingida!' : 'Apoiar agora'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description, Benefits and Supporters Tabs - Full Width */}
          <Card className="mb-4 sm:mb-6">
            <CardContent className="p-0">
              <Tabs defaultValue="sobre" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12">
                  <TabsTrigger value="sobre" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Info className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Sobre</span>
                    <span className="sm:hidden">Sobre</span>
                  </TabsTrigger>
                  <TabsTrigger value="beneficios" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Benefícios</span>
                    <span className="sm:hidden">Benefícios</span>
                  </TabsTrigger>
                  <TabsTrigger value="apoiadores" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Apoiadores</span>
                    <span className="sm:hidden">Apoiadores</span>
                  </TabsTrigger>
                </TabsList>
                
                <div className="min-h-[200px]">
                  <TabsContent value="sobre" className="p-4 sm:p-6 m-0">
                    <p className="whitespace-pre-wrap text-sm sm:text-base">{apoio.descricao}</p>
                    <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 sm:h-4 w-3 sm:w-4" />
                        {isMobile ? new Date(apoio.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : `Criado em ${new Date(apoio.created_at).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="beneficios" className="p-4 sm:p-6 m-0">
                    {apoio.beneficios ? (
                      <p className="whitespace-pre-wrap text-sm sm:text-base">{apoio.beneficios}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm sm:text-base text-center py-8">
                        Os benefícios deste apoio serão informados em breve.
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="apoiadores" className="p-4 sm:p-6 m-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold">Apoiadores</h3>
                      <span className="text-sm text-muted-foreground">({apoiadores.length})</span>
                    </div>
                    
                    {apoiadores.length > 0 ? (
                      <div className="space-y-3 sm:space-y-4">
                        {apoiadores.slice(0, isMobile ? 5 : apoiadores.length).map((apoiador) => (
                          <div key={apoiador.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm sm:text-base">{apoiador.nome}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {new Date(apoiador.created_at).toLocaleDateString('pt-BR', isMobile ? { day: '2-digit', month: 'short' } : undefined)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-primary text-sm sm:text-base">
                                R$ {(apoiador.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: isMobile ? 0 : 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isMobile && apoiadores.length > 5 && (
                          <p className="text-center text-xs text-muted-foreground pt-2">
                            E mais {apoiadores.length - 5} apoiadores...
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                        Seja o primeiro a apoiar esta causa!
                      </p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
