import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Heart, ArrowLeft, Calendar, User, Info, Gift, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCheckoutPayment, useInfinitepayUser, useTapPayment, useInfinitepayAvailability } from '@/hooks/useInfinitepay';
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
  const { executePayment, loading: paymentLoading } = useCheckoutPayment();
  const { executeTapPayment, loading: tapPaymentLoading } = useTapPayment();
  const { user: currentUser } = useInfinitepayUser();
  const { isAvailable: isInfinitepayAvailable } = useInfinitepayAvailability();
  const isMobile = useIsMobile();
  const isWebView = useIsWebView();
  const { isIOS, isAndroid } = useDeviceInfo();
  
  const [apoio, setApoio] = useState<Apoio | null>(null);
  const [apoiadores, setApoiadores] = useState<Apoiador[]>([]);
  const [loading, setLoading] = useState(true);
  const [desktopDialogOpen, setDesktopDialogOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [tapPaymentOpen, setTapPaymentOpen] = useState(false);
  
  // Form state
  const [valor, setValor] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  
  // Tap payment form state
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

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits
    const numericOnly = input.replace(/[^\d]/g, '');

    if (numericOnly.length <= 6) { // Limit to R$ 9999,99
      const formattedValue = formatCurrency(numericOnly);
      setValor(formattedValue);
    }
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow ALL characters including accented ones, max 20 characters
    if (input.length <= 20) {
      setNome(input);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow ALL characters for email, max 100 characters
    if (input.length <= 100) {
      setEmail(input);
    }
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
  const isOwner = currentUser && apoio && apoio.user_id === currentUser.id;
  const canUseTapPayment = isOwner && isWebView && isMobile && isInfinitepayAvailable;
  
  const handleTapPayment = async () => {
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
      
      const paymentResult = await executeTapPayment({
        amount: valorCentavos,
        orderNsu: orderNsu,
        installments: tapPaymentMethod === 'debit' ? 1 : parseInt(tapInstallments),
        paymentMethod: tapPaymentMethod,
      });
      
      if (paymentResult) {
        // Save tap payment to database
        const { error: saveError } = await supabase
          .from('apoiadores')
          .insert({
            apoio_id: apoio!.id,
            nome: tapClientName,
            email: tapClientEmail || 'tap@payment.local',
            valor: valorCentavos,
            transaction_nsu: paymentResult.transactionNsu,
          });
        
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
          setTapPaymentOpen(false);
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

    if (valorCentavos < 100) { // Minimum R$ 1,00
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

            // Close both dialogs
            setDesktopDialogOpen(false);
            setMobileDrawerOpen(false);

            navigate('/apoio-sucesso');
            return; // Exit the function after successful payment
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
                  {/* Owner Tap Payment Button - Only in WebView */}
                  {canUseTapPayment && (
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => setTapPaymentOpen(true)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Cobrar por Tap (Presencial)
                    </Button>
                  )}
                  
                  <Dialog open={desktopDialogOpen} onOpenChange={setDesktopDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={campanhaFinalizada}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        {campanhaFinalizada ? 'Meta atingida!' : 'Apoiar agora'}
                      </Button>
                    </DialogTrigger>
                    
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Apoiar: {apoio.titulo}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="valor">Valor do apoio (R$)</Label>
                        <Input
                          id="valor"
                          type="text"
                          placeholder="Digite o valor (ex: 10,50)"
                          value={valor}
                          onChange={handleValorChange}
                        />
                      </div>

                      <div>
                        <Label htmlFor="nome">Seu nome</Label>
                        <Input
                          id="nome"
                          placeholder="Como você quer aparecer (mín. 3 chars)"
                          value={nome}
                          onChange={handleNomeChange}
                          maxLength={20}
                        />
                      </div>
                        
                      <div>
                        <Label htmlFor="email">Email para contato</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={handleEmailChange}
                        />
                      </div>

                      <Button
                        onClick={handleApoiar}
                        disabled={campanhaFinalizada || paymentLoading || !valor || !nome || !email}
                        className="w-full"
                        size="lg"
                      >
                        {campanhaFinalizada
                          ? 'Campanha finalizada'
                          : paymentLoading
                            ? 'Processando...'
                            : `Apoiar com R$ ${valor || '0,00'}`
                        }
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Tap Payment Modal */}
                {canUseTapPayment && (
                  <Drawer open={tapPaymentOpen} onOpenChange={setTapPaymentOpen}>
                    <DrawerContent className="px-4 pb-6">
                      <DrawerHeader>
                        <DrawerTitle className="text-left">Cobrar por Tap - Pagamento Presencial</DrawerTitle>
                      </DrawerHeader>
                      
                      <div className="space-y-4 mt-4">
                        {/* Payment Method */}
                        <div>
                          <Label>Método de Pagamento</Label>
                          <Select value={tapPaymentMethod} onValueChange={(value: 'credit' | 'debit') => setTapPaymentMethod(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debit">Débito</SelectItem>
                              <SelectItem value="credit">Crédito</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Installments (only for credit) */}
                        {tapPaymentMethod === 'credit' && (
                          <div>
                            <Label>Parcelas</Label>
                            <Select value={tapInstallments} onValueChange={setTapInstallments}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num}x
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                              Mínimo R$ 1,00 por parcela
                            </p>
                          </div>
                        )}
                        
                        {/* Amount */}
                        <div>
                          <Label htmlFor="tap-valor">Valor (R$)</Label>
                          <Input
                            id="tap-valor"
                            type="text"
                            placeholder="Digite o valor (ex: 10,50)"
                            value={tapValor}
                            onChange={handleTapValorChange}
                            className="text-base"
                          />
                        </div>
                        
                        {/* Client Name */}
                        <div>
                          <Label htmlFor="tap-nome">Nome do Cliente</Label>
                          <Input
                            id="tap-nome"
                            placeholder="Nome do cliente"
                            value={tapClientName}
                            onChange={(e) => setTapClientName(e.target.value)}
                            maxLength={50}
                            className="text-base"
                          />
                        </div>
                        
                        {/* Client Email (optional) */}
                        <div>
                          <Label htmlFor="tap-email">Email do Cliente (opcional)</Label>
                          <Input
                            id="tap-email"
                            type="email"
                            placeholder="cliente@email.com"
                            value={tapClientEmail}
                            onChange={(e) => setTapClientEmail(e.target.value)}
                            className="text-base"
                          />
                        </div>
                        
                        {/* Summary */}
                        {tapValor && (
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm font-medium">Resumo do Pagamento:</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Valor: R$ {tapValor || '0,00'}
                            </p>
                            {tapPaymentMethod === 'credit' && (
                              <p className="text-xs text-muted-foreground">
                                Parcelas: {tapInstallments}x de R$ {tapValor ? (parseValueToCents(tapValor) / (parseInt(tapInstallments) * 100)).toFixed(2).replace('.', ',') : '0,00'}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Método: {tapPaymentMethod === 'credit' ? 'Crédito' : 'Débito'}
                            </p>
                          </div>
                        )}
                        
                        <Button
                          onClick={handleTapPayment}
                          disabled={tapPaymentLoading || !tapValor || !tapClientName}
                          className="w-full"
                          size="lg"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          {tapPaymentLoading ? 'Processando...' : 'Processar Pagamento por Tap'}
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          O cliente deve aproximar ou inserir o cartão quando solicitado
                        </p>
                      </div>
                    </DrawerContent>
                  </Drawer>
                )}
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
                <div className="space-y-2 sm:space-y-3">
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

                {/* Support Button - Mobile */}
                <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      className="w-full"
                      size="default"
                      disabled={campanhaFinalizada}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {campanhaFinalizada ? 'Meta atingida!' : 'Apoiar agora'}
                    </Button>
                  </DrawerTrigger>
                    
                  <DrawerContent className="px-4 pb-6">
                    <DrawerHeader>
                      <DrawerTitle className="text-left">Apoiar: {apoio.titulo}</DrawerTitle>
                    </DrawerHeader>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="valor" className="text-sm">Valor do apoio (R$)</Label>
                        <Input
                          id="valor"
                          type="text"
                          placeholder="Digite o valor (ex: 10,50)"
                          value={valor}
                          onChange={handleValorChange}
                          className="text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nome" className="text-sm">Seu nome</Label>
                        <Input
                          id="nome"
                          placeholder="Como você quer aparecer (mín. 3 chars)"
                          value={nome}
                          onChange={handleNomeChange}
                          maxLength={20}
                          className="text-base"
                        />
                      </div>
                        
                      <div>
                        <Label htmlFor="email" className="text-sm">Email para contato</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={handleEmailChange}
                          className="text-base"
                        />
                      </div>

                      <Button
                        onClick={handleApoiar}
                        disabled={campanhaFinalizada || paymentLoading || !valor || !nome || !email}
                        className="w-full"
                        size="lg"
                      >
                        {campanhaFinalizada
                          ? 'Campanha finalizada'
                          : paymentLoading
                            ? 'Processando...'
                            : `Apoiar com R$ ${valor || '0,00'}`
                        }
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
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