import JSZip from "jszip";

// Extract plain text from DOCX XML
function extractTextFromDocx(buffer) {
  return JSZip.loadAsync(buffer).then(async (zip) => {
    const docXml = await zip.file("word/document.xml").async("string");
    
    // Split by paragraphs
    const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
    const paras = docXml.match(paraRegex) || [];
    
    const lines = paras.map(para => {
      // Get all text runs
      const runs = para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
      return runs.map(r => r.replace(/<[^>]+>/g, "")).join("").trim();
    }).filter(l => l.length > 0);
    
    return lines.join("\n");
  });
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return Response.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const texto = await extractTextFromDocx(Buffer.from(buffer));

    if (!texto.trim()) {
      return Response.json({ error: "Não foi possível extrair texto do arquivo" }, { status: 400 });
    }

    // Now send to AI parser
    const systemPrompt = `Você é um parser de roteiros de estudo escolares brasileiros.
Dado um texto de roteiro, extraia os dados estruturados e retorne SOMENTE JSON válido, sem nenhum texto antes ou depois.

Estrutura esperada:
{
  "serie": "string (ex: 3º ANO)",
  "turma": "string letra (ex: A)",
  "turno": "string (Manhã, Tarde ou Noite)",
  "mes": "string (ex: Março)",
  "ano": "string (ex: 2026)",
  "avisoTexto": "string (texto do aviso, geralmente sobre estudar pelas revisões do caderno)",
  "dias": [
    {
      "data": "string (ex: 02/03)",
      "diaSemana": "string (ex: Segunda-feira)",
      "materias": [
        {
          "nome": "string (nome da matéria em maiúsculas, ex: PORTUGUÊS)",
          "subtitulo": "string (capítulo/módulo, pode ser vazio)",
          "topicos": ["string", ...],
          "paginas": "string (tudo depois de 'Páginas:', pode ser vazio)"
        }
      ]
    }
  ],
  "observacaoItens": ["string", ...]
}

Regras:
- Os dias começam com ● ou •
- Matérias começam com - ou –
- Tópicos começam com * ou •
- Páginas vêm depois de "Páginas:"
- A observação é a caixa no final (geralmente sobre Formação Humana, Artes e Educação Física)
- Se não encontrar algum campo, use string vazia ou array vazio
- diaSemana deve ser: Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira ou Sábado
- mes deve ser por extenso com inicial maiúscula
- avisoTexto costuma ser: "Estudar também pelas revisões do caderno."`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Parse este roteiro:\n\n${texto}` }],
      }),
    });

    if (!aiRes.ok) throw new Error(`AI API error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const raw = aiData.content?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json({ ok: true, data: parsed, textoExtraido: texto });
  } catch (err) {
    console.error("parsear-docx error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
