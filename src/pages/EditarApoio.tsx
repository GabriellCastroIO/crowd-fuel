import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInfinitepayUser } from '@/hooks/useInfinitepay';
import { useIsMobile } from '@/hooks/use-mobile';

interface Apoio {
  id: string;
  titulo: string;
  descricao: string;
  meta_valor: number;
  valor_atual: number;
  imagem_url?: string;
  handle_infinitepay: string;
  user_id: string;
  status: string;
}

export default function EditarApoio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: userLoading } = useInfinitepayUser();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);
  const [loadingApoio, setLoadingApoio] = useState(true);
  const [finalizingCampaign, setFinalizingCampaign] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [apoio, setApoio] = useState<Apoio | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [metaValor, setMetaValor] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');

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

  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchApoio = async () => {
      try {
        const { data, error } = await supabase
          .from('apoios')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Check if user owns this apoio
        if (user && Number(data.user_id) !== Number(user.id)) {
          toast({
            title: `Acesso negado`,
            description: `Você não tem permissão para editar este apoio.`,
            variant: 'destructive',
          });
          navigate('/meus-apoios');
          return;
        }

        setApoio(data);
        setTitulo(data.titulo);
        setDescricao(data.descricao);
        setMetaValor(formatCurrency((data.meta_valor).toString()));
        setImagemUrl(data.imagem_url || '');
      } catch (error) {
        console.error('Erro ao carregar apoio:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do apoio.',
          variant: 'destructive',
        });
        navigate('/meus-apoios');
      } finally {
        setLoadingApoio(false);
      }
    };

    if (user) {
      fetchApoio();
    }
  }, [id, user, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Usuário não encontrado',
        description: 'É necessário estar logado no InfinitePay para editar um apoio.',
        variant: 'destructive',
      });
      return;
    }

    if (!apoio) {
      toast({
        title: 'Apoio não encontrado',
        description: 'Não foi possível encontrar os dados do apoio.',
        variant: 'destructive',
      });
      return;
    }

    if (!titulo || !descricao || !metaValor) {
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

    // Don't allow reducing meta below current amount raised
    if (metaValorCentavos < apoio.valor_atual) {
      const valorAtualReais = apoio.valor_atual / 100;
      toast({
        title: 'Meta inválida',
        description: `A meta não pode ser menor que o valor já arrecadado (R$ ${valorAtualReais.toFixed(2).replace('.', ',')}).`,
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

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('apoios')
        .update({
          titulo,
          descricao,
          meta_valor: metaValorCentavos,
          imagem_url: imagemUrl || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Apoio atualizado!',
        description: 'Suas alterações foram salvas com sucesso.',
      });

      navigate(`/apoio/${data.id}`);
    } catch (error) {
      console.error('Erro ao atualizar apoio:', error);
      toast({
        title: 'Erro ao atualizar apoio',
        description: 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeCampaign = async () => {
    if (!apoio) return;

    setFinalizingCampaign(true);

    try {
      const { error } = await supabase
        .from('apoios')
        .update({ status: 'concluido' })
        .eq('id', apoio.id);

      if (error) throw error;

      toast({
        title: 'Campanha finalizada!',
        description: 'Sua campanha foi finalizada com sucesso. Não será mais possível receber apoios.',
      });

      setFinalizeDialogOpen(false);
      navigate('/meus-apoios');
    } catch (error) {
      console.error('Erro ao finalizar campanha:', error);
      toast({
        title: 'Erro ao finalizar campanha',
        description: 'Não foi possível finalizar a campanha. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setFinalizingCampaign(false);
    }
  };

  if (userLoading || loadingApoio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso necessário</h2>
          <p className="text-muted-foreground mb-6">
            Você precisa estar logado no InfinitePay para editar apoios.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para início
          </Button>
        </div>
      </div>
    );
  }

  if (!apoio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Apoio não encontrado</h2>
          <Button onClick={() => navigate('/meus-apoios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para meus apoios
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
          onClick={() => navigate('/meus-apoios')}
          className="mb-4 sm:mb-6"
          size={isMobile ? "sm" : "default"}
        >
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Editar Apoio</CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {apoio?.status === 'concluido'
                    ? 'Esta campanha foi finalizada e não pode receber mais apoios'
                    : 'Faça as alterações necessárias em seu apoio'
                  }
                </p>
              </div>
              {apoio?.status === 'concluido' && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  FINALIZADA
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
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
                  disabled={apoio?.status === 'concluido'}
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
                  placeholder="Conte sua história, explique por que precisa de apoio e como os recursos serão utilizados..."
                  value={descricao}
                  onChange={handleDescricaoChange}
                  rows={isMobile ? 4 : 6}
                  maxLength={2000}
                  className="text-sm sm:text-base"
                  disabled={apoio?.status === 'concluido'}
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {descricao.length}/2000 caracteres
                </p>
              </div>

              {/* Meta de valor */}
              <div>
                <Label htmlFor="metaValor" className="text-sm sm:text-base">Meta de arrecadação (R$) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="metaValor"
                    type="text"
                    placeholder="Digite o valor (ex: 100,00) - mín. R$ 1,00"
                    value={metaValor}
                    onChange={handleMetaValorChange}
                    className="pl-10 text-sm sm:text-base"
                    disabled={apoio?.status === 'concluido'}
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Defina uma meta realista entre R$ 1,00 e R$ 9.999.999,00
                  {apoio.valor_atual > 0 && (
                    <span className="block text-orange-600">
                      Nota: A meta não pode ser menor que o valor já arrecadado (R$ {(apoio.valor_atual / 100).toFixed(2).replace('.', ',')})
                    </span>
                  )}
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
                    disabled={apoio?.status === 'concluido'}
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Uma imagem ajuda a conectar com os apoiadores
                </p>
              </div>

              {/* Informação do Handle */}
              <div>
                <Label className="text-sm sm:text-base">Handle InfinitePay</Label>
                <div className="bg-muted rounded-lg p-3 mt-1">
                  <p className="text-sm sm:text-base font-medium">
                    ${user?.handle}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Este handle receberá os pagamentos dos apoiadores
                  </p>
                </div>
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

              {/* Dialog de Finalização */}
              {apoio?.status === 'ativo' && (
                <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full" size={isMobile ? "default" : "default"}>
                      Finalizar Campanha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finalizar Campanha</DialogTitle>
                      <DialogDescription>
                        Tem certeza que deseja finalizar esta campanha?
                        <br /><br />
                        <strong>Esta ação não pode ser desfeita.</strong> Após finalizar:
                        <br />
                        • A campanha não poderá receber mais apoios
                        <br />
                        • O status será alterado para "Finalizada"
                        <br />
                        • Você não poderá reativar a campanha
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setFinalizeDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleFinalizeCampaign}
                        disabled={finalizingCampaign}
                      >
                        {finalizingCampaign ? 'Finalizando...' : 'Finalizar Campanha'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/meus-apoios')}
                  className="flex-1 order-2 sm:order-1"
                  size={isMobile ? "default" : "default"}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={apoio?.status === 'concluido' || loading || !titulo || !descricao || !metaValor}
                  className="flex-1 order-1 sm:order-2"
                  size={isMobile ? "default" : "default"}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}