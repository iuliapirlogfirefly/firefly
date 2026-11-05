const ALLOWED = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "img",
  "h2",
  "h3",
  "blockquote",
]);

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function decodeAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readAttr(attrs: string, name: string): string | null {
  const match = attrs.match(
    new RegExp(
      `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`,
      "i"
    )
  );
  if (!match) return null;
  return decodeAttr(match[1] ?? match[2] ?? match[3] ?? "");
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafeHref(value: string): boolean {
  if (isHttpUrl(value)) return true;
  return /^mailto:[^\s]+$/i.test(value);
}

export function isNewsletterMessageEmpty(html: string): boolean {
  if (/<img\b/i.test(html)) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return text.length === 0;
}

export function sanitizeNewsletterHtml(input: string): string {
  const raw = input.replace(/\u0000/g, "").trim();
  if (!raw || isNewsletterMessageEmpty(raw)) return "";

  if (!/<[a-z!/]/i.test(raw)) {
    return raw
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeText(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  let html = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  let openLinks = 0;
  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, tag: string, attrs: string) => {
    let name = tag.toLowerCase();
    if (name === "div") name = "p";
    const closing = match.startsWith("</");

    if (!ALLOWED.has(name)) return "";
    if (name === "br") return closing ? "" : "<br>";
    if (name === "img") {
      if (closing) return "";
      const src = readAttr(attrs, "src");
      if (!src || !isHttpUrl(src)) return "";
      const alt = escapeAttr(readAttr(attrs, "alt") ?? "");
      return `<img src="${escapeAttr(src)}" alt="${alt}" style="max-width:100%;height:auto;">`;
    }
    if (name === "a") {
      if (closing) {
        if (openLinks === 0) return "";
        openLinks -= 1;
        return "</a>";
      }
      const href = readAttr(attrs, "href");
      if (!href || !isSafeHref(href)) return "";
      openLinks += 1;
      return `<a href="${escapeAttr(href)}">`;
    }
    if (closing) return `</${name}>`;
    return `<${name}>`;
  });

  return isNewsletterMessageEmpty(html) ? "" : html.trim();
}
