"use client";
import { useState, useRef } from "react";
import styles from "./page.module.css";

const EXAMPLES = {
  ata: `MODELO: ATA DE REUNIÃO
- Cabeçalho com nome da instituição centralizado em maiúsculas e negrito
- Título "ATA DE REUNIÃO Nº {numero}" centralizado
- Local, data e horário de início
- Lista de presentes com nome e cargo
- Seção "PAUTA" com os tópicos numerados
- Seção "DELIBERAÇÕES" com o resumo de cada ponto discutido
- Encerramento com horário de término
- Linha para assinatura do secretário e do presidente`,

  oficio: `MODELO: OFÍCIO FORMAL
- Número e data no canto superior direito (Ex: Ofício nº 001/2025 — Pindoretama, {data})
- Destinatário com nome, cargo e instituição
- Vocativo formal: "Senhor(a) {cargo},"
- Corpo do texto em parágrafos justificados, linguagem formal e respeitosa
- Expressão de atenciosidade no encerramento
- Nome completo, cargo e linha para assinatura do remetente`,

  relatorio: `MODELO: RELATÓRIO TÉCNICO
- Cabeçalho com nome da instituição
- Título centralizado em negrito
- Data de elaboração
- Sumário executivo (1 parágrafo)
- Seções numeradas: 1. Introdução / 2. Metodologia / 3. Resultados / 4. Conclusão
- Tabelas e dados formatados quando necessário
- Referências ao final`,

  contrato: `MODELO: CONTRATO SIMPLES
- Identificação das partes (Contratante e Contratado) com dados completos
- Cláusula 1ª – Do Objeto: descrição do serviço/produto
- Cláusula 2ª – Do Valor e Pagamento
- Cláusula 3ª – Do Prazo
- Cláusula 4ª – Das Obrigações das Partes
- Cláusula 5ª – Das Penalidades
- Local, data e espaço para assinaturas com testemunhas`,
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [modelText, setModelText] = useState("");
  const [contentText, setContentText] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
  const [modelFileName, setModelFileName] = useState("");
  const [contentFileName, setContentFileName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const modelFileRef = useRef();
  const contentFileRef = useRef();

  function readFile(file, setter, nameSetter) {
    nameSetter(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setter((prev) => prev + "\n\n[Arquivo: " + file.name + "]\n" + e.target.result);
    reader.readAsText(file);
  }

  async function formatDocument() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelContent: modelText, contentText, extraInstructions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      setStep(3);
    } catch (e) {
      setError(e.message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  function downloadTxt() {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "documento.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadDoc() {
    const body = result
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/---/g, "<hr/>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8">
<style>
  @page WordSection1 { size: 21cm 29.7cm; margin: 2.5cm; }
  div.WordSection1 { page: WordSection1; }
  body { font-family: Calibri, sans-serif; font-size: 12pt; line-height: 1.6; color: #111; }
  h1 { font-size: 16pt; text-align: center; font-weight: bold; margin: 16pt 0 8pt; }
  h2 { font-size: 13pt; font-weight: bold; margin: 12pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt; }
  p { margin: 6pt 0; text-align: justify; }
  hr { border: none; border-top: 1px solid #999; margin: 12pt 0; }
</style>
</head>
<body><div class="WordSection1"><p>${body}</p></div></body></html>`;

    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "documento.doc"; a.click();
    URL.revokeObjectURL(url);
  }

  function printPdf() {
    const body = result
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/_(.*?)_/g, "<em>$1</em>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/---/g, "<hr/>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");

    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  @page { margin: 2.5cm; }
  body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.7; color: #111; }
  h1 { font-size: 16pt; text-align: center; font-weight: bold; margin: 14pt 0 8pt; }
  h2 { font-size: 13pt; font-weight: bold; margin: 12pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 8pt 0 4pt; }
  p { margin: 6pt 0; text-align: justify; }
  hr { border: none; border-top: 0.5px solid #999; margin: 14pt 0; }
  strong { font-weight: bold; } em { font-style: italic; }
</style></head>
<body><p>${body}</p></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 600);
  }

  function reset() {
    setStep(1); setModelText(""); setContentText(""); setExtraInstructions("");
    setModelFileName(""); setContentFileName(""); setResult(""); setError("");
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Formatador de Documentos</h1>
          <p className={styles.subtitle}>Envie um modelo + conteúdo e receba o documento formatado pronto para baixar</p>
        </div>

        {/* Steps */}
        <div className={styles.steps}>
          {["Modelo", "Conteúdo", "Resultado"].map((label, i) => (
            <div key={i} className={`${styles.stepItem} ${step === i + 1 ? styles.stepActive : step > i + 1 ? styles.stepDone : ""}`}>
              <span className={styles.stepNum}>{step > i + 1 ? "✓" : i + 1}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Modelo */}
        {step === 1 && (
          <div className={styles.page}>
            <div className={styles.grid2}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Modelo em texto</div>
                <p className={styles.tip}>Descreva a estrutura, seções e formatação do documento. Use atalhos abaixo:</p>
                <div className={styles.chips}>
                  {Object.entries({ ata: "Ata de reunião", oficio: "Ofício", relatorio: "Relatório", contrato: "Contrato" }).map(([k, v]) => (
                    <button key={k} className={styles.chip} onClick={() => setModelText(EXAMPLES[k])}>{v}</button>
                  ))}
                </div>
                <textarea
                  className={styles.textarea}
                  rows={10}
                  value={modelText}
                  onChange={(e) => setModelText(e.target.value)}
                  placeholder={"Descreva o modelo aqui...\n\nExemplo:\nCabeçalho com nome da instituição\nTítulo centralizado em negrito\nData e local\nCorpo justificado\nAssinatura no rodapé"}
                />
              </div>

              <div className={styles.panel}>
                <div className={styles.panelLabel}>Ou envie arquivo modelo</div>
                <p className={styles.tip}>Aceita .txt, .docx (como texto), .pdf (texto extraído)</p>
                <div
                  className={`${styles.uploadZone} ${modelFileName ? styles.uploaded : ""}`}
                  onClick={() => modelFileRef.current.click()}
                >
                  <input ref={modelFileRef} type="file" accept=".txt,.docx,.pdf" style={{ display: "none" }}
                    onChange={(e) => e.target.files[0] && readFile(e.target.files[0], setModelText, setModelFileName)} />
                  <div className={styles.uploadIcon}>{modelFileName ? "✅" : "📄"}</div>
                  {modelFileName
                    ? <><div className={styles.uploadName}>{modelFileName}</div><div className={styles.uploadBadge}>arquivo carregado</div></>
                    : <><div className={styles.uploadText}><strong>Clique para enviar</strong></div><div className={styles.uploadSub}>.txt · .docx · .pdf</div></>}
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <button className={styles.btnPrimary} onClick={() => setStep(2)}>
                Próximo: Conteúdo →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Conteúdo */}
        {step === 2 && (
          <div className={styles.page}>
            <div className={styles.grid2}>
              <div className={styles.panel}>
                <div className={styles.panelLabel}>Conteúdo para formatar</div>
                <p className={styles.tip}>Cole o texto bruto, rascunho ou dados que serão organizados conforme o modelo</p>
                <textarea
                  className={styles.textarea}
                  rows={12}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder={"Cole aqui o conteúdo a formatar...\n\nPode ser rascunho, anotações, dados brutos, etc.\nA IA vai organizar tudo seguindo o modelo."}
                />
              </div>

              <div>
                <div className={styles.panel}>
                  <div className={styles.panelLabel}>Ou envie arquivo de conteúdo</div>
                  <div
                    className={`${styles.uploadZone} ${contentFileName ? styles.uploaded : ""}`}
                    onClick={() => contentFileRef.current.click()}
                  >
                    <input ref={contentFileRef} type="file" accept=".txt,.docx,.pdf" style={{ display: "none" }}
                      onChange={(e) => e.target.files[0] && readFile(e.target.files[0], setContentText, setContentFileName)} />
                    <div className={styles.uploadIcon}>{contentFileName ? "✅" : "📝"}</div>
                    {contentFileName
                      ? <><div className={styles.uploadName}>{contentFileName}</div><div className={styles.uploadBadge}>arquivo carregado</div></>
                      : <><div className={styles.uploadText}><strong>Clique para enviar</strong></div><div className={styles.uploadSub}>.txt · .docx · .pdf</div></>}
                  </div>
                </div>

                <div className={styles.panel} style={{ marginTop: "1rem" }}>
                  <div className={styles.panelLabel}>Instruções adicionais</div>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={extraInstructions}
                    onChange={(e) => setExtraInstructions(e.target.value)}
                    placeholder={"Ex: Use tom formal. Numere as seções. Margem de 3cm. Fonte Times New Roman..."}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            <div className={styles.actionRow}>
              <button className={styles.btnSec} onClick={() => setStep(1)}>← Voltar</button>
              <button className={styles.btnPrimary} onClick={formatDocument} disabled={loading}>
                {loading ? "Formatando…" : "Formatar documento ↗"}
              </button>
              {loading && (
                <div className={styles.statusBar}>
                  <span className={styles.loader} /> Processando com IA...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Resultado */}
        {step === 3 && (
          <div className={styles.page}>
            <div className={styles.panel}>
              <div className={styles.panelLabel}>Documento formatado</div>
              <div className={styles.resultBox}>
                <pre className={styles.resultText}>{result}</pre>
              </div>

              <div className={styles.downloadRow}>
                <button className={styles.dlBtn} onClick={downloadTxt}>
                  <span className={`${styles.ext} ${styles.extTxt}`}>TXT</span>
                  Baixar como texto
                </button>
                <button className={styles.dlBtn} onClick={downloadDoc}>
                  <span className={`${styles.ext} ${styles.extDoc}`}>DOC</span>
                  Baixar como Word
                </button>
                <button className={styles.dlBtn} onClick={printPdf}>
                  <span className={`${styles.ext} ${styles.extPdf}`}>PDF</span>
                  Salvar como PDF
                </button>
              </div>

              <p className={styles.tip} style={{ marginTop: "10px" }}>
                O botão PDF abre a janela de impressão do navegador — escolha "Salvar como PDF" no destino.
              </p>
            </div>

            <div className={styles.actionRow} style={{ marginTop: "1rem" }}>
              <button className={styles.btnSec} onClick={() => setStep(2)}>← Ajustar</button>
              <button className={styles.btnSec} onClick={reset}>Novo documento</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
