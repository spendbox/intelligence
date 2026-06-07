-- Folio: configurable credit cost + unlock rate, plus default seeds.
insert into app_settings (key, value) values
  ('naira_per_credit', '10'::jsonb),
  ('unlock_rate', '0.00001'::jsonb)
on conflict (key) do nothing;
