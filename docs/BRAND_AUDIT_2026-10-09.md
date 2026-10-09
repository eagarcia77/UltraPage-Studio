# Brand audit — 2026-10-09

## Decision

Rename the working product from **UltraPage Studio** to **Curralume Studio**.

“Curralume” is a coined name that combines the ideas of curriculum and illumination. It is intended to be pronounced *cur-ra-loom*. The descriptor “Studio” identifies the product as an authoring workspace.

## Why the previous name changed

The distinctive element “UltraPage” already has active public uses close to this product’s category:

- Ultrapage by Laris Digital is an AI sales-page creation tool: <https://larisdigital.marketing/ultrapage/>
- `evvyraine/ultrapage` is a browser start-page software project: <https://github.com/evvyraine/ultrapage>
- UltraPage Inc. is also used by an electronics and phone-repair business in Texas.

Those uses do not by themselves establish a legal conflict, but they create avoidable search, attribution, and distinctiveness risk. Adding “Studio” does not sufficiently separate two software products built around page creation.

## Preliminary screening of the new name

On 2026-10-09, public web searches were run for:

- `"Curralume"`
- `"Curralume Studio"`
- GitHub results containing `Curralume`
- npm results containing `curralume`
- indexed USPTO TSDR pages containing `Curralume`

No identical software product, package, repository, or indexed trademark record was found in those searches. Similar-looking results referred to **Curraluma**, a locality in Chile, not an education or software brand.

This is a preliminary knockout search, not a legal clearance opinion. Before commercial launch or filing, a qualified trademark professional should search confusingly similar words, phonetic variants, design marks, state and Puerto Rico registries, relevant international classes, domains, app stores, company registries, and unregistered common-law uses.

## Visual identity

The new symbol combines:

- an open orbital **C**, representing portable course content that can move between LMS platforms;
- a four-point light, representing clarity, guidance, and the “lume” part of the name;
- deep navy and teal, chosen for a professional education-technology identity;
- warm gold as a small recognition accent.

| Role | Color |
| --- | --- |
| Navy | `#123B5D` |
| Teal | `#087A70` |
| Gold | `#FFD166` |
| Off-white | `#F8FAFC` |

The SVG includes a text alternative. Raster icons are generated at 192, 512, and 180 pixels for PWA and Apple surfaces.

## Compatibility policy

User-facing copy, metadata, health responses, export authorship, install labels, and native-tool headers use **Curralume Studio**. Existing technical identifiers such as `ultrapage-*`, the `.ultrapage.json` compatibility extension, environment-variable names, browser storage keys, and exported schema identifiers remain unchanged for now. Changing them immediately could invalidate local drafts, backups, cache entries, or integrations.

The hosted URL and repository slug may continue to contain `ultrapage-studio` during the transition. Rename them only with redirects and a rollback plan.
