/* Curralume Studio · © 2026 Eduardo Augusto García Rodríguez · Original contributions and integrations; third-party licenses preserved. */
/**
 * WebDAV conditional writes: never replace a remote resource without
 * explicit consent and a current strong ETag or Last-Modified validator.
 * This prevents silent overwrites and stale-tab edits.
 */
export type RemoteWebDavVersion = {
  exists: boolean;
  etag: string | null;
  lastModified: string | null;
};

export type WebDavWriteConsent = {
  overwrite?: boolean;
  expectedETag?: string | null;
  expectedLastModified?: string | null;
};

export class WebDavWriteConflict extends Error {}

export function isStrongWebDavETag(value: string | null): value is string {
  return typeof value === "string" && /^"(?:[^"\\]|\\.)*"$/.test(value);
}

export function canSafelyReplaceWebDav(version: RemoteWebDavVersion): boolean {
  return version.exists && (isStrongWebDavETag(version.etag) || Boolean(version.lastModified));
}

export function conditionalWebDavHeaders(version: RemoteWebDavVersion, consent: WebDavWriteConsent): Record<string, string> {
  if (!version.exists) {
    return { "If-None-Match": "*" };
  }
  if (consent.overwrite !== true) {
    throw new WebDavWriteConflict("A file with this name already exists. Confirm a replacement or use a different name.");
  }
  if (isStrongWebDavETag(version.etag)) {
    if (consent.expectedETag !== version.etag) {
      throw new WebDavWriteConflict("This file changed since your last check. Refresh the folder before replacing it.");
    }
    return { "If-Match": version.etag };
  }
  if (version.lastModified) {
    if (consent.expectedLastModified !== version.lastModified) {
      throw new WebDavWriteConflict("This file changed since your last check. Refresh the folder before replacing it.");
    }
    return { "If-Unmodified-Since": version.lastModified };
  }
  throw new WebDavWriteConflict("Blackboard did not provide a version validator. Save under another name to protect the existing file.");
}
