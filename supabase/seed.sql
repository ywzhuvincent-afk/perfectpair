-- Development seed only. These are representative directory records and
-- illustrative model mappings, not a claim of live price, stock or spec.
-- Re-verify each maker field through the ingestion/review workflow before publication.
insert into public.brands (slug, name, country_code, size_system, website_url) values
('aerie', 'Aerie', 'US', 'US_CA', 'https://www.ae.com'),
('anita', 'Anita', 'DE', 'EU', 'https://www.anita.com'),
('bravissimo', 'Bravissimo', 'GB', 'UK', 'https://www.bravissimo.com'),
('chantelle', 'Chantelle', 'FR', 'EU', 'https://us.chantelle.com'),
('curvy-kate', 'Curvy Kate', 'GB', 'UK', 'https://www.curvykate.com'),
('elomi', 'Elomi', 'GB', 'UK', 'https://www.elomilingerie.com'),
('evelyn-bobbie', 'Evelyn & Bobbie', 'US', 'US_CA', 'https://evelynbobbie.com'),
('felina', 'Felina', 'US', 'US_CA', 'https://www.felina.com'),
('fantasie', 'Fantasie', 'GB', 'UK', 'https://www.fantasie.com'),
('freya', 'Freya', 'GB', 'UK', 'https://www.freyalingerie.com'),
('glamorise', 'Glamorise', 'US', 'US_CA', 'https://glamorise.com'),
('harper-wilde', 'Harper Wilde', 'US', 'US_CA', 'https://harperwilde.com'),
('knix', 'Knix', 'CA', 'US_CA', 'https://knix.com'),
('le-mystere', 'Le Mystère', 'US', 'US_CA', 'https://www.lemystere.com'),
('natori', 'Natori', 'US', 'US_CA', 'https://www.natori.com'),
('panache', 'Panache', 'GB', 'UK', 'https://www.panache-lingerie.com'),
('parfait', 'Parfait', 'US', 'US_CA', 'https://parfaitlingerie.com'),
('primadonna', 'PrimaDonna', 'BE', 'EU', 'https://www.primadonna.com'),
('savage-x-fenty', 'Savage X Fenty', 'US', 'US_CA', 'https://www.savagex.com'),
('soma', 'Soma', 'US', 'US_CA', 'https://www.soma.com'),
('thirdlove', 'ThirdLove', 'US', 'US_CA', 'https://www.thirdlove.com'),
('understance', 'Understance', 'CA', 'US_CA', 'https://understance.com'),
('wacoal', 'Wacoal', 'US', 'US_CA', 'https://www.wacoal-america.com'),
('warners', 'Warner''s', 'US', 'US_CA', 'https://www.warners.com'),
('victorias-secret', 'Victoria''s Secret', 'US', 'US_CA', 'https://www.victoriassecret.com'),
('empreinte', 'Empreinte', 'FR', 'EU', 'https://www.empreinte.eu')
on conflict (slug) do update set name = excluded.name, size_system = excluded.size_system, website_url = excluded.website_url;

-- Hosiery seed records use the same brand identity table. They are representative
-- development mappings only and must be re-verified through the source review queue.
insert into public.brands (slug, name, country_code, size_system, website_url) values
('falke', 'Falke', 'DE', 'EU', 'https://www.falke.com'),
('wolford', 'Wolford', 'AT', 'EU', 'https://www.wolford.com'),
('sheertex', 'Sheertex', 'CA', 'US_CA', 'https://www.sheertex.com'),
('spanx', 'Spanx', 'US', 'US_CA', 'https://spanx.com'),
('commando', 'Commando', 'US', 'US_CA', 'https://www.wearcommando.com'),
('heist', 'Heist', 'GB', 'UK', 'https://www.heist-studios.com')
on conflict (slug) do update set name = excluded.name, size_system = excluded.size_system, website_url = excluded.website_url;

insert into public.products (brand_id, slug, name, family, style, wire, cup_construction, support_level, material_composition, features, use_cases, fit, fit_notes, size_system, size_range, band_range, cup_range, construction, current_version) values
((select id from public.brands where slug = 'thirdlove'), 'thirdlove-classic-tshirt', 'Classic T-Shirt Bra', 'Everyday', 't_shirt', 'underwire', 'moulded', 3, '["nylon","elastane"]', array['smooth cups','adjustable straps','hook-and-eye closure'], array['everyday','work','travel'], 'true_to_size', array['Illustrative development seed'], 'US_CA', '30–44 A–H', int4range(30,45,'[)'), '["A","H"]', '{"goreHeight":"medium","wingHeight":"medium","strapPlacement":"centered","closureRows":3,"bandStretch":"medium","wireWidth":"average","cupDepth":"average"}', 'seed-2026.09'),
((select id from public.brands where slug = 'panache'), 'panache-envy-balconette', 'Envy Balconette', 'Envy', 'balconette', 'underwire', 'seamed', 5, '["polyamide","elastane"]', array['three-part cup','side support','firm band'], array['everyday','work','occasion'], 'varies', array['Illustrative development seed'], 'UK', '28–40 D–J', int4range(28,41,'[)'), '["D","J"]', '{"goreHeight":"high","wingHeight":"high","strapPlacement":"wide_set","closureRows":3,"bandStretch":"low","wireWidth":"wide","cupDepth":"projected"}', 'seed-2026.09'),
((select id from public.brands where slug = 'freya'), 'freya-offbeat-side-support', 'Offbeat Side Support', 'Offbeat', 'plunge', 'underwire', 'seamed', 4, '["polyamide","elastane"]', array['side-support panel','low center front','adjustable straps'], array['everyday','occasion'], 'true_to_size', array['Illustrative development seed'], 'UK', '28–38 D–J', int4range(28,39,'[)'), '["D","J"]', '{"goreHeight":"low","wingHeight":"medium","strapPlacement":"centered","closureRows":3,"bandStretch":"medium","wireWidth":"average","cupDepth":"projected"}', 'seed-2026.09'),
((select id from public.brands where slug = 'wacoal'), 'wacoal-basic-beauty', 'Basic Beauty Full Figure', 'Basic Beauty', 'full_coverage', 'underwire', 'moulded', 5, '["nylon","spandex"]', array['full coverage','wide wings','supportive frame'], array['everyday','work','travel'], 'true_to_size', array['Illustrative development seed'], 'US_CA', '32–44 C–H', int4range(32,45,'[)'), '["C","H"]', '{"goreHeight":"high","wingHeight":"high","strapPlacement":"wide_set","closureRows":4,"bandStretch":"medium","wireWidth":"wide","cupDepth":"average"}', 'seed-2026.09'),
((select id from public.brands where slug = 'natori'), 'natori-feathers-plunge', 'Feathers Plunge', 'Feathers', 'plunge', 'underwire', 'padded', 3, '["nylon","elastane"]', array['low plunge','light padding','convertible straps'], array['occasion','work'], 'runs_small', array['Illustrative development seed'], 'US_CA', '30–38 A–G', int4range(30,39,'[)'), '["A","G"]', '{"goreHeight":"low","wingHeight":"low","strapPlacement":"convertible","closureRows":2,"bandStretch":"medium","wireWidth":"narrow","cupDepth":"shallow"}', 'seed-2026.09'),
((select id from public.brands where slug = 'chantelle'), 'chantelle-c-comfort-wirefree', 'Comfort Wirefree', 'Comfort', 'wireless', 'wireless', 'soft_cup', 2, '["polyamide","elastane"]', array['wire-free','smooth knit','wide underband'], array['lounge','everyday','travel'], 'true_to_size', array['Illustrative development seed'], 'EU', 'XS–2XL', null, '[]', '{"wingHeight":"medium","strapPlacement":"centered","bandStretch":"high"}', 'seed-2026.09'),
((select id from public.brands where slug = 'elomi'), 'elomi-matilda-plunge', 'Matilda Plunge', 'Matilda', 'plunge', 'underwire', 'unlined', 5, '["polyamide","elastane"]', array['three-piece cup','side support','adjustable straps'], array['everyday','work','occasion'], 'true_to_size', array['Illustrative development seed'], 'UK', '34–48 DD–K', int4range(34,49,'[)'), '["DD","K"]', '{"goreHeight":"low","wingHeight":"high","strapPlacement":"centered","closureRows":4,"bandStretch":"low","wireWidth":"wide","cupDepth":"projected"}', 'seed-2026.09'),
((select id from public.brands where slug = 'aerie'), 'aerie-smoothez-bralette', 'SMOOTHEZ Bralette', 'SMOOTHEZ', 'bralette', 'wireless', 'soft_cup', 1, '["nylon","elastane"]', array['seam-free','wire-free','light support'], array['lounge','travel','everyday'], 'true_to_size', array['Illustrative development seed'], 'US_CA', 'XXS–XXL', null, '[]', '{"wingHeight":"low","strapPlacement":"centered","bandStretch":"high"}', 'seed-2026.09'),
((select id from public.brands where slug = 'knix'), 'knix-evolution-bra', 'Evolution Bra', 'Evolution', 'wireless', 'wireless', 'moulded', 3, '["nylon","elastane"]', array['removable pads','wire-free','adjustable straps'], array['everyday','travel','lounge'], 'varies', array['Illustrative development seed'], 'US_CA', 'XS+–3XL+', null, '[]', '{"wingHeight":"medium","strapPlacement":"convertible","closureRows":3,"bandStretch":"high"}', 'seed-2026.09'),
((select id from public.brands where slug = 'harper-wilde'), 'harper-wilde-bliss', 'Bliss Bralette', 'Bliss', 'bralette', 'wireless', 'soft_cup', 2, '["nylon","elastane"]', array['seam-free','wire-free','pull-on'], array['lounge','travel','everyday'], 'true_to_size', array['Illustrative development seed'], 'US_CA', 'XS–4XL', null, '[]', '{"wingHeight":"medium","strapPlacement":"centered","bandStretch":"high"}', 'seed-2026.09'),
((select id from public.brands where slug = 'understance'), 'understance-yara-flexwire', 'Yara FlexWire', 'Yara', 'full_coverage', 'flex_wire', 'seamed', 4, '["polyamide","elastane"]', array['flex wire','full coverage','adjustable straps'], array['everyday','work'], 'true_to_size', array['Illustrative development seed'], 'US_CA', '30–44 B–J', int4range(30,45,'[)'), '["B","J"]', '{"goreHeight":"medium","wingHeight":"high","strapPlacement":"centered","closureRows":4,"bandStretch":"medium","wireWidth":"average","cupDepth":"average"}', 'seed-2026.09'),
((select id from public.brands where slug = 'felina'), 'felina-amelie-unlined', 'Amelie Unlined', 'Amelie', 'full_coverage', 'underwire', 'unlined', 4, '["nylon","elastane"]', array['unlined cup','side support','breathable mesh'], array['everyday','work','travel'], 'varies', array['Illustrative development seed'], 'US_CA', '32–42 C–H', int4range(32,43,'[)'), '["C","H"]', '{"goreHeight":"high","wingHeight":"high","strapPlacement":"wide_set","closureRows":3,"bandStretch":"medium","wireWidth":"wide","cupDepth":"projected"}', 'seed-2026.09')
on conflict (slug) do nothing;

insert into public.tights_products (brand_id, slug, name, family, style, denier, opacity, waist_construction, toe_construction, warmth_level, compression_level, material_composition, features, use_cases, fit, fit_notes, size_system, size_range, current_version) values
((select id from public.brands where slug = 'falke'), 'falke-pure-matt-50', 'Pure Matt 50', 'Pure Matt', 'semi_opaque', 50, 'semi_opaque', 'regular', 'reinforced', 3, 1, '["polyamide","elastane"]', array['matte finish','soft waistband','reinforced toe'], array['everyday','work','travel'], 'true_to_size', array['Illustrative development seed: verify the current brand chart.'], 'EU', 'S–XL', 'seed-2026.09'),
((select id from public.brands where slug = 'wolford'), 'wolford-individual-10', 'Individual 10', 'Individual', 'sheer', 10, 'ultra_sheer', 'regular', 'sandal', 1, 0, '["nylon","elastane"]', array['ultra sheer','sandal toe','soft waistband'], array['occasion','work'], 'varies', array['Illustrative development seed: check the current size guide.'], 'EU', 'XS–XL', 'seed-2026.09'),
((select id from public.brands where slug = 'sheertex'), 'sheertex-classic-sheer', 'Classic Sheer', 'Classic', 'sheer', 20, 'sheer', 'high_waist', 'reinforced', 2, 1, '["nylon","elastane"]', array['reinforced knit','sheer finish','high-rise option'], array['everyday','work','occasion'], 'runs_small', array['Illustrative development seed: confirm current fit guidance.'], 'US_CA', 'XS–3XL', 'seed-2026.09'),
((select id from public.brands where slug = 'spanx'), 'spanx-opaque-70', 'Tight-End Opaque 70', 'Tight-End', 'shaping', 70, 'opaque', 'control_top', 'closed', 4, 3, '["nylon","elastane"]', array['control top','opaque coverage','smooth waistband'], array['work','cold_weather','travel'], 'true_to_size', array['Illustrative development seed.'], 'US_CA', 'S–3X', 'seed-2026.09'),
((select id from public.brands where slug = 'commando'), 'commando-ultimate-opaque', 'Ultimate Opaque', 'Ultimate', 'opaque', 80, 'opaque', 'high_waist', 'reinforced', 5, 2, '["nylon","elastane"]', array['opaque coverage','wide waistband','flat seam'], array['everyday','work','cold_weather'], 'true_to_size', array['Illustrative development seed.'], 'US_CA', 'XS–XL', 'seed-2026.09'),
((select id from public.brands where slug = 'heist'), 'heist-the-eighties', 'The Eighty', 'The Eighty', 'opaque', 80, 'opaque', 'high_waist', 'closed', 4, 1, '["nylon","elastane"]', array['no-roll waistband','opaque knit','seam-free brief'], array['everyday','work','cold_weather'], 'true_to_size', array['Illustrative development seed.'], 'UK', 'A–E', 'seed-2026.09')
on conflict (slug) do nothing;

insert into public.ingestion_sources (slug, name, source_kind, base_url, legal_basis, crawl_policy, enabled, allowed_categories, refresh_interval_hours, accountable_owner) values
('demo-authorized-feed', 'Demo Authorized Feed', 'affiliate_feed', 'https://example.invalid', 'partner_authorized', '{"requiresHumanReview":true,"automaticPublish":false}', false, array['bra'], 24, 'catalog@perfectpair.example'),
('demo-authorized-tights-feed', 'Demo Authorized Tights Feed', 'affiliate_feed', 'https://example.invalid', 'partner_authorized', '{"requiresHumanReview":true,"automaticPublish":false}', false, array['tights'], 24, 'catalog@perfectpair.example')
on conflict (slug) do update set crawl_policy = excluded.crawl_policy, enabled = false, allowed_categories = excluded.allowed_categories, refresh_interval_hours = excluded.refresh_interval_hours, accountable_owner = excluded.accountable_owner;
