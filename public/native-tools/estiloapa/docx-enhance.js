const DOCX_ENHANCE_VERSION = "3.5";

async function waitDocx(timeoutMs = 12000) {
  const started = Date.now();
  while (!window.docx) {
    if (Date.now() - started > timeoutMs) throw new Error("The DOCX library could not be loaded.");
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  return window.docx;
}

function dataUrlToBytes(dataUrl) {
  const [, base64 = ""] = String(dataUrl).split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function dataUrlMime(dataUrl) {
  return /^data:image\/png/i.test(dataUrl) ? "png" : "jpg";
}

async function imageDimensions(src, maxWidth = 580, maxHeight = 650) {
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
      resolve({ width: Math.max(1, Math.round(image.naturalWidth * ratio)), height: Math.max(1, Math.round(image.naturalHeight * ratio)) });
    };
    image.onerror = () => reject(new Error("A figure extracted from the PDF could not be read."));
    image.src = src;
  });
}

function institutionalProfileEnabled() {
  return document.querySelector("#formatProfile")?.value === "modulo11c";
}

function inlineRuns(node, api, font, size, inherited = {}) {
  const { TextRun, ExternalHyperlink } = api;
  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.nodeValue) return [];
    return [new TextRun({ text: node.nodeValue, font, size, bold: inherited.bold, italics: inherited.italics, underline: inherited.underline ? {} : undefined })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const tag = node.tagName;
  const runInHeading = node.classList?.contains("apa-run-in-heading");
  const levelFiveHeading = runInHeading && node.closest?.(".level-5,.apa-heading-level-5");
  const style = {
    bold: inherited.bold || ["B", "STRONG"].includes(tag) || runInHeading,
    italics: inherited.italics || ["I", "EM"].includes(tag) || Boolean(levelFiveHeading),
    underline: inherited.underline || tag === "U"
  };
  if (tag === "BR") return [new TextRun({ break: 1, font, size })];
  if (tag === "A" && node.getAttribute("href") && ExternalHyperlink) {
    const text = node.textContent || node.getAttribute("href");
    return [new ExternalHyperlink({
      link: node.getAttribute("href"),
      children: [new TextRun({ text, font, size, color: "0563C1", underline: {}, bold: style.bold, italics: style.italics })]
    })];
  }
  return [...node.childNodes].flatMap((child) => inlineRuns(child, api, font, size, style));
}

function detectedHeadingLevel(element, institutional) {
  const dataLevel = Number(element.dataset?.apaHeadingLevel || 0);
  if ([1, 2, 3, 4, 5].includes(dataLevel)) return dataLevel;
  if (institutional) {
    if (element.classList.contains("apa-heading-level-1") || element.classList.contains("references-heading")) return 1;
    if (element.classList.contains("apa-heading-level-2") || element.classList.contains("topic-heading")) return 2;
    if (element.classList.contains("apa-heading-level-3") || element.classList.contains("module-subheading")) return 3;
    if (element.classList.contains("apa-heading-level-4")) return 4;
    if (element.classList.contains("apa-heading-level-5")) return 5;
    return 0;
  }
  if (element.classList.contains("level-1") || element.tagName === "H1") return 1;
  if (element.classList.contains("level-2") || element.tagName === "H2") return 2;
  if (element.classList.contains("level-3") || element.tagName === "H3") return 3;
  if (element.classList.contains("apa-heading-level-4") || element.tagName === "H4") return 4;
  if (element.classList.contains("apa-heading-level-5") || ["H5", "H6"].includes(element.tagName)) return 5;
  return 0;
}

function paragraphFromElement(element, api, font, size, firstLineIndent, hangingReferences, institutional) {
  const { Paragraph, AlignmentType, TextRun, HeadingLevel } = api;
  const text = element.textContent.replace(/\s+/g, " ").trim();
  if (!text) return null;

  const isRef = element.classList.contains("apa-reference");
  const isTitle = element.classList.contains("apa-title") || element.classList.contains("apa-editor-title");
  const isCoverLine = element.classList.contains("apa-cover-line");
  const isCoverTitle = element.classList.contains("apa-cover-title");
  const isBodyTitle = element.classList.contains("apa-body-title");
  const headingLevel = detectedHeadingLevel(element, institutional);
  const isHeading = headingLevel > 0;
  const isReferencesHeading = element.classList.contains("apa-references-heading") || element.classList.contains("references-heading");
  const isModuleKeywords = institutional && element.classList.contains("module-keywords");
  const isTableLabel = element.classList.contains("module-table-label") || element.classList.contains("apa-table-label");
  const isTableTitle = element.classList.contains("module-table-title") || element.classList.contains("apa-table-title");
  const isFigureLabel = element.classList.contains("apa-figure-label");
  const isFigureTitle = element.classList.contains("apa-figure-title");
  const isNote = element.classList.contains("apa-note");

  let runs = inlineRuns(element, api, font, size, { bold: isModuleKeywords });
  if (!runs.length) runs = [new TextRun({ text, font, size })];

  if (isTitle) {
    runs = [new TextRun({ text, font, size, bold: true })];
  } else if (isHeading && !([4, 5].includes(headingLevel) && element.querySelector(".apa-run-in-heading"))) {
    const headingItalic = [3, 5].includes(headingLevel);
    runs = [new TextRun({ text, font, size, bold: true, italics: headingItalic })];
  } else if (isTableLabel || isFigureLabel) {
    runs = [new TextRun({ text, font, size, bold: true })];
  } else if (isTableTitle || isFigureTitle) {
    runs = [new TextRun({ text, font, size, italics: true })];
  }

  let alignment = AlignmentType.LEFT;
  if (isTitle || isCoverLine || headingLevel === 1 || isReferencesHeading) alignment = AlignmentType.CENTER;

  const options = {
    children: runs,
    spacing: { line: 480, after: 0, before: 0 },
    alignment,
    keepNext: (isHeading && headingLevel <= 3) || isTableLabel || isTableTitle || isFigureLabel || isFigureTitle,
  };
  if (isTitle && HeadingLevel?.TITLE) options.heading = HeadingLevel.TITLE;
  else if (isHeading && HeadingLevel?.[`HEADING_${headingLevel}`]) options.heading = HeadingLevel[`HEADING_${headingLevel}`];
  if (isCoverTitle) {
    options.spacing.before = 720;
    options.spacing.after = 480;
  }
  if (isBodyTitle) options.pageBreakBefore = true;

  if (isRef && hangingReferences) {
    options.indent = { left: 720, hanging: 720 };
  } else {
    const runInHeading = [4, 5].includes(headingLevel);
    const noIndent = isTitle || (isHeading && !runInHeading) || isFigureLabel || isFigureTitle || isTableLabel || isTableTitle || isNote || element.classList.contains("no-indent");
    if (runInHeading && firstLineIndent) options.indent = { firstLine: 720 };
    else if (!noIndent && firstLineIndent) options.indent = { firstLine: 720 };
  }

  return new Paragraph(options);
}

function topLevelBlocks(preview) {
  const clone = preview.cloneNode(true);
  clone.removeAttribute("contenteditable");
  clone.querySelectorAll("hr.document-separator").forEach((node) => node.remove());
  const blocks = [];
  const visit = (parent) => {
    for (const child of [...parent.children]) {
      if (child.matches("section[data-source-file]")) visit(child);
      else blocks.push(child);
    }
  };
  visit(clone);
  return blocks;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function looksNumeric(text) {
  return /^[-+]?[$€£]?\s*\d[\d,.]*(?:\s*%|\s*[A-Za-z]{0,3})?$/.test(String(text || "").trim());
}

function apaTableFromElement(element, api, font, size, institutional) {
  const { Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle, AlignmentType } = api;
  const none = { style: BorderStyle?.NONE || "none", size: 0, color: "FFFFFF" };
  const single = { style: BorderStyle?.SINGLE || "single", size: 8, color: "000000" };
  const domRows = [...element.querySelectorAll("tr")];
  if (!domRows.length) return null;

  const rows = domRows.map((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const isLast = rowIndex === domRows.length - 1;
    const cells = [...row.cells].map((cell, cellIndex) => {
      const text = cell.textContent.replace(/\s+/g, " ").trim();
      let alignment = AlignmentType.LEFT;
      if (isHeader && cellIndex > 0) alignment = AlignmentType.CENTER;
      else if (!isHeader && looksNumeric(text)) alignment = AlignmentType.RIGHT;

      const borders = {
        top: isHeader ? single : none,
        bottom: (isHeader || isLast) ? single : none,
        left: none,
        right: none,
      };

      return new TableCell({
        borders,
        margins: { top: 80, bottom: 80, left: 90, right: 90 },
        children: [new Paragraph({
          alignment,
          children: inlineRuns(cell, api, font, size, { bold: isHeader }),
          spacing: { line: institutional ? 240 : 480, after: 0, before: 0 },
        })]
      });
    });
    return new TableRow({ cantSplit: true, tableHeader: isHeader, children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: none,
      bottom: none,
      left: none,
      right: none,
      insideHorizontal: none,
      insideVertical: none,
    },
  });
}

function orderedListConfig(reference, start = 1) {
  return {
    reference,
    levels: [{
      level: 0,
      format: "decimal",
      text: "%1.",
      alignment: "left",
      start: Number.isFinite(start) && start > 0 ? start : 1,
      style: {
        paragraph: { indent: { left: 720, hanging: 360 } },
      },
    }],
  };
}

async function enhancedDocxExport() {
  const preview = document.querySelector("#preview");
  if (!preview) return false;
  if (typeof window.normalizeNumberedLists === "function") window.normalizeNumberedLists(preview);
  const institutional = institutionalProfileEnabled();

  const api = await waitDocx();
  const { Document, Packer, Paragraph, TextRun, Header, PageNumber, AlignmentType, ImageRun } = api;
  const selectedFont = document.querySelector("#fontFamily")?.value || "Times New Roman";
  const font = institutional ? "Arial" : selectedFont;
  const sizes = { "Times New Roman": 24, Arial: 22, Calibri: 22, Georgia: 22 };
  const size = institutional ? 24 : (sizes[font] || 24);
  const firstLineIndent = document.querySelector("#firstLineIndent")?.checked !== false;
  const hangingReferences = document.querySelector("#hangingReferences")?.checked !== false;
  const addPageNumbers = document.querySelector("#pageNumbers")?.checked !== false;
  const children = [];
  const numberingConfigs = [];
  let orderedListCounter = 0;

  for (const element of topLevelBlocks(preview)) {
    if (element.tagName === "IMG" && element.classList.contains("apa-figure-image")) {
      const src = element.getAttribute("src") || "";
      if (!src.startsWith("data:image/")) continue;
      const dimensions = await imageDimensions(src);
      const alt = element.getAttribute("alt") || "Figura extraída del PDF";
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
          data: dataUrlToBytes(src),
          type: dataUrlMime(src),
          transformation: dimensions,
          altText: { title: alt, description: alt, name: alt }
        })],
        spacing: { line: 480, after: 0, before: 0 }
      }));
      continue;
    }

    if (["UL", "OL"].includes(element.tagName)) {
      let numberingReference = null;
      if (element.tagName === "OL") {
        orderedListCounter += 1;
        numberingReference = `apa-numbering-v31-${orderedListCounter}`;
        const start = Number.parseInt(element.getAttribute("start") || "1", 10) || 1;
        numberingConfigs.push(orderedListConfig(numberingReference, start));
      }
      for (const li of element.querySelectorAll(":scope > li")) {
        const text = li.textContent.replace(/\s+/g, " ").trim();
        if (!text) continue;
        children.push(new Paragraph({
          children: inlineRuns(li, api, font, size),
          bullet: element.tagName === "UL" ? { level: 0 } : undefined,
          numbering: element.tagName === "OL" ? { reference: numberingReference, level: 0 } : undefined,
          spacing: { line: 480, after: 0, before: 0 }
        }));
      }
      continue;
    }

    if (element.tagName === "TABLE") {
      const table = apaTableFromElement(element, api, font, size, institutional);
      if (table) children.push(table);
      continue;
    }

    const paragraph = paragraphFromElement(element, api, font, size, firstLineIndent, hangingReferences, institutional);
    if (paragraph) children.push(paragraph);
  }

  const headers = addPageNumbers ? {
    default: new Header({
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ children: [PageNumber.CURRENT], font, size })]
      })]
    })
  } : undefined;

  const doc = new Document({
    numbering: { config: numberingConfigs },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers,
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, institutional ? "modulo-institucional-APA7-v3.5.docx" : "trabajo-estudiantil-APA7-v3.5.docx");

  const status = document.querySelector("#status");
  if (status) {
    status.textContent = institutional
      ? `DOCX generated with APA 7 v${DOCX_ENHANCE_VERSION}; ${orderedListCounter} numbered list(s) use independent sequences.`
      : `DOCX generated with APA 7 v${DOCX_ENHANCE_VERSION}; Word heading levels, student title page, tables, and numbered lists were preserved.`;
    status.className = "status success";
  }
  return true;
}

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#downloadDocxBtn");
  if (!button) return;
  const preview = document.querySelector("#preview");
  if (!preview) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  void enhancedDocxExport().catch((error) => {
    console.error("DOCX formatter", error);
    const status = document.querySelector("#status");
    if (status) {
      status.textContent = `The enhanced DOCX could not be generated: ${error?.message || error}`;
      status.className = "status error";
    }
  });
}, true);
