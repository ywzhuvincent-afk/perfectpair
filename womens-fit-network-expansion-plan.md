# PerfectPair Fit Network expansion

## Product promise

**Fit before you buy. Waste less after.**

PerfectPair helps a member reduce fit-driven purchase mistakes across bras,
tights, leggings and jeans. It treats private fit guidance, source-backed
product facts and moderated wearer experience as separate evidence layers.
When an eligible outerwear item still does not work, the member can prepare a
private description for an external resale marketplace; PerfectPair does not
run the transaction.

## Four categories, one shared privacy model

| Category | Main fit facts | Primary mismatches | Release rule |
| --- | --- | --- | --- |
| Bras | band, cup, wire, root width, projection | containment, wire, straps, support | Existing live catalogue architecture |
| Tights | height range, waist, inseam, denier, compression | rolling, sagging, toe pressure, length | Existing live catalogue architecture |
| Leggings | usual size, rise, waist/hip, inseam, compression, stretch | rolling, sheerness, thigh tightness, length | New lower-body catalog records; no listing until sources are reviewed |
| Jeans | usual waist/inseam, rise, waist/hip, stretch | waist gap, seat fit, crotch drop, length | New lower-body catalog records; no listing until sources are reviewed |

The member can start with one familiar size or a product that works. Optional
measurements are asked only where an official size chart uses them. No photo,
body scan, appearance score or explanation of a body change is requested.

## What has been implemented in this increment

- A lower-body Fit DNA form for leggings and jeans, saved as dated private
  snapshots alongside—not inside—the bra and tights profiles.
- A four-category home experience; leggings and jeans have a profile entry
  point but no fake product cards or unverified product images.
- A `Pass it forward` page that creates a **private local draft** for eligible
  outerwear and produces copy for a member to paste into a marketplace.
- A database migration with lower-body product, variant, observation, version,
  price, availability and category-specific review structures.
- Rights-controlled image support for those future products. A product image
  remains unpublished until its licence/authorisation record is approved.
- An owner-only `pass_it_forward_intents` data model with no money, pricing,
  address, delivery, chat, contact, or public-listing field.

## Explicit first-release limits

1. **No in-app transaction.** Payment, shipping labels, escrow, returns,
   buyer/seller messaging, verification and dispute handling remain outside
   PerfectPair.
2. **No resale flow for bras, tights, underwear, socks or swimwear.** Hygiene
   rules and marketplace policy vary by jurisdiction and change over time.
3. **No generic rating.** Leggings and jeans will each declare a scoring schema
   before community reviews are accepted; an overall number cannot erase the
   category-specific signals behind it.
4. **No auto-publishing from a scraper.** A source may create a candidate; a
   reviewer verifies product identity, facts, source permission and image
   rights before anything becomes public.
5. **No `People Like You` badge without a privacy threshold.** It should show
   only aggregated, consented evidence after a documented minimum cohort and
   confidence rule are implemented.

## Data acquisition order

1. Select 3–5 concentrated brands per lower-body category.
2. Enter their official product facts and current size charts as source-backed
   candidate records.
3. Obtain image permission, an authorised feed, or create original photographs
   before publishing product imagery.
4. Publish a dense, reviewed set of core fits before widening brand coverage.
5. Collect structured, moderated wear outcomes; only then activate product
   scorecards and anonymous aggregated fit signals.

This order prevents a large but unreliable catalogue from undermining the
central promise.

## Future transaction decision gate

Only consider on-platform resale after the site has a legal entity, regional
marketplace policy, payment provider onboarding, tax/KYC assessment, fraud and
counterfeit policy, prohibited-item rules, age/safety controls, shipping and
returns rules, moderation capacity, privacy review and a formal dispute process.
Until then, an external platform owns the transaction and its fees cover those
operational responsibilities.
