# 🎯 MD Agência - Sistema de Gestão de Divulgadoras

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6)](https://typescriptlang.org)

**URL do Projeto**: https://lovable.dev/projects/41dd9caf-2390-4a2a-8534-f20feab2abef

Sistema completo para gestão de divulgadoras (promoters) de eventos, incluindo controle de submissões, metas, lista de convidados e análises.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Edge Functions](#-edge-functions)
- [Rotas da Aplicação](#-rotas-da-aplicação)
- [Componentes Principais](#-componentes-principais)
- [Hooks Customizados](#-hooks-customizados)
- [Serviços](#-serviços)
- [Sistema de Design](#-sistema-de-design)
- [Otimizações de Performance](#-otimizações-de-performance)
- [Configurações Importantes](#-configurações-importantes)
- [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

### O que é o Sistema?

Plataforma SaaS multi-tenant para agências de marketing gerenciarem divulgadoras (influencers/promoters) que promovem eventos através de postagens no Instagram. O sistema permite:

1. **Gestão de Eventos**: Criar eventos com requisitos de postagens/vendas
2. **Submissão de Comprovantes**: Divulgadoras enviam screenshots de posts
3. **Controle de Metas**: Sistema de pontos/badges por submissões aprovadas
4. **Lista de Convidados (Guest List)**: Cadastro público para eventos
5. **Dashboard Analytics**: Métricas de performance e conversão
6. **Notificações Push**: Avisos em tempo real via PWA

### Papéis de Usuário

| Papel | Descrição | Permissões |
|-------|-----------|------------|
| `master_admin` | Administrador global | Acesso total, gerencia agências |
| `agency_admin` | Admin de agência | Gerencia eventos/usuários da agência |
| `user` | Divulgadora | Submete posts, visualiza dashboard |
| `guest` | Convidado temporário | Acesso limitado a eventos específicos |

---

## 🏗 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Pages  │  │ Hooks   │  │Services │  │   Components    │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘ │
│       └────────────┴────────────┴────────────────┘          │
│                           │                                  │
│                    React Query Cache                         │
└───────────────────────────┼──────────────────────────────────┘
                            │ HTTPS/WSS
┌───────────────────────────┼──────────────────────────────────┐
│                    SUPABASE (Backend)                        │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │  Auth (JWT) │  │  PostgreSQL   │  │  Edge Functions    │ │
│  └─────────────┘  │   + RLS       │  │  (Deno Runtime)    │ │
│                   └───────────────┘  └────────────────────┘ │
│  ┌─────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │   Storage   │  │   Realtime    │  │   Cron Jobs        │ │
│  │  (Buckets)  │  │  (WebSocket)  │  │  (pg_cron)         │ │
│  └─────────────┘  └───────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠 Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3 | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool + HMR |
| TailwindCSS | 3.x | Estilização utility-first |
| Shadcn/UI | - | Componentes base (Radix) |
| React Query | 5.x | Cache + Server State |
| React Router | 6.x | Roteamento SPA |
| Framer Motion | 12.x | Animações |
| Zustand | 5.x | Estado global |
| React Hook Form + Zod | - | Formulários + Validação |

### Backend (Supabase)
| Componente | Uso |
|------------|-----|
| PostgreSQL 15 | Banco de dados principal |
| PostgREST | API REST automática |
| GoTrue | Autenticação JWT |
| Storage | Upload de imagens (S3-compatible) |
| Edge Functions | Lógica serverless (Deno) |
| Realtime | WebSocket para updates |
| pg_cron | Jobs agendados |

### Integrações Externas
| Serviço | Uso |
|---------|-----|
| Resend | Envio de emails transacionais |
| Stripe | Pagamentos e assinaturas |
| Web Push | Notificações push (VAPID) |

---

## 📁 Estrutura de Pastas

```
src/
├── assets/              # Imagens e assets estáticos
├── components/          # Componentes React
│   ├── ui/              # Componentes Shadcn/UI base
│   ├── memoized/        # Componentes otimizados com memo
│   └── GuestList/       # Componentes do módulo Guest List
├── hooks/               # React Hooks customizados
│   └── consolidated/    # Hooks de queries consolidados
├── lib/                 # Utilitários e helpers
│   ├── dateUtils.ts     # Funções de timezone/data
│   ├── phoneUtils.ts    # Formatação de telefone
│   ├── postNameFormatter.ts
│   └── utils.ts         # cn() e helpers gerais
├── pages/               # Páginas/Rotas
│   ├── Admin/           # Sub-componentes do Admin
│   └── Dashboard/       # Sub-componentes do Dashboard
├── services/            # Camada de serviços (API calls)
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── integrations/
    └── supabase/
        ├── client.ts    # Cliente Supabase (AUTO-GERADO)
        └── types.ts     # Types do DB (AUTO-GERADO)

supabase/
├── config.toml          # Configuração Supabase (AUTO-GERADO)
├── functions/           # Edge Functions
│   ├── <function-name>/
│   │   └── index.ts
│   └── ...
└── migrations/          # Migrações SQL (READ-ONLY)
```

### ⚠️ Arquivos Auto-Gerados (NÃO EDITAR)
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`
- `.env`

---

## 🗄 Banco de Dados

### Tabelas Principais

```
┌──────────────────┐     ┌──────────────────┐
│     agencies     │────<│     profiles     │
│  (multi-tenant)  │     │   (usuários)     │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         │     ┌──────────────────┴─────────────────┐
         │     │                                    │
    ┌────┴─────┴────┐     ┌──────────────┐   ┌─────┴──────┐
    │    events     │────<│    posts     │   │ user_roles │
    │   (eventos)   │     │ (postagens)  │   │  (papéis)  │
    └───────┬───────┘     └──────┬───────┘   └────────────┘
            │                    │
            │         ┌──────────┴──────────┐
            │         │                     │
      ┌─────┴─────────┴───┐         ┌───────┴───────┐
      │   submissions     │         │user_event_goals│
      │  (comprovantes)   │         │   (metas)      │
      └───────────────────┘         └────────────────┘
```

### Tabelas de Guest List

```
┌────────────────────┐     ┌────────────────────┐
│ guest_list_events  │────<│  guest_list_dates  │
│  (eventos públicos)│     │   (datas/preços)   │
└────────────────────┘     └─────────┬──────────┘
                                     │
                           ┌─────────┴──────────┐
                           │guest_list_registrations│
                           │    (inscrições)        │
                           └────────────────────────┘
```

### Políticas RLS Importantes

Todas as tabelas usam Row Level Security. Padrões principais:

```sql
-- Usuários veem dados da própria agência
USING (agency_id = get_current_user_agency_id())

-- Admins de agência podem modificar
WITH CHECK (is_agency_admin_for(agency_id))

-- Master admin tem acesso total
USING (is_current_user_master_admin())
```

### Funções SQL Críticas

| Função | Descrição |
|--------|-----------|
| `check_and_update_user_goal()` | Calcula progresso de metas |
| `get_event_available_slots()` | Retorna vagas disponíveis |
| `get_top_promoters_ranking()` | Ranking de divulgadoras |
| `is_agency_admin_for()` | Verifica permissão de admin |
| `check_rate_limit()` | Rate limiting por usuário |

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação

```
1. Usuário acessa /auth
2. Signup/Login via email+senha
3. Supabase retorna JWT
4. JWT armazenado em localStorage
5. useAuth() listener atualiza authStore
6. RequireAuth/ProtectedRoute verificam acesso
```

### Verificação de Papéis

```typescript
// Hook para verificar papel do usuário
const { role, isAgencyAdmin, isMasterAdmin } = useUserRole();

// Componente de proteção de rota
<ProtectedRoute requireAgencyAdmin>
  <Admin />
</ProtectedRoute>
```

### Hierarquia de Permissões

```
master_admin > agency_admin > user > guest
```

---

## ⚡ Edge Functions

### Funções de Notificação
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `send-push-notification` | HTTP | Envia push via VAPID |
| `notify-goal-achieved` | HTTP | Notifica meta atingida |
| `notify-deadlines` | Cron | Avisa deadlines próximos |
| `event-reminders-cron` | Cron | Lembretes de eventos |
| `send-guest-invite` | HTTP | Convite por email |

### Funções de Automação
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `auto-deactivate-events` | Cron | Desativa eventos expirados |
| `auto-deactivate-guest-list-dates` | Cron | Desativa datas passadas |
| `auto-event-scheduler` | Cron | Ativa/desativa agendados |
| `expire-guests` | Cron | Expira convites antigos |
| `send-guest-list-email` | Cron | Envia lista de inscritos |

### Funções de Validação
| Função | Descrição |
|--------|-----------|
| `validate-image` | Valida screenshots |
| `validate-guest-registration` | Anti-spam/bot |
| `verify-instagram-post` | Verifica link do IG |

### Funções Stripe
| Função | Descrição |
|--------|-----------|
| `create-checkout-session` | Inicia checkout |
| `stripe-webhook` | Processa eventos Stripe |
| `check-trial-expiration` | Verifica trial |

---

## 🛤 Rotas da Aplicação

### Públicas
| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | Home | Landing page |
| `/auth` | Auth | Login/Signup |
| `/agency/:token` | AgencySignup | Signup via token |
| `/agencia/:slug` | AgencySignupBySlug | Signup via slug |
| `/:agencySlug/lista/:eventSlug` | GuestListRegister | Cadastro guest list |

### Autenticadas (RequireAuth)
| Rota | Componente | Descrição |
|------|------------|-----------|
| `/submit` | Submit | Enviar comprovante |
| `/dashboard` | Dashboard | Dashboard do usuário |
| `/guest-dashboard` | GuestDashboard | Dashboard de convidado |

### Admin (ProtectedRoute)
| Rota | Permissão | Descrição |
|------|-----------|-----------|
| `/admin` | agency_admin | Painel da agência |
| `/master-admin` | master_admin | Painel master |

---

## 🧩 Componentes Principais

### Layout & UI
- `ThemeProvider` - Dark/Light mode
- `PWAInstallPrompt` - Prompt instalação PWA
- `PWAUpdatePrompt` - Atualização do SW
- `NotificationBell` - Sino de notificações

### Admin
- `EventDialog` - CRUD de eventos (5 abas)
- `SubmissionKanban` - Kanban de submissões
- `UserManagement` - Gestão de usuários
- `GuestListManager` - Gestão de guest lists
- `DashboardStats` - Estatísticas gerais

### Dashboard
- `DashboardProfile` - Perfil do usuário
- `DashboardStats` - Stats do usuário
- `DashboardSubmissionHistory` - Histórico
- `GoalProgressBadge` - Progresso de meta
- `BadgeDisplay` - Badges conquistados

### Guest List
- `DateSelector` - Seleção de datas
- `GuestListForm` - Formulário de cadastro
- `AlternativeLinkCard` - Links alternativos

---

## 🪝 Hooks Customizados

### Autenticação & Roles
```typescript
useAuth()        // Listener de auth state
useUserRole()    // Papel do usuário atual
useIsGuest()     // Verifica se é guest
```

### Dados & Queries
```typescript
useDashboard()           // Dados do dashboard
useEventsQuery()         // Lista de eventos
useSubmissionsQuery()    // Submissões
useProfilesQuery()       // Perfis de usuários
useUserGoalProgress()    // Progresso de metas
useEventAvailableSlots() // Vagas disponíveis
```

### UI & UX
```typescript
usePagination()          // Paginação
useSignedUrls()          // URLs assinadas (cache)
usePushNotifications()   // Push notifications
usePWAInstall()          // Instalação PWA
```

---

## 🔧 Serviços

Camada de abstração para chamadas ao Supabase:

```typescript
// src/services/
agencyService.ts      // CRUD agências
eventService.ts       // CRUD eventos
submissionService.ts  // CRUD submissões
profileService.ts     // CRUD perfis
guestService.ts       // Guest invites
storageService.ts     // Upload de arquivos
signedUrlService.ts   // URLs assinadas (batch)
notificationService.ts // Notificações
```

---

## 🎨 Sistema de Design

### Tokens CSS (index.css)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 20% 98%;
  /* ... mais tokens */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 20% 98%;
  /* ... inversão para dark mode */
}
```

### Uso Correto

```tsx
// ✅ CORRETO - Usar tokens
<div className="bg-background text-foreground">
<Button className="bg-primary text-primary-foreground">

// ❌ ERRADO - Cores diretas
<div className="bg-white text-black">
<Button className="bg-purple-500 text-white">
```

---

## ⚡ Otimizações de Performance

### React Query
- `staleTime: 2 * 60 * 1000` (2 min global)
- `gcTime: 5 * 60 * 1000` (5 min)
- Hooks críticos com `staleTime: 10 * 1000` (10s)

### Code Splitting
```typescript
// Lazy loading de páginas
const Home = lazy(() => import("./pages/Home"));

// Manual chunks no Vite
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  ui: ['@radix-ui/*'],
  charts: ['recharts'],
  motion: ['framer-motion'],
}
```

### Imagens
- Compressão client-side antes do upload
- Batch signed URLs (1 request para N imagens)
- Cache local de URLs assinadas

### PWA
- Service Worker com Workbox
- Precaching de assets estáticos
- Offline fallback

---

## ⚙️ Configurações Importantes

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

### Secrets (Edge Functions)
| Secret | Uso |
|--------|-----|
| `RESEND_API_KEY` | Envio de emails |
| `STRIPE_SECRET_KEY` | Pagamentos |
| `VAPID_PUBLIC_KEY` | Push notifications |
| `VAPID_PRIVATE_KEY` | Push notifications |
| `VAPID_SUBJECT` | Push notifications |
| `SITE_URL` | URL base para links |

### Timezone
Sistema configurado para `America/Sao_Paulo` (BRT).
Configurável via `admin_settings.system_timezone`.

---

## 🚀 Guia de Desenvolvimento

### Como editar este código?

**Via Lovable (Recomendado)**

Acesse o [Projeto Lovable](https://lovable.dev/projects/41dd9caf-2390-4a2a-8534-f20feab2abef) e use prompts para fazer alterações.

**Via IDE Local**

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Entre na pasta
cd <YOUR_PROJECT_NAME>

# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Comandos
```bash
npm install     # Instalar dependências
npm run dev     # Dev server (localhost:5173)
npm run build   # Build produção
npm run preview # Preview do build
```

### Criando Nova Feature

1. **Banco de Dados**: Usar migration tool do Lovable
2. **Tipos**: Aguardar regeneração automática
3. **Service**: Criar em `src/services/`
4. **Hook**: Criar em `src/hooks/`
5. **Componente**: Criar em `src/components/`
6. **Rota**: Adicionar em `App.tsx`

### Padrões de Código

```typescript
// Queries com React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
  staleTime: 2 * 60 * 1000,
});

// Mutations
const mutation = useMutation({
  mutationFn: updateResource,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
    toast({ title: 'Sucesso!' });
  },
});

// Componentes
const MyComponent = memo(({ prop }: Props) => {
  // ...
});
```

---

## 🔧 Troubleshooting

### Dados não atualizam no mobile
- Limpar cache do Service Worker
- Verificar `staleTime` do hook
- Usar `refetchOnMount: 'always'`

### Imagens não carregam
- Verificar políticas RLS do storage
- Confirmar bucket público/privado
- Checar expiração de signed URLs

### Erros de permissão (403/401)
- Verificar RLS policies
- Confirmar papel do usuário
- Checar JWT expirado

### Edge Function timeout
- Verificar logs: `supabase--edge-function-logs`
- Adicionar rate limiting
- Otimizar queries

### Layout quebrado
- Verificar `src/App.css` (não deve ter max-width)
- Confirmar tokens CSS em uso
- Testar responsividade

---

## 🚀 Deploy

Acesse [Lovable](https://lovable.dev/projects/41dd9caf-2390-4a2a-8534-f20feab2abef) e clique em Share → Publish.

### Domínio Customizado

Para conectar um domínio, acesse Project > Settings > Domains e clique em "Connect Domain".

Mais informações: [Custom Domain Docs](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Lovable](https://docs.lovable.dev)
- [Shadcn/UI](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

---

## 📝 Changelog

Consulte o arquivo `pendencias.md` para lista de pendências e o componente `ChangelogManager` no admin para histórico de alterações do sistema.

---

**Última atualização**: Dezembro 2024

*Gerado automaticamente para auxiliar continuidade do desenvolvimento.*
