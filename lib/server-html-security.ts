import { load } from "cheerio";

const allowedProtocols = new Set(["http:", "https:", "mailto:", "tel:"]);

function safeUrl(raw: string, allowDataImage = false) {
  const value = raw.trim();
  if (!value || value.startsWith("#") || value.startsWith("/")) return value;
  if (allowDataImage && /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
  try {
    const parsed = new URL(value);
    return allowedProtocols.has(parsed.protocol) ? value : "";
  } catch {
    return "";
  }
}

export function sanitizeServerHtml(source: string) {
  const $ = load(`<main id="ultrapage-sanitize-root">${source}</main>`, { xml: false });
  const root = $("#ultrapage-sanitize-root");
  root.find("script,style,meta,link,base,object,embed,form,input,button,textarea,select,template").remove();
  root.find("*").each((_, element) => {
    const node = $(element);
    Object.keys(element.attribs || {}).forEach((name) => {
      if (/^on/i.test(name) || name.toLowerCase() === "srcdoc") node.removeAttr(name);
    });
    const href = node.attr("href");
    if (href !== undefined) {
      const safe = safeUrl(href);
      if (safe) node.attr("href", safe).attr("rel", "noopener noreferrer");
      else node.removeAttr("href");
    }
    const src = node.attr("src");
    if (src !== undefined) {
      const safe = safeUrl(src, element.tagName?.toLowerCase() === "img");
      if (safe) node.attr("src", safe);
      else node.removeAttr("src");
    }
    const style = node.attr("style");
    if (style && /(?:expression\s*\(|url\s*\(\s*['"]?\s*(?:javascript|data:text\/html)|@import|-moz-binding)/i.test(style)) node.removeAttr("style");
  });
  return root.html() || "";
}
