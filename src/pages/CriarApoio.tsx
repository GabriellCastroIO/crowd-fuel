import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInfinitepayUser, useInfinitepayAvailability } from '@/hooks/useInfinitepay';
import { useIsMobile } from '@/hooks/use-mobile';

export default function CriarApoio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: userLoading } = useInfinitepayUser();
  const { isAvailable: isInfinitepayAvailable, loading: availabilityLoading } = useInfinitepayAvailability();
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [metaValor, setMetaValor] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [handleInfinitepay, setHandleInfinitepay] = useState('');

  // Utility functions for currency formatting
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters
    let numericValue = value.replace(/[^\d]/g, '');

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

  const handleMetaValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits
    const numericOnly = input.replace(/[^\d]/g, '');

    if (numericOnly.length <= 9) { // Limit to R$ 9999999,00
      const formattedValue = formatCurrency(numericOnly);
      setMetaValor(formattedValue);
    }
  };

  const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow ALL characters including accented ones, max 100 characters
    if (input.length <= 100) {
      setTitulo(input);
    }
  };

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target.value;
    // Allow ALL characters including accented ones, max 2000 characters
    if (input.length <= 2000) {
      setDescricao(input);
    }
  };

  const handleImagemUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow ALL characters for URLs, max 500 characters
    if (input.length <= 500) {
      setImagemUrl(input);
    }
  };

  const handleInfinitepayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow letters, numbers, underscores, hyphens, max 50 characters
    const validChars = input.replace(/[^a-zA-Z0-9_-]/g, '');
    if (validChars.length <= 50) {
      setHandleInfinitepay(validChars);
    }
  };

  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Usuário não encontrado',
        description: 'É necessário estar logado no InfinitePay para criar um apoio.',
        variant: 'destructive',
      });
      return;
    }

    if (!titulo || !descricao || !metaValor || !handleInfinitepay) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Validate title length
    if (titulo.length < 5) {
      toast({
        title: 'Título muito curto',
        description: 'O título deve ter pelo menos 5 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validate description length
    if (descricao.length < 1) {
      toast({
        title: 'Descrição obrigatória',
        description: 'A descrição deve ter pelo menos 1 caracter.',
        variant: 'destructive',
      });
      return;
    }

    // Validate handle length
    if (handleInfinitepay.length < 3) {
      toast({
        title: 'Handle inválido',
        description: 'O handle deve ter pelo menos 3 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    const metaValorCentavos = parseValueToCents(metaValor);

    if (metaValorCentavos < 100) { // Minimum R$ 1,00
      toast({
        title: 'Meta muito baixa',
        description: 'A meta mínima para uma campanha é R$ 1,00.',
        variant: 'destructive',
      });
      return;
    }

    if (metaValorCentavos > 999999900) { // Maximum R$ 9999999,00
      toast({
        title: 'Meta muito alta',
        description: 'A meta máxima para uma campanha é R$ 9.999.999,00.',
        variant: 'destructive',
      });
      return;
    }

    // Validate image URL if provided
    if (imagemUrl && !isValidImageUrl(imagemUrl)) {
      toast({
        title: 'URL da imagem inválida',
        description: 'Por favor, insira uma URL válida para a imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Remove validation for user.handle since we're using custom handle input

    setLoading(true);

    try {
      // Use the already calculated metaValorCentavos from validation
      
      const { data, error } = await supabase
        .from('apoios')
        .insert({
          titulo,
          descricao,
          meta_valor: metaValorCentavos,
          imagem_url: imagemUrl || null,
          user_id: user.id,
          handle_infinitepay: handleInfinitepay, // Use custom handle input
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Apoio criado!',
        description: 'Seu apoio foi criado com sucesso e já está disponível.',
      });

      navigate(`/apoio/${data.id}`);
    } catch (error) {
      console.error('Erro ao criar apoio:', error);
      toast({
        title: 'Erro ao criar apoio',
        description: 'Não foi possível criar seu apoio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || availabilityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isInfinitepayAvailable) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">InfinitePay não disponível</h2>
          <p className="text-muted-foreground mb-6">
            Para criar um apoio, é necessário ter o InfinitePay disponível.
          </p>
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
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 sm:mb-6"
          size={isMobile ? "sm" : "default"}
        >
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          Voltar
        </Button>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Criar Novo Apoio</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Conte sua história e mobilize pessoas para apoiar sua causa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Título */}
              <div>
                <Label htmlFor="titulo" className="text-sm sm:text-base">Título do apoio *</Label>
                <Input
                  id="titulo"
                  placeholder="Dê um título marcante para seu apoio (mín. 5 chars)"
                  value={titulo}
                  onChange={handleTituloChange}
                  maxLength={100}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {titulo.length}/100 caracteres
                </p>
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="descricao" className="text-sm sm:text-base">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Conte sua história e explique por que precisa de apoio..."
                  value={descricao}
                  onChange={handleDescricaoChange}
                  rows={isMobile ? 3 : 4}
                  maxLength={2000}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {descricao.length}/2000 caracteres
                </p>
              </div>

              {/* Meta de valor */}
              <div>
                <Label htmlFor="metaValor" className="text-sm sm:text-base">Meta de arrecadação (R$) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                  <Input
                    id="metaValor"
                    type="text"
                    placeholder="Digite o valor (ex: 100,00) - mín. R$ 1,00"
                    value={metaValor}
                    onChange={handleMetaValorChange}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Defina uma meta realista entre R$ 1,00 e R$ 9.999.999,00
                </p>
              </div>

              {/* URL da imagem */}
              <div>
                <Label htmlFor="imagemUrl" className="text-sm sm:text-base">URL da imagem (opcional)</Label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="imagemUrl"
                    type="url"
                    placeholder="https://exemplo.com/sua-imagem.jpg"
                    value={imagemUrl}
                    onChange={handleImagemUrlChange}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Uma imagem ajuda a conectar com os apoiadores
                </p>
              </div>

              {/* Handle InfinitePay */}
              <div>
                <Label htmlFor="handleInfinitepay" className="text-sm sm:text-base">Handle InfinitePay *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    id="handleInfinitepay"
                    placeholder="seu_handle"
                    value={handleInfinitepay}
                    onChange={handleInfinitepayChange}
                    className="pl-8 text-sm sm:text-base"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Este handle receberá os pagamentos dos apoiadores
                </p>
              </div>

              {/* Preview da imagem */}
              {imagemUrl && (
                <div>
                  <Label>Preview da imagem</Label>
                  <div className="mt-2 aspect-video overflow-hidden rounded-lg border">
                    <img
                      src={imagemUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast({
                          title: 'Erro na imagem',
                          description: 'Não foi possível carregar a imagem. Verifique a URL.',
                          variant: 'destructive',
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 order-2 sm:order-1"
                  size={isMobile ? "default" : "default"}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !titulo || !descricao || !metaValor || !handleInfinitepay}
                  className="flex-1 order-1 sm:order-2"
                  size={isMobile ? "default" : "default"}
                >
                  {loading ? 'Criando...' : 'Criar Apoio'}
                </Button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
}