-- Create view for daily summary
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT 
    DATE(occurred_at) AS date,
    SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) AS total_revenue,
    SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expense,
    SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE -amount END) AS total_profit,
    COUNT(*) AS transaction_count
FROM transactions
GROUP BY DATE(occurred_at);

-- Create view for category performance
CREATE OR REPLACE VIEW v_category_performance AS
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    DATE_FORMAT(t.occurred_at, '%Y-%m') AS period,
    SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE 0 END) AS revenue,
    SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount ELSE 0 END) AS expense,
    SUM(CASE WHEN t.type = 'REVENUE' THEN t.amount ELSE -t.amount END) AS profit,
    COUNT(*) AS transaction_count
FROM categories c
LEFT JOIN transactions t ON c.id = t.category_id
GROUP BY c.id, c.name, DATE_FORMAT(t.occurred_at, '%Y-%m');
