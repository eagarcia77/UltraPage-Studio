import { NextRequest, NextResponse } from "next/server";

type WebDavRequest = {
  url?: string;
  username?: string;
  password?: string;
};

function safeWebDavUrl(raw: string) {
  const url = new URL(raw);
  const allowedHost = url.hostname === "blackboard.com" || url.hostname.endsWith(".blackboard.com");
  if (url.protocol !== "https:" || !allowedHost || !url.pathname.startsWith("/bbcswebdav/")) {
    throw new Error("La dirección debe ser una ruta HTTPS válida de Blackboard Content Collection.");
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
      return NextResponse.json({ error: "Complete la dirección, el usuario y la contraseña." }, { status: 400 });
    }
    const url = safeWebDavUrl(body.url);
    const authorization = `Basic ${btoa(`${body.username}:${body.password}`)}`;
    const response = await fetch(url, {
      method: "PROPFIND",
      headers: { Authorization: authorization, Depth: "1", "Content-Type": "application/xml; charset=utf-8" },
      body: `<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><displayname/><resourcetype/><getcontentlength/><getlastmodified/></prop></propfind>`,
      redirect: "manual",
    });
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: "Blackboard rechazó las credenciales o la cuenta no tiene permiso para esta carpeta." }, { status: 401 });
    }
    if (!response.ok && response.status !== 207) {
      return NextResponse.json({ error: `Blackboard respondió con el código ${response.status}.` }, { status: 502 });
    }
    const xml = await response.text();
    return NextResponse.json({ connected: true, files: parseWebDav(xml, url) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con Content Collection.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
