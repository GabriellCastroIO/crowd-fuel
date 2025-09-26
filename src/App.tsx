import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DetalhesApoio from "./pages/DetalhesApoio";
import ApoiarApoio from "./pages/ApoiarApoio";
import TapPayment from "./pages/TapPayment";
import TapSucesso from "./pages/TapSucesso";
import CriarApoio from "./pages/CriarApoio";
import EditarApoio from "./pages/EditarApoio";
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
          <Route path="/apoio/:id/apoiar" element={<ApoiarApoio />} />
          <Route path="/apoio/:id/tap-payment" element={<TapPayment />} />
          <Route path="/apoio/:id/tap-sucesso" element={<TapSucesso />} />
          <Route path="/criar-apoio" element={<CriarApoio />} />
          <Route path="/editar-apoio/:id" element={<EditarApoio />} />
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
