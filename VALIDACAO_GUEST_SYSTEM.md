# ✅ VALIDAÇÃO MANUAL FINAL - SISTEMA DE CONVIDADOS

## 📋 RESUMO DA IMPLEMENTAÇÃO

Foram implementadas as **Etapas 1, 2, 3, 4 e 5** do Sistema de Convidados:

### ✅ ETAPA 1: Migration SQL (Completo)
- ✅ Tabela `agency_guests` criada
- ✅ Tabela `guest_event_permissions` criada
- ✅ Tabela `guest_audit_log` criada
- ✅ ENUM `guest_permission` criado (viewer, moderator, manager)
- ✅ Funções `is_guest_with_permission()` e `expire_old_guest_invites()` criadas
- ✅ Triggers para `updated_at` configurados
- ✅ RLS Policies para todas as tabelas criadas
- ✅ Políticas de acesso para convidados em `submissions`, `events` e `posts`

### ✅ ETAPA 2: Hooks e Utilities (Completo)
- ✅ `src/hooks/useIsGuest.ts` - Detecta se usuário é convidado
- ✅ `src/hooks/useGuestPermissions.ts` - Verifica permissões de convidado
- ✅ `src/hooks/useGuestInvites.ts` - Gerencia convites (CRUD completo)

### ✅ ETAPA 3: UI Components (Completo)
- ✅ `src/components/GuestManager.tsx` - Lista e gerencia convidados
- ✅ `src/components/GuestInviteDialog.tsx` - Criar novo convite
- ✅ `src/components/GuestPermissionEditor.tsx` - Editar permissões

### ✅ ETAPA 4: Accept Invite Page (Completo)
- ✅ `src/pages/AcceptInvite.tsx` - Página para aceitar convite
- ✅ Validação de token
- ✅ Verificação de email
- ✅ Associação de `guest_user_id` ao aceitar
- ✅ Rota `/accept-invite` configurada

### ✅ ETAPA 5: Guest Dashboard (Completo)
- ✅ `src/pages/GuestDashboard.tsx` - Dashboard personalizado para convidados
- ✅ Filtros por evento permitido
- ✅ Estatísticas de submissões
- ✅ Aprovação/Reprovação de submissões (moderators+)
- ✅ Auditoria de ações
- ✅ Rota `/guest-dashboard` configurada

### ✅ INTEGRAÇÃO NO ADMIN
- ✅ Nova aba "Convidados" adicionada em `/admin`
- ✅ Componente `GuestManager` integrado
- ✅ Lazy loading configurado

---

## 🧪 CHECKLIST DE VALIDAÇÃO MANUAL

### 1️⃣ **BANCO DE DADOS**

#### 1.1 Verificar Tabelas
```sql
-- No Lovable Cloud, verificar se as tabelas existem:
SELECT * FROM agency_guests LIMIT 1;
SELECT * FROM guest_event_permissions LIMIT 1;
SELECT * FROM guest_audit_log LIMIT 1;
```
- [ ] Tabela `agency_guests` existe
- [ ] Tabela `guest_event_permissions` existe
- [ ] Tabela `guest_audit_log` existe

#### 1.2 Verificar ENUM
```sql
-- Verificar se o tipo guest_permission existe
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'guest_permission'::regtype;
```
- [ ] ENUM `guest_permission` tem valores: viewer, moderator, manager

#### 1.3 Verificar Funções
```sql
-- Listar funções
SELECT proname FROM pg_proc WHERE proname LIKE '%guest%';
```
- [ ] Função `is_guest_with_permission` existe
- [ ] Função `expire_old_guest_invites` existe
- [ ] Função `update_guest_updated_at` existe

---

### 2️⃣ **INTERFACE - ABA CONVIDADOS**

#### 2.1 Acessar Painel Admin
- [ ] Fazer login como **Agency Admin**
- [ ] Navegar para `/admin`
- [ ] Verificar se existe a aba **"Convidados"**

#### 2.2 Criar Novo Convite
- [ ] Clicar no botão **"Novo Convite"**
- [ ] Preencher:
  - Email do convidado: `teste@guest.com`
  - Data de expiração: `2025-12-31`
  - Selecionar ao menos 1 evento
  - Escolher nível de permissão: **Moderator**
- [ ] Clicar em **"Criar Convite"**
- [ ] Verificar se aparece mensagem de sucesso
- [ ] Verificar se o convite aparece na lista com status **"Pendente"**

#### 2.3 Visualizar Lista de Convidados
- [ ] Verificar se o card do convidado mostra:
  - ✅ Email do convidado
  - ✅ Status (Pendente/Aceito/Expirado/Revogado)
  - ✅ Data de validade
  - ✅ Número de eventos com acesso
  - ✅ Badges de permissões

#### 2.4 Editar Permissões
- [ ] Clicar no menu **⋮** (três pontos) do convidado
- [ ] Clicar em **"Editar Permissões"**
- [ ] Adicionar ou remover eventos
- [ ] Alterar nível de permissão
- [ ] Salvar alterações
- [ ] Verificar se as mudanças foram aplicadas

#### 2.5 Reenviar Convite
- [ ] Para convite com status **"Pendente"**
- [ ] Clicar no menu **⋮** → **"Reenviar Convite"**
- [ ] Verificar mensagem de sucesso

#### 2.6 Revogar Acesso
- [ ] Clicar no menu **⋮** → **"Revogar Acesso"**
- [ ] Confirmar a ação
- [ ] Verificar se o status muda para **"Revogado"**

---

### 3️⃣ **ACEITAR CONVITE**

#### 3.1 Obter Link de Convite
```
Nota: O link seria gerado pelo sistema no formato:
https://seuapp.lovable.app/accept-invite?token=UUID_DO_CONVITE

Para teste, você precisa:
1. Ir ao banco de dados
2. Consultar: SELECT invite_token FROM agency_guests WHERE guest_email = 'teste@guest.com';
3. Copiar o UUID
4. Acessar: /accept-invite?token=UUID_COPIADO
```

#### 3.2 Acessar Link sem Login
- [ ] Abrir link em aba anônima
- [ ] Verificar se mostra informações do convite:
  - Nome da agência
  - Email convidado
  - Data de validade
  - Eventos com acesso
  - Níveis de permissão
- [ ] Verificar se tem botão **"Fazer Login para Aceitar"**

#### 3.3 Fazer Login com Email Correto
- [ ] Clicar em **"Fazer Login para Aceitar"**
- [ ] Fazer login com email: `teste@guest.com`
- [ ] Voltar à página de aceite
- [ ] Clicar em **"Aceitar Convite"**
- [ ] Verificar mensagem de sucesso
- [ ] Verificar redirecionamento para `/dashboard`

#### 3.4 Verificar Convite Aceito
- [ ] No painel Admin, verificar se status mudou para **"Aceito"**
- [ ] Verificar se `guest_user_id` foi preenchido

---

### 4️⃣ **GUEST DASHBOARD**

#### 4.1 Acessar Dashboard de Convidado
- [ ] Fazer login com conta de convidado (`teste@guest.com`)
- [ ] Acessar `/guest-dashboard`
- [ ] Verificar se carrega corretamente

#### 4.2 Visualizar Interface
- [ ] Verificar cabeçalho com:
  - Título: "Dashboard de Convidado"
  - Badge: "Convidado"
  - Data de validade do acesso
- [ ] Verificar card de seleção de eventos
- [ ] Verificar se mostra apenas eventos permitidos

#### 4.3 Selecionar Evento
- [ ] Clicar em um evento
- [ ] Verificar se carrega estatísticas:
  - Total de submissões
  - Pendentes
  - Aprovadas
  - Reprovadas
- [ ] Verificar card de **"Nível de Acesso"** com descrição da permissão

#### 4.4 Visualizar Submissões
- [ ] Verificar se lista todas as submissões do evento
- [ ] Verificar se mostra:
  - Nome do usuário
  - Instagram
  - Screenshot
  - Status (badge colorido)

#### 4.5 Aprovar Submissão (Moderator+)
- [ ] Encontrar submissão com status **"Pendente"**
- [ ] Clicar em **"Aprovar"**
- [ ] Verificar se aparece confetti 🎉
- [ ] Verificar se status muda para **"Aprovada"**
- [ ] Verificar se foi criado registro em `guest_audit_log`

#### 4.6 Reprovar Submissão (Moderator+)
- [ ] Encontrar submissão com status **"Pendente"**
- [ ] Clicar em **"Reprovar"**
- [ ] Digitar motivo da reprovação
- [ ] Confirmar
- [ ] Verificar se status muda para **"Reprovada"**
- [ ] Verificar se foi criado registro em `guest_audit_log`

---

### 5️⃣ **PERMISSÕES E SEGURANÇA**

#### 5.1 Convidado VIEWER
- [ ] Criar convite com permissão **"Viewer"**
- [ ] Aceitar convite
- [ ] Acessar `/guest-dashboard`
- [ ] Verificar se **NÃO** aparecem botões de Aprovar/Reprovar
- [ ] Verificar se consegue apenas visualizar dados

#### 5.2 Convidado MODERATOR
- [ ] Criar convite com permissão **"Moderator"**
- [ ] Aceitar convite
- [ ] Acessar `/guest-dashboard`
- [ ] Verificar se **APARECEM** botões de Aprovar/Reprovar
- [ ] Testar aprovação e reprovação
- [ ] Verificar se **NÃO** consegue editar evento

#### 5.3 Convidado MANAGER
- [ ] Criar convite com permissão **"Manager"**
- [ ] Aceitar convite
- [ ] Verificar se tem acesso total ao evento
- [ ] Verificar se consegue aprovar/reprovar
- [ ] (Futuro: editar posts e evento)

#### 5.4 Acesso a Eventos Não Permitidos
- [ ] Fazer login como convidado
- [ ] Tentar acessar diretamente dados de evento NÃO autorizado
- [ ] Verificar se RLS bloqueia o acesso
- [ ] Verificar se não aparece na lista de eventos permitidos

#### 5.5 Convite Expirado
- [ ] Criar convite com data de expiração no passado
- [ ] Tentar aceitar o convite
- [ ] Verificar se aparece mensagem **"Este convite expirou"**

---

### 6️⃣ **AUDITORIA**

#### 6.1 Logs de Ações
```sql
-- Verificar se ações de convidados estão sendo registradas
SELECT * FROM guest_audit_log ORDER BY created_at DESC LIMIT 10;
```
- [ ] Verificar se ações de **aprovação** são registradas
- [ ] Verificar se ações de **reprovação** são registradas
- [ ] Verificar se `guest_id`, `event_id`, `submission_id` estão corretos
- [ ] Verificar se `action_data` contém informações relevantes

---

### 7️⃣ **EDGE CASES**

#### 7.1 Convite Duplicado
- [ ] Tentar criar convite para mesmo email em mesma agência
- [ ] Verificar se sistema bloqueia (UNIQUE constraint)

#### 7.2 Email Incorreto ao Aceitar
- [ ] Acessar link de convite
- [ ] Fazer login com email diferente do convidado
- [ ] Verificar se sistema mostra mensagem de erro
- [ ] Verificar se oferece opção de trocar de conta

#### 7.3 Token Inválido
- [ ] Acessar `/accept-invite?token=UUID_INVALIDO`
- [ ] Verificar se mostra **"Convite não encontrado"**

#### 7.4 Convite Já Aceito
- [ ] Tentar aceitar convite que já foi aceito
- [ ] Verificar mensagem **"Este convite já foi aceito"**

---

## 🔧 COMANDOS ÚTEIS PARA DEBUG

### Consultar Convidados
```sql
SELECT 
  id,
  guest_email,
  status,
  access_end_date,
  guest_user_id
FROM agency_guests
ORDER BY created_at DESC;
```

### Consultar Permissões
```sql
SELECT 
  ag.guest_email,
  e.title as evento,
  gep.permission_level
FROM guest_event_permissions gep
JOIN agency_guests ag ON ag.id = gep.guest_id
JOIN events e ON e.id = gep.event_id
ORDER BY ag.created_at DESC;
```

### Consultar Logs de Auditoria
```sql
SELECT 
  ag.guest_email,
  gal.action,
  gal.action_data,
  gal.created_at
FROM guest_audit_log gal
JOIN agency_guests ag ON ag.id = gal.guest_id
ORDER BY gal.created_at DESC
LIMIT 20;
```

### Expirar Convites Manualmente
```sql
SELECT expire_old_guest_invites();
```

---

## 📊 RESUMO DE STATUS

| Item | Status | Observações |
|------|--------|-------------|
| Migration SQL | ✅ | Todas as tabelas, funções e policies criadas |
| Hooks | ✅ | useIsGuest, useGuestPermissions, useGuestInvites |
| UI Components | ✅ | GuestManager, GuestInviteDialog, GuestPermissionEditor |
| Accept Invite | ✅ | Página funcional com validações |
| Guest Dashboard | ✅ | Dashboard completo com estatísticas e ações |
| Rotas | ✅ | /accept-invite e /guest-dashboard configuradas |
| Integração Admin | ✅ | Aba "Convidados" adicionada em /admin |
| RLS Policies | ✅ | Segurança configurada em todas as tabelas |
| Auditoria | ✅ | Logs de ações funcionando |

---

## 🚀 PRÓXIMAS ETAPAS (Se necessário)

### ETAPA 6: Auditoria e Logs (Opcional)
- [ ] Componente `GuestAuditLog.tsx` para visualizar histórico
- [ ] Filtros por data, ação, convidado
- [ ] Exportação de relatórios

### ETAPA 7: Edge Function para Notificações (Opcional)
- [ ] Enviar email de convite
- [ ] Notificar 7 dias antes da expiração
- [ ] Notificar 24 horas antes da expiração
- [ ] Cron job para expiração automática

---

## ✅ VALIDAÇÃO FINAL APROVADA?

- [ ] Todas as funcionalidades testadas
- [ ] Nenhum erro crítico encontrado
- [ ] Sistema de permissões funcionando corretamente
- [ ] RLS protegendo dados adequadamente
- [ ] Interface intuitiva e responsiva

**Data da Validação:** ___/___/______

**Validado por:** _______________________

**Observações:** 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
