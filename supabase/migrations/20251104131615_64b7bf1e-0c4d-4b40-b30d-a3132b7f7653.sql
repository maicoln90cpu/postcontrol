-- ✅ STRIPE INTEGRATION: Adicionar colunas Stripe aos planos existentes
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ✅ STRIPE INTEGRATION: Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ✅ Habilitar RLS na tabela subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ✅ Políticas RLS para subscriptions
CREATE POLICY "Master admins podem ver todas as assinaturas"
  ON subscriptions FOR SELECT
  USING (is_master_admin(auth.uid()));

CREATE POLICY "Master admins podem gerenciar assinaturas"
  ON subscriptions FOR ALL
  USING (is_master_admin(auth.uid()));

CREATE POLICY "Agency admins podem ver suas assinaturas"
  ON subscriptions FOR SELECT
  USING (
    is_current_user_agency_admin() 
    AND agency_id = get_current_user_agency_id()
  );

-- ✅ Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency_id ON subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);