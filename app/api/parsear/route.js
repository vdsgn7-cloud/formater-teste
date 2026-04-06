export async function POST(req) {
  try {
    const { texto } = await req.json();
    if (!texto || !texto.trim()) {
      return Response.json({ error: "Texto vazio" }, { status: 400 });
    }

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
- mes deve ser por extenso com inicial maiúscula: Janeiro, Fevereiro, etc.
- avisoTexto costuma ser: "Estudar também pelas revisões do caderno."
- Se não encontrar observação, use array com o texto padrão sobre Formação Humana`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Parse este roteiro:\n\n${texto}` }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    // Strip markdown fences if present
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return Response.json({ ok: true, data: parsed });
  } catch (err) {
    console.error("parsear error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
