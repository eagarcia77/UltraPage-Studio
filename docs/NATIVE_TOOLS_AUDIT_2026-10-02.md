# Native Tools Audit — 2026-10-02

## Scope

This audit covers the Curralume Studio native copies of:

- EstiloAPA
- TXT Test Generator
- QTI 2.1 Blackboard

## Source basis

The latest local audit indicated that the shared Ribbon was reorganized across EstiloAPA, TXT Test Generator, and QTI 2.1 Blackboard, with command groups for File, Document, Authoring, Review, Report, Preview, and Export. It also indicated keyboard navigation with arrow keys, Home, and End, responsive horizontal scrolling, unified visual indicators, removal of the duplicated QTI `Validate bank` command, centralized shared styles/behavior, and a local commit that had not yet been published remotely.

## Updates published in this remote revision

1. Added `scripts/audit-native-tools.mjs` to audit the native tool copies from the repository.
2. Added `npm run audit:native-tools` and `npm run check` to `package.json`.
3. Added an in-app audit panel to `/tools` that checks native tool routes from the browser.
4. Added this documentation file so the audit result is traceable inside the repository.

## Automated audit coverage

The audit script checks:

- Manifest existence.
- Manifest policy preserving `sourceRepositoriesAreModified=false`.
- Presence of the three required native tools.
- Existence of each native HTML entry point.
- Duplicate HTML `id` values.
- Duplicate button command identifiers where available.
- Literal Ribbon group markers.
- Duplicated `Validate bank` + `Run preflight` conflict.
- Basic accessibility markers such as `aria-label`, `aria-labelledby`, or `role`.

## Commands

```bash
npm run audit:native-tools
npm run check
```

## Manual QA still required

Because the native tools are HTML applications loaded inside an iframe, the automated audit should be followed by manual verification in the deployed app:

1. Open `/tools#apa`.
2. Open `/tools#txt`.
3. Open `/tools#qti`.
4. Confirm Ribbon keyboard movement with arrows, Home, and End.
5. Confirm the QTI tool exposes `Run preflight` and does not duplicate it with `Validate bank`.
6. Confirm export buttons remain functional.
7. Confirm the source repositories remain unchanged.

## Status

Remote audit hardening has been published to the `UltraPage-Studio` repository. The next required step is deployment verification in Render or the active hosting environment.
