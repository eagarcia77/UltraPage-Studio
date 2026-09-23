import { NextRequest, NextResponse } from "next/server";
import { load, type CheerioAPI } from "cheerio";
import PDFDocument from "pdfkit";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  UnderlineType,
  WidthType,
  type ParagraphChild,
  type IParagraphOptions,
} from "docx";
import type { AnyNode, Element } from "domhandler";
import path from "node:path";

export const runtime = "nodejs";

type ExportRequest = {
  format?: "docx" | "pdf";
  html?: string;
  title?: string;
  author?: string;
  language?: string;
};

const MAX_HTML_LENGTH = 5 * 1024 * 1024;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function safeFileName(value: string) {
  const clean = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 _-]/g, "").trim();
  return clean || "documento-accesible";
}

function inlineRuns($: CheerioAPI, element: Element, style: { bold?: boolean; italics?: boolean; underline?: boolean } = {}): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  for (const node of element.children as AnyNode[]) {
    if (node.type === "text") {
      if (node.data) runs.push(new TextRun({ text: node.data, ...style, underline: style.underline ? { type: UnderlineType.SINGLE } : undefined, language: { value: "es-PR" } }));
      continue;
    }
    if (node.type !== "tag") continue;
    const tag = node.name.toLowerCase();
    if (tag === "br") {
      runs.push(new TextRun({ break: 1 }));
      continue;
    }
    const nextStyle = {
      bold: style.bold || tag === "strong" || tag === "b",
      italics: style.italics || tag === "em" || tag === "i",
      underline: style.underline || tag === "u",
    };
    if (tag === "a" && node.attribs?.href) {
      const label = cleanText($(node).text()) || node.attribs.href;
      runs.push(new ExternalHyperlink({
        link: node.attribs.href,
        children: [new TextRun({ text: label, color: "2457A6", underline: { type: UnderlineType.SINGLE }, language: { value: "es-PR" } })],
      }));
    } else {
      runs.push(...inlineRuns($, node, nextStyle));
    }
  }
  return runs.length ? runs : [new TextRun({ text: cleanText($(element).text()), language: { value: "es-PR" } })];
}

function docxBlocks(html: string) {
  const $ = load(`<body>${html}</body>`);
  const blocks: Array<Paragraph | Table> = [];
  const addParagraph = (element: Element, options: IParagraphOptions = {}) => {
    blocks.push(new Paragraph({ ...options, children: inlineRuns($, element), spacing: { after: 160, ...(options.spacing || {}) } }));
  };

  $("body").children().each((_, raw) => {
    const element = raw as Element;
    const tag = element.name.toLowerCase();
    const classes = new Set((element.attribs?.class || "").split(/\s+/).filter(Boolean));
    if (/^h[1-6]$/.test(tag)) {
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
      addParagraph(element, { heading: levels[Number(tag[1]) - 1], keepNext: true });
      return;
    }
    if (tag === "p" || tag === "blockquote") {
      if (classes.has("eyebrow")) {
        blocks.push(new Paragraph({ children: [new TextRun({ text: cleanText($(element).text()).toUpperCase(), bold: true, color: "6B38D1", size: 20, characterSpacing: 40, language: { value: "es-PR" } })], spacing: { after: 100 } }));
      } else if (classes.has("lead")) {
        blocks.push(new Paragraph({ children: [new TextRun({ text: cleanText($(element).text()), color: "555E70", size: 30, language: { value: "es-PR" } })], spacing: { after: 220, line: 420 } }));
      } else if (classes.has("apa-reference")) {
        addParagraph(element, { indent: { left: 720, hanging: 720 }, spacing: { after: 120, line: 480 } });
      } else {
        addParagraph(element, tag === "blockquote" ? { indent: { left: 720 }, shading: { fill: "FAF8FF" }, border: { left: { style: BorderStyle.SINGLE, size: 16, color: "6B38D1", space: 8 } } } : {});
      }
      return;
    }
    if (tag === "div" && classes.has("callout")) {
      const titleText = cleanText($(element).children("strong,b").first().text());
      const calloutParagraphs: Paragraph[] = [];
      if (titleText) calloutParagraphs.push(new Paragraph({ children: [new TextRun({ text: titleText, bold: true, color: "5124A9", size: 24, language: { value: "es-PR" } })], spacing: { after: 80 } }));
      $(element).children("p").each((__, paragraph) => { calloutParagraphs.push(new Paragraph({ children: inlineRuns($, paragraph as Element), spacing: { after: 80, line: 360 } })); });
      if (!calloutParagraphs.length) calloutParagraphs.push(new Paragraph({ children: [new TextRun({ text: cleanText($(element).text()), language: { value: "es-PR" } })] }));
      const noBorder = { style: BorderStyle.NIL, size: 0, color: "FFFFFF" };
      blocks.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder, left: { style: BorderStyle.SINGLE, size: 24, color: "6B38D1" } },
        rows: [new TableRow({ children: [new TableCell({ children: calloutParagraphs, shading: { fill: "F3EFFC" }, margins: { top: 260, bottom: 220, left: 300, right: 300 } })] })],
      }));
      blocks.push(new Paragraph({ children: [], spacing: { after: 120 } }));
      return;
    }
    if (tag === "ul" || tag === "ol") {
      $(element).children("li").each((__, li) => {
        const children = inlineRuns($, li as Element);
        blocks.push(new Paragraph(tag === "ul" ? { children, bullet: { level: 0 }, spacing: { after: 100 } } : { children, numbering: { reference: "ordered-list", level: 0 }, spacing: { after: 100 } }));
      });
      return;
    }
    if (tag === "table") {
      const rows: TableRow[] = [];
      $(element).find("tr").each((rowIndex, row) => {
        const cells = $(row).children("th,td").toArray().map((cell) => new TableCell({
          children: [new Paragraph({ children: inlineRuns($, cell as Element), spacing: { after: 0 } })],
          shading: cell.name.toLowerCase() === "th" ? { fill: "E9E2F8" } : undefined,
        }));
        if (cells.length) rows.push(new TableRow({ children: cells, tableHeader: rowIndex === 0 && $(row).children("th").length > 0, cantSplit: true }));
      });
      if (rows.length) blocks.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
      return;
    }
    if (tag === "figure") {
      const img = $(element).find("img").first();
      const alt = cleanText(img.attr("alt") || "");
      const caption = cleanText($(element).find("figcaption").text());
      if (alt) blocks.push(new Paragraph({ children: [new TextRun({ text: `[Imagen: ${alt}]`, italics: true, language: { value: "es-PR" } })], spacing: { after: 80 } }));
      if (caption) blocks.push(new Paragraph({ children: [new TextRun({ text: caption, italics: true, language: { value: "es-PR" } })], spacing: { after: 160 } }));
      return;
    }
    const text = cleanText($(element).text());
    if (text) addParagraph(element);
  });
  return blocks;
}

async function createDocx(html: string, title: string, author: string) {
  const document = new Document({
    creator: author,
    title,
    subject: "Documento accesible exportado desde UltraPage Studio",
    description: "Documento estructurado con encabezados, listas, tablas y enlaces accesibles.",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 24, language: { value: "es-PR" } },
          paragraph: { spacing: { line: 360 } },
        },
        heading1: { run: { font: "Arial", size: 68, bold: true, color: "242439" }, paragraph: { spacing: { before: 200, after: 240 }, keepNext: true } },
        heading2: { run: { font: "Arial", size: 46, bold: true, color: "302254" }, paragraph: { spacing: { before: 380, after: 140 }, keepNext: true } },
        heading3: { run: { font: "Arial", size: 38, bold: true, color: "302254" }, paragraph: { spacing: { before: 300, after: 120 }, keepNext: true } },
        heading4: { run: { font: "Arial", size: 34, bold: true, color: "302254" }, paragraph: { spacing: { before: 260, after: 100 }, keepNext: true } },
      },
    },
    numbering: {
      config: [{ reference: "ordered-list", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
    },
    sections: [{
      properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children: docxBlocks(html),
    }],
  });
  return Packer.toBuffer(document);
}

function createPdf(html: string, title: string, author: string) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const pdf = new PDFDocument({
      size: "LETTER",
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      tagged: true,
      subset: "PDF/UA" as never,
      pdfVersion: "1.7",
      lang: "es-PR",
      displayTitle: true,
      info: { Title: title, Author: author, Subject: "Documento accesible exportado desde UltraPage Studio", Creator: "UltraPage Studio" },
    });
    pdf.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    const fontRoot = path.join(process.cwd(), "node_modules/@fontsource/dejavu-sans/files");
    pdf.registerFont("AccessibleSans", path.join(fontRoot, "dejavu-sans-latin-400-normal.woff"));
    pdf.registerFont("AccessibleSansBold", path.join(fontRoot, "dejavu-sans-latin-700-normal.woff"));

    const root = pdf.struct("Document", { title, lang: "es-PR" });
    pdf.addStructure(root);
    const $ = load(`<body>${html}</body>`);
    const bodyWidth = 468;
    const ensureSpace = (height = 80) => { if (pdf.y + height > pdf.page.height - 72) pdf.addPage(); };

    $("body").children().each((_, raw) => {
      const element = raw as Element;
      const tag = element.name.toLowerCase();
      const classes = new Set((element.attribs?.class || "").split(/\s+/).filter(Boolean));
      const text = cleanText($(element).text());
      if (!text && tag !== "figure") return;
      ensureSpace(tag === "table" ? 140 : 70);
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1]);
        pdf.font("AccessibleSansBold").fontSize(level === 1 ? 22 : Math.max(12, 19 - level)).fillColor("#242439").text(text, { width: bodyWidth, paragraphGap: 8, structParent: root, structType: `H${level}` });
      } else if (tag === "p" && classes.has("eyebrow")) {
        pdf.font("AccessibleSansBold").fontSize(9).fillColor("#6B38D1").text(text.toUpperCase(), { width: bodyWidth, characterSpacing: 1.1, paragraphGap: 5, structParent: root, structType: "P" });
      } else if (tag === "p" && classes.has("lead")) {
        pdf.font("AccessibleSans").fontSize(14).fillColor("#555E70").text(text, { width: bodyWidth, lineGap: 4, paragraphGap: 10, structParent: root, structType: "P" });
      } else if (tag === "div" && classes.has("callout")) {
        const calloutTitle = cleanText($(element).children("strong,b").first().text());
        const calloutBody = $(element).children("p").toArray().map((paragraph) => cleanText($(paragraph).text())).filter(Boolean).join("\n");
        pdf.font("AccessibleSansBold").fontSize(11);
        const titleHeight = calloutTitle ? pdf.heightOfString(calloutTitle, { width: bodyWidth - 40 }) : 0;
        pdf.font("AccessibleSans").fontSize(10.5);
        const bodyHeight = calloutBody ? pdf.heightOfString(calloutBody, { width: bodyWidth - 40, lineGap: 3 }) : 0;
        const boxHeight = Math.max(54, titleHeight + bodyHeight + (calloutTitle && calloutBody ? 8 : 0) + 32);
        ensureSpace(boxHeight + 18);
        const boxX = pdf.page.margins.left;
        const boxY = pdf.y;
        pdf.markContent("Artifact", { type: "Layout" });
        pdf.save().fillColor("#F3EFFC").roundedRect(boxX, boxY, bodyWidth, boxHeight, 5).fill().fillColor("#6B38D1").rect(boxX, boxY, 5, boxHeight).fill().restore();
        pdf.endMarkedContent();
        const section = pdf.struct("Sect", { title: calloutTitle || "Contenido destacado", lang: "es-PR" });
        root.add(section);
        let textY = boxY + 15;
        if (calloutTitle) {
          pdf.font("AccessibleSansBold").fontSize(11).fillColor("#5124A9").text(calloutTitle, boxX + 20, textY, { width: bodyWidth - 40, structParent: section, structType: "P" });
          textY += titleHeight + 7;
        }
        if (calloutBody) pdf.font("AccessibleSans").fontSize(10.5).fillColor("#242A36").text(calloutBody, boxX + 20, textY, { width: bodyWidth - 40, lineGap: 3, structParent: section, structType: "P" });
        pdf.x = boxX; pdf.y = boxY + boxHeight + 14;
      } else if (tag === "ul" || tag === "ol") {
        const items = $(element).children("li").toArray().map((li) => cleanText($(li).text())).filter(Boolean);
        pdf.font("AccessibleSans").fontSize(11).fillColor("#222222").list(items, { width: bodyWidth, listType: tag === "ol" ? "numbered" : "bullet", paragraphGap: 4, structParent: root });
        pdf.moveDown(0.4);
      } else if (tag === "table") {
        const data = $(element).find("tr").toArray().map((row, rowIndex) => $(row).children("th,td").toArray().map((cell) => ({
          text: cleanText($(cell).text()),
          type: (cell.name.toLowerCase() === "th" || rowIndex === 0 ? "TH" : "TD") as "TH" | "TD",
          backgroundColor: cell.name.toLowerCase() === "th" || rowIndex === 0 ? "#E9E2F8" : "#FFFFFF",
          padding: 5,
          font: { family: cell.name.toLowerCase() === "th" || rowIndex === 0 ? "AccessibleSansBold" : "AccessibleSans", size: 9 },
        })));
        if (data.length) pdf.table({ data, maxWidth: bodyWidth, defaultStyle: { border: 0.5, borderColor: "#6B7280" } });
        pdf.moveDown(0.6);
      } else if (tag === "figure") {
        const alt = cleanText($(element).find("img").attr("alt") || "");
        const caption = cleanText($(element).find("figcaption").text());
        const description = [alt ? `Imagen: ${alt}` : "Imagen sin texto alternativo", caption].filter(Boolean).join(". ");
        const figure = pdf.struct("Figure", { alt: description, lang: "es-PR" });
        root.add(figure);
        pdf.font("AccessibleSans").fontSize(10).fillColor("#4B5563").text(description, { width: bodyWidth, paragraphGap: 8, structParent: figure, structType: "Caption" });
      } else {
        const apaReference = classes.has("apa-reference");
        pdf.font("AccessibleSans").fontSize(11).fillColor(tag === "blockquote" ? "#555E70" : "#222222").text(text, { width: bodyWidth - (apaReference ? 24 : 0), align: "left", lineGap: 3, paragraphGap: 8, indent: tag === "blockquote" || apaReference ? 24 : 0, structParent: root, structType: "P" });
      }
    });
    pdf.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExportRequest;
    const format = body.format;
    const html = body.html || "";
    const title = cleanText(body.title || "Documento accesible").slice(0, 200);
    const author = cleanText(body.author || "UltraPage Studio").slice(0, 120);
    if ((format !== "docx" && format !== "pdf") || !html || html.length > MAX_HTML_LENGTH) {
      return NextResponse.json({ error: "Formato o contenido no válido." }, { status: 400 });
    }
    const data = format === "docx" ? await createDocx(html, title, author) : await createPdf(html, title, author);
    const name = `${safeFileName(title)}.${format}`;
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo exportar el documento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
