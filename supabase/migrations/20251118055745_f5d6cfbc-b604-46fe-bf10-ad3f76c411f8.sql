-- 🔧 FASE 2: Limpar subscriptions corrompidas do banco
-- Deletar subscriptions com chaves em formato Base64 padrão (contêm "/" ou "+")
-- Essas subscriptions nunca vão funcionar pois foram registradas com encoding incorreto

DELETE FROM push_subscriptions 
WHERE p256dh LIKE '%/%' 
   OR p256dh LIKE '%+%'
   OR auth LIKE '%/%'
   OR auth LIKE '%+%';

-- Log: Subscriptions com formato incorreto foram removidas
-- Usuários precisarão se re-inscrever para receber notificações