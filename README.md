# Formatador de Documentos com IA

Ferramenta que formata documentos usando Claude AI como backend seguro.

## Deploy no Vercel

1. Suba este projeto para um repositório GitHub
2. Importe no [vercel.com](https://vercel.com)
3. Adicione a variável de ambiente:
   - `ANTHROPIC_API_KEY` = sua chave da API Anthropic
4. Clique em Deploy

## Desenvolvimento local

```bash
npm install
cp .env.local.example .env.local
# Edite .env.local com sua chave
npm run dev
```

Acesse: http://localhost:3000
