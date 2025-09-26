import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Heart, ArrowLeft, CreditCard, Sparkles, PartyPopper } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import confetti from 'canvas-confetti';

export default function TapSucesso() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Extrair dados do pagamento dos query params
  const valor = searchParams.get('valor') || '0';
  const clientName = searchParams.get('clientName') || 'Cliente';
  const campaignTitle = searchParams.get('campaignTitle') || 'Campanha';
  
  const valorFormatted = (parseInt(valor) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  useEffect(() => {
    // Trigger confetti animation
    const timer = setTimeout(() => {
      setShowConfetti(true);
      
      // Multiple confetti bursts for celebration
      const end = Date.now() + (3 * 1000); // 3 seconds
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-6 sm:px-4 py-4 sm:py-8 max-w-2xl">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/apoio/${id}`)}
            size={isMobile ? "sm" : "default"}
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            Voltar para campanha
          </Button>
        </div>

        {/* Success Card */}
        <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center p-6 sm:p-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-green-500" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            <CardTitle className="text-2xl sm:text-3xl font-bold text-green-700 mb-2">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8" />
                Pagamento Realizado!
                <PartyPopper className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
            </CardTitle>
            
            <p className="text-lg sm:text-xl text-gray-600">
              Parabéns! O pagamento foi processado com sucesso! 🎉
            </p>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8 pt-0">
            <div className="space-y-6">
              
              {/* Payment Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Detalhes do Pagamento
                </h3>
                
                <div className="space-y-2 text-sm sm:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor cobrado:</span>
                    <span className="font-bold text-green-700 text-lg">{valorFormatted}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium text-gray-800">{clientName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Campanha:</span>
                    <span className="font-medium text-gray-800 truncate ml-2">{campaignTitle}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-medium text-gray-800">Pagamento por Tap</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      Aprovado
                    </span>
                  </div>
                </div>
              </div>

              {/* Celebration Message */}
              <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <div className="flex justify-center mb-3">
                  <Heart className="h-8 w-8 text-red-500 animate-pulse" />
                </div>
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                  Obrigado por fazer a diferença! ✨
                </h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  Seu apoio é fundamental para o sucesso desta campanha. 
                  Cada contribuição nos aproxima mais do objetivo!
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/apoio/${id}`)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Ver Campanha
                </Button>
                
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Descobrir Mais Campanhas
                </Button>
              </div>

              {/* Footer Message */}
              <div className="text-center pt-4">
                <p className="text-xs sm:text-sm text-gray-500">
                  Um comprovante do pagamento foi registrado no sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
