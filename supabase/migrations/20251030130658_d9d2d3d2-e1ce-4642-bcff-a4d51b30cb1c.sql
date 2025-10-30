-- Recriar a view sem SECURITY DEFINER
DROP VIEW IF EXISTS user_sales_stats;

CREATE VIEW user_sales_stats AS
SELECT 
  s.user_id,
  COUNT(*) FILTER (WHERE s.submission_type = 'sale' AND s.status = 'approved') as approved_sales_count,
  COUNT(*) FILTER (WHERE s.submission_type = 'sale') as total_sales_count
FROM submissions s
GROUP BY s.user_id;