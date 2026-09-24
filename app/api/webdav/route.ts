import { NextRequest, NextResponse } from "next/server";

type WebDavRequest = {
  action?: "list" | "read" | "download" | "write" | "writeBinary";
  url?: string;
  username?: string;
  password?: string;
  content?: string;
  dataBase64?: string;
  fileName?: string;
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
    const action = body.action || "list";

    if (action === "download") {
      const response = await fetch(url, { method: "GET", headers: { Authorization: authorization }, redirect: "manual" });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rechazó las credenciales o el permiso para descargar este archivo." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `No se pudo descargar el archivo. Blackboard respondió con ${response.status}.` }, { status: 502 });
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > 25 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera el límite de descarga de 25 MB." }, { status: 413 });
      const data = await response.arrayBuffer();
      if (data.byteLength > 25 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera el límite de descarga de 25 MB." }, { status: 413 });
      const fileName = decodeURIComponent(url.pathname.split("/").pop() || "archivo");
      return new NextResponse(data, { headers: { "Content-Type": response.headers.get("content-type") || "application/octet-stream", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`, "Content-Length": String(data.byteLength) } });
    }

    if (action === "read") {
      if (!/\.(html?|txt)$/i.test(url.pathname)) {
        return NextResponse.json({ error: "Solo se pueden editar archivos HTML, HTM o TXT." }, { status: 400 });
      }
      const response = await fetch(url, { method: "GET", headers: { Authorization: authorization }, redirect: "manual" });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rechazó las credenciales o el permiso para abrir este archivo." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `No se pudo abrir el archivo. Blackboard respondió con ${response.status}.` }, { status: 502 });
      const declaredSize = Number(response.headers.get("content-length") || 0);
      if (declaredSize > 5 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera el límite de edición de 5 MB." }, { status: 413 });
      const content = await response.text();
      if (content.length > 5 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera el límite de edición de 5 MB." }, { status: 413 });
      return NextResponse.json({ opened: true, content, name: decodeURIComponent(url.pathname.split("/").pop() || "documento.html"), href: url.toString() });
    }

    if (action === "write" || action === "writeBinary") {
      const fileName = (body.fileName || "").trim();
      const allowedName = action === "writeBinary" ? /^[^/\\]+\.(docx|pdf|pptx|xlsx|png|jpe?g|gif|webp|svg)$/i : /^[^/\\]+\.(html?|txt)$/i;
      if (!allowedName.test(fileName) || fileName.includes("..")) {
        return NextResponse.json({ error: action === "writeBinary" ? "Use un archivo Word, PDF, PowerPoint, Excel o una imagen compatible." : "Use un nombre válido que termine en .html, .htm o .txt." }, { status: 400 });
      }
      if (action === "write" && (typeof body.content !== "string" || body.content.length > 5 * 1024 * 1024)) {
        return NextResponse.json({ error: "El contenido debe ser texto y no superar 5 MB." }, { status: 400 });
      }
      if (action === "writeBinary" && (typeof body.dataBase64 !== "string" || body.dataBase64.length > 34 * 1024 * 1024 || !/^[A-Za-z0-9+/]*={0,2}$/.test(body.dataBase64))) {
        return NextResponse.json({ error: "El archivo binario no es válido o supera el límite de 25 MB." }, { status: 400 });
      }
      const folderUrl = url.pathname.endsWith("/") ? url : new URL(`${url.toString()}/`);
      const target = safeWebDavUrl(new URL(encodeURIComponent(fileName), folderUrl).toString());
      const lowerName = fileName.toLowerCase();
      const contentType = lowerName.endsWith(".docx") ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : lowerName.endsWith(".pdf") ? "application/pdf" : lowerName.endsWith(".pptx") ? "application/vnd.openxmlformats-officedocument.presentationml.presentation" : lowerName.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : lowerName.endsWith(".svg") ? "image/svg+xml" : lowerName.endsWith(".png") ? "image/png" : /\.jpe?g$/.test(lowerName) ? "image/jpeg" : lowerName.endsWith(".gif") ? "image/gif" : lowerName.endsWith(".webp") ? "image/webp" : lowerName.endsWith(".txt") ? "text/plain; charset=utf-8" : "text/html; charset=utf-8";
      const uploadBody = action === "writeBinary" ? Buffer.from(body.dataBase64 || "", "base64") : body.content;
      const response = await fetch(target, {
        method: "PUT",
        headers: { Authorization: authorization, "Content-Type": contentType },
        body: uploadBody,
        redirect: "manual",
      });
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Blackboard rechazó las credenciales o no permite guardar en esta carpeta." }, { status: 401 });
      }
      if (!response.ok) return NextResponse.json({ error: `No se pudo guardar. Blackboard respondió con ${response.status}.` }, { status: 502 });
      return NextResponse.json({ saved: true, name: fileName, href: target.toString() });
    }

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
