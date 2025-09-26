# CLAUDE.md - ApoiaAI Project Documentation

This file provides comprehensive guidance to Claude Code (claude.ai/code) and other AI agents when working with code in this repository.

## 🎯 Project Overview

**ApoiaAI** is a mobile-first crowdfunding platform built with modern web technologies, optimized for both web browsers and mobile webview environments. The application allows users to create and support crowdfunding campaigns ("apoios" in Portuguese).

### Key Features
- Create crowdfunding campaigns with funding goals
- Support campaigns with monetary contributions  
- Real-time progress tracking
- Mobile-optimized UI with webview support
- Payment integration via InfinitePay
- Responsive design for all device sizes
- Smart form validation and currency formatting
- Share functionality (native on mobile, clipboard on desktop)
- Auto-dismissing toast notifications (5 seconds)

### Project URLs
- **Lovable Project**: https://lovable.dev/projects/657d87dd-ed7a-46bb-910d-99425e4c006f
- **GitHub Repository**: https://github.com/GabriellCastroIO/crowd-fuel
- **Production Deploy**: Vercel/Netlify compatible

## 🛠 Tech Stack

### Core Technologies
- **Frontend Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19 (with SWC for faster builds)
- **UI Components**: shadcn/ui with Radix UI primitives (40+ components)
- **Styling**: Tailwind CSS 3.4.17 with CSS-in-JS support
- **Database/Backend**: Supabase (PostgreSQL)
- **State Management**: React Query (TanStack Query 5.83.0)
- **Routing**: React Router DOM v6.30.1
- **Forms**: React Hook Form 7.61.1 with Zod 3.25.76 validation

### Mobile Detection & Optimization
- **Library**: react-device-detect 2.2.3
- **Custom Hooks**: 
  - `useIsMobile()` - Detects mobile devices
  - `useIsWebView()` - Detects webview environments
  - `useDeviceInfo()` - Returns detailed device information
  - `useOrientation()` - Tracks device orientation
  - `useIsSmallMobile()` - Detects small screens (≤375px)
  - `useInfinitepayAvailability()` - Checks payment API availability

### UI Libraries
- **Icons**: Lucide React 0.462.0
- **Toasts**: Sonner 1.7.4 + Custom Toast system (auto-dismiss 5s)
- **Animations**: Tailwind Animate 1.0.7
- **Date Handling**: date-fns 3.6.0
- **Charts**: Recharts 2.15.4
- **Carousel**: Embla Carousel React 8.6.0
- **Command Palette**: cmdk 1.1.1
- **Theme Management**: next-themes 0.3.0
- **Mobile Drawer**: vaul 0.9.9

### Development Tools
- **Linting**: ESLint 9.32.0 with TypeScript support
- **Component Tagging**: lovable-tagger 1.1.10
- **Type Checking**: TypeScript 5.8.3
- **Post CSS**: Autoprefixer + PostCSS
- **Bundle Optimization**: @vitejs/plugin-react-swc

## 📁 Complete Project Structure

```
/crowd-fuel
├── /public/
│   ├── /assets/
│   │   ├── apoiaai.svg         # Brand logo (SVG with #a22e66 color)
│   │   └── Frame 2.png         # Additional asset
│   ├── favicon.ico
│   ├── placeholder.svg
│   ├── robots.txt
│   └── _redirects              # Netlify SPA routing
│
├── /src/
│   ├── /pages/                 # Route components
│   │   ├── Index.tsx           # Entry redirect to Home
│   │   ├── Home.tsx            # Landing with campaign list (202 lines)
│   │   ├── DetalhesApoio.tsx   # Campaign details & support (757 lines)
│   │   ├── CriarApoio.tsx      # Create campaign form (415 lines)
│   │   ├── EditarApoio.tsx     # Edit campaign (576 lines)
│   │   ├── MeusApoios.tsx      # User's campaigns dashboard
│   │   ├── ApoioSucesso.tsx    # Support success page (110 lines)
│   │   └── NotFound.tsx        # 404 error page (48 lines)
│   │
│   ├── /components/
│   │   ├── ApoioCard.tsx       # Reusable campaign card
│   │   └── /ui/                # shadcn/ui library (40+ components)
│   │       ├── accordion.tsx    ├── navigation-menu.tsx
│   │       ├── alert-dialog.tsx ├── pagination.tsx
│   │       ├── alert.tsx        ├── popover.tsx
│   │       ├── avatar.tsx       ├── progress.tsx
│   │       ├── badge.tsx        ├── radio-group.tsx
│   │       ├── button.tsx       ├── resizable.tsx
│   │       ├── calendar.tsx     ├── scroll-area.tsx
│   │       ├── card.tsx         ├── select.tsx
│   │       ├── carousel.tsx     ├── separator.tsx
│   │       ├── chart.tsx        ├── sheet.tsx
│   │       ├── checkbox.tsx     ├── sidebar.tsx
│   │       ├── collapsible.tsx  ├── skeleton.tsx
│   │       ├── command.tsx      ├── slider.tsx
│   │       ├── context-menu.tsx ├── sonner.tsx
│   │       ├── dialog.tsx       ├── switch.tsx
│   │       ├── drawer.tsx       ├── table.tsx
│   │       ├── dropdown-menu.tsx├── tabs.tsx
│   │       ├── form.tsx         ├── textarea.tsx
│   │       ├── hover-card.tsx   ├── toast.tsx
│   │       ├── input-otp.tsx    ├── toaster.tsx
│   │       ├── input.tsx        ├── toggle-group.tsx
│   │       ├── label.tsx        ├── toggle.tsx
│   │       ├── menubar.tsx      └── tooltip.tsx
│   │
│   ├── /hooks/
│   │   ├── use-mobile.tsx      # Device detection (193 lines)
│   │   ├── use-toast.ts        # Toast system (193 lines)
│   │   └── useInfinitepay.ts   # Payment hooks (74 lines)
│   │
│   ├── /integrations/supabase/
│   │   ├── client.ts           # Supabase client config
│   │   └── types.ts            # Generated DB types
│   │
│   ├── /lib/
│   │   ├── utils.ts            # CN utility for classNames
│   │   └── infinitepay.ts      # Payment API wrapper (77 lines)
│   │
│   ├── mobile-optimizations.css # Mobile-specific styles (177 lines)
│   ├── index.css               # Global styles & design tokens
│   ├── App.css                 # App-specific styles
│   ├── App.tsx                 # Root with routing (35 lines)
│   ├── main.tsx                # Entry point
│   └── vite-env.d.ts          # Vite type definitions
│
├── /supabase/
│   ├── /functions/
│   │   └── /create-checkout/
│   │       └── index.ts        # Edge function for payments
│   ├── /migrations/            # Database migrations
│   └── config.toml            # Supabase local config
│
├── Configuration Files
├── .env                        # Environment variables
├── .gitignore
├── bun.lockb                   # Bun lock file
├── CLAUDE.md                   # This file
├── components.json             # shadcn/ui config
├── eslint.config.js           # ESLint configuration
├── index.html                  # HTML entry (35 lines)
├── netlify.toml               # Netlify deploy config (24 lines)
├── package.json               # Dependencies & scripts (86 lines)
├── postcss.config.js          # PostCSS configuration
├── README.md                  # Project README
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.*.json            # TypeScript configs
├── vercel.json                # Vercel deploy config (55 lines)
└── vite.config.ts             # Vite build config (19 lines)
```

## 🗄 Database Schema

### Table: `apoios` (Campaigns)
```sql
CREATE TABLE apoios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  beneficios TEXT,              -- Optional benefits description
  meta_valor INTEGER NOT NULL,   -- Goal in cents (e.g., 10000 = R$ 100,00)
  valor_atual INTEGER DEFAULT 0, -- Current amount in cents
  imagem_url TEXT,               -- Optional campaign image
  handle_infinitepay VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `apoiadores` (Supporters)
```sql
CREATE TABLE apoiadores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apoio_id UUID REFERENCES apoios(id) ON DELETE CASCADE,
  nome VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  valor INTEGER NOT NULL,        -- Amount in cents
  transaction_nsu VARCHAR,        -- Payment transaction ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Supabase Edge Functions
- `/functions/create-checkout` - Creates InfinitePay checkout sessions

## 💳 Payment Integration (InfinitePay)

### API Integration
```typescript
// Window.Infinitepay API
interface Window {
  Infinitepay?: {
    getUserData(): Promise<ApiResponse<UserData>>;
    receiveTapPayment(params: TapPaymentParams): Promise<ApiResponse<PaymentData>>;
    sendCheckoutPayment(url: string): Promise<ApiResponse<PaymentData>>;
  };
}
```

### Payment Flow
1. **Check API Availability** - `waitForInfinitepay()` waits for API injection
2. **Get User Data** - `getInfinitepayUser()` retrieves logged-in user
3. **Create Checkout** - Supabase edge function generates payment URL
4. **Process Payment** - `processCheckoutPayment()` handles transaction
5. **Save Transaction** - Store supporter data in database
6. **Show Success** - Redirect to success page

### Tap Payment (In-Person)
- **Detection**: Check if `window.Infinitepay.receiveTapPayment` exists to confirm webview
- **Usage**: Only available for campaign owners when in InfinitePay app webview
- **Function**: `receiveTapPayment()` handles in-person card tap payments
- **Parameters**: Amount, client name, payment method (credit/debit), installments

### Checkout URL (Production)
```
https://tuiwratkqezsiweocbpu.supabase.co/functions/v1/create-checkout
```

## 🛣 Routing Structure

```javascript
// Defined in src/App.tsx
<Routes>
  <Route path="/" element={<Index />} />                    // Redirects to Home
  <Route path="/apoio/:id" element={<DetalhesApoio />} />  // Campaign details
  <Route path="/criar-apoio" element={<CriarApoio />} />    // Create campaign
  <Route path="/editar-apoio/:id" element={<EditarApoio />} /> // Edit campaign
  <Route path="/meus-apoios" element={<MeusApoios />} />    // User dashboard
  <Route path="/apoio-sucesso" element={<ApoioSucesso />} /> // Success page
  <Route path="*" element={<NotFound />} />                 // 404 fallback
</Routes>
```

## 📱 Mobile & WebView Optimizations

### Responsive Breakpoints
```css
Mobile:        < 768px
Small Mobile:  ≤ 375px  
Tablet:        768px - 1024px
Desktop:       > 1024px
```

### Mobile Detection Features
1. **Device Types**: Mobile, Tablet, Desktop, iOS, Android, Windows Phone
2. **WebView Detection**: Instagram, Facebook, Twitter, React Native, Line
3. **Orientation**: Portrait/Landscape tracking
4. **Touch Optimization**: 44x44px minimum targets, disabled double-tap zoom
5. **Safe Areas**: Notch device support with env(safe-area-inset-*)

### Platform-Specific Components
| Desktop | Mobile |
|---------|--------|
| Dialog | Drawer (Bottom Sheet) |
| Hover Effects | Touch Feedback |
| Multi-column | Single Column |
| Full Text | Abbreviated Text |
| Share → Clipboard | Share → Native API |

## ✅ Validation Rules

### Campaign Creation
- **Title**: 5-100 characters
- **Description**: 1-2000 characters  
- **Goal**: R$ 1,00 - R$ 9.999.999,00
- **Handle**: 3+ characters, alphanumeric
- **Image URL**: Valid URL format (optional)

### Campaign Support
- **Name**: 3-20 chars, letters/numbers/@/spaces only
- **Email**: Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Amount**: 
  - Minimum: R$ 1,00
  - Maximum: Remaining to reach goal
  - Format: X,XX (Brazilian currency)
- **Campaign Status**: Cannot support if 'concluido' or goal reached

### Currency Handling
```typescript
// Storage: Always in cents (INTEGER)
const cents = 10000; // R$ 100,00

// Display: Convert and format
const reais = cents / 100; // 100.00
const formatted = reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 }); // "100,00"

// Input: Custom formatter
formatCurrency("10050") // Returns "100,50"
parseValueToCents("100,50") // Returns 10050
```

## 🎨 Design System

### Color Palette (HSL)
```css
/* Light Mode */
--primary: 340 75% 55%;         /* #e11d48 - Rose/Pink */
--secondary: 340 40% 97%;       /* Light pink background */
--background: 0 0% 100%;        /* White */
--foreground: 222.2 84% 4.9%;   /* Dark blue text */
--muted: 340 20% 96%;           /* Muted pink */
--destructive: 0 84.2% 60.2%;   /* Red for errors */
--border: 340 20% 90%;          /* Light pink borders */

/* Dark Mode */
--background: 222.2 84% 4.9%;    /* Dark blue */
--foreground: 210 40% 98%;       /* Light text */
--primary: 340 75% 65%;          /* Lighter rose */

/* Gradients */
--gradient-primary: linear-gradient(135deg, primary, primary/60);
--gradient-hero: linear-gradient(135deg, primary/10, secondary/5);

/* Typography */
font-family: System UI, -apple-system, sans-serif;
--radius: 0.75rem;              /* Border radius */
```

### Logo & Branding
- **Name**: ApoiaAI
- **Logo**: `/public/assets/apoiaai.svg`
- **Primary Color**: `#a22e66`
- **Theme Color**: `#e11d48` (meta tag)

## ⚙️ Configuration Files

### Development (vite.config.ts)
```javascript
{
  server: {
    host: "::",      // IPv6 support
    port: 8080,      // Default port
  },
  alias: {
    "@": "./src",    // Path alias
  }
}
```

### Production Deployment
- **vercel.json**: SPA routing, cache headers, security headers
- **netlify.toml**: Build commands, redirects, headers
- **public/_redirects**: Fallback for Netlify SPA

### Environment Variables (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key  
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## 🚀 Essential Commands

```bash
# Install dependencies (npm or bun)
npm install
bun install

# Development server (port 8080/8081)
npm run dev

# Build for production
npm run build

# Build for development mode
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## 📝 Key Implementation Patterns

### 1. State Management Pattern
```typescript
// Server state with React Query
const { data, loading, error } = useQuery(['key'], fetchFunction);

// Local state
const [state, setState] = useState(initialValue);

// Form state with React Hook Form
const { register, handleSubmit, formState: { errors } } = useForm();
```

### 2. Toast Notifications
```typescript
// Success
toast({
  title: "Success!",
  description: "Action completed successfully",
});

// Error
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});
```

### 3. Sharing Behavior
```typescript
// Smart sharing based on platform
if (isMobile && navigator.share) {
  // Native share on mobile
  await navigator.share({ title, text, url });
} else {
  // Clipboard fallback on desktop
  navigator.clipboard.writeText(url);
  toast({ title: "Link copied!" });
}
```

### 4. Currency Input Handling
```typescript
// Format as user types
const handleValorChange = (e) => {
  const input = e.target.value;
  const numericOnly = input.replace(/[^\d]/g, '');
  const formatted = formatCurrency(numericOnly);
  setValor(formatted);
};
```

### 5. Mobile-First Responsive
```typescript
// Conditional rendering
{isMobile ? <Drawer /> : <Dialog />}

// Conditional styling
className={cn(
  "base-styles",
  isMobile && "mobile-styles"
)}
```

## 🐛 Common Issues & Solutions

### Issue: 404 on Direct URL Access (Production)
```json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue: Input Zoom on iOS
```css
/* mobile-optimizations.css */
input, textarea, select {
  font-size: 16px !important; /* Prevents zoom */
}
```

### Issue: InfinitePay API Not Available
```typescript
// Check availability before use
const isAvailable = typeof window !== 'undefined' && window.Infinitepay;
if (!isAvailable) {
  // Fallback to URL-based checkout
  window.open(checkoutUrl, '_blank');
}
```

### Issue: Campaign Exceeding Goal
```typescript
// Validation before support
if (apoio.valor_atual >= apoio.meta_valor) {
  toast({ 
    title: "Campaign completed",
    variant: "destructive" 
  });
  return;
}
```

## 🔐 Security Considerations

1. **API Keys**: Supabase uses public anon keys (safe for frontend)
2. **RLS (Row Level Security)**: Enabled on all Supabase tables
3. **Input Validation**: Client-side + server-side validation
4. **XSS Prevention**: React's built-in HTML escaping
5. **CORS**: Configured in Supabase edge functions
6. **Headers**: Security headers in vercel.json/netlify.toml
7. **Rate Limiting**: Implemented at Supabase level

## 🚦 Testing Checklist

### Before Deployment
- [ ] Test on real mobile devices (iOS/Android)
- [ ] Test in webviews (Instagram, Facebook, WhatsApp)
- [ ] Test direct URL access (deep linking)
- [ ] Test payment flow end-to-end
- [ ] Test form validations
- [ ] Test responsive breakpoints
- [ ] Test toast notifications
- [ ] Test share functionality
- [ ] Test offline behavior
- [ ] Test with slow network (3G)

## 🎯 Future Enhancements (Roadmap)

### High Priority
- [ ] User authentication system (Supabase Auth)
- [ ] Image upload instead of URL (Supabase Storage)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Search and filter functionality
- [ ] Campaign categories/tags

### Medium Priority
- [ ] Social media integration
- [ ] Campaign updates/news feed
- [ ] Comments and interactions
- [ ] Recurring support options
- [ ] Analytics dashboard

### Nice to Have
- [ ] PWA support
- [ ] Offline mode
- [ ] Multi-language support (i18n)
- [ ] Dark/Light theme toggle
- [ ] Export campaign data
- [ ] Webhook integrations

## 📚 Key Dependencies Reference

```json
{
  // Core
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.8.3",
  "vite": "^5.4.19",
  
  // Routing & State
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  
  // UI & Styling
  "tailwindcss": "^3.4.17",
  "@radix-ui/*": "latest",
  "lucide-react": "^0.462.0",
  
  // Forms & Validation
  "react-hook-form": "^7.61.1",
  "zod": "^3.25.76",
  
  // Backend & Auth
  "@supabase/supabase-js": "^2.58.0",
  
  // Mobile Detection
  "react-device-detect": "^2.2.3",
  
  // Utilities
  "date-fns": "^3.6.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.6.0"
}
```

## 🤝 Contributing Guidelines

### Code Style
1. Use TypeScript for type safety
2. Follow existing component patterns
3. Use shadcn/ui components when available
4. Keep components small and focused
5. Use custom hooks for reusable logic

### Best Practices
1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Performance**: Lazy load images, optimize bundles
3. **Accessibility**: ARIA labels, keyboard navigation
4. **Error Handling**: User-friendly error messages
5. **Validation**: Validate on client AND server
6. **Security**: Never trust client input

### Git Workflow
```bash
# Feature branch
git checkout -b feature/your-feature

# Commit with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update documentation"

# Pull with rebase
git pull --rebase origin main

# Push changes
git push origin feature/your-feature
```

## 📞 Support & Resources

- **Lovable Platform**: https://lovable.dev
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **React Router**: https://reactrouter.com
- **React Hook Form**: https://react-hook-form.com

---

*Last Updated: September 2025*  
*Version: 1.0.0*  
*Platform: ApoiaAI - Mobile-First Crowdfunding*  
*Optimized for: Web browsers and mobile webviews*  
*Maintained with: AI-assisted development*