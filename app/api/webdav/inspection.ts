import { isStrongWebDavETag, type RemoteWebDavVersion } from "./overwrite-guard.ts";

const MAX_METADATA_BYTES = 64 * 1024;
const TIMEOUT_MS = 20_000;
const DAV_METADATA_QUERY = `<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:getetag/><d:getlastmodified/></d:prop></d:propfind>`;

function decodeDavText(value: string) {
  return value.replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex: string | undefined, decimal: string | undefined) => {
      const value = Number.parseInt(hex || decimal || "", hex ? 16 : 10);
      return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
    })
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
}

function elementText(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}\\s*>`, "i"));
  return match ? decodeDavText(match[1]).trim() : null;
}

function validHttpDate(value: string | null): string | null {
  return value && /(?:GMT)$/i.test(value) && Number.isFinite(Date.parse(value)) ? value : null;
}

function metadataFromHeaders(response: Response): RemoteWebDavVersion {
  return {
    exists: true,
    etag: response.headers.get("etag"),
    lastModified: validHttpDate(response.headers.get("last-modified")),
  };
}

export function parseDepthZeroDavMetadata(xml: string): RemoteWebDavVersion {
  const response = xml.match(/<(?:[\w.-]+:)?response\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?response\s*>/i)?.[1];
  if (!response) throw new Error("Blackboard returned an incomplete WebDAV metadata response. No file was changed.");

  const propstats = [...response.matchAll(/<(?:[\w.-]+:)?propstat\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?propstat\s*>/gi)];
  const successful = propstats.map((match) => match[1])
    .filter((block) => /HTTP\/\d(?:\.\d)?\s+200\b/i.test(elementText(block, "status") || ""));
  if (!successful.length) {
    throw new Error("Blackboard did not confirm file metadata. No file was changed.");
  }

  // A missing ETag or Last-Modified means the file exists but cannot be safely replaced.
  const etag = successful.map((block) => elementText(block, "getetag")).find(Boolean) || null;
  const lastModified = validHttpDate(successful.map((block) => elementText(block, "getlastmodified")).find(Boolean) || null);
  return { exists: true, etag, lastModified };
}

async function depthZeroPropfind(
  target: URL, authorization: string, fetchImpl: typeof fetch,
): Promise<RemoteWebDavVersion> {
  const response = await fetchImpl(target, {
    method: "PROPFIND",
    headers: {
      Authorization: authorization,
      Depth: "0",
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: DAV_METADATA_QUERY,
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 404) return { exists: false, etag: null, lastModified: null };
  if (response.status === 401 || response.status === 403) {
    throw new Error("Blackboard rejected the credentials or access to the selected file.");
  }
  if (response.status !== 207) {
    throw new Error(`Blackboard could not verify file metadata using PROPFIND (HTTP ${response.status}). No changes were made.`);
  }
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_METADATA_BYTES) throw new Error("Blackboard returned too much WebDAV metadata.");
  const xml = await response.text();
  if (xml.length > MAX_METADATA_BYTES) throw new Error("Blackboard returned too much WebDAV metadata.");
  return parseDepthZeroDavMetadata(xml);
}

/**
 * Inspect the actual remote resource without downloading the file. No remote
 * writes are performed. HEAD is preferred; PROPFIND Depth:0 is the WebDAV
 * fallback for installations that do not support HEAD or lack validators.
 *
 * The caller MUST enforce a conditional PUT via conditionalWebDavHeaders.
 */
export async function inspectWebDavTarget(
  target: URL, authorization: string, fetchImpl: typeof fetch = fetch,
): Promise<RemoteWebDavVersion> {
  const head = await fetchImpl(target, {
    method: "HEAD",
    headers: { Authorization: authorization },
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (head.status === 404) return { exists: false, etag: null, lastModified: null };
  if (head.status === 401 || head.status === 403) {
    throw new Error("Blackboard rejected the credentials or access to the selected file.");
  }
  if (head.ok) {
    const current = metadataFromHeaders(head);
    if (isStrongWebDavETag(current.etag) || current.lastModified) return current;
    return depthZeroPropfind(target, authorization, fetchImpl);
  }
  if (head.status === 405 || head.status === 501) return depthZeroPropfind(target, authorization, fetchImpl);
  throw new Error(`Blackboard could not verify the selected file (HTTP ${head.status}). No changes were made.`);
}
