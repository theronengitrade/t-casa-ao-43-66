-- Inserir alguns pagamentos de exemplo para testar
INSERT INTO business_payments (client_id, year, month, amount, status) 
VALUES 
  ('3520fab3-885a-48fb-bd56-6ca4de14ecbc', 2025, 1, 5000, 'paid'),
  ('3520fab3-885a-48fb-bd56-6ca4de14ecbc', 2025, 2, 5000, 'pending'),
  ('3520fab3-885a-48fb-bd56-6ca4de14ecbc', 2025, 3, 5000, 'overdue');