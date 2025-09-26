import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ApoioCard } from '@/components/ApoioCard';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Menu } from 'lucide-react';
import { useInfinitepayUser, useInfinitepayAvailability } from '@/hooks/useInfinitepay';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface Apoio {
  id: string;
  titulo: string;
  descricao: string;
  meta_valor: number;
  valor_atual: number;
  imagem_url?: string;
  status: string;
}

export default function Home() {
  const [apoios, setApoios] = useState<Apoio[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useInfinitepayUser();
  const { isAvailable: isInfinitepayAvailable } = useInfinitepayAvailability();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchApoios = async () => {
      try {
        const { data, error } = await supabase
          .from('apoios')
          .select('*')
          .eq('status', 'ativo')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApoios(data || []);
      } catch (error) {
        console.error('Erro ao carregar apoios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApoios();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/apoiaai.svg" 
                alt="ApoiaAI Logo" 
                className="h-6 sm:h-8 w-6 sm:w-8"
              />
              <h1 className="text-lg sm:text-2xl font-bold">ApoiaAI</h1>
            </div>
            
            {isMobile ? (
              // Only show menu if InfinitePay is available
              isInfinitepayAvailable && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[250px]">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-2 mt-4">
                      {isInfinitepayAvailable && (
                        <Button
                          onClick={() => navigate('/criar-apoio')}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Apoio
                        </Button>
                      )}
                      {user && (
                        <Button
                          variant="outline"
                          onClick={() => navigate('/meus-apoios')}
                          className="w-full"
                        >
                          Meus Apoios
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )
            ) : (
              isInfinitepayAvailable && (
                <div className="flex items-center gap-4">
                  {user && (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/meus-apoios')}
                    >
                      Meus Apoios
                    </Button>
                  )}
                  <Button onClick={() => navigate('/criar-apoio')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Apoio
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-8 sm:py-16">
        <div className="container mx-auto px-6 sm:px-4 text-center">
          <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Transforme sonhos em realidade
          </h2>
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            Una-se a milhares de pessoas que apoiam causas importantes e fazem a diferença na vida de outros
          </p>
          {isInfinitepayAvailable && (
            <Button
              size={isMobile ? "default" : "lg"}
              onClick={() => navigate('/criar-apoio')}
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
            >
              <Plus className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              Começar um Apoio
            </Button>
          )}
        </div>
      </section>

      {/* Apoios em Destaque */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-6 sm:px-4">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-3xl font-bold">Apoios em Destaque</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(isMobile ? 3 : 6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4 sm:p-6 animate-pulse">
                  <div className="aspect-video bg-muted rounded-lg mb-3 sm:mb-4"></div>
                  <div className="h-5 sm:h-6 bg-muted rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-muted rounded mb-3 sm:mb-4"></div>
                  <div className="h-2 sm:h-3 bg-muted rounded mb-2"></div>
                  <div className="h-9 sm:h-10 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : apoios.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {apoios.map((apoio) => (
                <ApoioCard key={apoio.id} apoio={apoio} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-16">
              <img 
                src="/assets/apoiaai.svg" 
                alt="ApoiaAI Logo" 
                className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-50"
              />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">Nenhum apoio encontrado</h4>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
                {isInfinitepayAvailable
                  ? 'Seja o primeiro a criar um apoio coletivo!'
                  : 'Em breve você poderá criar apoios coletivos!'
                }
              </p>
              {isInfinitepayAvailable && (
                <Button onClick={() => navigate('/criar-apoio')} size={isMobile ? "default" : "default"}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Apoio
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}