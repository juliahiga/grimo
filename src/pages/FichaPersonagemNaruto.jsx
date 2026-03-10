import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaPersonagemNaruto.css";
import ImageCropModal from "../components/ImageCropModal";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Helpers ───────────────────────────────────────────────────────────────────
const rolar2d8 = () => ({
  d1: Math.floor(Math.random() * 8) + 1,
  d2: Math.floor(Math.random() * 8) + 1,
});

const makeTimestamp = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};

// ── Sub-componente: campo editável inline ─────────────────────────────────────
const CampoEditavel = ({ valor, onSalvar, placeholder }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(valor);
  const inputRef = useRef(null);

  useEffect(() => { setTmp(valor); }, [valor]);
  useEffect(() => { if (editando) inputRef.current?.focus(); }, [editando]);

  const salvar = () => { onSalvar(tmp); setEditando(false); };

  if (editando) return (
    <input
      ref={inputRef}
      className="fn-campo-input"
      value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={salvar}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") setEditando(false); }}
    />
  );
  return (
    <span className="fn-campo-valor fn-campo-editavel" onClick={() => setEditando(true)} title="Clique para editar">
      {valor || <span className="fn-campo-vazio">{placeholder}</span>}
      <i className="fas fa-pen fn-campo-edit-icon" />
    </span>
  );
};

// ── Sub-componente: número clicável/editável inline ──────────────────────────
const CampoNumerico = ({ valor, onChange, min = 0, className = "" }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(String(valor));
  const inputRef = useRef(null);

  useEffect(() => { if (!editando) setTmp(String(valor)); }, [valor, editando]);
  useEffect(() => { if (editando && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editando]);

  const salvar = () => {
    const n = parseInt(tmp, 10);
    onChange(isNaN(n) ? min : Math.max(min, n));
    setEditando(false);
  };

  if (editando) return (
    <input
      ref={inputRef}
      className={`fn-num-input ${className}`}
      type="number"
      value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={salvar}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") { setEditando(false); } }}
    />
  );
  return (
    <span className={`fn-num-val ${className}`} onClick={() => setEditando(true)} title="Clique para editar">
      {valor}
    </span>
  );
};

// ── Sub-componente: barra de energia (idêntico ao VidaControl do TLOU) ─────
const BarraEnergia = ({ label, cor, valor, max, onChange, onChangeMax }) => {
  const [eA, setEA] = useState(false); const [eM, setEM] = useState(false);
  const [iA, setIA] = useState(String(valor)); const [iM, setIM] = useState(String(max));
  const rA = useRef(null); const rM = useRef(null);
  useEffect(() => { if (eA && rA.current) rA.current.select(); }, [eA]);
  useEffect(() => { if (eM && rM.current) rM.current.select(); }, [eM]);
  const cA = () => { const n = parseInt(iA, 10); if (!isNaN(n)) onChange(n); setEA(false); };
  const cM = () => { const n = parseInt(iM, 10); if (!isNaN(n)) onChangeMax(n); setEM(false); };
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;
  const slot = { display: "inline-block", width: "42px", textAlign: "center", cursor: "text" };
  const inp  = { width: "42px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", fontWeight: "700", textAlign: "center", fontFamily: '"Be Vietnam Pro",sans-serif', letterSpacing: "2px" };
  return (
    <div className="fn-energia-bloco">
      <div className="fn-energia-titulo">{label}</div>
      <div className="fn-energia-barra-wrapper">
        <div className="fn-energia-barra-fill" style={{ width: `${pct}%`, background: cor }} />
        <button className="fn-energia-btn" onClick={() => onChange(valor - 5)}>«</button>
        <button className="fn-energia-btn" onClick={() => onChange(valor - 1)}>‹</button>
        <div className="fn-energia-barra-bg">
          <div className="fn-energia-texto">
            <span style={slot}>{eA
              ? <input ref={rA} className="fn-energia-input-edit" style={inp} type="number" value={iA} onChange={e => setIA(e.target.value)} onBlur={cA} onKeyDown={e => { if (e.key === "Enter") cA(); if (e.key === "Escape") setEA(false); }} />
              : <span onClick={() => { setIA(String(valor)); setEA(true); }}>{valor}</span>}
            </span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={slot}>{eM
              ? <input ref={rM} className="fn-energia-input-edit" style={inp} type="number" value={iM} onChange={e => setIM(e.target.value)} onBlur={cM} onKeyDown={e => { if (e.key === "Enter") cM(); if (e.key === "Escape") setEM(false); }} />
              : <span onClick={() => { setIM(String(max)); setEM(true); }}>{max}</span>}
            </span>
          </div>
        </div>
        <button className="fn-energia-btn" onClick={() => onChange(valor + 1)}>›</button>
        <button className="fn-energia-btn" onClick={() => onChange(valor + 5)}>»</button>
      </div>
    </div>
  );
};

// ── Tooltip customizado ──────────────────────────────────────────────────────
const FnTooltip = ({ children, conteudo }) => {
  const [vis, setVis] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.bottom + 8 });
    }
    setVis(true);
  };
  return (
    <div
      ref={ref}
      style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 20px", background: "#060d16", cursor: "pointer" }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setVis(false)}
    >
      {children}
      {vis && conteudo && (
        <div style={{
          position: "fixed", top: pos.y, left: pos.x,
          transform: "translateX(-50%)",
          background: "#0a1628", border: "1px solid #4a90e2",
          borderRadius: "6px", padding: "6px 12px",
          fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "0.82rem",
          color: "#4a90e2", whiteSpace: "nowrap", zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.6)", pointerEvents: "none",
        }}>
          {conteudo}
          <div style={{
            position: "absolute", bottom: "100%", left: "50%",
            transform: "translateX(-50%)",
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderBottom: "5px solid #4a90e2",
          }} />
        </div>
      )}
    </div>
  );
};

// ── Sub-componente: rolagem 2d8 / 1d8 ───────────────────────────────────────
const ResultadoRolagem = ({ resultado, onFechar }) => {
  const [animando, setAnimando] = useState(false);
  const prev = useRef(null);
  useEffect(() => {
    if (resultado && resultado !== prev.current) {
      prev.current = resultado; setAnimando(true);
      const t = setTimeout(() => setAnimando(false), 500); return () => clearTimeout(t);
    }
  }, [resultado]);
  if (!resultado) return null;
  const { label, d1, d2, precisao, bonus, total, critico, falhaCritica, is1d8, isDano, ataqueTotal, danoRolls, danoBonus } = resultado;
  const soma = is1d8 ? d1 : d1 + (d2 ?? 0);
  const cls = critico ? "fn-critico-max" : falhaCritica ? "fn-critico-min" : "";
  const ataqueColor = cls === "fn-critico-max" ? "#22c55e" : cls === "fn-critico-min" ? "#ef4444" : "#4a90e2";
  const ataqueShadow = cls === "fn-critico-max" ? "0 0 24px rgba(34,197,94,0.55)" : cls === "fn-critico-min" ? "0 0 24px rgba(239,68,68,0.55)" : "none";

  if (isDano) {
    const grau = resultado.grau ?? (critico ? 4 : falhaCritica ? 0 : 1);
    const mult = grau >= 2 ? grau : 1;
    const tooltipAtaque = `2d8(${d1}+${d2}=${soma})+bônus(${precisao}) = ${ataqueTotal}`;
    const danoFmt = danoRolls ? danoRolls.join("+") : "0";
    const tooltipDano = `dano(${danoFmt})${danoBonus !== 0 ? `${danoBonus >= 0 ? "+" : ""}${danoBonus}` : ""}${mult > 1 ? ` ×${mult}` : ""} = ${total}`;
    return (
      <div className="fn-rolagem-overlay" onClick={onFechar}>
        <div className={`fn-rolagem-painel ${animando ? "fn-rolagem-animando" : ""}`} onClick={e => e.stopPropagation()}>
          <button className="fn-rolagem-fechar" onClick={onFechar}>×</button>
          <div className={`fn-rolagem-icone ${cls}`}>
            <i className="fas fa-dice-d20 fn-rolagem-dado-svg" style={{ color: ataqueColor }} />
          </div>
          <div className="fn-rolagem-nome">{label}</div>
          <div style={{
            display: "flex", alignItems: "stretch", gap: 0,
            margin: "10px 0 6px", border: `1px solid ${cls ? ataqueColor : "#1a3050"}`,
            borderRadius: 8, overflow: "visible",
            boxShadow: cls ? ataqueShadow : "none",
          }}>
            <FnTooltip conteudo={tooltipAtaque}>
              <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "2.4rem", fontWeight: 900, color: ataqueColor, lineHeight: 1, textShadow: cls ? ataqueShadow : "none" }}>
                {ataqueTotal}
              </span>
              <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.6rem", color: "#4a6080", letterSpacing: "2px", textTransform: "uppercase", marginTop: 6 }}>
                ATAQUE
              </span>
            </FnTooltip>
            <div style={{ width: 1, background: cls ? ataqueColor : "#1a3050", flexShrink: 0 }} />
            <FnTooltip conteudo={tooltipDano}>
              <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "2.4rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                {total}
              </span>
              <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.6rem", color: "#4a6080", letterSpacing: "2px", textTransform: "uppercase", marginTop: 6 }}>
                DANO
              </span>
            </FnTooltip>
          </div>
        </div>
      </div>
    );
  }

  const formula = is1d8
    ? `1d8(${d1})${bonus !== 0 ? `+bônus(${bonus})` : ""}`
    : `2d8(${d1}+${d2}=${soma})${precisao !== 0 ? `+bônus(${precisao})` : ""}${bonus !== 0 ? `+bônus(${bonus})` : ""}`;
  return (
    <div className="fn-rolagem-overlay" onClick={onFechar}>
      <div className={`fn-rolagem-painel ${animando ? "fn-rolagem-animando" : ""}`} onClick={e => e.stopPropagation()}>
        <button className="fn-rolagem-fechar" onClick={onFechar}>×</button>
        <div className={`fn-rolagem-icone ${cls}`}>
          <i className="fas fa-dice-d20 fn-rolagem-dado-svg" />
        </div>
        <div className="fn-rolagem-nome">{label}</div>
        <div className="fn-rolagem-nova-formula">
          <div className={`fn-rolagem-dado-destaque ${cls}`}>[{soma}]</div>
          {((!is1d8 && precisao !== 0) || bonus !== 0) && (
            <div className="fn-rolagem-formula-resto">
              {!is1d8 && precisao !== 0 ? `${precisao >= 0 ? "+" : ""}${precisao}` : ""}
              {bonus !== 0 ? `${bonus >= 0 ? "+" : ""}${bonus}` : ""}
            </div>
          )}
          <div className="fn-rolagem-igual">=</div>
          <div className={`fn-rolagem-total-novo ${cls}`}>{total}</div>
        </div>
        <div className="fn-rolagem-formula-label">{formula}</div>
      </div>
    </div>
  );
};

// ── Sub-componente: histórico de rolagens (idêntico ao TLOU) ─────────────────
const PainelHistorico = ({ historico, aberto, onFechar }) => {
  if (!aberto) return null;
  return (
    <div className="fn-painel-resultados">
      <div className="fn-painel-resultados-header">
        <span className="fn-painel-resultados-titulo">Resultados</span>
        <button className="fn-painel-resultados-fechar" onClick={onFechar}>✕</button>
      </div>
      <div className="fn-painel-resultados-lista">
        {historico.length === 0 && <div className="fn-painel-resultados-vazio">Nenhuma rolagem ainda.</div>}
        {[...historico].reverse().map((h, i) => {
          const cls = h.critico ? "fn-critico-max" : h.falhaCritica ? "fn-critico-min" : "";
          const cor = cls === "fn-critico-max" ? "#22c55e" : cls === "fn-critico-min" ? "#ef4444" : "#4a90e2";
          return (
            <div key={i} className="fn-painel-item" style={{ borderColor: cls ? cor : "#0f1e33" }}>
              <div className="fn-painel-item-personagem">{h.personagem || "—"}</div>
              <div className="fn-painel-item-card-row">
                <i className="fas fa-dice-d20 fn-painel-item-icone" style={{ color: cor }} />
                <div className="fn-painel-item-card-body">
                  <span className="fn-painel-item-nome">{h.label}</span>
                  <div className="fn-painel-item-pericia-row">
                    <span className="fn-painel-item-formula-inline">[{h.d1}+{h.d2}]</span>
                    <span className="fn-painel-item-igual">=</span>
                    <span className="fn-painel-item-total" style={{ color: cor }}>{h.total}</span>
                  </div>
                </div>
              </div>
              <div className="fn-painel-item-ts">{h.timestamp}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Lista de perícias com atributo vinculado ──────────────────────────────────
const periciasConfig = [
  { id: "acrobacia",        nome: "Acrobacia",          atr: "agilidade",    sigla: "AGI" },
  { id: "arte",             nome: "Arte",                atr: "inteligencia", sigla: "INT" },
  { id: "atletismo",        nome: "Atletismo",           atr: "forca",        sigla: "FOR" },
  { id: "ciencias_naturais",nome: "Ciências Naturais",   atr: "inteligencia", sigla: "INT" },
  { id: "concentracao",     nome: "Concentração",        atr: "inteligencia", sigla: "INT" },
  { id: "cultura",          nome: "Cultura",             atr: "inteligencia", sigla: "INT" },
  { id: "disfarces",        nome: "Disfarces",           atr: "percepcao",    sigla: "PER" },
  { id: "escapar",          nome: "Escapar",             atr: "destreza",     sigla: "DES" },
  { id: "furtividade",      nome: "Furtividade",         atr: "agilidade",    sigla: "AGI" },
  { id: "lidar_animais",    nome: "Lidar c/ Animais *",  atr: "percepcao",    sigla: "PER" },
  { id: "mecanismos",       nome: "Mecanismos *",        atr: "inteligencia", sigla: "INT" },
  { id: "medicina",         nome: "Medicina *",          atr: "inteligencia", sigla: "INT" },
  { id: "ocultismo",        nome: "Ocultismo *",         atr: "inteligencia", sigla: "INT" },
  { id: "prestidigitacao",  nome: "Prestidigitação",     atr: "destreza",     sigla: "DES" },
  { id: "procurar",         nome: "Procurar",            atr: "percepcao",    sigla: "PER" },
  { id: "rastrear",         nome: "Rastrear",            atr: "percepcao",    sigla: "PER" },
  { id: "prontidao",        nome: "Prontidão",           atr: "percepcao",    sigla: "PER" },
  { id: "veneficio",        nome: "Venefício * *",       atr: "inteligencia", sigla: "INT" },
];

const atributosConfig = [
  { id: "forca",        nome: "Força",        sigla: "FOR" },
  { id: "destreza",     nome: "Destreza",     sigla: "DES" },
  { id: "agilidade",    nome: "Agilidade",    sigla: "AGI" },
  { id: "percepcao",    nome: "Percepção",    sigla: "PER" },
  { id: "inteligencia", nome: "Inteligência", sigla: "INT" },
  { id: "vigor",        nome: "Vigor",        sigla: "VIG" },
  { id: "espirito",     nome: "Espírito",     sigla: "ESP" },
  { id: "carisma",      nome: "Carisma",      sigla: "CAR" },
  { id: "manipulacao",  nome: "Manipulação",  sigla: "MAN" },
];


// ── Config de aptidões comuns (livro SNS) ─────────────────────────────────────
const aptidoesConfig = [
  // COMBATE
  { id: "acuidade",          nome: "Acuidade",           cat: "combate",  req: "Des 3",      desc: "CC usa Destreza ao invés de Força",                efeito: { tipo: "acuidade" } },
  { id: "reflexos",          nome: "Reflexos",            cat: "combate",  req: null,         desc: "ESQ +1",                                            efeito: { tipo: "hc", key: "ESQ", val: 1 } },
  { id: "intuicao",          nome: "Intuição",            cat: "combate",  req: null,         desc: "LM +1",                                             efeito: { tipo: "hc", key: "LM",  val: 1 } },
  { id: "diligente",         nome: "Diligente",           cat: "combate",  req: null,         desc: "Iniciativa +3",                                     efeito: { tipo: "iniciativa", val: 3 } },
  { id: "velocista",         nome: "Velocista",           cat: "combate",  req: null,         desc: "Deslocamento: dobra Agilidade",                     efeito: { tipo: "velocista" } },
  { id: "especialista",      nome: "Especialista",        cat: "combate",  req: null,         desc: "CC ou CD +1 (escolha tipo de arma)",                efeito: { tipo: "especialista" }, generica: true },
  { id: "combate_defensivo", nome: "Combate Defensivo",   cat: "combate",  req: "CC 9",       desc: "Ao usar: CC -2, ESQ +3 até próximo turno",          efeito: null },
  { id: "maestria",          nome: "Maestria",            cat: "combate",  req: null,         desc: "CC ou CD +1 em poder/técnica escolhida",            efeito: null, generica: true },
  { id: "mestre_selos",      nome: "Mestre dos Selos",    cat: "combate",  req: "Prest 12",   desc: "Selos de mão acelerados; 1 mão com Prest 14",       efeito: null },
  { id: "ataque_movimento",  nome: "Ataque em Movimento", cat: "combate",  req: "Agi 4",      desc: "Divide deslocamento antes e depois do ataque",      efeito: null },
  { id: "ataque_multiplo",   nome: "Ataque Múltiplo",     cat: "combate",  req: "CC/CD 11",   desc: "Divide ataque em 2 ou 3 golpes",                    efeito: null },
  { id: "trespassar",        nome: "Trespassar",          cat: "combate",  req: "CC 7",       desc: "Ataque extra ao abater inimigo",                    efeito: null },
  { id: "de_pe",             nome: "De Pé",               cat: "combate",  req: null,         desc: "Levanta como ação livre; 1x/cena como reação",      efeito: null },
  { id: "oportunista",       nome: "Oportunista",         cat: "combate",  req: null,         desc: "Ataques oportunos extras = Agi/2",                  efeito: null },
  { id: "mobilidade",        nome: "Mobilidade",          cat: "combate",  req: "Agi 3",      desc: "ESQ +3 contra ataques oportunos ao se mover",       efeito: null },
  { id: "ponto_cego",        nome: "Ponto Cego",          cat: "combate",  req: "Agi/Prest 6",desc: "Finta como ação de movimento",                      efeito: null },
  { id: "saque_rapido",      nome: "Saque Rápido",        cat: "combate",  req: null,         desc: "Saca/guarda arma como ação livre",                  efeito: null },
  { id: "retirada_rapida",   nome: "Retirada Rápida",     cat: "combate",  req: "Agi 10",     desc: "Recua sem provocar ataque oportuno",                efeito: null },
  { id: "usar_arma",         nome: "Usar Arma",           cat: "combate",  req: null,         desc: "Proficiência em arma marcial/especial",             efeito: null, generica: true },
  { id: "usar_arm_pesada",   nome: "Usar Armaduras Pesadas", cat: "combate", req: "FOR/VIG",  desc: "Usa armaduras pesadas sem penalidade extra",        efeito: null },
  { id: "lutar_cego",        nome: "Lutar às Cegas",      cat: "combate",  req: null,         desc: "Sem desvantagem ao atacar sem visão",               efeito: null },
  { id: "guerreiro",         nome: "Guerreiro",           cat: "combate",  req: "FOR/DES 10", desc: "Manobras com armas pesadas/longas sem penalidade",  efeito: null },
  { id: "critico_aprimorado",nome: "Crítico Aprimorado",  cat: "combate",  req: "Esp + CC/CD 13", desc: "Crítico com 1 a menos no dado",                efeito: null, generica: true },
  { id: "dano_extra",        nome: "Dano Extra",          cat: "combate",  req: "CC/CD 18",   desc: "+1 dano de arma na categoria escolhida",            efeito: null, generica: true },
  { id: "atirador",          nome: "Atirador",            cat: "combate",  req: "DES 12",     desc: "+3 dano arremesso ou +1 dano arco",                 efeito: null },
  { id: "tiro_longo",        nome: "Tiro Longo",          cat: "combate",  req: "DES 12",     desc: "Dobra alcance de armas de disparo",                 efeito: null },
  { id: "tiro_preciso",      nome: "Tiro Preciso",        cat: "combate",  req: "DES 9",      desc: "Ignora cobertura/camuflagem parcial",               efeito: null },
  { id: "mira_apurada",      nome: "Mira Apurada",        cat: "combate",  req: "DES 12, Tiro Longo", desc: "Ação de mover para mirar: CD +1",           efeito: null },
  { id: "rolamento",         nome: "Rolamento",           cat: "combate",  req: "Acro 2",     desc: "Dobra redução de queda; levanta como reação",       efeito: null },
  { id: "blq_ambidestro",    nome: "Bloqueio Ambidestro", cat: "combate",  req: "Ambidestria",desc: "+1 bloqueio com duas armas",                        efeito: null },
  { id: "ambidestria",       nome: "Ambidestria",         cat: "combate",  req: "CC 12",      desc: "Ataca com duas armas; soma dano de ambas",          efeito: null },
  // MANOBRA
  { id: "lutador",           nome: "Lutador",             cat: "manobra",  req: null,         desc: "Manobras desarmadas sem penalidade -2",             efeito: null },
  { id: "punho_ferro",       nome: "Punho de Ferro",      cat: "manobra",  req: "FOR 2",      desc: "Ataque desarmado: 1 dano de arma (escala c/ FOR)",  efeito: { tipo: "punho_ferro" } },
  { id: "apanhar_objetos",   nome: "Apanhar Objetos",     cat: "manobra",  req: null,         desc: "Apanha projéteis e devolve como ação livre",        efeito: null },
  { id: "ataque_giratório",  nome: "Ataque Giratório",    cat: "manobra",  req: "CC 8",       desc: "Ataque acerta todos ao redor",                      efeito: null },
  { id: "ataque_poderoso",   nome: "Ataque Poderoso",     cat: "manobra",  req: "CC 7",       desc: "CC -1, +1 dano",                                    efeito: null },
  { id: "ataque_atordoante", nome: "Ataque Atordoante",   cat: "manobra",  req: "FOR 12",     desc: "Ataque sem dano; alvo testa VIG ou fica atordoado", efeito: null },
  { id: "arremessar",        nome: "Arremessar",          cat: "manobra",  req: "FOR 6",      desc: "Arremessa inimigo derrubado até FOR metros",        efeito: null },
  { id: "rasteira",          nome: "Rasteira",            cat: "manobra",  req: null,         desc: "Chute baixo para derrubar",                         efeito: null },
  { id: "derrubar_agr",      nome: "Derrubar Agressivo",  cat: "manobra",  req: "Lutador/Guerreiro", desc: "Derruba e causa dano ao mesmo tempo",        efeito: null },
  { id: "desarme_agr",       nome: "Desarme Agressivo",   cat: "manobra",  req: "Lutador/Guerreiro", desc: "Desarma e causa dano ao mesmo tempo",        efeito: null },
  { id: "bloquear_arma",     nome: "Bloquear Arma",       cat: "manobra",  req: null,         desc: "+1 bloqueio contra ataques armados",                efeito: null },
  { id: "contragolpe",       nome: "Contragolpe",         cat: "manobra",  req: "CC 12",      desc: "Ataque oportuno ao bloquear com margem de 4+",      efeito: null },
  { id: "chute_giratório",   nome: "Chute Giratório",     cat: "manobra",  req: "CC 10",      desc: "Ataque giratório desarmado com +2 dano",            efeito: null },
  { id: "chute_duplo",       nome: "Chute Duplo",         cat: "manobra",  req: "Chute Gir.", desc: "Ataque Múltiplo: Chute Giratório + chute comum",    efeito: null },
  { id: "chute_inverso",     nome: "Chute Inverso",       cat: "manobra",  req: "CC 14",      desc: "Finta + ataque; alvo não pode bloquear",            efeito: null },
  { id: "soco_agarrado",     nome: "Soco Agarrado",       cat: "manobra",  req: "Lutador",    desc: "Alvo não pode bloquear ao atacar desarmado",        efeito: null },
  { id: "soco_gancho",       nome: "Soco em Gancho",      cat: "manobra",  req: "CC 11",      desc: "Último golpe do Ataque Múltiplo: +1 prec e dano",   efeito: null },
  { id: "golpe_atemi",       nome: "Golpe Atemi",         cat: "manobra",  req: "Ataque Pod.", desc: "-1 prec, +2 dano em ponto vital",                  efeito: null },
  { id: "golpe_karate",      nome: "Golpe Caratê",        cat: "manobra",  req: "CC 15",      desc: "Ignora 2 dureza de corpo",                          efeito: null },
  { id: "voadora",           nome: "Voadora",             cat: "manobra",  req: "Derrubar Agr.", desc: "Investida + Derrubar Agressivo: -1 prec, +2 dano", efeito: null },
  { id: "seguir_sombra",     nome: "Seguir Sombra",       cat: "manobra",  req: "Arremessar",  desc: "Persegue e ataca novamente inimigo arremessado",   efeito: null },
  { id: "ataque_progressivo",nome: "Ataque Progressivo",  cat: "manobra",  req: "Agi 14 ou Hachimon 6", desc: "Após Ataque Múltiplo bem-sucedido: 2 rolagens extras", efeito: null },
  // TÉCNICAS
  { id: "tecnica_acelerada", nome: "Técnica Acelerada",   cat: "tecnica",  req: "ESP/INT 12", desc: "Executa técnica de ação padrão como ação de mover", efeito: null },
  { id: "tecnica_eficiente", nome: "Técnica Eficiente",   cat: "tecnica",  req: "ESP/INT 10", desc: "Relança grau de dano, fica com melhor resultado",   efeito: null },
  { id: "tecnica_elevada",   nome: "Técnica Elevada",     cat: "tecnica",  req: "INT 6",      desc: "+2 dif para resistir às suas técnicas de perícia",  efeito: null },
  { id: "tecnica_poderosa",  nome: "Técnica Poderosa",    cat: "tecnica",  req: "ESP/INT 12", desc: "Grau de Dano +0,5 nas técnicas",                    efeito: null },
  { id: "potencializar",     nome: "Potencializar",       cat: "tecnica",  req: "ESP/INT 8",  desc: "Dobra área/alcance ou +1 dano base da técnica",     efeito: null },
  { id: "dominio_agua",      nome: "Domínio da Água",     cat: "tecnica",  req: "Suiton 5",   desc: "Acumula pontos de água p/ +1 dano Suiton",          efeito: null },
  { id: "dominio_fogo",      nome: "Domínio do Fogo",     cat: "tecnica",  req: "Katon 5",    desc: "Katon em área: alvo testa VIG ou fica debilitado",  efeito: null },
  { id: "dominio_raio",      nome: "Domínio do Raio",     cat: "tecnica",  req: "Raiton 5",   desc: "Crítico Aprimorado em todos efeitos Raiton",        efeito: null },
  { id: "dominio_terra",     nome: "Domínio da Terra",    cat: "tecnica",  req: "Doton 5",    desc: "Barreira Doton: gasta chakra para +1 dureza",       efeito: null },
  { id: "dominio_vento",     nome: "Domínio do Vento",    cat: "tecnica",  req: "Fuuton 5",   desc: "Fuuton em área: ventos reduzem deslocamento à metade", efeito: null },
  { id: "dominio_ninpou",    nome: "Domínio Ninpou",      cat: "tecnica",  req: "Ninpou 5",   desc: "Finta de Flechas custa ação parcial",               efeito: null },
  { id: "ilusao_profunda",   nome: "Ilusão Profunda",     cat: "tecnica",  req: "INT 5",      desc: "+1 dif p/ resistir ilusões (+2 contra Kai)",        efeito: null },
  // SHINOBI
  { id: "clone",             nome: "Clone",               cat: "shinobi",  req: "ESP 6",      desc: "Cria até 2 clones (Parceiros); 1 chakra cada",      efeito: null, generica: true },
  { id: "clone_verdadeiro",  nome: "Clone Verdadeiro",    cat: "shinobi",  req: "ESP 10",     desc: "1 clone que usa poderes e técnicas",                efeito: null },
  { id: "replica_enganadora",nome: "Réplica Enganadora",  cat: "shinobi",  req: null,         desc: "Escapa de ataque deixando clone no lugar",          efeito: null },
  { id: "sensor",            nome: "Sensor",              cat: "shinobi",  req: null,         desc: "Rastreia criaturas pelo chakra",                    efeito: null },
  { id: "shunjutsu",         nome: "Shunjutsu",           cat: "shinobi",  req: null,         desc: "Shunshin: movimento rápido em combate",             efeito: null },
  { id: "fascinar",          nome: "Fascinar",            cat: "shinobi",  req: null,         desc: "Cria ilusão na mente do inimigo",                   efeito: null },
  { id: "miragem",           nome: "Miragem",             cat: "shinobi",  req: null,         desc: "Cria ilusão sobre objeto ou lugar",                 efeito: null },
  { id: "trabalho_duro",     nome: "Trabalho Duro",       cat: "shinobi",  req: null,         desc: "Bônus genéricos durante o combate",                 efeito: null },
  // GERAIS
  { id: "ninja_medico",      nome: "Ninja Médico",        cat: "geral",    req: "Medicina 7", desc: "Habilita cirurgias, remédios e técnicas de cura",   efeito: { tipo: "treino_pericia", pericia: "medicina" } },
  { id: "quimico",           nome: "Químico",             cat: "geral",    req: "INT 8",      desc: "Habilita a compra/uso da perícia Venefício",        efeito: { tipo: "treino_pericia", pericia: "veneficio" } },
  { id: "engenheiro",        nome: "Engenheiro",          cat: "geral",    req: "INT 6",      desc: "Habilita criação de mecanismos e armadilhas",       efeito: { tipo: "treino_pericia", pericia: "mecanismos" } },
  { id: "pericia_inata",     nome: "Perícia Inata",       cat: "geral",    req: null,         desc: "Refaz um teste de perícia escolhida",               efeito: null, generica: true },
  { id: "perito",            nome: "Perito",              cat: "geral",    req: null,         desc: "+2 precisão em perícia escolhida",                  efeito: { tipo: "perito" }, generica: true },
  { id: "resistencia_maior", nome: "Resistência Maior",   cat: "geral",    req: null,         desc: "Refaz teste de resistência de atributo escolhido",  efeito: null, generica: true },
  { id: "duro_matar",        nome: "Duro de Matar",       cat: "geral",    req: null,         desc: "1x/dia: resiste golpe que levaria Vit a 0",         efeito: null },
  { id: "elemento_natural",  nome: "Elemento Natural",    cat: "geral",    req: null,         desc: "Habilita técnicas do elemento escolhido (restrito)", efeito: null, generica: true },
];

const CATS = [
  { id: "combate",  label: "COMBATE"  },
  { id: "manobra",  label: "MANOBRA"  },
  { id: "tecnica",  label: "TÉCNICA"  },
  { id: "shinobi",  label: "SHINOBI"  },
  { id: "geral",    label: "GERAL"    },
];

// ── Aptidões restritas por clã ────────────────────────────────────────────────
const aptidoesRestritas = [
  // ABURAME
  { id: "r_kikaichuu",    nome: "Kikaichuu",                cat: "restrita", cla: "aburame",  req: "Lidar com Animais 1", desc: "Insetos sugadores de chakra vivem no corpo. Ataque drena chakra do alvo igual ao nº de insetos usados. Aptidão evolutiva — cada nível comprado separadamente.", efeito: null },
  { id: "r_shokaichuu",   nome: "Shōkaichuu",               cat: "restrita", cla: "aburame",  req: "Lidar com Animais 10", desc: "Inseto parasita rastreador: prende ao alvo e permite rastreá-lo pelo odor.", efeito: null },
  { id: "r_kidaichuu",    nome: "Kidaichuu",                cat: "restrita", cla: "aburame",  req: null, desc: "Inseto parasita gigante. Não pode ser usado junto com Rinkaichuu.", efeito: null },
  { id: "r_rinkaichuu",   nome: "Rinkaichuu",               cat: "restrita", cla: "aburame",  req: null, desc: "Inseto parasita venenoso. Não pode ser usado junto com Kidaichuu.", efeito: null },
  // AKIMICHI
  { id: "r_corpulencia",  nome: "Corpulência",              cat: "restrita", cla: "akimichi", req: null, desc: "Vitalidade adicional = 3x Vigor. +2 precisão em testes de Vigor. Pode queimar calorias: 2 Vit → 1 chakra.", efeito: null },
  { id: "r_resiliencia",  nome: "Resiliência",              cat: "restrita", cla: "akimichi", req: null, desc: "Resistência física aumentada característica do clã Akimichi.", efeito: null },
  // HYUUGA
  { id: "r_byakugan",     nome: "Byakugan",                 cat: "restrita", cla: "hyuuga",   req: "Percepção 1", desc: "Ação parcial + 1 chakra para ativar. Duração: 1 cena. Concede visão 360°, visão de chakra e pontos vitais, bônus em Percepção.", efeito: null },
  { id: "r_tenketsu",     nome: "Tenketsu Byakugan",        cat: "restrita", cla: "hyuuga",   req: "Byakugan", desc: "Permite atacar os pontos de tenketsu do alvo com o Juuken, bloqueando o fluxo de chakra.", efeito: null },
  // INUZUKA
  { id: "r_comp_animal",  nome: "Companheiro Animal",       cat: "restrita", cla: "inuzuka",  req: "Lidar com Animais 1", desc: "Um cão ou lobo como Parceiro com ficha própria (2 níveis abaixo). Evolui junto com o Inuzuka.", efeito: null },
  { id: "r_hakken",       nome: "Hakken no Jutsu",          cat: "restrita", cla: "inuzuka",  req: null, desc: "Concentra chakra no nariz aumentando o olfato a nível sobre-humano.", efeito: null },
  // UCHIHA
  { id: "r_katon_nat",    nome: "Elemento Natural: Katon",  cat: "restrita", cla: "uchiha",   req: "Espírito 1", desc: "Permite usar Katon: Goukakyuu no Jutsu mesmo sem o poder e em nível Genin (NC 4). Dano base = Espírito +2.", efeito: null },
  { id: "r_sharingan",    nome: "Sharingan",                cat: "restrita", cla: "uchiha",   req: "Espírito 1", desc: "Doujutsu do clã Uchiha. Ativa com ação parcial. Permite copiar técnicas, prever movimentos e resistir a genjutsus.", efeito: null },
  { id: "r_nidan_shari",  nome: "Nidan Sharingan",          cat: "restrita", cla: "uchiha",   req: "Sharingan", desc: "Segunda evolução do Sharingan. Amplia capacidades de cópia e previsão.", efeito: null },
  { id: "r_sandan_shari", nome: "Sandan Sharingan",         cat: "restrita", cla: "uchiha",   req: "Nidan Sharingan", desc: "Terceira evolução. Pode capturar alvos em genjutsu pelo contato visual.", efeito: null },
  { id: "r_mangekyou",    nome: "Mangekyou Sharingan",      cat: "restrita", cla: "uchiha",   req: "Sandan Sharingan", desc: "Forma máxima do Sharingan obtida por grande trauma. Permite Amaterasu, Tsukuyomi e Susanoo.", efeito: null },
];

// ── Tabela de evolução ────────────────────────────────────────────────────────
const TABELA_EVOLUCAO = [
  { nc:  4, nivelShinobi: "Genin",           atributos: 12,  pericias:  8, poderes:  4, minimo: 0 },
  { nc:  5, nivelShinobi: "Genin",           atributos: 18,  pericias: 12, poderes:  6, minimo: 1 },
  { nc:  6, nivelShinobi: "Genin",           atributos: 24,  pericias: 16, poderes:  8, minimo: 1 },
  { nc:  7, nivelShinobi: "Chuunin",         atributos: 30,  pericias: 20, poderes: 10, minimo: 2 },
  { nc:  8, nivelShinobi: "Chuunin",         atributos: 36,  pericias: 24, poderes: 12, minimo: 2 },
  { nc:  9, nivelShinobi: "Chuunin",         atributos: 42,  pericias: 28, poderes: 14, minimo: 3 },
  { nc: 10, nivelShinobi: "Jounin Especial", atributos: 48,  pericias: 32, poderes: 16, minimo: 3 },
  { nc: 11, nivelShinobi: "Jounin Especial", atributos: 54,  pericias: 36, poderes: 18, minimo: 4 },
  { nc: 12, nivelShinobi: "Jounin",          atributos: 60,  pericias: 40, poderes: 20, minimo: 4 },
  { nc: 13, nivelShinobi: "Jounin",          atributos: 66,  pericias: 44, poderes: 22, minimo: 5 },
  { nc: 14, nivelShinobi: "Jounin",          atributos: 72,  pericias: 48, poderes: 24, minimo: 5 },
  { nc: 15, nivelShinobi: "Jounin Elite",    atributos: 78,  pericias: 52, poderes: 26, minimo: 6 },
  { nc: 16, nivelShinobi: "Jounin Elite",    atributos: 84,  pericias: 56, poderes: 28, minimo: 6 },
  { nc: 17, nivelShinobi: "Jounin Elite",    atributos: 90,  pericias: 60, poderes: 30, minimo: 7 },
  { nc: 18, nivelShinobi: "Sannin / Kage",   atributos: 96,  pericias: 64, poderes: 32, minimo: 7 },
  { nc: 19, nivelShinobi: "Sannin / Kage",   atributos: 102, pericias: 68, poderes: 34, minimo: 8 },
  { nc: 20, nivelShinobi: "Sannin / Kage",   atributos: 108, pericias: 72, poderes: 40, minimo: 8 },
];
const getEvolucao = (nc) => {
  const n = parseInt(nc, 10);
  if (isNaN(n) || n < 4) return TABELA_EVOLUCAO[0];
  if (n > 20) {
    const base = TABELA_EVOLUCAO[TABELA_EVOLUCAO.length - 1];
    const extra = n - 20;
    return { nc: n, nivelShinobi: "Kage+", atributos: base.atributos + extra * 6, pericias: base.pericias + extra * 4, poderes: base.poderes + extra * 2, minimo: base.minimo + Math.floor(extra / 2) };
  }
  return TABELA_EVOLUCAO.find(r => r.nc === n) || TABELA_EVOLUCAO[0];
};

// ── Dinheiro inicial por nível shinobi ────────────────────────────────────────
const RYOS_INICIAIS = {
  "Genin":           100,
  "Chuunin":         1000,
  "Jounin Especial": 5000,
  "Jounin":          13000,
  "Jounin Elite":    36000,
  "Sannin / Kage":   88000,
};
const getRyosIniciais = (nc) => {
  const evo = getEvolucao(parseInt(nc, 10) || 4);
  return RYOS_INICIAIS[evo.nivelShinobi] ?? 100;
};

// ── Metadados de categorias da loja (cores e labels) ──────────────────────────
const CATALOGO_META = {
  arremesso:      { label: "Arremesso",      cor: "#ef4444" },
  explosivos:     { label: "Explosivos",     cor: "#f97316" },
  armas_simples:  { label: "Armas Simples",  cor: "#a78bfa" },
  armas_marciais: { label: "Armas Marciais", cor: "#ec4899" },
  disparo:        { label: "Disparo",        cor: "#22c55e" },
  armaduras:      { label: "Armaduras",      cor: "#4a90e2" },
  itens_gerais:   { label: "Itens Gerais",   cor: "#f0a020" },
  servicos:       { label: "Serviços",       cor: "#06b6d4" },
};

// Detecta o id do clã a partir do nome (ex: "Clã Hyuuga" → "hyuuga")
const getClaId = (claNome = "") => {
  const norm = claNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("aburame"))  return "aburame";
  if (norm.includes("akimichi")) return "akimichi";
  if (norm.includes("hyuu") || norm.includes("hyuga")) return "hyuuga";
  if (norm.includes("inuzuka"))  return "inuzuka";
  if (norm.includes("uchiha"))   return "uchiha";
  return null;
};

// ── Helper: verifica pré-requisitos de aptidão ───────────────────────────────
// Suporta: "Des 3", "CC 9", "INT 8", "Medicina 7", "Agi/Prest 6", "CC/CD 11" etc.
const verificarReq = (req, atr, pericias, hcCalc) => {
  if (!req) return true;
  // vírgula = todos os requisitos devem ser atendidos
  return req.split(",").every(parte => {
    // barra = basta um
    return parte.trim().split("/").some(p => {
      p = p.trim();
      const m = p.match(/^(.+?)\s+(\d+)$/);
      if (!m) return true; // req sem número (ex: "Ambidestria") — não bloqueia
      const nome = m[1].toLowerCase().trim();
      const num  = parseInt(m[2]);
      // atributos
      if (["for","força","forca"].includes(nome))         return (atr.forca        ?? 0) >= num;
      if (["des","destreza"].includes(nome))              return (atr.destreza     ?? 0) >= num;
      if (["agi","agilidade"].includes(nome))             return (atr.agilidade    ?? 0) >= num;
      if (["per","percepção","percepcao"].includes(nome)) return (atr.percepcao    ?? 0) >= num;
      if (["int","inteligência","inteligencia"].includes(nome)) return (atr.inteligencia ?? 0) >= num;
      if (["vig","vigor"].includes(nome))                 return (atr.vigor        ?? 0) >= num;
      if (["esp","espírito","espirito"].includes(nome))   return (atr.espirito     ?? 0) >= num;
      // habilidades de combate
      if (nome === "cc")    return (hcCalc?.CC  ?? 0) >= num;
      if (nome === "cd")    return (hcCalc?.CD  ?? 0) >= num;
      if (nome === "esq")   return (hcCalc?.ESQ ?? 0) >= num;
      if (nome === "lm")    return (hcCalc?.LM  ?? 0) >= num;
      if (nome === "cc/cd" || nome === "combate") return Math.max(hcCalc?.CC ?? 0, hcCalc?.CD ?? 0) >= num;
      // perícias pelo nome — total = ½atr base + pts gastos
      const mapaAtr = {
        acrobacia: "agilidade", atletismo: "forca", furtividade: "agilidade",
        prontidao: "percepcao", prontidão: "percepcao",
        procurar: "percepcao", rastrear: "percepcao",
        concentracao: "inteligencia", concentração: "inteligencia",
        cultura: "inteligencia", medicina: "inteligencia",
        mecanismos: "inteligencia", veneficio: "inteligencia",
        prestidigitacao: "destreza", prestidigitação: "destreza",
        escapar: "destreza", disfarces: "percepcao",
        prest: "destreza",
      };
      const nNorm = nome.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
      if (mapaAtr[nNorm]) {
        const atrKey = mapaAtr[nNorm];
        const base  = Math.ceil((atr[atrKey] ?? 0) / 2);
        const extra = pericias?.[nNorm] ?? 0;
        return (base + extra) >= num;
      }
      return true; // desconhecido — não bloqueia
    });
  });
};

// ── MODAL LOJA DE APTIDÕES (padrão TLOU) ─────────────────────────────────────
const ModalLojaAptidoes = ({ aptidoes, onAdicionar, onFechar, atr, pericias, hcCalc, claId, pontosRestantes, totalAptidoes }) => {
  const temRestrita = claId && aptidoesRestritas.some(a => a.cla === claId);
  const catsDisponiveis = temRestrita
    ? [...CATS, { id: "restrita", label: "CLÃ" }]
    : CATS;

  const [catAtiva, setCatAtiva]     = useState("combate");
  const [busca,    setBusca]        = useState("");
  const [expandidos, setExpandidos] = useState({});
  const [modalGenerica, setModalGenerica] = useState(null);
  const [toast, setToast]           = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  };

  const temAptidao = (id) => aptidoes.some(a => a.id === id);

  // Aptidões além das 3 gratuitas custam 2 pontos
  const gratuitas = 3;
  const custaPontos = totalAptidoes >= gratuitas;
  const custoApt = 2;
  const semPontos = custaPontos && (pontosRestantes !== undefined) && pontosRestantes < custoApt;

  const adicionar = (apt, obs = "") => {
    if (!apt.generica && temAptidao(apt.id)) {
      mostrarToast(`${apt.nome} já adquirida!`, "erro");
      return;
    }
    if (semPontos) {
      mostrarToast(`Pontos insuficientes — precisas de 2 pts, restam ${pontosRestantes}.`, "erro");
      return;
    }
    onAdicionar({ id: apt.id, nome: apt.nome, cat: apt.cat, obs, efeito: apt.efeito });
    mostrarToast(`${apt.nome} adquirida!`, "ok");
    setModalGenerica(null);
  };

  const filtrados = (catAtiva === "restrita"
    ? aptidoesRestritas.filter(a => a.cla === claId)
    : aptidoesConfig.filter(a => a.cat === catAtiva)
  ).filter(a =>
    busca === "" || a.nome.toLowerCase().includes(busca.toLowerCase()) || a.desc.toLowerCase().includes(busca.toLowerCase())
  );

  const catCor = { combate: "#e05050", manobra: "#f39c12", tecnica: "#4a90e2", shinobi: "#9b59b6", geral: "#27ae60", restrita: "#4a90e2" };
  const cor = catCor[catAtiva] || "#4a90e2";

  return (
    <div className="fn-loja-overlay" onClick={onFechar}>
      <div className="fn-loja-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fn-loja-header">
          <h2 className="fn-loja-titulo">Aptidões</h2>
          {pontosRestantes !== undefined && (
            <div style={{
              fontSize: "0.72rem", fontFamily: "'Google Sans',sans-serif", letterSpacing: "0.5px",
              padding: "3px 10px", borderRadius: "6px",
              background: semPontos ? "#1a0505" : "#051a0d",
              color: semPontos ? "#ef4444" : "#22c55e",
              border: `1px solid ${semPontos ? "#ef444433" : "#22c55e33"}`,
            }}>
              {custaPontos ? `custo: 2 pts · ` : `3 gratuitas · `}
              {pontosRestantes} pt{pontosRestantes !== 1 ? "s" : ""} restante{pontosRestantes !== 1 ? "s" : ""}
            </div>
          )}
          <button className="fn-loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
        </div>

        {/* Categorias */}
        <div className="fn-loja-cats">
          {catsDisponiveis.map(c => (
            <button
              key={c.id}
              className={`fn-loja-cat-btn ${catAtiva === c.id ? "fn-loja-cat-ativa" : ""}`}
              style={catAtiva === c.id ? { color: catCor[c.id] || "#4a90e2", borderBottomColor: catCor[c.id] || "#4a90e2" } : {}}
              onClick={() => { setCatAtiva(c.id); setBusca(""); }}
            >
              {c.id === "restrita" ? "✦ CLÃ" : c.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="fn-loja-busca-row">
          <i className="fas fa-search fn-loja-busca-icon" />
          <input className="fn-loja-busca-input" placeholder="Buscar aptidão..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>

        {toast && <div className={`fn-loja-toast fn-fn-loja-toast-${toast.tipo}`}>{toast.msg}</div>}

        {/* Lista */}
        <div className="fn-loja-lista">
          {filtrados.map(apt => {
            const ativa    = !apt.generica && temAptidao(apt.id);
            const liberada = verificarReq(apt.req, atr, pericias, hcCalc);
            const exp      = expandidos[apt.id];
            return (
              <div key={apt.id} className={`fn-loja-item ${ativa ? "fn-fn-loja-item-max" : ""} ${!liberada ? "fn-apt-bloqueada-modal" : ""}`}>
                <div className="fn-fn-loja-item-header" onClick={() => setExpandidos(p => ({ ...p, [apt.id]: !p[apt.id] }))}>
                  <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{ color: ativa ? cor : liberada ? "#ccc" : "#555" }}>{apt.nome}</span>
                      {ativa  && <span className="fn-loja-badge-max">✓</span>}
                      {!liberada && <span className="fn-loja-badge-max" style={{ background: "#2a1a1a", color: "#c0392b", borderColor: "#c0392b44" }}>🔒 {apt.req}</span>}
                    </div>
                    {apt.req && liberada && <span style={{ fontSize: "0.6rem", color: "#555", fontFamily: "'Google Sans',sans-serif", letterSpacing: "0.5px" }}>Req: {apt.req}</span>}
                  </div>
                  {!ativa && liberada && (
                    <button
                      className="fn-fn-loja-item-add"
                      style={semPontos
                        ? { borderColor: "#555", color: "#555", cursor: "not-allowed", opacity: 0.5 }
                        : { borderColor: cor, color: cor }}
                      title={semPontos ? `Pontos insuficientes (restam ${pontosRestantes}, custo 2)` : "Adquirir aptidão"}
                      onClick={e => {
                        e.stopPropagation();
                        if (apt.generica) setModalGenerica(apt);
                        else adicionar(apt);
                      }}
                    >
                      <i className="fas fa-plus" />
                    </button>
                  )}
                </div>
                {exp && (
                  <div className="fn-fn-loja-item-corpo">
                    <p className="fn-fn-loja-item-desc">{apt.desc}</p>
                  </div>
                )}
              </div>
            );
          })}
          {filtrados.length === 0 && <p className="fn-loja-vazio">Nenhuma aptidão encontrada.</p>}
        </div>
      </div>

      {/* Modal genérica (pede especificação) */}
      {modalGenerica && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={e => { e.stopPropagation(); setModalGenerica(null); }}>
          <div style={{ background: "#080d12", border: "1px solid #4a90e2", borderRadius: "10px", padding: "22px", width: "340px", display: "flex", flexDirection: "column", gap: "12px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Google Sans',sans-serif", fontWeight: 800, color: "#fff" }}>{modalGenerica.nome}</span>
              <button onClick={() => setModalGenerica(null)} style={{ background: "none", border: "none", color: "#666", fontSize: "1.1rem", cursor: "pointer" }}><i className="fas fa-times" /></button>
            </div>
            <p style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "0.82rem", color: "#aaa", margin: 0 }}>{modalGenerica.desc}</p>
            <GenericaInput apt={modalGenerica} onConfirmar={obs => adicionar(modalGenerica, obs)} />
          </div>
        </div>
      )}
    </div>
  );
};

const GenericaInput = ({ apt, onConfirmar }) => {
  const [obs, setObs] = useState("");
  return (
    <>
      <input
        style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "4px", color: "#fff", fontFamily: "'Google Sans',sans-serif", fontSize: "0.85rem", padding: "8px 10px", outline: "none", width: "100%", boxSizing: "border-box" }}
        placeholder="Especifique (ex: kunai, Acrobacia...)"
        value={obs}
        onChange={e => setObs(e.target.value)}
        autoFocus
        onKeyDown={e => { if (e.key === "Enter" && obs.trim()) onConfirmar(obs.trim()); }}
        onFocus={e => e.target.style.borderColor = "#4a90e2"}
        onBlur={e => e.target.style.borderColor = "#1a2535"}
      />
      <button
        onClick={() => obs.trim() && onConfirmar(obs.trim())}
        style={{ background: obs.trim() ? "#4a90e2" : "#1a2535", border: "none", color: obs.trim() ? "#fff" : "#555", fontFamily: "'Google Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, padding: "8px 16px", borderRadius: "4px", cursor: obs.trim() ? "pointer" : "not-allowed", transition: "all 0.2s" }}
      >
        ADICIONAR
      </button>
    </>
  );
};

// ── ABA APTIDÕES — lista adquiridas + botão abre modal ───────────────────────
const AbaAptidoes = ({ aptidoes, setAptidoes, atr, pericias, hcCalc = {}, claId, salvarAgora, pontosRestantes }) => {
  const [lojaAberta, setLojaAberta] = useState(false);
  const [expandidos, setExpandidos] = useState({});
  const [filtro,     setFiltro]     = useState("");

  const remover = (idx) => { setAptidoes(prev => prev.filter((_, i) => i !== idx)); setTimeout(salvarAgora, 100); };

  const adquiridasFiltradas = aptidoes.filter(a =>
    filtro === "" || a.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const catCor = { combate: "#e05050", manobra: "#f39c12", tecnica: "#4a90e2", shinobi: "#9b59b6", geral: "#27ae60" };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">
      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar aptidões" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => setLojaAberta(true)}>+ ADICIONAR</button>
      </div>

      <div className="fn-aba-lista">
        {adquiridasFiltradas.length === 0 && (
          <p className="fn-aba-vazio">Nenhuma aptidão adquirida.<br />Clique em Adicionar.</p>
        )}
        {adquiridasFiltradas.map((a, idx) => {
          const cor = catCor[a.cat] || "#4a90e2";
          const aptCfg = aptidoesConfig.find(x => x.id === a.id);
          return (
            <div key={idx} className="fn-aba-item fn-fn-aba-item">
              <div className="fn-fn-aba-item-header" onClick={() => setExpandidos(p => ({ ...p, [idx]: !p[idx] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${expandidos[idx] ? "up" : "down"}`} /></button>
                <div className="fn-fn-aba-item-info">
                  <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome" style={{ color: cor }}>{a.nome}</span>
                  <div className="fn-fn-aba-item-meta">
                    <span className="fn-aba-tag fn-fn-aba-tag" style={{ color: cor, borderColor: cor + "44" }}>{a.cat}</span>
                    {a.obs && <span className="fn-aba-tag fn-fn-aba-tag" style={{ color: "#aaa" }}>{a.obs}</span>}
                  </div>
                </div>
                <button
                  className="fn-aba-icon-btn"
                  style={{ color: "#c0392b" }}
                  title="Remover aptidão"
                  onClick={e => { e.stopPropagation(); remover(idx); }}
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
              {expandidos[idx] && aptCfg && (
                <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                  <p className="fn-ataque-detalhe">{aptCfg.desc}</p>
                  {aptCfg.req && <p className="fn-ataque-detalhe" style={{ color: "#555" }}>Requisito: {aptCfg.req}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lojaAberta && (
        <ModalLojaAptidoes
          aptidoes={aptidoes}
          onAdicionar={apt => { setAptidoes(prev => [...prev, apt]); setTimeout(salvarAgora, 100); }}
          onFechar={() => setLojaAberta(false)}
          atr={atr}
          pericias={pericias}
          hcCalc={hcCalc}
          claId={claId}
          pontosRestantes={pontosRestantes}
          totalAptidoes={aptidoes.length}
        />
      )}
    </div>
  );
};

// ── Sub-componente: aba de perícias com atributo trocável e bônus editável ───
const AbaPericiasNova = ({ periciasConfig, atributosConfig, atr, pericias, setPericias, aptPericiaBonus = {}, aptidoes = [], handleRolar }) => {
  const [atrOverride, setAtrOverride] = useState({});
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [totalOverride, setTotalOverride] = useState({});
  const [editandoTotal, setEditandoTotal] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setDropdownAberto(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getAtrEfetivo = (p) => atrOverride[p.id] ?? { id: p.atr, sigla: p.sigla };

  return (
    <div className="fn-pericias-wrapper" ref={wrapperRef}>
      <div className="fn-pericias-box">
      <table className="fn-pericias-tabela">
        <thead>
          <tr>
            <th className="fnt-col-rolar"></th>
            <th className="fnt-col-nome">PERÍCIA</th>
            <th className="fnt-col-atr">ATR</th>
            <th className="fnt-col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {periciasConfig.map(p => {
            const atrEfetivo = getAtrEfetivo(p);
            // Livro SNS: nível inicial = ½ Atributo (arredondado para cima)
            const base    = Math.ceil((atr[atrEfetivo.id] ?? 0) / 2);
            // pontos gastos distribuídos pelo jogador
            const extra   = pericias[p.id] ?? 0;
            // bônus de aptidão Perito (+2 na perícia)
            const aptKey  = p.id.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
            const aptBonus = aptPericiaBonus[aptKey] ?? 0;
            // total usado nas rolagens = ½Atr + pts gastos + bônus aptidões (ou override manual)
            const totalCalc = base + extra + aptBonus;
            const total = totalOverride[p.id] !== undefined ? totalOverride[p.id] : totalCalc;
            const trocado = !!atrOverride[p.id];

            return (
              <tr key={p.id}>
                <td className="fnt-pericia-rolar">
                  <button className="fn-btn-rolar" onClick={() => handleRolar(p.nome, total, 0)} title={`Rolar ${p.nome}`}>
                    <i className="fas fa-dice-d20" />
                  </button>
                </td>
                <td className="fnt-pericia-nome">{p.nome}</td>
                <td className="fnt-pericia-atr-cell">
                  <div className="fn-atr-dropdown-wrapper">
                    <button
                      className={`fn-atr-badge ${trocado ? "fn-atr-badge-trocado" : ""}`}
                      onClick={() => setDropdownAberto(dropdownAberto === p.id ? null : p.id)}
                      title="Clique para trocar atributo"
                    >
                      {atrEfetivo.sigla}
                    </button>
                    {dropdownAberto === p.id && (
                      <div className="fn-atr-dropdown">
                        {atributosConfig.map(a => (
                          <button
                            key={a.id}
                            className={`fn-atr-dropdown-item ${atrEfetivo.id === a.id ? "fn-atr-dropdown-ativo" : ""}`}
                            onClick={() => {
                              if (a.id === p.atr) {
                                setAtrOverride(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                              } else {
                                setAtrOverride(prev => ({ ...prev, [p.id]: { id: a.id, sigla: a.sigla } }));
                              }
                              setDropdownAberto(null);
                            }}
                          >
                            <span className="fn-atr-dropdown-sigla">{a.sigla}</span>
                            <span className="fn-atr-dropdown-nome">{a.nome}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                {/* Total editável */}
                <td className="fnt-pericia-total-cell">
                  {editandoTotal === p.id ? (
                    <span
                      className="fn-pericia-total-num"
                      contentEditable
                      suppressContentEditableWarning
                      style={{ cursor: "text", borderBottom: "1px solid #4a90e2", outline: "none", minWidth: 20, display: "inline-block", textAlign: "center" }}
                      onBlur={e => {
                        const v = parseInt(e.currentTarget.textContent);
                        setTotalOverride(prev => ({ ...prev, [p.id]: isNaN(v) ? 0 : v }));
                        setEditandoTotal(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                        if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault();
                      }}
                      ref={el => { if (el && editandoTotal === p.id) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); } }}
                    >{total}</span>
                  ) : (
                    <span className="fn-pericia-total-num" style={{ cursor: "pointer" }} onClick={() => setEditandoTotal(p.id)} title="Clique para editar">{total}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
};

// ── Sub-componente: Modal de Testes Sociais ───────────────────────────────────
const testesConfig = [
  {
    id: "atuacao",
    nome: "Atuação",
    formula: "Carisma + ½ Arte",
    base: "carisma",
    pericia: "arte",
    descricao: "Impressione uma plateia com música, canto, poesia ou outra manifestação artística.",
  },
  {
    id: "mudar_atitude",
    nome: "Mudar Atitude",
    formula: "Manipulação + ½ Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Mude a atitude de alguém em uma categoria. Resistido por Inteligência do alvo.",
  },
  {
    id: "barganha",
    nome: "Barganha",
    formula: "Carisma + ½ Percepção",
    base: "carisma",
    pericia: "percepcao",
    descricao: "Negocie preços. Resistido pelo teste de Barganha do outro negociante.",
  },
  {
    id: "blefar",
    nome: "Blefar",
    formula: "Manipulação + ½ Inteligência",
    base: "manipulacao",
    pericia: "inteligencia",
    descricao: "Leve outros a tirar conclusões erradas. Resistido por Inteligência da vítima.",
  },
  {
    id: "intimidacao",
    nome: "Intimidação",
    formula: "Manipulação + ½ Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Force obediência por ameaças ou coação. Resistido por Inteligência do alvo.",
  },
  {
    id: "obter_informacao",
    nome: "Obter Informação",
    formula: "Carisma + ½ Inteligência",
    base: "carisma",
    pericia: "inteligencia",
    descricao: "Faça contatos e descubra informações. Exige um dia inteiro e alguns Ryos.",
  },
];

const ModalTesteSocial = ({ aberto, onFechar, ficha, atr, pericias, handleRolar }) => {
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [aberto]);

  if (!aberto) return null;

  const calcPrecisao = (teste) => {
    // Livro SNS: Carisma/Manipulação + ½ atributo-ou-perícia (arredondado para cima)
    const baseVal = ficha?.[teste.base] ?? 0;
    const atrPericia = atr?.[teste.pericia];
    let halfPericia;
    if (atrPericia !== undefined) {
      // É um atributo direto (Percepção, Inteligência)
      halfPericia = Math.ceil(atrPericia / 2);
    } else {
      // É uma perícia (Arte): nível total = ½Atr + pts gastos
      // arte -> atributo: inteligencia
      const pCfg = { arte: "inteligencia" };
      const atrLink = pCfg[teste.pericia] ?? "inteligencia";
      const nivelBase  = Math.ceil((atr?.[atrLink] ?? 0) / 2);
      const nivelExtra = pericias?.[teste.pericia] ?? 0;
      const nivelTotal = nivelBase + nivelExtra;
      halfPericia = Math.ceil(nivelTotal / 2);
    }
    return baseVal + halfPericia;
  };

  return (
    <div className="fn-ts-overlay" onClick={onFechar} onWheel={e => e.stopPropagation()}>
      <div className="fn-ts-modal" onClick={e => e.stopPropagation()} onWheel={e => e.stopPropagation()}>
        <div className="fn-fn-ts-modal-header">
          <span className="fn-fn-ts-modal-titulo">TESTES SOCIAIS</span>
          <button className="fn-fn-ts-modal-fechar" onClick={onFechar}>×</button>
        </div>
        <div className="fn-fn-ts-modal-lista">
          {testesConfig.map(teste => {
            const precisao = calcPrecisao(teste);
            return (
              <div key={teste.id} className="fn-ts-item">
                <div className="fn-fn-ts-item-top">
                  <div className="fn-fn-ts-item-info">
                    <span className="fn-fn-ts-item-nome">{teste.nome}</span>
                    <span className="fn-fn-ts-item-formula">{teste.formula}</span>
                    <span className="fn-fn-ts-item-desc">{teste.descricao}</span>
                  </div>
                  <div className="fn-fn-ts-item-right">
                    <span className="fn-fn-ts-item-precisao">{precisao}</span>
                    <button
                      className="fn-fn-ts-item-btn"
                      onClick={() => { handleRolar(teste.nome, precisao, 0); onFechar(); }}
                      title={`Rolar ${teste.nome}`}
                    >
                      <i className="fas fa-dice-d20" /> Rolar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Todos os jutsus/poderes do livro ─────────────────────────────────────────
const PODER_COR = {
  "Básico":      "#4a90e2",
  "Ninpou":      "#9b59b6",
  "Doton":       "#8B6914",
  "Fuuton":      "#27ae60",
  "Katon":       "#e05050",
  "Raiton":      "#f1c40f",
  "Suiton":      "#1abc9c",
  "Fuuinjutsu":  "#e67e22",
  "Rasengan":    "#c0392b",
};

const PODERES_ORDEM = ["Básico","Ninpou","Doton","Fuuton","Katon","Raiton","Suiton","Fuuinjutsu","Rasengan"];

const jutsosLivroConfig = [
  { id: "bunshin_no_jutsu", nome: "Bunshin no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento ou Padrão", alcance: "Pessoal", duracao: "Sustentada",
    custo: "1 ou 4", dano: "-", selos: "Sim", req: "",
    desc: "Cria 1 ou 2 clones ilusórios. Não causam dano nem usam jutsus. Pode fintar com os clones (ação padrão, custo 4, Prestidigitação vs Prontidão). Gratuito para todos." },
  { id: "henge_no_jutsu", nome: "Henge no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento", alcance: "Pessoal", duracao: "Sustentada",
    custo: "1", dano: "-", selos: "Sim", req: "",
    desc: "Transforma em outra pessoa, animal ou objeto de mesmo tamanho. Sem teste para usar; quem interagir testa Percepção (Dif 7 + Disfarces) para notar. Gratuito para todos." },
  { id: "kai", nome: "Kai", poder: "Básico", nivel: 0,
    acao: "Padrão", alcance: "Toque", duracao: "Instantânea",
    custo: "= custo do Genjutsu", dano: "-", selos: "Não", req: "",
    desc: "Liberta a si ou outro de um Genjutsu. Testa Espírito ou Inteligência vs dificuldade do genjutsu. Usar em si mesmo sem custo, exige ter notado o genjutsu. Gratuito para todos." },
  { id: "kawarimi_no_jutsu", nome: "Kawarimi no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento (reação)", alcance: "Pessoal", duracao: "Instantânea",
    custo: "1", dano: "-", selos: "Opcional", req: "",
    desc: "1x por cena: evita completamente um ataque trocando de lugar com um objeto próximo. Sem ataque oportuno. Não funciona contra ataques em área ou estando imobilizado. Gratuito para todos." },
  { id: "kinobori", nome: "Kinobori", poder: "Básico", nivel: 0,
    acao: "Livre", alcance: "Pessoal", duracao: "Contínua (1 cena)",
    custo: "1", dano: "-", selos: "Não", req: "",
    desc: "Chakra nos pés permite andar em paredes, tetos e qualquer superfície. Testes só se algo tirar o equilíbrio. Gratuito para todos." },
  { id: "shunshin_no_jutsu", nome: "Shunshin no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento", alcance: "Pessoal", duracao: "Instantânea",
    custo: "1", dano: "-", selos: "Sim", req: "",
    desc: "Movimento super-rápido que parece teleporte. Move até deslocamento máximo. Apenas apresentação — ninjas conseguem acompanhar. Gratuito para todos." },
  { id: "tadayou", nome: "Tadayou", poder: "Básico", nivel: 0,
    acao: "Livre", alcance: "Pessoal", duracao: "Contínua (1 cena)",
    custo: "1", dano: "-", selos: "Não", req: "",
    desc: "Anda sobre água ou qualquer líquido não inflamável/ácido. Testes pelo Espírito apenas se algo tirar o equilíbrio. Gratuito para todos." },
  { id: "canhao", nome: "Canhão", poder: "Ninpou", nivel: 1,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 1",
    desc: "Dispara um ataque em jato contra um alvo usando o elemento. A partir do nível 2, pode ser usado sem custo de chakra mas com dano pela metade e sem bônus de outros efeitos." },
  { id: "criar_arma", nome: "Criar Arma", poder: "Ninpou", nivel: 2,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada ou Permanente",
    custo: "1 (criação)", dano: "ver texto", selos: "Não", req: "Poder Ninpou nível 2",
    desc: "Cria uma arma simples ou marcial (leve, longa, mediana ou de arremesso). Mesmo dano da versão comum. Disponível para Ninpou, Doton e Suiton." },
  { id: "raio", nome: "Raio", poder: "Ninpou", nivel: 2,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 2",
    desc: "Dispara um raio que atinge uma ou mais criaturas em linha reta. Alvos adicionais após o primeiro recebem metade do dano. Disponível para Ninpou e todos os elementos básicos." },
  { id: "orbe", nome: "Orbe", poder: "Ninpou", nivel: 2,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 2",
    desc: "Projétil esférico de 0,5m disparado contra o alvo. Causa dano comum do poder. Evolução Nv7: custa metade do chakra mas sem bônus de outros efeitos ou aptidões." },
  { id: "restringente", nome: "Restringente", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Ver texto",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Ninpou nível 3",
    desc: "Cria uma barreira grossa que restringe o movimento de inimigos. Criaturas dentro da área devem superar teste de Força ou ficam presas. Disponível para Ninpou, Doton, Fuuton e Suiton." },
  { id: "barreira", nome: "Barreira", poder: "Ninpou", nivel: 3,
    acao: "Movimento (reação)", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "", selos: "", req: "Poder Ninpou nível 3",
    desc: "Conjura uma barreira de proteção com dureza padrão do poder. Deve haver espaço entre o usuário e o inimigo para ser criada. Disponível para Ninpou, Doton, Fuuton e Suiton." },
  { id: "flechas", nome: "Flechas", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por projétil", selos: "", req: "Poder Ninpou nível 3",
    desc: "Dispara múltiplos projéteis contra um ou mais alvos. O dano total é dividido entre os projéteis criados. Disponível para Ninpou e todos os elementos básicos." },
  { id: "lanca", nome: "Lança", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Cria um espinho que surge a até 2m e se estica contra o inimigo. Ignora 2 pontos de dureza de barreiras. Pode criar várias lanças para múltiplos alvos dividindo o dano. Disponível para Ninpou, Doton e Suiton." },
  { id: "coluna", nome: "Coluna", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Conjura uma coluna ou pilar de elemento que surge do chão atingindo o alvo. Disponível para Ninpou e todos os elementos básicos." },
  { id: "ricochete", nome: "Ricochete", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Dispara um projétil que ricocheteia em superfícies para atingir alvos em cobertura ou fora da linha de visão direta. Disponível para Ninpou e todos os elementos básicos." },
  { id: "energizar", nome: "Energizar", poder: "Ninpou", nivel: 4,
    acao: "Padrão", alcance: "Pessoal", duracao: "Concentração",
    custo: "3", dano: "ver texto", selos: "Não", req: "Poder Ninpou nível 4",
    desc: "Energiza o próprio punho, uma arma ou compartimento de projéteis. Ao atacar, pode substituir Força/Destreza por Espírito no dano. A arma ganha vantagens e fraquezas do elemento. Disponível para Ninpou, Doton, Fuuton e Suiton." },
  { id: "nuvem", nome: "Nuvem", poder: "Ninpou", nivel: 4,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Ninpou nível 4",
    desc: "Cria uma nuvem com propriedade do elemento (corrosiva, quente, etc.) em formato de cone que se assenta em área circular. Permanece enquanto mantiver concentração. Disponível para Ninpou, Doton, Fuuton e Suiton." },
  { id: "correnteza", nome: "Correnteza", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 5",
    desc: "Lança uma correnteza do elemento empurrando criaturas. Se o alvo sofrer restrição de movimento pelo efeito, causa +1 de dano de concussão. Disponível para Ninpou, Doton, Fuuton e Suiton." },
  { id: "sopro_destrutivo", nome: "Sopro Destrutivo", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 5",
    desc: "Dispara uma onda massiva do elemento em área de cone. Um dos efeitos mais devastadores de área do Ninpou. Disponível para Ninpou e todos os elementos básicos." },
  { id: "missil", nome: "Míssil", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder + bônus", selos: "", req: "Poder Ninpou nível 5",
    desc: "Libera um ou mais mísseis contra o oponente, como projéteis de lama ou rajadas de fogo. Pode combinar com outros efeitos para aumentar o dano. Disponível para Ninpou e todos os elementos básicos." },
  { id: "algemar", nome: "Algemar", poder: "Ninpou", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Ninpou nível 6",
    desc: "Cria algemas ou correntes do elemento que prendem o alvo, impedindo seus movimentos enquanto o usuário mantiver concentração. Disponível para Ninpou, Doton e Suiton." },
  { id: "onda_explosiva", nome: "Onda Explosiva", poder: "Ninpou", nivel: 6,
    acao: "Padrão", alcance: "Pessoal (área)", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 6",
    desc: "Libera uma onda explosiva em meia-esfera ou círculo centrado no usuário. Pode ser uma explosão de fogo, tornado de água ou outras formas conforme o elemento. Disponível para Ninpou e todos os elementos básicos." },
  { id: "imergir", nome: "Imergir", poder: "Doton", nivel: 2,
    acao: "Completa", alcance: "Pessoal", duracao: "Contínua",
    custo: "= nível", dano: "", selos: "", req: "Poder Doton nível 2",
    desc: "Permite ao usuário imergir no solo de terra ou pedra e se mover por dentro dele. Pode reemergir com metade do deslocamento mantendo furtividade. Sentidos não são atrapalhados pelo efeito." },
  { id: "pele_de_pedra", nome: "Pele de Pedra", poder: "Doton", nivel: 6,
    acao: "Movimento", alcance: "Pessoal", duracao: "Instantânea ou Sustentada",
    custo: "= nível", dano: "", selos: "Não", req: "Poder Doton nível 6",
    desc: "Recobre o corpo com uma armadura de pedra que concede dureza corporal. Evolução Nv9: dureza sustentada aumenta para 2 pontos. Não é possível usar Bloqueio contra Soco de Pedra." },
  { id: "tremor", nome: "Tremor", poder: "Doton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Doton nível 6",
    desc: "Causa um tremor no solo que derruba criaturas na área. Alvos devem superar teste de Vigor ou caem. Exclusivo do elemento Doton." },
  { id: "venenoso", nome: "Venenoso", poder: "Fuuton", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Fuuton nível 5",
    desc: "Cria névoa ou fumaça venenosa usando um veneno produzido com a perícia Venefício (até nível II). Não causa dano direto mas injeta o veneno no alvo. O veneno usado é consumido." },
  { id: "afiar", nome: "Afiar", poder: "Fuuton", nivel: 6,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada",
    custo: "= nível", dano: "ver texto", selos: "Não", req: "Poder Fuuton nível 6",
    desc: "Torna uma arma afiada perfurante ou cortante, aumentando sua eficácia. Não pode ser usada em armas naturais ou criadas pelo efeito Criar Arma. Exclusivo do Fuuton." },
  { id: "lamina_de_vento", nome: "Lâmina de Vento", poder: "Fuuton", nivel: 7,
    acao: "Completa", alcance: "5m", duracao: "Instantânea",
    custo: "= nível", dano: "ver texto", selos: "Não", req: "Poder Fuuton nível 7",
    desc: "Emite chakra pelas pontas dos dedos criando lâminas de vento em alta rotação arremessadas repetidamente contra o alvo. As lâminas se desfazem imediatamente após atingir." },
  { id: "meteoros", nome: "Meteoros", poder: "Katon", nivel: 5,
    acao: "Movimento", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "3 + chakra do efeito de combustão", dano: "bônus (ver texto)", selos: "", req: "Poder Katon nível 5",
    desc: "Lança meteoros de fogo na área. Uma criatura ao alcance da explosão de mais de um meteoro recebe o dano de todos. É possível mirar em alvos específicos com -3 de precisão, impedindo defesas de Esquiva." },
  { id: "inflamavel", nome: "Inflamável", poder: "Katon", nivel: 5,
    acao: "Movimento", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "3 + chakra do efeito de combustão", dano: "bônus (ver texto)", selos: "", req: "Poder Katon nível 5",
    desc: "Imbui um efeito de Katon com propriedade inflamável, fazendo alvos ou superfícies pegarem fogo. Combina com outros efeitos de Katon para potencializar o dano por combustão." },
  { id: "lamina_de_raios", nome: "Lâmina de Raios", poder: "Raiton", nivel: 1,
    acao: "Movimento", alcance: "Toque", duracao: "Sustentada (1 ataque)",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Raiton nível 1",
    desc: "Concentra chakra de raio na mão criando uma lâmina elétrica com som característico de pássaros. Altera a natureza do ataque para Raiton e o transforma em descarga elétrica concentrada." },
  { id: "arma_eletrica", nome: "Arma Elétrica", poder: "Raiton", nivel: 4,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada",
    custo: "ver texto", dano: "ver texto", selos: "Não", req: "Poder Raiton nível 4",
    desc: "Carrega uma arma com eletricidade. Em ataque surpresa contra alvo desprevenido, causa no mínimo grau 2 de dano. Abater um capanga com ela permite mantê-la por um ataque adicional." },
  { id: "descarga", nome: "Descarga", poder: "Raiton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder ou toque", duracao: "Instantânea",
    custo: "Padrão do poder", dano: "Metade do dano comum do poder", selos: "", req: "Poder Raiton nível 6",
    desc: "Libera uma descarga elétrica em área ou por toque. O efeito não requer selos de mão. Exclusivo do Raiton." },
  { id: "nevoa", nome: "Névoa", poder: "Suiton", nivel: 2,
    acao: "Padrão", alcance: "1m", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Suiton nível 2",
    desc: "Cria uma névoa densa. Só é possível enxergar perfeitamente criaturas a até 1m; além disso, camuflagem parcial (25% de falha nos ataques). Possui dureza imaginária contra ataques de Katon e Fuuton." },
  { id: "prisao_de_agua", nome: "Prisão de Água", poder: "Suiton", nivel: 3,
    acao: "Padrão", alcance: "1m", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Suiton nível 3",
    desc: "Prende um alvo em uma esfera de água, imobilizando-o. A vítima pode usar ação padrão para testar Força (Dif padrão) ou Vigor (Dif padrão 2) para se libertar pelo restante da cena." },
  { id: "colisao_de_ondas", nome: "Colisão de Ondas", poder: "Suiton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Suiton nível 6",
    desc: "Conjura ondas massivas de água colidindo contra os inimigos. Exclusivo do Suiton." },
  { id: "chakra_no_mesu", nome: "Chakra no Mesu (Bisturi de Chakra)", poder: "Fuuinjutsu", nivel: 1,
    acao: "Padrão", alcance: "Toque", duracao: "Concentração",
    custo: "= nível", dano: "", selos: "Não", req: "Aptidão Ninja Médico; Espírito 6",
    desc: "Cria bisturis de chakra na mão para cirurgias delicadas. Pode fazer cortes internos sem ferida aberta, reduzindo risco de infecção. Requer Ninja Médico e Espírito 6." },
  { id: "shousen_no_jutsu", nome: "Shousen no Jutsu (Mão Mística)", poder: "Rasengan", nivel: 1,
    acao: "Padrão", alcance: "Toque", duracao: "Concentração",
    custo: "= nível", dano: "", selos: "Não", req: "Poder Iryou Ninjutsu nível 7",
    desc: "Técnica médica que envia chakra para ferida ou região afetada, aumentando a capacidade de cura. Trata pelo padrão de cura do poder Iryou Ninjutsu. Requer Iryou Ninjutsu nível 7." },
  { id: "rasengan_basico", nome: "Rasengan Básico", poder: "Rasengan", nivel: 1,
    acao: "Completa", alcance: "Toque", duracao: "Instantânea ou Sustentada",
    custo: "1 por nível do poder", dano: "Nível do Poder + Espírito", selos: "Não", req: "Poder Rasengan nível 1",
    desc: "Bola giratória de chakra na palma da mão. Requer ação completa para preparar e atacar. Pode usar Kage Bunshin para ajudar, reduzindo para ação padrão o ataque." },
  { id: "rasengan_completo", nome: "Rasengan Completo", poder: "Rasengan", nivel: 6,
    acao: "Padrão", alcance: "Toque", duracao: "Instantânea",
    custo: "1 por nível do poder", dano: "Nível do Poder + Espírito", selos: "Não", req: "Poder Rasengan nível 6; Espírito 14 (ou 12 + Chakra Expandido)",
    desc: "Versão aperfeiçoada do Rasengan com maior controle. Apenas ação padrão para preparar e atacar. Requer Rasengan nível 6 e Espírito 14." },
  { id: "oodama_rasengan", nome: "Oodama Rasengan", poder: "Rasengan", nivel: 7,
    acao: "Completa (Padrão + Meta-aptidão)", alcance: "Toque", duracao: "Instantânea",
    custo: "1 por nível do poder", dano: "2 + Nível do Poder + 1/2 Espírito", selos: "Não", req: "Poder Rasengan nível 7; Espírito 16 (ou 14 + Chakra Expandido); aptidão Técnica Poderosa",
    desc: "Rasengan em tamanho surreal (~0,5m). Arremessa o alvo 3m e causa teste de Vigor para não cair. Destrói armas usadas como bloqueio. Requer Rasengan 7, Espírito 16 e Técnica Poderosa." },
  { id: "rasengan_elemental", nome: "Rasengan Elemental", poder: "Rasengan", nivel: 9,
    acao: "Completa", alcance: "Toque", duracao: "Instantânea",
    custo: "2 + 1 por nível do poder", dano: "Área de efeito 10m", selos: "Não", req: "Poder Rasengan nível 9; Poder elemental (Katon/Raiton/Fuuton) nível 2",
    desc: "Rasengan combinado com elemento (Enka Rasengan para Katon, Raiou Rasengan para Raiton, Rasen Shuriken para Fuuton). Dano irresistível mínimo grau 2. Explode atingindo todos a 10m. Causa dano colateral grau 1 ao usuário." },
];

// Verifica se personagem atinge um requisito textual
const verificarRequisito = (req, ficha, poderes) => {
  if (!req) return true;
  const r = req.toLowerCase();
  const aptidoesArr = Array.isArray(ficha?.aptidoes) ? ficha.aptidoes : [];
  const poderesArr  = Array.isArray(poderes) ? poderes : [];
  // Aptidão Ninja Médico
  if (r.includes("ninja médico")) {
    if (!aptidoesArr.some(a => a.nome?.toLowerCase().includes("ninja médico"))) return false;
  }
  // Técnica Poderosa
  if (r.includes("técnica poderosa")) {
    if (!aptidoesArr.some(a => a.nome?.toLowerCase().includes("técnica poderosa"))) return false;
  }
  // Espírito X
  const mEsp = r.match(/espírito\s*(\d+)/);
  if (mEsp) {
    const espNec = parseInt(mEsp[1]);
    const espAtual = parseInt(ficha?.espirito || ficha?.espírito || 0);
    if (espAtual < espNec) return false;
  }
  // Poder X nível Y
  const mPoder = r.match(/poder\s+([\w\s]+?)\s+nível\s*(\d+)/g);
  if (mPoder) {
    for (const mp of mPoder) {
      const m2 = mp.match(/poder\s+([\w\s]+?)\s+nível\s*(\d+)/);
      if (!m2) continue;
      const poderNome = m2[1].trim();
      const nivelNec  = parseInt(m2[2]);
      const poderAtual = poderesArr.find(p => p.nome?.toLowerCase().includes(poderNome.toLowerCase()));
      if (!poderAtual || (parseInt(poderAtual.nivel) || 0) < nivelNec) return false;
    }
  }
  // Iryou Ninjutsu nível Y (sem palavra "poder")
  const mIryou = r.match(/iryou ninjutsu\s+nível\s*(\d+)/);
  if (mIryou) {
    const nivelNec = parseInt(mIryou[1]);
    const poderAtual = poderesArr.find(p => p.nome?.toLowerCase().includes("iryou"));
    if (!poderAtual || (parseInt(poderAtual.nivel) || 0) < nivelNec) return false;
  }
  return true;
};

// Verifica req estruturado dos PODERES_CONFIG (array de objetos)
// req: [{ atr:"INT", val:6 }, { apt:"ninja_medico" }, { per:"ocultismo", val:16 }, { poder:"fuuinjutsu", val:7 }]
const verificarReqPoder = (req, ficha, poderes) => {
  if (!req || req.length === 0) return { ok: true, motivo: null };
  const atr = ficha?.atributos || ficha || {};
  const aptArr = Array.isArray(ficha?.aptidoes) ? ficha.aptidoes : [];
  const perArr = ficha?.pericias || {};
  const podArr = Array.isArray(poderes) ? poderes : [];

  const getNomeAtributo = (key) => ({
    FOR:"forca", AGI:"agilidade", DES:"destreza", VIG:"vigor",
    INT:"inteligencia", ESP:"espirito", PRE:"presenca",
  }[key.toUpperCase()] || key.toLowerCase());

  const motivos = [];
  for (const r of req) {
    if (r.atr) {
      const val = parseInt(atr[getNomeAtributo(r.atr)] || ficha?.[getNomeAtributo(r.atr)] || 0);
      if (val < r.val) motivos.push(`${r.atr} ${r.val}`);
    }
    if (r.apt) {
      const temApt = aptArr.some(a =>
        a.id?.toLowerCase().includes(r.apt.toLowerCase()) ||
        a.nome?.toLowerCase().replace(/\s+/g,"_").includes(r.apt.toLowerCase().replace(/\s+/g,"_"))
      );
      if (!temApt) motivos.push(r.apt.replace(/_/g," "));
    }
    if (r.per) {
      const nomePer = r.per.toLowerCase();
      const valPer = parseInt(perArr[nomePer] || ficha?.pericias?.[nomePer] || 0);
      if (valPer < r.val) motivos.push(`${r.per} ${r.val}`);
    }
    if (r.poder) {
      if (r.poder === "qualquer_elemental") {
        const elementais = ["katon","raiton","fuuton","doton","suiton"];
        const temElemental = elementais.some(id => {
          const p = podArr.find(p => p.id === id);
          return p && (parseInt(p.nivel) || 0) >= r.val;
        });
        if (!temElemental) motivos.push(`Elemento (Katon/Raiton/Fuuton) nível ${r.val}`);
      } else {
        const p = podArr.find(p => p.id === r.poder);
        if (!p || (parseInt(p.nivel) || 0) < r.val) motivos.push(`${r.poder} nível ${r.val}`);
      }
    }
  }
  return motivos.length === 0 ? { ok: true, motivo: null } : { ok: false, motivo: motivos.join(", ") };
};
const ModalLojaJutsus = ({ jutsus, onAdicionar, onFechar, ficha, poderes, pontosRestantes }) => {
  const [busca,      setBusca]      = useState("");
  const [filtroP,    setFiltroP]    = useState("Todos");
  const [expandidos, setExpandidos] = useState({});
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  };

  const jaAdicionado = (id) => jutsus.some(j => j.fromLivro === id);

  const adicionar = (cfg, bloqueado) => {
    if (bloqueado) { mostrarToast("Requisitos não atingidos.", "erro"); return; }
    if (jaAdicionado(cfg.id)) { mostrarToast(`${cfg.nome} já está na lista.`, "erro"); return; }
    const custo = cfg.nivel ?? 0;
    if (custo > 0 && pontosRestantes !== undefined && custo > pontosRestantes) {
      mostrarToast(`Pontos insuficientes — custo ${custo} pt${custo > 1 ? "s" : ""}, restam ${pontosRestantes}.`, "erro");
      return;
    }
    onAdicionar({
      id: Date.now(), fromLivro: cfg.id,
      nome: cfg.nome, tipo: "ninjutsu",
      custo: cfg.custo, alcance: cfg.alcance,
      anotacoes: cfg.desc,
    });
    mostrarToast(`${cfg.nome} adicionado.`);
  };

  const filtrados = jutsosLivroConfig.filter(j => {
    const matchPoder = filtroP === "Todos" || j.poder === filtroP;
    const matchBusca = busca === "" ||
      j.nome.toLowerCase().includes(busca.toLowerCase()) ||
      j.desc.toLowerCase().includes(busca.toLowerCase());
    return matchPoder && matchBusca;
  });

  const tagStyle = (ativo) => ({
    fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "0.6rem", letterSpacing: "0.8px",
    padding: "3px 9px", borderRadius: 3, cursor: "pointer", border: "1px solid",
    background: ativo ? "#4a90e2" : "transparent",
    borderColor: ativo ? "#4a90e2" : "#1a2535",
    color: ativo ? "#fff" : "#555",
    transition: "all 0.15s",
  });

  return (
    <div className="fn-loja-overlay" onClick={onFechar}>
      <div className="fn-loja-modal" onClick={e => e.stopPropagation()}>

        <div className="fn-loja-header">
          <h2 className="fn-loja-titulo">Jutsus do Livro</h2>
          {pontosRestantes !== undefined && (
            <div style={{
              fontSize: "0.72rem", fontFamily: "'Google Sans',sans-serif", letterSpacing: "0.5px",
              padding: "3px 10px", borderRadius: "6px",
              background: pontosRestantes <= 0 ? "#1a0505" : "#051a0d",
              color: pontosRestantes <= 0 ? "#ef4444" : "#22c55e",
              border: `1px solid ${pontosRestantes <= 0 ? "#ef444433" : "#22c55e33"}`,
            }}>
              {pontosRestantes} pt{pontosRestantes !== 1 ? "s" : ""} restante{pontosRestantes !== 1 ? "s" : ""}
            </div>
          )}
          <button className="fn-loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", padding: "8px 16px 0", borderBottom: "1px solid #1a2535", paddingBottom: 10 }}>
          {["Todos", ...PODERES_ORDEM].map(p => (
            <button key={p} style={tagStyle(filtroP === p)} onClick={() => setFiltroP(p)}>{p}</button>
          ))}
        </div>

        <div className="fn-loja-busca-row">
          <i className="fas fa-search fn-loja-busca-icon" />
          <input className="fn-loja-busca-input" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} autoFocus />
        </div>

        {toast && <div className={`fn-loja-toast fn-fn-loja-toast-${toast.tipo}`}>{toast.msg}</div>}

        <div className="fn-loja-lista">
          {filtrados.map(cfg => {
            const bloqueado  = !verificarRequisito(cfg.req, ficha || {}, poderes || []);
            const adicionado = jaAdicionado(cfg.id);
            const exp        = expandidos[cfg.id];
            const poderCor   = PODER_COR[cfg.poder] || "#888";
            const custoP     = cfg.nivel ?? 0;
            const semPts     = custoP > 0 && pontosRestantes !== undefined && custoP > pontosRestantes;
            return (
              <div key={cfg.id} className={`fn-loja-item${adicionado ? " fn-fn-loja-item-max" : ""}${bloqueado ? " fn-fn-loja-item-bloqueado" : ""}`}>
                <div className="fn-fn-loja-item-header" onClick={() => setExpandidos(p => ({ ...p, [cfg.id]: !p[cfg.id] }))}>
                  <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{ color: bloqueado ? "#3a3a3a" : adicionado ? "#555" : "#ccc" }}>{cfg.nome}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 800, color: bloqueado ? "#2a2a2a" : poderCor, border: `1px solid ${bloqueado ? "#222" : poderCor + "55"}`, borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1 }}>{cfg.poder.toUpperCase()}</span>
                      {cfg.nivel > 0 && <span style={{ fontSize: "0.65rem", color: bloqueado ? "#2a2a2a" : "#555", border: "1px solid #1a1a1a", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif" }}>NV {cfg.nivel}</span>}
                      {cfg.poder === "Básico"
                        ? <span style={{ fontSize: "0.65rem", color: bloqueado ? "#2a2a2a" : "#27ae60", border: `1px solid ${bloqueado ? "#222" : "#27ae6044"}`, borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif" }}>GRATUITO</span>
                        : <span style={{ fontSize: "0.65rem", color: semPts ? "#ef4444" : "#b060e0", border: `1px solid ${semPts ? "#ef444433" : "#b060e033"}`, borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{custoP} pt{custoP !== 1 ? "s" : ""}</span>
                      }
                      {adicionado && <span className="fn-loja-badge-max">OK</span>}
                      {bloqueado && !adicionado && <span style={{ fontSize: "0.65rem", color: "#4a1a1a", border: "1px solid #4a1a1a", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 0.5 }}>BLOQUEADO</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      {cfg.custo && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#4a90e2", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.custo} chakra</span>}
                      {cfg.acao  && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#555",   fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.acao}</span>}
                      {cfg.alcance && cfg.alcance !== "Pessoal" && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#555", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.alcance}</span>}
                    </div>
                  </div>
                  {!adicionado && (
                    <button className="fn-fn-loja-item-add"
                      style={{ borderColor: (bloqueado || semPts) ? "#2a2a2a" : "#4a90e2", color: (bloqueado || semPts) ? "#2a2a2a" : "#4a90e2", cursor: (bloqueado || semPts) ? "not-allowed" : "pointer", opacity: (bloqueado || semPts) ? 0.4 : 1 }}
                      title={semPts ? `Pontos insuficientes (custo ${custoP}, restam ${pontosRestantes})` : bloqueado ? "Requisitos não atingidos" : "Adicionar jutsu"}
                      onClick={e => { e.stopPropagation(); adicionar(cfg, bloqueado); }}>
                      <i className="fas fa-plus" />
                    </button>
                  )}
                </div>
                {exp && (
                  <div className="fn-fn-loja-item-corpo">
                    <p className="fn-fn-loja-item-desc" style={{ color: bloqueado ? "#333" : "#777", fontSize: "0.9rem" }}>{cfg.desc}</p>
                    {cfg.req && (
                      <div style={{ marginTop: 6, padding: "5px 8px", background: bloqueado ? "#1a0a0a" : "#0a1628", border: `1px solid ${bloqueado ? "#3a1a1a" : "#1a3050"}`, borderRadius: 4 }}>
                        <span style={{ fontSize: "0.78rem", color: bloqueado ? "#c0392b" : "#4a90e2", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 0.5 }}>
                          {bloqueado ? "BLOQUEADO — " : "Req: "}{cfg.req}
                        </span>
                      </div>
                    )}
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                      {cfg.duracao && <span style={{ fontSize: "0.78rem", color: "#ccc", fontFamily: "'Be Vietnam Pro',sans-serif" }}><strong style={{ color: "#4a90e2" }}>Duração</strong>: {cfg.duracao}</span>}
                      {cfg.selos   && <span style={{ fontSize: "0.78rem", color: "#ccc", fontFamily: "'Be Vietnam Pro',sans-serif" }}><strong style={{ color: "#4a90e2" }}>Selos de Mão</strong>: {cfg.selos}</span>}
                      {cfg.dano && cfg.dano !== "-" && <span style={{ fontSize: "0.78rem", color: "#ccc", fontFamily: "'Be Vietnam Pro',sans-serif" }}><strong style={{ color: "#4a90e2" }}>Dano</strong>: {cfg.dano}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtrados.length === 0 && <p className="fn-loja-vazio">Nenhum jutsu encontrado.</p>}
        </div>
      </div>
    </div>
  );
};

const TIPO_JUTSU_COR = {
  ninjutsu: "#4a90e2",
  taijutsu: "#e05050",
  genjutsu: "#9b59b6",
  fuinjutsu: "#f39c12",
  kenjutsu: "#e74c3c",
  senjutsu: "#27ae60",
  outro: "#888",
};

// ── Efeitos do Ninpou (e poderes elementais) ────────────────────────────────
// nivelMin: nível mínimo do poder para escolher este efeito
// evolucoesEm: níveis onde pode ser escolhido novamente para evoluir
const PODERES_CONFIG = [
  {
    id: "ninpou", nome: "Ninpou", cor: "#9b59b6",
    desc: "Poder base de ninjutsu. Determina alcance dos jutsus e custo base de chakra. A cada nível você ganha ou evolui um Efeito (Canhão, Raio, Orbe, etc.). Dano base = nível usado + ½ Espírito.",
    niveis: [
      { n:1, info:"Tier 1 — desbloqueia Canhão",
        detalhe:"Alcance: Curto (10m + 2m/ESP). Você ganha o Efeito Canhão: disparo em jato contra 1 alvo, dano 2 por nível usado. A partir do nível 2 pode usar o Canhão sem custo de chakra com dano pela metade." },
      { n:2, info:"Tier 2 — desbloqueia Criar Arma, Raio, Orbe",
        detalhe:"Alcance: Médio. Novos efeitos disponíveis:\n• Criar Arma (Parcial, Pessoal): cria arma simples ou marcial sustentada.\n• Raio (Padrão): atinge criaturas em linha reta; alvos além do primeiro recebem metade do dano.\n• Orbe (Padrão): projétil esférico de 0,5m, dano comum do poder." },
      { n:3, info:"Tier 3 — desbloqueia Restringente, Barreira, Flechas, Lança, Coluna, Ricochete",
        detalhe:"Novos efeitos disponíveis:\n• Restringente: barreira grossa que prende inimigos (teste de Força para escapar).\n• Barreira (reação): proteção com dureza padrão do poder.\n• Flechas: múltiplos projéteis, dano 2 por projétil.\n• Lança: espinho que surge a 2m, ignora 2 de dureza de barreiras.\n• Coluna: pilar que surge do chão, dano 2 por nível.\n• Ricochete: projétil que ricocheteia em superfícies." },
      { n:4, info:"Tier 4 — desbloqueia Energizar, Nuvem",
        detalhe:"Alcance: Longo (15m + 3m/ESP). Novos efeitos:\n• Energizar (Parcial, Concentração, custo 3): energiza punho ou arma com o elemento; substitui FOR/DES por ESP no dano.\n• Nuvem (Padrão, Concentração): cone de névoa com propriedade do elemento que se assenta em área circular." },
      { n:5, info:"Tier 5 — desbloqueia Correnteza, Sopro Destrutivo, Míssil",
        detalhe:"Novos efeitos disponíveis:\n• Correnteza: empurra criaturas; +1 dano de concussão se restringido.\n• Sopro Destrutivo: onda massiva em cone — um dos mais devastadores de área.\n• Míssil: um ou mais mísseis contra o oponente; combina com outros efeitos para mais dano." },
      { n:6, info:"Tier 6 — desbloqueia Algemar, Onda Explosiva",
        detalhe:"Alcance: Extremo. Domínio máximo do poder. Novos efeitos:\n• Algemar (Padrão, Concentração): correntes que prendem completamente o alvo enquanto concentrado.\n• Onda Explosiva (Padrão, área): explosão em meia-esfera ou círculo centrado no usuário." },
    ],
  },
  {
    id: "doton", nome: "Doton", cor: "#8B6914",
    desc: "Elemento Terra. Alcance Curto (5m +1m/ESP). Toda criação tem +2 de dureza adicional. Efeitos exclusivos: Imergir (nível 2), Tremor e Pele de Pedra (nível 6).",
    niveis: [
      { n:1, info:"Tier 1 — +1 dano de Doton", detalhe:"Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n:2, info:"Tier 2 — desbloqueia Imergir",
        detalhe:"• Imergir (Completa, Contínua, Pessoal): funde-se com terra/pedra natural ou criada por Criação Livre/Barreira. Recebe Perito em Furtividade; não pode se mover; visão limitada a 10m. Sair é ação de movimento.\n• Falsa Decapitação: Agarrar furtivo em alvo acima — alvo fica com cabeça de fora (impedido, Força/Escapar Dif 10).\n• Evolução Imergir Nv4: move-se com metade do deslocamento enquanto imerso, sem perder furtividade." },
      { n:3, info:"Tier 3 — +1 dano de Doton", detalhe:"Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n:4, info:"Tier 4 — +1 dano de Doton", detalhe:"Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n:5, info:"Tier 5 — +1 dano de Doton", detalhe:"Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n:6, info:"Tier 6 — desbloqueia Tremor e Pele de Pedra",
        detalhe:"• Tremor (Padrão, Instantânea, círculo 2m): chão treme, criaturas fazem defesa ou ficam caídas. Evolução Nv4: círculo = diâmetro comum do poder.\n• Pele de Pedra (Movimento, Pessoal): dureza de corpo = padrão +2 até fim do turno. Sustentada: 1 de dureza. Pode usar como defesa (teste LM). Soco de Pedra: sustenta Energizar como ação livre — socos causam 4 de dano letal.\n• Evolução Pele de Pedra Nv9: dureza sustentada = 2. Bloqueio não funciona contra Soco de Pedra." },
    ],
  },
  {
    id: "fuuton", nome: "Fuuton", cor: "#27ae60",
    desc: "Elemento Vento. Alcance Médio (10m +2m/ESP). +2 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Barreira, Coluna, Flechas, Sopro Destrutivo, Raio, Nuvem, Energizar, Míssil, Onda Explosiva, Ricochete, Correnteza. Exclusivos: Venenoso (nível 5), Afiar (nível 6), Lâmina de Vento (nível 7).",
    niveis: [
      { n:1, info:"Tier 1 — +1 dano de Fuuton", detalhe:"Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n:2, info:"Tier 2 — +1 dano de Fuuton", detalhe:"Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n:3, info:"Tier 3 — +1 dano de Fuuton", detalhe:"Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n:4, info:"Tier 4 — +1 dano de Fuuton", detalhe:"Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n:5, info:"Tier 5 — desbloqueia Venenoso",
        detalhe:"• Venenoso (Padrão, cone, Instantânea): cria névoa ou fumaça venenosa com veneno fabricado (Venefício, até nível II). Não causa dano direto — injeta o veneno no alvo. O veneno é consumido." },
      { n:6, info:"Tier 6 — desbloqueia Afiar",
        detalhe:"• Afiar (Req. Energizar, Parcial, Sustentada, Pessoal): torna arma cortante ou perfurante real mais eficaz. Não funciona em armas naturais ou criadas por Criar Arma.\n  – Fio melhorado: ignora 1 ponto de dureza. Arma comum que bloqueie ou seja bloqueada é destruída (exceto se energizada — vira Sucesso Automático).\n  – Crítico melhorado: margem de crítico +1.\n  – Lâmina Estendida: lâmina de chakra até 30cm maior. Teste resistido ESP vs Prontidão — se ganhar: alvo sofre −1 nas defesas.\n  – Shuriken Estendida: igual à Lâmina Estendida, para até 3 shurikens; dano base das 3 = dano comum do poder." },
      { n:7, info:"Tier 7 — desbloqueia Lâmina de Vento",
        detalhe:"• Lâmina de Vento (Req. Energizar, Completa, alcance 5m, Instantânea): cria e arremessa lâminas de vento quase invisíveis. 1 lâmina por nível usado, cada uma causa 1 de dano base (+2 do elemento = 3 total). Não recebe outros bônus de dano.\n  – Alvo testa Prontidão antes da defesa: se falhar, é considerado fintado. Visão de chakra/Kagura Shingan = sucesso automático. Outros sensores de chakra: Dif −2.\n  – Evolução Nv10: alvo que falha em Prontidão fica desprevenido." },
    ],
  },
  {
    id: "katon", nome: "Katon", cor: "#e05050",
    desc: "Elemento Fogo. Alcance Médio (10m +2m/ESP). Tamanho: 2m por nível de ESP. +2 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Flechas, Coluna, Sopro Destrutivo, Raio, Energizar, Míssil, Onda Explosiva, Ricochete. Exclusivos: Inflamável (nível 5), Meteoros (nível 9).",
    niveis: [
      { n:1, info:"Tier 1 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:2, info:"Tier 2 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:3, info:"Tier 3 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:4, info:"Tier 4 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:5, info:"Tier 5 — desbloqueia Inflamável",
        detalhe:"• Inflamável (Movimento, círculo diâmetro comum, custo 3 + chakra da combustão): cria líquido/névoa/gás inflamável. Não causa dano sozinho. Com ação padrão, usa Canhão Katon ou Raiton para gerar combustão: explosão com dano do Canhão +2. Não permite meta-aptidões.\n• Evolução Nv8: pode usar qualquer efeito Katon ou Raiton de duração instantânea e alcance comum para criar a combustão, mantendo suas propriedades." },
      { n:6, info:"Tier 6 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:7, info:"Tier 7 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:8, info:"Tier 8 — +1 dano de Katon", detalhe:"Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n:9, info:"Tier 9 — desbloqueia Meteoros",
        detalhe:"• Meteoros (Completa, 6 esferas de 5m de diâmetro): cada meteoro causa 1 de dano fixo por nível usado (sem dano base nem bônus). Criatura atingida por mais de um recebe o dano de todos.\n  – Mirar em criaturas específicas: −3 precisão; alvo não pode usar Esquiva ou Antecipar." },
    ],
  },
  {
    id: "raiton", nome: "Raiton", cor: "#f1c40f",
    desc: "Elemento Trovão. Alcance Longo (15m +3m/ESP). Tamanho: 0,5m por nível de ESP. +1 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Coluna, Flechas, Sopro Destrutivo, Raio, Energizar, Míssil, Onda Explosiva, Ricochete, Meteoros. Exclusivos: Lâmina de Raios (nível 2), Arma Elétrica (nível 4), Descarga (nível 6).",
    niveis: [
      { n:1, info:"Tier 1 — +1 dano de Raiton", detalhe:"Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      { n:2, info:"Tier 2 — desbloqueia Lâmina de Raios",
        detalhe:"• Lâmina de Raios (Req. ESP 8, Movimento, Sustentada 1 ataque, toque): concentra chakra elétrico na mão (chiado de pássaros). Ataque CC, dano comum do poder, ignora 1 dureza. Destrói arma que bloqueie (exceto Fuuton/Raiton Energizados).\n  – Ataque surpresa em desprevenido: mínimo grau 2. Alvo testa Prontidão para notar o ruído.\n  – Abater capanga: mantém por +1 ataque.\n  – Evolução Nv5: preparar vira Ação Parcial. Pode usar Investida (+2 dano, +1/nível seguinte), mas abre guarda para ataque oportuno se alvo se defender.\n  – Evolução Nv7: ignora qualquer dureza (exceto Fuuton = integral; Raiton = metade).\n  – Evolução Nv9: ganha Crítico Aprimorado para este efeito (cumulativo com Domínio do Raio)." },
      { n:3, info:"Tier 3 — +1 dano de Raiton", detalhe:"Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      { n:4, info:"Tier 4 — desbloqueia Arma Elétrica",
        detalhe:"• Arma Elétrica (Req. Lâmina de Raios, Parcial, Sustentada, sem selos):\n  – Energizar [custo 3]: usa efeito Energizar em armas de corte e perfuração.\n  – Criar Projéteis [custo 1]: cria armas de arremesso de eletricidade. Duram até início do próximo turno.\n  – Criar Lâmina [custo 4]: lâmina de espada curta na mão, dano = Energizar, ignora 1 dureza. Pode estender até 5m (ação padrão, CC ou CD); volta ao normal após o ataque.\n  – Evolução Nv8: arma comum que bloqueie seu ataque é destruída (exceto Energizado, exceto Doton — vira Sucesso Automático)." },
      { n:5, info:"Tier 5 — +1 dano de Raiton", detalhe:"Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      { n:6, info:"Tier 6 — desbloqueia Descarga",
        detalhe:"• Descarga (Padrão, meia-esfera ou círculo, ou toque/projétil): dano = metade do dano comum do poder. Se causar qualquer dano: alvo testa Vigor (Dif padrão −3) ou fica atordoado até fim do próximo turno.\n  – Concentrada em projétil ou descarga corporal via Energizar/Arma Elétrica: Dif do Vigor +1. Feita via Energizar: sem selos de mão." },
    ],
  },
  {
    id: "suiton", nome: "Suiton", cor: "#1abc9c",
    desc: "Elemento Água. Alcance Médio (10m +2m/ESP). Tamanho: 1m por nível de ESP. Sem dano adicional. Efeitos: todos os do Ninpou + Inflamável, Venenoso, Imergir. Exclusivos: Névoa (nível 2), Prisão de Água (nível 3), Colisão de Ondas (nível 6).",
    niveis: [
      { n:1, info:"Tier 1 — +1 dano de Suiton", detalhe:"Cada nível de Suiton aumenta o dano base dos seus ataques em +1." },
      { n:2, info:"Tier 2 — desbloqueia Névoa",
        detalhe:"• Névoa (Req. Lutar às Cegas ou sensor, Padrão, Sustentada, círculo 30m+3m/ESP): visão perfeita apenas até 1m. Criaturas além: camuflagem parcial (25% falha). Dureza imaginária padrão do poder (Katon/Fuuton dissipam).\n  – Evolução Nv5: criaturas até 1m têm camuflagem parcial; além disso = camuflagem total (50% falha, não pode usar visão para localizar)." },
      { n:3, info:"Tier 3 — desbloqueia Prisão de Água",
        detalhe:"• Prisão de Água (Padrão, alcance 1m, Concentração): redoma de água prende o alvo (CD a 1m, −3 precisão). Alvo paralisado mas pode respirar. Dureza = metade do dano comum. Restaura dureza com nova ação/chakra sem novo teste.\n  – Alvo pode usar ação padrão para testar Força (Dif padrão) ou Vigor (Dif padrão −2) e ganhar mobilidade pelo restante da cena.\n  – Golpe de misericórdia: prisão absorve e se desfaz; dano remanescente que superar a dureza ainda é sofrido (Sucesso Automático, rola 2 dados de grau).\n  – Pode prender múltiplos alvos via clones de água (Mizu Bunshin). Sem meta-aptidões.\n  – Evolução Nv9: prisão preenchida com água — alvo sofre sufocamento (Dif padrão −2). Via Mizu Bunshin: duração sustentada." },
      { n:4, info:"Tier 4 — +1 dano de Suiton", detalhe:"Cada nível de Suiton aumenta o dano base dos seus ataques em +1." },
      { n:5, info:"Tier 5 — +1 dano de Suiton", detalhe:"Cada nível de Suiton aumenta o dano base dos seus ataques em +1." },
      { n:6, info:"Tier 6 — desbloqueia Colisão de Ondas",
        detalhe:"• Colisão de Ondas (Padrão, onda tamanho comum, Concentração): 10 de dano base. Construções sofrem dano dobrado. Pode manter por concentração (½ chakra/turno): falhar na defesa = capturado pelas ondas. Capturado: ação de movimento + teste Atletismo para voltar à superfície, ou sofre sufocamento (dano fixo = dano base). Ação padrão: sobe sem teste.\n  – Pode continuar atacando novos alvos enquanto concentrado (novo teste de acerto). Alvos submersos não são afetados.\n  – Evolução Nv8: Dano Base 14.\n  – Evolução Nv10: Dano Base 18; vítima não pode mais usar ação padrão para nadar sem testes." },
    ],
  },
  {
    id: "fuuinjutsu", nome: "Fuuinjutsu", cor: "#e67e22",
    req: [{ atr: "INT", val: 6 }],
    desc: "Req. Inteligência 6. Alcance: Toque. Permite selar objetos, jutsus, criar armadilhas e barreiras de chakra. Níveis: Selo de Armazenamento (1), Armazenamento Maior (2), Misshi (3), Bakudan (4), Gensou no In (5), Ninjutsu no Wana (6), Chakra no Souin (7), Kekkai no In (8).",
    niveis: [
      { n:1, info:"Tier 1 — Selo de Armazenamento",
        detalhe:"• Selo de Armazenamento (1 rodada, Permanente): sela até 3 compartimentos de itens, ou jutsus de até 3 chakra, em um Pergaminho de Jutsus (10 Ryos, 1 compartimento). Custo: 1 chakra por compartimento ao armazenar/retirar.\n  – Jutsus: armazena qualquer jutsu de duração contínua/permanente à distância (não toque/pessoal, não sustentado/concentração). Custo: 1 + chakra do jutsu. Ao liberar: paga chakra novamente.\n  – Liberar em combate: ação equivalente ao item/jutsu. Jutsus sempre precisam de selos de mão ao liberar.\n  – Pode usar contra inimigos com CD próprio. Pode selar Hijutsu (só quem tem o mesmo pode usar)." },
      { n:2, info:"Tier 2 — Selo de Armazenamento Maior",
        detalhe:"• Selo de Armazenamento Maior: expande para 6 compartimentos, ou até 1+nível chakra elemental. Com nível 3: armazena objeto de tamanho médio (todos os compartimentos). Com nível 5: tamanho grande. Demais regras iguais ao nível 1." },
      { n:3, info:"Tier 3 — Misshi (Mensageiro)",
        detalhe:"• Misshi (Padrão, custo 3, Permanente até reprodução): ativa selo avançado e grava mensagem de até 20 palavras. Escolhe assinatura de chakra do destinatário para ativar. Quando a criatura certa tocar o selo, a mensagem é reproduzida e o selo se destrói. Usuário sabe imediatamente quando reproduzida." },
      { n:4, info:"Tier 4 — Bakudan (Bomba de Selo)",
        detalhe:"• Bakudan (Padrão, Permanente, custo 1/tarja + ½ nível na ativação): cria tarjas explosivas customizadas. Explosão: esfera de 2m de diâmetro por nível do poder, 2 de dano por nível usado. Dif dos testes dos alvos: 9 + 2× nível do poder.\n  – Pode usar meta-aptidões (ex: Potencializar — gasta ação de movimento no momento da explosão).\n  – Pode criar armadilhas com Mecanismos. Dano máximo limitado pelas regras de armadilha." },
      { n:5, info:"Tier 5 — Gensou no In (Selo de Ilusão)",
        detalhe:"• Gensou no In (Padrão, custo 5, Permanente): cria ilusão de objeto(s) ou criatura(s) no local do selo. Tamanho: até 1m por nível de Inteligência. Só é identificada ao interagir (não pode ser cancelada por Kai). Quando o selo é removido/destruído, a ilusão desaparece." },
      { n:6, info:"Tier 6 — Ninjutsu no Wana (Armadilha de Ninjutsu)", req: [{ per: "mecanismos", val: 10 }],
        detalhe:"• Ninjutsu no Wana (Req. Mecanismos 10, 1 rodada, custo 4 + chakra do jutsu, Permanente): armadilha que lança um ninjutsu selado (poder/efeito nível máximo 8, alcance à distância, não restrito). Teste de CD ao criar fica registrado. Área do efeito vira cone a partir do selo; precisão −1.\n  – Primeira criatura que passar pela área sofre a técnica. Não pode ser desarmada (apenas dissipada pelo criador ou forçada).\n  – Detectar: Procurar/Prontidão Dif 7 + 2× nível do poder (só criaturas com Ocultismo ou Fuuinjutsu têm direito)." },
      { n:7, info:"Tier 7 — Chakra no Souin (Contenção de Chakra)", req: [{ poder: "fuuinjutsu", val: 7 }],
        detalhe:"• Chakra no Souin (Req. Fuuinjutsu 7, Completa, Permanente, círculo 1m/INT): selo de absorção de chakra. Ao ativar: chakra do usuário cai para 1 (precisa ter pelo menos 15 antes). Todo ser sobre a área perde 2 chakra/turno. Não afeta a mesma assinatura do criador. Não reduz chakra abaixo de 1." },
      { n:8, info:"Tier 8 — Shishou Fuuin (Selo dos Quatro Símbolos)", req: [{ per: "ocultismo", val: 16 }],
        detalhe:"• Shishou Fuuin (Req. Ocultismo 16, 3 dias, alcance 20m, custo 16, Permanente): sela uma Bijuu em pessoa ou objeto especial. Ritual com mín. 10 pessoas; qualquer perturbação cancela e reinicia. Bijuu selada em grande pote por até 10 anos, ou em pessoa (vira Jinchuuriki). Pode ser feito instantaneamente no final do Shiki Fuujin." },
      { n:9, info:"Tier 9 — Keiyaku Fuuin (Selo Anticontrato)", req: [{ per: "ocultismo", val: 16 }],
        detalhe:"• Keiyaku Fuuin (Req. Ocultismo 16, Padrão, Toque, custo 8, Permanente): usada sobre usuário do Mangekyou Sharingan que controlou uma Bijuu via Hipnose Sharingan. Por toque, cancela imediatamente o controle dele sobre a Bijuu. Sem testes adicionais além do teste de toque." },
      { n:10, info:"Tier 10 — Shiki Fuujin (Selamento do Demônio da Morte)", req: [{ per: "ocultismo", val: 20 }],
        detalhe:"• Shiki Fuujin (Req. Ocultismo 20, Padrão, Longo 75m, custo 10, Permanente): invoca o Shinigami para selar a alma do alvo junto com a do usuário — ambos morrem.\n  – Preparação (1 turno): alma do usuário suspensa atrás dele; Shinigami aparece somente para o invocador.\n  – Próximo turno: usuário projeta braços do Shinigami e agarra o alvo (alcance máximo, sucesso automático). Alvo fica indefeso e imóvel.\n  – Selamento completo: dura até o início do turno seguinte; teste de Concentração se sofrer dano.\n  – Selamento parcial: ação parcial, sela membros; alvo fica impossibilitado desses membros e exausto permanentemente (Medicina 16 + Ocultismo 16 para aliviar por 1 dia).\n  – Mais alvos: 1 clone verdadeiro = +1 alvo (máx 2 adicionais).\n  – Após o selamento: usuário vive mais 5 minutos, então ambas as almas são consumidas pelo Shinigami. Não podem ser revividas." },
    ],
  },
  {
    id: "rasengan", nome: "Rasengan", cor: "#c0392b",
    req: [{ atr: "ESP", val: 8 }],
    desc: "Req. Espírito 8. Bola giratória de chakra na palma da mão. Ataque CC por toque. Destrói armas usadas como bloqueio. Sem meta-aptidões. Desbloqueios: Rasengan Completo (nível 6), Oodama Rasengan (nível 7), Rasengan Elemental (nível 9).",
    niveis: [
      { n:1, info:"Tier 1 — Rasengan Básico",
        detalhe:"• Rasengan Básico (Req. ESP 8, Completa, Toque, custo 1/nível): dano = 2 + nível + ½ESP. Arremessa alvo 3m; Vigor (Dif 7 + nível + ½ESP) ou cai. Destrói arma de bloqueio.\n  – Com Kage Bunshin: clone usa ação de movimento, você ataca com ação padrão.\n  – Pode manter sustentado com ação parcial (sem atacar no mesmo turno)." },
      { n:2, info:"Tier 2 — +1 dano de Rasengan", detalhe:"Cada nível de Rasengan aumenta o dano base do Rasengan em +1." },
      { n:3, info:"Tier 3 — +1 dano de Rasengan", detalhe:"Cada nível de Rasengan aumenta o dano base do Rasengan em +1." },
      { n:4, info:"Tier 4 — +1 dano de Rasengan", detalhe:"Cada nível de Rasengan aumenta o dano base do Rasengan em +1." },
      { n:5, info:"Tier 5 — +1 dano de Rasengan", detalhe:"Cada nível de Rasengan aumenta o dano base do Rasengan em +1." },
      { n:6, info:"Tier 6 — Rasengan Completo", req: [{ atr: "ESP", val: 14, ou: [{ atr: "ESP", val: 12, apt: "chakra_expandido" }] }],
        detalhe:"• Rasengan Completo (Req. Rasengan 6 + ESP 14 ou 12 + Chakra Expandido, Padrão, custo 1/nível): prepara e ataca com apenas Ação Padrão. Dano = nível + ESP (maior que o básico).\n  – Pode ainda usar com Kage Bunshin; clone usa ação livre." },
      { n:7, info:"Tier 7 — Oodama Rasengan", req: [{ atr: "ESP", val: 16, ou: [{ atr: "ESP", val: 14, apt: "chakra_expandido" }] }, { apt: "tecnica_poderosa" }],
        detalhe:"• Oodama Rasengan (Req. Rasengan 7 + ESP 16 ou 14 + Chakra Expandido + Técnica Poderosa, Completa): aplica Técnica Poderosa para aumentar o dano. Esfera de ~0,5m. Teste para não cair recebe +1 de dificuldade." },
      { n:8, info:"Tier 8 — +1 dano de Rasengan", detalhe:"Cada nível de Rasengan aumenta o dano base do Rasengan em +1." },
      { n:9, info:"Tier 9 — Rasengan Elemental", req: [{ poder: "qualquer_elemental", val: 2 }],
        detalhe:"• Rasengan Elemental (Req. Rasengan 9 + Elemento nível 2, Completa, custo 2 + 1/nível): Katon = Enka Rasengan; Raiton = Raiōu Rasengan; Fuuton = Rasen Shuriken. Mesmo funcionamento do Rasengan Completo.\n  – Adquire vantagens/desvantagens do elemento (sem bônus de dano).\n  – Dano irresistível: mín. grau 2 no alvo direto.\n  – Explode após atingir: todos a 10m recebem dano (sem grau mínimo).\n  – Dano colateral: usuário sofre dano base com grau 1.\n  – Senpou Rasengan: gasta 1 chakra Senjutsu extra para transformar em ataque à distância (CD, alcance comum do elemento). Sem dano colateral." },
    ],
  },
  {
    id: "iryou", nome: "Iryou Ninjutsu", cor: "#2ecc71",
    req: [{ apt: "ninja_medico" }, { atr: "ESP", val: 6 }],
    desc: "Req. Ninja Médico + Espírito 6. Cura por toque: nível + ½ Medicina por turno. Curar a si mesmo: metade (superado no nível 4). Desbloqueios: Chakra no Mesu e In'yu Shōmetsu (nível 6), Shousen no Jutsu (nível 7).",
    niveis: [
      { n:1, info:"Tier 1 — Iryou Ninjutsu (cura base)",
        detalhe:"• Cura (Padrão para iniciar, Concentração, Toque, custo = nível usado): ambos devem estar imóveis. Recupera Vit = nível + ½ Medicina (arredondado para cima) por turno. +1 com Perito: Medicina, +1 com Perícia Inata: Medicina.\n  – Sangramento ou tecidos cortados pelo bisturi: curados no 1º turno de tratamento.\n  – Curar a si mesmo: cura apenas metade dos pontos. Superado no nível 4." },
      { n:2, info:"Tier 2 — +1 cura de Iryou Ninjutsu", detalhe:"Cada nível de Iryou Ninjutsu aumenta a cura base em +1 por turno de tratamento." },
      { n:3, info:"Tier 3 — +1 cura de Iryou Ninjutsu", detalhe:"Cada nível de Iryou Ninjutsu aumenta a cura base em +1 por turno de tratamento." },
      { n:4, info:"Tier 4 — +1 cura de Iryou Ninjutsu (cura a si mesmo sem penalidade)", detalhe:"A partir do nível 4, o usuário pode curar a si mesmo sem a penalidade de metade dos pontos. Além disso, cada nível aumenta a cura base em +1 por turno." },
      { n:5, info:"Tier 5 — +1 cura de Iryou Ninjutsu", detalhe:"Cada nível de Iryou Ninjutsu aumenta a cura base em +1 por turno de tratamento." },
      { n:6, info:"Tier 6 — Chakra no Mesu + In'yu Shōmetsu", req: [{ apt: "perito_medicina" }, { apt: "pericia_inata_medicina" }],
        detalhe:"• Chakra no Mesu / Bisturi de Chakra (Req. Iryou 6, Movimento, Sustentada, Pessoal): cria duas lâminas de chakra. Ataque de toque, dano letal 2/nível, pode usar Ataque Múltiplo. Sem Bloqueio desarmado contra ele. Atingido 3×: Vigor (Dif 7 + nível + ½ Medicina) ou lento e debilitado por 2 meses.\n• In'yu Shōmetsu (Req. Iryou 6 + Perito + Perícia Inata: Medicina, Movimento, Instantânea, Pessoal, custo 1/2 Vit curada): cura dano de 1 ataque instantaneamente. Não funciona contra críticos nem ataques em área. Apenas 1× por dia." },
      { n:7, info:"Tier 7 — Shousen no Jutsu (Mão Mística)",
        detalhe:"• Shousen no Jutsu (Req. Iryou 7, Padrão, Concentração, Toque, sem selos): envia chakra para ferida/região afetada, curando pela taxa padrão do poder.\n  – Ofensivo: envia chakra em excesso para desordenar a circulação do alvo. Vigor (Dif 7 + nível + ½ Medicina) ou atordoado até fim do próximo turno. Falha crítica: repete o teste; nova falha = inconsciente." },
    ],
  },
];

// ── Modal de seleção de efeito ao comprar/evoluir Ninpou ─────────────────────
const PODERES_COM_EFEITOS = ["ninpou","doton","fuuton","katon","raiton","suiton"];


// ── Modal Loja de Poderes ─────────────────────────────────────────────────────
const ModalLojaPoderes = ({ poderes, onComprar, onFechar, pontosRestantes, ficha = {} }) => {
  const [expandidos, setExpandidos] = useState({});
  const [niveisExpandidos, setNiveisExpandidos] = useState({});
  const [busca,      setBusca]      = useState("");
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2500);
  };

  const nivelAtual = (id) => poderes.find(p => p.id === id)?.nivel ?? 0;

  const comprar = (cfg, nivel, nivelCfg) => {
    const reqPoder = verificarReqPoder(cfg.req, ficha, poderes);
    if (!reqPoder.ok) {
      mostrarToast(`Requisito não atingido: ${reqPoder.motivo}`, "erro"); return;
    }
    if (nivelCfg?.req) {
      const reqNivel = verificarReqPoder(nivelCfg.req, ficha, poderes);
      if (!reqNivel.ok) {
        mostrarToast(`Requisito para este nível: ${reqNivel.motivo}`, "erro"); return;
      }
    }
    const atual = nivelAtual(cfg.id);
    // Para poderes com efeitos, o custo real é sempre 1 (compra nível por vez)
    const custo = nivel - atual;
    if (!PODERES_COM_EFEITOS.includes(cfg.id) && pontosRestantes !== undefined && custo > pontosRestantes) {
      mostrarToast(`Pontos insuficientes — precisas de ${custo} pt${custo > 1 ? "s" : ""}, restam ${pontosRestantes}.`, "erro");
      return;
    }
    if (PODERES_COM_EFEITOS.includes(cfg.id) && nivel > atual) {
      // Compra o próximo nível sequencialmente (atual + 1), sem modal de seleção
      const proximoNivel = atual + 1;
      if (pontosRestantes !== undefined && proximoNivel - atual > pontosRestantes) {
        mostrarToast(`Pontos insuficientes — restam ${pontosRestantes}.`, "erro");
        return;
      }
      onComprar({ id: cfg.id, nome: cfg.nome, nivel: proximoNivel });
      mostrarToast(`${cfg.nome} nível ${proximoNivel} adquirido! (−1 pt)`);
      return;
    }
    onComprar({ id: cfg.id, nome: cfg.nome, nivel });
    mostrarToast(`${cfg.nome} nível ${nivel} adquirido! (−${custo} pt${custo > 1 ? "s" : ""})`);
  };

  const toggleNivel = (poderId, n) => {
    const key = `${poderId}-${n}`;
    setNiveisExpandidos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filtrados = PODERES_CONFIG.filter(p =>
    busca === "" ||
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.desc.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="fn-loja-overlay" onClick={onFechar}>
      <div className="fn-loja-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fn-loja-header">
          <h2 className="fn-loja-titulo">Poderes</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {pontosRestantes !== undefined && (
              <span style={{
                fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "0.65rem", fontWeight: 800,
                color: pontosRestantes <= 0 ? "#ef4444" : "#22c55e",
                background: pontosRestantes <= 0 ? "#1a0505" : "#051a0d",
                border: `1px solid ${pontosRestantes <= 0 ? "#ef444433" : "#22c55e33"}`,
                borderRadius: 4, padding: "3px 10px", letterSpacing: "0.5px",
              }}>
                {pontosRestantes} pt{pontosRestantes !== 1 ? "s" : ""} restante{pontosRestantes !== 1 ? "s" : ""}
              </span>
            )}
            <button className="fn-loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
          </div>
        </div>

        {/* Busca */}
        <div className="fn-loja-busca-row">
          <i className="fas fa-search fn-loja-busca-icon" />
          <input className="fn-loja-busca-input" placeholder="Buscar poder..." value={busca} onChange={e => setBusca(e.target.value)} autoFocus />
        </div>

        {toast && <div className={`fn-loja-toast fn-fn-loja-toast-${toast.tipo}`}>{toast.msg}</div>}

        {/* Lista de poderes */}
        <div className="fn-loja-lista">
          {filtrados.map(cfg => {
            const atual = nivelAtual(cfg.id);
            const exp   = expandidos[cfg.id];
            const cor   = cfg.cor;
            const reqPoderCheck = verificarReqPoder(cfg.req, ficha, poderes);
            const poderBloqueado = !reqPoderCheck.ok;

            return (
              <div key={cfg.id} className={`fn-loja-item${poderBloqueado ? " fn-fn-loja-item-bloqueado" : ""}`}>
                {/* Header do poder — clicável */}
                <div
                  className="fn-fn-loja-item-header"
                  onClick={() => setExpandidos(p => ({ ...p, [cfg.id]: !p[cfg.id] }))}
                >
                  <button className="fn-fn-loja-item-chevron">
                    <i className={`fas fa-chevron-${exp ? "up" : "down"}`} />
                  </button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{ color: poderBloqueado ? "#3a3a3a" : cor }}>{cfg.nome}</span>
                      {atual > 0 && (
                        <span style={{ fontSize: "0.55rem", fontWeight: 800, color: cor, border: `1px solid ${cor}55`, borderRadius: 3, padding: "1px 6px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1 }}>
                          NV {atual}
                        </span>
                      )}
                      {poderBloqueado && (
                        <span style={{ fontSize: "0.5rem", color: "#7a2020", border: "1px solid #4a1a1a", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 0.5 }}>
                          REQ: {reqPoderCheck.motivo}
                        </span>
                      )}
                    </div>
                    {/* Pips de progresso */}
                    <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "wrap" }}>
                      {cfg.niveis.map(({ n }) => (
                        <div
                          key={n}
                          title={`Nível ${n} — ${cfg.niveis[n - 1]?.info || ""}`}
                          style={{
                            width: 12, height: 12, borderRadius: "50%",
                            background: n <= atual ? cor : "transparent",
                            border: `2px solid ${n <= atual ? cor : "#1a2535"}`,
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Corpo expandido: lista de níveis */}
                {exp && (
                  <div className="fn-fn-loja-item-corpo" style={{ paddingLeft: 18 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                      {cfg.niveis.map((nivelCfg) => {
                        const { n, info, detalhe } = nivelCfg;
                        const isAtual    = n === atual;
                        const isComprado = n < atual;
                        const nivelKey   = `${cfg.id}-${n}`;
                        const nivelExp   = niveisExpandidos[nivelKey];
                        const custo      = n - atual;
                        const semPontos  = pontosRestantes !== undefined && custo > pontosRestantes;
                        const reqNivelCheck = nivelCfg.req ? verificarReqPoder(nivelCfg.req, ficha, poderes) : { ok: true };
                        const nivelBloqueado = poderBloqueado || !reqNivelCheck.ok;
                        const motivoBloqueio = poderBloqueado ? reqPoderCheck.motivo : reqNivelCheck.motivo;

                        return (
                          <div key={n} style={{ borderRadius: 5, overflow: "hidden", border: `1px solid ${isAtual ? cor + "44" : isComprado ? "#0d1320" : nivelBloqueado ? "#2a1a1a" : "#0d1a2e"}` }}>
                            {/* Linha do nível — clicável para expandir detalhe */}
                            <div
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "6px 10px",
                                background: isAtual ? `${cor}18` : isComprado ? "#050b14" : nivelBloqueado ? "#0d0608" : "#070e18",
                                opacity: isComprado ? 0.45 : 1,
                                cursor: detalhe ? "pointer" : "default",
                              }}
                              onClick={() => detalhe && toggleNivel(cfg.id, n)}
                            >
                              {/* Bolinha nível */}
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                                background: isAtual || isComprado ? cor : "transparent",
                                border: `2px solid ${isAtual || isComprado ? cor : nivelBloqueado ? "#4a1a1a" : "#1a2535"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.55rem", fontWeight: 800, color: "#000",
                                fontFamily: "'Be Vietnam Pro',sans-serif",
                              }}>
                                {isAtual || isComprado ? n : <span style={{ color: nivelBloqueado ? "#4a1a1a" : "#2a4060" }}>{n}</span>}
                              </div>

                              {/* Texto info */}
                              <div style={{ flex: 1 }}>
                                <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.88rem", color: isAtual ? cor : isComprado ? "#333" : nivelBloqueado ? "#4a2020" : "#888" }}>
                                  {info || `Nível ${n}`}
                                </span>
                                {!isAtual && !isComprado && !nivelBloqueado && (
                                  <div style={{ fontSize: "0.75rem", marginTop: 1, fontFamily: "'Be Vietnam Pro',sans-serif", color: semPontos ? "#ef444466" : "#4a90e2" }}>
                                    custo: {custo} pt{custo > 1 ? "s" : ""}
                                  </div>
                                )}
                                {!isAtual && !isComprado && nivelBloqueado && (
                                  <div style={{ fontSize: "0.72rem", marginTop: 1, fontFamily: "'Be Vietnam Pro',sans-serif", color: "#7a2020" }}>
                                    req: {motivoBloqueio}
                                  </div>
                                )}
                              </div>

                              {/* Botão expandir detalhe */}
                              {detalhe && !isComprado && (
                                <button
                                  onClick={e => { e.stopPropagation(); toggleNivel(cfg.id, n); }}
                                  style={{ background: "none", border: "none", color: nivelExp ? cor : "#2a4060", cursor: "pointer", fontSize: "0.7rem", padding: "2px 4px", flexShrink: 0 }}
                                  title="Ver detalhes"
                                >
                                  <i className={`fas fa-chevron-${nivelExp ? "up" : "down"}`} />
                                </button>
                              )}

                              {/* Botão comprar */}
                              {!isComprado && !isAtual && (
                                <button
                                  className="fn-fn-loja-item-add"
                                  style={{
                                    borderColor: (semPontos || nivelBloqueado) ? "#2a2a2a" : cor,
                                    color: (semPontos || nivelBloqueado) ? "#333" : cor,
                                    flexShrink: 0,
                                    opacity: (semPontos || nivelBloqueado) ? 0.5 : 1,
                                    cursor: (semPontos || nivelBloqueado) ? "not-allowed" : "pointer",
                                  }}
                                  title={nivelBloqueado ? `Requisito: ${motivoBloqueio}` : semPontos ? `Pontos insuficientes (restam ${pontosRestantes})` : `Comprar nível ${n} — custo ${custo} pt${custo > 1 ? "s" : ""}`}
                                  onClick={e => { e.stopPropagation(); comprar(cfg, n, nivelCfg); }}
                                >
                                  <i className={`fas fa-${nivelBloqueado ? "lock" : "plus"}`} />
                                </button>
                              )}
                              {isAtual && (
                                <span style={{ fontSize: "0.55rem", fontWeight: 800, color: cor, border: `1px solid ${cor}44`, borderRadius: 3, padding: "1px 6px", fontFamily: "'Be Vietnam Pro',sans-serif", flexShrink: 0 }}>
                                  ATUAL
                                </span>
                              )}
                              {isComprado && (
                                <span style={{ fontSize: "0.55rem", color: "#1a2535", fontFamily: "'Be Vietnam Pro',sans-serif" }}>✓</span>
                              )}
                            </div>

                            {/* Detalhe expandido do nível */}
                            {nivelExp && detalhe && !isComprado && (
                              <div style={{
                                padding: "10px 16px 14px 24px",
                                background: "#0a1628",
                                borderTop: `1px solid #1a3050`,
                              }}>
                                {detalhe.split("\n").map((linha, i) => (
                                  <p key={i} style={{
                                    margin: "3px 0",
                                    fontFamily: "'Google Sans', sans-serif",
                                    fontSize: "0.9rem",
                                    color: linha.startsWith("•") ? "#ccc" : "#888",
                                    lineHeight: 1.6,
                                  }}>
                                    {linha}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Botão remover poder */}
                    {atual > 0 && (
                      <button
                        onClick={() => { onComprar({ id: cfg.id, nome: cfg.nome, nivel: 0 }); mostrarToast(`${cfg.nome} removido.`, "erro"); }}
                        style={{ marginTop: 10, background: "none", border: "1px solid #4a1a1a", color: "#c0392b", fontFamily: "'Google Sans',sans-serif", fontSize: "0.62rem", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
                      >
                        <i className="fas fa-trash" style={{ marginRight: 4 }} /> REMOVER PODER
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtrados.length === 0 && <p className="fn-loja-vazio">Nenhum poder encontrado.</p>}
        </div>
      </div>
    </div>
  );
};

// ── Sub-componente: seção de Poderes dentro da aba Jutsus ─────────────────────
// ── ABA PODERES (aba dedicada) ────────────────────────────────────────────────
const AbaPoderes = ({ poderes, setPoderes, pontosRestantes, salvarAgora, ficha = {} }) => {
  const [lojaAberta, setLojaAberta] = useState(false);
  const [filtroPoderes, setFiltroPoderes] = useState("");

  const comprarOuAtualizar = ({ id, nome, nivel, efeitos }) => {
    if (nivel === 0) { setPoderes(prev => prev.filter(p => p.id !== id)); setTimeout(salvarAgora, 100); return; }
    const jaExiste = poderes.find(p => p.id === id);
    if (jaExiste) {
      setPoderes(prev => prev.map(p => p.id === id ? { ...p, nivel, ...(efeitos !== undefined ? { efeitos } : {}) } : p));
    } else {
      const cfg = PODERES_CONFIG.find(c => c.id === id);
      setPoderes(prev => [...prev, { id, nome: cfg?.nome ?? nome, nivel, efeitos: efeitos || [] }]);
    }
    setTimeout(salvarAgora, 100);
  };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">

      {/* Botão comprar */}
      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar poderes" value={filtroPoderes} onChange={e => setFiltroPoderes(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => setLojaAberta(true)}>+ COMPRAR</button>
      </div>

      {/* Lista de poderes adquiridos */}
      <div className="fn-aba-lista">
        {poderes.length === 0 && <p className="fn-aba-vazio">Nenhum poder adquirido ainda.</p>}
        {poderes.filter(p => filtroPoderes === "" || p.nome.toLowerCase().includes(filtroPoderes.toLowerCase())).map(p => {
          const cfg = PODERES_CONFIG.find(c => c.id === p.id);
          const cor = cfg?.cor || "#888";
          return (
            <div key={p.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${cor}44` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px 6px" }}>
                {/* Nível em destaque */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${cor}15`,
                }}>
                  <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "1rem", fontWeight: 900, color: cor, lineHeight: 1 }}>{p.nivel}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.85rem", fontWeight: 700, color: cor }}>{p.nome}</div>
                  {cfg?.desc && (
                    <div style={{ fontFamily: "'Google Sans',sans-serif", fontSize: "0.62rem", color: "#445", marginTop: 2, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cfg.desc}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => comprarOuAtualizar({ id: p.id, nome: p.nome, nivel: 0 })}
                  style={{ background: "none", border: "1px solid #1a1a1a", color: "#3a1a1a", borderRadius: 4, cursor: "pointer", padding: "4px 7px", fontSize: "0.7rem", flexShrink: 0, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "#c0392b"; e.currentTarget.style.borderColor = "#c0392b"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#3a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
                  title="Remover poder"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
              {/* Pips de nível */}
              {cfg && (
                <div style={{ display: "flex", gap: 4, padding: "0 12px 6px 58px", flexWrap: "wrap" }}>
                  {cfg.niveis.map(({ n }) => (
                    <div key={n} style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: n <= p.nivel ? cor : "transparent",
                      border: `2px solid ${n <= p.nivel ? cor : "#1a2535"}`,
                    }} title={`Nível ${n}`} />
                  ))}
                </div>
              )}
              {/* Efeitos escolhidos (Ninpou e elementais) */}
              {PODERES_COM_EFEITOS.includes(p.id) && p.efeitos && p.efeitos.length > 0 && (
                <div style={{ padding: "0 12px 10px 58px" }}>
                  <div style={{ fontSize: "0.55rem", color: "#334", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: "0.5px", marginBottom: 5 }}>EFEITOS ESCOLHIDOS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {p.efeitos.map((ef, idx) => {
                      const ehEvolucao = idx > 0 && p.efeitos.slice(0, idx).some(e => e.id === ef.id);
                      return (
                        <div key={idx} style={{
                          fontSize: "0.6rem", fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 600,
                          padding: "2px 7px", borderRadius: 4,
                          background: `${cor}18`, border: `1px solid ${cor}33`, color: cor,
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          <span style={{ color: "#334", fontWeight: 400 }}>Nv{ef.nivelEscolhido}</span>
                          {ef.nome}
                          {ehEvolucao && <span style={{ fontSize: "0.45rem", color: "#f39c12" }}>↑</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lojaAberta && (
        <ModalLojaPoderes poderes={poderes} onComprar={comprarOuAtualizar} onFechar={() => setLojaAberta(false)} pontosRestantes={pontosRestantes} ficha={ficha} />
      )}
    </div>
  );
};

// ── PainelPontos ─────────────────────────────────────────────────────────────
// Exibe os contadores de EXP Ganha / Restante para cada categoria
const PainelPontos = ({ nc, atr, pericias, poderes, aptidoes, jutsus }) => {
  const evo = getEvolucao(parseInt(nc, 10) || 4);
  const atrChaves = ["forca","destreza","agilidade","percepcao","inteligencia","vigor","espirito","carisma","manipulacao"];

  const gastosAtr     = atrChaves.reduce((s, k) => s + (atr[k] ?? 0), 0);
  const gastosPericia = Object.values(pericias).reduce((s, v) => s + (v ?? 0), 0);

  // Poderes: custo = nível de cada poder
  const gastosPoderes  = poderes.reduce((s, p) => s + (p.nivel ?? 0), 0);
  // Aptidões: cada uma custa 2 pontos (exceto as 3 gratuitas iniciais)
  const aptsPagas      = Math.max(0, aptidoes.length - 3);
  const gastosAptidoes = aptsPagas * 2;
  // Jutsus do livro: custo = nivel do jutsu (Básicos = 0, demais = nível do poder requisitado)
  const gastosJutsus   = jutsus.reduce((s, j) => {
    const cfg = jutsosLivroConfig.find(c => c.id === j.fromLivro);
    return s + (cfg ? (cfg.nivel ?? 0) : 0);
  }, 0);

  const gastosPoder = gastosPoderes + gastosAptidoes + gastosJutsus;

  const linhas = [
    { label: "ATRIBUTOS", total: evo.atributos, gastos: gastosAtr,     cor: "#4a90e2" },
    { label: "PERÍCIAS",  total: evo.pericias,  gastos: gastosPericia, cor: "#f0a020" },
    { label: "PODERES",   total: evo.poderes,   gastos: gastosPoder,   cor: "#b060e0" },
  ];

  return (
    <div className="fn-painel-pontos">
      <div className="fn-painel-pontos-titulo">
        <span>PONTOS</span>
        <span className="fn-painel-pontos-nc">NC {parseInt(nc,10)||4} · {evo.nivelShinobi} · Mín. {evo.minimo} · Lim. Atr. {parseInt(nc,10)||4} · Lim. Pod. {Math.floor((parseInt(nc,10)||4)/2)}</span>
      </div>
      {linhas.map(({ label, total, gastos, cor }) => {
        const restante = total - gastos;
        const pct = total > 0 ? Math.min(100, Math.round((gastos / total) * 100)) : 0;
        const corBar = restante < 0 ? "#ef4444" : restante === 0 ? "#22c55e" : cor;
        return (
          <div key={label} className="fn-ponto-linha">
            <div className="fn-ponto-linha-top">
              <span className="fn-ponto-label" style={{ color: cor }}>{label}</span>
              <div className="fn-ponto-counters">
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">TOTAL</span>
                  <span className="fn-ponto-counter-val" style={{ color: "#888" }}>{total}</span>
                </div>
                <div className="fn-ponto-sep">|</div>
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">GASTOS</span>
                  <span className="fn-ponto-counter-val" style={{ color: "#aaa" }}>{gastos}</span>
                </div>
                <div className="fn-ponto-sep">|</div>
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">RESTANTE</span>
                  <span className="fn-ponto-counter-val" style={{ color: restante < 0 ? "#ef4444" : restante > 0 ? "#22c55e" : "#555", fontWeight: 800 }}>
                    {restante > 0 ? `+${restante}` : restante}
                  </span>
                </div>
              </div>
            </div>
            <div className="fn-ponto-barra-bg">
              <div className="fn-ponto-barra-fill" style={{ width: `${pct}%`, background: corBar }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── ABA JUTSUS ────────────────────────────────────────────────────────────────
const AbaJutsus = ({ jutsus, setJutsus, handleRolar, hcCalc, ficha, poderes, setPoderes, pontosRestantes, salvarAgora, pericias = {}, atr = {} }) => {
  const [filtro, setFiltro] = useState("");
  const [exp, setExp] = useState({});
  const [lojaAberta, setLojaAberta] = useState(false);

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">

      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar jutsus" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => setLojaAberta(true)}>+ ADICIONAR</button>
      </div>

      <div className="fn-aba-lista">
        {jutsus.length === 0 && <p className="fn-aba-vazio">Nenhum jutsu cadastrado.</p>}
        {jutsus.filter(j => filtro === "" || (j.nome || "").toLowerCase().includes(filtro.toLowerCase())).map(j => {
          const cor = TIPO_JUTSU_COR[j.tipo] || "#888";
          return (
            <div key={j.id} className="fn-aba-item fn-fn-aba-item">
              <div className="fn-fn-aba-item-header" onClick={() => setExp(p => ({ ...p, [j.id]: !p[j.id] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${exp[j.id] ? "up" : "down"}`} /></button>
                <div className="fn-fn-aba-item-info">
                  <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome">{j.nome || <em style={{color:"#555"}}>Sem nome</em>}</span>
                  <div className="fn-fn-aba-item-meta">
                    {j.tipo && <span className="fn-aba-tag fn-fn-aba-tag" style={{ color: cor, borderColor: cor + "55" }}>{j.tipo.charAt(0).toUpperCase() + j.tipo.slice(1)}</span>}
                    {j.custo && <span className="fn-aba-tag fn-fn-aba-tag">Chakra: <strong>{j.custo}</strong></span>}
                    {j.alcance && j.alcance !== "-" && <span className="fn-aba-tag fn-fn-aba-tag">Alcance: <strong>{j.alcance}</strong></span>}
                    {j.acao && <span className="fn-aba-tag fn-fn-aba-tag">Ação: <strong>{j.acao}</strong></span>}
                  </div>
                </div>
                {(() => {
                    const cfg = jutsosLivroConfig.find(c => c.id === j.fromLivro);
                    if (cfg?.poder === "Básico") return null;
                    return (
                      <button className="fn-aba-icon-btn" onClick={e => { e.stopPropagation(); handleRolar(j.nome || "Jutsu", 0, 0); }}>
                        <i className="fas fa-dice-d20" />
                      </button>
                    );
                  })()}
              </div>
              {exp[j.id] && (
                <div className="fn-jutsu-expandido">
                  {/* Linha 1: Técnica + Tipo */}
                  <div className="fn-jutsu-row">
                    <div className="fn-jutsu-field fn-jutsu-field-lg">
                      <span className="fn-jutsu-field-label">TÉCNICA</span>
                      <input className="fn-jutsu-input" value={j.nome || ""} placeholder="Nome da técnica"
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, nome: e.target.value } : x))} />
                    </div>
                    <div className="fn-jutsu-field fn-jutsu-field-sm">
                      <span className="fn-jutsu-field-label">TIPO</span>
                      <select className="fn-jutsu-select" value={j.tipo || ""}
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, tipo: e.target.value } : x))}>
                        <option value="">—</option>
                        {Object.keys(TIPO_JUTSU_COR).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Linha 2: Ação + Alcance + Alvo/Área */}
                  <div className="fn-jutsu-row">
                    <div className="fn-jutsu-field">
                      <span className="fn-jutsu-field-label">AÇÃO</span>
                      <select className="fn-jutsu-select" value={j.acao || ""}
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, acao: e.target.value } : x))}>
                        <option value="">—</option>
                        {["Padrão","Parcial","Completa","Livre","Reação","Movimento"].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="fn-jutsu-field">
                      <span className="fn-jutsu-field-label">ALCANCE</span>
                      <input className="fn-jutsu-input" value={j.alcance || ""} placeholder="Ex: 10m"
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, alcance: e.target.value } : x))} />
                    </div>
                    <div className="fn-jutsu-field">
                      <span className="fn-jutsu-field-label">ALVO / ÁREA</span>
                      <input className="fn-jutsu-input" value={j.alvo || ""} placeholder="Ex: 1 alvo"
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, alvo: e.target.value } : x))} />
                    </div>
                  </div>
                  {/* Linha 3: Duração + Custo de Chakra */}
                  <div className="fn-jutsu-row">
                    <div className="fn-jutsu-field">
                      <span className="fn-jutsu-field-label">DURAÇÃO</span>
                      <input className="fn-jutsu-input" value={j.duracao || ""} placeholder="Ex: Instantânea"
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, duracao: e.target.value } : x))} />
                    </div>
                    <div className="fn-jutsu-field">
                      <span className="fn-jutsu-field-label">CUSTO DE CHAKRA</span>
                      <input className="fn-jutsu-input" value={j.custo || ""} placeholder="Ex: 3"
                        onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, custo: e.target.value } : x))} />
                    </div>
                  </div>
                  {/* Linha 4: Descrição */}
                  <div className="fn-jutsu-field fn-jutsu-field-full">
                    <span className="fn-jutsu-field-label">DESCRIÇÃO</span>
                    <textarea className="fn-jutsu-textarea" rows={3} value={j.anotacoes || ""} placeholder="Descreva os efeitos da técnica..."
                      onChange={e => setJutsus(p => p.map(x => x.id === j.id ? { ...x, anotacoes: e.target.value } : x))} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:4 }}>
                    <button className="fn-aba-btn-remover" onClick={() => setJutsus(p => p.filter(x => x.id !== j.id))}>
                      <i className="fas fa-trash" style={{marginRight:4}}/> REMOVER
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lojaAberta && (
        <ModalLojaJutsus jutsus={jutsus} onAdicionar={j => { setJutsus(p => [...p, j]); setTimeout(salvarAgora, 100); }} onFechar={() => setLojaAberta(false)} ficha={ficha} poderes={poderes} pontosRestantes={pontosRestantes} />
      )}
    </div>
  );
};

// ── ABA MOCHILA NARUTO ────────────────────────────────────────────────────────
// ── Modal Loja de Itens (estilo TLOU, CSS Naruto) ─────────────────────────────
const ModalLojaItens = ({ ryos, onComprar, onFechar }) => {
  const [catAtiva, setCatAtiva] = useState("arremesso");
  const [expandidos, setExpandidos] = useState({});
  const [busca, setBusca] = useState("");
  const [toast, setToast] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  // Busca itens do banco e monta catálogo agrupado por categoria
  useEffect(() => {
    fetch(`${API}/api/naruto/itens`)
      .then(r => r.json())
      .then(rows => {
        const agrupado = {};
        rows.forEach(item => {
          const meta = CATALOGO_META[item.categoria] || { label: item.categoria, cor: "#888" };
          if (!agrupado[item.categoria]) {
            agrupado[item.categoria] = { label: meta.label, cor: meta.cor, itens: [] };
          }
          agrupado[item.categoria].itens.push({
            id: item.id,
            nome: item.nome,
            preco: item.preco,
            desc: item.descricao,
            comp: item.comp,
          });
        });
        setCatalogo(agrupado);
        // Ativa primeira categoria disponível
        const primeiraChave = Object.keys(agrupado)[0];
        if (primeiraChave) setCatAtiva(primeiraChave);
      })
      .catch(() => setCatalogo({}))
      .finally(() => setCarregando(false));
  }, []);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  };

  const comprar = (item) => {
    onComprar(item);
    mostrarToast(`${item.nome} adicionado à mochila!`);
  };

  const catKeys = Object.keys(catalogo);
  const catData = catalogo[catAtiva];

  const filtrados = busca.trim()
    ? catKeys.flatMap(k => (catalogo[k]?.itens || []).filter(i =>
        i.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (i.desc || "").toLowerCase().includes(busca.toLowerCase())
      ).map(i => ({ ...i, _cat: k }))
    )
    : (catData?.itens || []).map(i => ({ ...i, _cat: catAtiva }));

  return (
    <div className="fn-loja-overlay" onClick={onFechar}>
      <div className="fn-loja-itens-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fn-loja-header">
          <h2 className="fn-loja-titulo" style={{ color: "#4a90e2" }}>Equipamentos</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.65rem", fontWeight: 800, color: "#f39c12", background: "#1a1200", border: "1px solid #f39c1233", borderRadius: 4, padding: "3px 10px" }}>
              <i className="fas fa-coins" style={{ marginRight: 5 }} />{(ryos ?? 0).toLocaleString()} Ryos
            </span>
            <button className="fn-loja-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
          </div>
        </div>

        {/* Categorias */}
        {!busca.trim() && (
          <div className="fn-fn-loja-cats">
            {catKeys.map(k => {
              const cor = catalogo[k].cor;
              const ativa = catAtiva === k;
              return (
                <button
                  key={k}
                  className={`fn-fn-loja-cat-btn ${ativa ? "fn-fn-loja-cat-ativa" : ""}`}
                  style={{
                    color: ativa ? cor : cor + "66",
                    borderBottomColor: ativa ? cor : "transparent",
                  }}
                  onClick={() => setCatAtiva(k)}
                >
                  {catalogo[k].label}
                </button>
              );
            })}
          </div>
        )}

        {/* Busca */}
        <div className="fn-loja-busca-row" style={{ borderColor: "#0f1e33" }}>
          <i className="fas fa-search fn-loja-busca-icon" style={{ color: "#2a4060" }} />
          <input
            className="fn-loja-busca-input"
            placeholder="Buscar item..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>

        {toast && <div className={`fn-loja-toast fn-fn-loja-toast-${toast.tipo}`}>{toast.msg}</div>}

        {/* Lista */}
        <div className="fn-loja-lista">
          {carregando
            ? <p className="fn-loja-vazio" style={{ color: "#2a4060" }}>Carregando itens...</p>
            : filtrados.length === 0
              ? <p className="fn-loja-vazio">Nenhum item encontrado.</p>
              : filtrados.map(item => {
            const cat = catalogo[item._cat ?? catAtiva];
            const cor = cat?.cor ?? "#4a90e2";
            const exp = expandidos[item.id];
            return (
              <div key={item.id} className="fn-loja-item" style={{ borderColor: "#0d1a28" }}>
                <div
                  className="fn-fn-loja-item-header"
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandidos(p => ({ ...p, [item.id]: !p[item.id] }))}
                >
                  <button className="fn-fn-loja-item-chevron" style={{ color: "#2a4060" }}>
                    <i className={`fas fa-chevron-${exp ? "up" : "down"}`} />
                  </button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{ color: cor }}>{item.nome}</span>
                      <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.7rem", color: item.preco > 0 ? "#f39c12" : "#22c55e", fontWeight: 700, marginLeft: 8 }}>
                        {item.preco > 0 ? `${item.preco} Ryos` : "Gratuito"}
                      </span>
                      {item.comp && (
                        <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.65rem", color: "#2a4060", background: "#080f18", border: "1px solid #0f1e33", borderRadius: 3, padding: "1px 5px", marginLeft: 4 }}>
                          {item.comp}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="fn-fn-loja-item-add"
                    style={{ borderColor: cor, color: cor }}
                    title={`Adicionar ${item.nome} à mochila`}
                    onClick={e => { e.stopPropagation(); comprar(item); }}
                  >
                    <i className="fas fa-plus" />
                  </button>
                </div>

                {exp && (
                  <div className="fn-fn-loja-item-corpo" style={{ background: "#04090f", borderColor: "#0d1a28" }}>
                    <div style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.8rem", lineHeight: 1.8, color: "#7ab3e0" }}>
                      {(item.desc || "").split(".").map(s => s.trim()).filter(Boolean).map((parte, i) => {
                        const labelMatch = parte.match(/^\*([^*]+)\*\s*(.*)$/);
                        if (labelMatch) {
                          const label = labelMatch[1];
                          const rest = labelMatch[2];
                          const isPositive = /^\+/.test(rest);
                          const isNegative = /^[–-]/.test(rest);
                          const valColor = isPositive ? "#22c55e" : isNegative ? "#ef4444" : "#c9d6e3";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                              <span style={{ color: cor, fontWeight: 700 }}>{label}</span>
                              {rest && <span style={{ color: valColor, fontWeight: isPositive || isNegative ? 700 : 400 }}>{rest}</span>}
                            </div>
                          );
                        }
                        return <div key={i} style={{ color: "#4a7090" }}>{parte}</div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── ABA MOCHILA (NARUTO) ──────────────────────────────────────────────────────
const AbaMochilaNaruto = ({ itens, setItens, ryos, setRyos, nc, handleRolar, hcCalc = {} }) => {
  const [filtro, setFiltro] = useState("");
  const [exp, setExp] = useState({});
  const [lojaAberta, setLojaAberta] = useState(false);

  const comprarItem = (item) => {
    const existente = itens.find(i => i.catalogId === item.id);
    if (existente) {
      setItens(p => p.map(i => i.catalogId === item.id ? { ...i, quantidade: (i.quantidade || 1) + 1 } : i));
    } else {
      const meta = CATALOGO_META[item.categoria] || CATALOGO_META[item._cat];
      const catKeyCompra = item.categoria || item._cat || "";
      setItens(p => [...p, {
        id: Date.now(),
        catalogId: item.id,
        nome: item.nome,
        categoria: meta?.label ?? "Geral",
        catKey: catKeyCompra,
        preco: item.preco,
        comp: item.comp,
        descricao: item.desc,
        quantidade: 1,
      }]);
    }
    if (item.preco > 0) {
      setRyos(prev => Math.max(0, (prev || 0) - item.preco));
    }
  };

  const alterarQuantidade = (id, delta) => {
    setItens(p => p.flatMap(i => {
      if (i.id !== id) return [i];
      const novaQtd = (i.quantidade || 1) + delta;
      if (novaQtd <= 0) return [];
      return [{ ...i, quantidade: novaQtd }];
    }));
  };

  const ryosIniciais = getRyosIniciais(nc);
  const filtrados = itens.filter(i => i.nome.toLowerCase().includes(filtro.toLowerCase()));

  // Rola ataque (2d8 + hcVal) e dano (parsed da desc) separados
  const handleRolarArma = (item, hcKey, hcVal, danoDesc) => {
    if (!handleRolar) return;
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const falhaCritica = soma <= 3;
    const grau = soma <= 3 ? 0 : soma <= 8 ? 1 : soma <= 11 ? 2 : soma <= 14 ? 3 : 4;
    const critico = grau >= 4;
    const ataqueTotal = soma + hcVal;
    // Rola dano se tiver desc (ex: "+4", "1d6+2")
    let danoRolls = [0];
    let danoBonus = 0;
    let danoTotal = 0;
    if (danoDesc) {
      const str = String(danoDesc).toUpperCase().replace(/\s/g, "");
      const dadoRx = /([0-9]*)D([0-9]+)/g;
      let m;
      let processado = str;
      danoRolls = [];
      while ((m = dadoRx.exec(str)) !== null) {
        const q = parseInt(m[1] || "1", 10);
        const f = parseInt(m[2], 10);
        for (let i = 0; i < q; i++) danoRolls.push(Math.floor(Math.random() * f) + 1);
        processado = processado.replace(m[0], "");
      }
      if (danoRolls.length === 0) {
        const n = parseInt(str.replace(/[^0-9-]/g, ""), 10);
        danoRolls = [isNaN(n) ? 0 : Math.abs(n)];
        danoBonus = 0;
        const danoBase = danoRolls[0];
        danoTotal = grau >= 2 ? danoBase * grau : danoBase;
      } else {
        const bonusMatch = processado.replace(/\s/g, "").match(/^([+-][0-9]+)$/);
        danoBonus = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
        const danoBase = danoRolls.reduce((a, b) => a + b, 0) + danoBonus;
        danoTotal = grau >= 2 ? danoBase * grau : danoBase;
      }
    } else {
      danoRolls = [0]; danoTotal = 0;
    }
    const entrada = {
      label: `${item.nome} — ${hcKey}`,
      d1, d2, precisao: hcVal, bonus: 0,
      total: danoTotal,
      ataqueTotal,
      critico, falhaCritica,
      grau,
      isDano: true,
      danoRolls, danoBonus,
      timestamp: makeTimestamp(),
    };
    handleRolar(null, null, null, entrada);
  };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">

      {/* Ryos */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px 8px", borderBottom: "1px solid #0d1a28", flexShrink: 0 }}>
        <i className="fas fa-coins" style={{ color: "#f39c12", fontSize: "0.9rem" }} />
        <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.58rem", fontWeight: 800, color: "#f39c1288", letterSpacing: "2px" }}>RYOS</span>
        <input
          type="text"
          value={ryos === null || ryos === undefined ? "" : ryos}
          onChange={e => {
            const v = e.target.value;
            if (v === "") { setRyos(0); return; }
            const n = parseInt(v, 10);
            if (!isNaN(n)) setRyos(n);
          }}
          placeholder="0"
          className="no-spinner"
          style={{ background: "transparent", border: "none", outline: "none", color: "#f39c12", fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "1.1rem", fontWeight: 900, flex: 1, textAlign: "center" }}
        />
        <button
          onClick={() => setRyos(ryosIniciais)}
          title={`Resetar para dinheiro inicial (${ryosIniciais.toLocaleString()} Ryos)`}
          style={{ background: "none", border: "1px solid #1a2535", borderRadius: 4, color: "#2a4060", fontSize: "0.62rem", padding: "3px 7px", cursor: "pointer", fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 700, transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f39c12"; e.currentTarget.style.borderColor = "#f39c12"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#2a4060"; e.currentTarget.style.borderColor = "#1a2535"; }}
        >
          <i className="fas fa-undo" style={{ marginRight: 4 }} />{ryosIniciais.toLocaleString()}
        </button>
      </div>

      {/* Filtro + botão adicionar */}
      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn" style={{ flexShrink: 0 }}>
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar mochila" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => setLojaAberta(true)}>+ ADICIONAR</button>
      </div>

      {/* Lista de itens */}
      <div className="fn-aba-lista">
        {filtrados.length === 0 && <p className="fn-aba-vazio">Mochila vazia.</p>}
        {filtrados.map(item => {
          const qtd = item.quantidade || 1;
          const normStr = s => (s || "").toLowerCase().replace(/\s+/g, "_").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const catKey = item.catKey
            || Object.keys(CATALOGO_META).find(k => k === item.categoria)
            || Object.keys(CATALOGO_META).find(k => CATALOGO_META[k].label === item.categoria)
            || Object.keys(CATALOGO_META).find(k => normStr(k) === normStr(item.categoria))
            || Object.keys(CATALOGO_META).find(k => normStr(CATALOGO_META[k].label) === normStr(item.categoria))
            || "";
          const cor = CATALOGO_META[catKey]?.cor ?? "#4a90e2";
          const isArmaCC = ["armas_simples","armas_marciais"].includes(catKey);
          const isArmaCD = ["arremesso","disparo"].includes(catKey);
          const temDanoNaDesc = /dano/i.test(item.descricao || "");
          const isArma = isArmaCC || isArmaCD || (temDanoNaDesc && catKey === "");
          // Extrai dano da descrição: padrão "*+N* dano" ou similar
          const danoMatch = item.descricao ? item.descricao.match(/\*[+]?(\d+[dD]\d+[+\-\d]*|[+]?\d+)\*\s*dano/i) : null;
          const danoDesc = danoMatch ? danoMatch[1] : null;
          const hcKey = isArmaCD ? "CD" : "CC";
          const hcVal = hcCalc[hcKey] ?? 0;

          // Renderiza linha de descrição (mesmo parser do catálogo)
          const renderDesc = (desc) => {
            if (!desc) return null;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {desc.split(".").map(s => s.trim()).filter(Boolean).map((parte, i) => {
                  const m = parte.match(/^\*([^*]+)\*\s*(.*)$/);
                  if (m) {
                    const isPos = /^\+/.test(m[2]);
                    const isNeg = /^[–-]/.test(m[2]);
                    const vc = isPos ? "#22c55e" : isNeg ? "#ef4444" : "#c9d6e3";
                    return (
                      <div key={i} style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.78rem", display: "flex", alignItems: "baseline", gap: 3 }}>
                        <span style={{ color: cor, fontWeight: 700 }}>{m[1]}</span>
                        {m[2] && <span style={{ color: vc, fontWeight: isPos || isNeg ? 700 : 400 }}>{m[2]}</span>}
                      </div>
                    );
                  }
                  return <div key={i} style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.78rem", color: "#4a6080" }}>{parte}</div>;
                })}
              </div>
            );
          };

          return (
            <div key={item.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${cor}44` }}>
              <div className="fn-fn-aba-item-header" onClick={() => setExp(p => ({ ...p, [item.id]: !p[item.id] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${exp[item.id] ? "up" : "down"}`} /></button>
                <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome" style={{ flex: 1 }}>{item.nome}</span>
                {isArma && handleRolar ? (
                  <button
                    className="fn-btn-rolar fn-hc-rolar"
                    title={`Rolar ${hcKey}${danoDesc ? ` | Dano: ${danoDesc}` : ""}`}
                    onClick={e => { e.stopPropagation(); handleRolarArma(item, hcKey, hcVal, danoDesc); }}
                  >
                    <i className="fas fa-dice-d20" />
                  </button>
                ) : (
                  <div className="fn-mochila-stack-contador">
                    <button className="fn-mochila-stack-btn" onClick={e => { e.stopPropagation(); alterarQuantidade(item.id, -1); }}>−</button>
                    <span className="fn-mochila-stack-qtd">{qtd}</span>
                    <button className="fn-mochila-stack-btn" onClick={e => { e.stopPropagation(); alterarQuantidade(item.id, +1); }}>+</button>
                  </div>
                )}
              </div>
              {exp[item.id] && (
                <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                  <div className="fn-ataque-expandido-info" style={{ flex: 1 }}>
                    {isArma && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span className="fn-ataque-detalhe">
                          {hcKey}: <strong style={{ color: "#4a90e2" }}>{hcVal}</strong>
                        </span>
                        {danoDesc && (
                          <span className="fn-ataque-detalhe">
                            Dano: <strong style={{ color: "#22c55e" }}>{danoDesc}</strong>
                          </span>
                        )}
                      </div>
                    )}
                    {item.descricao && renderDesc(item.descricao)}
                  </div>
                  <div className="fn-ataque-expandido-btns" style={{ marginTop: 8 }}>
                    <button
                      className="fn-aba-btn-remover"
                      onClick={e => { e.stopPropagation(); setItens(p => p.filter(x => x.id !== item.id)); }}
                    >
                      REMOVER
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lojaAberta && (
        <ModalLojaItens
          ryos={ryos}
          onComprar={comprarItem}
          onFechar={() => setLojaAberta(false)}
        />
      )}
    </div>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const FichaPersonagemNaruto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ficha,      setFicha]      = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Identidade
  const [nomePersonagem, setNomePersonagem] = useState("");
  const [nomeJogador,    setNomeJogador]    = useState("");
  const [nc,             setNc]             = useState("");

  // Energias
  const [vitalAtual,  setVitalAtual]  = useState(0);
  const [vitalMax,    setVitalMax]    = useState(0);
  const [chakraAtual, setChakraAtual] = useState(0);
  const [chakraMax,   setChakraMax]   = useState(0);
  const [ryos,        setRyos]        = useState(null);

  // Atributos editáveis localmente
  const [atrEdit, setAtrEdit] = useState({});

  // Bônus manuais para habilidades de combate e iniciativa
  const [hcBonus, setHcBonus] = useState({ CC: 0, CD: 0, ESQ: 0, LM: 0 });
  const [iniciativaBonus, setIniciativaBonus] = useState(0);

  // Perícias — pontos gastos extras (além do base)
  const [pericias, setPericias] = useState({});

  // Aptidões adquiridas
  const [aptidoes, setAptidoes] = useState([]);

  // Abas direita
  const [abaAtiva, setAbaAtiva] = useState("jutsus");

  // Jutsus
  const [jutsus, setJutsus] = useState([]);

  // Poderes (Ninpou, Katon, etc.) com nível
  const [poderes, setPoderes] = useState([]);

  // Mochila
  const [itensMochila, setItensMochila] = useState([]);

  // Anotações


  // Rolagens
  const [resultado,     setResultado]     = useState(null);
  const [historico,     setHistorico]     = useState([]);
  const [painelAberto,  setPainelAberto]  = useState(false);
  const [modalTesteAberto, setModalTesteAberto] = useState(false);

  const fichaCarregada = useRef(false);
  const salvarTimer    = useRef(null);
  const payloadRef     = useRef(null);
  const nomeRef        = useRef("");
  const nomeJogadorRef = useRef("");
  const ncRef          = useRef("");
  const vitalAtualRef  = useRef(0);
  const vitalMaxRef    = useRef(0);
  const chakraAtualRef = useRef(0);
  const chakraMaxRef   = useRef(0);
  const ryosRef        = useRef(null);
  useEffect(() => { nomeRef.current = nomePersonagem; }, [nomePersonagem]);
  useEffect(() => { nomeJogadorRef.current = nomeJogador; }, [nomeJogador]);
  useEffect(() => { ncRef.current = nc; }, [nc]);
  useEffect(() => { vitalAtualRef.current = vitalAtual; }, [vitalAtual]);
  useEffect(() => { vitalMaxRef.current = vitalMax; }, [vitalMax]);
  useEffect(() => { chakraAtualRef.current = chakraAtual; }, [chakraAtual]);
  useEffect(() => { chakraMaxRef.current = chakraMax; }, [chakraMax]);
  useEffect(() => { ryosRef.current = ryos; }, [ryos]);
  const imagemRef = useRef(null);

  // Refs espelho dos estados — sempre atualizados, usados no beforeunload
  const jutsusRef        = useRef([]);
  const poderesRef       = useRef([]);
  const aptidoesRef      = useRef([]);
  const itensMochilaRef  = useRef([]);
  const periciasRef      = useRef({});
  const historicoRef     = useRef([]);
  const atrEditRef       = useRef({});
  const hcBonusRef       = useRef({});
  const iniciativaBonusRef = useRef(0);
  useEffect(() => { jutsusRef.current = jutsus; }, [jutsus]);
  useEffect(() => { poderesRef.current = poderes; }, [poderes]);
  useEffect(() => { aptidoesRef.current = aptidoes; }, [aptidoes]);
  useEffect(() => { itensMochilaRef.current = itensMochila; }, [itensMochila]);
  useEffect(() => { periciasRef.current = pericias; }, [pericias]);
  useEffect(() => { historicoRef.current = historico; }, [historico]);
  useEffect(() => { atrEditRef.current = atrEdit; }, [atrEdit]);
  useEffect(() => { hcBonusRef.current = hcBonus; }, [hcBonus]);
  useEffect(() => { iniciativaBonusRef.current = iniciativaBonus; }, [iniciativaBonus]);

  // ── Fetch ficha ──
  useEffect(() => {
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setFicha(data);
        imagemRef.current = data.imagem ?? null;
        console.log('[DEBUG ficha]', JSON.stringify(data, null, 2));
        setNomePersonagem(data.nome_personagem ?? "");
        setNomeJogador(data.nome_jogador ?? "");
        setNc(data.nc ?? "");
        setVitalAtual(data.vitalidade_atual ?? data.vitalidade_maxima ?? 0);
        setVitalMax(data.vitalidade_maxima ?? 0);
        setChakraAtual(data.chakra_atual ?? data.chakra_maximo ?? 0);
        setChakraMax(data.chakra_maximo ?? 0);
        setRyos(data.ryos || null);

        if (data.dados_pericias) {
          try {
            const dp = typeof data.dados_pericias === "string"
              ? JSON.parse(data.dados_pericias)
              : data.dados_pericias;
            setPericias(dp);
          } catch { }
        }
        if (data.historico_rolagens) {
          try {
            const hr = typeof data.historico_rolagens === "string"
              ? JSON.parse(data.historico_rolagens)
              : data.historico_rolagens;
            setHistorico(hr);
          } catch { }
        }
        if (data.dados_extras) {
          try {
            const extras = typeof data.dados_extras === "string"
              ? JSON.parse(data.dados_extras)
              : data.dados_extras;
            console.log('[carregar] dados_extras:', extras);
            console.log('[carregar] jutsus do banco:', extras.jutsus);
            if (extras.atrEdit && Object.keys(extras.atrEdit).length > 0) {
              // Garantir que carisma/manipulacao do atrEdit sejam preservados
              // Para fichas antigas, inicializar com o valor das colunas legadas se não existir
              const atrCarregado = { ...extras.atrEdit };
              if (atrCarregado.carisma === undefined && data.carisma != null)      atrCarregado.carisma     = data.carisma;
              if (atrCarregado.manipulacao === undefined && data.manipulacao != null) atrCarregado.manipulacao = data.manipulacao;
              setAtrEdit(atrCarregado);
            }
            if (extras.hcBonus)       setHcBonus(extras.hcBonus);
            if (extras.iniciativaBonus !== undefined) setIniciativaBonus(extras.iniciativaBonus);
            if (extras.aptidoes)      setAptidoes(extras.aptidoes);
            if (extras.jutsus)        setJutsus(extras.jutsus);
            if (extras.poderes)       setPoderes(extras.poderes);
            if (extras.itensMochila)  setItensMochila(extras.itensMochila);
          } catch(e) { console.error('[carregar] erro ao parsear dados_extras:', e); }
        } else {
          console.warn('[carregar] dados_extras vazio ou nulo');
        }
        setTimeout(() => { fichaCarregada.current = true; }, 200);
      })
      .catch(() => setFicha(null))
      .finally(() => setCarregando(false));
  }, [id]);

  // ── Função de save imediato (usa refs, sempre dados frescos) ──
  const salvarAgora = useCallback(() => {
    if (!fichaCarregada.current) { console.warn('[salvarAgora] fichaCarregada=false, abortando'); return; }
    const extras = {
      atrEdit: atrEditRef.current,
      hcBonus: hcBonusRef.current,
      iniciativaBonus: iniciativaBonusRef.current,
      aptidoes: aptidoesRef.current,
      jutsus: jutsusRef.current,
      poderes: poderesRef.current,
      itensMochila: itensMochilaRef.current,
    };
    console.log('[salvarAgora] jutsus a salvar:', jutsusRef.current);
    const payload = {
      nome_personagem: nomeRef.current,
      nome_jogador: nomeJogadorRef.current,
      nc: ncRef.current,
      vitalidade_atual: vitalAtualRef.current,
      vitalidade_maxima: vitalMaxRef.current,
      chakra_atual: chakraAtualRef.current,
      chakra_maximo: chakraMaxRef.current,
      ryos: ryosRef.current === null || ryosRef.current === "" ? 0 : Number(ryosRef.current),
      dados_pericias: JSON.stringify(periciasRef.current),
      historico_rolagens: JSON.stringify(historicoRef.current),
      dados_extras: JSON.stringify(extras),
      imagem: imagemRef.current ?? undefined,
    };
    fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(d => console.log('[salvarAgora] resposta:', d))
      .catch(e => console.error('[salvarAgora] erro:', e));
  }, [id]);

  const handleSalvarImagem = useCallback((base64) => {
    imagemRef.current = base64;
    fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagem: base64 }),
    })
      .then(r => r.json())
      .then(() => setFicha(prev => ({ ...prev, imagem: base64 })))
      .catch(e => console.error('[salvarImagem] erro:', e));
  }, [id]);
  useEffect(() => {
    if (!fichaCarregada.current) return;
    const payload = {
      nome_personagem: nomePersonagem,
      nome_jogador: nomeJogador,
      nc,
      vitalidade_atual: vitalAtual,
      vitalidade_maxima: vitalMax,
      chakra_atual: chakraAtual,
      chakra_maximo: chakraMax,
      ryos: ryos === null || ryos === "" ? 0 : Number(ryos),
      dados_pericias: JSON.stringify(pericias),
      historico_rolagens: JSON.stringify(historico),
      dados_extras: JSON.stringify({ atrEdit, hcBonus, iniciativaBonus, aptidoes, jutsus, poderes, itensMochila }),
    };
    payloadRef.current = payload;
    clearTimeout(salvarTimer.current);
    salvarTimer.current = setTimeout(() => {
      fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(console.error);
    }, 1500);
  }, [id, nomePersonagem, nomeJogador, nc, vitalAtual, vitalMax, chakraAtual, chakraMax, ryos, pericias, historico, atrEdit, hcBonus, iniciativaBonus, aptidoes, jutsus, poderes, itensMochila]); // eslint-disable-line

  // ── Save on unload ──
  useEffect(() => {
    const handler = () => {
      if (!fichaCarregada.current) return;
      clearTimeout(salvarTimer.current);
      const freshPayload = {
        nome_personagem: nomeRef.current,
        nc,
        dados_pericias: JSON.stringify(periciasRef.current),
        historico_rolagens: JSON.stringify(historicoRef.current),
        dados_extras: JSON.stringify({
          atrEdit: atrEditRef.current,
          hcBonus: hcBonusRef.current,
          iniciativaBonus: iniciativaBonusRef.current,
          aptidoes: aptidoesRef.current,
          jutsus: jutsusRef.current,
          poderes: poderesRef.current,
          itensMochila: itensMochilaRef.current,
        }),
      };
      fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshPayload),
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [id]); // eslint-disable-line

  const handleVoltar = async () => {
    clearTimeout(salvarTimer.current);
    if (fichaCarregada.current && payloadRef.current) {
      await fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadRef.current),
      }).catch(() => {});
    }
    navigate("/personagens");
  };

  // ── Rolar 2d8 ──
  const handleRolar = useCallback((label, precisaoExtra = 0, bonusExtra = 0, entradaPreMontada = null) => {
    if (entradaPreMontada) {
      setResultado(entradaPreMontada);
      setHistorico(h => [...h.slice(-99), entradaPreMontada]);
      return;
    }
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const critico     = soma >= 15;
    const falhaCritica = soma <= 3;
    const total = soma + precisaoExtra + bonusExtra;
    const entrada = {
      label, d1, d2,
      precisao: precisaoExtra,
      bonus: bonusExtra,
      total,
      critico,
      falhaCritica,
      timestamp: makeTimestamp(),
      personagem: nomeRef.current,
    };
    setResultado(entrada);
    setHistorico(h => [...h.slice(-99), entrada]);
  }, []);

  // ── Rolar 1d8 (Iniciativa) ──
  const handleRolar1d8 = useCallback((label, bonus = 0) => {
    const d1 = Math.floor(Math.random() * 8) + 1;
    const total = d1 + bonus;
    const critico = d1 === 8;
    const falhaCritica = d1 === 1;
    const entrada = {
      label, d1, d2: null,
      precisao: 0, bonus,
      total, critico, falhaCritica,
      timestamp: makeTimestamp(),
      is1d8: true,
      personagem: nomeRef.current,
    };
    setResultado(entrada);
    setHistorico(h => [...h.slice(-99), entrada]);
  }, []);

  // ── Helpers derivados ──
  const _atrBase = {
    forca:        atrEdit.forca        !== undefined ? atrEdit.forca        : (ficha?.atr_forca        ?? 0),
    destreza:     atrEdit.destreza     !== undefined ? atrEdit.destreza     : (ficha?.atr_destreza     ?? 0),
    agilidade:    atrEdit.agilidade    !== undefined ? atrEdit.agilidade    : (ficha?.atr_agilidade    ?? 0),
    percepcao:    atrEdit.percepcao    !== undefined ? atrEdit.percepcao    : (ficha?.atr_percepcao    ?? 0),
    inteligencia: atrEdit.inteligencia !== undefined ? atrEdit.inteligencia : (ficha?.atr_inteligencia ?? 0),
    vigor:        atrEdit.vigor        !== undefined ? atrEdit.vigor        : (ficha?.atr_vigor        ?? 0),
    espirito:     atrEdit.espirito     !== undefined ? atrEdit.espirito     : (ficha?.atr_espirito     ?? 0),
    carisma:      atrEdit.carisma      !== undefined ? atrEdit.carisma      : (ficha?.carisma ?? ficha?.atr_carisma ?? 0),
    manipulacao:  atrEdit.manipulacao  !== undefined ? atrEdit.manipulacao  : (ficha?.manipulacao ?? ficha?.atr_manipulacao ?? 0),
  };
  const atr = ficha ? _atrBase : _atrBase;

  // ── Efeitos das aptidões ──────────────────────────────────────────────────
  const temApt = (id) => aptidoes.some(a => a.id === id);

  // Acuidade: CC usa Destreza
  const ccAtrBase = temApt("acuidade") ? (atr.destreza ?? 0) : (atr.forca ?? 0);

  // Bônus de HC vindo de aptidões
  const aptHcBonus = { CC: 0, CD: 0, ESQ: 0, LM: 0 };
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "hc") aptHcBonus[a.efeito.key] += a.efeito.val;
  });

  // Bônus de Iniciativa vindo de aptidões (Diligente: +3)
  const aptIniciativaBonus = temApt("diligente") ? 3 : 0;

  // Bônus de perícia vindo de aptidões (Perito: +2)
  const aptPericiaBonus = {};
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "perito" && a.obs) {
      const key = a.obs.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
      aptPericiaBonus[key] = (aptPericiaBonus[key] ?? 0) + 2;
    }
  });

  const hcCalc = ficha ? {
    CC:  (ficha.hc_base_cc  ?? 3) + ccAtrBase          + (hcBonus.CC  ?? 0) + aptHcBonus.CC,
    CD:  (ficha.hc_base_cd  ?? 3) + (atr.destreza ?? 0) + (hcBonus.CD  ?? 0) + aptHcBonus.CD,
    ESQ: (ficha.hc_base_esq ?? 3) + (atr.agilidade ?? 0) + (hcBonus.ESQ ?? 0) + aptHcBonus.ESQ,
    LM:  (ficha.hc_base_lm  ?? 3) + (atr.percepcao ?? 0) + (hcBonus.LM  ?? 0) + aptHcBonus.LM,
  } : {};

  const iniciativaCalc   = (atr.percepcao ?? 0) + (atr.agilidade ?? 0) + iniciativaBonus + aptIniciativaBonus;
  const reacaoEsqCalc    = (hcCalc.ESQ ?? 0) + 9;
  // Velocista: dobra Agilidade para deslocamento
  const deslocamentoCalc = temApt("velocista")
    ? 10 + (atr.agilidade ?? 0)
    : 10 + Math.floor((atr.agilidade ?? 0) / 2);



  if (carregando) return (
    <div className="fn-loading-page">
      <p className="fn-loading-text">Carregando ficha...</p>
    </div>
  );
  if (!ficha || ficha.error) return (
    <div className="fn-loading-page">
      <p className="fn-loading-text">Ficha não encontrada.</p>
      <button className="fn-voltar-btn" onClick={() => navigate("/personagens")}>← VOLTAR</button>
    </div>
  );

  return (
    <div className="fn-page">

      {/* ── TOPBAR ── */}
      <div className="fn-topbar">
        <button className="fn-voltar-btn" onClick={handleVoltar}>← VOLTAR</button>
      </div>

      <div className="fn-sheet">

        {/* ── IDENTIDADE ── */}
        <div className="fn-identidade">
          <div className="fn-identidade-col">
            <span className="fn-id-label">PERSONAGEM</span>
            <CampoEditavel valor={nomePersonagem} onSalvar={setNomePersonagem} placeholder="Nome" />
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NÍVEL SHINOBI</span>
            <span className="fn-id-static">{ficha.nivel_shinobi}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">JOGADOR</span>
            <CampoEditavel valor={nomeJogador} onSalvar={setNomeJogador} placeholder="Jogador" />
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">CLÃ</span>
            <span className="fn-id-static">{ficha.cla_nome}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">TENDÊNCIA</span>
            <span className="fn-id-static">{ficha.tendencia_nome}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NC — NÍVEL DA CAMPANHA</span>
            <select
              className="fn-nc-select"
              value={nc || "4"}
              onChange={e => setNc(e.target.value)}
            >
              {Array.from({ length: 17 }, (_, i) => i + 4).map(n => {
                const row = TABELA_EVOLUCAO.find(r => r.nc === n);
                return (
                  <option key={n} value={String(n)}>
                    NC {n}{row?.nivelShinobi ? ` — ${row.nivelShinobi}` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="fn-body">

          {/* ── COL ESQUERDA: avatar + atributos + combate ── */}
          <div className="fn-col-esquerda">

            <div className="fn-avatar-wrapper" onClick={() => setShowCropModal(true)} style={{ cursor: "pointer" }} title="Clique para alterar a foto">
              {ficha.imagem
                ? <img src={ficha.imagem} alt={nomePersonagem} className="fn-avatar-img" />
                : <div className="fn-avatar-placeholder">{nomePersonagem?.[0]?.toUpperCase() || "?"}</div>
              }
              <div className="fn-avatar-edit-overlay"><i className="fas fa-camera" /></div>
            </div>

            {showCropModal && (
              <ImageCropModal
                title="Foto de Perfil"
                src={ficha.imagem || null}
                onConfirm={handleSalvarImagem}
                onClose={() => setShowCropModal(false)}
              />
            )}

            {/* Energias */}
            <BarraEnergia label="VITALIDADE" cor="#e05050"
              valor={vitalAtual}  max={vitalMax}
              onChange={setVitalAtual} onChangeMax={setVitalMax} />
            <BarraEnergia label="CHAKRA" cor="#4a90e2"
              valor={chakraAtual} max={chakraMax}
              onChange={setChakraAtual} onChangeMax={setChakraMax} />

            {/* Atributos */}
            <div className="fn-secao-titulo">ATRIBUTOS</div>
            <div className="fn-atributos-grid">
              {atributosConfig.map(a => (
                <div key={a.id} className="fn-atr-row">
                  <span className="fn-atr-sigla">{a.sigla}</span>
                  <span className="fn-atr-nome">{a.nome}</span>
                  <CampoNumerico
                    valor={atr[a.id] ?? 0}
                    onChange={v => setAtrEdit(prev => ({ ...prev, [a.id]: v }))}
                    className="fn-atr-val"
                  />
                </div>
              ))}
            </div>

            {/* Habilidades de combate */}
            <div className="fn-secao-titulo">HABILIDADES DE COMBATE</div>
            <div className="fn-combate-grid">
              {[
                { sigla: "CC",  nome: "Combate Corporal",    key: "CC"  },
                { sigla: "CD",  nome: "Combate à Distância", key: "CD"  },
                { sigla: "ESQ", nome: "Esquiva",             key: "ESQ" },
                { sigla: "LM",  nome: "Ler Movimento",       key: "LM"  },
              ].map(h => {
                const base = (ficha[`hc_base_${h.key.toLowerCase()}`] ?? 3) + (
                  h.key === "CC"  ? (atr.forca     ?? 0) :
                  h.key === "CD"  ? (atr.destreza  ?? 0) :
                  h.key === "ESQ" ? (atr.agilidade ?? 0) :
                                    (atr.percepcao ?? 0)
                );
                return (
                  <div key={h.sigla} className="fn-hc-row">
                    <span className="fn-hc-sigla">{h.sigla}</span>
                    <span className="fn-hc-nome">{h.nome}</span>
                    <CampoNumerico
                      valor={hcCalc[h.key]}
                      onChange={v => setHcBonus(prev => ({ ...prev, [h.key]: v - base }))}
                      min={0}
                      className="fn-hc-val"
                    />
                    <button className="fn-btn-rolar fn-hc-rolar" onClick={() => handleRolar(h.nome, hcCalc[h.key], 0)} title={`Rolar ${h.nome}`}>
                      <i className="fas fa-dice-d20" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stats rápidos */}
            <div className="fn-stats-rapidos">
              <div className="fn-stat-item">
                <span className="fn-stat-label">INICIATIVA</span>
                <CampoNumerico
                  valor={iniciativaCalc}
                  onChange={v => setIniciativaBonus(v - ((atr.percepcao ?? 0) + (atr.agilidade ?? 0)))}
                  min={0}
                  className="fn-stat-val"
                />
                <button className="fn-btn-rolar fn-stat-rolar" onClick={() => handleRolar1d8("Iniciativa", iniciativaCalc)} title="Rolar Iniciativa (1d8)">
                  <i className="fas fa-dice-d20" />
                </button>
              </div>
              <div className="fn-stat-item fn-stat-item--center">
                <span className="fn-stat-label">REAÇÃO ESQ</span>
                <span className="fn-stat-val">{reacaoEsqCalc}</span>
              </div>
              <div className="fn-stat-item">
                <span className="fn-stat-label">DESLOCAMENTO</span>
                <span className="fn-stat-val">{deslocamentoCalc}m</span>
              </div>
            </div>

            {/* Sociais */}
            <div className="fn-secao-titulo">SOCIAIS</div>
            <div className="fn-sociais-grid">
              <div className="fn-social-item">
                <span className="fn-social-label">CARISMA</span>
                <span className="fn-social-val">{atr.carisma ?? 0}</span>
              </div>
              <div className="fn-social-item">
                <span className="fn-social-label">MANIPULAÇÃO</span>
                <span className="fn-social-val">{atr.manipulacao ?? 0}</span>
              </div>
            </div>
            <button className="fn-btn-escolher-teste" onClick={() => setModalTesteAberto(true)}>
              <i className="fas fa-dice-d20" /> Escolher Teste
            </button>
          </div>{/* fim fn-col-esquerda */}

          {/* ── COL MEIO: perícias ── */}
          <div className="fn-col-meio">
            <div className="fn-meio-body">

              <div className="fn-meio-pericias">
                <div className="fn-meio-col-titulo">PERÍCIAS</div>
                <AbaPericiasNova
                  periciasConfig={periciasConfig}
                  atributosConfig={atributosConfig}
                  atr={atr}
                  pericias={pericias}
                  setPericias={setPericias}
                  aptPericiaBonus={aptPericiaBonus}
                  aptidoes={aptidoes}
                  handleRolar={handleRolar}
                />
              </div>

              <div className="fn-meio-anotacoes">
                <div className="fn-meio-col-titulo">MOCHILA</div>
                <AbaMochilaNaruto
                  itens={itensMochila}
                  setItens={setItensMochila}
                  ryos={ryos}
                  setRyos={setRyos}
                  nc={nc}
                  handleRolar={handleRolar}
                  hcCalc={hcCalc}
                />
              </div>

            </div>
          </div>

        </div>{/* fim fn-body */}

        {/* ── COL DIREITA: abas — filho direto do fn-sheet (col 3, linhas 1-2) ── */}
        <div className="fn-col-direita">

          {/* Painel de Pontos fixo no topo */}
          <PainelPontos nc={nc} atr={atr} pericias={pericias} poderes={poderes} aptidoes={aptidoes} jutsus={jutsus} />

          {/* Barra de abas */}
          <div className="fn-identidade-abas">
            <button className="fn-aba-icone-btn" onClick={() => setPainelAberto(p => !p)} title="Histórico de rolagens">
              <i className="fa-solid fa-book" />
            </button>
            <div className="fn-abas-centro">
              {["jutsus", "poderes", "aptidões"].map(aba => (
                <button
                  key={aba}
                  className={`fn-aba-btn ${abaAtiva === aba ? "fn-aba-ativa" : ""}`}
                  onClick={() => setAbaAtiva(aba)}
                >
                  {aba.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ width: 40, flexShrink: 0 }} />
          </div>

          <div className="fn-aba-conteudo">
            {(() => {
              const evo = getEvolucao(parseInt(nc, 10) || 4);
              const gastosPoderes  = poderes.reduce((s, p) => s + (p.nivel ?? 0), 0);
              const gastosAptidoes = Math.max(0, aptidoes.length - 3) * 2;
              const gastosJutsus   = jutsus.reduce((s, j) => {
                const cfg = jutsosLivroConfig.find(c => c.id === j.fromLivro);
                return s + (cfg ? (cfg.nivel ?? 0) : 0);
              }, 0);
              const gastosPoder = gastosPoderes + gastosAptidoes + gastosJutsus;
              const ptsPoder = evo.poderes - gastosPoder;
              return (
                <>
                  {abaAtiva === "jutsus" && (
                    <AbaJutsus
                      jutsus={jutsus}
                      setJutsus={setJutsus}
                      handleRolar={handleRolar}
                      hcCalc={hcCalc}
                      ficha={ficha}
                      poderes={poderes}
                      setPoderes={setPoderes}
                      pontosRestantes={ptsPoder}
                      salvarAgora={salvarAgora}
                      pericias={pericias}
                      atr={atr}
                    />
                  )}
                  {abaAtiva === "poderes" && (
                    <AbaPoderes
                      poderes={poderes}
                      setPoderes={setPoderes}
                      pontosRestantes={ptsPoder}
                      salvarAgora={salvarAgora}
                      ficha={{ atributos: atrEdit, pericias, aptidoes }}
                    />
                  )}
                  {abaAtiva === "aptidões" && (
                    <AbaAptidoes
                      aptidoes={aptidoes}
                      setAptidoes={setAptidoes}
                      atr={atr}
                      pericias={pericias}
                      hcCalc={hcCalc}
                      claId={getClaId(ficha.cla_nome)}
                      salvarAgora={salvarAgora}
                      pontosRestantes={ptsPoder}
                    />
                  )}

                </>
              );
            })()}
          </div>
        </div>
      </div>

      <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
      <PainelHistorico historico={historico} aberto={painelAberto} onFechar={() => setPainelAberto(false)} />
      <ModalTesteSocial
        aberto={modalTesteAberto}
        onFechar={() => setModalTesteAberto(false)}
        ficha={ficha}
        atr={atr}
        pericias={pericias}
        handleRolar={handleRolar}
      />
    </div>
  );
};

export default FichaPersonagemNaruto;