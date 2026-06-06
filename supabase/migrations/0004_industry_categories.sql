-- Folio: industry categories seed
insert into categories (slug, name, description, active) values
  ('real-estate', 'Real Estate', 'Property, rentals, development, and investment trends.', true),
  ('health',      'Health & Wellness', 'Clinics, fitness, supplements and wellness brands.', true),
  ('education',   'Education', 'Schools, edtech, tutoring and learning programs.', true),
  ('tech',        'Tech & SaaS', 'Startups, SaaS, developer tools and IT services.', true),
  ('ecommerce',   'E-commerce', 'Online stores, DTC brands and marketplaces.', true),
  ('food',        'Food & Beverage', 'Restaurants, cafés, food brands and delivery.', true),
  ('fashion',     'Fashion & Beauty', 'Apparel, accessories, beauty and personal care.', true),
  ('finance',     'Finance & Fintech', 'Lending, payments, accounting and fintech.', true),
  ('agriculture', 'Agriculture', 'Farms, agritech, processing and supply.', true),
  ('logistics',   'Logistics & Transport', 'Shipping, fleet, last-mile and freight.', true),
  ('creative',    'Creative & Media', 'Agencies, content, music and publishing.', true),
  ('hospitality', 'Hospitality & Travel', 'Hotels, tourism, events and venues.', true)
on conflict (slug) do nothing;

-- Disable any old generic seeds that have no subscriptions and no insights so the
-- landing/category lists default to industries.
update categories
set active = false
where slug in ('cashflow','marketing','operations','hr')
  and not exists (select 1 from user_categories uc where uc.category_id = categories.id)
  and not exists (select 1 from insight_drafts d where d.category_id = categories.id);
