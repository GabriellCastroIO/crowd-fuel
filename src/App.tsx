import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DetalhesApoio from "./pages/DetalhesApoio";
import CriarApoio from "./pages/CriarApoio";
import MeusApoios from "./pages/MeusApoios";
import ApoioSucesso from "./pages/ApoioSucesso";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/apoio/:id" element={<DetalhesApoio />} />
          <Route path="/criar-apoio" element={<CriarApoio />} />
          <Route path="/meus-apoios" element={<MeusApoios />} />
          <Route path="/apoio-sucesso" element={<ApoioSucesso />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
