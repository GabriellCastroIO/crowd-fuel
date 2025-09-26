import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <img 
          src="/assets/apoiaai.svg" 
          alt="ApoiaAI Logo" 
          className="h-16 w-16 mx-auto mb-6 opacity-50"
        />
        <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Página não encontrada</h2>
        <p className="mb-8 text-muted-foreground">
          Ops! Parece que a página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button 
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Ir para Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
