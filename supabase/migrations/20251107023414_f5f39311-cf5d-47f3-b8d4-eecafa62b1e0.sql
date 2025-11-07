-- ✅ FASE 1 - Item 1.1: Adicionar 4º Plano (Premium)
INSERT INTO subscription_plans (
  plan_key, 
  plan_name, 
  monthly_price, 
  max_influencers, 
  max_events, 
  features, 
  is_visible, 
  is_popular, 
  display_order
) VALUES (
  'premium', 
  'Premium', 
  199.90,
  500, 
  100, 
  '["Até 500 divulgadores", "Até 100 eventos", "Relatórios avançados", "Suporte prioritário", "AI Insights", "Automação completa"]'::jsonb,
  true, 
  false, 
  4
)
ON CONFLICT (plan_key) DO NOTHING;