import Anthropic from "@anthropic-ai/sdk";

export async function POST(req) {
  try {
    const { modelContent, contentText, extraInstructions } = await req.json();

    if (!modelContent && !contentText) {
      return Response.json({ error: "Forneça pelo menos o modelo ou o conteúdo." }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Você é um especialista em formatação de documentos profissionais.

MODELO DE DOCUMENTO:
${modelContent || "(Não fornecido — use boas práticas de formatação)"}

CONTEÚDO A FORMATAR:
${contentText || "(Não fornecido)"}

${extraInstructions ? `INSTRUÇÕES ADICIONAIS:\n${extraInstructions}\n` : ""}

Tarefa: Formate o conteúdo seguindo exatamente a estrutura e estilo do modelo fornecido.
- Preserve TODAS as informações do conteúdo original, sem omitir nada
- Aplique a estrutura, hierarquia e formatação do modelo
- Use marcadores de formatação: **negrito**, _itálico_, # Título, ## Subtítulo, --- para separadores horizontais
- Indique campos opcionais a preencher com [CAMPO]
- Produza o documento completo, formal e pronto para uso
- No final, adicione "---" e uma linha: "Formatações aplicadas: ..." resumindo brevemente o que foi feito`;

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const result = message.content[0].text;
    return Response.json({ result });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message || "Erro interno." }, { status: 500 });
  }
}
