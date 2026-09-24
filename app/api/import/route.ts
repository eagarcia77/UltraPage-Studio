import * as mammoth from "mammoth";

export const runtime = "nodejs";

const MAX_DOCX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Select a Word document." }, { status: 400 });
    if (!/\.docx$/i.test(file.name)) return Response.json({ error: "Only .docx files are supported." }, { status: 415 });
    if (file.size > MAX_DOCX_BYTES) return Response.json({ error: "The Word document exceeds the 10 MB import limit." }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Quote'] => blockquote:fresh",
        ],
        includeDefaultStyleMap: true,
      }
    );

    return Response.json({
      html: result.value,
      warnings: result.messages.map((message) => message.message).filter(Boolean).slice(0, 20),
    });
  } catch {
    return Response.json({ error: "The Word document could not be converted." }, { status: 500 });
  }
}
