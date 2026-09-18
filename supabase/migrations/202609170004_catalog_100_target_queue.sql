-- Turn the four-category coverage backlog into a finite, auditable 100-brand
-- queue. These are source-acquisition targets only: this migration does not
-- ingest product pages, images, reviews, commercial prices or inventory.

alter table public.brand_source_targets
  drop constraint if exists brand_source_targets_categories_check;
alter table public.brand_source_targets
  add constraint brand_source_targets_categories_check
  check (cardinality(categories) > 0 and categories <@ array['bra', 'tights', 'leggings', 'jeans']);

with planned_targets (id, brand_name, category, launch_wave) as (
  values
    ('bra-aerie', 'Aerie', 'bra', 1),
    ('bra-anita', 'Anita', 'bra', 1),
    ('bra-bravissimo', 'Bravissimo', 'bra', 2),
    ('bra-chantelle', 'Chantelle', 'bra', 1),
    ('bra-curvy-kate', 'Curvy Kate', 'bra', 2),
    ('bra-elomi', 'Elomi', 'bra', 1),
    ('bra-empreinte', 'Empreinte', 'bra', 2),
    ('bra-fantasie', 'Fantasie', 'bra', 2),
    ('bra-felina', 'Felina', 'bra', 1),
    ('bra-freya', 'Freya', 'bra', 1),
    ('bra-glamorise', 'Glamorise', 'bra', 2),
    ('bra-harper-wilde', 'Harper Wilde', 'bra', 1),
    ('bra-knix', 'Knix', 'bra', 1),
    ('bra-le-mystere', 'Le Mystère', 'bra', 2),
    ('bra-natori', 'Natori', 'bra', 1),
    ('bra-panache', 'Panache', 'bra', 1),
    ('bra-parfait', 'Parfait', 'bra', 2),
    ('bra-primadonna', 'PrimaDonna', 'bra', 2),
    ('bra-savage-x-fenty', 'Savage X Fenty', 'bra', 2),
    ('bra-soma', 'Soma', 'bra', 2),
    ('bra-thirdlove', 'ThirdLove', 'bra', 1),
    ('bra-understance', 'Understance', 'bra', 1),
    ('bra-victoria-s-secret', 'Victoria''s Secret', 'bra', 2),
    ('bra-wacoal', 'Wacoal', 'bra', 1),
    ('bra-warner-s', 'Warner''s', 'bra', 2),
    ('tights-berkshire', 'Berkshire', 'tights', 2),
    ('tights-calzedonia', 'Calzedonia', 'tights', 1),
    ('tights-capezio', 'Capezio', 'tights', 2),
    ('tights-cecilia-de-rafael', 'Cecilia de Rafael', 'tights', 2),
    ('tights-commando', 'Commando', 'tights', 1),
    ('tights-dim', 'DIM', 'tights', 2),
    ('tights-falke', 'Falke', 'tights', 1),
    ('tights-fiore', 'Fiore', 'tights', 2),
    ('tights-gabriella', 'Gabriella', 'tights', 2),
    ('tights-gatta', 'Gatta', 'tights', 2),
    ('tights-heist', 'Heist', 'tights', 1),
    ('tights-hue', 'Hue', 'tights', 2),
    ('tights-kunert', 'Kunert', 'tights', 2),
    ('tights-levante', 'Levante', 'tights', 2),
    ('tights-oroblu', 'Oroblù', 'tights', 2),
    ('tights-pamela-mann', 'Pamela Mann', 'tights', 2),
    ('tights-pierre-mantoux', 'Pierre Mantoux', 'tights', 2),
    ('tights-pretty-polly', 'Pretty Polly', 'tights', 2),
    ('tights-sheertex', 'Sheertex', 'tights', 1),
    ('tights-solidea', 'Solidea', 'tights', 2),
    ('tights-swedish-stockings', 'Swedish Stockings', 'tights', 1),
    ('tights-trasparenze', 'Trasparenze', 'tights', 2),
    ('tights-viennemilano', 'VienneMilano', 'tights', 2),
    ('tights-wolford', 'Wolford', 'tights', 1),
    ('tights-zokki', 'Zokki', 'tights', 2),
    ('leggings-90-degree-by-reflex', '90 Degree by Reflex', 'leggings', 2),
    ('leggings-adidas', 'Adidas', 'leggings', 1),
    ('leggings-alo-yoga', 'Alo Yoga', 'leggings', 1),
    ('leggings-athleta', 'Athleta', 'leggings', 1),
    ('leggings-beyond-yoga', 'Beyond Yoga', 'leggings', 1),
    ('leggings-colorfulkoala', 'Colorfulkoala', 'leggings', 2),
    ('leggings-crz-yoga', 'CRZ Yoga', 'leggings', 2),
    ('leggings-fabletics', 'Fabletics', 'leggings', 1),
    ('leggings-gapfit', 'GapFit', 'leggings', 2),
    ('leggings-girlfriend-collective', 'Girlfriend Collective', 'leggings', 1),
    ('leggings-gymshark', 'Gymshark', 'leggings', 1),
    ('leggings-halara', 'Halara', 'leggings', 2),
    ('leggings-koral', 'Koral', 'leggings', 2),
    ('leggings-lorna-jane', 'Lorna Jane', 'leggings', 2),
    ('leggings-lululemon', 'Lululemon', 'leggings', 1),
    ('leggings-nike', 'Nike', 'leggings', 1),
    ('leggings-niyama-sol', 'Niyama Sol', 'leggings', 2),
    ('leggings-outdoor-voices', 'Outdoor Voices', 'leggings', 1),
    ('leggings-p-e-nation', 'P.E Nation', 'leggings', 2),
    ('leggings-peloton-apparel', 'Peloton Apparel', 'leggings', 2),
    ('leggings-sweaty-betty', 'Sweaty Betty', 'leggings', 1),
    ('leggings-tala', 'TALA', 'leggings', 2),
    ('leggings-varley', 'Varley', 'leggings', 2),
    ('leggings-vuori', 'Vuori', 'leggings', 1),
    ('leggings-zella', 'Zella', 'leggings', 2),
    ('jeans-7-for-all-mankind', '7 For All Mankind', 'jeans', 2),
    ('jeans-abercrombie', 'Abercrombie', 'jeans', 1),
    ('jeans-ag-jeans', 'AG Jeans', 'jeans', 2),
    ('jeans-american-eagle', 'American Eagle', 'jeans', 1),
    ('jeans-citizens-of-humanity', 'Citizens of Humanity', 'jeans', 2),
    ('jeans-democracy-clothing', 'Democracy Clothing', 'jeans', 2),
    ('jeans-dl1961', 'DL1961', 'jeans', 2),
    ('jeans-everlane', 'Everlane', 'jeans', 1),
    ('jeans-frame', 'Frame', 'jeans', 2),
    ('jeans-good-american', 'Good American', 'jeans', 1),
    ('jeans-hudson-jeans', 'Hudson Jeans', 'jeans', 2),
    ('jeans-jag-jeans', 'JAG Jeans', 'jeans', 2),
    ('jeans-joe-s-jeans', 'Joe''s Jeans', 'jeans', 2),
    ('jeans-kut-from-the-kloth', 'KUT from the Kloth', 'jeans', 2),
    ('jeans-lee', 'Lee', 'jeans', 1),
    ('jeans-levis', 'Levi''s', 'jeans', 1),
    ('jeans-madewell', 'Madewell', 'jeans', 1),
    ('jeans-mother', 'MOTHER', 'jeans', 2),
    ('jeans-nydj', 'NYDJ', 'jeans', 1),
    ('jeans-paige', 'Paige', 'jeans', 2),
    ('jeans-re-done', 'Re/Done', 'jeans', 2),
    ('jeans-silver-jeans', 'Silver Jeans', 'jeans', 2),
    ('jeans-uniqlo', 'Uniqlo', 'jeans', 1),
    ('jeans-wrangler', 'Wrangler', 'jeans', 1),
    ('jeans-zara', 'Zara', 'jeans', 2)
)
insert into public.brand_source_targets (
  id, brand_name, categories, launch_wave, required_facts,
  excluded_without_written_licence, accountable_owner, next_action
)
select
  id,
  brand_name,
  array[category],
  launch_wave,
  case category
    when 'bra' then array['brand','productFamily','productName','canonicalProductUrl','style','wire','cupConstruction','supportLevel','material','sizeSystem','sizeChartVersion','sizeRange','bandRange','cupRange','lastUpdatedAt']
    when 'tights' then array['brand','productFamily','productName','canonicalProductUrl','denier','opacity','waist','toe','compression','material','sizeSystem','sizeChartVersion','sizeRange','lastUpdatedAt']
    when 'leggings' then array['brand','productFamily','productName','canonicalProductUrl','rise','inseam','compression','stretch','material','sizeSystem','sizeRange','lastUpdatedAt']
    else array['brand','productFamily','productName','canonicalProductUrl','rise','leg','thighFit','stretch','material','sizeSystem','sizeRange','lastUpdatedAt']
  end,
  array['product images and image URLs','long product descriptions','brand editorial copy','logos and other creative assets','merchant review text'],
  'PerfectPair catalog steward',
  'Verify one official or clearly authorised source for the minimum structured facts; never copy images, long descriptions, third-party reviews, prices or stock without written permission.'
from planned_targets
on conflict (id) do nothing;

comment on table public.brand_source_targets is 'Finite 100-brand four-category coverage queue. Targets are not publication or image-rights claims.';
