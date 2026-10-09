// Curralume Studio integration layer. The upstream CTEL-SG repository remains unchanged.
(function createCanvasQti(global) {
  "use strict";

  const TYPE_MAP = {
    MC: "multiple_choice_question",
    MA: "multiple_answers_question",
    TF: "true_false_question",
    ESS: "essay_question",
    FIB: "short_answer_question",
    SR: "short_answer_question"
  };

  function escapeXml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
    })[character]);
  }

  function safeIdentifier(value, fallback = "assessment") {
    const normalized = String(value || fallback).normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    const identifier = normalized.replace(/[^A-Za-z0-9_.-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80);
    return identifier || fallback;
  }

  function metadata(type, points, index) {
    return `<itemmetadata>
  <qtimetadata>
    <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>${TYPE_MAP[type]}</fieldentry></qtimetadatafield>
    <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>${points}</fieldentry></qtimetadatafield>
    <qtimetadatafield><fieldlabel>assessment_question_identifierref</fieldlabel><fieldentry>question_${index + 1}</fieldentry></qtimetadatafield>
  </qtimetadata>
</itemmetadata>`;
  }

  function promptMaterial(question) {
    return `<material><mattext texttype="text/plain">${escapeXml(question)}</mattext></material>`;
  }

  function outcomes(points) {
    return `<outcomes><decvar maxvalue="${points}" minvalue="0" varname="SCORE" vartype="Decimal" /></outcomes>`;
  }

  function responseCondition(condition, points) {
    return `<respcondition continue="No">
  <conditionvar>${condition}</conditionvar>
  <setvar action="Set" varname="SCORE">${points}</setvar>
</respcondition>`;
  }

  function choiceItem(item, index, points) {
    const type = item.type;
    const options = type === "TF"
      ? [{ text: "True", correct: item.data?.value === "true" }, { text: "False", correct: item.data?.value === "false" }]
      : (item.data?.options || []);
    const cardinality = type === "MA" ? "Multiple" : "Single";
    const labels = options.map((option, optionIndex) => `<response_label ident="answer_${index + 1}_${optionIndex + 1}">${promptMaterial(option.text)}</response_label>`).join("\n");
    const correct = options.map((option, optionIndex) => ({ ...option, id: `answer_${index + 1}_${optionIndex + 1}` })).filter((option) => option.correct);
    const incorrect = options.map((option, optionIndex) => ({ ...option, id: `answer_${index + 1}_${optionIndex + 1}` })).filter((option) => !option.correct);
    let condition;
    if (type === "MA") {
      const requirements = [
        ...correct.map((option) => `<varequal respident="response1">${option.id}</varequal>`),
        ...incorrect.map((option) => `<not><varequal respident="response1">${option.id}</varequal></not>`)
      ];
      condition = `<and>${requirements.join("")}</and>`;
    } else {
      condition = `<varequal respident="response1">${correct[0]?.id || "missing_correct_answer"}</varequal>`;
    }
    return `<presentation>
  ${promptMaterial(item.question)}
  <response_lid ident="response1" rcardinality="${cardinality}">
    <render_choice shuffle="No">${labels}</render_choice>
  </response_lid>
</presentation>
<resprocessing>
  ${outcomes(points)}
  ${responseCondition(condition, points)}
</resprocessing>`;
  }

  function shortAnswerItem(item, points) {
    const answers = item.data?.answers || [];
    const conditions = answers.map((answer) => `<varequal case="No" respident="response1">${escapeXml(answer)}</varequal>`);
    const condition = conditions.length > 1 ? `<or>${conditions.join("")}</or>` : conditions[0];
    return `<presentation>
  ${promptMaterial(item.question)}
  <response_str ident="response1" rcardinality="Single"><render_fib fibtype="String" prompt="Box" rows="1" columns="40" /></response_str>
</presentation>
<resprocessing>
  ${outcomes(points)}
  ${responseCondition(condition || "<other />", points)}
</resprocessing>`;
  }

  function essayItem(item, points) {
    return `<presentation>
  ${promptMaterial(item.question)}
  <response_str ident="response1" rcardinality="Single"><render_fib fibtype="String" prompt="Box" rows="12" columns="80" /></response_str>
</presentation>
<resprocessing>${outcomes(points)}</resprocessing>`;
  }

  function buildItem(item, index, points) {
    const type = TYPE_MAP[item.type];
    if (!type) throw new Error(`Canvas QTI does not support ${item.type} in this converter.`);
    const body = ["MC", "MA", "TF"].includes(item.type)
      ? choiceItem(item, index, points)
      : item.type === "ESS" ? essayItem(item, points) : shortAnswerItem(item, points);
    return `<item ident="question_${index + 1}" title="Question ${index + 1}">
${metadata(item.type, points, index)}
${body}
</item>`;
  }

  function buildAssessment(items, name, points) {
    const title = String(name || "Canvas Assessment").trim() || "Canvas Assessment";
    const identifier = safeIdentifier(title, "canvas_assessment");
    const itemXml = items.map((item, index) => buildItem(item, index, points)).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <assessment ident="${identifier}" title="${escapeXml(title)}">
    <qtimetadata><qtimetadatafield><fieldlabel>qmd_assessmenttype</fieldlabel><fieldentry>Examination</fieldentry></qtimetadatafield></qtimetadata>
    <section ident="root_section">
${itemXml}
    </section>
  </assessment>
</questestinterop>`;
  }

  function buildManifest(name) {
    const identifier = safeIdentifier(name, "canvas_assessment");
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="manifest_${identifier}">
  <metadata><schema>IMS Question &amp; Test Interoperability</schema><schemaversion>1.2</schemaversion></metadata>
  <organizations />
  <resources>
    <resource identifier="assessment_resource" type="imsqti_xmlv1p2" href="assessment_qti.xml">
      <file href="assessment_qti.xml" />
    </resource>
  </resources>
</manifest>`;
  }

  function buildPackage(items, name, points = 1) {
    const numericPoints = Number(points);
    if (!Number.isFinite(numericPoints) || numericPoints <= 0 || numericPoints > 1000) throw new Error("Canvas points must be between 0.01 and 1000.");
    if (!Array.isArray(items) || !items.length) throw new Error("No Canvas-compatible questions were supplied.");
    return {
      "imsmanifest.xml": buildManifest(name),
      "assessment_qti.xml": buildAssessment(items, name, numericPoints)
    };
  }

  function buildPreview(items, name, points) {
    const files = buildPackage(items, name, points);
    return `CANVAS QTI 1.2 PACKAGE READY\n\nQuestions: ${items.length}\nDefault points: ${Number(points)}\nFiles:\n- imsmanifest.xml\n- assessment_qti.xml\n\n--- imsmanifest.xml ---\n${files["imsmanifest.xml"]}\n\n--- assessment_qti.xml (preview) ---\n${files["assessment_qti.xml"].slice(0, 7000)}${files["assessment_qti.xml"].length > 7000 ? "\n… preview truncated …" : ""}`;
  }

  function makeCrcTable() {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let value = n;
      for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1);
      table[n] = value >>> 0;
    }
    return table;
  }

  const CRC_TABLE = makeCrcTable();
  function crc32(bytes) {
    let crc = -1;
    for (let index = 0; index < bytes.length; index += 1) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[index]) & 0xFF];
    return (crc ^ -1) >>> 0;
  }
  function uint16(value) {
    const result = new Uint8Array(2);
    new DataView(result.buffer).setUint16(0, value, true);
    return result;
  }
  function uint32(value) {
    const result = new Uint8Array(4);
    new DataView(result.buffer).setUint32(0, value >>> 0, true);
    return result;
  }
  function concatArrays(arrays) {
    const output = new Uint8Array(arrays.reduce((total, array) => total + array.length, 0));
    let offset = 0;
    arrays.forEach((array) => { output.set(array, offset); offset += array.length; });
    return output;
  }
  function dosDateTime(date) {
    const year = Math.max(date.getFullYear(), 1980);
    return {
      time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
      date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
  }
  function createZipBlob(files) {
    const encoder = new TextEncoder();
    const stamp = dosDateTime(new Date());
    const local = [];
    const central = [];
    let offset = 0;
    const entries = Object.entries(files);
    entries.forEach(([filename, content]) => {
      const name = encoder.encode(filename);
      const data = encoder.encode(content);
      const checksum = crc32(data);
      const header = concatArrays([uint32(0x04034b50), uint16(20), uint16(0x0800), uint16(0), uint16(stamp.time), uint16(stamp.date), uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), name]);
      local.push(header, data);
      central.push(concatArrays([uint32(0x02014b50), uint16(20), uint16(20), uint16(0x0800), uint16(0), uint16(stamp.time), uint16(stamp.date), uint32(checksum), uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), uint16(0), uint16(0), uint16(0), uint32(0), uint32(offset), name]));
      offset += header.length + data.length;
    });
    const directory = concatArrays(central);
    const end = concatArrays([uint32(0x06054b50), uint16(0), uint16(0), uint16(entries.length), uint16(entries.length), uint32(directory.length), uint32(offset), uint16(0)]);
    return new Blob([concatArrays([...local, directory, end])], { type: "application/zip" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadPackage(items, name, points) {
    const safeName = safeIdentifier(name, "canvas_assessment");
    downloadBlob(createZipBlob(buildPackage(items, name, points)), `${safeName}_canvas_qti.zip`);
  }

  function buildTextBatchFiles(lines, name, batchSize = 250) {
    const safeName = safeIdentifier(name, "blackboard_ultra_questions");
    const files = {};
    for (let start = 0; start < lines.length; start += batchSize) {
      const batch = Math.floor(start / batchSize) + 1;
      files[`${safeName}_batch_${String(batch).padStart(2, "0")}.txt`] = `${lines.slice(start, start + batchSize).join("\r\n")}\r\n`;
    }
    files["IMPORT_ORDER.txt"] = `BLACKBOARD ULTRA TXT BATCH PACKAGE\nQuestions: ${lines.length}\nFiles: ${Object.keys(files).length}\nRecommended order: import batch files in numeric order.\nEach batch contains no more than ${batchSize} records and no blank lines.`;
    return files;
  }

  function downloadTextBatchZip(lines, name, batchSize = 250) {
    const safeName = safeIdentifier(name, "blackboard_ultra_questions");
    const files = buildTextBatchFiles(lines, name, batchSize);
    downloadBlob(createZipBlob(files), `${safeName}_blackboard_batches.zip`);
  }

  global.UltraPageCanvasQti = { buildPackage, buildPreview, buildTextBatchFiles, createZipBlob, downloadPackage, downloadTextBatchZip };
})(window);
