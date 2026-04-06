"use client";
import { useState } from "react";
import s from "./page.module.css";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const TURMAS = ["A","B","C","D","E","F"];
const TURNOS = ["Manhã","Tarde","Noite"];

function novaMateria() {
  return { nome: "", subtitulo: "", topicos: [""], paginas: "" };
}

function novoDia() {
  return { data: "", diaSemana: "Segunda-feira", materias: [novaMateria()] };
}

export default function Page() {
  const [form, setForm] = useState({
    serie: "3º ANO",
    turma: "A",
    turno: "Manhã",
    mes: "Março",
    ano: new Date().getFullYear().toString(),
    dias: [novoDia()],
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // helpers de update
  const upForm = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const upDia = (di, k, v) => setForm(f => {
    const dias = [...f.dias];
    dias[di] = { ...dias[di], [k]: v };
    return { ...f, dias };
  });

  const upMateria = (di, mi, k, v) => setForm(f => {
    const dias = [...f.dias];
    const materias = [...dias[di].materias];
    materias[mi] = { ...materias[mi], [k]: v };
    dias[di] = { ...dias[di], materias };
    return { ...f, dias };
  });

  const upTopico = (di, mi, ti, v) => setForm(f => {
    const dias = [...f.dias];
    const materias = [...dias[di].materias];
    const topicos = [...materias[mi].topicos];
    topicos[ti] = v;
    materias[mi] = { ...materias[mi], topicos };
    dias[di] = { ...dias[di], materias };
    return { ...f, dias };
  });

  const addTopico = (di, mi) => setForm(f => {
    const dias = [...f.dias];
    dias[di].materias[mi].topicos.push("");
    return { ...f, dias };
  });

  const removeTopico = (di, mi, ti) => setForm(f => {
    const dias = [...f.dias];
    dias[di].materias[mi].topicos = dias[di].materias[mi].topicos.filter((_,i)=>i!==ti);
    return { ...f, dias };
  });

  const addMateria = (di) => setForm(f => {
    const dias = [...f.dias];
    dias[di].materias.push(novaMateria());
    return { ...f, dias };
  });

  const removeMateria = (di, mi) => setForm(f => {
    const dias = [...f.dias];
    dias[di].materias = dias[di].materias.filter((_,i)=>i!==mi);
    return { ...f, dias };
  });

  const addDia = () => setForm(f => ({ ...f, dias: [...f.dias, novoDia()] }));

  const removeDia = (di) => setForm(f => ({ ...f, dias: f.dias.filter((_,i)=>i!==di) }));

  // Monta o cabecalho formatado: "● 02/03 (SEGUNDA-FEIRA):"
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
            nome: m.nome.toUpperCase(),
            subtitulo: m.subtitulo,
            topicos: m.topicos.filter(t => t.trim()),
            paginas: m.paginas,
          }))
        }))
      };

      const res = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao gerar");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Roteiro_${form.serie}_Turma${form.turma}_${form.mes}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      setSucesso(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={s.main}>
      <div className={s.container}>

        <div className={s.header}>
          <div className={s.logo}>📋</div>
          <div>
            <h1 className={s.title}>Gerador de Roteiro de Estudo</h1>
            <p className={s.subtitle}>Colégio Cristo Rei — preencha os dados e baixe o DOCX formatado</p>
          </div>
        </div>

        {/* ── CABEÇALHO DO DOCUMENTO ── */}
        <section className={s.card}>
          <h2 className={s.sectionTitle}>Informações do cabeçalho</h2>
          <div className={s.grid4}>
            <div className={s.field}>
              <label className={s.label}>Série / Ano</label>
              <input value={form.serie} onChange={e=>upForm("serie",e.target.value)} placeholder="3º ANO"/>
            </div>
            <div className={s.field}>
              <label className={s.label}>Turma</label>
              <select value={form.turma} onChange={e=>upForm("turma",e.target.value)}>
                {TURMAS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Turno</label>
              <select value={form.turno} onChange={e=>upForm("turno",e.target.value)}>
                {TURNOS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Mês</label>
              <select value={form.mes} onChange={e=>upForm("mes",e.target.value)}>
                {MESES.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>Ano</label>
              <input value={form.ano} onChange={e=>upForm("ano",e.target.value)} placeholder="2026" maxLength={4}/>
            </div>
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
              <div className={s.field}>
                <label className={s.label}>Data (ex: 02/03)</label>
                <input value={dia.data} onChange={e=>upDia(di,"data",e.target.value)} placeholder="02/03"/>
              </div>
              <div className={s.field}>
                <label className={s.label}>Dia da semana</label>
                <select value={dia.diaSemana} onChange={e=>upDia(di,"diaSemana",e.target.value)}>
                  {DIAS_SEMANA.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Preview</label>
                <input readOnly value={`● ${dia.data} (${dia.diaSemana.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")})`} className={s.preview}/>
              </div>
            </div>

            {/* Matérias */}
            {dia.materias.map((mat, mi) => (
              <div key={mi} className={s.materia}>
                <div className={s.materiaHeader}>
                  <span className={s.materiaNum}>Matéria {mi + 1}</span>
                  {dia.materias.length > 1 && (
                    <button className={s.btnDangerSm} onClick={()=>removeMateria(di,mi)}>✕</button>
                  )}
                </div>

                <div className={s.grid2} style={{marginBottom:"8px"}}>
                  <div className={s.field}>
                    <label className={s.label}>Nome da matéria</label>
                    <input value={mat.nome} onChange={e=>upMateria(di,mi,"nome",e.target.value)} placeholder="Português"/>
                  </div>
                  <div className={s.field}>
                    <label className={s.label}>Subtítulo (capítulo/módulo)</label>
                    <input value={mat.subtitulo} onChange={e=>upMateria(di,mi,"subtitulo",e.target.value)} placeholder="Módulo 1 e Caderno Mais 1"/>
                  </div>
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
                  <input value={mat.paginas} onChange={e=>upMateria(di,mi,"paginas",e.target.value)} placeholder="08 à 39 do Módulo 1 e 06 à 14 do Caderno Mais 1."/>
                </div>
              </div>
            ))}

            <button className={s.btnAddMateria} onClick={()=>addMateria(di)}>+ Adicionar matéria</button>
          </section>
        ))}

        <button className={s.btnAddDia} onClick={addDia}>+ Adicionar dia</button>

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
