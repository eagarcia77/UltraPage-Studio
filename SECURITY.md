# Curralume Studio Security Policy

## Release status

Curralume Studio is currently pre-commercial software. No release should be represented as production-ready until the stability gate in `docs/COMMERCIALIZATION_READINESS.md` is approved.

## Reporting a vulnerability

Do not disclose credentials, institutional URLs, student information, or exploit details in a public issue. Use the repository's private security advisory process to report a suspected vulnerability.

Include:

- the affected route or feature;
- steps to reproduce the issue without real student data;
- the potential impact;
- the browser, operating system, and application version;
- a proposed mitigation, if known.

## Security boundaries

- WebDAV credentials must remain transient and must never be written to logs, browser storage, source control, analytics, or error-reporting payloads.
- Server-side WebDAV requests must reject loopback, private, link-local, documentation, and otherwise unsafe network destinations.
- Uploaded or imported content must be sanitized before it is rendered or exported.
- Production secrets must be supplied through the hosting platform and must never be committed.
- Security fixes take priority over feature work and require regression verification before release.

## Supported versions

Before commercial launch, support is limited to the current deployed preview. A formal support window and end-of-life policy must be published with the first stable commercial release.
