"use client";
import { useState, useRef } from "react";
import s from "./page.module.css";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const TURMAS = ["A","B","C","D","E","F"];
const TURNOS = ["Manhã","Tarde","Noite"];

function novaMateria() { return { nome: "", subtitulo: "", topicos: [""], paginas: "" }; }
function novoDia() { return { data: "", diaSemana: "Segunda-feira", materias: [novaMateria()] }; }

const FORM_INICIAL = {
  serie: "3º ANO", turma: "A", turno: "Manhã", mes: "Março",
  ano: new Date().getFullYear().toString(),
  avisoTexto: "Estudar também pelas revisões do caderno.",
  dias: [novoDia()],
  observacaoItens: ["As notas de Formação Humana, Artes e Educação Física serão atribuídas através dos trabalhos realizados em sala de aula."],
};

export default function Page() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Import modal state
  const [modalAberto, setModalAberto] = useState(false);
  const [modoImport, setModoImport] = useState("texto"); // "texto" | "docx"
  const [textoImport, setTextoImport] = useState("");
  const [parseLoading, setParseLoading] = useState(false);
  const [parseErro, setParseErro] = useState("");
  const fileRef = useRef(null);

  // ── form helpers ──
  const upForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const upDia = (di, k, v) => setForm(f => { const dias=[...f.dias]; dias[di]={...dias[di],[k]:v}; return {...f,dias}; });
  const upMateria = (di, mi, k, v) => setForm(f => {
    const dias=[...f.dias]; const mat=[...dias[di].materias];
    mat[mi]={...mat[mi],[k]:v}; dias[di]={...dias[di],materias:mat}; return {...f,dias};
  });
  const upTopico = (di, mi, ti, v) => setForm(f => {
    const dias=[...f.dias]; const mat=[...dias[di].materias];
    const top=[...mat[mi].topicos]; top[ti]=v;
    mat[mi]={...mat[mi],topicos:top}; dias[di]={...dias[di],materias:mat}; return {...f,dias};
  });
  const addTopico = (di, mi) => setForm(f => { const dias=[...f.dias]; dias[di].materias[mi].topicos.push(""); return {...f,dias}; });
  const removeTopico = (di, mi, ti) => setForm(f => {
    const dias=[...f.dias]; dias[di].materias[mi].topicos=dias[di].materias[mi].topicos.filter((_,i)=>i!==ti); return {...f,dias};
  });
  const addMateria = (di) => setForm(f => { const dias=[...f.dias]; dias[di].materias.push(novaMateria()); return {...f,dias}; });
  const removeMateria = (di, mi) => setForm(f => { const dias=[...f.dias]; dias[di].materias=dias[di].materias.filter((_,i)=>i!==mi); return {...f,dias}; });
  const addDia = () => setForm(f => ({ ...f, dias: [...f.dias, novoDia()] }));
  const removeDia = (di) => setForm(f => ({ ...f, dias: f.dias.filter((_,i)=>i!==di) }));
  const upObsItem = (i, v) => setForm(f => { const o=[...f.observacaoItens]; o[i]=v; return {...f,observacaoItens:o}; });
  const addObsItem = () => setForm(f => ({ ...f, observacaoItens: [...f.observacaoItens, ""] }));
  const removeObsItem = (i) => setForm(f => ({ ...f, observacaoItens: f.observacaoItens.filter((_,j)=>j!==i) }));

  // ── import logic ──
  async function importarTexto() {
    if (!textoImport.trim()) { setParseErro("Cole o texto do roteiro."); return; }
    setParseLoading(true); setParseErro("");
    try {
      const res = await fetch("/api/parsear", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: textoImport }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Erro ao processar");
      aplicarDados(json.data);
    } catch (e) { setParseErro(e.message); }
    finally { setParseLoading(false); }
  }

  async function importarDocx(file) {
    if (!file) return;
    setParseLoading(true); setParseErro("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parsear-docx", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Erro ao processar");
      aplicarDados(json.data);
    } catch (e) { setParseErro(e.message); }
    finally { setParseLoading(false); }
  }

  function aplicarDados(data) {
    // Normalize dias: ensure topicos is always array of strings
    const dias = (data.dias || []).map(d => ({
      data: d.data || "",
      diaSemana: d.diaSemana || "Segunda-feira",
      materias: (d.materias || []).map(m => ({
        nome: (m.nome || "").toUpperCase(),
        subtitulo: m.subtitulo || "",
        topicos: (m.topicos || []).length > 0 ? m.topicos : [""],
        paginas: m.paginas || "",
      })),
    }));
    setForm({
      serie: data.serie || FORM_INICIAL.serie,
      turma: data.turma || FORM_INICIAL.turma,
      turno: data.turno || FORM_INICIAL.turno,
      mes: data.mes || FORM_INICIAL.mes,
      ano: data.ano || FORM_INICIAL.ano,
      avisoTexto: data.avisoTexto || FORM_INICIAL.avisoTexto,
      dias: dias.length > 0 ? dias : [novoDia()],
      observacaoItens: (data.observacaoItens || []).length > 0 ? data.observacaoItens : FORM_INICIAL.observacaoItens,
    });
    setModalAberto(false);
    setTextoImport("");
  }

  // ── generate DOCX ──
  function cabecalhoDia(dia) {
    const ds = dia.diaSemana.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return `● ${dia.data} (${ds}):`;
  }

  async function gerar() {
    setErro(""); setSucesso(false); setLoading(true);
    try {
      const payload = {
        ...form,
        dias: form.dias.map(d => ({
          cabecalho: cabecalhoDia(d),
          materias: d.materias.map(m => ({
            nome: m.nome.toUpperCase(), subtitulo: m.subtitulo,
            topicos: m.topicos.filter(t => t.trim()), paginas: m.paginas,
          }))
        }))
      };
      const res = await fetch("/api/gerar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao gerar"); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Roteiro_${form.serie}_Turma${form.turma}_${form.mes}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setSucesso(true);
    } catch (e) { setErro(e.message); }
    finally { setLoading(false); }
  }

  return (
    <main className={s.main}>
      <div className={s.container}>

        {/* ── HEADER ── */}
        <div className={s.header}>
          <div className={s.logo}>📋</div>
          <div style={{flex:1}}>
            <h1 className={s.title}>Gerador de Roteiro de Estudo</h1>
            <p className={s.subtitle}>Colégio Cristo Rei — preencha os dados e baixe o DOCX formatado</p>
          </div>
          <button className={s.btnImportar} onClick={()=>{ setModalAberto(true); setParseErro(""); }}>
            ✨ Importar roteiro
          </button>
        </div>

        {/* ── IMPORT MODAL ── */}
        {modalAberto && (
          <div className={s.modalOverlay} onClick={()=>setModalAberto(false)}>
            <div className={s.modal} onClick={e=>e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h2 className={s.modalTitle}>✨ Importar roteiro automaticamente</h2>
                <button className={s.modalClose} onClick={()=>setModalAberto(false)}>✕</button>
              </div>
              <p className={s.modalDesc}>
                Cole o texto do roteiro ou envie um arquivo .docx — a IA identifica os dias, matérias, tópicos e páginas automaticamente.
              </p>

              <div className={s.tabRow}>
                <button className={modoImport==="texto" ? s.tabActive : s.tab} onClick={()=>setModoImport("texto")}>
                  📝 Colar texto
                </button>
                <button className={modoImport==="docx" ? s.tabActive : s.tab} onClick={()=>setModoImport("docx")}>
                  📄 Enviar DOCX
                </button>
              </div>

              {modoImport === "texto" && (
                <div>
                  <textarea
                    className={s.importTextarea}
                    placeholder={"Cole aqui o texto do roteiro...\n\n● 02/03 (SEGUNDA-FEIRA):\n- PORTUGUÊS\nMódulo 1\n* Poemas;\nPáginas: 08 à 39"}
                    value={textoImport}
                    onChange={e=>setTextoImport(e.target.value)}
                    rows={12}
                  />
                  <button
                    className={s.btnGerar}
                    onClick={importarTexto}
                    disabled={parseLoading}
                    style={{marginTop:"12px"}}
                  >
                    {parseLoading ? "Processando…" : "✨ Processar e preencher formulário"}
                  </button>
                </div>
              )}

              {modoImport === "docx" && (
                <div>
                  <div
                    className={s.dropZone}
                    onClick={()=>fileRef.current?.click()}
                    onDragOver={e=>e.preventDefault()}
                    onDrop={e=>{ e.preventDefault(); const f=e.dataTransfer.files[0]; if(f) importarDocx(f); }}
                  >
                    {parseLoading ? (
                      <span>⏳ Processando…</span>
                    ) : (
                      <>
                        <span className={s.dropIcon}>📄</span>
                        <span>Clique para selecionar ou arraste o arquivo .docx aqui</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".docx"
                    style={{display:"none"}}
                    onChange={e=>{ const f=e.target.files?.[0]; if(f) importarDocx(f); }}
                  />
                </div>
              )}

              {parseErro && <div className={s.erro} style={{marginTop:"10px"}}>⚠ {parseErro}</div>}
            </div>
          </div>
        )}

        {/* ── CABEÇALHO ── */}
        <section className={s.card}>
          <h2 className={s.sectionTitle}>Informações do cabeçalho</h2>
          <div className={s.grid4}>
            <div className={s.field}><label className={s.label}>Série / Ano</label>
              <input value={form.serie} onChange={e=>upForm("serie",e.target.value)} placeholder="3º ANO"/></div>
            <div className={s.field}><label className={s.label}>Turma</label>
              <select value={form.turma} onChange={e=>upForm("turma",e.target.value)}>
                {TURMAS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className={s.field}><label className={s.label}>Turno</label>
              <select value={form.turno} onChange={e=>upForm("turno",e.target.value)}>
                {TURNOS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className={s.field}><label className={s.label}>Mês</label>
              <select value={form.mes} onChange={e=>upForm("mes",e.target.value)}>
                {MESES.map(m=><option key={m}>{m}</option>)}</select></div>
            <div className={s.field}><label className={s.label}>Ano</label>
              <input value={form.ano} onChange={e=>upForm("ano",e.target.value)} placeholder="2026" maxLength={4}/></div>
          </div>
        </section>

        {/* ── AVISO ── */}
        <section className={s.card}>
          <h2 className={s.sectionTitle}>Aviso (itálico, alinhado à direita)</h2>
          <div className={s.field}>
            <input value={form.avisoTexto} onChange={e=>upForm("avisoTexto",e.target.value)}
              placeholder="Estudar também pelas revisões do caderno."/>
          </div>
        </section>

        {/* ── DIAS ── */}
        {form.dias.map((dia, di) => (
          <section key={di} className={s.card}>
            <div className={s.diaHeader}>
              <h2 className={s.sectionTitle}>Dia {di + 1}</h2>
              {form.dias.length > 1 && (
                <button className={s.btnDanger} onClick={()=>removeDia(di)}>✕ Remover dia</button>
              )}
            </div>
            <div className={s.grid3} style={{marginBottom:"1rem"}}>
              <div className={s.field}><label className={s.label}>Data (ex: 02/03)</label>
                <input value={dia.data} onChange={e=>upDia(di,"data",e.target.value)} placeholder="02/03"/></div>
              <div className={s.field}><label className={s.label}>Dia da semana</label>
                <select value={dia.diaSemana} onChange={e=>upDia(di,"diaSemana",e.target.value)}>
                  {DIAS_SEMANA.map(d=><option key={d}>{d}</option>)}</select></div>
              <div className={s.field}><label className={s.label}>Preview</label>
                <input readOnly value={`● ${dia.data} (${dia.diaSemana.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")})`} className={s.preview}/></div>
            </div>
            {dia.materias.map((mat, mi) => (
              <div key={mi} className={s.materia}>
                <div className={s.materiaHeader}>
                  <span className={s.materiaNum}>Matéria {mi + 1}</span>
                  {dia.materias.length > 1 && (
                    <button className={s.btnDangerSm} onClick={()=>removeMateria(di,mi)}>✕</button>
                  )}
                </div>
                <div className={s.grid2} style={{marginBottom:"8px"}}>
                  <div className={s.field}><label className={s.label}>Nome da matéria</label>
                    <input value={mat.nome} onChange={e=>upMateria(di,mi,"nome",e.target.value)} placeholder="Português"/></div>
                  <div className={s.field}><label className={s.label}>Subtítulo</label>
                    <input value={mat.subtitulo} onChange={e=>upMateria(di,mi,"subtitulo",e.target.value)} placeholder="Módulo 1"/></div>
                </div>
                <div className={s.field} style={{marginBottom:"8px"}}>
                  <label className={s.label}>Tópicos</label>
                  {mat.topicos.map((t, ti) => (
                    <div key={ti} className={s.topicoRow}>
                      <span className={s.topicoBullet}>*</span>
                      <input value={t} onChange={e=>upTopico(di,mi,ti,e.target.value)} placeholder={`Tópico ${ti+1}`}/>
                      {mat.topicos.length > 1 && (
                        <button className={s.btnRemove} onClick={()=>removeTopico(di,mi,ti)}>✕</button>
                      )}
                    </div>
                  ))}
                  <button className={s.btnAdd} onClick={()=>addTopico(di,mi)}>+ Tópico</button>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Páginas</label>
                  <input value={mat.paginas} onChange={e=>upMateria(di,mi,"paginas",e.target.value)} placeholder="08 à 39 do Módulo 1"/>
                </div>
              </div>
            ))}
            <button className={s.btnAddMateria} onClick={()=>addMateria(di)}>+ Adicionar matéria</button>
          </section>
        ))}

        <button className={s.btnAddDia} onClick={addDia}>+ Adicionar dia</button>

        {/* ── OBSERVAÇÃO ── */}
        <section className={s.card}>
          <h2 className={s.sectionTitle}>Observação (caixa amarela no final)</h2>
          <div style={{marginBottom:"8px"}}>
            {form.observacaoItens.map((item, i) => (
              <div key={i} className={s.topicoRow} style={{marginBottom:"8px",alignItems:"flex-start"}}>
                <span className={s.topicoBullet} style={{marginTop:"10px"}}>•</span>
                <textarea rows={2} value={item} onChange={e=>upObsItem(i,e.target.value)}
                  placeholder={`Item ${i+1}`} style={{resize:"vertical"}}/>
                {form.observacaoItens.length > 1 && (
                  <button className={s.btnRemove} onClick={()=>removeObsItem(i)} style={{marginTop:"6px"}}>✕</button>
                )}
              </div>
            ))}
          </div>
          <button className={s.btnAdd} onClick={addObsItem}>+ Adicionar item</button>
        </section>

        {/* ── AÇÕES ── */}
        <div className={s.actions}>
          {erro && <div className={s.erro}>⚠ {erro}</div>}
          {sucesso && <div className={s.sucesso}>✓ Roteiro gerado e baixado com sucesso!</div>}
          <button className={s.btnGerar} onClick={gerar} disabled={loading}>
            {loading ? "Gerando…" : "⬇ Gerar e baixar DOCX"}
          </button>
        </div>

      </div>
    </main>
  );
}
