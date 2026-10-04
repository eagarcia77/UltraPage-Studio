# UltraPage Studio Commercialization Readiness

Status: **PRE-COMMERCIAL — SALES DISABLED**

UltraPage Studio must not accept payments, advertise guaranteed compliance, or be represented as institutionally certified until every blocking item in this document has passed and the product owner records a written Go decision.

## Recommended commercial position

UltraPage Studio should be positioned as an accessible multi-LMS authoring workspace for instructors, instructional designers, and academic support teams. Blackboard Ultra is an important compatibility profile, but the product must not imply ownership by, endorsement from, or affiliation with Anthology, Blackboard, Canvas, Moodle, D2L, Microsoft, or 1EdTech.

The initial commercial model should be a hosted subscription with three clear offers:

1. **Individual** — authoring, accessibility review, responsive preview, and standard exports.
2. **Professional** — native assessment and APA tools, reusable templates, WebDAV workflows, and priority support.
3. **Institution** — managed deployment, procurement documentation, security review, onboarding, service commitments, and LMS integration options.

Final prices require customer discovery and a cost model. Prices must not be published before support, hosting, payment processing, taxes, refunds, and incident-response costs are known.

## Stability gate — all items are blocking

### Product quality

- [ ] Establish automated unit, integration, and browser end-to-end tests for editing, Design/HTML synchronization, tables, images, accessibility location, and every export format.
- [ ] Test current versions of Chrome, Edge, Firefox, and Safari on desktop and mobile-sized viewports.
- [ ] Maintain a reproducible LMS compatibility matrix for Blackboard Ultra, Canvas, Moodle, Brightspace, and Universal HTML.
- [ ] Verify round trips: save/reopen project, Design/HTML/Design, HTML ZIP, DOCX import/export, PDF export, and WebDAV edit/upload.
- [ ] Run a documented beta with representative instructors and instructional designers; resolve all release-blocking defects.
- [ ] Define severity levels, release criteria, rollback procedure, and a supported-version policy.

### Accessibility

- [ ] Complete manual keyboard, screen-reader, zoom/reflow, contrast, focus, and error-identification testing against WCAG 2.2 Level AA.
- [ ] Test generated HTML, DOCX, PDF, tables, images, forms, and native tools—not only the main editor.
- [ ] Commission an independent accessibility review before institutional sales.
- [ ] Publish an Accessibility Statement with known limitations and remediation contact/process.
- [ ] Produce an Accessibility Conformance Report using the current VPAT format when pursuing institutional or government procurement.
- [ ] Never market the automated score as a guarantee of legal compliance.

### Security and privacy

- [ ] Complete threat modeling for WebDAV, file import, HTML sanitization, remote images, ZIP generation, and server-side export.
- [ ] Add automated dependency, secret, static-analysis, and dynamic security scanning to CI.
- [ ] Conduct an independent penetration test and close critical/high findings.
- [ ] Implement production monitoring, uptime checks using `/api/health`, alerting, structured redacted logs, backup/restore tests, and an incident-response runbook.
- [ ] Define retention and deletion rules. Prefer local processing and data minimization; do not collect student PII unless a reviewed institutional workflow requires it.
- [ ] Publish Privacy Policy, Terms of Service, Data Processing Addendum, Subprocessor List, Acceptable Use Policy, and Security Overview after legal review.
- [ ] If the service handles education-record PII, complete a FERPA-specific vendor review and contractual controls. Assess COPPA only if the intended use may involve children under 13.
- [ ] Do not place WebDAV credentials, document contents, or student information in analytics or support telemetry.

### Interoperability and claims

- [ ] Maintain fixtures and validation reports for each supported LMS profile.
- [ ] Clearly distinguish tested compatibility from formal certification.
- [ ] If native LMS launch, roster, assignment, grade, or deep-link workflows are added, implement LTI 1.3/LTI Advantage and pursue applicable 1EdTech certification.
- [ ] Treat the existing Blackboard-oriented QTI 2.1 and TXT exports as profiled compatibility features; do not claim universal QTI certification.
- [ ] Evaluate QTI 3 and Common Cartridge as roadmap items based on customer demand and receiving-LMS support.

### Intellectual property and licensing

- [ ] Complete a software-bill-of-materials and license/provenance review for every dependency, font, image, template, and copied native-tool file.
- [ ] Record the source commit and permitted use for EstiloAPA, TXT Test Generator, and QTI 2.1 Blackboard while preserving their original repositories.
- [ ] Decide which UltraPage Studio code is proprietary and which components remain under third-party or open-source terms; publish required notices.
- [ ] Conduct a formal trademark clearance search for “UltraPage Studio” and confusingly similar marks in the USPTO and Puerto Rico registries before filing or investing in launch materials.
- [ ] Use third-party LMS names only to describe compatibility and include an appropriate non-affiliation notice.

### Business and operations

- [ ] Select and register the operating entity; obtain legal, accounting, and tax advice appropriate to Puerto Rico and target markets.
- [ ] Complete Puerto Rico legal-entity and merchant registration requirements and determine IVU/sales-tax obligations before charging customers.
- [ ] Establish a business bank account, bookkeeping, invoicing, refund, cancellation, and revenue-recognition processes.
- [ ] Select a payment processor only after the product and legal policies are approved; use hosted checkout so card data never reaches UltraPage Studio servers.
- [ ] Define support channels, hours, severity targets, onboarding, documentation, service status communication, and institutional escalation.
- [ ] Price from measured hosting, storage, support, compliance, payment, tax, and acquisition costs—not from feature count alone.

## Release stages

| Stage | Entry criteria | Commercial activity |
| --- | --- | --- |
| Internal Preview | Build passes; known limitations documented | No sales |
| Private Beta | Core regression suite passes; backups and monitoring operate; beta agreement approved | Invite-only, no compliance guarantees |
| Release Candidate | No open critical/high defects; accessibility and security reviews completed; legal documents approved | Contract preparation only |
| Stable 1.0 | Go/No-Go signed; rollback tested; support and billing ready | Sales may begin |
| Institution Ready | ACR/VPAT, DPA, security package, procurement responses, and service commitments ready | Institutional contracting |

## Go/No-Go record

A commercial launch requires a dated record containing:

- release version and immutable source commit;
- test and LMS compatibility results;
- open defects and accepted risks;
- accessibility and security review dates;
- approved legal documents and trademark status;
- production recovery/rollback evidence;
- support owner and incident contacts;
- billing, tax, refund, and cancellation readiness;
- explicit **GO** approval by the product owner.

Until that record exists, the correct status is **Pre-commercial preview**.
