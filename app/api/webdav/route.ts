import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isUnsafeWebDavAddress } from "./security";

type WebDavRequest = {
  action?: "list" | "read" | "download" | "write" | "writeBinary";
  url?: string;
  username?: string;
  password?: string;
  content?: string;
  dataBase64?: string;
  fileName?: string;
};

const WEBDAV_TIMEOUT_MS = 20_000;
const MAX_LIST_BYTES = 2 * 1024 * 1024;

async function safeWebDavUrl(raw: string) {
  if (raw.length > 2048) throw new Error("The WebDAV address is too long.");
  const url = new URL(raw);
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  const forbiddenName = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal");
  if (url.protocol !== "https:" || (url.port && url.port !== "443") || url.username || url.password || forbiddenName || !url.pathname.startsWith("/bbcswebdav/")) {
    throw new Error("Use a valid HTTPS Blackboard Content Collection address whose path begins with /bbcswebdav/.");
  }
  const literalVersion = isIP(hostname);
  let addresses: Array<{ address: string }>;
  try {
    addresses = literalVersion ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error("The WebDAV host could not be resolved.");
  }
  if (!addresses.length || addresses.some(({ address }) => isUnsafeWebDavAddress(address))) {
    throw new Error("The WebDAV host must resolve only to public internet addresses.");
  }
  return url;
}

function decodeXml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseWebDav(xml: string, baseUrl: URL) {
  const responses = xml.match(/<(?:[a-z]+:)?response\b[\s\S]*?<\/(?:[a-z]+:)?response>/gi) || [];
  return responses.map((block) => {
    const href = block.match(/<(?:[a-z]+:)?href>([\s\S]*?)<\/(?:[a-z]+:)?href>/i)?.[1] || "";
    const displayName = block.match(/<(?:[a-z]+:)?displayname>([\s\S]*?)<\/(?:[a-z]+:)?displayname>/i)?.[1] || "";
    const size = block.match(/<(?:[a-z]+:)?getcontentlength>(\d+)<\/(?:[a-z]+:)?getcontentlength>/i)?.[1];
    const modified = block.match(/<(?:[a-z]+:)?getlastmodified>([\s\S]*?)<\/(?:[a-z]+:)?getlastmodified>/i)?.[1];
    const folder = /<(?:[a-z]+:)?collection\s*\/?\s*>/i.test(block);
    const decodedHref = decodeURIComponent(decodeXml(href));
    const pathname = decodedHref.replace(/\/$/, "");
    const fallbackName = pathname.split("/").pop() || "Carpeta principal";
    return {
      name: decodeXml(displayName) || fallbackName,
      href: new URL(decodedHref, baseUrl.origin).toString(),
      type: folder ? "Carpeta" : "Archivo",
      size: size ? Number(size) : null,
      modified: modified || null,
    };
  }).filter((item, index) => index > 0 || item.href.replace(/\/$/, "") !== baseUrl.toString().replace(/\/$/, ""));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WebDavRequest;
    if (!body.url || !body.username || !body.password) {
      return NextResponse.json({ error: "Enter the WebDAV address, username, and password." }, { status: 400 });
    }
    const url = await safeWebDavUrl(body.url);
    const authorization = `Basic ${btoa(`${body.username}:${body.password}`)}`;
    const action = body.action || "list";

    if (action === "download") {
      const response = await fetch(url, { method: "GET", headers: { Authorization: authorization }, redirect: "manual", signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS) });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rejected the credentials or the permission to download this file." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `The file could not be downloaded. Blackboard returned ${response.status}.` }, { status: 502 });
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > 25 * 1024 * 1024) return NextResponse.json({ error: "The file exceeds the 25 MB download limit." }, { status: 413 });
      const data = await response.arrayBuffer();
      if (data.byteLength > 25 * 1024 * 1024) return NextResponse.json({ error: "The file exceeds the 25 MB download limit." }, { status: 413 });
      const fileName = decodeURIComponent(url.pathname.split("/").pop() || "archivo");
      return new NextResponse(data, { headers: { "Content-Type": response.headers.get("content-type") || "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`, "Content-Length": String(data.byteLength) } });
    }

    if (action === "read") {
      if (!/\.(html?|txt)$/i.test(url.pathname)) {
        return NextResponse.json({ error: "Only HTML, HTM, or TXT files can be edited directly." }, { status: 400 });
      }
      const response = await fetch(url, { method: "GET", headers: { Authorization: authorization }, redirect: "manual", signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS) });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rejected the credentials or the permission to open this file." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `The file could not be opened. Blackboard returned ${response.status}.` }, { status: 502 });
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > 5 * 1024 * 1024) return NextResponse.json({ error: "The file exceeds the 5 MB editing limit." }, { status: 413 });
      const content = await response.text();
      if (content.length > 5 * 1024 * 1024) return NextResponse.json({ error: "The file exceeds the 5 MB editing limit." }, { status: 413 });
      return NextResponse.json({ opened: true, content, name: decodeURIComponent(url.pathname.split("/").pop() || "documento.html"), href: url.toString() });
    }

    if (action === "write" || action === "writeBinary") {
      const fileName = (body.fileName || "").trim();
      const allowedName = action === "writeBinary" ? /^[^/\\]+\.(docx|pdf|pptx|xlsx|png|jpe?g|gif|webp|svg)$/i : /^[^/\\]+\.(html?|txt)$/i;
      if (!allowedName.test(fileName) || fileName.includes("..")) {
        return NextResponse.json({ error: action === "writeBinary" ? "Use a supported Word, PDF, PowerPoint, Excel, or image file." : "Use a valid file name ending in .html, .htm, or .txt." }, { status: 400 });
      }
      if (action === "write" && (typeof body.content !== "string" || body.content.length > 5 * 1024 * 1024)) {
        return NextResponse.json({ error: "The content must be text and cannot exceed 5 MB." }, { status: 400 });
      }
      if (action === "writeBinary" && (typeof body.dataBase64 !== "string" || body.dataBase64.length > 34 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.dataBase64))) {
        return NextResponse.json({ error: "The binary file is invalid or exceeds the 25 MB limit." }, { status: 400 });
      }
      const folderUrl = url.pathname.endsWith("/") ? url : new URL(`${url.toString()}/`);
      const target = await safeWebDavUrl(new URL(encodeURIComponent(fileName), folderUrl).toString());
      const lowerName = fileName.toLowerCase();
      const contentType = lowerName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : lowerName.endsWith(".pdf") ? "application/pdf" : lowerName.endsWith(".pptx") ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : lowerName.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : lowerName.endsWith(".svg") ? "image/svg+xml" : lowerName.endsWith(".png") ? "image/png" : /\.jpe?g$/.test(lowerName) ? "image/jpeg" : lowerName.endsWith(".gif") ? "image/gif" : lowerName.endsWith(".webp") ? "image/webp" : lowerName.endsWith(".txt") ? "text/plain; charset=utf-8" : "text/html; charset=utf-8";
      const uploadBody = action === "writeBinary" ? Buffer.from(body.dataBase64 || "", "base64") : body.content;
      const response = await fetch(target, {
        method: "PUT",
        headers: { Authorization: authorization, "Content-Type": contentType },
        body: uploadBody,
        redirect: "manual",
        signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS),
      });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rejected the credentials or does not allow saving in this folder." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `The file could not be saved. Blackboard returned ${response.status}.` }, { status: 502 });
      return NextResponse.json({ saved: true, name: fileName, href: target.toString() });
    }

    const response = await fetch(url, {
      method: "PROPFIND",
      headers: { Authorization: authorization, Depth: "1", "Content-Type": "application/xml; charset=utf-8" },
      body: `<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><displayname/><resourcetype/><getcontentlength/><getlastmodified/></prop></propfind>`,
      redirect: "manual",
      signal: AbortSignal.timeout(WEBDAV_TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: "Blackboard rejected the credentials or this account cannot access the folder." }, { status: 401 });
    }
    if (!response.ok && response.status !== 207) {
      return NextResponse.json({ error: `Blackboard returned status ${response.status}.` }, { status: 502 });
    }
    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_LIST_BYTES) return NextResponse.json({ error: "The WebDAV folder listing is too large." }, { status: 413 });
    const xml = await response.text();
    if (xml.length > MAX_LIST_BYTES) return NextResponse.json({ error: "The WebDAV folder listing is too large." }, { status: 413 });
    return NextResponse.json({ connected: true, files: parseWebDav(xml, url) });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return NextResponse.json({ error: "Blackboard did not respond within 20 seconds." }, { status: 504 });
    }
    const message = error instanceof Error ? error.message : "Content Collection could not be reached.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
