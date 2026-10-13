export function validatedEditorLink(input) {
  const value = String(input || "").trim();
  if (!value || /[\u0000-\u001f\u007f]/u.test(value)) return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "mailto:") return parsed.pathname && /@/.test(parsed.pathname) ? parsed.href : "";
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return "";
    return parsed.href;
  } catch {
    return "";
  }
}
