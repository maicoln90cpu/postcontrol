# 📋 Sistema MD Agência - Status Completo

**Última atualização:** 2025-12-13

---

## 🏗️ REFATORAÇÃO ADMIN.tsx - PLANO COMPLETO

### Objetivo
Reduzir Admin.tsx de **2916 linhas** para **~400 linhas** (orquestrador limpo).

### Fases do Projeto

| Fase | Descrição | Status | Arquivos Criados |
|------|-----------|--------|------------------|
| **1** | Criar Hooks Consolidados | ✅ Concluída | 5 hooks |
| **2** | Criar Componentes de Tab | ✅ Concluída | 5 tabs + index |
| **3** | Criar Componentes Compartilhados | ✅ Concluída | 3 componentes + index |
| **4** | Refatorar Admin.tsx Principal | 🔜 Próxima | Orquestrador ~400 linhas |
| **5** | Testes e Validação | ⏳ Pendente | - |

---

### ✅ FASE 1: Hooks Consolidados (CONCLUÍDA)

**Localização:** `src/pages/Admin/hooks/`

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `useAdminState.ts` | ~150 | Centraliza ~50 useState em categorias (dialogs, selection, deletion, rejection, zoom, ui, statsFilter, loading) |
| `useAdminQueries.ts` | ~100 | Consolida queries de eventos, submissões e contadores com helpers memoizados |
| `useAdminMutations.ts` | ~120 | Centraliza mutations de aprovação, rejeição, deleção de eventos/posts/submissões |
| `useAdminAgency.ts` | ~100 | Encapsula lógica de agência, trial status, profile e cache invalidation |
| `useAdminHandlers.ts` | ~200 | Agrupa handlers de zoom, exportação Excel e constantes (colunas, templates) |
| `index.ts` | ~20 | Re-exports de todos os hooks |

---

### ✅ FASE 2: Componentes de Tab (CONCLUÍDA)

**Localização:** `src/pages/Admin/tabs/`

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `AdminEventsTab.tsx` | ~230 | Tab de Eventos com lista, filtros, virtualização e controle de vagas |
| `AdminPostsTab.tsx` | ~200 | Tab de Postagens com grupos colapsáveis por evento |
| `AdminStatsTab.tsx` | ~220 | Tab de Estatísticas com sub-abas (Stats, Performance, Reports, Analytics, UTM) |
| `AdminSettingsTab.tsx` | ~50 | Tab de Configurações (Master vs Agency) |
| `AdminGuestListTab.tsx` | ~30 | Tab de Guest List (wrapper do GuestListManager) |
| `index.ts` | ~10 | Re-exports de todos os tabs |

---

### ✅ FASE 3: Componentes Compartilhados (CONCLUÍDA)

**Localização:** `src/pages/Admin/components/`

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `AdminHeader.tsx` | ~260 | Header com avatar, trial banners, slot alerts, agency indicator, navegação |
| `AdminStatsCards.tsx` | ~80 | Cards de estatísticas (eventos, posts, submissões, usuários, vendas) |
| `AdminDialogs.tsx` | ~420 | Todos os dialogs (Event, Post, Rejection, Audit, Delete, Zoom, Export, Suggestion, ColumnSelection) |
| `index.ts` | ~5 | Re-exports de todos os componentes |

---

### 🔜 FASE 4: Orquestrador Principal (PRÓXIMA)

**Arquivo:** `src/pages/Admin.tsx`

O Admin.tsx será refatorado para:
- Usar todos os hooks da Fase 1
- Renderizar os tabs da Fase 2
- Usar componentes compartilhados da Fase 3
- Conter apenas lógica de orquestração (~400 linhas)

**Passos:**
1. Importar hooks consolidados de `./Admin/hooks`
2. Importar tabs de `./Admin/tabs`
3. Importar componentes de `./Admin/components`
4. Remover estados locais (já em useAdminState)
5. Remover queries inline (já em useAdminQueries)
6. Remover mutations inline (já em useAdminMutations)
7. Orquestrar passagem de props entre componentes

---

### ⏳ FASE 5: Testes e Validação (PENDENTE)

- [ ] Testar todas as funcionalidades existentes
- [ ] Verificar hot reload performance
- [ ] Validar memory usage
- [ ] Verificar code splitting
- [ ] Testar navegação entre abas
- [ ] Testar dialogs (Event, Post, Rejection, etc.)
- [ ] Testar aprovação/rejeição de submissões
- [ ] Testar exportação de dados

---

## 📝 HISTÓRICO DE MUDANÇAS RECENTES

- [x] [FRONT] 2024-12-13 – **FASE 3 Refatoração Admin.tsx**: Criados 3 componentes compartilhados em src/pages/Admin/components/:
  - `AdminHeader.tsx`: Header completo com avatar, trial banners, slot alerts, agency indicator e navegação
  - `AdminStatsCards.tsx`: Cards de estatísticas com ícones e gradientes
  - `AdminDialogs.tsx`: Todos os dialogs consolidados (Event, Post, Rejection, Audit, Delete, Zoom, Export, Suggestion, ColumnSelection)
- [x] [FRONT] 2024-12-13 – **FASE 2 Refatoração Admin.tsx**: Criados 5 componentes de Tab em src/pages/Admin/tabs/:
  - `AdminEventsTab.tsx`: Lista de eventos com filtros, virtualização e controle de vagas
  - `AdminPostsTab.tsx`: Postagens com grupos colapsáveis por evento e badges de tipo
  - `AdminStatsTab.tsx`: Estatísticas unificadas com sub-abas (Stats, Performance, Reports, Analytics, UTM)
  - `AdminSettingsTab.tsx`: Configurações com suporte Master/Agency
  - `AdminGuestListTab.tsx`: Wrapper para GuestListManager
- [x] [FRONT] 2024-12-13 – **FASE 1 Refatoração Admin.tsx**: Criados 5 hooks consolidados em src/pages/Admin/hooks/:
  - `useAdminState.ts`: Centraliza ~50 useState em categorias (dialogs, selection, deletion, rejection, zoom, ui, statsFilter, loading)
  - `useAdminQueries.ts`: Consolida queries de eventos, submissões e contadores com helpers memoizados
  - `useAdminMutations.ts`: Centraliza mutations de aprovação, rejeição, deleção de eventos/posts/submissões
  - `useAdminAgency.ts`: Encapsula lógica de agência, trial status, profile e cache invalidation
  - `useAdminHandlers.ts`: Agrupa handlers de zoom, exportação Excel e constantes (colunas, templates)
- [x] [FRONT] 2024-12-13 – Adicionado contador de participantes filtrados no ParticipantStatusManager
- [x] [FRONT] 2024-12-13 – Refatorado Dashboard.tsx de 917 para 410 linhas, extraindo DashboardHeader.tsx, DashboardInviteCard.tsx, useDashboardAvatar.ts, useDashboardMutations.ts
- [x] [FRONT] 2024-12-13 – Consolidados tipos em src/types/dashboard.ts (DashboardSubmission, EventStats, DashboardUIState)
- [x] [FRONT] 2024-12-13 – Removidos console.logs de produção, substituídos por logger.info()
- [x] [FRONT] 2024-12-13 – Adicionado filtro por quantidade mínima de posts no ParticipantStatusManager
- [x] [FRONT] 2024-12-13 – Exibindo vagas aprovadas manualmente pela agência no EventRequirementsDisplay
- [x] [FRONT] 2024-12-13 – Refatorado layout mobile do DetailedGoalsReport (cards em mobile, tabela em desktop)
- [x] [DB] 2024-12-13 – Corrigida contagem incorreta de posts no evento TimeWarp recalculando user_event_goals

---

## 📊 VISÃO GERAL DO SISTEMA

Sistema SaaS multi-tenant para gestão de divulgadoras (promoters) de eventos com:
- Gestão de eventos e postagens
- Submissão e aprovação de comprovantes
- Sistema de metas e badges
- Guest List (lista de convidados)
- Push Notifications (PWA)
- Relatórios e analytics

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🔐 Autenticação e Autorização
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Login/Signup por email | ✅ | `Auth.tsx` |
| Confirmação de senha no signup | ✅ | `Auth.tsx` |
| Toggle mostrar/ocultar senha | ✅ | `Auth.tsx` |
| Recuperação de senha | ✅ | `Auth.tsx` |
| Signup por token de agência | ✅ | `AgencySignup.tsx` |
| Signup por slug de agência | ✅ | `AgencySignupBySlug.tsx` |
| Proteção de rotas (RequireAuth) | ✅ | `RequireAuth.tsx` |
| Proteção por papel (ProtectedRoute) | ✅ | `ProtectedRoute.tsx` |
| Papéis: master_admin, agency_admin, user, guest | ✅ | `user_roles` table |
| Sistema de convites para guests | ✅ | `GuestInviteDialog.tsx` |
| Aceitar convite de guest | ✅ | `AcceptInvite.tsx` |

### 👤 Perfil de Usuário
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Edição de perfil (nome, telefone, Instagram) | ✅ | `DashboardProfile.tsx` |
| Avatar/foto de perfil | ✅ | `DashboardProfile.tsx` |
| Faixa de seguidores | ✅ | `DashboardProfile.tsx` |
| Gênero | ✅ | `DashboardProfile.tsx` |
| Preferência de tema (dark/light) | ✅ | `ThemeProvider.tsx` |

### 📅 Gestão de Eventos
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| CRUD de eventos | ✅ | `EventDialog.tsx` |
| Interface com 5 abas (Básico, Requisitos, Config, Público, Avançado) | ✅ | `EventDialog.tsx` |
| Requisitos múltiplos por evento | ✅ | `event_requirements` table |
| Ativar/Desativar eventos | ✅ | `EventDialog.tsx` |
| Agendamento automático (auto_activate_at, auto_deactivate_at) | ✅ | `auto-event-scheduler` edge function |
| Imagem do evento | ✅ | `EventDialog.tsx` |
| Slug do evento | ✅ | `EventDialog.tsx` |
| Número de vagas | ✅ | `EventDialog.tsx` |
| Setor e Produtor | ✅ | `EventDialog.tsx` |
| Grupo do WhatsApp | ✅ | `EventDialog.tsx` |
| Aceitar posts e/ou vendas | ✅ | `EventDialog.tsx` |
| Gênero alvo | ✅ | `EventDialog.tsx` |
| Notas internas | ✅ | `EventDialog.tsx` |
| Templates de evento | ✅ | `useEventTemplates.ts` |

### 📝 Gestão de Posts/Postagens
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| CRUD de posts por evento | ✅ | `PostDialog.tsx` |
| Tipos de post (divulgação, venda, seleção perfil) | ✅ | `PostDialog.tsx` |
| Deadline por post | ✅ | `PostDialog.tsx` |
| Numeração de posts | ✅ | `PostDialog.tsx` |
| Visualização em grupos colapsáveis | ✅ | `Admin.tsx` |
| Contadores de submissão por tipo | ✅ | `Admin.tsx` |
| Master Posts Manager | ✅ | `MasterPostsManager.tsx` |

### 📤 Submissão de Comprovantes
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Upload de screenshot de post | ✅ | `Submit.tsx` |
| Upload de screenshot de perfil | ✅ | `Submit.tsx` |
| Compressão de imagem client-side | ✅ | `Submit.tsx` |
| Retry automático com exponential backoff | ✅ | `Submit.tsx` |
| Link do Instagram (opcional) | ✅ | `Submit.tsx` |
| Prova de venda | ✅ | `Submit.tsx` |
| Email para ticketeira (auto-preenchimento) | ✅ | `Submit.tsx` |
| Faixa de seguidores | ✅ | `Submit.tsx` |
| Rate limiting (15/hora) | ✅ | `check_rate_limit()` |
| Mensagens de erro específicas | ✅ | `Submit.tsx` |

### ✅ Aprovação/Rejeição de Submissões
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Lista de submissões pendentes | ✅ | `AdminSubmissionList.tsx` |
| Aprovar/Rejeitar individualmente | ✅ | `AdminSubmissionList.tsx` |
| Aprovação em massa | ✅ | `AdminSubmissionList.tsx` |
| Kanban de submissões | ✅ | `SubmissionKanban.tsx` |
| Grid de cards | ✅ | `SubmissionCardsGrid.tsx` |
| Zoom em imagens | ✅ | `SubmissionZoomDialog.tsx` |
| Motivo de rejeição | ✅ | `AdminSubmissionList.tsx` |
| Templates de rejeição | ✅ | `rejection_templates` table |
| Comentários em submissões | ✅ | `SubmissionComments.tsx` |
| Tags em submissões | ✅ | `TagManager.tsx` |
| Logs de mudança de status | ✅ | `SubmissionAuditLog.tsx` |
| Verificação de Instagram | ✅ | `verify-instagram-post` edge function |
| Validação de imagem | ✅ | `validate-image` edge function |
| Adicionar submissão manual | ✅ | `AddManualSubmissionDialog.tsx` |

### 🎯 Sistema de Metas
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Cálculo automático de progresso | ✅ | `check_and_update_user_goal()` |
| Múltiplos requisitos (OR lógico) | ✅ | `event_requirements` + `check_and_update_user_goal()` |
| Progresso visual (badge) | ✅ | `GoalProgressBadge.tsx` |
| Notificação de meta atingida | ✅ | `notify-goal-achieved` edge function |
| Configuração de notificações por agência | ✅ | `GoalNotificationSettings.tsx` |
| Relatório de metas atingidas | ✅ | `GoalAchievedReport.tsx` |
| Relatório detalhado de metas | ✅ | `DetailedGoalsReport.tsx` |
| Migração de metas | ✅ | `MigrationUserGoalsButton.tsx` |

### 🏆 Sistema de Badges
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Badges por quantidade de aprovações | ✅ | `award_progression_badges()` trigger |
| Bronze (5), Prata (10), Ouro (25), Diamante (50), Lenda (100) | ✅ | `user_badges` table |
| Exibição de badges | ✅ | `BadgeDisplay.tsx` |
| Notificação ao ganhar badge | ✅ | `notifications` table |

### 📊 Controle de Vagas
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Contador de vagas disponíveis | ✅ | `EventSlotsCounter.tsx` |
| Cálculo incluindo metas + aprovações manuais | ✅ | `get_event_available_slots()` |
| Histórico de ocupação | ✅ | `event_slots_history` table |
| Previsão de esgotamento | ✅ | `SlotExhaustionPrediction.tsx` |
| Alerta de vagas esgotando | ✅ | `SlotExhaustionAlert.tsx` |

### 👥 Gestão de Participantes
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Status: ativo, removido, meta batida | ✅ | `ParticipantStatusManager.tsx` |
| Aprovação manual pela agência | ✅ | `approve_participant_manually()` |
| Motivo de remoção | ✅ | `user_event_goals.withdrawn_reason` |
| Ranking de promoters | ✅ | `TopPromotersRanking.tsx` |
| Paginação (30 por página) | ✅ | `ParticipantStatusManager.tsx` |
| Busca global | ✅ | `ParticipantStatusManager.tsx` |
| Exibição de telefone | ✅ | `ParticipantStatusManager.tsx` |

### 📋 Guest List (Lista de Convidados)
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| CRUD de eventos de guest list | ✅ | `GuestListManager.tsx` |
| Múltiplas datas por evento | ✅ | `guest_list_dates` table |
| Preços por gênero | ✅ | `DateDialogForm.tsx` |
| Múltiplos tipos de preço (entrada, consumível, etc.) | ✅ | `price_details` JSONB |
| Capacidade máxima | ✅ | `guest_list_dates.max_capacity` |
| Auto-desativação após início | ✅ | `auto-deactivate-guest-list-dates` edge function |
| Links alternativos pós-início | ✅ | `AlternativeLinkCard.tsx` |
| Imagem do evento | ✅ | `guest_list_dates.image_url` |
| Página de registro público | ✅ | `GuestListRegister.tsx` |
| Confirmação de registro | ✅ | `GuestListConfirmation.tsx` |
| Anti-spam (honeypot) | ✅ | `AntiSpamField.tsx` |
| Validação de registro | ✅ | `validate-guest-registration` edge function |
| Email automático com lista | ✅ | `send-guest-list-email` edge function |
| Analytics de conversão | ✅ | `GuestListAnalytics.tsx` |
| Página de "sem datas" personalizada | ✅ | `NoAvailableDatesPage.tsx` |
| Compartilhamento via WhatsApp | ✅ | `GuestListConfirmation.tsx` |
| UTM tracking | ✅ | `guest_list_registrations` table |
| Copiar nomes (selecionados ou todos) | ✅ | `GuestListManager.tsx` |
| Contador de participantes por data | ✅ | `GuestListManager.tsx` |

### 🔔 Notificações
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Sino de notificações | ✅ | `NotificationBell.tsx` |
| Notificações in-app | ✅ | `notifications` table |
| Push notifications (PWA) | ✅ | `usePushNotifications.ts` |
| Configuração de preferências | ✅ | `NotificationPreferences.tsx` |
| Push settings por usuário | ✅ | `PushNotificationSettings.tsx` |
| Teste de push | ✅ | `PushNotificationTest.tsx` |
| Analytics de push | ✅ | `PushNotificationAnalytics.tsx` |
| Health dashboard push | ✅ | `PushHealthDashboard.tsx` |
| Diagnóstico PWA | ✅ | `PWADiagnosticDashboard.tsx` |
| Página de diagnóstico push | ✅ | `PushDiagnostic.tsx` |
| Lembretes de deadline | ✅ | `notify-deadlines` edge function |
| Lembretes de eventos | ✅ | `event-reminders-cron` edge function |
| Expiração de guests | ✅ | `notify-guest-expiration` edge function |

### 📱 PWA
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Service Worker (Workbox) | ✅ | `src/sw.ts` |
| Prompt de instalação | ✅ | `PWAInstallPrompt.tsx` |
| Prompt de atualização | ✅ | `PWAUpdatePrompt.tsx` |
| Página de instalação | ✅ | `Install.tsx` |
| Detecção de iOS | ✅ | `usePWAInstall.ts` |
| Offline fallback | ✅ | `src/sw.ts` |

### 👤 Gestão de Usuários (Admin)
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Lista de usuários da agência | ✅ | `UserManagement.tsx` |
| Editar usuário | ✅ | `UserManagement.tsx` |
| Promover/Rebaixar papel | ✅ | `UserManagement.tsx` |
| Deletar usuário | ✅ | `delete-user` edge function |
| Importar usuários (CSV) | ✅ | `import-users` edge function |
| Exportar usuários (CSV) | ✅ | `CSVImportExport.tsx` |
| Todos os usuários (Master) | ✅ | `AllUsersManagement.tsx` |
| Performance de usuários | ✅ | `UserPerformance.tsx` |

### 🏢 Gestão de Agências
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Lista de agências (Master) | ✅ | `AdminManager.tsx` |
| Criar agência | ✅ | `EditAgencyDialog.tsx` |
| Editar agência | ✅ | `EditAgencyDialog.tsx` |
| Card de agência | ✅ | `AgencyAdminCard.tsx` |
| Configurações da agência | ✅ | `AgencyAdminSettings.tsx` |
| Logo da agência | ✅ | `agency-logos` bucket |
| OG Image | ✅ | `agency-og-images` bucket |
| Solicitações de agência | ✅ | `AgencyRequestsManager.tsx` |
| Aprovar/Rejeitar solicitação | ✅ | `approve-agency-request` edge function |
| Email de solicitação | ✅ | `send-agency-request-email` edge function |
| Trial de 10 dias | ✅ | `check-trial-expiration` edge function |
| Extensão de trial | ✅ | `extend-trial` edge function |
| WhatsApp de suporte por agência | ✅ | `agencies.support_whatsapp` |
| Mensagem de convite customizada | ✅ | `agencies.invite_message_template` |

### 💳 Planos e Pagamentos
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Gestão de planos | ✅ | `PlanManager.tsx` |
| Integração Stripe | ✅ | `stripe-webhook` edge function |
| Checkout session | ✅ | `create-checkout-session` edge function |
| Criar produtos Stripe | ✅ | `create-stripe-products` edge function |
| Limites por plano (eventos, influencers) | ✅ | `subscription_plans` table |

### 📊 Relatórios e Analytics
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Estatísticas por evento | ✅ | `DashboardStats.tsx` |
| Performance por usuário | ✅ | `UserPerformance.tsx` |
| Relatórios financeiros | ✅ | `FinancialReports.tsx` |
| Dashboard de conversão | ✅ | `ConversionDashboard.tsx` |
| Analytics de referral | ✅ | `ReferralAnalytics.tsx` |
| Insights com IA | ✅ | `AIInsights.tsx` |
| Predição de metas (IA) | ✅ | `ai-goal-prediction` edge function |
| Gerador de links UTM | ✅ | `UTMLinkGenerator.tsx` |
| Segmentos de usuários | ✅ | `SegmentManager.tsx` |

### 🔧 Configurações do Sistema
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Configurações admin | ✅ | `AdminSettings.tsx` |
| Timezone configurável | ✅ | `admin_settings.system_timezone` |
| Changelog do sistema | ✅ | `ChangelogManager.tsx` |
| FAQ por evento | ✅ | `FAQManager.tsx` |
| Diagnóstico GTM | ✅ | `GTMDiagnostic.tsx` |
| Menu DevTools | ✅ | `DevToolsMenu.tsx` |
| Atalhos de teclado | ✅ | `useAdminKeyboardShortcuts.ts` |
| Tutorial guiado (Admin) | ✅ | `AdminTutorialGuide.tsx` |
| Tutorial guiado (User) | ✅ | `TutorialGuide.tsx` |

### 🔗 Convite de Amigos
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Botão de convite WhatsApp | ✅ | `Dashboard.tsx` |
| Mensagem customizada por agência | ✅ | `agencies.invite_message_template` |
| Tracking de referrals | ✅ | `referral_analytics` table |
| Analytics de indicações | ✅ | `ReferralAnalytics.tsx` |

### 🛡️ Segurança
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| RLS em todas as tabelas | ✅ | Migrations |
| Rate limiting | ✅ | `rate_limits` table |
| Validação de entrada | ⚠️ | Parcial |
| Mensagens de erro genéricas | ⚠️ | Parcial |
| search_path em funções | ⚠️ | 1 função pendente |

### ⚡ Otimizações de Performance
| Funcionalidade | Status | Componente |
|----------------|--------|------------|
| Lazy loading de páginas | ✅ | `App.tsx` |
| Code splitting (manualChunks) | ✅ | `vite.config.ts` |
| React Query caching | ✅ | `main.tsx` |
| Batch signed URLs | ✅ | `signedUrlService.ts` |
| Compressão de imagens | ✅ | `Submit.tsx` |
| Memoização de componentes | ✅ | `memoized/` folder |
| Paginação | ✅ | `usePagination.ts` |
| Virtualização de listas | ✅ | `useVirtualizedList.ts` |
| Índices de banco otimizados | ✅ | Migrations |
| Preconnect/DNS-prefetch | ✅ | `index.html` |

---

## ⚠️ PENDÊNCIAS E MELHORIAS

### 🔴 Alta Prioridade

| Item | Descrição | Status | Complexidade |
|------|-----------|--------|--------------|
| Email disclosure | Linha 263 em AcceptInvite.tsx expõe email | 🔴 Pendente | Fácil |
| search_path function | `update_guest_list_events_updated_at` sem search_path | 🔴 Pendente | Fácil |
| Eventos público expõe campos | internal_notes, ticketer_email expostos | 🔴 Pendente | Médio |

### 🟡 Média Prioridade

| Item | Descrição | Status | Complexidade |
|------|-----------|--------|--------------|
| Validação de entrada edge functions | Adicionar zod schemas | 🟡 Parcial | Médio |
| Deletar submissões rejeitadas | Usuários poderem reenviar | 🟡 Pendente | Fácil |
| Virtual scrolling listas grandes | Para >100 itens | 🟡 Pendente | Médio |
| Aria-labels acessibilidade | Melhorar screen readers | 🟡 Pendente | Médio |

### 🟢 Baixa Prioridade

| Item | Descrição | Status | Complexidade |
|------|-----------|--------|--------------|
| Loading states consistentes | Skeleton em todos componentes | 🟢 Parcial | Baixo |
| Testes automatizados | Unit/Integration tests | 🟢 Não iniciado | Alto |
| Documentação de API | OpenAPI/Swagger | 🟢 Não iniciado | Médio |

---

## 🔄 EDGE FUNCTIONS IMPLEMENTADAS

### Notificações
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `send-push-notification` | HTTP | Envia push via VAPID |
| `notify-goal-achieved` | HTTP | Notifica meta atingida |
| `notify-deadlines` | Cron | Avisa deadlines próximos |
| `event-reminders-cron` | Cron | Lembretes de eventos |
| `send-guest-invite` | HTTP | Convite por email |
| `notify-guest-expiration` | Cron | Avisa expiração de acesso |

### Automação
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `auto-deactivate-events` | Cron | Desativa eventos expirados |
| `auto-deactivate-guest-list-dates` | Cron | Desativa datas passadas |
| `auto-event-scheduler` | Cron | Ativa/desativa agendados |
| `expire-guests` | Cron | Expira convites antigos |
| `send-guest-list-email` | Cron | Envia lista de inscritos |
| `refresh-signed-urls` | Cron | Renova URLs assinadas |
| `record-slots-snapshot` | Cron | Registra histórico de vagas |

### Validação
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `validate-image` | HTTP | Valida screenshots |
| `validate-guest-registration` | HTTP | Anti-spam/bot |
| `verify-instagram-post` | HTTP | Verifica link do IG |
| `validate-push-subscriptions` | HTTP | Valida subscriptions push |

### Usuários
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `create-agency-admin` | HTTP | Cria admin de agência |
| `delete-user` | HTTP | Remove usuário |
| `import-users` | HTTP | Importa usuários CSV |
| `promote-admin` | HTTP | Promove a admin |
| `populate-user-goals-multi-requirements` | HTTP | Recalcula metas |

### Agências
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `approve-agency-request` | HTTP | Aprova solicitação |
| `send-agency-request-email` | HTTP | Email de solicitação |
| `check-trial-expiration` | Cron | Verifica trials expirados |
| `extend-trial` | HTTP | Estende período trial |

### Pagamentos
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `create-checkout-session` | HTTP | Inicia checkout Stripe |
| `stripe-webhook` | HTTP | Processa eventos Stripe |
| `create-stripe-products` | HTTP | Cria produtos no Stripe |

### Analytics
| Função | Trigger | Descrição |
|--------|---------|-----------|
| `track-guest-list-analytics` | HTTP | Tracking de conversão |
| `ai-goal-prediction` | HTTP | Predição com IA |

---

## 📱 HOOKS CUSTOMIZADOS

### Autenticação
| Hook | Descrição |
|------|-----------|
| `useAuth` | Listener de auth state |
| `useUserRole` | Papel do usuário atual |
| `useUserRoleQuery` | Query do papel com cache |
| `useIsGuest` | Verifica se é guest |

### Dados
| Hook | Descrição |
|------|-----------|
| `useDashboard` | Dados do dashboard |
| `useDashboardData` | Dados otimizados |
| `useEventsQuery` | Lista de eventos |
| `useSubmissionsQuery` | Submissões |
| `useProfilesQuery` | Perfis |
| `useAgenciesQuery` | Agências |
| `useAdminSettingsQuery` | Configurações |
| `useUserGoalProgress` | Progresso de metas |
| `useEventAvailableSlots` | Vagas disponíveis |
| `useAllUsers` | Todos usuários |
| `useUserManagement` | Gestão de usuários |
| `useUserPerformance` | Performance |
| `useFinancialReports` | Relatórios financeiros |
| `useSubmissionCounters` | Contadores |
| `useEventTemplates` | Templates de evento |
| `useGuestInvites` | Convites de guest |
| `useGuestPermissions` | Permissões de guest |
| `useOptimizedQueries` | Queries otimizadas |
| `useCachedData` | Cache de dados |
| `useMutations` | Mutations consolidadas |

### UI/UX
| Hook | Descrição |
|------|-----------|
| `usePagination` | Paginação |
| `useSignedUrls` | URLs assinadas (cache) |
| `usePushNotifications` | Push notifications |
| `usePWAInstall` | Instalação PWA |
| `usePWAUpdate` | Atualização PWA |
| `useVirtualizedList` | Virtualização |
| `useMobile` | Detecção mobile |
| `useGTM` | Google Tag Manager |
| `useAdminKeyboardShortcuts` | Atalhos teclado |

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais (25+)
- `agencies` - Agências/tenants
- `profiles` - Perfis de usuários
- `user_roles` - Papéis (master_admin, agency_admin, user)
- `user_agencies` - Associação usuário-agência
- `events` - Eventos de divulgação
- `event_requirements` - Requisitos múltiplos
- `posts` - Posts/postagens
- `submissions` - Submissões/comprovantes
- `submission_logs` - Histórico de status
- `submission_comments` - Comentários
- `submission_tags` - Tags
- `user_event_goals` - Metas por usuário
- `user_badges` - Badges conquistados
- `notifications` - Notificações in-app
- `notification_preferences` - Preferências
- `notification_logs` - Logs de push
- `push_subscriptions` - Subscriptions push
- `agency_guests` - Convidados temporários
- `guest_event_permissions` - Permissões por evento
- `guest_audit_log` - Auditoria de guests
- `guest_list_events` - Eventos de guest list
- `guest_list_dates` - Datas/preços
- `guest_list_registrations` - Inscrições
- `guest_list_analytics` - Analytics
- `admin_settings` - Configurações
- `rate_limits` - Rate limiting
- `referral_analytics` - Indicações
- `subscriptions` - Assinaturas Stripe
- `subscription_plans` - Planos
- `event_slots_history` - Histórico vagas
- `system_changelog` - Changelog

### Funções SQL Principais (40+)
- `check_and_update_user_goal()` - Cálculo de metas
- `get_event_available_slots()` - Vagas disponíveis
- `get_top_promoters_ranking()` - Ranking
- `approve_participant_manually()` - Aprovação manual
- `update_participation_status()` - Status participante
- `is_agency_admin_for()` - Verifica admin
- `is_current_user_master_admin()` - Verifica master
- `check_rate_limit()` - Rate limiting
- `award_progression_badges()` - Trigger de badges
- E muitas outras...

---

## 📝 NOTAS IMPORTANTES

### Push Notifications no iOS
⚠️ **LIMITAÇÃO:** Web Push no iOS só funciona se:
1. iOS 16.4 ou superior
2. App instalado como PWA
3. App aberto via Home Screen

### Timezone
Sistema configurado para `America/Sao_Paulo` (BRT).
Funções de timezone em `src/lib/dateUtils.ts`.

### Tipos de Submissão
- `divulgacao` - Posts de divulgação (contam como posts)
- `sale` - Comprovantes de venda (contam como sales)
- `selecao_perfil` - Seleção de perfil (NÃO conta para metas)

### Caching
- React Query: staleTime 2min global, 10s para dados críticos
- Signed URLs: cache local + localStorage
- Service Worker: precaching de assets

---

## 📚 LINKS ÚTEIS

- [Documentação Lovable](https://docs.lovable.dev)
- [Documentação Supabase](https://supabase.com/docs)
- [Web Push iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Shadcn/UI](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com/docs)

---

**Última atualização:** 2025-12-11
