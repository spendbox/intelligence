-- Folio: full industry reseed with marketplace-flavoured descriptions
-- (positions Folio as a leads marketplace, not an insights newsletter)

with rows(slug, name, description) as (values
  ('real-estate',           'Real Estate',              'Buyers and renters looking for property, agents, developers and facility managers.'),
  ('automotive',            'Automotive',               'Customers shopping for cars, parts, repairs, panel beating, detailing, fleet sales and logistics vehicles.'),
  ('construction',          'Construction & Engineering', 'Clients hiring contractors, civil engineers, project managers and material suppliers for builds and renovations.'),
  ('home-services',         'Home Services',            'Households booking cleaners, plumbers, electricians, AC technicians, painters and handymen.'),
  ('health',                'Health & Wellness',        'Patients and households looking for clinics, fitness coaches, supplements, gear and home-care services.'),
  ('beauty',                'Beauty & Personal Care',   'Customers booking salons, makeup artists, spa and grooming services or buying beauty products.'),
  ('fashion',               'Fashion & Apparel',        'Shoppers looking for designers, tailors, boutiques, accessories and bespoke wardrobe pieces.'),
  ('food',                  'Food & Beverage',          'Customers ordering catering, restaurants, cake, pastry, drinks and corporate food services.'),
  ('events',                'Events & Entertainment',   'Hosts hiring event planners, decorators, MCs, DJs, performers, venues and rentals.'),
  ('photography',           'Photography & Videography', 'Clients booking photographers and videographers for weddings, brands, real estate and events.'),
  ('creative',              'Creative & Media',         'Buyers of design, branding, content, copywriting and agency services.'),
  ('marketing',             'Marketing & Advertising',  'Businesses hiring digital marketers, agencies, ad buyers, SEO and growth specialists.'),
  ('tech',                  'Tech & Software',          'Buyers of custom software, web and mobile apps, IT support, dev shops and SaaS subscriptions.'),
  ('education',             'Education & Training',     'Parents, students and HR looking for tutors, schools, edtech, certifications and corporate training.'),
  ('finance',               'Finance & Fintech',        'Clients shopping for accountants, bookkeepers, loans, insurance and fintech tools.'),
  ('legal',                 'Legal & Professional Services', 'Customers hiring lawyers, consultants, accountants, HR and other licensed professionals.'),
  ('ecommerce',             'E-commerce & Retail',      'Shoppers and resellers looking for online stores, wholesalers, dropshippers and product suppliers.'),
  ('logistics',             'Logistics & Transport',    'Customers booking dispatch, haulage, fleet, freight, courier and relocation services.'),
  ('travel',                'Travel & Hospitality',     'Travellers and event hosts booking hotels, tours, lounges, tickets and travel agents.'),
  ('agriculture',           'Agriculture & Farming',    'Buyers of fresh produce, livestock, agritech, processing, equipment and farm inputs.'),
  ('energy',                'Energy & Utilities',       'Clients shopping for solar systems, inverters, generators, gas suppliers and energy installs.'),
  ('manufacturing',         'Manufacturing & Industrial', 'Companies sourcing factories, packaging, fabrication, OEM and B2B production.'),
  ('security',              'Security & Safety',        'Households and businesses hiring guards, CCTV installers, alarm and access-control specialists.'),
  ('sports',                'Sports & Fitness',         'Customers booking coaches, gyms, sports gear, leagues, academies and arenas.'),
  ('religion',              'Religion & Community',     'Communities hiring vendors, planners, sound, projection and venues for religious or community events.')
)
insert into categories (slug, name, description, active)
select slug, name, description, true from rows
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      active = true;
