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
  return `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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
    <span className="fn-campo-valor fn-campo-editavel" onClick={() => setEditando(true)}>
      {valor}
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
    <span className={`fn-num-val ${className}`} onClick={() => setEditando(true)}>
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
  const inp = { width: "42px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", fontWeight: "700", textAlign: "center", fontFamily: '"Be Vietnam Pro",sans-serif', letterSpacing: "2px" };
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
  const { label, d1, d2, precisao, bonus, total, critico, falhaCritica, is1d8, isDano, ataqueTotal } = resultado;
  const soma = is1d8 ? d1 : d1 + (d2 ?? 0);
  const cls = critico ? "fn-critico-max" : falhaCritica ? "fn-critico-min" : "";
  const ataqueColor = cls === "fn-critico-max" ? "#22c55e" : cls === "fn-critico-min" ? "#ef4444" : "#4a90e2";
  const ataqueShadow = cls === "fn-critico-max" ? "0 0 24px rgba(34,197,94,0.55)" : cls === "fn-critico-min" ? "0 0 24px rgba(239,68,68,0.55)" : "none";

  if (isDano) {
    const soma = d1 + (d2 ?? 0);
    const grau = soma <= 3 ? 0 : soma <= 8 ? 1 : soma <= 11 ? 2 : soma <= 14 ? 3 : 4;
    const grauLabel = grau >= 2 ? `Grau ${grau} (×${grau})` : null;
    const tooltipAtaque = `2d8[${d1}, ${d2}] + ${precisao} = ${ataqueTotal}`;
    // Monta fórmula: [DANO] + FOR/DES/ESP(x) = TOTAL
    const danoArmaBase = resultado.danoArmaBase ?? null;
    const bonusAtrDano = resultado.bonusAtrDano ?? null;
    const nomeAtrDano  = resultado.nomeAtrDano  ?? "ATR";
    let tooltipDano;
    if (danoArmaBase !== null && bonusAtrDano !== null) {
      const base = danoArmaBase + bonusAtrDano;
      tooltipDano = grau >= 2
        ? `[${danoArmaBase}] + ${nomeAtrDano}(${bonusAtrDano}) = ${base} | ${grauLabel} = ${total}`
        : `[${danoArmaBase}] + ${nomeAtrDano}(${bonusAtrDano}) = ${total}`;
    } else {
      tooltipDano = grau >= 2 ? `[${total / grau}] | ${grauLabel} = ${total}` : `[${total}]`;
    }
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
    ? `1d8[${d1}]${bonus !== 0 ? ` + ${bonus}` : ""} = ${total}`
    : `2d8[${d1}, ${d2}]${precisao !== 0 ? ` + ${precisao}` : ""}${bonus !== 0 ? ` + ${bonus}` : ""} = ${total}`;
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
              <div className="fn-painel-item-personagem">{h.personagem || h.label}</div>
              <div className="fn-painel-item-card-row">
                <i className="fas fa-dice-d20 fn-painel-item-icone" style={{ color: cor }} />
                <div className="fn-painel-item-card-body">
                  <span className="fn-painel-item-nome">{h.label}</span>
                  <div className="fn-painel-item-pericia-row">
                    <span className="fn-painel-item-formula-inline">[{h.d1}{h.d2 != null ? `+${h.d2}` : ""}]</span>
                    <span className="fn-painel-item-igual">=</span>
                    <span className="fn-painel-item-total" style={{ color: cor }}>{h.isDano ? h.ataqueTotal : h.total}</span>
                  </div>
                  {h.isDano && (
                    <div className="fn-painel-item-pericia-row" style={{ marginTop: -2 }}>
                      <span className="fn-painel-item-formula-inline" style={{ fontSize: "0.75rem" }}>dano</span>
                      <span className="fn-painel-item-igual">=</span>
                      <span className="fn-painel-item-total" style={{ color: "#fff", fontSize: "1.1rem" }}>{h.total}</span>
                    </div>
                  )}
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

// ── Modal descrição de atributo ──────────────────────────────────────────────
const ModalDescAtributo = ({ atributo, onFechar }) => {
  if (!atributo) return null;
  return (
    <div className="fn-atr-desc-overlay" onClick={onFechar}>
      <div className="fn-atr-desc-modal" onClick={e => e.stopPropagation()}>
        <div className="fn-atr-desc-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="fn-atr-desc-sigla">{atributo.sigla}</span>
            <h2 className="fn-atr-desc-titulo">{atributo.nome}</h2>
          </div>
          <button className="fn-atr-desc-fechar" onClick={onFechar}><i className="fas fa-times" /></button>
        </div>
        <div className="fn-atr-desc-body">
          {atributo.desc.split("\n\n").map((par, i) => (
            <p key={i} className={i === 0 ? "fn-atr-desc-intro" : "fn-atr-desc-texto"}>{par}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

const periciasConfig = [
  { id: "acrobacia", nome: "Acrobacia", atr: "agilidade", sigla: "AGI", desc: "Você pode realizar proezas físicas extraordinárias como equilibrismo, acrobacias, escapar de quedas e se mover com graça em situações de risco.\n\nEquilíbrio (Dif 12): mover-se por superfícies estreitas ou instáveis. Cair: reduza 3m do dano por nível nesta perícia. Acrobacias avançadas (Dif 16–20): mortais, saltos elaborados e movimentos impossíveis." },
  { id: "arte", nome: "Arte", atr: "inteligencia", sigla: "INT", desc: "Você possui talento criativo e técnico em uma forma de expressão artística, seja pintura, escultura, música, poesia ou qualquer outra manifestação cultural.\n\nAlém do valor estético, Arte é a perícia base de poderes como Sumi-e (Pergaminho das Bestas), determinando alcance, dano e dificuldade de resistência nesse sistema." },
  { id: "atletismo", nome: "Atletismo", atr: "forca", sigla: "FOR", desc: "Você é fisicamente condicionado para esforços prolongados: nadar, escalar, correr longas distâncias e saltar obstáculos.\n\nNadar (Dif 12): mover-se normalmente na água. Escalar (Dif 12): superfícies com apoio. Salto horizontal: FOR + nível da perícia em metros. Salto vertical: metade disso." },
  { id: "ciencias_naturais", nome: "Ciências Naturais", atr: "inteligencia", sigla: "INT", desc: "Você possui conhecimento das ciências do mundo natural — biologia, botânica, geologia, zoologia e fenômenos naturais.\n\nPermite identificar plantas, animais, minerais, venenos naturais e prever fenômenos climáticos. Também abrange conhecimentos de geografia e ecologia do mundo ninja." },
  { id: "concentracao", nome: "Concentração", atr: "inteligencia", sigla: "INT", desc: "Você mantém o foco mesmo em situações de extrema pressão — manter técnicas ativas enquanto é atacado, resistir a distrações e sustentar efeitos de concentração.\n\nConcentração é exigida para manter técnicas contínuas em combate. Falha no teste interrompe a técnica. A Dif base é 16, +2 para cada ferimento sofrido no turno." },
  { id: "cultura", nome: "Cultura", atr: "inteligencia", sigla: "INT", desc: "Você possui conhecimento abrangente sobre história, política, tradições, lendas e técnicas shinobi do mundo.\n\nPermite identificar técnicas ninjas em uso, reconhecer clãs e suas habilidades, conhecer lendas e eventos históricos, e entender contextos políticos entre as aldeias. Essencial para identificar jutsus de inimigos." },
  { id: "disfarces", nome: "Disfarces", atr: "percepcao", sigla: "PER", desc: "Você sabe criar e manter disfarces convincentes — alterando aparência, voz, postura e comportamento para se passar por outra pessoa ou tipo de pessoa.\n\nCriar disfarce (Dif 12–20): resistido por Prontidão ou Procurar de quem observa. Disfarçar outra pessoa aumenta a Dif em +4. Manter disfarce sob pressão exige novo teste." },
  { id: "escapar", nome: "Escapar", atr: "destreza", sigla: "DES", desc: "Você consegue se livrar de amarras, agarramentos e prisões físicas, usando flexibilidade e técnica para escapar de restrições.\n\nEscapar de cordas (Dif 16), algemas (Dif 20) ou agarramento (Dif = teste de Força do oponente). Cada tentativa gasta uma ação padrão. Sem a perícia, testes são feitos com penalidade." },
  { id: "furtividade", nome: "Furtividade", atr: "agilidade", sigla: "AGI", desc: "Você se move em silêncio e permanece oculto, evitando ser detectado por inimigos. Essencial para missões de infiltração e ataques surpresa.\n\nFurtividade é resistida por Prontidão (reação imediata), Procurar (busca ativa) ou Rastrear (rastros deixados). Em deslocamento normal: –4 no teste. Em corrida ou investida: –16. Atacar alguém que falhou contra sua Furtividade o deixa desprevenido (–3 nas defesas)." },
  { id: "lidar_animais", nome: "Lidar c/ Animais *", atr: "percepcao", sigla: "PER", desc: "Você pode domesticar, treinar e comandar animais. Exige treinamento para usos além do básico.\n\nDomesticar (Dif 20), ensinar truque (Dif 12 + 1 semana), forçar truque desconhecido (Dif 20, ação completa), manejar animal treinado (Dif 8, ação padrão). Você recebe +4 em testes com seu próprio companheiro animal." },
  { id: "mecanismos", nome: "Mecanismos *", atr: "inteligencia", sigla: "INT", desc: "Você sabe desabilitar, sabotar ou reativar dispositivos mecânicos como fechaduras, armadilhas e veículos. Exige kit de ferramentas (–4 sem ele).\n\nAção simples Dif 8, média Dif 12–16, complexa Dif 20. Abrir fechaduras: Dif 16–24. Criar armadilha: 10 minutos + kit, dano máximo = nível da perícia, grau máximo 3." },
  { id: "medicina", nome: "Medicina *", atr: "inteligencia", sigla: "INT", desc: "Você trata ferimentos, doenças e venenos. Usos avançados exigem a aptidão Ninja Médico.\n\nPrimeiros socorros (Dif 16): estabiliza sangramentos. Cuidados prolongados (Dif 12): dobra recuperação diária de Vitalidade. Tratar veneno/doença: +4 no próximo teste de Vigor do paciente. Usar em si mesmo: –4 no teste." },
  { id: "ocultismo", nome: "Ocultismo *", atr: "inteligencia", sigla: "INT", desc: "Você possui conhecimento das artes místicas, selamentos, rituais e fenômenos sobrenaturais além do ninjutsu convencional.\n\nPermite identificar selos de selamento, compreender rituais antigos, reconhecer efeitos de maldições e trabalhar com técnicas de selamento avançadas. Exige treinamento específico." },
  { id: "prestidigitacao", nome: "Prestidigitação", atr: "destreza", sigla: "DES", desc: "Você consegue surrupiar ou plantar objetos nos bolsos de outras pessoas, realizar truques com mãos e disfarçar gestos técnicos.\n\nTruque com objetos (Dif 16): resistido por Prontidão do alvo. Disfarçar técnica: ação livre, teste resistido por Prontidão — sucesso impõe –2 no teste de Cultura ou Ocultismo do oponente para identificar o jutsu." },
  { id: "procurar", nome: "Procurar", atr: "percepcao", sigla: "PER", desc: "Você usa seus sentidos ativamente para encontrar algo ou alguém — buscando um ladrão na multidão, procurando uma porta secreta ou examinando uma área em detalhe.\n\nDiferente de Prontidão (passiva), Procurar é uma ação ativa. Encontrar porta secreta (Dif 16–24), item em baú (Dif 8), armadilha (Dif 7 + nível de Mecanismos do construtor). Cada área de 1m gasta uma ação completa." },
  { id: "rastrear", nome: "Rastrear", atr: "percepcao", sigla: "PER", desc: "Você pode seguir rastros, guiar grupos pelo território e sobreviver nos ermos.\n\nSobrevivência: Dif 12 (planícies) a 20 (desertos). Seguir rastros: Dif 8 (neve/lama), 12 (grama), 16 (rocha). +1 para cada 3 criaturas no grupo rastreado, –1 por dia decorrido, –4 em visibilidade precária. Rastrear contra Furtividade: teste resistido." },
  { id: "prontidao", nome: "Prontidão", atr: "percepcao", sigla: "PER", desc: "Você mantém atenção constante ao que acontece ao seu redor, reagindo instintivamente a ameaças mesmo sem procurá-las ativamente.\n\nDiferente de Procurar (ativa), Prontidão é passiva — usada quando alguém tenta passar despercebido por você, ou para detectar emboscadas. Também entra no cálculo da Iniciativa. Dormindo: –8 no teste, mas sucesso acorda o personagem." },
  { id: "veneficio", nome: "Venefício * *", atr: "inteligencia", sigla: "INT", desc: "Você conhece a arte de criar, identificar e aplicar venenos — extraindo substâncias tóxicas de plantas e animais, preparando antídotos e envenenando armas.\n\nExige treinamento duplo e materiais específicos. Permite identificar venenos em uso, preparar doses, aplicar em armas e criar antídotos. A complexidade e Dif dependem do tipo de veneno." },
];

const atributosConfig = [
  { id: "forca", nome: "Força", sigla: "FOR", desc: "Força representa a potência muscular bruta de um shinobi — sua capacidade de golpear com peso, erguer objetos pesados, romper prisões físicas e sustentar combates de alta intensidade física.\n\nForça afeta diretamente o Combate Corporal quando a aptidão Acuidade não está ativa, e determina quanto dano extra o personagem causa com armas pesadas e golpes desarmados via aptidões como Punho de Ferro e Ataque Poderoso." },
  { id: "destreza", nome: "Destreza", sigla: "DES", desc: "Destreza mede a coordenação motora fina, o equilíbrio e a precisão dos movimentos de um shinobi. É essencial para quem usa armas de disparo, arremessa projéteis ou depende de mãos rápidas para selos e prestidigitação.\n\nDestreza determina o Combate à Distância e é o atributo base de perícias como Escapar e Prestidigitação. Com a aptidão Acuidade, também pode substituir Força no cálculo do CC." },
  { id: "agilidade", nome: "Agilidade", sigla: "AGI", desc: "Agilidade representa a velocidade de reação, a mobilidade no campo de batalha e a capacidade de se esquivar de ataques. Um shinobi ágil se move com fluidez, reage antes dos inimigos e é difícil de acertar.\n\nAgilidade define a Esquiva e o Deslocamento base. Também é o atributo de Acrobacia e Furtividade, e contribui diretamente para a Iniciativa junto com a perícia Prontidão." },
  { id: "percepcao", nome: "Percepção", sigla: "PER", desc: "Percepção reflete a aguçada consciência sensorial de um shinobi — visão, audição, olfato e intuição tática. Shinobi com alta Percepção raramente são surpreendidos e detectam ameaças antes que se tornem problemas.\n\nPercepção define o Ler Movimento e é base de perícias como Procurar, Rastrear, Prontidão e Disfarces. Também entra no cálculo da Iniciativa via Prontidão." },
  { id: "inteligencia", nome: "Inteligência", sigla: "INT", desc: "Inteligência mede a capacidade analítica, a memória e o raciocínio tático de um shinobi. Ninjas inteligentes dominam técnicas complexas, identificam padrões de combate e exploram fraquezas com precisão cirúrgica.\n\nInteligência é o atributo chave para a maioria das técnicas de Ninjutsu e Genjutsu. Determina também a dificuldade dos testes de resistência contra suas técnicas, e é base de perícias como Concentração, Medicina, Mecanismos e Cultura." },
  { id: "vigor", nome: "Vigor", sigla: "VIG", desc: "Vigor representa a resistência física, a durabilidade e a capacidade de absorver dano de um shinobi. É o que separa um guerreiro que sobrevive de um que cai no primeiro golpe sério.\n\nVigor define a Vitalidade Máxima do personagem e é usado nos testes de resistência a venenos, doenças e efeitos físicos. Quanto mais alto o Vigor, mais golpes o personagem pode encaixar antes de ser derrotado." },
  { id: "espirito", nome: "Espírito", sigla: "ESP", desc: "Espírito mede a conexão de um shinobi com seu chakra — a força de vontade, a concentração interna e a afinidade com as artes do ninjutsu. É o combustível de toda técnica shinobi.\n\nEspírito determina o Chakra Máximo e o dano base das técnicas de Ninpou, Katon, Suiton e demais poderes. Também é usado em testes de Concentração avançada e resistência a Genjutsus." },
  { id: "carisma", nome: "Carisma", sigla: "CAR", desc: "Carisma representa a presença, o magnetismo pessoal e a capacidade de influenciar pessoas por meios legítimos — discurso inspirador, liderança natural e negociação habilidosa.\n\nCarisma é usado em interações sociais onde o personagem tenta convencer, motivar ou impressionar NPCs e aliados. É o atributo social primário para abordagens abertas e honestas." },
  { id: "manipulacao", nome: "Manipulação", sigla: "MAN", desc: "Manipulação mede a habilidade de influenciar os outros por meios indiretos — engano, blefe, sedução e jogos psicológicos. Um shinobi com alta Manipulação raramente mostra suas cartas.\n\nManipulação é usada em interações onde o personagem tenta enganar, intimidar ou coagir — seja um interrogatório, uma negociação de alto risco ou uma missão de infiltração social." },
];

const aptidoesConfig = [
  { id: "reflexos", nome: "Reflexos", cat: "combate", req: null, desc: "O personagem é muito hábil para se esquivar de golpes e projéteis.\n\n*Benefício:* Você recebe +1 de bônus de precisão em Esquiva.", efeito: { tipo: "hc", key: "ESQ", val: 1 } },
  { id: "intuicao", nome: "Intuição", cat: "combate", req: null, desc: "O personagem é muito hábil em prever o movimento do oponente.\n\n*Benefício:* Você recebe +1 de precisão em Ler Movimento.", efeito: { tipo: "hc", key: "LM", val: 1 } },
  { id: "mestre_selos", nome: "Mestre dos Selos", cat: "combate", req: "Prest 12", desc: "*Pré-requisito:* Prestidigitação 12.\n\n*Benefício:* Você executa os selos de mão com velocidade superior. A formação de selos passa a custar somente uma ação livre. Com Prestidigitação 14, você pode realizar selos com apenas uma mão.", efeito: null },
  { id: "ataque_multiplo", nome: "Ataque Múltiplo", cat: "combate", req: "CC/CD 11", desc: "*Pré-requisito:* Combate Corporal ou Combate à Distância 11.\n\n*Benefício:* Você pode dividir seu ataque em 2 ou 3 golpes. Cada golpe sofre penalidade de precisão: –1 para 2 golpes, –2 para 3 golpes. Cada golpe é resolvido separadamente.", efeito: null },
  { id: "ponto_cego", nome: "Ponto Cego", cat: "combate", req: "Agi/Prest 6", desc: "*Pré-requisito:* Agilidade ou Prestidigitação 6.\n\n*Benefício:* Você pode realizar uma finta usando uma ação de movimento, ao invés de uma ação padrão.", efeito: null },
  { id: "retirada_rapida", nome: "Retirada Rápida", cat: "combate", req: "Agi 10", desc: "*Pré-requisito:* Agilidade 10.\n\n*Benefício:* Você pode recuar do combate sem provocar ataques oportunos.", efeito: null },
  { id: "usar_arm_pesada", nome: "Usar Armaduras Pesadas", cat: "combate", req: "FOR/VIG", desc: "*Pré-requisito:* Força ou Vigor adequados.\n\n*Benefício:* Você sabe usar armaduras pesadas sem sofrer penalidade extra de precisão.", efeito: null },
  { id: "guerreiro", nome: "Guerreiro", cat: "combate", req: "FOR/DES 10", desc: "*Pré-requisito:* Força ou Destreza 10.\n\n*Benefício:* Você pode realizar manobras com armas pesadas e longas sem sofrer penalidade de precisão.", efeito: null },
  { id: "critico_aprimorado", nome: "Crítico Aprimorado", cat: "combate", req: "Esp + CC/CD 13", desc: "*Pré-requisito:* Espírito + CC ou CD 13.\n\n*Benefício:* Escolha uma arma ou estilo. O resultado mínimo do dado para atingir um crítico é reduzido em 1 com esse tipo de ataque.", efeito: null, generica: true },
  { id: "dano_extra", nome: "Dano Extra", cat: "combate", req: "CC/CD 18", desc: "*Pré-requisito:* CC ou CD 18.\n\n*Benefício:* Escolha uma categoria de ataque (corpo-a-corpo ou distância). Você recebe +1 de dano de arma nos ataques dessa categoria.", efeito: null, generica: true },
  { id: "atirador", nome: "Atirador", cat: "combate", req: "DES 12", desc: "*Pré-requisito:* Destreza 12.\n\n*Benefício:* Você recebe +3 de dano em ataques de arremesso ou +1 de dano com arcos.", efeito: null },
  { id: "tiro_longo", nome: "Tiro Longo", cat: "combate", req: "DES 12", desc: "*Pré-requisito:* Destreza 12.\n\n*Benefício:* Você dobra o alcance de suas armas de disparo.", efeito: null },
  { id: "tiro_preciso", nome: "Tiro Preciso", cat: "combate", req: "DES 9", desc: "*Pré-requisito:* Destreza 9.\n\n*Benefício:* Seus ataques à distância ignoram cobertura parcial e camuflagem parcial.", efeito: null },
  { id: "mira_apurada", nome: "Mira Apurada", cat: "combate", req: "DES 12", desc: "*Pré-requisito:* Destreza 12; Tiro Longo.\n\n*Benefício:* Você pode gastar uma ação de movimento para mirar, recebendo +1 de CD até o final do turno.", efeito: null },
  { id: "blq_ambidestro", nome: "Bloqueio Ambidestro", cat: "combate", req: "Ambidestria", desc: "*Pré-requisito:* Ambidestria.\n\n*Benefício:* Você recebe +1 de precisão ao executar a reação de Bloqueio enquanto usa duas armas.", efeito: null },
  { id: "ambidestria", nome: "Ambidestria", cat: "combate", req: "CC 12", desc: "*Pré-requisito:* Combate Corporal 12.\n\n*Benefício:* Você pode atacar com duas armas simultaneamente. O dano de ambas as armas é somado em um único ataque.", efeito: null },
  { id: "acuidade", nome: "Acuidade", cat: "combate", req: "Des 3", desc: "Você é especialmente ágil com armas leves.\n\n*Pré-requisito:* Destreza 3.\n\n*Benefício:* Você pode utilizar sua Destreza para calcular seu CC. Seu nível de CC passa a ser igual ao Valor Base + Destreza.", efeito: { tipo: "acuidade" } },
  { id: "diligente", nome: "Diligente", cat: "combate", req: null, desc: "*Benefício:* Você recebe +3 de bônus nos testes de Iniciativa. Uma vez por cena, pode rolar novamente o teste de Iniciativa. Deve aceitar a segunda rolagem.", efeito: { tipo: "iniciativa", val: 3 } },
  { id: "velocista", nome: "Velocista", cat: "combate", req: null, desc: "*Benefício:* Sem armadura ou com armadura leve, você dobra sua Agilidade para determinar o deslocamento. Quando acelerado ou super acelerado, recebe +10m ao invés disso.", efeito: { tipo: "velocista" } },
  { id: "especialista", nome: "Especialista", cat: "combate", req: null, desc: "*Benefício:* Escolha um tipo de arma ou combate desarmado. Você recebe +1 de precisão nos ataques com esse tipo de arma ou estilo.", efeito: { tipo: "especialista" }, generica: true },
  { id: "combate_defensivo", nome: "Combate Defensivo", cat: "combate", req: "CC 9", desc: "*Pré-requisito:* Combate Corporal 9.\n\n*Benefício:* Declare antes de atacar corpo-a-corpo ou com técnica de toque. Você sofre –2 na precisão, mas recebe +3 em Esquiva até o próximo turno.", efeito: null },
  { id: "maestria", nome: "Maestria", cat: "combate", req: null, desc: "*Benefício:* Escolha um poder ou técnica. Você recebe +1 de precisão em CC e CD com esse poder ou técnica ofensiva. Não é cumulativo com Especialista.", efeito: null, generica: true },
  { id: "ataque_movimento", nome: "Ataque em Movimento", cat: "combate", req: "Agi 4", desc: "*Pré-requisito:* Agilidade 4.\n\n*Benefício:* Você pode dividir seu deslocamento em duas partes, movendo-se antes e depois de um ataque, desde que a distância total não supere seu deslocamento máximo.", efeito: null },
  { id: "trespassar", nome: "Trespassar", cat: "combate", req: "CC 7", desc: "*Pré-requisito:* Combate Corporal 7.\n\n*Benefício:* Quando você abate uma criatura em combate corporal, pode executar um ataque extra contra outra criatura no alcance. Somente uma vez por rodada.", efeito: null },
  { id: "de_pe", nome: "De Pé", cat: "combate", req: null, desc: "*Benefício:* Você pode se levantar com uma ação livre no seu turno. Uma vez por cena, pode usar como reação imediatamente após ser derrubado.", efeito: null },
  { id: "oportunista", nome: "Oportunista", cat: "combate", req: null, desc: "*Benefício:* Você pode realizar ataques oportunos adicionais equivalentes à metade da Agilidade, sempre contra inimigos diferentes. Também permite ataque oportuno estando desprevenido.", efeito: null },
  { id: "mobilidade", nome: "Mobilidade", cat: "combate", req: "Agi 3", desc: "*Pré-requisito:* Agilidade 3; Reflexos.\n\n*Benefício:* Você recebe +3 de Esquiva contra ataques oportunos provocados ao se movimentar.", efeito: null },
  { id: "saque_rapido", nome: "Saque Rápido", cat: "combate", req: null, desc: "*Benefício:* Você pode sacar ou guardar uma arma como ação livre. Também pode sacar sua arma corpo-a-corpo durante uma reação de Bloqueio.", efeito: null },
  { id: "lutar_cego", nome: "Lutar às Cegas", cat: "combate", req: null, desc: "*Benefício:* Sob camuflagem ou com visão prejudicada, você não fica desprevenido e pode rolar novamente a chance de acertar quando errar por camuflagem.\n\n*Normal:* Sem esta aptidão, o personagem fica desprevenido contra inimigos que não possa ver.", efeito: null },
  { id: "rolamento", nome: "Rolamento", cat: "combate", req: "Acro 2", desc: "*Pré-requisito:* Acrobacia 2; De Pé.\n\n*Benefício:* Após cair, você se levanta imediatamente como reação. Dobra a redução de queda dos testes de Acrobacia ou Atletismo.", efeito: null },
  { id: "usar_arma", nome: "Usar Arma", cat: "combate", req: null, desc: "*Benefício:* Escolha uma arma marcial ou especial. Você recebe proficiência nela, sem penalidades. Pode ser comprada várias vezes para armas diferentes.\n\n*Normal:* Sem esta aptidão, armas marciais ou especiais impõem –3 de penalidade de precisão.", efeito: null, generica: true },
  // MANOBRA
  { id: "lutador", nome: "Lutador", cat: "manobra", req: null, desc: "Você é talentoso nas artes marciais desarmadas.\n\n*Benefício:* Você não sofre a penalidade de –2 de precisão ao utilizar manobras especiais de combate estando desarmado ou usando armas naturais (agarrar, atropelar, derrubar, desarmar e empurrar).", efeito: null },
  { id: "punho_ferro", nome: "Punho de Ferro", cat: "manobra", req: "FOR 2", desc: "*Pré-requisito:* Força 2.\n\n*Benefício:* Ao atacar desarmado, você causa dano letal ou não-letal e recebe 1 de dano de arma. Aumenta com Força: FOR 8 → 2; FOR 10 → 3; FOR 12 → 4 (máximo).", efeito: { tipo: "punho_ferro" } },
  { id: "apanhar_objetos", nome: "Apanhar Objetos", cat: "manobra", req: null, desc: "*Benefício:* Ao bloquear um projétil, você pode apanhá-lo ao invés de desviar. Armas de arremesso podem ser devolvidas como ação livre. Permite usar Rebater Projétil como reação.", efeito: null },
  { id: "ataque_giratório", nome: "Ataque Giratório", cat: "manobra", req: "CC 8", desc: "*Pré-requisito:* Combate Corporal 8.\n\n*Benefício:* Seu ataque acerta todas as criaturas no alcance corpo-a-corpo. Apenas um teste de acerto; cada alvo defende normalmente. Pode ser usado com armas pesadas.", efeito: null },
  { id: "ataque_poderoso", nome: "Ataque Poderoso", cat: "manobra", req: "CC 7", desc: "*Pré-requisito:* Combate Corporal 7.\n\n*Benefício:* Declare antes de atacar corpo-a-corpo. Sofre –1 na precisão, mas recebe +1 de dano. Pode ser combinado com manobras que não concedam bônus de precisão ou dano.", efeito: null },
  { id: "ataque_atordoante", nome: "Ataque Atordoante", cat: "manobra", req: "FOR 12", desc: "*Pré-requisito:* Força 12.\n\n*Benefício:* Você pode realizar um ataque desarmado sem causar dano. Se acertar, o alvo deve testar Vigor (dif = seu CC) ou ficar atordoado.", efeito: null },
  { id: "arremessar", nome: "Arremessar", cat: "manobra", req: "FOR 6", desc: "*Pré-requisito:* Força 6.\n\n*Benefício:* Ao usar a manobra Derrubar, você pode arremessar o inimigo derrubado a até FOR metros de distância.", efeito: null },
  { id: "rasteira", nome: "Rasteira", cat: "manobra", req: null, desc: "*Benefício:* Você realiza a manobra Derrubar com +1 de precisão no ataque. Pode ser combinada com Derrubar Agressivo.", efeito: null },
  { id: "derrubar_agr", nome: "Derrubar Agressivo", cat: "manobra", req: "Lutador/Guerreiro", desc: "*Pré-requisito:* Lutador ou Guerreiro.\n\n*Benefício:* Ao usar a manobra Derrubar, você pode optar por causar dano e derrubar ao mesmo tempo. O alvo testa Vigor (dif 2 + seu CC) para se manter de pé.", efeito: null },
  { id: "desarme_agr", nome: "Desarme Agressivo", cat: "manobra", req: "Lutador/Guerreiro", desc: "*Pré-requisito:* Lutador ou Guerreiro.\n\n*Benefício:* Ao usar a manobra Desarmar, além de desarmar o alvo, você também causa dano.", efeito: null },
  { id: "bloquear_arma", nome: "Bloquear Arma", cat: "manobra", req: null, desc: "*Benefício:* +1 de precisão ao executar Bloqueio contra ataques armados. Com 4+ de margem, pode Desarmar como ação livre. Acerto crítico no Bloqueio desarma automaticamente.", efeito: null },
  { id: "contragolpe", nome: "Contragolpe", cat: "manobra", req: "CC 12", desc: "*Pré-requisito:* Combate Corporal 12.\n\n*Benefício:* Quando você bloqueia um ataque com margem de 4 ou mais pontos, pode realizar um ataque oportuno contra o atacante.", efeito: null },
  { id: "chute_giratório", nome: "Chute Giratório", cat: "manobra", req: "CC 10", desc: "*Pré-requisito:* Combate Corporal 10.\n\n*Benefício:* Você realiza um Ataque Giratório desarmado com +2 de dano.", efeito: null },
  { id: "chute_duplo", nome: "Chute Duplo", cat: "manobra", req: "Chute Gir.", desc: "*Pré-requisito:* Chute Giratório.\n\n*Benefício:* Você pode usar Ataque Múltiplo combinando Chute Giratório com um chute comum.", efeito: null },
  { id: "chute_inverso", nome: "Chute Inverso", cat: "manobra", req: "CC 14", desc: "*Pré-requisito:* Combate Corporal 14.\n\n*Benefício:* Você executa uma finta seguida de ataque. O alvo não pode usar a reação de Bloqueio.", efeito: null },
  { id: "soco_agarrado", nome: "Soco Agarrado", cat: "manobra", req: "Lutador", desc: "*Pré-requisito:* Lutador.\n\n*Benefício:* Ao atacar desarmado, seu oponente não pode se defender com Bloqueio. Só pode ser usada se o alvo estiver desarmado ou usando arma leve.", efeito: null },
  { id: "soco_gancho", nome: "Soco em Gancho", cat: "manobra", req: "CC 11", desc: "*Pré-requisito:* Combate Corporal 11.\n\n*Benefício:* O último golpe do Ataque Múltiplo recebe +1 de precisão e +1 de dano.", efeito: null },
  { id: "golpe_atemi", nome: "Golpe Atemi", cat: "manobra", req: "Ataque Pod.", desc: "*Pré-requisito:* Ataque Poderoso.\n\n*Benefício:* Você ataca um ponto vital com –1 de precisão e +2 de dano.", efeito: null },
  { id: "golpe_karate", nome: "Golpe Caratê", cat: "manobra", req: "CC 15", desc: "*Pré-requisito:* Combate Corporal 15.\n\n*Benefício:* Seus ataques desarmados ignoram 2 pontos de dureza de corpo do alvo.", efeito: null },
  { id: "voadora", nome: "Voadora", cat: "manobra", req: "Derrubar Agr.", desc: "*Pré-requisito:* Derrubar Agressivo; Ataque Poderoso.\n\n*Benefício:* Você realiza uma Investida e aplica Derrubar Agressivo ao final. Recebe –1 de precisão e +2 de dano; o alvo sofre +3 níveis na dificuldade para não ser derrubado.", efeito: null },
  { id: "seguir_sombra", nome: "Seguir Sombra", cat: "manobra", req: "Arremessar", desc: "*Pré-requisito:* Arremessar.\n\n*Benefício:* Após arremessar um inimigo, você pode mover-se até ele e realizar um ataque adicional contra o mesmo alvo.", efeito: null },
  { id: "ataque_progressivo", nome: "Ataque Progressivo", cat: "manobra", req: "Agi 14 ou Hachimon 6", desc: "*Pré-requisito:* Agilidade 14 ou Hachimon Tonkou 6.\n\n*Benefício:* Após um Ataque Múltiplo bem-sucedido, você pode realizar mais 2 rolagens de ataque extras.", efeito: null },
  // TÉCNICAS
  { id: "tecnica_acelerada", nome: "Técnica Acelerada", cat: "tecnica", req: "ESP/INT 12", desc: "*Pré-requisito:* Espírito ou Inteligência 12.\n\n*Benefício:* Você pode executar uma técnica que normalmente custa ação padrão usando apenas uma ação de movimento.", efeito: null },
  { id: "tecnica_eficiente", nome: "Técnica Eficiente", cat: "tecnica", req: "ESP/INT 10", desc: "*Pré-requisito:* Espírito ou Inteligência 10.\n\n*Benefício:* Quando rola o grau de dano de uma técnica, você pode relançar o dado uma vez e ficar com o melhor resultado.", efeito: null },
  { id: "tecnica_elevada", nome: "Técnica Elevada", cat: "tecnica", req: "INT 6", desc: "*Pré-requisito:* Inteligência 6.\n\n*Benefício:* A dificuldade dos testes de resistência contra suas técnicas de perícia aumenta em +2.", efeito: null },
  { id: "tecnica_poderosa", nome: "Técnica Poderosa", cat: "tecnica", req: "ESP/INT 12", desc: "*Pré-requisito:* Espírito ou Inteligência 12.\n\n*Benefício:* O Grau de Dano das suas técnicas ofensivas aumenta em +0,5 (arredondado para cima).", efeito: null },
  { id: "potencializar", nome: "Potencializar", cat: "tecnica", req: "ESP/INT 8", desc: "*Pré-requisito:* Espírito ou Inteligência 8.\n\n*Benefício:* Ao usar uma técnica, você pode dobrar sua área ou alcance, ou aumentar em +1 o dano base.", efeito: null },
  { id: "dominio_agua", nome: "Domínio da Água", cat: "tecnica", req: "Suiton 5", desc: "*Pré-requisito:* Suiton 5.\n\n*Benefício:* Você acumula pontos de água ao usar técnicas Suiton. Esses pontos podem ser gastos para aumentar o dano em +1.", efeito: null },
  { id: "dominio_fogo", nome: "Domínio do Fogo", cat: "tecnica", req: "Katon 5", desc: "*Pré-requisito:* Katon 5.\n\n*Benefício:* Suas técnicas Katon em área forçam o alvo a testar Vigor ou ficar debilitado.", efeito: null },
  { id: "dominio_raio", nome: "Domínio do Raio", cat: "tecnica", req: "Raiton 5", desc: "*Pré-requisito:* Raiton 5.\n\n*Benefício:* Você possui Crítico Aprimorado em todos os efeitos Raiton.", efeito: null },
  { id: "dominio_terra", nome: "Domínio da Terra", cat: "tecnica", req: "Doton 5", desc: "*Pré-requisito:* Doton 5.\n\n*Benefício:* Sua barreira Doton pode gastar chakra para aumentar a dureza em +1 por ponto gasto.", efeito: null },
  { id: "dominio_vento", nome: "Domínio do Vento", cat: "tecnica", req: "Fuuton 5", desc: "*Pré-requisito:* Fuuton 5.\n\n*Benefício:* Suas técnicas Fuuton em área geram ventos que reduzem o deslocamento dos afetados à metade.", efeito: null },
  { id: "dominio_ninpou", nome: "Domínio Ninpou", cat: "tecnica", req: "Ninpou 5", desc: "*Pré-requisito:* Ninpou 5.\n\n*Benefício:* A Finta de Flechas do poder Ninpou passa a custar apenas uma ação parcial.", efeito: null },
  { id: "ilusao_profunda", nome: "Ilusão Profunda", cat: "tecnica", req: "INT 5", desc: "*Pré-requisito:* Inteligência 5.\n\n*Benefício:* A dificuldade para resistir às suas ilusões aumenta em +1 (+2 contra a técnica Kai).", efeito: null },
  // SHINOBI (apenas as que custam pontos)
  { id: "clone", nome: "Clone", cat: "shinobi", req: "ESP 6", desc: "*Pré-requisito:* Espírito 6.\n\n*Benefício:* Você pode criar e controlar até 2 clones (Parceiros). Cada clone custa 1 ponto de chakra. Os clones possuem 1 Vitalidade e a mesma ficha do usuário, com –3 em todos os testes.\n\nAo comprar, escolha o material do clone (ex: energia vital — Kage Bunshin, água — Mizu Bunshin, pedra — Iwa Bunshin).\n\n*Nível 2 (req: Espírito 8):* Você pode criar e controlar até 6 clones, porém eles falham em qualquer teste de Habilidade de Combate.", efeito: null, generica: true, niveis: 2, reqNivel2: "ESP 8" },
  { id: "clone_verdadeiro", nome: "Clone Verdadeiro", cat: "shinobi", req: "ESP 10", desc: "*Pré-requisito:* Espírito 10; Clone (Kage Bunshin ou Moku Bunshin).\n\n*Benefício:* Você pode criar 1 único clone capaz de usar poderes, aptidões e jutsus básicos. As dificuldades de resistência contra os jutsus do clone são reduzidas em –3.\n\nO clone verdadeiro não pode usar poderes ou aptidões restritas, nem executar técnicas sustentadas ou por concentração. Você não pode criar outros clones enquanto possuir um clone verdadeiro ativo.", efeito: null },
  { id: "replica_enganadora", nome: "Réplica Enganadora", cat: "shinobi", req: null, desc: "*Pré-requisito:* Suiton ou Doton 4, ou Clone; Prestidigitação 10.\n\n*Benefício:* Quando for alvo de um ataque e falhar na defesa por até 2 pontos, você pode pagar 4 chakra para criar um clone que recebe o ataque em seu lugar, movendo-se para longe sem sofrer ataque oportuno. Pode ser usado 1 vez por cena.\n\n*Nível 2 (req: Prestidigitação 12):* Pode ser usado 2 vezes por cena. Após fugir, você pode tentar se esconder como parte do deslocamento.", efeito: null, niveis: 2, reqNivel2: "Prestidigitacao 12" },
  { id: "sensor", nome: "Sensor", cat: "shinobi", req: "Rastrear 10", desc: "*Pré-requisito:* Rastrear 10.\n\n*Benefício:* Você rastreia criaturas com chakra a até 10m + 2m por nível em Rastrear. Não diferencia assinaturas nem mede quantidade, mas obtém a localização exata. Custa 5 chakra, ação de movimento, dura até o início do próximo turno.", efeito: null },
  { id: "shunjutsu", nome: "Shunjutsu", cat: "shinobi", req: null, desc: "*Pré-requisito:* Destreza ou Inteligência 10; Diligente; Velocista.\n\n*Benefício:* Você usa o Shunshin no Jutsu em combate. Custa 1 chakra por uso (ação livre durante deslocamento ou defesa). Usa Espírito no lugar de atributos em testes de deslocamento e manobras. Permite usar Kawarimi uma vez adicional por cena.\n\n*Nível 2 (req: Des ou INT 12):* Você pode fintar usando Destreza ou Inteligência no lugar de Agilidade.\n\n*Nível 3 (req: Des ou INT 16):* Você é considerado acelerado enquanto se move com shunjutsu.", efeito: null, niveis: 3, reqNivel2: "Des 12", reqNivel3: "Des 16" },
  // GERAIS (apenas as que custam pontos)
  { id: "ninja_medico", nome: "Ninja Médico", cat: "geral", req: "Medicina 7", desc: "*Pré-requisito:* Medicina 7.\n\n*Benefício:* Você está habilitado a realizar cirurgias, preparar remédios e usar técnicas de cura. Sem esta aptidão, personagens com Medicina apenas podem aplicar primeiros socorros básicos.", efeito: { tipo: "treino_pericia", pericia: "medicina" } },
  { id: "quimico", nome: "Químico", cat: "geral", req: "INT 8", desc: "*Pré-requisito:* Inteligência 8.\n\n*Benefício:* Você está habilitado a comprar e usar a perícia Venefício.", efeito: { tipo: "treino_pericia", pericia: "veneficio" } },
  { id: "elemento_natural", nome: "Elemento Natural", cat: "geral", req: null, desc: "*Benefício:* Escolha um elemento natural (Katon, Suiton, Raiton, Doton ou Fuuton). Você pode usar as técnicas básicas desse elemento mesmo sem o poder correspondente.", efeito: null, generica: true },
];

const CATS = [
  { id: "gratuita", label: "GRATUITAS" },
  { id: "combate", label: "COMBATE" },
  { id: "manobra", label: "MANOBRA" },
  { id: "tecnica", label: "TÉCNICA" },
  { id: "shinobi", label: "SHINOBI" },
  { id: "geral", label: "GERAL" },
];

const aptidoesGratuitasConfig = [
  {
    id: "g_acuidade", nome: "Acuidade", cat: "gratuita", req: "Des 3",
    desc: "Você é especialmente ágil com armas leves, que usam mais destreza do que força bruta.\n\n*Pré-requisito:* Destreza 3.\n\n*Benefício:* Você é capaz de utilizar sua Destreza para calcular seu nível de Combate Corporal. Ou seja, seu nível de CC passa a ser igual ao Valor Base + Destreza.\n\n*Ataques:* Somente pode ser usada para ataques desarmados, técnicas com alcance de toque, armas leves e armas de arremesso que podem ser usadas no corpo-a-corpo (como kunai).\n\n*Dano:* O dano do ataque não é alterado por esta aptidão.\n\n*Bloqueio:* Pode ser usada na reação de Bloqueio com um tipo de arma permitido ou desarmado.\n\n*Pré-requisitos:* Você pode utilizar o seu novo nível de CC com Acuidade para cumprir pré-requisitos de aptidões ou poderes, desde que possam ser usados com Acuidade.",
    efeito: { tipo: "acuidade" },
  },
  {
    id: "g_ataque_movimento", nome: "Ataque em Movimento", cat: "gratuita", req: "Agi 4",
    desc: "O personagem foi treinado para atacar com rapidez, movimentando-se com agilidade.\n\n*Pré-requisito:* Agilidade 4.\n\n*Benefício:* Você pode dividir sua ação de deslocamento em duas partes, movimentando-se antes e depois de um ataque (seja corpo-a-corpo, à distância ou técnica), desde que a distância total percorrida não seja maior que seu deslocamento máximo.",
    efeito: null,
  },
  {
    id: "g_comb_defensivo", nome: "Combate Defensivo", cat: "gratuita", req: "CC 9",
    desc: "Você é capaz de usar suas habilidades de combate tanto para atacar quanto para se defender.\n\n*Pré-requisito:* Combate Corporal 9.\n\n*Benefício:* Declare que está usando esta aptidão antes de executar um ataque corpo-a-corpo ou técnica de alcance toque. Você sofre –2 na precisão de ataque, mas recebe +3 de bônus em Esquiva até o próximo turno.\n\nVocê não pode utilizar Combate Defensivo com manobras ou aptidões de manobra que concedam bônus de precisão, como Rasteira e Investida.",
    efeito: null,
  },
  {
    id: "g_de_pe", nome: "De Pé", cat: "gratuita", req: null,
    desc: "Você se levanta mais rapidamente que pessoas comuns.\n\n*Benefício:* Você pode se levantar com uma ação livre dentro do seu turno, em vez de uma ação de movimento. Uma vez por cena, é possível usar esta aptidão como uma reação imediatamente após ser derrubado pelo oponente.",
    efeito: null,
  },
  {
    id: "g_diligente", nome: "Diligente", cat: "gratuita", req: null,
    desc: "*Benefício:* Você recebe +3 de bônus nos testes de Iniciativa. Uma vez por cena, também pode rolar outra vez o teste de Iniciativa, inclusive em testes de desempate. Você deve aceitar a segunda rolagem, mesmo que seja pior que a primeira.",
    efeito: { tipo: "iniciativa", val: 3 },
  },
  {
    id: "g_especialista", nome: "Especialista", cat: "gratuita", req: null,
    desc: "*Benefício:* Você é especializado no uso de um tipo de arma ou em combate desarmado. Recebe +1 de precisão com a arma ou estilo escolhido.",
    efeito: null, generica: true,
  },
  {
    id: "g_intuicao", nome: "Intuição", cat: "gratuita", req: null,
    desc: "O personagem é muito hábil em prever o movimento do oponente.\n\n*Benefício:* Você recebe +1 de precisão em Ler Movimento.",
    efeito: { tipo: "hc", key: "LM", val: 1 },
  },
  {
    id: "g_lutador", nome: "Lutador", cat: "gratuita", req: null,
    desc: "Você é talentoso nas artes marciais desarmadas.\n\n*Benefício:* Você não sofre a penalidade de –2 de precisão ao utilizar as manobras especiais de combate estando desarmado ou usando armas naturais (agarrar, atropelar, derrubar, desarmar e empurrar).",
    efeito: null,
  },
  {
    id: "g_lutar_cego", nome: "Lutar às Cegas", cat: "gratuita", req: null,
    desc: "Você tem maiores chances de atingir alvos que não possa ver.\n\n*Benefício:* Quando você está sob camuflagens do ambiente (como fumaças e névoas, naturais ou não) ou com visão prejudicada (como escuridão ou cegueira), você não fica desprevenido contra inimigos que não possa ver, e sempre que você erra um ataque devido à camuflagem, pode rolar mais uma vez a porcentagem de chance de acertar.\n\n*Normal:* Um personagem sem esta aptidão fica desprevenido contra inimigos que não possa ver.\n\n*Nível 2 (req: Prontidão 12):* Você pode lutar contra um inimigo sem manter contato visual olho-a-olho com o mesmo.",
    efeito: null, niveis: 2, reqNivel2: "Prontidao 12",
  },
  {
    id: "g_maestria", nome: "Maestria", cat: "gratuita", req: null,
    desc: "*Benefício:* Escolha um poder ou técnica. Você recebe um bônus de +1 de precisão para testes de CC e CD com o poder ou técnica ofensiva escolhida. Se for comprada para o poder Ninpou, por exemplo, você recebe CD +1 no teste do efeito Canhão e também CC +1 ao atacar com o efeito Energizar.\n\nOs benefícios desta aptidão não são cumulativos com Especialista (em nenhuma hipótese!).",
    efeito: null, generica: true,
  },
  {
    id: "g_mobilidade", nome: "Mobilidade", cat: "gratuita", req: "Agi 3",
    desc: "O personagem foi treinado para se esquivar entre os oponentes e evitar golpes.\n\n*Pré-requisitos:* Agilidade 3, Reflexos.\n\n*Benefício:* Seu personagem recebe +3 de bônus de Esquiva contra os ataques oportunos provocados quando ele se movimenta.",
    efeito: null,
  },
  {
    id: "g_oportunista", nome: "Oportunista", cat: "gratuita", req: null,
    desc: "O personagem é capaz de reagir rápida e repetidamente contra os oponentes que baixam a própria guarda.\n\n*Benefício:* O personagem poderá realizar uma quantidade de ataques oportunos adicionais equivalentes à metade do nível de Agilidade, sempre contra inimigos diferentes. Oportunista não permite realizar mais de um ataque oportuno contra o mesmo inimigo.\n\nEssa aptidão também permite realizar ataque oportuno mesmo se o personagem estiver desprevenido.\n\n*Normal:* Sem essa aptidão, um personagem somente consegue realizar um ataque oportuno a cada rodada e não será capaz de desferir ataques oportunos enquanto estiver desprevenido.",
    efeito: null,
  },
  {
    id: "g_punho_ferro", nome: "Punho de Ferro", cat: "gratuita", req: "For 2",
    desc: "O personagem é um mestre no combate desarmado.\n\n*Pré-requisitos:* Força 2.\n\n*Benefício:* Ao atacar desarmado, você é capaz de causar dano letal ou não-letal (à sua escolha) e recebe 1 de dano de arma.\n\nO dano de arma aumenta automaticamente conforme seu nível original de Força:\n• Força 8: 2 de dano de arma\n• Força 10: 3 de dano de arma\n• Força 12: 4 de dano de arma (máximo)\n\nPunho de Ferro não afeta ataques desarmados que já possuem seu próprio dano de arma, como o poder Juuken ou a Potência da Besta do hijutsu Jinchuuriki.",
    efeito: { tipo: "punho_ferro" },
  },
  {
    id: "g_reflexos", nome: "Reflexos", cat: "gratuita", req: null,
    desc: "O personagem é muito hábil para se esquivar de golpes e projéteis.\n\n*Benefício:* Você recebe +1 de bônus de precisão em Esquiva.",
    efeito: { tipo: "hc", key: "ESQ", val: 1 },
  },
  {
    id: "g_rolamento", nome: "Rolamento", cat: "gratuita", req: "Acrobacia 2",
    desc: "Você consegue diminuir o dano sofrido ao ser derrubado.\n\n*Pré-requisito:* Acrobacia 2; De Pé.\n\n*Benefício:* Após cair ou ser derrubado, você fica de pé imediatamente, levantando-se como uma reação. Sempre que for sofrer dano de queda, dobre a redução de altura dos testes de Acrobacia ou Atletismo para amortecer a queda.",
    efeito: null,
  },
  {
    id: "g_saque_rapido", nome: "Saque Rápido", cat: "gratuita", req: null,
    desc: "O personagem é capaz de sacar suas armas com uma velocidade estonteante.\n\n*Benefício:* Você pode sacar ou guardar uma arma (ou munição) como uma ação livre. Você também pode sacar sua arma corpo-a-corpo durante uma reação de Bloqueio.",
    efeito: null,
  },
  {
    id: "g_trespassar", nome: "Trespassar", cat: "gratuita", req: "CC 7",
    desc: "O personagem é capaz de realizar outro ataque corporal depois de um golpe eficiente.\n\n*Pré-requisitos:* Combate Corporal 7.\n\n*Benefício:* Num combate corporal, quando seu personagem causar dano suficiente para abater uma criatura (reduzindo seus pontos de vida a 0 ou menos), poderá executar um ataque corporal extra contra uma criatura dentro do alcance corpo-a-corpo. O personagem pode usar essa habilidade somente uma vez por rodada e somente no seu próprio turno.\n\n*Nível 2 (req: CC 9):* Você pode usar Trespassar quantas vezes quiser na mesma rodada.",
    efeito: null, niveis: 2, reqNivel2: "CC 9",
  },
  {
    id: "g_usar_arma", nome: "Usar Arma", cat: "gratuita", req: null,
    desc: "Escolha uma arma marcial ou especial. Você sabe combater com a arma selecionada.\n\n*Benefício:* Seu personagem recebe proficiência na arma escolhida, podendo usá-la sem penalidades. Você ainda precisa cumprir os requisitos de Força ou Destreza para usar as armas. Você pode comprar esta aptidão mais de uma vez, para armas diferentes.\n\n*Normal:* Um personagem empunhando uma arma marcial ou especial que não saiba usar sofre –3 de penalidade de precisão. Armas Simples podem ser usadas por qualquer personagem.",
    efeito: null, generica: true,
  },
  {
    id: "g_velocista", nome: "Velocista", cat: "gratuita", req: null,
    desc: "Você é extremamente rápido.\n\n*Benefício:* Enquanto estiver sem armadura ou usando uma armadura leve, você dobra sua Agilidade para determinar seu deslocamento. Quando estiver acelerado ou super acelerado, você recebe um bônus de 10m para seu deslocamento, ao invés disso.",
    efeito: { tipo: "velocista" },
  },
  // MANOBRA
  {
    id: "g_apanhar_obj", nome: "Apanhar Objetos", cat: "gratuita", req: null,
    desc: "O personagem consegue apanhar projéteis atirados contra ele em pleno ar, como flechas, virotes e armas de arremesso.\n\n*Benefício:* Quando bloqueia um projétil, você pode apanhar a arma ao invés de apenas desviá-la. Armas de arremesso podem ser atiradas de volta ao oponente como uma ação livre. Você também se torna capaz de usar a manobra Rebater Projétil como uma reação de defesa, desde que não esteja numa condição que o impeça de atacar.",
    efeito: null,
  },
  {
    id: "g_atq_giratorio", nome: "Ataque Giratório", cat: "gratuita", req: "CC 8",
    desc: "O personagem é capaz de golpear os oponentes mais próximos usando um incrível ataque giratório.\n\n*Pré-requisitos:* Combate Corporal 8.\n\n*Benefício:* Seu ataque acerta todas as criaturas dentro do seu alcance corpo-a-corpo. Somente é necessário um teste de acerto e cada alvo tem direito à sua defesa normalmente. Esta aptidão pode ser usada com armas pesadas.",
    efeito: null,
  },
  {
    id: "g_atq_poderoso", nome: "Ataque Poderoso", cat: "gratuita", req: "CC 7",
    desc: "O personagem é capaz de realizar ataques corporais excepcionalmente poderosos.\n\n*Pré-requisito:* Combate Corporal 7.\n\n*Benefício:* Declare que está usando esta aptidão antes de fazer um ataque corpo-a-corpo. Você sofre uma penalidade de –1 na precisão de ataque, mas recebe +1 em bônus de dano. Você pode utilizar Ataque Poderoso com qualquer outra aptidão de manobra, desde que ela não conceda bônus de precisão ou bônus de dano.",
    efeito: null,
  },
  {
    id: "g_blq_arma", nome: "Bloquear Arma", cat: "gratuita", req: null,
    desc: "Você consegue bloquear ataques armados mais facilmente.\n\n*Benefício:* Você recebe +1 de precisão ao executar um Bloqueio contra ataques corporais armados. Caso o resultado do seu teste seja 4 pontos a mais que o do oponente, você pode executar a manobra Desarmar como uma ação livre. Se conseguir um acerto crítico no bloqueio, você automaticamente desarma o oponente.",
    efeito: null,
  },
  {
    id: "g_derrubar_agr", nome: "Derrubar Agressivo", cat: "gratuita", req: "Lutador",
    desc: "Você é preciso e letal ao derrubar o oponente.\n\n*Pré-requisito:* Lutador ou Guerreiro.\n\n*Benefício:* Quando usa a manobra derrubar, você pode optar por causar dano e também derrubar. Se o fizer, o alvo tem direito a um teste de Vigor para se manter de pé (dif 2 + CC do atacante).\n\nÉ possível utilizar esta aptidão junto com Arremessar. Neste caso, o alvo só é arremessado caso falhe no teste de Vigor contra o Derrubar Agressivo.",
    efeito: null,
  },
  {
    id: "g_desarme_agr", nome: "Desarme Agressivo", cat: "gratuita", req: "Lutador",
    desc: "Você é preciso e letal ao desarmar o oponente.\n\n*Pré-requisito:* Lutador ou Guerreiro.\n\n*Benefício:* Quando usa a manobra desarmar, além de desarmar o alvo, você também causa dano.",
    efeito: null,
  },
  {
    id: "g_rasteira", nome: "Rasteira", cat: "gratuita", req: "Lutador",
    desc: "Esta manobra é um chute baixo e poderoso, criada para derrubar um oponente, podendo ainda causar dano.\n\n*Pré-requisito:* Lutador ou Guerreiro (armas longas).\n\n*Benefício:* Você realiza a manobra Derrubar com +1 de precisão no seu ataque. É possível utilizar esta aptidão junto com Derrubar Agressivo.",
    efeito: null,
  },
  {
    id: "g_soco_agarrado", nome: "Soco Agarrado", cat: "gratuita", req: "Lutador",
    desc: "Você desfere um golpe enquanto agarra o braço de defesa de seu oponente, tirando-o do caminho para então aplicar um soco com sua mão livre.\n\n*Pré-requisito:* Lutador.\n\n*Benefício:* Seu oponente não pode se defender usando a reação Bloqueio quando você ataca desarmado. Você somente pode usar esta aptidão caso o alvo também esteja desarmado ou esteja usando uma arma leve.",
    efeito: null,
  },
  {
    id: "g_voadora", nome: "Voadora", cat: "gratuita", req: "Derrubar Agressivo",
    desc: "Você corre e se lança na direção do inimigo com um dos pés ao ar, para acertá-lo na cabeça ou no tronco.\n\n*Pré-requisito:* Derrubar Agressivo; Ataque Poderoso.\n\n*Benefício:* Você realiza uma Investida e no final faz um ataque desarmado com a aptidão de manobra Derrubar Agressivo. No ataque, recebe –1 de precisão e +2 de bônus de dano, e o alvo sofre +3 níveis na dificuldade no teste para não ser derrubado. Os bônus da manobra Investida não são aplicados, mas as penalidades sim.",
    efeito: null,
  },
  // SHINOBI
  {
    id: "g_fascinar", nome: "Fascinar", cat: "gratuita", req: "Int 4",
    desc: "Você consegue criar ilusões que atingem diretamente a mente do alvo.\n\n*Pré-requisito:* Inteligência 4.\n\n*Benefício:* Com uma ação padrão e 3 pontos de chakra, você prende um único alvo em uma ilusão mental de sua escolha. O alvo deve estar a no máximo 5m de distância. Você não realiza testes, mas o alvo precisa realizar um teste de Inteligência (dif 6 + Inteligência do usuário). Se falhar, ficará fascinado pelo restante da cena.\n\n*Notar Genjutsu:* A partir do segundo turno sob efeito da ilusão, uma vez antes de agir, a vítima poderá repetir o teste como uma ação livre e com –1 nível de dificuldade, que se acumula a cada nova tentativa. Se bem-sucedida, ficará livre do fascínio. O fascínio também se quebra caso a vítima sofra qualquer nível de dano.\n\nUm alvo não pode ficar fascinado duas ou mais vezes na mesma cena pelo uso dessa aptidão.",
    efeito: null,
  },
  {
    id: "g_miragem", nome: "Miragem", cat: "gratuita", req: "Int 2",
    desc: "Você usa chakra no ambiente para modificar sua aparência e a forma como é percebido pelos olhos das outras pessoas, enganando a todos que estiverem observando.\n\n*Pré-requisito:* Inteligência 2.\n\n*Benefício:* Você cria uma ilusão em qualquer ponto no ambiente a até 5m de você. A ilusão não pode se deslocar deste ponto, porém a imagem pode ser estática ou móvel (sem sair de sua posição).\n\nCriar a ilusão custa uma ação padrão e 1 ponto de chakra por categoria de tamanho. O tamanho depende do nível de Inteligência: pequeno (inicial), médio (INT 8), grande (INT 12), enorme (INT 16).\n\nUma pessoa que interagir com a ilusão tocando-a perceberá que é falsa. Pessoas com visão de chakra identificam as ilusões automaticamente. Ilusões estáticas têm duração contínua; móveis são sustentadas. Você pode cancelar com uma ação livre.",
    efeito: null,
  },
  {
    id: "g_trabalho_duro", nome: "Trabalho Duro", cat: "gratuita", req: "Sem clã ou hijutsu",
    desc: "Você não é um gênio, não conhece técnicas secretas ou pertence a algum clã, mas treina todos os dias para estar à altura dos grandes ninjas.\n\n*Pré-requisito:* Não possuir Clã ou Hijutsu.\n\n*Benefício:* A cada turno, você pode escolher uma das bonificações a seguir e recebê-la até o início do seu próximo turno:\n• +5m no deslocamento\n• +1 de precisão no ataque\n• +1 de precisão na defesa\n• +1 de dano base em seu ataque\n• +1 nas dificuldades de resistência das suas técnicas\n\nSe futuramente você adquirir algum poder ou aptidão de Clã/Hijutsu, deve trocar o Trabalho Duro por outra aptidão que não seja restrita.",
    efeito: null,
  },
  // GERAL
  {
    id: "g_duro_matar", nome: "Duro de Matar", cat: "gratuita", req: null,
    desc: "Você resiste a ferimentos que fariam outros cair.\n\n*Benefício:* Quando você é atacado e sofre dano que poderia levá-lo a 0 ou menos pontos de Vitalidade, você pode ignorar parte do dano e se manter no combate. Você fica com Vitalidade restante igual ao nível de Vigor, ou 1 ponto caso a Vit já esteja muito baixa. Você pode usar esta aptidão uma vez por dia. Essa aptidão não funciona contra acertos críticos.",
    efeito: null,
  },
  {
    id: "g_engenheiro", nome: "Engenheiro", cat: "gratuita", req: "Int 6",
    desc: "Seu personagem aprimorou-se na manipulação de dispositivos e nas artes mecânicas e tecnológicas.\n\n*Benefício:* Você poderá criar armadilhas e dispositivos mecânicos com a perícia Mecanismos. Esta aptidão também permite utilizar mecanismos dentro do poder Ninpou. A perícia Mecanismo substitui o Espírito para os parâmetros de Ninpou, e você pode utilizar os efeitos como armadilhas.\n\n*Normal:* Personagens sem esta aptidão não podem montar armadilhas ou dispositivos, mas podem desarmá-los com teste de Mecanismos.",
    efeito: { tipo: "treino_pericia", pericia: "mecanismos" },
  },
  {
    id: "g_pericia_inata", nome: "Perícia Inata", cat: "gratuita", req: null,
    desc: "*Benefício:* Escolha uma perícia. Você pode refazer um teste dessa perícia que tenha recém realizado. Você deve aceitar a segunda rolagem, mesmo que seja pior que a primeira.",
    efeito: null, generica: true,
  },
  {
    id: "g_perito", nome: "Perito", cat: "gratuita", req: null,
    desc: "Escolha uma perícia. O personagem será especialmente treinado na perícia selecionada.\n\n*Benefício:* O personagem recebe +2 de precisão nos testes da perícia escolhida.",
    efeito: { tipo: "perito" }, generica: true,
  },
  {
    id: "g_resistencia_maior", nome: "Resistência Maior", cat: "gratuita", req: null,
    desc: "Você é especialmente resistente a determinados tipos de perigo.\n\n*Benefício:* Escolha um atributo. Você pode refazer um teste de resistência desse atributo que tenha recém realizado. Você deve aceitar a segunda rolagem, mesmo que seja pior que a primeira. Você não pode usar esta aptidão se sofreu uma falha crítica no primeiro teste.",
    efeito: null, generica: true,
  },
]

// ── Aptidões restritas por clã ────────────────────────────────────────────────
const aptidoesRestritas = [
  // FUUMA
  {
    id: "r_demonio_vento", nome: "Demônio do Vento", cat: "restrita", cla: "fuuma", req: "Tensai",
    desc: "Você tem o talento e a ambição de um dos clãs mais renomados.\n\n*Pré-requisito:* Tensai (Hijutsu).\n\n*Benefício:* Deve ser escolhida como uma das duas Aptidões Especiais do hijutsu Tensai.\n\nVocê recebe os benefícios das aptidões *Usar Arma (Fuuma Shuriken)* e *Especialista (Armas de Arremesso)*.\n\nAdicionalmente, você pode fazer o dano base do ataque com qualquer Fuuma Shuriken ser igual ao seu nível de *Destreza* (não se usa o cálculo padrão de dano base para armas de arremesso, nem o dano de arma).\n\nVocê não recebe os benefícios das aptidões nas quais ainda não tenha atingido os pré-requisitos de compra normal, mas os receberá assim que forem alcançados.",
    efeito: null
  },
  // MIKOTO
  {
    id: "r_rascunho_feras", nome: "Rascunho das Feras", cat: "restrita", cla: "mikoto", req: "Arte 4",
    desc: "Você domina o uso do Pergaminho de Jutsu Técnico e pode dar vida a criaturas de tinta.\n\n*Pré-requisito:* Arte 4.\n\n*Benefício:*\n• Pode usar o *Pergaminho de Jutsu Técnico* sem penalidades.\n• Pode usar o poder restrito *Choujuu Giga*.\n• Recebe as aptidões *Perito* e *Perícia Inata* em Arte gratuitamente.\n• Com *Arte 18:* pode usar o *Pergaminho de Jutsu Especial*.",
    efeito: null
  },
  {
    id: "r_criaturas_vivas", nome: "Criaturas Vivas", cat: "restrita", cla: "mikoto", req: "Choujuu Giga 4, Arte 8, Prestidigitação 8",
    desc: "Você avançou seus estudos criando criaturas perigosas que parecem perseguir o inimigo como se estivessem vivas.\n\n*Pré-requisitos:* Choujuu Giga 4; Arte 8; Prestidigitação 8.\n\n*Benefício:*\n• Pode usar a técnica *Pergaminho das Bestas* (efeito Nv4 do Choujuu Giga), controlando criaturas de tinta em combate.\n• Escolha um efeito do poder Choujuu Giga para o qual a condição *Tinta Fraca* não seja aplicada.",
    efeito: null
  },
  {
    id: "r_animais_mensageiros", nome: "Animais Mensageiros", cat: "restrita", cla: "mikoto", req: "Choujuu Giga 5, Criaturas Vivas, Arte 10, Rastrear 10",
    desc: "Você usa pequenas criaturas de tinta para rastreio e envio de mensagens de forma sutil e eficiente.\n\n*Pré-requisitos:* Choujuu Giga 5; Criaturas Vivas; Arte 10; Rastrear 10.\n\n*Rastreio Limitado:* Ação padrão + 3 chakra → cria criaturas minúsculas que buscam assinaturas de chakra em raio de *5m × nível de Arte* centrado em você. No início do turno seguinte retornam informando posições.\n\n*Rato Mensageiro:* Ação padrão + 4 chakra → transforma texto de até 50 palavras em ratos que vão a um local já visitado. Aguardam assinatura específica ou pergaminho ao lado. Percorrem *10 km/dia* por *metade nível de Arte* dias.\n\n*Pássaro Mensageiro [requer Arte 14]:* Ação completa + 5 chakra → mensagem em dois pássaros. Percorrem *50 km/dia*. Pode aplicar mensagem secreta (Ocultismo Dif 7 + ESP/Arte do usuário para decodificar).",
    efeito: null
  },
  // KAGUYA
  {
    id: "r_regeneracao_kaguya", nome: "Regeneração", cat: "restrita", cla: "kaguya", req: null,
    desc: "O personagem possui uma reprodução celular fora do comum, se curando de ferimentos rapidamente.\n\n*Benefício:*\n\n*Sangramento:* Cura-se em *1 nível de sangramento por turno* automaticamente. Pode ainda realizar o teste padrão de Vigor para recuperar 1 nível adicional.\n\n*Estabilização:* Sucesso automático nos testes para se estabilizar quando morrendo (Vit entre −11 e −20).\n\n*Cura Aumentada:* Qualquer técnica de cura usada sobre o personagem é aumentada em *25%*.\n\n*Resistência:* *+2 de bônus* em testes de resistência contra doenças e venenos.",
    efeito: null
  },
  {
    id: "r_artesao_ossos", nome: "Artesão de Ossos", cat: "restrita", cla: "kaguya", req: null,
    desc: "Você remove ossos do próprio corpo e os molda em armas diversas. Os ossos se reconstroem quase instantaneamente.\n\n*Benefício:* Ao criar uma arma, o membro fica inutilizado até o início do próximo turno.\n\nVocê é *proficiente com todas as armas de ossos* (sem precisar de Usar Arma). Apenas personagens com esta aptidão são proficientes.\n\nTodas as armas são *Armas Especiais* de corte ou perfuração (leves, medianas, longas ou pesadas). Duram *1 cena*.\n\n*Custo de criação:*\n• Arma Leve: ação parcial + 1 Vit\n• Arma Mediana: ação parcial + 2 Vit\n• Arma Longa/Pesada: ação de movimento + 4 Vit\n\n*Qualidade:* Dano igual à versão comum, *dureza +2* e *dano de arma +1*. Podem bloquear técnicas de projéteis.\n\n*Teshi Sendan:* 1 Vit → projéteis dos dedos, ação padrão, alcance 20m, dano base = nível de Destreza.\n\n*Arma-Presa:* Arma leve especial, ossos pontiagudos das palmas. Dano de qualquer arma leve. Pode ser retraída com ação livre. Não pode ser alvo de Desarmar e não inutiliza o membro.\n\n*Especialista Shikotsumyaku:* Se escolher Shikotsumyaku para Especialista, recebe o benefício para *todas as armas de ossos*.",
    efeito: null
  },
  {
    id: "r_armadura_ossea", nome: "Armadura Óssea", cat: "restrita", cla: "kaguya", req: null,
    desc: "Endoesqueleto sob a pele que reveste sua estrutura.\n\n*Benefício:*\n• *Dureza de corpo 1* contra todos os tipos de dano.\n• Recebe gratuitamente a aptidão *Duro de Matar*.\n• Imune a fraturas.\n• Com *Vigor 10:* dureza de corpo 2.\n• Com *Vigor 14:* dureza de corpo 3.",
    efeito: null
  },
  {
    id: "r_karamatsu_no_mai", nome: "Karamatsu no Mai (Dança do Lariço)", cat: "restrita", cla: "kaguya", req: "Vigor 6, Artesão de Ossos, Armadura Óssea",
    desc: "Ossos emergem do corpo de uma só vez para absorver dano e contra-atacar.\n\n*Pré-requisitos:* Vigor 6; Artesão de Ossos; Armadura Óssea.\n\n*Benefício:* Nova técnica defensiva — manobra *Defender com Técnica* usando CC no lugar de LM no teste de defesa (incluindo Especialista).\n\n*Ação:* Parcial. *Custo:* ¼ do nível de Vigor em chakra.\n\nSe bem-sucedido: dureza de corpo extra = nível de Vigor (cumulativa com Armadura Óssea) até o fim do turno do atacante. Inimigos que atacaram desarmados sofrem *dano fixo = 1 por nível de Vigor* (mesmo se a dureza for superada).\n\nContra tentativa de Agarrar: *+2 precisão* no teste. Se bem-sucedido, o inimigo sofre dano e você tem direito a escapar como reação.\n\nContra inimigo já agarrando: ação padrão; dano fixo aumentado em metade.",
    efeito: null
  },
  {
    id: "r_yanagi_no_mai", nome: "Yanagi no Mai (Dança do Salgueiro)", cat: "restrita", cla: "kaguya", req: "Acrobacia 6, Artesão de Ossos",
    desc: "Ataque com saltos, acrobacias e cambalhotas usando armas-presas e ossos dos cotovelos, joelhos e ombros.\n\n*Pré-requisitos:* Acrobacia 6; Artesão de Ossos.\n\n*Benefício:* Requer mãos livres ou apenas armas-presas. O ataque corpo-a-corpo ganha os benefícios da aptidão *Ataque Giratório*. Com Ataque Múltiplo, todos os ataques são giratórios.\n\nNão pode ser usada com outras danças ou aptidões de manobra.\n\n*Especial:* Sempre que atacar com arma de osso leve (ataque comum, nesta dança ou qualquer outra), pode usar *Destreza no lugar de Força* no cálculo de dano.",
    efeito: null
  },
  {
    id: "r_tsubaki_no_mai", nome: "Tsubaki no Mai (Dança da Camélia)", cat: "restrita", cla: "kaguya", req: "Agilidade 8, Ataque em Movimento, Ataque Múltiplo, Artesão de Ossos",
    desc: "Movimentos rápidos e imprevisíveis com arma leve para golpear da forma mais ágil e letal possível.\n\n*Pré-requisitos:* Agilidade 8; Ataque em Movimento; Ataque Múltiplo; Artesão de Ossos.\n\n*Benefício:* Requer apenas armas leves e distância mínima de 3m do alvo. Usa Ataque Múltiplo para *3 ataques*:\n• 2º ataque: *−1 precisão na defesa* do alvo\n• 3º ataque: *−2 precisão na defesa* do alvo (também se aplica ao Ataque Progressivo)\n\nTodos os ataques devem ser no mesmo alvo. Recebe gratuitamente *Retirada Rápida* e *Trespassar Nv2*. Ao abater um inimigo, recebe deslocamento extra de até 5m para alcançar novo alvo antes de atacar com Trespassar.\n\nNão pode ser usada com outras danças.",
    efeito: null
  },
  {
    id: "r_tessenka_no_mai", nome: "Tessenka no Mai (Dança da Clematite)", cat: "restrita", cla: "kaguya", req: "Vigor 12, Força 10/Destreza 10, Artesão de Ossos, Ambidestria",
    desc: "Divide-se em duas partes: chicote de coluna vertebral para prender e lança de braço para perfurar.\n\n*Pré-requisitos:* Vigor 12; Força ou Destreza 10; Artesão de Ossos; Ambidestria.\n\n*Benefício:* Cria duas armas pesadas especiais simultâneas (nunca usadas no mesmo ataque).\n\n*Tsuru (Vinha de Ossos):* Coluna vertebral removida e regenerada imediatamente. Arma pesada, *dano +4*, alcance de até *4m*. Pode usar para derrubar, desarmar ou agarrar sem penalidade. *Acuidade* se aplica.\n\n*Hana (Flor de Ossos):* Ossos do braço crescem em lança vibrante. Arma-presa pesada, *dano +6*, alcance corpo-a-corpo de *2m*.\n\nSe estiver agarrando com a Tsuru: ataque corporal extra exclusivo para a Hana contra o mesmo alvo.\n\nNão pode ser usada com aptidões de manobra.",
    efeito: null
  },
  {
    id: "r_sawarabi_no_mai", nome: "Sawarabi no Mai (Dança da Samambaia)", cat: "restrita", cla: "kaguya", req: "Vigor 16, Tessenka no Mai",
    desc: "Inúmeras lanças de ossos sobem do subsolo, podendo chegar a milhares.\n\n*Pré-requisitos:* Vigor 16; Tessenka no Mai.\n\n*Benefício:* Ação padrão para criar várias lanças ao redor que se elevam do solo. Funciona como o *efeito Lança Nv6 de Ninpou* com os seguintes parâmetros:\n\n• *Tamanho:* 1m diâmetro, 3m altura; área de diâmetro = nível de Vigor\n• *Dureza:* 2× Vigor\n• *Dano Base:* 1 por nível de Vigor\n• *Custo de Chakra:* metade do Vigor\n• *Dificuldade dos Testes:* 9 + Vigor\n\nVocê pode entrar e se mover dentro de qualquer lança como no efeito *Imergir Nv4 (Doton)*.\n\nCom *Vigor 18:* o efeito Lança é ampliado para Nv9.\n\nNão pode ser usada com outras danças ou aptidões de manobra.",
    efeito: null
  },
  // SHIMURA
  {
    id: "r_rascunho_feras", nome: "Rascunho das Feras", cat: "restrita", cla: "shimura", req: "Arte 4",
    desc: "Você aprendeu a arte do combate com tinta e criaturas desenhadas.\n\n*Pré-requisito:* Arte 4.\n\n*Benefício:* Pode usar sem penalidades o *Pergaminho de Jutsu Técnico*. Pode usar o poder restrito *Choujuu Giga*. Ganha as aptidões *Perito* e *Perícia Inata* em Arte.\n\nAo atingir Arte 18, pode usar o *Pergaminho de Jutsu Especial*.",
    efeito: null
  },
  {
    id: "r_criaturas_vivas", nome: "Criaturas Vivas", cat: "restrita", cla: "shimura", req: "Choujuu Giga 4, Arte 8, Prestidigitação 8",
    desc: "Você cria criaturas perigosas que parecem perseguir o inimigo como se estivessem vivas.\n\n*Pré-requisitos:* Choujuu Giga 4; Arte 8; Prestidigitação 8.\n\n*Benefício:* Pode usar a técnica *Pergaminho das Bestas* (efeito Nv4 do Choujuu Giga), controlando criaturas de tinta em combate.\n\nAdicionalmente, escolha *1 efeito do Choujuu Giga* para o qual a condição *Tinta Frágil* não seja aplicada.",
    efeito: null
  },
  {
    id: "r_animais_mensageiros", nome: "Animais Mensageiros", cat: "restrita", cla: "shimura", req: "Choujuu Giga 5, Criaturas Vivas, Arte 10, Rastrear 10",
    desc: "Usa pequenas criaturas de tinta para rastreio e envio de mensagens de forma sutil e eficiente.\n\n*Pré-requisitos:* Choujuu Giga 5; Criaturas Vivas; Arte 10; Rastrear 10.\n\n*Rastreio Limitado:* Ação padrão + 3 chakra → criaturas minúsculas fazem busca por chakra em raio *5m × nível de Arte*. No início do próximo turno retornam informando posições.\n\n*Rato Mensageiro:* Ação padrão + 4 chakra → transforma até 50 palavras em ratos que vão a um local já visitado. Aguardam assinatura de chakra específica e/ou pergaminho. Percorrem *10km/dia* por *metade nível de Arte* dias.\n\n*Pássaro Mensageiro [requer Arte 14]:* Ação completa + 5 chakra → mensagem em 2 pássaros, *50km/dia*. Opcionalmente com mensagem secreta (Ocultismo Dif 7 + ESP/Arte do usuário para decodificar).",
    efeito: null
  },
  // YOTSUKI
  {
    id: "r_lamina_da_lua", nome: "Lâmina da Lua", cat: "restrita", cla: "yotsuki", req: "Tensai",
    desc: "Você tem a inigualável habilidade de esgrima de um dos clãs com maior fidelidade entre seus membros.\n\n*Pré-requisito:* Tensai (Hijutsu).\n\n*Benefício:* Deve ser escolhida como uma das duas Aptidões Especiais do hijutsu Tensai.\n\nVocê recebe os benefícios das aptidões *Acuidade* e *Domínio do Raio*. Além disso, recebe a aptidão *Usar Arma para todos os tipos de espadas marciais*. Ainda precisa cumprir os requisitos de Força e Destreza para armas medianas e pesadas.\n\nVocê não recebe os benefícios das aptidões nas quais ainda não tenha atingido os pré-requisitos de compra normal, mas os receberá assim que forem alcançados.",
    efeito: null
  },
  // HOZUKI
  {
    id: "r_suika", nome: "Suika", cat: "restrita", cla: "hozuki", req: "Suiton 4, Espírito 9",
    desc: "Você é capaz de transformar seu corpo inteiro e suas roupas em água.\n\n*Pré-requisitos:* Suiton 4; Espírito 9.\n\n*Benefício:* Duração permanente enquanto possuir chakra.\n\n*Pontos Suika (PS):* Novo parâmetro = *3× Vigor*. Ao sofrer dano, pode retirá-lo dos PS em vez da Vitalidade. Com PS em zero, danos vão para a Vitalidade.\n\n*Imunidade Fluida:* Imune ao dano de técnicas Suiton (não a efeitos secundários não aquáticos). Imune a sufocamento por afogamento. Recebe *metade do dano base* de Katon e fogo. Recebe *dobro do dano* de Raiton e elétrico.\n\n*Escape Fluido:* Quando imobilizado por prisão física (cordas, celas, Agarrar), ação padrão para se transformar em líquido e escapar imediatamente, sem testes. Recebe gratuitamente o efeito *Imergir nível 2* para Suiton.\n\n*Poder Fluido:* PS podem substituir custo de chakra de técnicas Suiton (1 PS = 1 chakra). Quando o custo é totalmente pago com PS, a técnica recebe *+2 de dano* (incompatível com Domínio da Água e Energizar).\n\n*Pistola D'água:* Ao usar o efeito Canhão para Suiton, pode atirar pequenos projéteis com o dedo indicador como arma de fogo — sem selos de mão.\n\n*Hidratar:* Com uma noite de descanso completo, recupera PS na taxa de *5 + 2 por nível de Vigor*. O Mestre pode reduzir ou impedir se sem acesso a água potável.\n\n*Restrição:* Ao comprar esta aptidão, fica impossibilitado de usar qualquer outro elemento que não seja Suiton.\n\n*Restrição de Tempo:* Benefícios desta aptidão não são afetados por Técnica Acelerada.\n\n*Efeitos Exclusivos de Suiton desbloqueados:*\n• *Braço de Água* (Nv5) — usa ESP no lugar de FOR nos testes e dano; Acuidade para armas pesadas\n• *Afogar* (Nv6) — envolve cabeça do alvo agarrado em bolha d'água; causa sufocamento\n• *Monstro de Água* (Nv7) — funde-se com água, tamanho Enorme, bônus de +3 ESP\n• *Clone de Óleo* (Nv8) — clone explosivo cíclico que cresce e explode em vapor",
    efeito: null
  },
  // HOSHIGAKI
  {
    id: "r_predador_aquatico", nome: "Predador Aquático", cat: "restrita", cla: "hoshigaki", req: null,
    desc: "Sua pele é grossa e recoberta de escamas duras. Você possui guelras e dentes afiados.\n\n*Benefício:*\n• Capaz de *respirar debaixo d'água* e se mover dentro dela com o *dobro do deslocamento*.\n• *Dureza de corpo 1* contra qualquer tipo de ataque armado e desarmado.\n• Com *Vigor 8:* aumenta para dureza de corpo 2.\n• Com *Vigor 12:* aumenta para dureza de corpo 3.",
    efeito: null
  },
  {
    id: "r_elemento_natural_suiton", nome: "Elemento Natural: Suiton", cat: "restrita", cla: "hoshigaki", req: "Predador Aquático, Suiton 1",
    desc: "Sua proximidade biológica com os predadores do oceano o tornou especialmente hábil na utilização de Suiton.\n\n*Pré-requisitos:* Predador Aquático; Suiton 1.\n\n*Benefício:* Todo Efeito Suiton recebe *+2 de dano base* como bônus de elemento (funcionando da mesma forma que o dano adicional do Katon).",
    efeito: null
  },
  {
    id: "r_reserva_agua", nome: "Reserva de Água", cat: "restrita", cla: "hoshigaki", req: "Suiton 5, Espírito 9, Domínio da Água, Elemento Natural: Suiton",
    desc: "Você é capaz de projetar água com extrema facilidade.\n\n*Pré-requisitos:* Suiton 5; Espírito 9; Domínio da Água; Elemento Natural: Suiton.\n\n*Benefício:* Quando utilizar a aptidão *Domínio da Água*, você acumula o *dobro de pontos de água* possíveis. As demais regras do Domínio da Água permanecem.\n\n*Efeito Exclusivo — Prisão do Tubarão (Suiton Nv10):*\n*Pré-req:* Prisão de Água Nv9; Colisão de Ondas Nv8; Elemento Natural: Suiton; Predador Aquático; Reserva de Água\n*Ação:* Completa  *Área:* Esfera com o dobro do tamanho comum do poder  *Duração:* Sustentada\n\nCria uma gigantesca redoma de água ao redor capturando todos na área. Teste de CD contra Evadir — se não houver defesa ou deslocamento, Sucesso Automático. Dureza zero, absorção *6 por nível usado*.\n\nVítimas capturadas testam *Atletismo (Dif padrão)* para nadar e escapar, ou *Vigor (Dif padrão −2)* para prender a respiração — falhando, sofrem sufocamento.\n\nSempre que uma vítima se mover dentro da prisão, pode gastar ação de movimento para se mover na mesma direção, arrastando a redoma junto.",
    efeito: null
  },
  // ABURAME
  { id: "r_kikaichuu", nome: "Kikaichuu", cat: "restrita", cla: "aburame", req: "Lidar com Animais 1", desc: "Insetos sugadores de chakra vivem no corpo. Ataque drena chakra do alvo igual ao nº de insetos usados. Aptidão evolutiva, cada nível comprado separadamente.", efeito: null },
  { id: "r_shokaichuu", nome: "Shōkaichuu", cat: "restrita", cla: "aburame", req: "Lidar com Animais 10", desc: "Inseto parasita rastreador: prende ao alvo e permite rastreá-lo pelo odor.", efeito: null },
  { id: "r_kidaichuu", nome: "Kidaichuu", cat: "restrita", cla: "aburame", req: null, desc: "Inseto parasita gigante. Não pode ser usado junto com Rinkaichuu.", efeito: null },
  { id: "r_rinkaichuu", nome: "Rinkaichuu", cat: "restrita", cla: "aburame", req: null, desc: "Inseto parasita venenoso. Não pode ser usado junto com Kidaichuu.", efeito: null },
  // AKIMICHI
  {
    id: "r_corpulencia", nome: "Corpulência", cat: "restrita", cla: "akimichi", req: null,
    desc: "O Akimichi é dotado de corpo e resistência física invejável, que o protege contra danos e ainda funciona como uma reserva de chakra.\n\n*Benefício:* O personagem recebe pontos adicionais de Vitalidade, na quantidade de 3× Vigor. Também recebe +2 de precisão em todos os testes de Vigor.\n\nAdicionalmente, os Akimichi podem queimar as calorias acumuladas e transformá-las em chakra, pagando 2 pontos de Vitalidade para cada 1 ponto de chakra durante a execução de uma técnica.\n\nEm contrapartida, caso use alguma aptidão ou poder que lhe conceda a condição Acelerado, você não recebe os benefícios da condição.",
    efeito: null
  },
  {
    id: "r_resiliencia", nome: "Resiliência", cat: "restrita", cla: "akimichi", req: "Corpulência",
    desc: "O Akimichi é especializado em se colocar na frente de batalha, suportando os ataques inimigos para proteger os aliados.\n\n*Benefício:* O personagem recebe dureza de corpo 1 para cada 4 pontos completos de Vigor contra todos os tipos de ataque (bônus de Vigor por aumento de tamanho não afetam esta aptidão).\n\nEm contrapartida, possuem –5m no deslocamento e recebem –3 de precisão em Esquiva, testes de Agilidade, Acrobacia e Furtividade.",
    efeito: null
  },
  // HYUUGA
  {
    id: "r_byakugan", nome: "Byakugan", cat: "restrita", cla: "hyuuga", req: "Percepção 1",
    desc: "A linhagem sanguínea avançada do clã Hyuuga, conhecida por sua grande percepção e poder.\n\n*Pré-requisito:* Percepção 1.\n\n*Benefício:* Ativar o Byakugan requer uma ação parcial e 1 ponto de chakra. Duração contínua por uma cena; pode ser ativado durante a defesa.\n\n*Super Visão:* Visão de Raio-X em 360°, podendo ver através de qualquer matéria e qualquer nível de Cobertura. Imune a penalidades de Camuflagem Parcial ou Total do ambiente. Não pode sofrer ataque surpresa nem ser flanqueado.\n\nUma vez por cena e como ação livre, pode simular 2 dados em qualquer teste de Percepção, Procurar, Prontidão e Rastrear.\n\n*Alcance:* 10m + 2m por nível em Rastrear.\n\n*Alcance Estendido:* [requer Rastrear 5] Pode duplicar o alcance padrão com concentração e selos de mão.\n\n*Visão de Chakra:* Identifica jutsus ativos, genjutsus em criaturas e chakra em áreas. Distingue cada criatura pela sua assinatura de chakra.\n\n*Visão Através do Chakra:* A visão não pode ser oculta por técnicas, incluindo criações de chakra como o efeito Névoa.\n\n*Medir Poder:* Estima o nível aproximado de ficha de uma criatura.\n\n*Analisar Emoção:* Analisa emoções pelas flutuações de chakra, batimentos e respiração — detecta mentiras, estados de humor e intenções.",
    efeito: null
  },
  {
    id: "r_tenketsu", nome: "Tenketsu Byakugan", cat: "restrita", cla: "hyuuga", req: "Byakugan, Procurar 7, Prontidão 7, Rastrear 7",
    desc: "O Byakugan enxerga os Tenketsus e, com o controle minucioso de chakra dos Hyuuga, é possível selá-los temporariamente.\n\n*Pré-requisitos:* Byakugan; Procurar 7; Prontidão 7; Rastrear 7.\n\n*Benefício:* Ao usar o Byakugan, você ganha os seguintes benefícios adicionais.\n\n*Selamento de Tenketsu:* Sempre que acertar o oponente com um ataque básico Juuken, ele testa Vigor (Dif 7 + 2× Nível de Juuken). Se falhar, perde 2 pontos de chakra (recuperados após uma noite de descanso). Em Ataque Múltiplo, o teste é feito para cada golpe. Caso o alvo use Bloqueio desarmado, o teste ainda é aplicado.\n\nEssa regra não se aplica se o alvo também possuir Tenketsu Byakugan.\n\nAs técnicas especiais do Juuken (como o Hakke Rokujuuyon Shou) selam maiores quantidades de chakra sem direito ao teste de Vigor.\n\n*Alcance Progressivo:* [requer Rastrear 9] Permanecendo imóvel e concentrado por 2 minutos, o alcance do sensor passa a ser de 50m × nível de Rastrear. Custa chakra igual à metade do nível de Rastrear.",
    efeito: null
  },
  // INUZUKA
  {
    id: "r_comp_animal", nome: "Companheiro Animal", cat: "restrita", cla: "inuzuka", req: "Lidar com Animais 1",
    desc: "O personagem possui um cão ou lobo que o auxilia nas missões e em combate.\n\n*Pré-requisito:* Lidar com Animais 1.\n\n*Benefício:* O animal companheiro é um Parceiro com ficha igual à do personagem, porém com *2 níveis a menos* em todos os atributos, habilidades e perícias (mínimo zero). O cão evolui junto com o Inuzuka e pode usar o poder Shikakyu quando a técnica permitir.\n\n*Aptidões Permitidas:* Acuidade, Ataque em Movimento, Especialista, Intuição, Reflexos, Velocista, Perito, Perícia Inata, Lutador, Ponto Cego, Ataque Atordoante, Ataque Poderoso, Derrubar Agressivo, De Pé, Desarme Agressivo, Rasteira, Hakken no Jutsu.\n\n*Perícias Permitidas:* Acrobacia, Atletismo, Escapar, Furtividade, Procurar, Prontidão, Rastrear.\n\n*Tamanho:* Pequeno inicialmente. Cresce para Médio com Lidar com Animais 10; Grande com nível 14 (passa a falar a língua humana).\n\n*Matilha:* Ao atingir Lidar com Animais 16 e 18, você pode adquirir mais um animal em cada nível (considerados capangas).\n\n*Morte do Animal:* Pode ser substituído após treinamento de (6 × nível de Lidar com Animais) dias ininterruptos.",
    efeito: null
  },
  {
    id: "r_hakken", nome: "Hakken no Jutsu", cat: "restrita", cla: "inuzuka", req: "Rastrear 1",
    desc: "Concentrando chakra no nariz, o Inuzuka aumenta imensamente sua capacidade olfativa.\n\n*Pré-requisito:* Rastrear 1.\n\n*Benefício:* Ativar ou desativar é uma ação livre. Custa 2 chakra e tem duração contínua.\n\n*Alcance:* 10m + 2m por nível em Rastrear.\n\n*Detecção automática* de odores dentro do alcance (sem teste), exceto em situações adversas (vento, chuva, cheiros fortes) — nestes casos, teste de Percepção com dificuldade determinada pelo Mestre.\n\n*Alerta contra Surpresa:* Teste adicional de Rastrear para notar o oponente ao receber ataque surpresa.\n\n*Olfato Apurado:* Com o Hakken ativo, recebe −1 de dificuldade em testes de Prontidão, Rastrear e Procurar sempre que o olfato puder ser utilizado.",
    efeito: null
  },
  // SHIMURA
  {
    id: "r_rascunho_feras", nome: "Rascunho das Feras", cat: "restrita", cla: "shimura", req: "Arte 4",
    desc: "Você aprendeu os fundamentos da Arte Ninja de Tinta.\n\n*Pré-requisito:* Arte 4.\n\n*Benefício:*\n• Pode usar o *Pergaminho de Jutsu Técnico* sem penalidades.\n• Pode comprar e usar o poder restrito *Choujuu Giga*.\n• Recebe gratuitamente as aptidões *Perito* e *Perícia Inata* em Arte.\n• Com *Arte 18:* pode usar o *Pergaminho de Jutsu Especial*.",
    efeito: null
  },
  {
    id: "r_criaturas_vivas", nome: "Criaturas Vivas", cat: "restrita", cla: "shimura", req: "Choujuu Giga 4, Arte 8, Prestidigitação 8",
    desc: "Você avançou seus estudos criando criaturas perigosas que parecem perseguir o inimigo como se realmente estivessem vivas.\n\n*Pré-requisitos:* Choujuu Giga 4; Arte 8; Prestidigitação 8.\n\n*Benefício:*\n• Pode usar a técnica *Pergaminho das Bestas* (efeito Nv4 do Choujuu Giga), controlando criaturas de tinta em combate.\n• Escolha *1 efeito do Choujuu Giga* para o qual a condição *Tinta Frágil não se aplica*.",
    efeito: null
  },
  {
    id: "r_animais_mensageiros", nome: "Animais Mensageiros", cat: "restrita", cla: "shimura", req: "Choujuu Giga 5, Criaturas Vivas, Arte 10, Rastrear 10",
    desc: "Usa pequenas criaturas de tinta como rastreadores e mensageiros sutis e eficientes.\n\n*Pré-requisitos:* Choujuu Giga 5; Criaturas Vivas; Arte 10; Rastrear 10.\n\n*Rastreio Limitado:* Ação padrão + 3 chakra → desenha criaturas minúsculas que buscam assinaturas de chakra em raio *5m × nível de Arte*. No início do próximo turno, retornam informando posições encontradas.\n\n*Rato Mensageiro:* Ação padrão + 4 chakra → transforma texto de até 50 palavras em ratos que viajam até local já visitado. Aguardam assinatura de chakra específica. Percorrem *10 km/dia* por *metade nível de Arte* dias.\n\n*Pássaro Mensageiro [requer Arte 14]:* Ação completa + 5 chakra → mensagem enviada como 2 pássaros. Percorrem *50 km/dia*. Opcionalmente com mensagem secreta — decodificar exige Ocultismo (Dif 7 + ESP/Arte do usuário).",
    efeito: null
  },
  // SARUTOBI
  {
    id: "r_vontade_fogo", nome: "Vontade do Fogo", cat: "restrita", cla: "sarutobi", req: "Tensai, Vigor 6, Resistência Maior (Vigor), Clone Verdadeiro (Kage Bunshin)",
    desc: "Você é sustentado por uma vontade inabalável, tornando-o tão robusto quanto homens com o dobro do seu tamanho.\n\n*Pré-requisitos:* Tensai (Hijutsu), Vigor 6, Resistência Maior (Vigor) e Clone Verdadeiro (Kage Bunshin).\n\n*Benefício:* Deve ser escolhida como uma das duas Aptidões Especiais do hijutsu Tensai.\n\nVocê recebe gratuitamente a aptidão *Duro de Matar* e não sofre os efeitos da velhice até muito mais tarde que o normal.\n\nAlém disso, você pode criar e usar até *dois clones verdadeiros do tipo Kage Bunshin* ao mesmo tempo. Esses clones são mais resistentes: possuem Vitalidade igual a *1/5 da Vit do usuário* e recebem a aptidão *Duro de Matar*.\n\nVocê não pode criar (nem ter criado) qualquer outro clone durante a cena, além destes dois Kage Bunshins.",
    efeito: null
  },
  // HATAKE
  {
    id: "r_maximizar", nome: "Maximizar", cat: "restrita", cla: "senju", req: "ESP 15/INT 15, Potencializar",
    desc: "Você consegue potencializar seu ninjutsu elemental até o máximo que o elemento permite.\n\n*Pré-requisitos:* Espírito ou Inteligência 15; Potencializar (aptidão).\n\n*Benefício:* Ao comprar esta aptidão, escolha entre os poderes *Mokuton* ou *Suiton*. Quando usa a meta-aptidão Potencializar para o elemento escolhido, você pode aplicar *todos os benefícios dela ao mesmo tempo*.\n\n*Aptidão Especial:* Pode ser escolhida como uma das duas Aptidões Especiais do hijutsu Tensai.",
    efeito: null
  },
  {
    id: "r_presa_prata", nome: "Presa de Prata", cat: "restrita", cla: "hatake", req: "Tensai",
    desc: "Você tem o brilhantismo de uma linhagem única.\n\n*Pré-requisito:* Tensai (Hijutsu).\n\n*Benefício:* Deve ser escolhida como uma das duas Aptidões Especiais do hijutsu Tensai.\n\nVocê recebe a aptidão Usar Arma para a Espada de Chakra Branco. Também recebe uma aptidão de Domínio Elemental (da Água, do Fogo, do Ar, da Terra ou do Raio) e Maestria para um dos cinco poderes elementais básicos, à sua escolha.\n\nCaso possua o poder Versatilidade, poderá escolher um dos poderes versáteis para receber os benefícios (não se estende ao outro poder versátil).\n\nVocê não recebe os benefícios das aptidões nas quais ainda não tenha atingido os pré-requisitos, mas os receberá assim que forem alcançados.",
    efeito: null
  },
  // YUKI
  {
    id: "r_selos_especiais", nome: "Selos Especiais", cat: "restrita", cla: "yuki", req: "Destreza 8",
    desc: "Você é capaz de realizar selos com uma única mão, permitindo atacar ou segurar objetos com a outra.\n\n*Pré-requisito:* Destreza 8.\n\n*Benefício:* Requer pelo menos uma mão livre.\n\nVocê não recebe a penalidade de *−3 de precisão* ao utilizar técnicas em combate próximo (nem precisa realizar teste de concentração).\n\nAdicionalmente, ao usar a manobra *Golpear*, quando seu ataque corporal for bloqueado, esquivado ou antecipado, você pode executar uma técnica de ação padrão como uma *ação de movimento*. A técnica deve ser ofensiva à distância, com teste de CD e duração instantânea.\n\n*Normal:* É necessário ter ambas as mãos livres para realizar selos.",
    efeito: null
  },
  {
    id: "r_congelamento", nome: "Congelamento", cat: "restrita", cla: "yuki", req: "Hyouton 6",
    desc: "Você pode congelar os inimigos cada vez que acerta uma técnica Hyouton.\n\n*Pré-requisito:* Hyouton 6.\n\n*Benefício:* Sempre que causar dano com um efeito do poder Hyouton, a vítima deve fazer um teste de *Vigor (Dif padrão −2)*. Se falhar, ficará *impedida* até o final do próximo turno dela.\n\nEsta aptidão somente se aplica a efeitos à distância que necessitem de teste de acerto contra a ação defensiva do alvo. Não se aplica aos efeitos Energizar ou Criar Arma.",
    efeito: null
  },
  // UZUMAKI
  {
    id: "r_regeneracao", nome: "Regeneração", cat: "restrita", cla: "uzumaki", req: null,
    desc: "O personagem possui uma reprodução celular fora do comum, se curando de ferimentos rapidamente.\n\n*Benefício:*\n\n*Sangramento:* Você não precisa realizar testes para se recuperar da condição sangrando, curando-se em *1 nível de sangramento por turno* automaticamente. Se desejar, pode ainda realizar o teste padrão de Vigor para recuperar 1 nível adicional naquele turno.\n\n*Estabilização:* Sucesso automático nos testes para se estabilizar quando estiver morrendo (Vit entre −11 e −20).\n\n*Cura Aumentada:* Qualquer técnica de cura usada sobre o personagem é aumentada em *25%*.\n\n*Resistência:* *+2 de bônus* em testes de resistência contra doenças e venenos.",
    efeito: null
  },
  {
    id: "r_chakra_expandido", nome: "Chakra Expandido", cat: "restrita", cla: "uzumaki", req: null,
    desc: "O personagem é dotado de uma quantidade extra de chakra.\n\n*Benefício:* Esta aptidão aumenta a quantidade total de chakra do personagem em *50%*.",
    efeito: null
  },
  {
    id: "r_mil_clones", nome: "Mil Clones", cat: "restrita", cla: "uzumaki", req: "ESP 10; Chakra Expandido; Clone nível 2; Clone Verdadeiro (Kage Bunshin)",
    desc: "Você é capaz de fazer incontáveis clones, sendo limitado somente pelo seu chakra.\n\n*Pré-requisitos:* Espírito 10; Chakra Expandido; Clone nível 2; Clone Verdadeiro (Kage Bunshin).\n\n*Benefício:* Ao custo de *6 pontos de Vitalidade* e uma ação padrão, você pode criar *1 Kage Bunshin para cada ponto de chakra* que tiver, dividindo todo o chakra entre os clones e ficando com somente 1 ponto para si. Os clones possuem todas as ações disponíveis, mas têm *fracasso automático em qualquer teste de combate*. Criar 20+ clones permite testes de Furtividade para se misturar entre eles.\n\n*Ataque em Grupo:* Com mínimo de 8 clones, pode cercar um alvo e atacá-lo corporalmente em situação de flanqueado com *+3 de dano*. Não funciona com armas pesadas, manobras ou aptidões de manobra.\n\n*Clone Verdadeiro Melhorado:* Pode criar 1 clone verdadeiro sem penalidades de precisão e reduções de dificuldade.\n\n*Treinamento com Clone:* Ao adquirir aptidão, poder, efeito ou jutsu, reduza os requisitos em *−2 para atributos/perícias/HCs* e *−1 nível de poder*. Não se aplica a restritos.",
    efeito: null
  },
  {
    id: "r_kongou_fuusa", nome: "Kongou Fuusa", cat: "restrita", cla: "uzumaki", req: "ESP 14",
    desc: "*Correntes de Selamento Inquebráveis*\n\nVocê molda seu chakra para criar correntes extremamente duráveis usadas em combate ou para imobilizar inimigos — até mesmo um Bijuu.\n\n*Pré-requisito:* Espírito 14.\n*Ação:* Padrão  *Alcance:* Médio (10m + 2m/ESP)  *Custo:* 7 chakra  *Selos:* Não\n\n*Ataque [instantânea]:* As correntes possuem lâminas nas pontas. Dano = *1 por nível de Espírito*.\n\n*Capturar [concentração; máx 5 turnos]:* Teste de CD — se bem-sucedido, o alvo fica *paralisado*. A cada turno, testa *Espírito (Dif 9 + ESP do usuário)* ou fica impossibilitado de usar chakra até o início de seu próximo turno. Para se libertar: *Força (Dif 9 + ESP do usuário)*.\n\n*Barreira [concentração]:* Cria uma barreira semiesférica ao redor. Transparente, dureza zero, *absorção = 4× Espírito*, diâmetro mínimo 10m e máximo 3m/ESP. Quando a absorção é zerada o preenchimento é destruído mas as correntes permanecem, impedindo criaturas Enormes ou maiores. Pode renovar totalmente a absorção como *ação livre* pagando o custo novamente.",
    efeito: null
  },
  // UCHIHA
  {
    id: "r_katon_nat", nome: "Elemento Natural: Katon", cat: "restrita", cla: "uchiha", req: "Espírito 1",
    desc: "*\"Um Uchiha só é reconhecido como tal quando é capaz de utilizar o Katon: Goukakyuu no Jutsu.\"*\n\n*Pré-requisito:* Espírito 1.\n\n*Benefício:* Você pode usar o efeito *Sopro Destrutivo Nv 4* para Katon, mesmo sem possuir o poder e mesmo em nível Genin (NC 4). O dano base é igual ao atributo *Espírito +2* pelo bônus de dano do elemento. O custo de chakra é *metade do nível de Espírito* (arredondado para cima). Demais regras do efeito (alcance, tamanho) seguem as do poder Katon.\n\nCaso o personagem compre o poder Katon, receberá o efeito *Sopro Destrutivo no nível 4* adicionalmente ao outro efeito que pode escolher. O Sopro Destrutivo também evoluirá automaticamente nos níveis 7 e 10.\n\nEsta aptidão pode ser utilizada pelo *Clone Verdadeiro* e não conta para o limite da regra de afinidade elemental.",
    efeito: null
  },
  {
    id: "r_sharingan", nome: "Sharingan", cat: "restrita", cla: "uchiha", req: "Percepção 3",
    desc: "Poderoso doujutsu exclusivo do clã Uchiha. Pode se manifestar durante uma grande luta. Neste nível, apresenta aparência incompleta, com uma vírgula negra na íris vermelha.\n\n*Pré-requisito:* Percepção 3.\n\n*Benefício:* Ativar o Sharingan requer uma *ação parcial* e *1 ponto de chakra*. Duração contínua por uma cena; pode ser ativado durante a defesa.\n\n*Visão de Chakra:* Identifica jutsus ativos, genjutsus em criaturas e chakra em áreas. Não enxerga através de criações de chakra como o efeito Névoa.\n\n*Medir Poder:* Estima o nível aproximado de ficha de uma criatura.\n\n*Distinguir Chakra:* Diferencia cada criatura pela sua assinatura de chakra.\n\n*Esquiva Perceptiva:* Pode usar *Ler Movimento* para se esquivar, substituindo a Esquiva no cálculo da dificuldade (Dif = 9 + precisão de LM do Uchiha). Pode aplicar bônus de esquiva como Reflexos, mas não bônus de precisão em LM como Intuição.",
    efeito: null
  },
  {
    id: "r_nidan_shari", nome: "Nidan Sharingan", cat: "restrita", cla: "uchiha", req: "Percepção 6; Sharingan",
    desc: "O Uchiha tem melhor domínio sobre o Sharingan. A íris vermelha apresenta duas vírgulas negras.\n\n*Pré-requisito:* Percepção 6; Sharingan.\n\n*Benefício:* Ao usar o Sharingan, recebe os seguintes benefícios adicionais.\n\n*Visão Acelerada:* Recebe gratuitamente os benefícios da aptidão *Intuição* e *+2 de bônus em Prontidão* contra a manobra Fintar.\n\n*Foco Aprimorado:* Não pode ser flanqueado.\n\n*Olhar Hipnótico:* Pode usar genjutsus sobre o alvo apenas com contato visual, sem selos de mão. Alcance de 9m; sem teste de Concentração em combate próximo.\n\n*Fascinar:* O Olhar Hipnótico permite usar a aptidão Fascinar pelo contato visual, com +1 nível de dificuldade, podendo repetir várias vezes no mesmo alvo. O alvo tem 1 turno de imunidade após se libertar. Requer comprar Fascinar normalmente.\n\n*Resistir à Ilusão:* *+2 de bônus* no teste de resistência contra genjutsus oculares.\n\n*Mímica Sharingan:* Acesso às técnicas da Mímica Sharingan (copiar, anular e memorizar técnicas).",
    efeito: null
  },
  {
    id: "r_sandan_shari", nome: "Sandan Sharingan", cat: "restrita", cla: "uchiha", req: "Percepção 9; Nidan Sharingan",
    desc: "O Sharingan em estado completo, com três vírgulas. Membros que atingem este nível tendem a se tornar proeminentes.\n\n*Pré-requisito:* Percepção 9; Nidan Sharingan.\n\n*Benefício:* Ao usar o Sharingan, recebe os seguintes benefícios adicionais.\n\n*Genjutsu Sharingan:* Acesso às técnicas de ilusão exclusivas da Hipnose Sharingan.\n\n*Visão Acelerada Maior:* Imune à finta acelerada. Pode realizar ataque oportuno contra inimigos acelerados.\n\n*Previsão Perfeita:* Pode usar todas as manobras de previsão em situações de ataque oportuno ou quando desprevenido. Pode usar Superar Técnica sem penalidade de precisão.\n\n*Reverter Ilusão:* Com ação padrão, usa Percepção no lugar de Inteligência para detectar ilusão inimiga. Se bem-sucedido, retorna a ilusão ao conjurador pelo Olhar Hipnótico. Gasta o mesmo chakra da ilusão; alcance de 9m. Funciona contra qualquer ilusão que tenha você como único alvo, exceto Tsukuyomi.",
    efeito: null
  },
  {
    id: "r_mangekyou", nome: "Mangekyou Sharingan", cat: "restrita", cla: "uchiha", req: "Percepção 16; Sandan Sharingan; evento traumático",
    desc: "O último estágio do Sharingan. Cada par de olhos possui desenho único. Conhecido como 'Olho Copiador Giratório Caleidoscópico'.\n\n*Pré-requisitos:* Percepção 16; Sandan Sharingan; um evento traumático.\n\n*Benefício:* Acesso a três técnicas especiais. Escolha um par de técnicas (uma por olho):\n• *Tsukuyomi e Amaterasu*\n• *Kagutsuchi e Amaterasu*\n• *Kamui (Curto e Longo alcance)*\n\nO *Susanoo* é a terceira técnica, fixa, aprendida ao dominar o par.\n\nTodas as técnicas são consideradas *nível de poder 10* para dificuldade. Não podem ser usadas com meta-aptidões nem Técnica Acelerada.\n\n*Pontos de Visão:* 10 pontos para ambos os olhos. Cada uso consome pontos. A cada 3 perdidos: condição *ofuscado* permanente (cumulativa até 3×).\n\n*Descanso:* Ao zerar pela primeira vez → atordoado 1 turno, Sharingan desativado. Após 24h sem usar: recupera até 5 pontos. Condição ofuscado (−3) é mantida.\n\n*Cegueira:* Ao zerar pela segunda vez → cegueira permanente, perde todos os benefícios do Sharingan.\n\n*Mangekyou Eterno [somente PdM]:* Transplantar o MS de parente próximo (Iryou Ninjutsu + Medicina Dif 28). Após 24h de repouso: sem regras de Perdendo a Visão, sem custo de pontos de visão, cura cegueira e ofuscado.",
    efeito: null
  },
];

// ── Tabela de evolução ────────────────────────────────────────────────────────
const TABELA_EVOLUCAO = [
  { nc: 4, nivelShinobi: "Genin", atributos: 12, pericias: 8, poderes: 4, minimo: 0 },
  { nc: 5, nivelShinobi: "Genin", atributos: 18, pericias: 12, poderes: 6, minimo: 1 },
  { nc: 6, nivelShinobi: "Genin", atributos: 24, pericias: 16, poderes: 8, minimo: 1 },
  { nc: 7, nivelShinobi: "Chuunin", atributos: 30, pericias: 20, poderes: 10, minimo: 2 },
  { nc: 8, nivelShinobi: "Chuunin", atributos: 36, pericias: 24, poderes: 12, minimo: 2 },
  { nc: 9, nivelShinobi: "Chuunin", atributos: 42, pericias: 28, poderes: 14, minimo: 3 },
  { nc: 10, nivelShinobi: "Jounin Especial", atributos: 48, pericias: 32, poderes: 16, minimo: 3 },
  { nc: 11, nivelShinobi: "Jounin Especial", atributos: 54, pericias: 36, poderes: 18, minimo: 4 },
  { nc: 12, nivelShinobi: "Jounin", atributos: 60, pericias: 40, poderes: 20, minimo: 4 },
  { nc: 13, nivelShinobi: "Jounin", atributos: 66, pericias: 44, poderes: 22, minimo: 5 },
  { nc: 14, nivelShinobi: "Jounin", atributos: 72, pericias: 48, poderes: 24, minimo: 5 },
  { nc: 15, nivelShinobi: "Jounin Elite", atributos: 78, pericias: 52, poderes: 26, minimo: 6 },
  { nc: 16, nivelShinobi: "Jounin Elite", atributos: 84, pericias: 56, poderes: 28, minimo: 6 },
  { nc: 17, nivelShinobi: "Jounin Elite", atributos: 90, pericias: 60, poderes: 30, minimo: 7 },
  { nc: 18, nivelShinobi: "Sannin / Kage", atributos: 96, pericias: 64, poderes: 32, minimo: 7 },
  { nc: 19, nivelShinobi: "Sannin / Kage", atributos: 102, pericias: 68, poderes: 34, minimo: 8 },
  { nc: 20, nivelShinobi: "Sannin / Kage", atributos: 108, pericias: 72, poderes: 40, minimo: 8 },
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

// ── Metadados de categorias da loja (cores e labels) ──────────────────────────
const CATALOGO_META = {
  arremesso: { label: "Arremesso", cor: "#ef4444" },
  explosivos: { label: "Explosivos", cor: "#f97316" },
  armas_simples: { label: "Armas Simples", cor: "#a78bfa" },
  armas_marciais: { label: "Armas Marciais", cor: "#ec4899" },
  disparo: { label: "Disparo", cor: "#22c55e" },
  armaduras: { label: "Armaduras", cor: "#4a90e2" },
  itens_gerais: { label: "Itens Gerais", cor: "#f0a020" },
  servicos: { label: "Serviços", cor: "#06b6d4" },
};

// Detecta o id do clã a partir do nome (ex: "Clã Hyuuga" → "hyuuga")
const getClaId = (claNome = "") => {
  if (!claNome) return null;
  const norm = claNome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("aburame")) return "aburame";
  if (norm.includes("akimichi")) return "akimichi";
  if (norm.includes("fuuma")) return "fuuma";
  if (norm.includes("hatake")) return "hatake";
  if (norm.includes("hoshigaki")) return "hoshigaki";
  if (norm.includes("hozuki") || norm.includes("hōzuki")) return "hozuki";
  if (norm.includes("hyuu") || norm.includes("hyuga") || norm.includes("hiuga")) return "hyuuga";
  if (norm.includes("inuzuka")) return "inuzuka";
  if (norm.includes("kaguya")) return "kaguya";
  if (norm.includes("mikoto")) return "mikoto";
  if (norm.includes("sarutobi")) return "sarutobi";
  if (norm.includes("senju")) return "senju";
  if (norm.includes("shimura")) return "shimura";
  if (norm.includes("shimura")) return "shimura";
  if (norm.includes("uchiha")) return "uchiha";
  if (norm.includes("uzumaki")) return "uzumaki";
  if (norm.includes("yamanaka")) return "yamanaka";
  if (norm.includes("yotsuki")) return "yotsuki";
  if (norm.includes("yuki")) return "yuki";
  return null;
};

// Aceita cla_nome OU cla_id diretamente
const getClaIdFull = (ficha) => {
  return getClaId(ficha?.cla_nome || "")
    || getClaId(ficha?.cla_id || "");
};

// ── Helper: verifica pré-requisitos de aptidão ───────────────────────────────
// Suporta: "Des 3", "CC 9", "INT 8", "Medicina 7", "Agi/Prest 6", "CC/CD 11" etc.
const verificarReq = (req, atr, pericias, hcCalc, aptidoes = [], poderes = []) => {
  if (!req) return true;
  if (req === "Sem clã ou hijutsu") return true; // tratado contextualmente
  const temAptNome = (nome) => aptidoes.some(a =>
    a.id === nome ||
    a.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
    nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
  const PODERES_NOMES = ["ninpou", "doton", "fuuton", "katon", "raiton", "suiton", "mokuton", "hyouton",
    "juuken", "shikakyu", "kagejutsu", "shindenshin", "baika_ninpou", "baika ninpou"];
  // vírgula = todos os requisitos devem ser atendidos
  return req.split(",").every(parte => {
    // barra = basta um
    return parte.trim().split("/").some(p => {
      p = p.trim();
      const m = p.match(/^(.+?)\s+(\d+)$/);
      if (!m) {
        // req sem número — verifica se é nome de aptidão adquirida
        return temAptNome(p);
      }
      const nome = m[1].toLowerCase().trim();
      const num = parseInt(m[2]);
      // atributos
      if (["for", "força", "forca"].includes(nome)) return (atr.forca ?? 0) >= num;
      if (["des", "destreza"].includes(nome)) return (atr.destreza ?? 0) >= num;
      if (["agi", "agilidade"].includes(nome)) return (atr.agilidade ?? 0) >= num;
      if (["per", "percepção", "percepcao"].includes(nome)) return (atr.percepcao ?? 0) >= num;
      if (["int", "inteligência", "inteligencia"].includes(nome)) return (atr.inteligencia ?? 0) >= num;
      if (["vig", "vigor"].includes(nome)) return (atr.vigor ?? 0) >= num;
      if (["esp", "espírito", "espirito"].includes(nome)) return (atr.espirito ?? 0) >= num;
      // habilidades de combate
      if (nome === "cc") return (hcCalc?.CC ?? 0) >= num;
      if (nome === "cd") return (hcCalc?.CD ?? 0) >= num;
      if (nome === "esq") return (hcCalc?.ESQ ?? 0) >= num;
      if (nome === "lm") return (hcCalc?.LM ?? 0) >= num;
      if (nome === "cc/cd" || nome === "combate") return Math.max(hcCalc?.CC ?? 0, hcCalc?.CD ?? 0) >= num;
      // poderes pelo nome (ex: "Suiton 1", "Katon 3")
      const nomeNorm = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const poderMatch = poderes.find(pd => pd.nome?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === nomeNorm
        || pd.id === nomeNorm);
      if (poderMatch) return (poderMatch.nivel ?? 0) >= num;
      // verifica se é nome conhecido de poder mesmo sem ter comprado
      if (PODERES_NOMES.includes(nomeNorm)) return false; // poder reconhecido mas não tem
      // perícias pelo nome — total = metadeatr base + pts gastos
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
        "lidar com animais": "percepcao",
        "lidar_animais": "percepcao",
        "lidar animais": "percepcao",
      };
      const nNorm = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      if (mapaAtr[nNorm]) {
        const atrKey = mapaAtr[nNorm];
        const base = Math.ceil((atr[atrKey] ?? 0) / 2);
        const extra = pericias?.[nNorm] ?? 0;
        return (base + extra) >= num;
      }
      return false; // desconhecido — bloqueia para segurança
    });
  });
};

// ── MODAL LOJA DE APTIDÕES (padrão TLOU) ─────────────────────────────────────
const ModalLojaAptidoes = ({ aptidoes, onAdicionar, onFechar, atr, pericias, hcCalc, claId, pontosRestantes, totalAptidoes, poderes = [] }) => {
  const temRestrita = claId && aptidoesRestritas.some(a => a.cla === claId);
  const catsDisponiveis = temRestrita
    ? [...CATS, { id: "restrita", label: "ESPECIAIS DO CLÃ" }]
    : CATS;

  const [catAtiva, setCatAtiva] = useState("gratuita");
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState({});
  const [modalGenerica, setModalGenerica] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, []);

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 2200);
  };

  const nomesAdquiridos = new Set(aptidoes.map(a => (a.nome || "").toLowerCase().trim()));
  const temAptidao = (id) => aptidoes.some(a => a.id === id);
  const temAptidaoNome = (nome) => nomesAdquiridos.has((nome || "").toLowerCase().trim());

  // Aptidões normais custam 1 ponto cada (sem slots gratuitos)
  const isGratuita = catAtiva === "gratuita";
  const gratuitasUsadas = aptidoes.filter(a => a.cat === "gratuita").length;
  const slotGratuitoDisp = gratuitasUsadas < 3; // ainda tem slot grátis
  const custoApt = 1;
  // Gratuitas: free se ainda tem slot, custa 1pt se slots esgotados
  const gratuita_custa_pt = isGratuita && !slotGratuitoDisp;
  const semPontos = ((!isGratuita || gratuita_custa_pt)) && (pontosRestantes !== undefined) && pontosRestantes < custoApt;

  const adicionar = (apt, obs = "") => {
    if (!apt.generica && (temAptidao(apt.id) || temAptidaoNome(apt.nome))) {
      mostrarToast(`${apt.nome} já adquirida!`, "erro");
      return;
    }

    if (semPontos) {
      mostrarToast(`Pontos insuficientes — precisas de 1 pt, restam ${pontosRestantes}.`, "erro");
      return;
    }
    const catFinal = isGratuita && !slotGratuitoDisp ? "geral" : (isGratuita ? "gratuita" : apt.cat);
    onAdicionar({ id: apt.id, nome: apt.nome, cat: catFinal, obs, efeito: apt.efeito });
    mostrarToast(`${apt.nome} adquirida!${gratuita_custa_pt ? " (−1 pt)" : ""}`, "ok");
    setModalGenerica(null);
  };

  const filtrados = (
    catAtiva === "restrita"
      ? aptidoesRestritas.filter(a => a.cla === claId)
      : catAtiva === "gratuita"
        ? aptidoesGratuitasConfig
        : aptidoesConfig.filter(a => a.cat === catAtiva)
  ).filter(a => {
    if (busca !== "" && !a.nome.toLowerCase().includes(busca.toLowerCase()) && !a.desc.toLowerCase().includes(busca.toLowerCase())) return false;
    if (!a.generica && catAtiva !== "gratuita" && temAptidaoNome(a.nome)) return false;
    return true;
  });

  const catCor = { gratuita: "#22c55e", combate: "#e05050", manobra: "#f39c12", tecnica: "#4a90e2", shinobi: "#9b59b6", geral: "#27ae60", restrita: "#c79255" };
  const cor = catCor[catAtiva] || "#4a90e2";

  return (
    <div className="fn-loja-overlay" onClick={onFechar}>
      <div className="fn-loja-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="fn-loja-header">
          <h2 className="fn-loja-titulo">Aptidões</h2>
          {pontosRestantes !== undefined && (
            <div style={{
              fontSize: "0.72rem", fontFamily: "'Google Sans',sans-serif",
              padding: "3px 10px", borderRadius: "6px",
              background: isGratuita ? (gratuita_custa_pt ? "#1a0505" : "#051a0d") : semPontos ? "#1a0505" : "#051a0d",
              color: isGratuita ? (gratuita_custa_pt ? "#ef4444" : "#22c55e") : semPontos ? "#ef4444" : "#22c55e",
              border: `1px solid ${isGratuita ? (gratuita_custa_pt ? "#ef444433" : "#22c55e33") : semPontos ? "#ef444433" : "#22c55e33"}`,
              fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px",
            }}>
              {isGratuita
                ? (() => {
                    const usadas = aptidoes.filter(a => a.cat === "gratuita").length;
                    const restam = Math.max(0, 3 - usadas);
                    return restam > 0
                      ? `${restam} slot${restam !== 1 ? "s" : ""} grátis restante${restam !== 1 ? "s" : ""}`
                      : `3/3 usados — próximas custam −1 pt`;
                  })()
                : `${pontosRestantes} pts restante${pontosRestantes !== 1 ? "s" : ""}`
              }
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
              {c.id === "restrita" ? "✦ ESPECIAIS DO CLÃ" : c.label}
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
            const ativa = !apt.generica && !apt.niveis && (temAptidao(apt.id) || temAptidaoNome(apt.nome));
            const liberada = verificarReq(apt.req, atr, pericias, hcCalc, aptidoes, poderes);
            const exp = expandidos[apt.id];

            // Lógica de níveis
            const nivel1Adq = temAptidao(apt.id);
            const nivel2Id = apt.id + "_2";
            const nivel3Id = apt.id + "_3";
            const nivel2Adq = temAptidao(nivel2Id);
            const nivel3Adq = temAptidao(nivel3Id);
            const nivel2Lib = apt.niveis >= 2 && nivel1Adq && apt.reqNivel2
              ? verificarReq(apt.reqNivel2, atr, pericias, hcCalc, aptidoes, poderes)
              : false;
            const nivel3Lib = apt.niveis >= 3 && nivel2Adq && apt.reqNivel3
              ? verificarReq(apt.reqNivel3, atr, pericias, hcCalc, aptidoes, poderes)
              : false;

            return (
              <div key={apt.id} className={`fn-loja-item ${ativa ? "fn-fn-loja-item-max" : ""} ${!liberada ? "fn-apt-bloqueada-modal" : ""}`}>
                <div className="fn-fn-loja-item-header" onClick={() => setExpandidos(p => ({ ...p, [apt.id]: !p[apt.id] }))}>
                  <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{ color: ativa || nivel1Adq ? cor : liberada ? "#ccc" : "#555" }}>{apt.nome}</span>
                      {!apt.niveis && ativa && <span className="fn-loja-badge-max">✓</span>}
                      {!apt.niveis && !ativa && temAptidaoNome(apt.nome) && <span className="fn-loja-badge-max" style={{ background: "#0a1a0a", color: "#22c55e", borderColor: "#22c55e44" }}>✓ já adquirida</span>}
                      {!liberada && <span className="fn-loja-badge-max" style={{ background: "#2a1a1a", color: "#c0392b", borderColor: "#c0392b44" }}>REQUER: {apt.req}</span>}
                    </div>
                    {apt.req && liberada && <span style={{ fontSize: "0.6rem", color: "#555", fontFamily: "'Google Sans',sans-serif", letterSpacing: "0.5px" }}>Req: {apt.req}</span>}
                    {apt.niveis === 2 && nivel1Adq && !nivel2Adq && apt.reqNivel2 && !nivel2Lib && (
                      <span style={{ fontSize: "0.6rem", color: "#555", fontFamily: "'Google Sans',sans-serif" }}>
                        Nível 2 requer: {apt.reqNivel2}
                      </span>
                    )}
                  </div>

                  {/* Controles à direita */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {apt.niveis >= 2 ? (
                      <>
                        {/* Pip nível 1 */}
                        {!nivel1Adq && liberada ? (
                          <button
                            title={gratuita_custa_pt ? "Slots esgotados — custa −1 pt" : "Adquirir Nível 1"}
                            onClick={e => { e.stopPropagation(); adicionar(apt); }}
                            style={{
                              width: 28, height: 28, borderRadius: "50%", border: `2px solid ${cor}`,
                              background: "transparent", color: cor,
                              fontSize: "0.85rem", fontWeight: 800, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 1,
                            }}
                          >+</button>
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", border: `2px solid ${nivel1Adq ? cor : "#2a2a2a"}`,
                            background: nivel1Adq ? cor : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", color: nivel1Adq ? "#000" : "#444", fontWeight: 800, flexShrink: 0,
                          }}>{nivel1Adq ? "✓" : "+"}</div>
                        )}
                        {/* Pip nível 2 */}
                        {nivel1Adq && !nivel2Adq && nivel2Lib ? (
                          <button
                            title={`Adquirir Nível 2 (req: ${apt.reqNivel2})`}
                            onClick={e => {
                              e.stopPropagation();
                              onAdicionar({ id: nivel2Id, nome: apt.nome + " (Nível 2)", cat: isGratuita ? "gratuita" : apt.cat, obs: "Nível 2", efeito: apt.efeito });
                              mostrarToast(`${apt.nome} Nível 2 adquirido!`, "ok");
                            }}
                            style={{
                              width: 28, height: 28, borderRadius: "50%", border: `2px solid #f0a020`,
                              background: "transparent", color: "#f0a020",
                              fontSize: "0.85rem", fontWeight: 800, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}
                          >+</button>
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            border: `2px solid ${nivel2Adq ? cor : nivel1Adq ? "#f0a02066" : "#2a2a2a"}`,
                            background: nivel2Adq ? cor : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: nivel2Adq ? "0.75rem" : "0.85rem",
                            color: nivel2Adq ? "#000" : nivel1Adq ? "#f0a02066" : "#2a2a2a",
                            fontWeight: 800, flexShrink: 0,
                            opacity: nivel1Adq && !nivel2Lib ? 0.5 : 1,
                          }}>{nivel2Adq ? "✓" : "+"}</div>
                        )}
                        {/* Pip nível 3 (se existir) */}
                        {apt.niveis >= 3 && (
                          nivel2Adq && !nivel3Adq && nivel3Lib ? (
                            <button
                              title={`Adquirir Nível 3 (req: ${apt.reqNivel3})`}
                              onClick={e => {
                                e.stopPropagation();
                                onAdicionar({ id: nivel3Id, nome: apt.nome + " (Nível 3)", cat: isGratuita ? "gratuita" : apt.cat, obs: "Nível 3", efeito: apt.efeito });
                                mostrarToast(`${apt.nome} Nível 3 adquirido!`, "ok");
                              }}
                              style={{
                                width: 28, height: 28, borderRadius: "50%", border: `2px solid #c79255`,
                                background: "transparent", color: "#c79255",
                                fontSize: "0.85rem", fontWeight: 800, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              }}
                            >+</button>
                          ) : (
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%",
                              border: `2px solid ${nivel3Adq ? cor : nivel2Adq ? "#c7925566" : "#2a2a2a"}`,
                              background: nivel3Adq ? cor : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: nivel3Adq ? "0.75rem" : "0.85rem",
                              color: nivel3Adq ? "#000" : nivel2Adq ? "#c7925566" : "#2a2a2a",
                              fontWeight: 800, flexShrink: 0,
                              opacity: nivel2Adq && !nivel3Lib ? 0.5 : 1,
                            }}>{nivel3Adq ? "✓" : "+"}</div>
                          )
                        )}
                      </>
                    ) : (
                      /* Botão simples para aptidões sem nível 2 */
                      !ativa && liberada && (
                        <button
                          className="fn-fn-loja-item-add"
                          style={(semPontos && !isGratuita) || gratuita_custa_pt
                            ? { borderColor: "#555", color: "#555", cursor: "not-allowed", opacity: 0.5 }
                            : { borderColor: cor, color: cor }}
                          title={gratuita_custa_pt ? "Slots esgotados — custa −1 pt" : semPontos ? "Pontos insuficientes" : "Adquirir"}
                          onClick={e => { e.stopPropagation(); if (apt.generica) setModalGenerica(apt); else adicionar(apt); }}
                        ><i className="fas fa-plus" /></button>
                      )
                    )}
                  </div>
                </div>
                {exp && (
                  <div className="fn-fn-loja-item-corpo">
                    <RenderDesc text={apt.desc} />
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
            <GenericaInput apt={modalGenerica} onConfirmar={obs => adicionar(modalGenerica, obs)} />
          </div>
        </div>
      )}
    </div>
  );
};

// ── RenderDesc: renderiza descrição com *negrito* e parágrafos ───────────────
const RenderDesc = ({ text, style = {} }) => {
  if (!text) return null;
  const baseStyle = {
    fontFamily: "'Be Vietnam Pro', sans-serif",
    fontSize: "0.82rem",
    color: "#aaa",
    lineHeight: 1.65,
    margin: 0,
    ...style,
  };
  const renderLine = (line, i) => {
    // Divide por *texto* para aplicar negrito
    const parts = line.split(/\*([^*]+)\*/g);
    const nodes = parts.map((part, j) =>
      j % 2 === 1
        ? <strong key={j} style={{ color: "#4a90e2", fontWeight: 700 }}>{part}</strong>
        : part
    );
    return <span key={i}>{nodes}</span>;
  };
  const paragraphs = text.split(/\n\n+/);
  return (
    <div style={baseStyle}>
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n");
        return (
          <p key={pi} style={{ margin: pi === 0 ? 0 : "8px 0 0" }}>
            {lines.map((line, li) => (
              <span key={li}>
                {renderLine(line, li)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
};

const ARMAS_MARCIAIS = [
  "Katana", "Wakizashi", "Nodachi", "Naginata", "Yari", "Bo Staff",
  "Kama", "Kusarigama", "Tonfa", "Sai", "Nunchaku", "Tetsubo",
  "Espada Longa", "Machado de Guerra", "Lança", "Alabarda",
  "Arco Longo", "Besta", "Claymore", "Mangual",
];

const GenericaInput = ({ apt, onConfirmar }) => {
  const [obs, setObs] = useState("");
  const [armaSelecionada, setArmaSelecionada] = useState("");
  const [armasMarciais, setArmasMarciais] = useState([]);

  // Carrega armas marciais do banco ao abrir para usar_arma
  useEffect(() => {
    if (apt.id !== "usar_arma") return;
    fetch(`${API}/api/naruto/itens`)
      .then(r => r.json())
      .then(rows => {
        const marciais = rows
          .filter(i => i.categoria === "armas_marciais")
          .map(i => i.nome)
          .sort();
        setArmasMarciais(marciais.length > 0 ? marciais : ARMAS_MARCIAIS);
      })
      .catch(() => setArmasMarciais(ARMAS_MARCIAIS));
  }, [apt.id]);

  if (apt.id === "especialista" || apt.id === "g_especialista") {
    return (
      <>
        <select
          value={obs}
          onChange={e => setObs(e.target.value)}
          autoFocus
          style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "4px", color: obs ? "#fff" : "#555", fontFamily: "'Google Sans',sans-serif", fontSize: "0.85rem", padding: "8px 10px", outline: "none", width: "100%", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#4a90e2"}
          onBlur={e => e.target.style.borderColor = "#1a2535"}
        >
          <option value="">Selecione...</option>
          <option value="CC">CC — Combate Corporal</option>
          <option value="CD">CD — Combate à Distância</option>
        </select>
        <button
          onClick={() => obs && onConfirmar(obs)}
          style={{ background: obs ? "#4a90e2" : "#1a2535", border: "none", color: obs ? "#fff" : "#555", fontFamily: "'Google Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, padding: "8px 16px", borderRadius: "4px", cursor: obs ? "pointer" : "not-allowed", transition: "all 0.2s" }}
        >
          ADICIONAR
        </button>
      </>
    );
  }

  if (apt.id === "usar_arma") {
    const lista = armasMarciais.length > 0 ? armasMarciais : ARMAS_MARCIAIS;
    return (
      <>
        <select
          value={armaSelecionada}
          onChange={e => setArmaSelecionada(e.target.value)}
          autoFocus
          style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "4px", color: armaSelecionada ? "#fff" : "#555", fontFamily: "'Google Sans',sans-serif", fontSize: "0.85rem", padding: "8px 10px", outline: "none", width: "100%", boxSizing: "border-box" }}
          onFocus={e => e.target.style.borderColor = "#4a90e2"}
          onBlur={e => e.target.style.borderColor = "#1a2535"}
        >
          <option value="">Selecione uma arma marcial...</option>
          {lista.map(nome => <option key={nome} value={nome}>{nome}</option>)}
          <option value="__outro">Outra (digitar)</option>
        </select>
        {armaSelecionada === "__outro" && (
          <input
            style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "4px", color: "#fff", fontFamily: "'Google Sans',sans-serif", fontSize: "0.85rem", padding: "8px 10px", outline: "none", width: "100%", boxSizing: "border-box", marginTop: 6 }}

            value={obs}
            onChange={e => setObs(e.target.value)}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter" && obs.trim()) onConfirmar(obs.trim()); }}
          />
        )}
        <button
          onClick={() => {
            const val = armaSelecionada === "__outro" ? obs.trim() : armaSelecionada;
            if (val) onConfirmar(val);
          }}
          style={{ background: (armaSelecionada && armaSelecionada !== "__outro") || (armaSelecionada === "__outro" && obs.trim()) ? "#4a90e2" : "#1a2535", border: "none", color: (armaSelecionada && armaSelecionada !== "__outro") || (armaSelecionada === "__outro" && obs.trim()) ? "#fff" : "#555", fontFamily: "'Google Sans',sans-serif", fontSize: "0.75rem", fontWeight: 700, padding: "8px 16px", borderRadius: "4px", cursor: "pointer", transition: "all 0.2s" }}
        >
          ADICIONAR
        </button>
      </>
    );
  }

  return (
    <>
      <input
        style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "4px", color: "#fff", fontFamily: "'Google Sans',sans-serif", fontSize: "0.85rem", padding: "8px 10px", outline: "none", width: "100%", boxSizing: "border-box" }}

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


// ── ABA APTIDÕES — lista adquiridas (normais + gratuitas) ────────────────────};

// ── ABA APTIDÕES — lista adquiridas (normais + gratuitas) ────────────────────
const AbaAptidoes = ({ aptidoes, setAptidoes, atr, pericias, hcCalc = {}, claId, salvarAgora, pontosRestantes, poderes = [] }) => {
  const [lojaAberta, setLojaAberta] = useState(false);
  const [expandidos, setExpandidos] = useState({});
  const [filtro, setFiltro] = useState("");

  const remover = (idx) => { setAptidoes(prev => prev.filter((_, i) => i !== idx)); setTimeout(salvarAgora, 100); };

  const filtradas = aptidoes.filter(a =>
    filtro === "" || a.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const catCor = { gratuita: "#22c55e", combate: "#e05050", manobra: "#f39c12", tecnica: "#4a90e2", shinobi: "#9b59b6", geral: "#27ae60", restrita: "#c79255" };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">
      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar aptidões" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => setLojaAberta(true)}>+ ADICIONAR</button>
      </div>

      <div className="fn-aba-lista">
        {filtradas.length === 0 && (
          <p className="fn-aba-vazio">Nenhuma aptidão adquirida.<br />Clique em Adicionar.</p>
        )}
        {filtradas.map((a, idx) => {
          const cor = catCor[a.cat] || "#4a90e2";
          return (
            <div key={idx} className="fn-aba-item fn-fn-aba-item">
              <div className="fn-fn-aba-item-header" onClick={() => setExpandidos(p => ({ ...p, [idx]: !p[idx] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${expandidos[idx] ? "up" : "down"}`} /></button>
                <div className="fn-fn-aba-item-info">
                  <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome" style={{ color: cor }}>{a.nome}</span>
                  <div className="fn-fn-aba-item-meta">
                    <span className="fn-aba-tag fn-fn-aba-tag" style={{ color: cor, borderColor: cor + "44" }}>
                      {a.cat === "gratuita" ? "GRATUITA" : a.cat}
                    </span>
                    {a.obs && <span className="fn-aba-tag fn-fn-aba-tag" style={{ color: "#aaa" }}>{a.obs}</span>}
                  </div>
                </div>
                <button className="fn-aba-icon-btn" style={{ color: "#c0392b" }}
                  onClick={e => { e.stopPropagation(); remover(idx); }}>
                  <i className="fas fa-trash" />
                </button>
              </div>
              {expandidos[idx] && (
                <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                  {(() => {
                    // Para ids com sufixo _2/_3, busca o config base
                    const baseId = a.id.replace(/_2$|_3$/, "");
                    const cfg = a.cat === "gratuita"
                      ? aptidoesGratuitasConfig.find(x => x.id === baseId || x.id === a.id)
                      : aptidoesConfig.find(x => x.id === baseId || x.id === a.id)
                      || aptidoesRestritas.find(x => x.id === baseId || x.id === a.id);
                    return cfg ? <RenderDesc text={cfg.desc} /> : null;
                  })()}
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
          atr={atr} pericias={pericias} hcCalc={hcCalc} claId={claId}
          poderes={poderes}
          pontosRestantes={pontosRestantes}
          totalAptidoes={aptidoes.filter(a => a.cat !== "gratuita").length}
        />
      )}
    </div>
  );
};// ── Sub-componente: aba de perícias com atributo trocável e bônus editável ───
const AbaPericiasNova = ({ periciasConfig, atributosConfig, atr, pericias, setPericias, aptPericiaBonus = {}, aptidoes = [], handleRolar }) => {
  const [atrOverride, setAtrOverride] = useState({});
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [editandoTotal, setEditandoTotal] = useState(null);
  const [modalPericia, setModalPericia] = useState(null);
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
    <>
      <div className="fn-pericias-wrapper" ref={wrapperRef}>
        <div className="fn-pericias-box">
          <table className="fn-pericias-tabela">
            <thead>
              <tr>
                <th className="fnt-col-rolar"></th>
                <th className="fnt-col-nome">PERÍCIA</th>
                <th className="fnt-col-atr">ATR</th>
                <th className="fnt-col-pontos">PONTOS</th>
                <th className="fnt-col-total">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {periciasConfig.map(p => {
                const atrEfetivo = getAtrEfetivo(p);
                // Livro SNS: nível inicial = metade Atributo (arredondado para cima)
                const base = Math.ceil((atr[atrEfetivo.id] ?? 0) / 2);
                // pontos gastos distribuídos pelo jogador
                const extra = pericias[p.id] ?? 0;
                // bônus de aptidão Perito (+2 na perícia)
                const aptKey = p.id.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const aptBonus = aptPericiaBonus[aptKey] ?? 0;
                // total usado nas rolagens = metadeAtr + pts gastos + bônus aptidões
                const totalCalc = base + extra + aptBonus;
                const total = totalCalc;
                const trocado = !!atrOverride[p.id];

                return (
                  <tr key={p.id}>
                    <td className="fnt-pericia-rolar">
                      <button className="fn-btn-rolar" onClick={() => handleRolar(p.nome, total, 0)} title={`Rolar ${p.nome}`}>
                        <i className="fas fa-dice-d20" />
                      </button>
                    </td>
                    <td className="fnt-pericia-nome fn-atr-nome-clicavel" onClick={() => p.desc && setModalPericia(p)} title={p.desc ? "Ver descrição" : undefined}>{p.nome}{p.desc && <i className="fas fa-info-circle fn-atr-info-icon" />}</td>
                    <td className="fnt-pericia-atr-cell">
                      <div className="fn-atr-dropdown-wrapper">
                        <button
                          className={`fn-atr-badge ${trocado ? "fn-atr-badge-trocado" : ""}`}
                          onClick={() => setDropdownAberto(dropdownAberto === p.id ? null : p.id)}
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
                    {/* Coluna PONTOS: editável, clique para alterar pontos gastos */}
                    <td className="fnt-pericia-pontos-cell">
                      {editandoTotal === p.id ? (
                        <span
                          className="fn-pericia-pontos-num"
                          contentEditable
                          suppressContentEditableWarning
                          style={{ cursor: "text", borderBottom: "1px solid #f0a020", outline: "none", minWidth: 20, display: "inline-block", textAlign: "center" }}
                          onBlur={e => {
                            const val = parseInt(e.currentTarget.textContent);
                            if (!isNaN(val)) {
                              setPericias(prev => ({ ...prev, [p.id]: Math.max(0, val) }));
                            }
                            setEditandoTotal(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                            if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault();
                          }}
                          ref={el => { if (el && editandoTotal === p.id) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); window.getSelection().removeAllRanges(); window.getSelection().addRange(r); } }}
                        >{extra}</span>
                      ) : (
                        <span
                          className="fn-pericia-pontos-num"
                          style={{ cursor: "pointer" }}
                          onClick={() => setEditandoTotal(p.id)}
                        >{extra > 0 ? `+${extra}` : extra}</span>
                      )}
                    </td>
                    {/* TOTAL: somente leitura, calculado automaticamente */}
                    <td className="fnt-pericia-total-cell">
                      <span className="fn-pericia-total-num">{total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <ModalDescAtributo atributo={modalPericia} onFechar={() => setModalPericia(null)} />
    </>
  );
};

// ── Sub-componente: Modal de Testes Sociais ───────────────────────────────────
const testesConfig = [
  {
    id: "atuacao",
    nome: "Atuação",
    formula: "Carisma + metade Arte",
    base: "carisma",
    pericia: "arte",
    descricao: "Impressione uma plateia com música, canto, poesia ou outra manifestação artística.",
  },
  {
    id: "mudar_atitude",
    nome: "Mudar Atitude",
    formula: "Manipulação + metade Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Mude a atitude de alguém em uma categoria. Resistido por Inteligência do alvo.",
  },
  {
    id: "barganha",
    nome: "Barganha",
    formula: "Carisma + metade Percepção",
    base: "carisma",
    pericia: "percepcao",
    descricao: "Negocie preços. Resistido pelo teste de Barganha do outro negociante.",
  },
  {
    id: "blefar",
    nome: "Blefar",
    formula: "Manipulação + metade Inteligência",
    base: "manipulacao",
    pericia: "inteligencia",
    descricao: "Leve outros a tirar conclusões erradas. Resistido por Inteligência da vítima.",
  },
  {
    id: "intimidacao",
    nome: "Intimidação",
    formula: "Manipulação + metade Percepção",
    base: "manipulacao",
    pericia: "percepcao",
    descricao: "Force obediência por ameaças ou coação. Resistido por Inteligência do alvo.",
  },
  {
    id: "obter_informacao",
    nome: "Obter Informação",
    formula: "Carisma + metade Inteligência",
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
    // Livro SNS: Carisma/Manipulação + metade atributo-ou-perícia (arredondado para cima)
    const baseVal = ficha?.[teste.base] ?? 0;
    const atrPericia = atr?.[teste.pericia];
    let halfPericia;
    if (atrPericia !== undefined) {
      // É um atributo direto (Percepção, Inteligência)
      halfPericia = Math.ceil(atrPericia / 2);
    } else {
      // É uma perícia (Arte): nível total = metadeAtr + pts gastos
      // arte -> atributo: inteligencia
      const pCfg = { arte: "inteligencia" };
      const atrLink = pCfg[teste.pericia] ?? "inteligencia";
      const nivelBase = Math.ceil((atr?.[atrLink] ?? 0) / 2);
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
  "Básico": "#4a90e2",
  "Ninpou": "#9b59b6",
  "Doton": "#8B6914",
  "Fuuton": "#27ae60",
  "Katon": "#e05050",
  "Raiton": "#f1c40f",
  "Suiton": "#1abc9c",
  "Fuuinjutsu": "#e67e22",
  "Iryou Ninjutsu": "#27ae60",
  "Rasengan": "#c0392b",
};

const PODERES_ORDEM = ["Básico", "Ninpou", "Doton", "Fuuton", "Katon", "Raiton", "Suiton", "Fuuinjutsu", "Iryou Ninjutsu", "Rasengan"];

const jutsosLivroConfig = [
  {
    id: "bunshin_no_jutsu", nome: "Bunshin no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento ou Padrão", alcance: "Pessoal", duracao: "Sustentada",
    custo: "1 ou 4", dano: "-", selos: "Sim", req: "",
    desc: "Cria 1 ou 2 clones ilusórios. Não causam dano nem usam jutsus. Pode fintar com os clones (ação padrão, custo 4, Prestidigitação vs Prontidão). Gratuito para todos."
  },
  {
    id: "henge_no_jutsu", nome: "Henge no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento", alcance: "Pessoal", duracao: "Sustentada",
    custo: "1", dano: "-", selos: "Sim", req: "",
    desc: "Transforma em outra pessoa, animal ou objeto de mesmo tamanho. Sem teste para usar; quem interagir testa Percepção (Dif 7 + Disfarces) para notar. Gratuito para todos."
  },
  {
    id: "kai", nome: "Kai", poder: "Básico", nivel: 0,
    acao: "Padrão", alcance: "Toque", duracao: "Instantânea",
    custo: "= custo do Genjutsu", dano: "-", selos: "Não", req: "",
    desc: "Liberta a si ou outro de um Genjutsu. Testa Espírito ou Inteligência vs dificuldade do genjutsu. Usar em si mesmo sem custo, exige ter notado o genjutsu. Gratuito para todos."
  },
  {
    id: "kawarimi_no_jutsu", nome: "Kawarimi no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento (reação)", alcance: "Pessoal", duracao: "Instantânea",
    custo: "1", dano: "-", selos: "Opcional", req: "",
    desc: "1x por cena: evita completamente um ataque trocando de lugar com um objeto próximo. Sem ataque oportuno. Não funciona contra ataques em área ou estando imobilizado. Gratuito para todos."
  },
  {
    id: "kinobori", nome: "Kinobori", poder: "Básico", nivel: 0,
    acao: "Livre", alcance: "Pessoal", duracao: "Contínua (1 cena)",
    custo: "1", dano: "-", selos: "Não", req: "",
    desc: "Chakra nos pés permite andar em paredes, tetos e qualquer superfície. Testes só se algo tirar o equilíbrio. Gratuito para todos."
  },
  {
    id: "shunshin_no_jutsu", nome: "Shunshin no Jutsu", poder: "Básico", nivel: 0,
    acao: "Movimento", alcance: "Pessoal", duracao: "Instantânea",
    custo: "1", dano: "-", selos: "Sim", req: "",
    desc: "Movimento super-rápido que parece teleporte. Move até deslocamento máximo. Apenas apresentação — ninjas conseguem acompanhar. Gratuito para todos."
  },
  {
    id: "tadayou", nome: "Tadayou", poder: "Básico", nivel: 0,
    acao: "Livre", alcance: "Pessoal", duracao: "Contínua (1 cena)",
    custo: "1", dano: "-", selos: "Não", req: "",
    desc: "Anda sobre água ou qualquer líquido não inflamável/ácido. Testes pelo Espírito apenas se algo tirar o equilíbrio. Gratuito para todos."
  },
  {
    id: "canhao", nome: "Canhão", poder: "Ninpou", nivel: 1,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 1",
    desc: "Dispara um ataque em jato contra um alvo usando o elemento. A partir do nível 2, pode ser usado sem custo de chakra mas com dano pela metade e sem bônus de outros efeitos."
  },
  {
    id: "criar_arma", nome: "Criar Arma", poder: "Ninpou", nivel: 2,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada ou Permanente",
    custo: "1 (criação)", dano: "ver texto", selos: "Não", req: "Poder Ninpou nível 2",
    desc: "Cria uma arma simples ou marcial (leve, longa, mediana ou de arremesso). Mesmo dano da versão comum. Disponível para Ninpou, Doton e Suiton."
  },
  {
    id: "raio", nome: "Raio", poder: "Ninpou", nivel: 2,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 2",
    desc: "Dispara um raio que atinge uma ou mais criaturas em linha reta. Alvos adicionais após o primeiro recebem metade do dano. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "orbe", nome: "Orbe", poder: "Ninpou", nivel: 2,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 2",
    desc: "Projétil esférico de 0,5m disparado contra o alvo. Causa dano comum do poder. Evolução Nv7: custa metade do chakra mas sem bônus de outros efeitos ou aptidões."
  },
  {
    id: "restringente", nome: "Restringente", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Ver texto",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Ninpou nível 3",
    desc: "Cria uma barreira grossa que restringe o movimento de inimigos. Criaturas dentro da área devem superar teste de Força ou ficam presas. Disponível para Ninpou, Doton, Fuuton e Suiton."
  },
  {
    id: "barreira", nome: "Barreira", poder: "Ninpou", nivel: 3,
    acao: "Movimento (reação)", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "", selos: "", req: "Poder Ninpou nível 3",
    desc: "Conjura uma barreira de proteção com dureza padrão do poder. Deve haver espaço entre o usuário e o inimigo para ser criada. Disponível para Ninpou, Doton, Fuuton e Suiton."
  },
  {
    id: "flechas", nome: "Flechas", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por projétil", selos: "", req: "Poder Ninpou nível 3",
    desc: "Dispara múltiplos projéteis contra um ou mais alvos. O dano total é dividido entre os projéteis criados. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "lanca", nome: "Lança", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Cria um espinho que surge a até 2m e se estica contra o inimigo. Ignora 2 pontos de dureza de barreiras. Pode criar várias lanças para múltiplos alvos dividindo o dano. Disponível para Ninpou, Doton e Suiton."
  },
  {
    id: "coluna", nome: "Coluna", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Conjura uma coluna ou pilar de elemento que surge do chão atingindo o alvo. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "ricochete", nome: "Ricochete", poder: "Ninpou", nivel: 3,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "2 por nível do poder", selos: "", req: "Poder Ninpou nível 3",
    desc: "Dispara um projétil que ricocheteia em superfícies para atingir alvos em cobertura ou fora da linha de visão direta. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "energizar", nome: "Energizar", poder: "Ninpou", nivel: 4,
    acao: "Padrão", alcance: "Pessoal", duracao: "Concentração",
    custo: "3", dano: "ver texto", selos: "Não", req: "Poder Ninpou nível 4",
    desc: "Energiza o próprio punho, uma arma ou compartimento de projéteis. Ao atacar, pode substituir Força/Destreza por Espírito no dano. A arma ganha vantagens e fraquezas do elemento. Disponível para Ninpou, Doton, Fuuton e Suiton."
  },
  {
    id: "nuvem", nome: "Nuvem", poder: "Ninpou", nivel: 4,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Ninpou nível 4",
    desc: "Cria uma nuvem com propriedade do elemento (corrosiva, quente, etc.) em formato de cone que se assenta em área circular. Permanece enquanto mantiver concentração. Disponível para Ninpou, Doton, Fuuton e Suiton."
  },
  {
    id: "correnteza", nome: "Correnteza", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 5",
    desc: "Lança uma correnteza do elemento empurrando criaturas. Se o alvo sofrer restrição de movimento pelo efeito, causa +1 de dano de concussão. Disponível para Ninpou, Doton, Fuuton e Suiton."
  },
  {
    id: "sopro_destrutivo", nome: "Sopro Destrutivo", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 5",
    desc: "Dispara uma onda massiva do elemento em área de cone. Um dos efeitos mais devastadores de área do Ninpou. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "missil", nome: "Míssil", poder: "Ninpou", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder + bônus", selos: "", req: "Poder Ninpou nível 5",
    desc: "Libera um ou mais mísseis contra o oponente, como projéteis de lama ou rajadas de fogo. Pode combinar com outros efeitos para aumentar o dano. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "algemar", nome: "Algemar", poder: "Ninpou", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Ninpou nível 6",
    desc: "Cria algemas ou correntes do elemento que prendem o alvo, impedindo seus movimentos enquanto o usuário mantiver concentração. Disponível para Ninpou, Doton e Suiton."
  },
  {
    id: "onda_explosiva", nome: "Onda Explosiva", poder: "Ninpou", nivel: 6,
    acao: "Padrão", alcance: "Pessoal (área)", duracao: "Instantânea",
    custo: "= nível", dano: "Comum do poder", selos: "", req: "Poder Ninpou nível 6",
    desc: "Libera uma onda explosiva em meia-esfera ou círculo centrado no usuário. Pode ser uma explosão de fogo, tornado de água ou outras formas conforme o elemento. Disponível para Ninpou e todos os elementos básicos."
  },
  {
    id: "imergir", nome: "Imergir", poder: "Doton", nivel: 2,
    acao: "Completa", alcance: "Pessoal", duracao: "Contínua",
    custo: "= nível", dano: "", selos: "", req: "Poder Doton nível 2",
    desc: "Permite ao usuário imergir no solo de terra ou pedra e se mover por dentro dele. Pode reemergir com metade do deslocamento mantendo furtividade. Sentidos não são atrapalhados pelo efeito."
  },
  {
    id: "pele_de_pedra", nome: "Pele de Pedra", poder: "Doton", nivel: 6,
    acao: "Movimento", alcance: "Pessoal", duracao: "Instantânea ou Sustentada",
    custo: "= nível", dano: "", selos: "Não", req: "Poder Doton nível 6",
    desc: "Recobre o corpo com uma armadura de pedra que concede dureza corporal. Evolução Nv9: dureza sustentada aumenta para 2 pontos. Não é possível usar Bloqueio contra Soco de Pedra."
  },
  {
    id: "tremor", nome: "Tremor", poder: "Doton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Doton nível 6",
    desc: "Causa um tremor no solo que derruba criaturas na área. Alvos devem superar teste de Vigor ou caem. Exclusivo do elemento Doton."
  },
  {
    id: "venenoso", nome: "Venenoso", poder: "Fuuton", nivel: 5,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Fuuton nível 5",
    desc: "Cria névoa ou fumaça venenosa usando um veneno produzido com a perícia Venefício (até nível II). Não causa dano direto mas injeta o veneno no alvo. O veneno usado é consumido."
  },
  {
    id: "afiar", nome: "Afiar", poder: "Fuuton", nivel: 6,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada",
    custo: "= nível", dano: "ver texto", selos: "Não", req: "Poder Fuuton nível 6",
    desc: "Torna uma arma afiada perfurante ou cortante, aumentando sua eficácia. Não pode ser usada em armas naturais ou criadas pelo efeito Criar Arma. Exclusivo do Fuuton."
  },
  {
    id: "lamina_de_vento", nome: "Lâmina de Vento", poder: "Fuuton", nivel: 7,
    acao: "Completa", alcance: "5m", duracao: "Instantânea",
    custo: "= nível", dano: "ver texto", selos: "Não", req: "Poder Fuuton nível 7",
    desc: "Emite chakra pelas pontas dos dedos criando lâminas de vento em alta rotação arremessadas repetidamente contra o alvo. As lâminas se desfazem imediatamente após atingir."
  },
  {
    id: "meteoros", nome: "Meteoros", poder: "Katon", nivel: 5,
    acao: "Movimento", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "3 + chakra do efeito de combustão", dano: "bônus (ver texto)", selos: "", req: "Poder Katon nível 5",
    desc: "Lança meteoros de fogo na área. Uma criatura ao alcance da explosão de mais de um meteoro recebe o dano de todos. É possível mirar em alvos específicos com -3 de precisão, impedindo defesas de Esquiva."
  },
  {
    id: "inflamavel", nome: "Inflamável", poder: "Katon", nivel: 5,
    acao: "Movimento", alcance: "Comum do poder", duracao: "Instantânea",
    custo: "3 + chakra do efeito de combustão", dano: "bônus (ver texto)", selos: "", req: "Poder Katon nível 5",
    desc: "Imbui um efeito de Katon com propriedade inflamável, fazendo alvos ou superfícies pegarem fogo. Combina com outros efeitos de Katon para potencializar o dano por combustão."
  },
  {
    id: "lamina_de_raios", nome: "Lâmina de Raios", poder: "Raiton", nivel: 1,
    acao: "Movimento", alcance: "Toque", duracao: "Sustentada (1 ataque)",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Raiton nível 1",
    desc: "Concentra chakra de raio na mão criando uma lâmina elétrica com som característico de pássaros. Altera a natureza do ataque para Raiton e o transforma em descarga elétrica concentrada."
  },
  {
    id: "arma_eletrica", nome: "Arma Elétrica", poder: "Raiton", nivel: 4,
    acao: "Parcial", alcance: "Pessoal", duracao: "Sustentada",
    custo: "ver texto", dano: "ver texto", selos: "Não", req: "Poder Raiton nível 4",
    desc: "Carrega uma arma com eletricidade. Em ataque surpresa contra alvo desprevenido, causa no mínimo grau 2 de dano. Abater um capanga com ela permite mantê-la por um ataque adicional."
  },
  {
    id: "descarga", nome: "Descarga", poder: "Raiton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder ou toque", duracao: "Instantânea",
    custo: "Padrão do poder", dano: "Metade do dano comum do poder", selos: "", req: "Poder Raiton nível 6",
    desc: "Libera uma descarga elétrica em área ou por toque. O efeito não requer selos de mão. Exclusivo do Raiton."
  },
  {
    id: "nevoa", nome: "Névoa", poder: "Suiton", nivel: 2,
    acao: "Padrão", alcance: "1m", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Suiton nível 2",
    desc: "Cria uma névoa densa. Só é possível enxergar perfeitamente criaturas a até 1m; além disso, camuflagem parcial (25% de falha nos ataques). Possui dureza imaginária contra ataques de Katon e Fuuton."
  },
  {
    id: "prisao_de_agua", nome: "Prisão de Água", poder: "Suiton", nivel: 3,
    acao: "Padrão", alcance: "1m", duracao: "Concentração",
    custo: "= nível", dano: "Nenhum", selos: "", req: "Poder Suiton nível 3",
    desc: "Prende um alvo em uma esfera de água, imobilizando-o. A vítima pode usar ação padrão para testar Força (Dif padrão) ou Vigor (Dif padrão 2) para se libertar pelo restante da cena."
  },
  {
    id: "colisao_de_ondas", nome: "Colisão de Ondas", poder: "Suiton", nivel: 6,
    acao: "Padrão", alcance: "Comum do poder", duracao: "Concentração",
    custo: "= nível", dano: "ver texto", selos: "", req: "Poder Suiton nível 6",
    desc: "Conjura ondas massivas de água colidindo contra os inimigos. Exclusivo do Suiton."
  },
  // ─── FUUINJUTSU (Nv 1–10) ──────────────────────────────────────────────────
  {
    id: "fuuin_armazenamento", nome: "Fuuinjutsu Nv1 — Selo de Armazenamento", poder: "Fuuinjutsu", nivel: 1,
    acao: "1 rodada (selar) / Parcial ou Padrão (liberar)", alcance: "Toque", duracao: "Permanente",
    custo: "1 por compartimento/jutsu selado", dano: "-", selos: "Sim (liberar jutsu)", req: "Poder Fuuinjutsu nível 1",
    desc: "Sela em um pergaminho: até 3 compartimentos de itens, até 3 pontos de chakra ou 1 jutsu de ataque à distância (Ninpou/elemental). Liberar itens/armas: ação parcial, sem selos de mão. Liberar jutsu: ação padrão, requer selos mesmo que o jutsu não precise. Jutsus de Hijutsu (ex: Mokuton) só podem ser liberados por quem possui o mesmo Hijutsu. Kage/Moku Bunshin liberam itens; liberar jutsus exige Clone Verdadeiro. Qualquer personagem desfaz selos sem custo. Jutsu liberado segue NC do usuário."
  },
  {
    id: "fuuin_armazenamento_maior", nome: "Fuuinjutsu Nv2 — Selo de Armazenamento Maior", poder: "Fuuinjutsu", nivel: 2,
    acao: "ver texto", alcance: "Toque", duracao: "Permanente",
    custo: "ver texto", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 2",
    desc: "Como o Selo de Armazenamento, mas expande para 6 compartimentos de itens ou até 1 ponto de chakra + 1 por nível do poder. Com Fuuinjutsu nível 3: armazena 1 objeto de tamanho Médio (ocupa todos os compartimentos). Com nível 5: tamanho Grande."
  },
  {
    id: "fuuin_misshi", nome: "Fuuinjutsu Nv3 — Misshi (Mensageiro)", poder: "Fuuinjutsu", nivel: 3,
    acao: "Padrão", alcance: "Toque", duracao: "Permanente (até reprodução)",
    custo: "3", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 3",
    desc: "Selo Avançado: grava uma mensagem de até 20 palavras no selo, no idioma e tom do criador. O usuário escolhe uma assinatura de chakra específica para ativar o selo. Quando a criatura com aquela assinatura tocar o selo, a mensagem é reproduzida e o selo se autodestrói. O criador sabe imediatamente quando foi reproduzida. Selos avançados são destruídos por dano cortante ou fogo; só podem ser usados pelo criador."
  },
  {
    id: "fuuin_bakudan", nome: "Fuuinjutsu Nv4 — Bakudan (Bomba)", poder: "Fuuinjutsu", nivel: 4,
    acao: "Padrão", alcance: "Toque", duracao: "Permanente",
    custo: "1 por tarja (criação); metade do nível do poder (ativação)", dano: "2 por nível usado", selos: "Sim", req: "Poder Fuuinjutsu nível 4",
    desc: "Selo Avançado: cria tarjas explosivas customizadas. Explosão em esfera com diâmetro de 2m por nível do poder; dano 2 por nível usado. Dif para defesa contra ativação remota: 9 + 2× nível do poder. Somente 1 Bakudan por vez; sem acúmulo por tarjas adicionais. Aceita meta-aptidões (ex: Potencializar — gaste ação de movimento no momento da explosão). Pode criar armadilhas com Mecanismos (dano máximo ainda limitado pela perícia)."
  },
  {
    id: "fuuin_gensou", nome: "Fuuinjutsu Nv5 — Gensou no In (Selo de Ilusão)", poder: "Fuuinjutsu", nivel: 5,
    acao: "Padrão", alcance: "Toque", duracao: "Permanente",
    custo: "5", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 5",
    desc: "Selo Avançado: cria a ilusão de que algo existe no local (objetos ou criaturas), com até 1m por nível de Inteligência em cada dimensão. Para reconhecer: precisa interagir fisicamente. Por ser Ninjutsu, não pode ser cancelada pelo Kai. Desaparece quando o selo é removido ou destruído."
  },
  {
    id: "fuuin_wana", nome: "Fuuinjutsu Nv6 — Ninjutsu no Wana (Armadilha de Ninjutsu)", poder: "Fuuinjutsu", nivel: 6,
    acao: "1 rodada (criação)", alcance: "Toque", duracao: "Permanente (até ativação)",
    custo: "4 + chakra do ninjutsu selado", dano: "ver técnica selada (−1 precisão defensiva)", selos: "Sim", req: "Poder Fuuinjutsu nível 6; Mecanismos 10",
    desc: "Armazena um ninjutsu de ataque à distância (nível máx 8, não restrito) em armadilha fixa. Área de ativação: círculo de 0,5m de diâmetro por nível de Inteligência. A 1ª criatura que passar pela área sofre a técnica com −1 de precisão em sua defesa. Técnicas com área de efeito transformam-se em cone a partir do selo. Não pode ser desarmada; só se dissipar ou forçar ativação. Dif para Procurar/Prontidão: 7 + 2× nível do poder (somente criaturas com Ocultismo ou Fuuinjutsu fazem o teste)."
  },
  {
    id: "fuuin_chakra_souin", nome: "Fuuinjutsu Nv7 — Chakra no Souin (Selo de Contenção de Chakra)", poder: "Fuuinjutsu", nivel: 7,
    acao: "Completa (ativação)", alcance: "Toque", duracao: "Permanente",
    custo: "Reduz chakra do usuário a 1 (req. mín. 15 antes)", dano: "−2 chakra/turno por criatura na área", selos: "Sim", req: "Poder Fuuinjutsu nível 7; Fuuinjutsu (perícia) 7",
    desc: "Selo Avançado de absorção de chakra. Não pode ser colocado em objetos em movimento nem movido após criado. Área: círculo de 1m de diâmetro por nível de Inteligência. Toda criatura sobre a área (mesmo sem pisar) perde 2 chakra por turno. Não drena criaturas com mesma assinatura de chakra do criador; não reduz chakra abaixo de 1 ponto. Na ativação o chakra do usuário vai a 1 (deve ter mínimo 15 antes, incluindo chakra de Kage Bunshins)."
  },
  {
    id: "fuuin_kekkai", nome: "Fuuinjutsu Nv8 — Kekkai no In (Barreira de Selo)", poder: "Fuuinjutsu", nivel: 8,
    acao: "Completa", alcance: "Toque", duracao: "Permanente",
    custo: "8", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 8",
    desc: "Cria uma parede invisível e indestrutível de chakra (1cm de espessura, formato quadrado). Altura e largura: 0,5m por nível de Inteligência. O selo pode ser uma das pontas ou o centro do quadrado. Nenhuma criatura ou objeto atravessa; concede cobertura defensiva. Não bloqueia técnicas de espaço-tempo (Hiraishin) nem doujutsus. Cancelada se o selo for movido, removido ou destruído."
  },
  {
    id: "fuuin_shishou", nome: "Fuuinjutsu Nv8 — Shishou Fuuin (Selo dos Quatro Símbolos)", poder: "Fuuinjutsu", nivel: 8,
    acao: "3 dias (ritual)", alcance: "20m", duracao: "Permanente",
    custo: "16", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 8; Ocultismo 16",
    desc: "Selo Épico (Rank A). Ritual de 3 dias para selar uma Bijuu em pote especial (até 10 anos) ou em uma pessoa (transformando-a em Jinchuuriki). Mínimo 10 participantes; pelo menos 1 deve conhecer a técnica. Qualquer perturbação cancela e reinicia o ritual. Pode ser executado instantaneamente ao final do Shiki Fuujin."
  },
  {
    id: "fuuin_keiyaku", nome: "Fuuinjutsu Nv9 — Keiyaku Fuuin (Selo Anticontrato)", poder: "Fuuinjutsu", nivel: 9,
    acao: "Padrão", alcance: "Toque", duracao: "Permanente",
    custo: "8", dano: "-", selos: "Sim", req: "Poder Fuuinjutsu nível 9; Ocultismo 16",
    desc: "Selos Épicos (Rank A). Cancela imediatamente o controle que um usuário de Mangekyou Sharingan exerce sobre uma Bijuu através da Hipnose Sharingan. Sem testes além do toque contra o alvo."
  },
  {
    id: "fuuin_shiki_fuujin", nome: "Fuuinjutsu Nv10 — Shiki Fuujin (Selamento do Demônio da Morte)", poder: "Fuuinjutsu", nivel: 10,
    acao: "Padrão + preparação (1 turno)", alcance: "Longo (75m)", duracao: "Permanente",
    custo: "10", dano: "Morte do alvo + morte do usuário (5 min após)", selos: "Sim", req: "Poder Fuuinjutsu nível 10; Ocultismo 20",
    desc: "Selos Épicos (Rank S). Invoca o Shinigami para extrair e selar a alma do alvo junto com a do usuário. Execução: 1 turno de preparação (usuário pode agir livremente). Turno seguinte: braços do Shinigami projetados — agarrar é Sucesso Automático (invisível). Alvo fica indefeso/imóvel. Alma extraída no início do próximo turno do usuário → mata o alvo imediatamente. Concentração interrompida por dano: teste de Concentração (dif pelo Mestre), falha = +1 turno. Selamento parcial (ação parcial): sela partes do corpo — vítima fica exausta permanentemente e sem uso dos membros selados (incurável por medicina normal). Mais alvos: +1 por Kage Bunshin (máx +2). Pode selar Bijuu em si mesmo ou em outra pessoa (Jinchuuriki). Usuário vive 5 min após selar; depois o Shinigami consome ambas as almas (irreversível)."
  },
  // ─── IRYOU NINJUTSU (técnicas específicas) ──────────────────────────────────
  {
    id: "iryou_cura_geral", nome: "Iryou Ninjutsu — Cura Geral", poder: "Iryou Ninjutsu", nivel: 1,
    acao: "Padrão (concentração)", alcance: "Toque", duracao: "Concentração",
    custo: "= nível usado do poder", dano: "-", selos: "Não", req: "Aptidão Ninja Médico; Espírito 6",
    desc: "Concentra chakra nas mãos e acelera a regeneração celular do paciente. Ambos devem estar imóveis. Ao final de cada turno de tratamento: recupera Nível do Poder + metade de Medicina (↑) de Vitalidade. +1 com Perito: Medicina; +1 com Perícia Inata: Medicina. Cura sangramento e cortes do Bisturi de Chakra no 1º turno. Em si mesmo: cura somente a metade (superado com nível 4+)."
  },
  {
    id: "chakra_no_mesu", nome: "Chakra no Mesu — Bisturi de Chakra", poder: "Iryou Ninjutsu", nivel: 1,
    acao: "Movimento (preparar)", alcance: "Toque", duracao: "Sustentada",
    custo: "= nível usado do poder", dano: "2 por nível usado (técnica de toque)", selos: "Não", req: "Poder Iryou Ninjutsu nível 6",
    desc: "Cria duas lâminas de chakra nas mãos para cirurgia ou combate. Ofensivo: técnica de toque, dano letal 2 por nível usado; pode usar com Ataque Múltiplo. Sem Bloqueio desarmado contra ele. Se atingido 3 vezes: testa Vigor (Dif 7 + nível + metade de Medicina) ou fica Lento e Debilitado por 2 meses (cura: 1 turno de Iryou Ninjutsu ou 1 mês de repouso)."
  },
  {
    id: "inyu_shometsu", nome: "In'yu Shōmetsu — Recuperação Secreta", poder: "Iryou Ninjutsu", nivel: 1,
    acao: "Movimento (reação defensiva)", alcance: "Pessoal", duracao: "Instantânea",
    custo: "1 por 2 Vit curada", dano: "-", selos: "Não", req: "Poder Iryou Ninjutsu nível 6; Perito e Perícia Inata: Medicina",
    desc: "Cura instantânea em si mesmo ao sofrer dano (até o limite do dano recebido). Sem testes; não funciona contra acertos críticos nem ataques em área. Somente 1 vez por dia."
  },
  {
    id: "shousen_no_jutsu", nome: "Shousen no Jutsu — Mão Mística", poder: "Iryou Ninjutsu", nivel: 1,
    acao: "Padrão (concentração)", alcance: "Toque", duracao: "Concentração",
    custo: "= nível usado do poder", dano: "ver texto (modo ofensivo)", selos: "Não", req: "Poder Iryou Ninjutsu nível 7",
    desc: "Cura pelo padrão do Iryou Ninjutsu (toque). Ofensivo: envia chakra em excesso desorganizando a circulação do alvo. Alvo testa Vigor (Dif 7 + nível + metade de Medicina): falha → Atordoado até fim do próximo turno; falha crítica → repete o teste, nova falha → Inconsciente."
  },
  // ─── RASENGAN ────────────────────────────────────────────────────────────────
  {
    id: "rasengan_basico", nome: "Rasengan Básico", poder: "Rasengan", nivel: 1,
    acao: "Completa (ou Padrão com ajuda de Kage Bunshin)", alcance: "Toque", duracao: "Instantânea ou Sustentada",
    custo: "1 por nível do poder", dano: "2 + Nível do Poder + metade de ESP (arred. acima)", selos: "Não", req: "Poder Rasengan nível 1; Espírito 8",
    desc: "Bola giratória de chakra. Teste CC contra a defesa do alvo. Ação completa para preparar e atacar. Com Kage Bunshin (ação de movimento do clone): ataca com ação padrão — mesmo clone comum funciona. Dano = 2 + Nível + metade de ESP (arred. acima). Alvo arremessado 3m; testa Vigor (Dif 7 + Nível + metade de ESP (arred. acima)) para não cair, ou Acrobacia (+2 Dif). Destrói armas usadas como bloqueio. Pode manter na mão (ação parcial, duração sustentada). Incompatível com meta-aptidões."
  },
  {
    id: "rasengan_completo", nome: "Rasengan Completo", poder: "Rasengan", nivel: 6,
    acao: "Padrão (ou com Kage Bunshin: ação livre do clone)", alcance: "Toque", duracao: "Instantânea",
    custo: "1 por nível do poder", dano: "Nível do Poder + Espírito", selos: "Não", req: "Poder Rasengan nível 6; Espírito 14 (ou 12 + Chakra Expandido)",
    desc: "Rasengan aperfeiçoado: apenas ação padrão para preparar e atacar. Com Kage Bunshin: clone usa ação livre. Dano = Nível do Poder + Espírito (sem o +2 do Básico). Demais regras do Rasengan Básico se aplicam."
  },
  {
    id: "oodama_rasengan", nome: "Oodama Rasengan", poder: "Rasengan", nivel: 7,
    acao: "Completa (Padrão + meta-aptidão Técnica Poderosa)", alcance: "Toque", duracao: "Instantânea",
    custo: "1 por nível do poder", dano: "Rasengan Completo + Técnica Poderosa (grau +0,5 ↑)", selos: "Não", req: "Poder Rasengan nível 7; Espírito 16 (ou 14 + Chakra Expandido); aptidão Técnica Poderosa",
    desc: "Rasengan amplificado (~0,5m de diâmetro). Funciona como Rasengan Completo com Técnica Poderosa aplicada automaticamente. Teste para não cair recebe +1 de dificuldade adicional."
  },
  {
    id: "rasengan_elemental", nome: "Rasengan Elemental", poder: "Rasengan", nivel: 9,
    acao: "Completa", alcance: "Toque (explosão 10m após impacto)", duracao: "Instantânea",
    custo: "2 + 1 por nível do poder", dano: "Nível + ESP; grau mínimo 2 (alvo direto); área 10m", selos: "Não", req: "Poder Rasengan nível 9; Katon, Raiton ou Fuuton nível 2",
    desc: "Rasengan com elemento: Enka Rasengan (Katon), Raiöu Rasengan (Raiton) ou Rasen Shuriken (Fuuton). Adquire vantagens/desvantagens do elemento (sem bônus de dano elemental). Dano Irresistível: mínimo grau 2 no alvo direto. Após impacto explode em 10m (criaturas extras não recebem Dano Irresistível). Dano Colateral: usuário sofre dano base com grau 1. Senpou Rasengan: gaste 1 Chakra Senjutsu adicional → transforma em ataque à distância (CD, alcance do poder elemental usado) sem dano colateral."
  },
];

// Verifica se personagem atinge um requisito textual
const verificarRequisito = (req, ficha, poderes) => {
  if (!req) return true;
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const r = norm(req);

  // Normalizar arrays
  let aptidoesArr = [];
  if (Array.isArray(ficha?.aptidoes)) aptidoesArr = ficha.aptidoes;
  else if (typeof ficha?.aptidoes === "string") {
    try { aptidoesArr = JSON.parse(ficha.aptidoes); } catch { aptidoesArr = []; }
  }
  const poderesArr = Array.isArray(poderes) ? poderes : [];
  const pericias = ficha?.pericias || {};

  // Helper: nível de um poder pelo nome ou id parcial
  const nivelPoder = (nomeParcial) => {
    const np = norm(nomeParcial);
    const p = poderesArr.find(p => norm(p.nome || "").includes(np) || norm(p.id || "").includes(np));
    return p ? (parseInt(p.nivel) || 0) : 0;
  };

  // Helper: valor de perícia
  const valPericia = (nomeParcial) => {
    const np = norm(nomeParcial);
    const key = Object.keys(pericias).find(k => norm(k).includes(np));
    return key ? (parseInt(pericias[key]) || 0) : 0;
  };

  // Helper: tem aptidão por nome
  const temApt = (nomeApt) => {
    const na = norm(nomeApt);
    return aptidoesArr.some(a => norm(a.nome || "").includes(na) || norm(a.id || "").replace(/_/g," ").includes(na));
  };

  // ── Aptidões específicas ─────────────────────────────────────────
  if (r.includes("ninja medico") && !temApt("ninja medico")) return false;
  if (r.includes("tecnica poderosa") && !temApt("tecnica poderosa")) return false;
  if (r.includes("perito") && r.includes("medicina") && !temApt("perito")) return false;
  if (r.includes("pericia inata") && r.includes("medicina") && !temApt("pericia inata")) return false;
  if (r.includes("chakra expandido") && !temApt("chakra expandido")) return false;

  // ── Espírito X ───────────────────────────────────────────────────
  const mEsp = r.match(/espirito\s*(\d+)/);
  if (mEsp) {
    const espAtual = parseInt(ficha?.espirito || ficha?.atr_espirito || 0);
    if (espAtual < parseInt(mEsp[1])) return false;
  }

  // ── Poder X nível Y — cobre "Poder Fuuinjutsu nível 6", "Poder Iryou Ninjutsu nível 7" etc.
  const mPoderes = r.matchAll(/poder\s+([\w\s]+?)\s+n[ií]vel\s*(\d+)/g);
  for (const mp of mPoderes) {
    const pNome = mp[1].trim();
    const pNivel = parseInt(mp[2]);
    if (nivelPoder(pNome) < pNivel) return false;
  }

  // ── Fuuinjutsu nível Y como poder (sem palavra "poder") ──────────
  const mFuuin = r.match(/fuuinjutsu\s+(?:nivel|n[ií]vel)\s*(\d+)/);
  if (mFuuin && !r.includes("poder fuuinjutsu")) {
    if (nivelPoder("fuuinjutsu") < parseInt(mFuuin[1])) return false;
  }

  // ── Iryou Ninjutsu nível Y (sem palavra "poder") ─────────────────
  const mIryou = r.match(/iryou ninjutsu\s+(?:nivel|n[ií]vel)\s*(\d+)/);
  if (mIryou && !r.includes("poder iryou")) {
    if (nivelPoder("iryou") < parseInt(mIryou[1])) return false;
  }

  // ── Rasengan nível Y (sem palavra "poder") ───────────────────────
  const mRasengan = r.match(/rasengan\s+n[ií]vel\s*(\d+)/);
  if (mRasengan && !r.includes("poder rasengan")) {
    if (nivelPoder("rasengan") < parseInt(mRasengan[1])) return false;
  }

  // ── Elemento nível Y — "Katon, Raiton ou Fuuton nível 2" ────────
  const mElem = r.match(/(?:katon|raiton|fuuton|suiton|doton).*?n[ií]vel\s*(\d+)/);
  if (mElem) {
    const nivelNec = parseInt(mElem[1]);
    const elementais = ["katon", "raiton", "fuuton", "suiton", "doton"];
    const temElemental = elementais.some(el => r.includes(el) && nivelPoder(el) >= nivelNec);
    if (!temElemental) return false;
  }

  // ── Perícias numéricas — "Mecanismos 10", "Ocultismo 16", "Fuuinjutsu (perícia) 7" ──
  const mPericias = r.matchAll(/([a-záàâãéêíóôõúçüñ\s]+?)\s*(?:\([^)]*\))?\s*(\d{1,2})(?!\s*de\s*n[ií]vel)/g);
  for (const mp of mPericias) {
    const pNome = mp[1].trim();
    const pVal = parseInt(mp[2]);
    // Ignorar padrões que são atributos ou expressões já tratadas
    if (["espirito","vigor","forca","destreza","agilidade","inteligencia","percepcao",
         "poder","nivel","nc","nv"].some(kw => pNome.includes(kw))) continue;
    if (pNome.length < 3) continue;
    const perVal = valPericia(pNome);
    if (perVal < pVal) return false;
  }

  return true;
};

// Verifica req estruturado dos PODERES_CONFIG (array de objetos)
// Suporte a ou:true — grupo avaliado como OR (basta um passar)
const verificarReqPoder = (req, ficha, poderes) => {
  if (!req || req.length === 0) return { ok: true, motivo: null };
  const atr = ficha?.atributos || ficha || {};
  const aptArr = Array.isArray(ficha?.aptidoes) ? ficha.aptidoes : [];
  const perArr = ficha?.pericias || {};
  const podArr = Array.isArray(poderes) ? poderes : [];

  const getNomeAtributo = (key) => ({
    FOR: "forca", AGI: "agilidade", DES: "destreza", VIG: "vigor",
    INT: "inteligencia", ESP: "espirito", PRE: "presenca",
  }[key.toUpperCase()] || key.toLowerCase());

  const avaliarItem = (r) => {
    if (r.atr) {
      const val = parseInt(atr[getNomeAtributo(r.atr)] || ficha?.[getNomeAtributo(r.atr)] || 0);
      return { ok: val >= r.val, motivo: `${r.atr} ${r.val}` };
    }
    if (r.apt) {
      const rApt = r.apt.toLowerCase();
      const temApt = aptArr.some(a => {
        const id = (a.id || "").toLowerCase();
        return id === rApt || id === `g_${rApt}` || id === rApt.replace(/^g_/, "") ||
          id.includes(rApt) ||
          (a.nome || "").toLowerCase().replace(/\s+/g, "_").includes(rApt.replace(/\s+/g, "_"));
      });
      const nomeFormatado = r.apt.replace(/^r_/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      return { ok: temApt, motivo: nomeFormatado };
    }
    if (r.per) {
      const nomePer = r.per.toLowerCase();
      const valPer = parseInt(perArr[nomePer] || ficha?.pericias?.[nomePer] || 0);
      return { ok: valPer >= r.val, motivo: `${r.per} ${r.val}` };
    }
    if (r.poder) {
      if (r.poder === "qualquer_elemental") {
        const elementais = ["katon", "raiton", "fuuton", "doton", "suiton"];
        const temElemental = elementais.some(id => {
          const p = podArr.find(p => p.id === id);
          return p && (parseInt(p.nivel) || 0) >= r.val;
        });
        return { ok: temElemental, motivo: `Elemento (Katon/Raiton/Fuuton) nível ${r.val}` };
      } else {
        const p = podArr.find(p => p.id === r.poder);
        const ok = !!(p && (parseInt(p.nivel) || 0) >= r.val);
        return { ok, motivo: `${r.poder} nível ${r.val}` };
      }
    }
    return { ok: true, motivo: null };
  };

  const ouItems = req.filter(r => r.ou);
  const normItems = req.filter(r => !r.ou);

  const motivos = [];
  for (const r of normItems) {
    const { ok, motivo } = avaliarItem(r);
    if (!ok) motivos.push(motivo);
  }
  if (ouItems.length > 0) {
    const algumOuOk = ouItems.some(r => avaliarItem(r).ok);
    if (!algumOuOk) {
      motivos.push(ouItems.map(r => avaliarItem(r).motivo).join(" ou "));
    }
  }

  return motivos.length === 0 ? { ok: true, motivo: null } : { ok: false, motivo: motivos.join(", ") };
};
const ModalLojaJutsus = ({ jutsus, onAdicionar, onFechar, ficha, poderes, pontosRestantes }) => {
  const [busca, setBusca] = useState("");
  const [filtroP, setFiltroP] = useState("Todos");
  const [expandidos, setExpandidos] = useState({});
  const [toast, setToast] = useState(null);

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

  // Cadeia de pré-requisitos: jutsu X só pode ser comprado se os anteriores da série já foram adquiridos
  const CADEIA_JUTSUS = {
    // Fuuinjutsu — sequência obrigatória Nv1→2→3→4→5→6→7→8→9→10
    fuuin_armazenamento_maior: ["fuuin_armazenamento"],
    fuuin_misshi:              ["fuuin_armazenamento", "fuuin_armazenamento_maior"],
    fuuin_bakudan:             ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi"],
    fuuin_gensou:              ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan"],
    fuuin_wana:                ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou"],
    fuuin_chakra_souin:        ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou", "fuuin_wana"],
    fuuin_kekkai:              ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou", "fuuin_wana", "fuuin_chakra_souin"],
    fuuin_shishou:             ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou", "fuuin_wana", "fuuin_chakra_souin"],
    fuuin_keiyaku:             ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou", "fuuin_wana", "fuuin_chakra_souin", "fuuin_kekkai"],
    fuuin_shiki_fuujin:        ["fuuin_armazenamento", "fuuin_armazenamento_maior", "fuuin_misshi", "fuuin_bakudan", "fuuin_gensou", "fuuin_wana", "fuuin_chakra_souin", "fuuin_kekkai", "fuuin_keiyaku"],
    // Iryou Ninjutsu — técnicas avançadas requerem a cura base
    chakra_no_mesu:   ["iryou_cura_geral"],
    inyu_shometsu:    ["iryou_cura_geral"],
    shousen_no_jutsu: ["iryou_cura_geral"],
    // Rasengan — sequência obrigatória
    rasengan_completo:   ["rasengan_basico"],
    oodama_rasengan:     ["rasengan_basico", "rasengan_completo"],
    rasengan_elemental:  ["rasengan_basico", "rasengan_completo"],
  };

  const bloqueadoPorCadeia = (cfgId) => {
    const reqs = CADEIA_JUTSUS[cfgId];
    if (!reqs) return { bloqueado: false, motivo: null };
    const faltando = reqs.filter(reqId => !jaAdicionado(reqId));
    if (faltando.length === 0) return { bloqueado: false, motivo: null };
    // Mostra só o primeiro que falta (o mais próximo na cadeia)
    const cfg = jutsosLivroConfig.find(j => j.id === faltando[0]);
    return { bloqueado: true, motivo: `Requer primeiro: ${cfg?.nome || faltando[0]}` };
  };

  const adicionar = (cfg, bloqueado, motivoBloqueio) => {
    if (bloqueado) { mostrarToast(motivoBloqueio || "Requisitos não atingidos.", "erro"); return; }
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
            const bloqueadoReq = !verificarRequisito(cfg.req, ficha || {}, poderes || []);
            const { bloqueado: bloqueadoCadeia, motivo: motivoCadeia } = bloqueadoPorCadeia(cfg.id);
            const bloqueado = bloqueadoReq || bloqueadoCadeia;
            const motivoBloqueio = bloqueadoCadeia ? motivoCadeia : "Requisitos não atingidos";
            const adicionado = jaAdicionado(cfg.id);
            const exp = expandidos[cfg.id];
            const poderCor = PODER_COR[cfg.poder] || "#888";
            const custoP = cfg.poder === "Básico" ? 0 : 1;
            const semPts = custoP > 0 && pontosRestantes !== undefined && custoP > pontosRestantes;
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
                        : <span style={{ fontSize: "0.65rem", color: semPts ? "#ef4444" : "#b060e0", border: `1px solid ${semPts ? "#ef444433" : "#b060e033"}`, borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif" }}>1 pt</span>
                      }
                      {adicionado && <span className="fn-loja-badge-max">OK</span>}
                      {bloqueado && !adicionado && <span style={{ fontSize: "0.65rem", color: "#4a1a1a", border: "1px solid #4a1a1a", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 0.5 }}>BLOQUEADO</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      {cfg.custo && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#4a90e2", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.custo} chakra</span>}
                      {cfg.acao && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#555", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.acao}</span>}
                      {cfg.alcance && cfg.alcance !== "Pessoal" && <span style={{ fontSize: "0.78rem", color: bloqueado ? "#2a2a2a" : "#555", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{cfg.alcance}</span>}
                    </div>
                  </div>
                  {!adicionado && (
                    <button className="fn-fn-loja-item-add"
                      style={{ borderColor: (bloqueado || semPts) ? "#2a2a2a" : "#4a90e2", color: (bloqueado || semPts) ? "#2a2a2a" : "#4a90e2", cursor: (bloqueado || semPts) ? "not-allowed" : "pointer", opacity: (bloqueado || semPts) ? 0.4 : 1 }}
                      title={semPts ? `Pontos insuficientes (restam ${pontosRestantes})` : bloqueado ? motivoBloqueio : "Adicionar jutsu"}
                      onClick={e => { e.stopPropagation(); adicionar(cfg, bloqueado, motivoBloqueio); }}>
                      <i className="fas fa-plus" />
                    </button>
                  )}
                </div>
                {exp && (
                  <div className="fn-fn-loja-item-corpo">
                    <p className="fn-fn-loja-item-desc" style={{ color: bloqueado ? "#333" : "#777", fontSize: "0.9rem" }}>{cfg.desc}</p>
                    {(cfg.req || bloqueadoCadeia) && (
                      <div style={{ marginTop: 6, padding: "5px 8px", background: bloqueado ? "#1a0a0a" : "#0a1628", border: `1px solid ${bloqueado ? "#3a1a1a" : "#1a3050"}`, borderRadius: 4 }}>
                        <span style={{ fontSize: "0.78rem", color: bloqueado ? "#c0392b" : "#4a90e2", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 0.5 }}>
                          {bloqueadoCadeia ? motivoCadeia : bloqueadoReq ? `BLOQUEADO — ${cfg.req}` : `Req: ${cfg.req}`}
                        </span>
                      </div>
                    )}
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                      {cfg.duracao && <span style={{ fontSize: "0.78rem", color: "#ccc", fontFamily: "'Be Vietnam Pro',sans-serif" }}><strong style={{ color: "#4a90e2" }}>Duração</strong>: {cfg.duracao}</span>}
                      {cfg.selos && <span style={{ fontSize: "0.78rem", color: "#ccc", fontFamily: "'Be Vietnam Pro',sans-serif" }}><strong style={{ color: "#4a90e2" }}>Selos de Mão</strong>: {cfg.selos}</span>}
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
    desc: "Poder base de ninjutsu. Determina alcance dos jutsus e custo base de chakra. A cada nível você ganha ou evolui um Efeito (Canhão, Raio, Orbe, etc.). Dano base = nível usado + metade Espírito.",
    niveis: [
      {
        n: 1, info: "Tier 1 — desbloqueia Canhão",
        detalhe: "Alcance: Curto (10m + 2m/ESP). Você ganha o Efeito Canhão: disparo em jato contra 1 alvo, dano 2 por nível usado. A partir do nível 2 pode usar o Canhão sem custo de chakra com dano pela metade."
      },
      {
        n: 2, info: "Tier 2 — desbloqueia Criar Arma, Raio, Orbe",
        detalhe: "Alcance: Médio. Novos efeitos disponíveis:\n• Criar Arma (Parcial, Pessoal): cria arma simples ou marcial sustentada.\n• Raio (Padrão): atinge criaturas em linha reta; alvos além do primeiro recebem metade do dano.\n• Orbe (Padrão): projétil esférico de 0,5m, dano comum do poder."
      },
      {
        n: 3, info: "Tier 3 — desbloqueia Restringente, Barreira, Flechas, Lança, Coluna, Ricochete",
        detalhe: "Novos efeitos disponíveis:\n• Restringente: barreira grossa que prende inimigos (teste de Força para escapar).\n• Barreira (reação): proteção com dureza padrão do poder.\n• Flechas: múltiplos projéteis, dano 2 por projétil.\n• Lança: espinho que surge a 2m, ignora 2 de dureza de barreiras.\n• Coluna: pilar que surge do chão, dano 2 por nível.\n• Ricochete: projétil que ricocheteia em superfícies."
      },
      {
        n: 4, info: "Tier 4 — desbloqueia Energizar, Nuvem",
        detalhe: "Alcance: Longo (15m + 3m/ESP). Novos efeitos:\n• Energizar (Parcial, Concentração, custo 3): energiza punho ou arma com o elemento; substitui FOR/DES por ESP no dano.\n• Nuvem (Padrão, Concentração): cone de névoa com propriedade do elemento que se assenta em área circular."
      },
      {
        n: 5, info: "Tier 5 — desbloqueia Correnteza, Sopro Destrutivo, Míssil",
        detalhe: "Novos efeitos disponíveis:\n• Correnteza: empurra criaturas; +1 dano de concussão se restringido.\n• Sopro Destrutivo: onda massiva em cone — um dos mais devastadores de área.\n• Míssil: um ou mais mísseis contra o oponente; combina com outros efeitos para mais dano."
      },
      {
        n: 6, info: "Tier 6 — desbloqueia Algemar, Onda Explosiva",
        detalhe: "Alcance: Extremo. Domínio máximo do poder. Novos efeitos:\n• Algemar (Padrão, Concentração): correntes que prendem completamente o alvo enquanto concentrado.\n• Onda Explosiva (Padrão, área): explosão em meia-esfera ou círculo centrado no usuário."
      },
    ],
  },
  {
    id: "doton", nome: "Doton", cor: "#8B6914",
    desc: "Elemento Terra. Alcance Curto (5m +1m/ESP). Toda criação tem +2 de dureza adicional. Efeitos exclusivos: Imergir (nível 2), Tremor e Pele de Pedra (nível 6).",
    niveis: [
      { n: 1, info: "Tier 1 — +1 dano de Doton", detalhe: "Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      {
        n: 2, info: "Tier 2 — desbloqueia Imergir",
        detalhe: "• Imergir (Completa, Contínua, Pessoal): funde-se com terra/pedra natural ou criada por Criação Livre/Barreira. Recebe Perito em Furtividade; não pode se mover; visão limitada a 10m. Sair é ação de movimento.\n• Falsa Decapitação: Agarrar furtivo em alvo acima — alvo fica com cabeça de fora (impedido, Força/Escapar Dif 10).\n• Evolução Imergir Nv4: move-se com metade do deslocamento enquanto imerso, sem perder furtividade."
      },
      { n: 3, info: "Tier 3 — +1 dano de Doton", detalhe: "Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n: 4, info: "Tier 4 — +1 dano de Doton", detalhe: "Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      { n: 5, info: "Tier 5 — +1 dano de Doton", detalhe: "Cada nível de Doton aumenta o dano base dos seus ataques em +1." },
      {
        n: 6, info: "Tier 6 — desbloqueia Tremor e Pele de Pedra",
        detalhe: "• Tremor (Padrão, Instantânea, círculo 2m): chão treme, criaturas fazem defesa ou ficam caídas. Evolução Nv4: círculo = diâmetro comum do poder.\n• Pele de Pedra (Movimento, Pessoal): dureza de corpo = padrão +2 até fim do turno. Sustentada: 1 de dureza. Pode usar como defesa (teste LM). Soco de Pedra: sustenta Energizar como ação livre — socos causam 4 de dano letal.\n• Evolução Pele de Pedra Nv9: dureza sustentada = 2. Bloqueio não funciona contra Soco de Pedra."
      },
    ],
  },
  {
    id: "fuuton", nome: "Fuuton", cor: "#27ae60",
    desc: "Elemento Vento. Alcance Médio (10m +2m/ESP). +2 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Barreira, Coluna, Flechas, Sopro Destrutivo, Raio, Nuvem, Energizar, Míssil, Onda Explosiva, Ricochete, Correnteza. Exclusivos: Venenoso (nível 5), Afiar (nível 6), Lâmina de Vento (nível 7).",
    niveis: [
      { n: 1, info: "Tier 1 — +1 dano de Fuuton", detalhe: "Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n: 2, info: "Tier 2 — +1 dano de Fuuton", detalhe: "Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n: 3, info: "Tier 3 — +1 dano de Fuuton", detalhe: "Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      { n: 4, info: "Tier 4 — +1 dano de Fuuton", detalhe: "Cada nível de Fuuton aumenta o dano base dos seus ataques em +1." },
      {
        n: 5, info: "Tier 5 — desbloqueia Venenoso",
        detalhe: "• Venenoso (Padrão, cone, Instantânea): cria névoa ou fumaça venenosa com veneno fabricado (Venefício, até nível II). Não causa dano direto — injeta o veneno no alvo. O veneno é consumido."
      },
      {
        n: 6, info: "Tier 6 — desbloqueia Afiar",
        detalhe: "• Afiar (Req. Energizar, Parcial, Sustentada, Pessoal): torna arma cortante ou perfurante real mais eficaz. Não funciona em armas naturais ou criadas por Criar Arma.\n  – Fio melhorado: ignora 1 ponto de dureza. Arma comum que bloqueie ou seja bloqueada é destruída (exceto se energizada — vira Sucesso Automático).\n  – Crítico melhorado: margem de crítico +1.\n  – Lâmina Estendida: lâmina de chakra até 30cm maior. Teste resistido ESP vs Prontidão — se ganhar: alvo sofre −1 nas defesas.\n  – Shuriken Estendida: igual à Lâmina Estendida, para até 3 shurikens; dano base das 3 = dano comum do poder."
      },
      {
        n: 7, info: "Tier 7 — desbloqueia Lâmina de Vento",
        detalhe: "• Lâmina de Vento (Req. Energizar, Completa, alcance 5m, Instantânea): cria e arremessa lâminas de vento quase invisíveis. 1 lâmina por nível usado, cada uma causa 1 de dano base (+2 do elemento = 3 total). Não recebe outros bônus de dano.\n  – Alvo testa Prontidão antes da defesa: se falhar, é considerado fintado. Visão de chakra/Kagura Shingan = sucesso automático. Outros sensores de chakra: Dif −2.\n  – Evolução Nv10: alvo que falha em Prontidão fica desprevenido."
      },
    ],
  },
  {
    id: "katon", nome: "Katon", cor: "#e05050",
    desc: "Elemento Fogo. Alcance Médio (10m +2m/ESP). Tamanho: 2m por nível de ESP. +2 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Flechas, Coluna, Sopro Destrutivo, Raio, Energizar, Míssil, Onda Explosiva, Ricochete. Exclusivos: Inflamável (nível 5), Meteoros (nível 9).",
    niveis: [
      { n: 1, info: "Tier 1 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n: 2, info: "Tier 2 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n: 3, info: "Tier 3 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n: 4, info: "Tier 4 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      {
        n: 5, info: "Tier 5 — desbloqueia Inflamável",
        detalhe: "• Inflamável (Movimento, círculo diâmetro comum, custo 3 + chakra da combustão): cria líquido/névoa/gás inflamável. Não causa dano sozinho. Com ação padrão, usa Canhão Katon ou Raiton para gerar combustão: explosão com dano do Canhão +2. Não permite meta-aptidões.\n• Evolução Nv8: pode usar qualquer efeito Katon ou Raiton de duração instantânea e alcance comum para criar a combustão, mantendo suas propriedades."
      },
      { n: 6, info: "Tier 6 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n: 7, info: "Tier 7 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      { n: 8, info: "Tier 8 — +1 dano de Katon", detalhe: "Cada nível de Katon aumenta o dano base dos seus ataques em +1." },
      {
        n: 9, info: "Tier 9 — desbloqueia Meteoros",
        detalhe: "• Meteoros (Completa, 6 esferas de 5m de diâmetro): cada meteoro causa 1 de dano fixo por nível usado (sem dano base nem bônus). Criatura atingida por mais de um recebe o dano de todos.\n  – Mirar em criaturas específicas: −3 precisão; alvo não pode usar Esquiva ou Antecipar."
      },
    ],
  },
  {
    id: "raiton", nome: "Raiton", cor: "#f1c40f",
    desc: "Elemento Trovão. Alcance Longo (15m +3m/ESP). Tamanho: 0,5m por nível de ESP. +1 de dano base em todos os efeitos. Efeitos permitidos: Canhão, Orbe, Coluna, Flechas, Sopro Destrutivo, Raio, Energizar, Míssil, Onda Explosiva, Ricochete, Meteoros. Exclusivos: Lâmina de Raios (nível 2), Arma Elétrica (nível 4), Descarga (nível 6).",
    niveis: [
      { n: 1, info: "Tier 1 — +1 dano de Raiton", detalhe: "Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      {
        n: 2, info: "Tier 2 — desbloqueia Lâmina de Raios",
        detalhe: "• Lâmina de Raios (Req. ESP 8, Movimento, Sustentada 1 ataque, toque): concentra chakra elétrico na mão (chiado de pássaros). Ataque CC, dano comum do poder, ignora 1 dureza. Destrói arma que bloqueie (exceto Fuuton/Raiton Energizados).\n  – Ataque surpresa em desprevenido: mínimo grau 2. Alvo testa Prontidão para notar o ruído.\n  – Abater capanga: mantém por +1 ataque.\n  – Evolução Nv5: preparar vira Ação Parcial. Pode usar Investida (+2 dano, +1/nível seguinte), mas abre guarda para ataque oportuno se alvo se defender.\n  – Evolução Nv7: ignora qualquer dureza (exceto Fuuton = integral; Raiton = metade).\n  – Evolução Nv9: ganha Crítico Aprimorado para este efeito (cumulativo com Domínio do Raio)."
      },
      { n: 3, info: "Tier 3 — +1 dano de Raiton", detalhe: "Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      {
        n: 4, info: "Tier 4 — desbloqueia Arma Elétrica",
        detalhe: "• Arma Elétrica (Req. Lâmina de Raios, Parcial, Sustentada, sem selos):\n  – Energizar [custo 3]: usa efeito Energizar em armas de corte e perfuração.\n  – Criar Projéteis [custo 1]: cria armas de arremesso de eletricidade. Duram até início do próximo turno.\n  – Criar Lâmina [custo 4]: lâmina de espada curta na mão, dano = Energizar, ignora 1 dureza. Pode estender até 5m (ação padrão, CC ou CD); volta ao normal após o ataque.\n  – Evolução Nv8: arma comum que bloqueie seu ataque é destruída (exceto Energizado, exceto Doton — vira Sucesso Automático)."
      },
      { n: 5, info: "Tier 5 — +1 dano de Raiton", detalhe: "Cada nível de Raiton aumenta o dano base dos seus ataques em +1." },
      {
        n: 6, info: "Tier 6 — desbloqueia Descarga",
        detalhe: "• Descarga (Padrão, meia-esfera ou círculo, ou toque/projétil): dano = metade do dano comum do poder. Se causar qualquer dano: alvo testa Vigor (Dif padrão −3) ou fica atordoado até fim do próximo turno.\n  – Concentrada em projétil ou descarga corporal via Energizar/Arma Elétrica: Dif do Vigor +1. Feita via Energizar: sem selos de mão."
      },
    ],
  },
  {
    id: "suiton", nome: "Suiton", cor: "#1abc9c",
    desc: "Elemento Água. Alcance Médio (10m +2m/ESP). Tamanho: 1m por nível de ESP. Sem dano adicional. Efeitos: todos os do Ninpou + Inflamável, Venenoso, Imergir. Exclusivos: Névoa (nível 2), Prisão de Água (nível 3), Colisão de Ondas (nível 6).",
    niveis: [
      { n: 1, info: "Tier 1 — +1 dano de Suiton", detalhe: "Cada nível de Suiton aumenta o dano base dos seus ataques em +1." },
      {
        n: 2, info: "Tier 2 — desbloqueia Névoa",
        detalhe: "• Névoa (Req. Lutar às Cegas ou sensor, Padrão, Sustentada, círculo 30m+3m/ESP): visão perfeita apenas até 1m. Criaturas além: camuflagem parcial (25% falha). Dureza imaginária padrão do poder (Katon/Fuuton dissipam).\n  – Evolução Nv5: criaturas até 1m têm camuflagem parcial; além disso = camuflagem total (50% falha, não pode usar visão para localizar)."
      },
      {
        n: 3, info: "Tier 3 — desbloqueia Prisão de Água",
        detalhe: "• Prisão de Água (Padrão, alcance 1m, Concentração): redoma de água prende o alvo (CD a 1m, −3 precisão). Alvo paralisado mas pode respirar. Dureza = metade do dano comum. Restaura dureza com nova ação/chakra sem novo teste.\n  – Alvo pode usar ação padrão para testar Força (Dif padrão) ou Vigor (Dif padrão −2) e ganhar mobilidade pelo restante da cena.\n  – Golpe de misericórdia: prisão absorve e se desfaz; dano remanescente que superar a dureza ainda é sofrido (Sucesso Automático, rola 2 dados de grau).\n  – Pode prender múltiplos alvos via clones de água (Mizu Bunshin). Sem meta-aptidões.\n  – Evolução Nv9: prisão preenchida com água — alvo sofre sufocamento (Dif padrão −2). Via Mizu Bunshin: duração sustentada."
      },
      { n: 4, info: "Tier 4 — +1 dano de Suiton", detalhe: "Cada nível de Suiton aumenta o dano base dos seus ataques em +1." },
      {
        n: 5, info: "Tier 5 — +1 dano de Suiton; Braço de Água [Hōzuki]",
        detalhe: "Cada nível de Suiton aumenta o dano base dos seus ataques em +1.\n\n*Efeito Exclusivo — Braço de Água (Nv5) [requer Suika]:*\n*Ação:* Parcial  *Alcance:* Pessoal  *Duração:* Contínua  *Custo:* 1\n\nFaz um braço ficar maior e mais forte. Enquanto ativo:\n• Usa *Espírito no lugar de Força* para testes, dificuldades e cálculo de dano de ataques corporais.\n• Pode usar ESP para cumprir pré-requisitos de FOR em aptidões, poderes e armas.\n• Pode usar a aptidão *Acuidade para qualquer arma pesada*, inclusive especiais.\n• Pode ser combinado com aptidões de manobra."
      },
      {
        n: 6, info: "Tier 6 — desbloqueia Colisão de Ondas; Afogar [Hōzuki]",
        detalhe: "• Colisão de Ondas (Padrão, onda tamanho comum, Concentração): 10 de dano base. Construções sofrem dano dobrado. Pode manter por concentração (metade chakra/turno): falhar na defesa = capturado pelas ondas. Capturado: ação de movimento + teste Atletismo para voltar à superfície, ou sofre sufocamento (dano fixo = dano base). Ação padrão: sobe sem teste.\n  – Pode continuar atacando novos alvos enquanto concentrado (novo teste de acerto). Alvos submersos não são afetados.\n  – Evolução Nv8: Dano Base 14.\n  – Evolução Nv10: Dano Base 18; vítima não pode mais usar ação padrão para nadar sem testes.\n\n*Efeito Exclusivo — Afogar (Nv6) [requer Suika]:*\n*Ação:* Movimento (em alvo agarrado)  *Alcance:* Toque  *Duração:* Contínua\n\nLiquefaz parte do corpo e envolve a cabeça do alvo com água, criando uma bolha separada. O alvo sofre *sufocamento* com dano fixo igual ao dano base comum do poder.\n\nA bolha possui *absorção 1*, dureza comum do poder e as mesmas vantagens/desvantagens da aptidão Suika (Imunidade Fluida). Para se libertar, a vítima precisa causar qualquer dano à bolha.\n\nAlternativa: como ação preparada após bloqueio desarmado bem-sucedido — ao entrar em contato com o alvo, separa a parte do corpo criando a bolha."
      },
      {
        n: 7, info: "Tier 7 — Monstro de Água [Hōzuki]",
        detalhe: "Cada nível de Suiton aumenta o dano base dos seus ataques em +1.\n\n*Efeito Exclusivo — Monstro de Água (Nv7) [requer Suika; Braço de Água]:*\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Sustentada\n\nFunde-se com uma grande quantidade de água existente para se transformar em um monstro esférico gigante. Categoria de tamanho alterada para *Enorme*. Todos os ataques corporais recebem os benefícios do efeito *Braço de Água* com *+3 de bônus em Espírito* na substituição dos testes de Força e cálculo de dano."
      },
      {
        n: 8, info: "Tier 8 — Colisão de Ondas evolução; Clone de Óleo [Hōzuki]",
        detalhe: "• Colisão de Ondas evolui: Dano Base aumenta para 14.\n\n*Efeito Exclusivo — Clone de Óleo (Nv8) [requer Suika; Clone (Mizu Bunshin)]:*\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Concentração\n\nCria um clone chibi feito de água e óleo. Camada externa de óleo, interior cheio de água.\n\n*Crescimento:* Desde que se deslocou na rodada, no início do turno seguinte o clone aumenta 1 categoria de tamanho.\n\n*Explosão:* Ao atingir tamanho Imenso, explode em esfera de vapor de tamanho comum do poder — dano *comum +2*. O usuário não sofre dano (Suika).\n\n*Resfriamento:* Após a explosão, granizo resfria o clone, voltando ao tamanho original e reiniciando o ciclo.\n\nO clone é *acelerado*, ataca com machado grande (*dano de arma +5*). Com Braço de Água ou Energizar: usa ESP no dano. Vitalidade = *3× Espírito*. Imune a ataques comuns sem chakra/Hijutsu. Não é afetado pela diminuição de dano de Comandar Parceiro."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — YUKI ──────────────────────────────────────────────────
  {
    id: "hyouton", nome: "Hyouton", cor: "#93c5fd",
    req: [],
    cla: "yuki",
    niveis: [
      {
        n: 1, info: "Nível 1 — Hyouton (Elemento Gelo)",
        detalhe: "*Ninjutsu* / Kekkei Genkai\n\nLinhagem sanguínea avançada formada pelo uso simultâneo de Vento e Água para criar gelo. Quando o usuário libera chakra, o ambiente ao redor esfria a ponto de nevar, e o gelo produzido resiste minimamente a ataques de fogo.\n\n*Alcance:* Médio (10m + 2m por nível de Espírito).\n*Tamanho:* Até 1m por nível de Espírito.\n*Dureza Adicional:* Toda criação Hyouton possui *+2 de dureza*.\n*Dificuldade de Resistência:* Todo efeito Hyouton recebe *+1 na dificuldade* dos testes dos alvos.\n\n*Efeitos Permitidos:* Todos os efeitos de Ninpou + *Imergir* (Doton).\n\n*Duração Permanente Especial:* Efeitos e criações com duração permanente derretem em *1h por nível usado*.\n\n*Fuuton e Suiton Gratuitos:* Recebe gratuitamente *1 nível em Fuuton e Suiton*, podendo usar o Efeito Canhão para ambos usando o nível de Hyouton como parâmetro. Mais níveis devem ser evoluídos separadamente.\n\n*Restrição:* Não pode aprender outros elementos além de Hyouton, Suiton e Fuuton."
      },
      { n: 2, info: "Nível 2", detalhe: "*Nível 2 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      { n: 3, info: "Nível 3", detalhe: "*Nível 3 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      { n: 4, info: "Nível 4", detalhe: "*Nível 4 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      { n: 5, info: "Nível 5", detalhe: "*Nível 5 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 6, info: "Nível 6 — Espelhos Demoníacos",
        detalhe: "*Efeito Exclusivo — Espelhos Demoníacos (Nv6):*\n*Pré-req:* Ataque em Movimento; Imergir  *Ação:* Padrão  *Área:* meia-esfera, diâmetro 1m/nível  *Duração:* Contínua  *Custo:* 3 chakra/turno\n\nCria 21 espelhos de gelo (5cm de espessura) formando uma cúpula ao redor do usuário.\n\n*Ativar:* Teste de CD contra Evadir dos inimigos — se não houver como fugir, Sucesso Automático.\n\n*Movimento:* Entrar em espelho próximo: ação livre. Mover-se entre espelhos: ação de movimento.\n\n*Proteção:* Dentro dos espelhos: dureza zero, absorção *8 por nível usado*. Dano excedente ao zerar a absorção é sofrido pelo usuário.\n\n*Reflexos:* Todos os espelhos refletem a imagem do usuário, tornando-o indetectável a olho nu. Ataques em projétil ou área que não atinjam todos os espelhos: role 1 dado — resultado 4 ou menos significa que o ataque atingiu um reflexo (dano no espelho, sem dano excedente ao usuário). *Kagura Shingan* e *Visão Através do Chakra* ignoram essa regra.\n\n*Atacando:* Deve sair do espelho para atacar. Ao se mover entre espelhos é considerado *acelerado* e pode usar finta acelerada com armas, projéteis e efeito Canhão.\n\n*Defendendo:* Pode usar Esquiva ou Antecipar para ir ao espelho mais próximo, ou Evadir para qualquer espelho.\n\n*Reconstruir:* Ação de movimento para renovar absorção de todos os espelhos danificados ou recriar qualquer espelho destruído.\n\n*Espelho Único:* Enquanto ativo, pode criar um único espelho em qualquer ponto dentro do alcance como ação livre.\n\n*(Evolução Nv8:* Espelhos ganham dureza 2; mover-se entre espelhos vira ação parcial; finta acelerada para Flechas; Flechas em ataques oportunos; custo aumenta para 4/turno.)"
      },
      { n: 7, info: "Nível 7", detalhe: "*Nível 7 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      { n: 8, info: "Nível 8 — Espelhos Demoníacos evoluídos", detalhe: "*Nível 8 — Evolução dos Espelhos Demoníacos:*\n• Espelhos passam a ter *dureza 2*.\n• Mover-se entre espelhos: *ação parcial* (em vez de ação de movimento).\n• Pode usar finta acelerada para atacar com o efeito *Flechas*.\n• Pode usar Flechas nos *ataques oportunos*.\n• Custo aumenta para *4 chakra por turno*." },
    ],
  },
  // ── RESTRITOS DE CLÃ — MIKOTO ────────────────────────────────────────────────
  {
    id: "choujuu_giga", nome: "Choujuu Giga", cor: "#f97316",
    req: [{ apt: "r_rascunho_feras" }],
    cla: "mikoto",
    niveis: [
      {
        n: 1, info: "Nível 1 — Choujuu Giga (Arte Ninja de Tinta)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Pré-requisito:* Arte 4; Prestidigitação 4.\n\nO usuário desenha rapidamente criaturas em um pergaminho, colocando seus sentimentos no papel e dando 'vida' aos desenhos.\n\n*Perícia Chave: Arte* — alcance, dano e dificuldade de resistência são calculados com base na perícia Arte em vez de Espírito.\n\n*Alcance:* Médio (10m + 2m por nível de Arte).\n*Tamanho:* Até 1m por nível de Arte.\n*Dificuldade de Resistência:* +1 nos testes dos alvos.\n*Interação Elemental:* Desvantagem contra Suiton; sem vantagem sobre nenhum elemento.\n\n*Tinta Frágil:* Efeitos que causem dano sem área (exceto Raio) podem ser bloqueados por quem tiver Punho de Ferro ou arma com mínimo +1 de dano.\n\n*Efeitos Permitidos:* Canhão, Orbe, Restringente, Raio, Ricochete, Barreira, Coluna, Nuvem, Sopro Destrutivo, Míssil, Algemar."
      },
      { n: 2, info: "Nível 2", detalhe: "*Nível 2 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 3, info: "Nível 3 — Investida das Feras",
        detalhe: "*Efeito Exclusivo — Investida das Feras (Nv3) [requer Criaturas Vivas]:*\n*Ação:* Padrão  *Alcance:* Comum do poder  *Alvo:* Uma ou mais criaturas  *Dano:* 2 por projétil  *Duração:* Instantânea\n\nDesenha várias feras que perseguem o inimigo até acertá-lo com toda a força. Segue as regras do efeito *Flechas nível 6 de Ninpou* com as seguintes diferenças:\n\n*Dano Aumentado:* +2 de dano (ao dividir alvos: +1 por flecha escolhida).\n\n*Perseguir Alvo:* Ignora qualquer tipo de *Cobertura Parcial* (pedras, árvores, etc.).\n\n*(Evolução Nv5:* Passa a seguir as regras de Flechas nível 9 e ignora *Cobertura Total*.)"
      },
      {
        n: 4, info: "Nível 4 — Pergaminho das Bestas",
        detalhe: "*Efeito Exclusivo — Pergaminho das Bestas (Nv4) [requer Criaturas Vivas]:*\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Contínua\n\nCria criaturas mais duradouras e consistentes controladas em combate.\n\n*Quantidade:* Até 2 criaturas (custo comum) ou até 8 capangas (mesmo custo; falham em HCs; absorção = Arte do usuário).\n*Habilidade Limitada:* Apenas 1× por cena.\n\n*Ficha das Criaturas:*\n• *Atributos primários:* 2× nível de poder usado\n• *Atributos secundários:* 1× nível de poder; demais = zero\n• *Perícias:* escolha 2 = 2× nível; demais = zero\n• *Absorção:* Pequenas = 10 + Arte; Médias/Grandes = 10 + 2× Arte\n• *Dano crítico:* desfaz a criatura instantaneamente\n• *Aptidões:* até 3 da lista disponível\n• *Tamanho:* Pequeno (−2 chakra), Médio ou Grande\n\n*Tipos de Criaturas:*\n• *Animais Pequenos* — primário: DES; secundários: FOR/AGI; perícias: Escapar, Furtividade, Prestidigitação, Voo; dano +1\n• *Predadores Terrestres* — primários: FOR/AGI; secundário: DES; dano +3\n• *Grandes Bestas Aladas* [req Nv6] — primários: DES/AGI; secundário: FOR; dano +2; acesso gratuito à perícia Voo\n\n*(Evolução Nv6:* até 5 aptidões; acesso a Grandes Bestas Aladas; 2× por cena.)"
      },
      { n: 5, info: "Nível 5", detalhe: "*Nível 5 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo. Investida das Feras evolui para Flechas Nv9 e ignora Cobertura Total." },
      { n: 6, info: "Nível 6 — Pergaminho das Bestas evolui + Grandes Bestas Aladas", detalhe: "*Nível 6 — Evolução do Pergaminho das Bestas:*\n• Criaturas podem escolher até *5 aptidões*.\n• Desbloqueias as *Grandes Bestas Aladas* (montarias voadoras Médias ou Grandes).\n• Pode usar o efeito *2× por cena*." },
      { n: 7, info: "Nível 7", detalhe: "*Nível 7 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 8, info: "Nível 8 — Gigantes de Tinta",
        detalhe: "*Efeito Exclusivo — Gigantes de Tinta (Nv8) [requer Criaturas Vivas; ESP/Arte 16; Prestidigitação 16]:*\n*Ação:* Completa  *Alcance:* Pessoal  *Duração:* Concentração  *Custo:* 4 + nível de poder usado\n\nCria até 2 gigantes humanoides de tinta (monges, samurais, deuses — aparência livre). Controlar exige concentração (ação padrão). Sem comandar por 2 turnos: técnica desfeita. Incompatível com Pergaminho das Bestas ativo.\n*Habilidade Limitada:* 1× por cena.\n\n*Ficha dos Gigantes:*\n• Primários: FOR, AGI; Secundário: DES\n• Perícias: Atletismo, Prontidão\n• Dano: *+5 de arma*\n• Aptidões: Ataque em Movimento, Especialista, Lutador, Ponto Cego, Reflexos, Arremessar, Ataque Giratório, Ataque Poderoso, Derrubar Agressivo, Golpe Caratê, Resistência Maior (Força), Perito: Atletismo\n\n*(Evolução Nv10:* Imenso; dano +7; absorção 5× Arte; pode erguer 16 toneladas; 3× por cena.)"
      },
      {
        n: 9, info: "Nível 9 — Técnica de Selamento da Fera de Tinta",
        detalhe: "*Efeito Exclusivo — Técnica de Selamento da Fera de Tinta (Nv9) [requer Criaturas Vivas; Fuuinjutsu 8; Arte 18]:*\n*Ação:* Completa (2 turnos)  *Alcance:* Metade do alcance comum  *Alvo:* Único (Indefeso)  *Custo:* 10\n\nDesenha um tigre complexo no *Pergaminho de Jutsu Especial* que captura e sela o alvo indefeso.\n\n*Turno 1 (concentração):* Ação completa desenhando o tigre. Se concentração for quebrada, o jutsu é cancelado.\n\n*Turno 2:* Ação padrão para mandar o tigre ao alvo indefeso — morde e começa a sugá-lo ao pergaminho.\n\n*Turno 3:* Ação completa para puxar o alvo. O alvo faz teste de *Força (Dif comum do poder)* — se bem-sucedido, não é puxado naquele turno. Se sair da condição indefeso, o jutsu é cancelado automaticamente."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — SHIMURA ───────────────────────────────────────────────
  {
    id: "choujuu_giga", nome: "Choujuu Giga", cor: "#6366f1",
    req: [{ per: "arte", val: 4 }, { per: "prestidigitacao", val: 4 }],
    cla: "shimura",
    niveis: [
      {
        n: 1, info: "Nível 1 — Choujuu Giga (Arte Ninja de Tinta)",
        detalhe: "*Ninjutsu* / Hijutsu\n\nO usuário desenha rapidamente criaturas em um pergaminho durante o combate, dando 'vida' às figuras. Versão do poder Ninpou com parâmetros modificados.\n\n*Pré-requisitos:* Arte 4; Prestidigitação 4.\n\n*Perícia Chave:* *Arte* — alcance, dano e dificuldade são calculados com base em Arte, no lugar de Espírito.\n\n*Alcance:* Médio (10m + 2m por nível de Arte).\n*Tamanho:* Até 1m por nível de Arte.\n*Dificuldade de Resistência:* +1 na dificuldade dos testes dos alvos.\n*Interação Elemental:* Desvantagem contra Suiton; sem vantagem sobre nenhum elemento.\n\n*Tinta Frágil:* Efeitos de dano sem área (exceto Raio) podem ser bloqueados por Punho de Ferro ou arma com mínimo +1 de dano.\n\n*Efeitos Permitidos:* Canhão, Orbe, Restringente, Raio, Ricochete, Barreira, Coluna, Nuvem, Sopro Destrutivo, Míssil, Algemar."
      },
      { n: 2, info: "Nível 2", detalhe: "*Nível 2 — Sem efeito exclusivo.* O poder e seus parâmetros continuam crescendo com o nível de Arte." },
      {
        n: 3, info: "Nível 3 — Investida das Feras",
        detalhe: "*Efeito Exclusivo — Investida das Feras (Nv3) [requer Criaturas Vivas]:*\n*Ninjutsu* Rank B / Hijutsu\n*Ação:* Padrão  *Alcance:* Comum do poder  *Alvo:* Uma ou mais criaturas  *Dano:* 2 por projétil  *Duração:* Instantânea\n\nVárias feras desenhadas perseguem o inimigo. Segue as regras do efeito *Flechas Nv6* do Ninpou, com as seguintes diferenças:\n\n*Dano Aumentado:* +2 de dano (se dividir alvos, 2 flechas por alvo ganham +1 cada).\n\n*Perseguir Alvo:* As flechas ignoram qualquer tipo de *Cobertura Parcial* (pedras, árvores).\n\n*(Evolução Nv5:* Segue as regras de Flechas Nv9; ignora *Cobertura Total*.)"
      },
      {
        n: 4, info: "Nível 4 — Pergaminho das Bestas",
        detalhe: "*Efeito Exclusivo — Pergaminho das Bestas (Nv4) [requer Criaturas Vivas]:*\n*Ninjutsu* Rank B / Hijutsu\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Contínua  *Custo:* Ver texto\n*Habilidade Limitada:* 1× por cena.\n\nCria criaturas de tinta duradouras para combate.\n\n*Quantidade:* Até 2 criaturas (custo comum); até 8 criaturas como capangas (absorção = Arte).\n\n*Fichas das Criaturas:*\n• Atributos primários = 2× nível de poder; secundários = nível de poder; demais = zero.\n• Até 2 perícias: valor = 2× nível de poder.\n• Até 3 aptidões da lista disponível.\n• Absorção: Pequenas = 10 + Arte; Médias e Grandes = 10 + 2× Arte. Acerto Crítico desfaz a criatura.\n• Tamanhos: Pequeno (−2 chakra), Médio (pode carregar 1 pessoa), Grande (até 2 pessoas).\n\n*Tipos disponíveis:*\n• *Animais Pequenos:* DES primário; FOR/AGI secundários; dano +1\n• *Predadores Terrestres:* FOR/AGI primários; DES secundário; dano +3\n• *Grandes Bestas Aladas [requer Nv6]:* DES/AGI primários; FOR secundário; dano +2; perícia Vôo gratuita\n\n*(Evolução Nv6:* até 5 aptidões; Grandes Bestas Aladas disponíveis; 2× por cena.)"
      },
      {
        n: 5, info: "Nível 5 — Investida das Feras evolução",
        detalhe: "*Nível 5 — Evolução da Investida das Feras:*\nO efeito passa a seguir as regras de *Flechas Nv9* e ignora *Cobertura Total*."
      },
      {
        n: 6, info: "Nível 6 — Pergaminho das Bestas evolução",
        detalhe: "*Nível 6 — Evolução do Pergaminho das Bestas:*\n• Criaturas podem escolher até *5 aptidões* da lista.\n• Desbloqueia as *Grandes Bestas Aladas* (criaturas voadoras; geralmente usadas como montarias).\n• Pode usar o efeito *duas vezes por cena*."
      },
      { n: 7, info: "Nível 7", detalhe: "*Nível 7 — Sem efeito exclusivo.* O poder e seus parâmetros continuam crescendo." },
      {
        n: 8, info: "Nível 8 — Gigantes de Tinta",
        detalhe: "*Efeito Exclusivo — Gigantes de Tinta (Nv8) [requer Criaturas Vivas; ESP/Arte 16; Prestidigitação 16]:*\n*Ninjutsu* Rank S / Hijutsu\n*Ação:* Completa  *Alcance:* Pessoal  *Duração:* Concentração  *Custo:* 4 + nível de poder\n*Habilidade Limitada:* 1× por cena.\n\nCria 2 gigantes humanoides de tinta (monges, samurais, deuses — aparência livre). Controlar exige concentração (ação padrão). Sem concentração por 2 turnos: técnica desfeita. Ativo: não pode usar Pergaminho das Bestas simultaneamente.\n\n*Fichas dos Gigantes:*\n• Atributos primários: FOR/AGI = 2× nível de poder; Secundário: DES = nível de poder.\n• Perícias: Atletismo, Prontidão.\n• Dano: *+5 de arma*.\n• Aptidões: Ataque em Movimento, Especialista, Lutador, Ponto Cego, Reflexos, Arremessar, Ataque Giratório, Ataque Poderoso, Derrubar Agressivo, Golpe Caratê, Resistência Maior (Força), Perito: Atletismo.\n\n*(Evolução Nv10:* dano +7; absorção = 5× Arte; tamanho Imenso; pode usar 3× por cena. Para erguer peso: máx Imenso = 16 toneladas; empurrar dobro.)"
      },
      {
        n: 9, info: "Nível 9 — Técnica de Selamento da Fera de Tinta",
        detalhe: "*Efeito Exclusivo — Técnica de Selamento da Fera de Tinta (Nv9) [requer Criaturas Vivas; Fuuinjutsu 8; Arte 18]:*\n*Ninjutsu* Rank S / Hijutsu\n*Ação:* Completa (ver texto)  *Alcance:* Metade do alcance comum  *Alvo:* Único (Indefeso)  *Custo:* 10 chakra\n\nRequer Pergaminho de Jutsu Especial.\n\n*Turno 1:* Ação completa + concentração para desenhar o tigre.\n*Turno 2:* Ação padrão para enviar o tigre ao alvo indefeso.\n*Turno 3:* Ação completa para puxá-lo ao pergaminho. O alvo testa *Força (Dif padrão)* — se bem-sucedido, não é puxado naquele turno. Se sair da condição indefeso, o jutsu é cancelado."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — SHIMURA ───────────────────────────────────────────────
  {
    id: "choujuu_giga", nome: "Choujuu Giga", cor: "#6366f1",
    req: [{ per: "arte", val: 4 }, { per: "prestidigitacao", val: 4 }],
    cla: "shimura",
    niveis: [
      {
        n: 1, info: "Nível 1 — Choujuu Giga (Arte Ninja de Tinta)",
        detalhe: "*Ninjutsu* / Hijutsu\n\nO usuário desenha criaturas em pergaminhos com chakra, dando-lhes vida em combate. Versão do poder Ninpou com lista reduzida de efeitos e parâmetros modificados.\n\n*Perícia Chave:* Arte. Alcance, dano e dificuldade dos testes de resistência são calculados pela perícia Arte, no lugar do Espírito.\n\n*Alcance:* Médio (10m + 2m por nível da perícia Arte).\n*Tamanho:* Até 1m por nível da perícia Arte.\n*Dificuldade de Resistência:* +1 na dificuldade dos testes dos alvos.\n\n*Interação Elemental:* Desvantagem contra Suiton; sem vantagem sobre nenhum elemento.\n\n*Tinta Frágil:* Efeitos que causem dano sem área podem ser bloqueados (exceto Raio) por quem tiver Punho de Ferro ou arma com mínimo +1 de dano.\n\n*Efeitos Permitidos:* Canhão, Orbe, Restringente, Raio, Ricochete, Barreira, Coluna, Nuvem, Sopro Destrutivo, Míssil, Algemar."
      },
      { n: 2, info: "Nível 2", detalhe: "*Nível 2 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 3, info: "Nível 3 — Investida das Feras",
        detalhe: "*Efeito Exclusivo — Investida das Feras (Nv3) [requer Criaturas Vivas]:*\n*Ninjutsu* Rank B / Hijutsu\n*Ação:* Padrão  *Alcance:* Comum do poder  *Alvo:* Uma ou mais criaturas  *Dano:* 2 por projétil  *Duração:* Instantânea\n\nDiversas feras desenhadas perseguem o inimigo. Segue as regras de *Flechas nível 6* do Ninpou com as seguintes diferenças:\n\n*Dano Aumentado:* +2 de dano (se dividir alvos, cada flecha recebe +1).\n*Perseguir Alvo:* Ignora qualquer tipo de *Cobertura Parcial*.\n\n*(Evolução Nv5:* segue regras de Flechas nível 9 e ignora *Cobertura Total*.)"
      },
      {
        n: 4, info: "Nível 4 — Pergaminho das Bestas",
        detalhe: "*Efeito Exclusivo — Pergaminho das Bestas (Nv4) [requer Criaturas Vivas]:*\n*Ninjutsu* Rank B / Hijutsu\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Contínua  *Custo:* Ver texto\n\nCria criaturas duradouras e consistentes para combate.\n\n*Quantidade:* Até 2 criaturas (até 8 como capangas com Invocação Numerosa).\n*Custo:* Custo comum do poder por criatura; dobro para duas.\n*Invocação Numerosa:* Até 8 criaturas, falham em HC, absorção = perícia Arte do usuário.\n\n*Ficha das Criaturas:*\n• Atributos primários = dobro do nível de poder; secundários = nível de poder; resto = zero\n• Até 2 perícias; até 3 aptidões (da lista disponível)\n• Absorção: Pequenas = 10 + Arte; Médias/Grandes = 10 + 2×Arte\n• Acerto Crítico desfaz a criatura imediatamente\n• Tamanhos: Pequeno (custo −2), Médio (carrega 1 pessoa), Grande (carrega 2)\n\n*Tipos de Criaturas:*\n→ *Animais Pequenos:* DES primário; FOR/AGI secundários. Dano +1.\n→ *Predadores Terrestres:* FOR/AGI primários; DES secundário. Dano +3.\n→ *Grandes Bestas Aladas* [req Choujuu Giga 6]: DES/AGI primários; FOR secundário. Dano +2. Perícia Voo gratuita.\n\nHabilidade Limitada: apenas 1 uso por cena.\n\n*(Evolução Nv6:* até 5 aptidões; acesso a Grandes Bestas Aladas; 2 usos por cena.)"
      },
      {
        n: 5, info: "Nível 5 — Investida das Feras evolução",
        detalhe: "*Nível 5 — Evolução da Investida das Feras:*\nO efeito passa a seguir as regras de *Flechas nível 9* e ignora *Cobertura Total*."
      },
      {
        n: 6, info: "Nível 6 — Pergaminho das Bestas evolução; Grandes Bestas Aladas",
        detalhe: "*Nível 6 — Evolução do Pergaminho das Bestas:*\n• Criaturas podem escolher até *5 aptidões* da lista disponível.\n• Acesso às *Grandes Bestas Aladas* (montarias voadoras).\n• Pode usar o efeito *2 vezes por cena*."
      },
      { n: 7, info: "Nível 7", detalhe: "*Nível 7 — Sem efeito exclusivo.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 8, info: "Nível 8 — Gigantes de Tinta",
        detalhe: "*Efeito Exclusivo — Gigantes de Tinta (Nv8) [requer Criaturas Vivas; ESP 16 ou Arte 16; Prestidigitação 16]:*\n*Ninjutsu* Rank S / Hijutsu\n*Ação:* Completa  *Alcance:* Pessoal  *Duração:* Concentração  *Custo:* 4 + nível de poder\n\nCria *2 gigantes humanoides de tinta* (aparência livre: monges, samurais, deuses etc.).\n\n*Quantidade:* Máx 2 (criar apenas 1 = metade do custo).\n*Controle:* Exige concentração (ação padrão). Sem concentração por 2 turnos = técnica desfeita. Incompatível com Pergaminho das Bestas ativo.\n\n*Ficha do Gigante:* FOR/AGI primários; DES secundário. Atletismo e Prontidão. Dano +5. Aptidões: Ataque em Movimento, Especialista, Lutador, Ponto Cego, Reflexos, Arremessar, Ataque Giratório, Ataque Poderoso, Derrubar Agressivo, Golpe Caratê.\n\nHabilidade Limitada: 1 uso por cena.\n\n*(Evolução Nv10:* Tamanho Imenso; dano +7; absorção = 5× Arte; pode erguer até 16t; 3 usos por cena.)"
      },
      {
        n: 9, info: "Nível 9 — Técnica de Selamento da Fera de Tinta",
        detalhe: "*Efeito Exclusivo — Técnica de Selamento da Fera de Tinta (Nv9) [requer Criaturas Vivas; Fuuinjutsu 8; Arte 18]:*\n*Ninjutsu* Rank S / Hijutsu\n*Ação:* Completa (ver texto)  *Alcance:* Metade do alcance comum  *Alvo:* Único (Indefeso)  *Custo:* 10\n\nDraw um tigre complexo no Pergaminho de Jutsu Especial para capturar e selar um alvo.\n\n*Iniciando:* 1 turno de concentração desenhando o tigre (concentração quebrada = jutsu cancelado).\n\n*Selamento:* Na rodada seguinte, ação padrão → tigre morde o alvo indefeso. No turno seguinte, ação completa para puxá-lo ao pergaminho. Alvo pode testar *Força (Dif comum do poder)* para resistir. Se o alvo sair da condição indefeso, o jutsu é cancelado."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — YAMANAKA ──────────────────────────────────────────────
  {
    id: "shindenshin", nome: "Shindenshin", cor: "#ec4899",
    req: [],
    cla: "yamanaka",
    niveis: [
      {
        n: 1, info: "Nível 1 — Shintenshin no Jutsu (Técnica da Troca de Mente)",
        detalhe: "*Ninjutsu* Rank C / Hijutsu\n*Ação:* Padrão  *Alcance:* Curto (5m + 1m/INT)  *Duração:* 1 dia por nível do poder  *Custo:* nível do poder\n\nO usuário transfere totalmente sua consciência para o corpo de um alvo, assumindo controle completo por um período de tempo. A vítima permanece consciente mas sem controle do corpo.\n\n*Alvo:* Deve estar impedido, agarrado, atordoado, indefeso ou surpreso. Usar em alvos fora dessas condições: o alvo pode fazer um teste de *Agilidade ou Prontidão (Dif padrão −3)* como reação — se bem-sucedido, o Shintenshin falha e o usuário fica *inconsciente* até o próximo turno.\n\n*Teste:* Sem teste de acerto. A vítima controla por 1 rodada. No 2º turno sob controle, faz teste de *Inteligência (Dif padrão)*. Se falhar, permanece sob controle pela duração. Animais e capangas não resistem.\n\n*Cancelamento:* Ao realizar ação contrária à natureza da vítima, ela ganha novo teste com *−2 de dificuldade*. Três testes bem-sucedidos (consecutivos ou não) cancelam a técnica. Também se cancela em tentativas suicidas.\n\n*Controle:* Todas as técnicas ativas são canceladas. O Yamanaka usa CC/CD/ESQ/LM, FOR/DES/VIG/ESP e PER do alvo; INT e suas perícias do próprio Yamanaka. Não pode usar outras técnicas deste poder durante o controle.\n\n*Corpo Inconsciente:* O corpo do usuário fica imóvel e indefeso. Dano sofrido durante o controle é refletido no corpo original sem redução de dureza. Se a Vit do corpo chegar a 0, a técnica é cancelada.\n\n*Distância:* Pode ficar até 100× o alcance da técnica distante do corpo.\n\n*Resistência:* Dif 9 + nível do poder + metade INT do usuário (arredondado para cima). Capangas falham automaticamente."
      },
      { n: 2, info: "Nível 2", detalhe: "*Nível 2 — Sem técnica nova.* Os parâmetros do Shintenshin crescem com o nível do poder (duração, alcance e dificuldade de resistência)." },
      {
        n: 3, info: "Nível 3 — Shindenshin no Jutsu (Técnica da Transmissão Mental)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão  *Alcance:* Médio (10m + 2m/INT)  *Duração:* Concentração (máx 1 cena)  *Custo:* nível do poder\n\nComunicação telepática com qualquer pessoa conhecida ou dentro do campo de visão e alcance.\n\n*Benefícios:* Conversar telepaticamente, ler ou transmitir memórias ao alvo.\n\n*Alvos simultâneos:* Quantidade igual ao nível do poder.\n\n*Resistência:* Alvo que não deseje receber faz teste de Inteligência para bloquear.\n\n*Rede de Comunicação:* Pode atuar como meio para que os alvos se comuniquem entre si através dele.\n\n*Nível 10:* Pode usar mecanismos que amplificam ondas mentais, aumentando em 100× alvos e alcance (com risco de dano mental ao usuário).\n\n*Sensor de Mentes:* Ação parcial, custo 2 chakra, duração sustentada. Alcance 10m + 2m/Rastrear. Detecta e diferencia todas as mentes dentro do alcance."
      },
      { n: 4, info: "Nível 4", detalhe: "*Nível 4 — Sem técnica nova.* Os parâmetros continuam crescendo." },
      {
        n: 5, info: "Nível 5 — Shinten Bunshin no Jutsu (Técnica da Múltipla Troca de Mente)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão  *Alcance:* 10m  *Alvo:* 2 corpos  *Duração:* 10min por nível  *Custo:* 4\n\nDuplica a consciência do usuário e a transfere para dois corpos ao mesmo tempo. Os alvos devem ser *corpos inanimados, cadáveres ou animais de tamanho Médio ou menos* (a consciência dividida não é forte o suficiente para subjugar uma mente humana viva).\n\nO corpo do usuário fica indefeso como no Shintenshin. Danos sofridos pelos corpos controlados ainda são refletidos no Yamanaka. Os corpos são considerados *parceiros*, porém somente um deles sofre a regra de diminuição de dano.\n\n*Controlando Cadáveres:* O Mestre pode exigir Medicina + Ninja Médico para tratar cadáveres, ou Mecanismos + Engenheiro para criar humanoides mecânicos."
      },
      {
        n: 6, info: "Nível 6 — Shinranshin no Jutsu (Técnica da Desordem Mental)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão  *Alcance:* Médio (10m + 2m/INT)  *Alvo:* 1 criatura  *Duração:* Concentração  *Custo:* nível do poder\n\nEnvia chakra ao sistema nervoso do alvo, assumindo controle completo do corpo sem transferir a própria consciência.\n\n*Uso:* Sem teste de acerto. A vítima faz teste imediato de *Inteligência (Dif padrão)*. Se falhar, seu corpo fica sob controle do usuário.\n\n*Consciência Intacta:* O Yamanaka não sai do próprio corpo — sem risco de dano durante o controle nem de ficar indefeso.\n\n*Controle:* Mantendo concentração, controla movimento, objetos e ataques básicos (Golpear, Disparar, Lançar Projétil) e reações básicas. As ações da vítima ocorrem no final do turno do Yamanaka. Todos os testes usam as precisões da vítima.\n\n*Número de Alvos:* Ao atingir nível 8, aumenta para *3 alvos simultâneos*. Controlar 2+ alvos reduz pela metade o dano causado por eles."
      },
      {
        n: 7, info: "Nível 7 — Shinten Kugutsu Juin no Jutsu (Técnica da Troca Mental da Marionete Amaldiçoada)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Completa (preparação)  *Alcance:* Médio (10m + 2m/INT)  *Duração:* Concentração  *Custo:* nível do poder (pago na preparação)\n\nTransfere a mente do Yamanaka para o corpo inimigo enquanto aprisiona a mente do inimigo em um boneco.\n\n*Preparação:* Requer um boneco de palha e tecido com armas nos membros (normalmente selado em pergaminho via Fuuinjutsu). Um selo especial é colado na testa do usuário e o boneco é posicionado na rota provável do inimigo.\n\n*Monitoramento:* Usa o Sensor de Mentes para rastrear o alvo. Quando próximo o suficiente, transfere a mente ao boneco com ação parcial e o controla para atacar.\n\n*Troca de Mente:* Ao causar ou sofrer qualquer dano no boneco contra o inimigo, o selo é ativado — a mente do inimigo vai ao boneco (sem resistência) e a mente do Yamanaka assume o corpo da vítima.\n\n*Controle:* Segue as regras do Shintenshin, mas como a mente da vítima está presa no boneco, o usuário *não pode ser expulso* e as regras de cancelamento forçado não se aplicam.\n\n*Parâmetros do Boneco:* Precisões de combate do Yamanaka −3. Força e Destreza = 0. Tamanho Pequeno, dureza zero, absorção 35. Se absorção for zerada por Katon/Raiton em um único ataque, a técnica falha. Danos no boneco não são refletidos no Yamanaka."
      },
      { n: 8, info: "Nível 8", detalhe: "*Nível 8 — Sem técnica nova.* Ao atingir este nível, o Shinranshin no Jutsu (Nível 6) passa a poder controlar *3 alvos simultâneos*." },
    ],
  },
  // ── RESTRITOS DE CLÃ — SENJU ─────────────────────────────────────────────────
  {
    id: "mokuton", nome: "Mokuton", cor: "#16a34a",
    req: [],
    cla: "senju",
    desc: "Kekkei Genkai do clã Senju. Elemento Madeira — criado pela fusão simultânea de Terra e Água. Segue as regras do Ninpou com melhorias exclusivas.",
    niveis: [
      {
        n: 1, info: "Nível 1 — Mokuton (Elemento Madeira)",
        detalhe: "*Ninjutsu* / Kekkei Genkai\n\nLinhagem sanguínea avançada formada pelo uso simultâneo de Terra e Água para criar madeira ou árvores. O chakra do usuário é convertido em fonte de vida, podendo criar madeira de qualquer lugar — inclusive do próprio corpo.\n\n*Alcance:* Médio (10m + 2m por nível de Espírito).\n*Tamanho:* Até 1m de diâmetro/comprimento/largura/altura por nível de Espírito.\n*Dano Adicional:* Todo Efeito Mokuton recebe *+1 de dano base*.\n*Dificuldade de Resistência:* Todo efeito Mokuton recebe *+1 na dificuldade* dos testes dos alvos.\n\n*Efeitos Permitidos:* Todos os efeitos de Ninpou + *Imergir* (Doton).\n\n*Suiton e Doton Gratuitos:* Recebe gratuitamente *1 nível em Doton e Suiton*, podendo usar o Efeito Canhão para ambos usando o nível de Mokuton como parâmetro. Mais níveis devem ser evoluídos separadamente.\n\n*Restrição:* Não pode aprender outros elementos além de Mokuton, Suiton e Doton.\n\n*Técnicas exclusivas:* Aikagi (Nv1), Moku Bunshin (Nv1), Daijurin no Jutsu (Nv2), Mokujōheki (Nv3), Soushinki (Nv2)."
      },
      {
        n: 2, info: "Nível 2 — Transmissor; Daijurin no Jutsu",
        detalhe: "*Efeito Exclusivo — Transmissor (Nv2):*\n*Ação:* Parcial  *Alcance:* Toque  *Alvo:* um Moku Bunshin  *Duração:* Contínua\n\nO personagem desfaz seu clone em sementes para rastrear alvos. Implantada na roupa ou ingerida pelo alvo, a semente transmite sua localização exclusivamente ao usuário. Segue as regras da aptidão Sensor.\n\n――――――――\n\n*Daijurin no Jutsu (Grande Floresta):*\n*Pré-req:* Mokuton 2 (Raio)  *Ação:* Padrão  *Alcance:* Comum do poder\n\nConjura estacas de madeira (do braço, do chão ou de árvores próximas) em direção ao oponente. Causam dano segundo as regras do efeito Raio. As estacas seguem em linha reta — não contornam coberturas."
      },
      {
        n: 3, info: "Nível 3 — Mokujōheki (Parede de Madeira)",
        detalhe: "*Mokujōheki (Parede de Madeira):*\n*Pré-req:* Mokuton 3 (Barreira)  *Ação:* Movimento  *Alcance:* Pessoal  *Duração:* Instantânea\n\nConjura próximo de si uma barreira de madeira para se proteger de um ataque. Requer teste de Ler Movimento durante a ação defensiva.\n\nA barreira pode ter formato de muro ou semicírculo de *metade do tamanho comum do poder*, seguindo as regras do efeito Barreira do Ninpou. Se destruída, o usuário sofre os danos excedentes."
      },
      { n: 4, info: "Nível 4", detalhe: "*Nível 4 — Sem técnica nova.* O poder e seus efeitos continuam evoluindo (+1 dano base acumulado)." },
      { n: 5, info: "Nível 5", detalhe: "*Nível 5 — Sem técnica nova.* O poder e seus efeitos continuam evoluindo." },
      {
        n: 6, info: "Nível 6 — Selar Chakra; Shichūrō no Jutsu; Kageyose no Jutsu",
        detalhe: "*Efeito Exclusivo — Selar Chakra (Nv6):*\n*Pré-req:* Raio  *Ação:* Padrão  *Dano:* 2 por nível do poder  *Duração:* Instantânea ou Concentração\n\nAo usar o Raio, além do dano normal, o alvo perde chakra igual à *metade do nível usado do poder*.\n\n*Selar Chakra Bijuu:* Pode selar o chakra bijuu de um Jinchuuriki com nível de poder inferior ao do usuário que esteja no Modo Bijuu ou inferior. Deve ser usada como ação preparada. Dez pilares de madeira surgem ao redor do alvo. Teste de Espírito (Dif 7 + 2× nível do poder Jinchuuriki do alvo). Sucesso: todo chakra suprimido até o final da rodada. Falha: chakra suprimido mas deve pagar novamente o custo. O alvo fica inconsciente por 10 minutos.\n*(Evolução Nv9:* pode selar nível igual ou inferior; quebra técnicas de controle de Bijuu pelo toque.)\n\n――――――――\n\n*Shichūrō no Jutsu (Prisão de Quatro Pilares):*\n*Pré-req:* Mokuton 6 (Barreira Nv6)  *Ação:* Padrão  *Alcance:* Médio  *Duração:* Contínua\n\nPilastras de madeira crescem do solo e se conectam formando uma prisão, seguindo os parâmetros do efeito Barreira (largura, altura, comprimento e dureza)."
      },
      {
        n: 7, info: "Nível 7 — Golem; Mokujin no Jutsu",
        detalhe: "*Efeito Exclusivo — Golem (Nv7):*\n*Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Contínua\n\nCria um gigantesco monstro de madeira (qualquer aparência). Ficha: mesmos atributos do usuário, mas Força é substituída por Espírito. Tamanho *Imenso*, dureza zero, apenas *metade da Vitalidade*. Habilidades de Combate iguais às do usuário (incluindo Especialista, Maestria, Reflexos, Intuição, Acuidade). Perícias em nível zero. Ataque corporal: dano comum do poder.\n\nSegue regras de Parceiro (controlado diretamente, sem precisar de instruções). Não possui mente — imune a Genjutsus. Requer *concentração* para controlar (sem ela, fica imóvel como objeto inanimado). Somente 1 golem por cena.\n\nO golem pode utilizar qualquer técnica Mokuton usando suas próprias ações. Ação de movimento + metade custo de chakra: cura até *metade da Vitalidade total* do golem.\n*(Evolução Nv10:* tamanho Colossal; ataques corporais comuns recebem gratuitamente o efeito Selar Chakra.)\n\n――――――――\n\n*Mokujin no Jutsu (Golem de Madeira):*\n*Pré-req:* Mokuton 7 (Golem)  *Ação:* Padrão  *Alcance:* Pessoal  *Duração:* Contínua\n\nCria uma enorme criatura humanoide semelhante a uma estátua de madeira com rosto de demônio japonês e um dragão enrolado no tronco — poderoso avatar de batalha comparável a uma Bijuu ou ao Susanoo. Segue as regras do efeito Golem."
      },
      { n: 8, info: "Nível 8", detalhe: "*Nível 8 — Sem técnica nova.* O poder e seus efeitos continuam evoluindo." },
    ],
  },
  {
    id: "baika_ninpou", nome: "Baika Ninpou", cor: "#f39c12",
    req: [{ atr: "VIG", val: 6 }, { apt: "r_corpulencia" }],
    cla: "akimichi",
    niveis: [
      {
        n: 1, info: "Tier 1 — Baika no Jutsu (Técnica de Expansão)",
        detalhe: "• Baika no Jutsu (Movimento, Pessoal, Contínua, custo 1 chakra): o personagem aumenta um pouco o tamanho, ficando roliço. Usar para executar o Nikudan Sensha requer somente ação parcial e tem duração instantânea.\n\nDesbloqueia a técnica *Nikudan Sensha* no nível 2."
      },
      {
        n: 2, info: "Tier 2 — Nikudan Sensha (Tanque Humano)", req: [{ apt: "lutador" }],
        detalhe: "• Nikudan Sensha (Req. Lutador, Completa, Instantânea, custo 1 chakra): o usuário se transforma em uma bola giratória e se impulsiona como um rolo compressor. Funciona como atropelar com investida, causando dano de ataque corporal comum. O alvo testa Vigor (dif 2 + CC) para não ser derrubado. O usuário fica imune a efeitos sonoros durante a técnica.\n\n*Nikudan Hari Sensha:* variação com corrente de kunais enrolada ao redor do corpo (ação parcial para preparar), adicionando corte ao dano. Optativo: 1 chakra para fazer os cabelos crescerem e ficarem afiados (ação livre), reduzindo o tempo de preparação."
      },
      {
        n: 3, info: "Tier 3 — Bunbun Baika no Jutsu (Expansão Parcial)", req: [{ apt: "lutador" }],
        detalhe: "• Bunbun Baika no Jutsu (Req. Lutador, Livre, Pessoal, Instantânea, sem custo extra): expande um ou ambos os braços ou pernas para tamanho Grande antes de um ataque, manobra especial ou aptidão de manobra. Recebe alcance CC de 2m e +1 em Força, além de +1 de precisão em testes de atropelar, empurrar, agarrar e derrubar. O bônus de precisão não é cumulativo com o de outras manobras."
      },
      {
        n: 4, info: "Tier 4 — Baika Nível 4 (Tamanho Grande)", req: [{ apt: "r_corpulencia" }, { apt: "r_resiliencia" }],
        detalhe: "• Baika Nível 4 (Req. Corpulência + Resiliência, Movimento, Pessoal, Contínua, custo 3 chakra): o personagem aumenta o tamanho de todo o corpo, subindo para a categoria *Grande*. A partir deste nível os itens e armas aumentam junto (dano não alterado).\n\nDesbloqueia a técnica *Choudan Bakugeki* no nível 4."
      },
      {
        n: 5, info: "Tier 5 — Baika Nível 5 (Tamanho Enorme)",
        detalhe: "• Baika Nível 5 (Movimento, Pessoal, Contínua, custo 4 chakra): o personagem aumenta o tamanho de todo o corpo, subindo para a categoria *Enorme*."
      },
      {
        n: 6, info: "Tier 6 — Baika Nível 6 (Tamanho Imenso)",
        detalhe: "• Baika Nível 6 (Movimento, Pessoal, Contínua, custo 5 chakra): o personagem aumenta o tamanho de todo o corpo, subindo para a categoria *Imenso*.\n\n*Choudan Bakugeki — Nível 7:* você pode usar esta técnica com o aumento de tamanho.\n*Nível 8+:* a partir deste nível, Choudan Bakugeki recebe +1 de dano adicional para cada nível do poder acima de 7 quando usada com o aumento de tamanho."
      },
      {
        n: 7, info: "Tier 7 — Choudan Bakugeki avançado",
        detalhe: "• A técnica Choudan Bakugeki pode ser usada em conjunto com o aumento de tamanho do Baika no Jutsu a partir deste nível."
      },
      {
        n: 8, info: "Tier 8 — Choudan Bakugeki aprimorado",
        detalhe: "• A técnica Choudan Bakugeki recebe +1 de dano adicional por nível acima de 7 quando usada com o aumento de tamanho (total: +4 no nível 8, +5 no nível 9, e assim por diante)."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — HYUUGA ────────────────────────────────────────────────
  {
    id: "juuken", nome: "Juuken", cor: "#06b6d4",
    req: [{ atr: "ESP", val: 1 }, { apt: "r_byakugan" }, { apt: "acuidade" }],
    cla: "hyuuga",
    niveis: [
      {
        n: 1, info: "Nível 1 — Juuken (Punho Gentil)",
        detalhe: "*Taijutsu* / Postura de Luta; Kekkei Genkai; Controle de Chakra\n*Ação:* Livre\n*Alcance:* Pessoal\n*Duração:* Contínua\n*Custo:* 0\n\nPostura de luta única do clã Hyuuga. Requer Byakugan ativo para enxergar a circulação interna de chakra e os órgãos internos do oponente.\n\nCada ataque realizado na postura Juuken é um ataque desarmado de dano letal — o usuário concentra chakra nas mãos e o envia diretamente ao corpo do inimigo ao atingi-lo.\n\nGolpes Juuken são sempre feitos com as mãos e usam *Destreza* como atributo:\n\n*Dano Base CC — Juuken:* (Destreza ÷ 2) + 1 de dano de arma\n\nO dano de arma aumenta com o nível do poder:\n*Juuken 4:* +2 de dano de arma\n*Juuken 5:* +3 de dano de arma\n*Juuken 6:* +4 de dano de arma (máximo)\n\nO Juuken ignora metade da dureza de corpo passiva (máx 2 pts ignorados). Bônus e penalidades de dano são aplicados normalmente.\n\nVocê pode usar aptidões de manobra com os golpes do Juuken nível 1, mas não com as demais técnicas deste poder (a menos que a técnica diga que possa)."
      },
      {
        n: 2, info: "Nível 2 — Jūkenpō Ichigekishin (Explosão do Corpo)",
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Ação:* Padrão\n*Alcance:* 3m\n*Duração:* Instantânea\n*Custo:* 2\n\nO Hyuuga expele chakra de cada tenketsu em seu corpo, criando uma explosão que não causa dano, mas afasta inimigos em combate corpo-a-corpo, que estejam agarrando o usuário, ou destrói amarras e prisões.\n\nAfeta todos a até 3m — realize um teste de CD contra as defesas dos alvos. A técnica é de puro chakra e invisível a olhos comuns: criaturas sem visão de chakra ficam *desprevenidas*. Atingidos testam *Acrobacia (Dif 13)* para não ficar caídos.\n\nCriaturas agarrando o usuário não têm direito à defesa (Sucesso Automático), a menos que desistam do agarrar como reação. Não afeta criaturas de tamanho Enorme ou maior.\n\n*Contra amarras/prisões:* causa 2 de dano base × nível do poder.\n\n*Contra elementos imateriais sobre o corpo:* repele desde que o custo de chakra seja inferior ao nível do poder."
      },
      {
        n: 3, info: "Nível 3 — Hakkeshou Kaiten (Rotação Divina do Octograma)",
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Ação:* Padrão (ou Parcial; ver texto)\n*Alcance:* Pessoal\n*Duração:* Instantânea\n*Custo:* ver texto\n\nO usuário gira o corpo liberando quantidades precisas de chakra por todos os poros, criando uma meia-esfera de chakra em rotação. Requer movimentos livres — não pode ser usado imobilizado ou com restrição de movimento.\n\n*Ofensivo:* Custa 2 chakra. Atinge todos até 2m; dano comum Juuken. Atingidos testam *Acrobacia ou Vigor (Dif 7 + 2× nível do poder)* para não cair.\n\n*Defensivo:* Custa 1 chakra × nível usado. Usa seu nível de CC (desarmado) no teste de defesa ao invés do LM. Funciona contra ataques corpo-a-corpo ou à distância. Cria barreira com *dureza = 3 + 2× nível usado* (indestrutível por qualquer técnica ou arma). Se dureza superada pelo dano base, o Kaiten é interrompido e você sofre o dano excedente.\n\nCriaturas no alcance sofrem dano calculado pelo resultado do teste defensivo. O próprio atacante não tem direito à defesa.\n\nSe ninguém será ferido, basta uma *ação parcial*.\n\n*Nível 6:* alcance aumenta para 5m."
      },
      {
        n: 4, info: "Nível 4 — Hakke Sanjuuni Shou (32 Pontos do Octograma)", req: [{ apt: "r_tenketsu" }, { apt: "ataque_multiplo" }],
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Pré-requisitos:* Tenketsu Byakugan; Ataque Múltiplo\n*Ação:* Padrão\n*Alcance:* Toque\n*Duração:* Instantânea\n*Custo:* 4\n\nVersão menor do Hakke Rokujuuyon Shou. Ataca o oponente com 32 golpes sucessivos, selando a mesma quantidade de tenketsus.\n\nVocê realiza *3 ataques Juuken* pela regra do Ataque Múltiplo, com *+3 de bônus de dano* (somado antes da divisão dos golpes).\n\nAptidões de combate do Ataque Múltiplo (como Crítico Aprimorado e Ataque em Movimento) também se aplicam. *Acerto Crítico* em um golpe torna os golpes seguintes Sucessos Automáticos.\n\n*Por golpe bem-sucedido:* a vítima perde 3 pontos de chakra.\n\nSe os *3 golpes* drenam chakra: alvo testa *Vigor (Dif 7 + 2× nível Juuken)* ou fica atordoado até o fim de seu próximo turno."
      },
      {
        n: 5, info: "Nível 5 — Hakke Kuushou (Palma Aérea do Octograma)",
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Ação:* Padrão\n*Alcance:* 20m\n*Duração:* Instantânea\n*Custo:* 5\n\nO usuário foca os pontos vitais do inimigo com o Byakugan e libera um impulso de chakra da palma da mão em alta velocidade, atingindo inimigos a distância como se fosse um Juuken projetado.\n\nUsa *Combate Corporal* no teste de ataque, atingindo alvos a até *20m* e causando dano normal de um ataque Juuken.\n\nAo ser atingido, o oponente testa *Acrobacia ou Força (Dif 9 + 2× nível Juuken)* para não ser jogado 3m para trás e cair ao chão."
      },
      {
        n: 6, info: "Nível 6 — Hakke Rokujuuyon Shou (64 Pontos do Octograma)", req: [{ apt: "r_tenketsu" }, { apt: "ataque_multiplo" }],
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Pré-requisitos:* Tenketsu Byakugan; Ataque Múltiplo\n*Ação:* Padrão\n*Alcance:* Toque\n*Duração:* Instantânea\n*Custo:* 6\n\nA técnica mais famosa do clã Hyuuga ao lado do Kaiten. Funciona como a versão menor, mas com 64 golpes e os seguintes melhoramentos:\n\nVocê realiza *3 ataques Juuken* com *+4 de bônus de dano* (somado antes da divisão). Acerto Crítico = golpes seguintes são Sucessos Automáticos.\n\n*Por golpe bem-sucedido:* vítima perde 4 chakra.\n\nSe os *3 golpes* drenam chakra: alvo testa *Vigor (Dif 7 + 2× nível Juuken)* ou fica atordoado até o fim do próximo turno *e* fatigado pelo restante da cena.\n\n*Kaiten:* alcance aumenta para 5m a partir deste nível."
      },
      {
        n: 7, info: "Nível 7 — Juuho Soushiken (Punho dos Leões Gêmeos)", req: [{ apt: "ataque_multiplo" }],
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Pré-requisito:* Ataque Múltiplo\n*Ação:* Movimento (ver texto)\n*Alcance:* Pessoal\n*Duração:* Sustentada\n*Custo:* metade nível do poder por turno\n\nTécnica secreta de alto nível. Você concentra chakra em ambas as mãos na forma de cabeças de leão e ataca o oponente causando grande dano.\n\nApós usar, você pode fazer o *Ataque Múltiplo* de forma especial: cada golpe individual causa *dano base = nível usado do poder*.\n\n*Ação padrão* = 2 golpes; *Ação completa* = 3 golpes.\n\nNão pode ser usado com Selamento de Tenketsu nem outras aptidões de manobra. As demais regras do Ataque Múltiplo são mantidas."
      },
      {
        n: 8, info: "Nível 8 — Hakke Hyakunijuuhachi Shou (128 Pontos do Octograma)", req: [{ apt: "r_tenketsu" }, { apt: "ataque_multiplo" }],
        detalhe: "*Taijutsu* / Kekkei Genkai; Controle de Chakra\n*Pré-requisitos:* Tenketsu Byakugan; Ataque Múltiplo\n*Ação:* Padrão\n*Alcance:* Toque\n*Duração:* Instantânea\n*Custo:* nível do poder\n\nVersão ampliada do Rokujuuyon Shou com 128 golpes. Funciona como as versões menores com os seguintes melhoramentos:\n\nVocê realiza *3 ataques Juuken* com *+1 de bônus de dano por nível do poder* (somado antes da divisão). Acerto Crítico = golpes seguintes são Sucessos Automáticos.\n\n*Por golpe bem-sucedido:* vítima perde 5 chakra (+1 a cada 3 níveis acima de 8).\n\nSe os *3 golpes* drenam chakra: alvo testa *Vigor (Dif 7 + 2× nível Juuken)* ou fica atordoado até o fim do próximo turno e fatigado pelo restante da cena."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — INUZUKA ────────────────────────────────────────────────
  {
    id: "shikakyu", nome: "Shikakyu", cor: "#e07820",
    req: [{ apt: "r_hakken" }],
    cla: "inuzuka",
    niveis: [
      {
        n: 1, info: "Nível 1 — Shikakyu no Jutsu (Técnica Quadrúpede)",
        detalhe: "*Ninjutsu* Rank D / Hijutsu\n*Pré-requisitos:* Hakken no Jutsu\n*Ação:* Parcial\n*Alcance:* Pessoal\n*Duração:* Contínua\n*Custo:* 1\n\nO usuário envolve o corpo com chakra e apoia as mãos e joelhos ao chão, assumindo postura de predador quadrúpede. Ganha armas naturais de garra e mordida com dano letal.\n\n*Dano Base CC — Shikakyu:* (Força ÷ 2) + 1 de dano de arma\n\nO dano de arma aumenta com o nível do poder:\n*Shikakyu 4:* +2 de dano de arma\n*Shikakyu 5:* +3 de dano de arma\n*Shikakyu 6:* +4 de dano de arma (máximo)\n\n*Bônus adicionais:* +1 de precisão em testes de Intimidação e +2 em iniciativa.\n\nEsta técnica pode ser usada pelo Companheiro Animal."
      },
      {
        n: 2, info: "Nível 2 — Juujin Bunshin no Jutsu (Clone do Homem-Besta)", req: [{ apt: "r_comp_animal" }],
        detalhe: "*Ninjutsu* Rank D / Hijutsu\n*Pré-requisitos:* Companheiro Animal\n*Ação:* Movimento\n*Alcance:* Toque\n*Alvo:* 1 cão companheiro animal\n*Duração:* Contínua\n*Custo:* 2\n\nTransforma o companheiro animal em uma cópia perfeita do Inuzuka. O animal assume o tamanho original do usuário e replica seus atributos, habilidades de combate e perícias (respeitando as regras de permissão do Companheiro Animal).\n\nAtaques corpo-a-corpo e arremesso do clone têm o mesmo dano base que teria o usuário, respeitando a regra de dano de parceiros. Vitalidade e Chakra são os mesmos da ficha original do animal.\n\nSe possuir mais de um companheiro, pode usar esta técnica em todos simultaneamente, pagando o custo para cada um.\n\nO clone possui os mesmos itens do personagem, mas *explosivos, efeitos especiais de armas e itens dependentes de chakra não podem ser usados*.\n\nA transformação é cancelada como ação livre, ou automaticamente se o animal ficar inconsciente ou perder mais da metade da Vitalidade (e não pode ser refeita naquela cena).\n\nSob efeito do Shikakyu no Jutsu, é visualmente impossível distingui-lo do clone."
      },
      {
        n: 3, info: "Nível 3 — Tsuuga (Presa Perfurante)", req: [{ apt: "lutador" }],
        detalhe: "*Taijutsu* Rank D / Hijutsu\n*Pré-requisitos:* Lutador. Requer Shikakyu ativo e distância mínima de 3m do alvo.\n*Ação:* Completa\n*Duração:* Instantânea\n*Custo:* 1\n\nO usuário gira sobre si mesmo em alta velocidade e avança sobre o oponente.\n\nFunciona como *atropelar com investida*, causando dano igual a um ataque com garras do Shikakyu. O alvo testa *Vigor (Dif 2 + CC do personagem)* para não ser derrubado.\n\n*Gatsuga (Dupla Presa Perfurante):* Se o Companheiro Animal estiver sob efeito do Juujin Bunshin, ele pode realizar o Tsuuga simultaneamente, cada um gastando suas ações e chakra e rolando testes individuais. O Inuzuka terá o *dano dobrado* nesta versão."
      },
      {
        n: 5, info: "Nível 5 — Sotorou (Lobo de Duas Cabeças)", req: [{ per: "Disfarces", val: 8 }],
        detalhe: "*Ninjutsu* Rank B / Hijutsu\n*Pré-requisitos:* Disfarces 8\n*Ação:* Movimento (gasta pelo Inuzuka)\n*Alcance:* Toque (precisa tocar o Companheiro Animal)\n*Duração:* Contínua\n*Custo:* 3 por turno\n\nO Inuzuka e seu companheiro animal se fundem em um *gigantesco lobo de duas cabeças*. Deve ser tratado como uma única criatura (inclusive contra ataques mentais).\n\nPossui a mesma ficha do usuário, mas com tamanho *Enorme*, recebendo os bônus e penalidades naturais desse tamanho. Todos os danos de Vitalidade e custos de Chakra são retirados do Inuzuka.\n\nSempre que fizer um *ataque corpo-a-corpo básico (Golpear)* ou estiver *agarrando* um alvo, recebe um ataque corporal extra contra o mesmo alvo. O ataque extra causa *metade do dano base* e não pode ser usado para manobras ou aptidões."
      },
      {
        n: 6, info: "Nível 6 — Garouga (Presa do Lobo)",
        detalhe: "*Taijutsu* Rank B / Hijutsu\n*Ação:* Completa\n*Duração:* Instantânea\n*Custo:* 2\n\nUsa o Tsuuga dentro da forma Sotorou. O maior tamanho confere força destrutiva e alcance maiores.\n\nUsa *todas as regras do Tsuuga*, porém com os modificadores para tamanho *Enorme* e com *+6 de bônus de dano*."
      },
      {
        n: 7, info: "Nível 7 — Santorou (Lobo de Três Cabeças)", req: [{ per: "Disfarces", val: 12 }],
        detalhe: "*Ninjutsu* Rank A / Hijutsu\n*Pré-requisitos:* Disfarces 12; um clone ou matilha\n*Ação:* Movimento (gasta pelo Inuzuka)\n*Alcance:* Toque (precisa tocar o Companheiro Animal e o Clone)\n*Duração:* Contínua\n*Custo:* 4 por turno\n\nO Inuzuka, seu companheiro animal e um Kage Bunshin (ou segundo companheiro) se fundem em um *lobo gigante de três cabeças*.\n\nDeve ser tratado como uma única criatura (inclusive contra ataques mentais). Possui a mesma ficha do usuário, mas com tamanho *Imenso*, recebendo os bônus e penalidades naturais desse tamanho. Todos os danos de Vitalidade e custos de Chakra são retirados do Inuzuka.\n\nSempre que fizer um *ataque corpo-a-corpo básico (Golpear)* ou estiver *agarrando* um alvo, recebe um ataque corporal extra contra o mesmo alvo. O ataque extra causa *metade do dano base* e não pode ser usado para manobras ou aptidões."
      },
      {
        n: 8, info: "Nível 8 — Ooiga Gatenga (Perseguição da Presa Giratória)",
        detalhe: "*Taijutsu* Rank B / Hijutsu\n*Requer:* Forma Santorou (Lobo de Três Cabeças) ativa\n*Ação:* Completa\n*Duração:* Instantânea\n*Custo:* 3\n\nNa forma do Lobo de Três Cabeças, o usuário gira verticalmente sobre si mesmo, transformando-se em uma *esfera de velocidade feroz* que avança sobre os inimigos.\n\nUsa *todas as regras do Tsuuga*, porém com os modificadores para tamanho *Imenso* e com *bônus de dano igual ao nível do poder*.\n\nGraças ao imenso tamanho, o Ooiga Gatenga é considerado um *ataque em área de linha com 5m de largura*."
      },
    ],
  },
  // ── RESTRITOS DE CLÃ — NARA ───────────────────────────────────────────────────
  {
    id: "kagejutsu", nome: "Kagejutsu", cor: "#7c3aed",
    req: [],
    cla: "nara",
    niveis: [
      {
        n: 1, info: "Nível 1 — Kage Shibari no Jutsu (Prisão das Sombras)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão\n*Alvo:* 1 ou mais criaturas (ver texto)\n*Alcance:* Curto (5m + 2m por nível do poder)\n*Duração:* Concentração (ver texto)\n*Custo:* 1 por nível do poder\n\nEstende a sombra sobre qualquer superfície até o alcance. Ao tocar a sombra de um alvo, ambas se conectam e o alvo fica *paralisado* pela duração.\n\n*Uso:* Teste de CD contra a defesa do alvo. O usuário deve se manter imóvel e concentrado ou a técnica é desfeita.\n\n*Técnica Silenciosa:* Se usada sob camuflagem, cobertura ou furtividade, o alvo recebe *−3 na Esquiva e em Antecipar*, sem direito a outras defesas.\n\n*Técnica Lenta:* Às vistas do alvo, o usuário recebe *−3 em CD*.\n\n*Resistência:* Ação padrão + teste de *Força (Dif 9 + nível usado + metade INT do usuário)* para escapar.\n\n*Alcance:* +1m/nível sob sol nascente/poente ou bomba luminosa; −1m/nível sob sol do meio-dia. Impossível em total escuridão. Cada sombra de objeto no caminho concede +1m adicional.\n\n*Duração:* 1 + 1/nível de turnos (máx 6). Cada reuso na mesma cena reduz em 1 (mínimo 2 turnos).\n\n*Mais de 1 alvo:* máx 1 alvo a cada 2 níveis; duração mínima de 2 turnos (dobrada contra capangas)."
      },
      {
        n: 2, info: "Nível 2",
        detalhe: "*Nível 2 — Sem técnica nova.* Os benefícios do Kage Shibari crescem com o nível do poder (alcance, duração e dificuldade de resistência)."
      },
      {
        n: 3, info: "Nível 3 — Kage Mane no Jutsu (Imitação das Sombras)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão\n*Alvo:* 1 ou mais criaturas\n*Alcance:* Curto (5m + 2m por nível do poder)\n*Duração:* Concentração\n*Custo:* 1 por nível do poder\n\nEvolução do Kage Shibari. Além de paralisar, os alvos são obrigados a *imitar os movimentos corporais* do usuário.\n\n*Imitação de Deslocamento:* O usuário pode se deslocar livremente. A vítima se desloca na mesma direção e distância. A técnica é desfeita se o deslocamento afastar vítima além do alcance.\n\n*Imitação de Gestos:* Alvos humanoides imitam mãos, passos e pegam objetos ao alcance. Para não-humanoides, apenas o deslocamento é imitado. Criaturas voadoras caem imediatamente.\n\n*[Requer nível 7] Sombra Preparada:* Após errar, pode manter o Kage Mane preparado e reutilizá-lo como ação padrão sem selo. A 1m do alvo, funciona como técnica silenciosa (−3 na Esquiva).\n\n*[Requer nível 8] Sombra Guiada:* Conecta sombra a um aliado com ligação fraca. Quando o aliado se aproxima de um inimigo (1m), o Kage Mane reage e pode ser liberado com benefício de Técnica Silenciosa.\n\n*[Requer nível 9] Sombra Perfeita:* Duração passa a ser Sustentada."
      },
      {
        n: 4, info: "Nível 4 — Kage Mane Shuriken no Jutsu (Imitação da Shuriken das Sombras)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Parcial (preparação) + Padrão (arremesso)\n*Alcance:* Curto (5m + 2m por nível do poder)\n*Duração:* Concentração (máx 2 turnos)\n*Custo:* 1 por nível do poder\n\nRequer uma arma projétil de material condutor de chakra (ex: Aian Nakkuru).\n\nCom ação parcial, transfere o Kage Mane para a arma via chakra. Depois arremessa a arma mirando a *sombra do alvo* no chão.\n\nSe o alvo não conhece a intenção do arremesso: *−2 na Esquiva e em Antecipar*.\n\n*Efeito:* Se bem-sucedido, o alvo fica paralisado (efeitos do Kage Shibari) pela duração.\n\n*Kage Mane Livre:* Enquanto o alvo estiver paralisado, pode usar o Kage Mane como *ação livre* pagando seu custo."
      },
      {
        n: 5, info: "Nível 5 — Kage Kubishibari no Jutsu (Estrangulamento das Sombras)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Movimento\n*Alvo:* Criatura capturada pelo Kage Mane ou Kage Shibari\n*Duração:* A mesma do Kage Mane ou Shibari\n*Custo:* 1 por nível do poder\n\nExtende a sombra até o pescoço das vítimas do Kage Mane/Shibari e os estrangula. 1 alvo por cada 6 pontos de Espírito.\n\nUsa a ação de movimento. Ao final de cada turno seu, causa *dano fixo de sufocamento = nível usado do poder + metade INT* (mesmo se a vítima prender a respiração).\n\n*Resistindo:* Ação padrão + teste de *Força* para se libertar. Se bem-sucedido, ainda estará preso pelo Kage Mane e deverá escapar dele também. Ao ficar totalmente livre, fica *fatigado* até o fim de seu próximo turno."
      },
      {
        n: 6, info: "Nível 6 — Kageyose no Jutsu (Coleção das Sombras) + Kage Nui (Costura das Sombras)",
        detalhe: "*KAGEYOSE NO JUTSU*\n*Ninjutsu* / Hijutsu\n*Ação:* Movimento (criar filamentos) / Padrão (reunir)\n*Alcance:* Curto\n*Duração:* Sustentada ou Concentração (Algemar)\n*Custo:* 1 por nível do poder\n\nMaterializa a sombra em *filamentos negros* — máx 2 por nível usado do poder. Como ação padrão, pode reunir todos em um ponto, trazendo objetos que carreguem (útil com kunais ou tarjas explosivas).\n\n*Lançar Projétil:* Apanha projétil com a sombra e o arremessa usando CD normalmente.\n\n*Algema de Sombra:* Enrola um alvo por filamentos (2 filamentos por alvo) seguindo regras do Efeito Algemar Nv 6. Dureza dos filamentos = nível usado + metade INT. Dificuldade de escape = Kage Mane.\n\n――――――――\n\n*KAGE NUI (Costura das Sombras)*\n*Ninjutsu* / Hijutsu\n*Ação:* Padrão (ou Completa para Costurar)\n*Alvo:* Uma ou mais criaturas\n*Duração:* Instantânea (ver texto)\n*Custo:* 1 por nível do poder\n\nFilamentos pontiagudos — mesma quantidade do Kageyose. Cada agulha causa *1 de dano base* com alcance e regras do Kage Mane, mas *sem penalidade de técnica lenta*.\n\n*Costurar (ação completa):* Se causar grau 3+ de dano, o alvo fica *impedido* por duração sustentada (regras de Algema de Sombra). Novo uso no mesmo alvo com qualquer grau = *paralisado* por concentração. O alvo não pode usar Escapar. Ao se libertar (Força ou outro método), todas as condições são removidas de uma vez."
      },
      { n: 7, info: "Nível 7", detalhe: "*Nível 7 — Sem técnica nova.* Desbloqueias *Sombra Preparada* no Kage Mane (requer nível 7)." },
      {
        n: 8, info: "Nível 8 — Kagezukami no Jutsu (Captura das Sombras)",
        detalhe: "*Ninjutsu* / Hijutsu\n*Ação:* Padrão\n*Alvo:* Uma ou mais criaturas\n*Duração:* Concentração\n*Custo:* 1 por nível do poder\n\nVariação do Kage Mane. Em vez de forçar imitação, o Nara *puxa e move o alvo* para qualquer lugar de sua escolha dentro do alcance. A vítima pode agir livremente mas *não pode se deslocar* por conta própria.\n\nTodas as demais regras do Kage Mane permanecem.\n\nDesbloqueias também *Sombra Guiada* no Kage Mane (requer nível 8)."
      },
    ],
  },
];

// ── Modal de seleção de efeito ao comprar/evoluir Ninpou ─────────────────────
const PODERES_COM_EFEITOS = ["ninpou", "doton", "fuuton", "katon", "raiton", "suiton", "mokuton", "hyouton", "choujuu_giga"];

// ── O que cada clã traz automaticamente ao criar a ficha ─────────────────────
// aptidoes: adicionadas sem custo (cat "restrita"), sem verificar req (são base do clã)
// poderes: { id, nivel } — adicionados sem custo
// itens: { id, nome, descricao, categoria, quantidade } — adicionados na mochila
const CLA_INICIALIZACAO = {
  fuuma: {
    aptidoes: [
      { id: "r_demonio_vento", nome: "Demônio do Vento", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [],
    itens: [],
  },
  mikoto: {
    aptidoes: [
      { id: "r_rascunho_feras", nome: "Rascunho das Feras", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "choujuu_giga", nome: "Choujuu Giga", nivel: 1 },
    ],
    itens: [],
  },
  shimura: {
    aptidoes: [
      { id: "r_rascunho_feras", nome: "Rascunho das Feras", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "choujuu_giga", nome: "Choujuu Giga", nivel: 1 },
      { id: "fuuton", nome: "Fuuton", nivel: 1 },
    ],
    itens: [],
  },
  kaguya: {
    aptidoes: [
      { id: "r_artesao_ossos", nome: "Artesão de Ossos", cat: "restrita", obs: "", efeito: null },
      { id: "r_armadura_ossea", nome: "Armadura Óssea", cat: "restrita", obs: "", efeito: null },
      { id: "r_regeneracao_kaguya", nome: "Regeneração", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [],
    itens: [],
  },
  yotsuki: {
    aptidoes: [
      { id: "r_lamina_da_lua", nome: "Lâmina da Lua", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "raiton", nome: "Raiton", nivel: 1 },
    ],
    itens: [],
  },
  hozuki: {
    aptidoes: [],
    poderes: [
      { id: "suiton", nome: "Suiton", nivel: 1, gratis: true },
    ],
    itens: [],
  },
  hoshigaki: {
    aptidoes: [
      { id: "r_predador_aquatico", nome: "Predador Aquático", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "suiton", nome: "Suiton", nivel: 1, gratis: true },
    ],
    itens: [],
  },
  sarutobi: {
    aptidoes: [],
    poderes: [],
    itens: [],
  },
  senju: {
    aptidoes: [
      { id: "r_maximizar", nome: "Maximizar", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "mokuton", nome: "Mokuton", nivel: 1 },
    ],
    itens: [],
  },
  nara: {
    aptidoes: [],
    poderes: [
      { id: "kagejutsu", nome: "Kagejutsu", nivel: 1 },
    ],
    itens: [],
  },
  inuzuka: {
    aptidoes: [
      { id: "r_comp_animal", nome: "Companheiro Animal", cat: "restrita", obs: "", efeito: null },
      { id: "r_hakken", nome: "Hakken no Jutsu", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "shikakyu", nome: "Shikakyu", nivel: 1 },
    ],
    itens: [],
  },
  hyuuga: {
    aptidoes: [
      { id: "r_byakugan", nome: "Byakugan", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "juuken", nome: "Juuken", nivel: 1 },
    ],
    itens: [],
  },
  hatake: {
    aptidoes: [
      { id: "r_presa_prata", nome: "Presa de Prata", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [],
    itens: [
      {
        id: "espada_chakra_branco", nome: "Espada de Chakra Branco", categoria: "armas", quantidade: 1,
        descricao: "Espada especial leve que parece produzir uma luz branca no ar quando movimentada. É construída e fornecida gratuitamente pelo clã.\n\n*Pré-requisito para uso sem penalidade:* Destreza 8 + aptidão Usar Arma ou Presa de Prata.\n\n*Dano base:* +2 (aumenta para +3 com DES 10; +4 com DES 12). Não se aplica com Ambidestria.\n\n*Chakra Branco:* Você pode usar Espírito no lugar de Força para calcular o dano base dos ataques com esta arma.\n\n*Fragilidade:* Possui durabilidade semelhante a uma arma comum, podendo ser danificada com o uso.",
        hc: "CC", dano: "+2", critico: "15-16", tipo: "Corte", alcance: "---", compartimentos: "1 item/1 comp.",
        danoEscala: [
          { minAtr: 10, atr: "destreza", dano: "+3" },
          { minAtr: 12, atr: "destreza", dano: "+4" },
        ],
      },
    ],
  },
  yuki: {
    aptidoes: [
      { id: "r_selos_especiais", nome: "Selos Especiais", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "hyouton", nome: "Hyouton", nivel: 1 },
    ],
    itens: [],
  },
  yamanaka: {
    aptidoes: [],
    poderes: [
      { id: "shindenshin", nome: "Shindenshin", nivel: 1 },
    ],
    itens: [],
  },
  uzumaki: {
    aptidoes: [
      { id: "r_regeneracao", nome: "Regeneração", cat: "restrita", obs: "", efeito: null },
      { id: "r_chakra_expandido", nome: "Chakra Expandido", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [],
    itens: [],
  },
  uchiha: {
    aptidoes: [
      { id: "r_katon_nat", nome: "Elemento Natural: Katon", cat: "restrita", obs: "", efeito: null },
      { id: "r_sharingan", nome: "Sharingan", cat: "restrita", obs: "", efeito: null },
    ],
    poderes: [
      { id: "katon", nome: "Katon", nivel: 1 },
    ],
    jutsus: [
      {
        id: "j_uchiha_goukakyuu",
        nome: "Katon: Goukakyuu no Jutsu",
        tipo: "ninjutsu",
        acao: "Padrão",
        alcance: "Médio",
        custo: "Metade do ESP (mín. 1)",
        nivel_poder: "4",
        anotacoes: "Técnica gratuita do Elemento Natural: Katon. Usa o efeito Sopro Destrutivo Nv 4 mesmo sem possuir o poder Katon e mesmo em Genin. Dano base = Espírito + 2 (bônus Katon). Ao comprar Katon recebe Sopro Destrutivo Nv 4 gratuitamente (evolui em Nv 7 e 10).",
        obs: "Grátis — Elemento Natural: Katon",
      },
    ],
    itens: [],
  },
  akimichi: {
    aptidoes: [
      { id: "r_corpulencia", nome: "Corpulência", cat: "restrita", obs: "", efeito: null },
      { id: "r_resiliencia", nome: "Resiliência", cat: "restrita", obs: "", efeito: null, reqAptidao: "r_corpulencia" },
    ],
    poderes: [
      { id: "baika_ninpou", nome: "Baika Ninpou", nivel: 1 },
    ],
    itens: [
      {
        id: "pilula_verde", nome: "Pílula Verde — Hōrengan (Espinafre Verde)", categoria: "itens_gerais", quantidade: 1,
        descricao: "*Nível 1 – Verde*\nPermite usar Controle de Caloria Nível 1 mesmo sem cumprir o pré-requisito de Vigor.\n\n*Benefícios:* Perde 3 pontos de Vitalidade, recebe 6 pontos de chakra e Força +2.\n*Penalidades:* Fatigado por 1 turno.\n\nIngerir é uma ação parcial. Quando ingerida, a pílula Amarela nega o cansaço desta.",
      },
      {
        id: "pilula_amarela", nome: "Pílula Amarela — Karēgan (Caril Amarelo)", categoria: "itens_gerais", quantidade: 1,
        descricao: "*Nível 2 – Amarelo*\nPermite usar Controle de Caloria Nível 2 mesmo sem cumprir o pré-requisito de Vigor.\n\n*Benefícios:* Perde 5 pontos de Vitalidade, recebe 10 pontos de chakra e Força +4.\n*Penalidades:* Exausto por 2 turnos.\n\nIngerir é uma ação parcial. Quando ingerida, nega o cansaço da pílula Verde. A pílula Vermelha nega o cansaço desta.",
      },
      {
        id: "pilula_vermelha", nome: "Pílula Vermelha — Tongarashigan (Pimenta Vermelha)", categoria: "itens_gerais", quantidade: 1,
        descricao: "*Nível 3 – Vermelho*\nPermite usar Controle de Caloria Nível 3 mesmo sem cumprir o pré-requisito de Vigor.\n\n*Benefícios:* Perde 7 pontos de Vitalidade, recebe 14 pontos de chakra e Força +6. Entra no *Modo Chou*.\n\n*Modo Chou:* Asas de energia surgem nas suas costas. Você deixa de sofrer as penalidades da aptidão Resiliência. Caso não esteja sob efeito do Baika no Jutsu, pode substituir sua Agilidade pelo dobro do nível em Baika Ninpou para deslocamento e testes de Finta.\n\n*Penalidades:* Inconsciente por 24 horas, a menos que passe em Vigor dif 23 para ficar apenas exausto pelo mesmo tempo.\n\n*Risco de Morte:* Morrerá após 24 horas sem tratamento ou sem passar em outro teste de Vigor. Ao alcançar Vigor 16, não precisa mais de teste para se manter consciente.\n\nIngerir é uma ação parcial. Quando ingerida, nega o cansaço da pílula Amarela.",
      },
    ],
  },
};


// ── Poderes Restritos (não vinculados a clã) ──────────────────────────────────
const PODERES_RESTRITOS_CONFIG = [
  {
    id: "kuchiyose", nome: "Kuchiyose (Invocação)", cor: "#c79255",
    restrito: true,
    req: [{ atr: "ESP", val: 6, ou: true }, { atr: "INT", val: 6, ou: true }],
    desc: "Poder Restrito. Ninjutsu / Jikuukan. Permite invocar animais ou criaturas com as quais o shinobi possui um contrato de sangue.\n\n*Alcance:* Pessoal  *Ação:* Padrão  *Duração:* Contínua\n\nO usuário morde o polegar, esfrega o sangue nas mãos e realiza os selos necessários. A criatura invocada atua como Parceiro com ficha própria.\n\n*Pré-requisito:* Espírito ou Inteligência 6.",
    niveis: [
      {
        n: 1, info: "Nível 1 — Kuchiyose básico",
        detalhe: "Você pode invocar uma criatura de tamanho Médio ou menor com a qual possui contrato de sangue. O custo de chakra é determinado pelo Mestre de acordo com a criatura invocada.\n\nA criatura invocada é tratada como Parceiro e age no turno do usuário."
      },
      {
        n: 2, info: "Nível 2 — Invocações maiores",
        detalhe: "Você pode invocar criaturas de tamanho Grande. Invocações múltiplas simultâneas passam a ser possíveis (máx 2), cada uma custando chakra separadamente."
      },
      {
        n: 3, info: "Nível 3 — Chefe da Invocação",
        detalhe: "Você pode invocar a criatura-chefe do seu contrato (normalmente de tamanho Enorme ou maior). Essa invocação é única por cena e não pode ser combinada com outras invocações simultâneas."
      },
    ],
  },
];

// ── Modal Loja de Poderes ─────────────────────────────────────────────────────
const ModalLojaPoderes = ({ poderes, onComprar, onFechar, pontosRestantes, ficha = {}, claId }) => {
  const [expandidos, setExpandidos] = useState({});
  const [niveisExpandidos, setNiveisExpandidos] = useState({});
  const [busca, setBusca] = useState("");
  const [toast, setToast] = useState(null);

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
    const ehCla = !!cfg.cla;
    const nivel1Gratis = ehCla && nivel === 1 && atual === 0;
    const custo = nivel1Gratis ? 0 : 1;
    if (!nivel1Gratis && pontosRestantes !== undefined && custo > pontosRestantes) {
      mostrarToast(`Pontos insuficientes — restam ${pontosRestantes}.`, "erro");
      return;
    }
    if (PODERES_COM_EFEITOS.includes(cfg.id) && nivel > atual) {
      const proximoNivel = atual + 1;
      onComprar({ id: cfg.id, nome: cfg.nome, nivel: proximoNivel });
      // Yuki: primeira compra de Hyouton (nível 1) concede Suiton e Fuuton nível 1 gratuitos
      if (claId === "yuki" && cfg.id === "hyouton" && proximoNivel === 1) {
        const temSuiton = poderes.some(p => p.id === "suiton" && p.nivel >= 1);
        const temFuuton = poderes.some(p => p.id === "fuuton" && p.nivel >= 1);
        const temNinpou = poderes.some(p => p.id === "ninpou" && p.nivel >= 1);
        if (!temSuiton) onComprar({ id: "suiton", nome: "Suiton", nivel: 1, gratis: true });
        if (!temFuuton) onComprar({ id: "fuuton", nome: "Fuuton", nivel: 1, gratis: true });
        if (!temNinpou) onComprar({ id: "ninpou", nome: "Ninpou", nivel: 1, gratis: true });
        mostrarToast(`Hyouton nível 1 adquirido! Ninpou, Suiton e Fuuton nível 1 concedidos gratuitamente.`);
      } else {
        mostrarToast(`${cfg.nome} nível ${proximoNivel} adquirido!${(ehCla && proximoNivel > 1) ? " (−1 pt)" : ehCla ? "" : " (−1 pt)"}`);
      }
      return;
    }
    onComprar({ id: cfg.id, nome: cfg.nome, nivel });
    mostrarToast(`${cfg.nome} nível ${nivel} adquirido!${nivel1Gratis ? "" : " (−1 pt)"}`);
  };

  const toggleNivel = (poderId, n) => {
    const key = `${poderId}-${n}`;
    setNiveisExpandidos(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [catAtiva, setCatAtiva] = useState("comuns");

  const YUKI_PERMITIDOS = ["hyouton", "suiton", "fuuton", "ninpou"];
  const ELEMENTAIS = ["doton", "fuuton", "katon", "raiton", "suiton", "mokuton", "hyouton"];

  const filtradosRestritos = PODERES_RESTRITOS_CONFIG.filter(p => {
    const matchBusca = busca === "" || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.desc || "").toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  const filtrados = catAtiva === "restritos" ? [] : PODERES_CONFIG.filter(p => {
    const matchBusca = busca === "" || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.desc || "").toLowerCase().includes(busca.toLowerCase());
    // Yuki: só pode ter hyouton, suiton e fuuton — bloqueia outros elementais
    if (claId === "yuki" && ELEMENTAIS.includes(p.id) && !YUKI_PERMITIDOS.includes(p.id)) return false;
    if (catAtiva === "cla") return matchBusca && !!p.cla && p.cla === claId;
    return matchBusca && !p.cla;
  });

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

        {/* Abas COMUNS / CLÃ / RESTRITOS */}
        {(() => {
          const temPoderCla = claId && PODERES_CONFIG.some(p => p.cla === claId);
          const tabs = [
            { id: "comuns", label: "COMUNS" },
            ...(temPoderCla ? [{ id: "cla", label: "✦ ESPECIAIS DO CLÃ" }] : []),
            { id: "restritos", label: "RESTRITOS" },
          ];
          const tabCor = { comuns: "#4a90e2", cla: "#c79255", restritos: "#ef4444" };
          return (
            <div className="fn-loja-cats">
              {tabs.map(tab => {
                const ativa = catAtiva === tab.id;
                const cor = tabCor[tab.id] || "#4a90e2";
                return (
                  <button
                    key={tab.id}
                    className={`fn-loja-cat-btn ${ativa ? "fn-loja-cat-ativa" : ""}`}
                    style={ativa ? { color: cor, borderBottomColor: cor } : {}}
                    onClick={() => { setCatAtiva(tab.id); setBusca(""); }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* Lista de poderes */}
        <div className="fn-loja-lista">
          {filtrados.map(cfg => {
            const atual = nivelAtual(cfg.id);
            const exp = expandidos[cfg.id];
            const cor = cfg.cor;
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
                      {cfg.cla && (
                        <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#c79255", border: "1px solid #c7925544", borderRadius: 3, padding: "1px 6px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                          CLÃ {cfg.cla}
                        </span>
                      )}
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
                        const isAtual = n === atual;
                        const isComprado = n < atual;
                        const nivelKey = `${cfg.id}-${n}`;
                        const nivelExp = niveisExpandidos[nivelKey];
                        const ehCla = !!cfg.cla;
                        const nivel1Gratis = ehCla && n === 1 && atual === 0;
                        const custo = nivel1Gratis ? 0 : 1;
                        const semPontos = !nivel1Gratis && pontosRestantes !== undefined && custo > pontosRestantes;
                        // Progressão linear: só pode comprar o próximo nível
                        const naoEhProximo = n !== atual + 1;
                        const reqNivelCheck = nivelCfg.req ? verificarReqPoder(nivelCfg.req, ficha, poderes) : { ok: true };
                        const nivelBloqueado = poderBloqueado || naoEhProximo || !reqNivelCheck.ok;
                        const motivoBloqueio = poderBloqueado
                          ? reqPoderCheck.motivo
                          : naoEhProximo && !isComprado && !isAtual
                            ? `Requer Nível ${n - 1} primeiro`
                            : reqNivelCheck.motivo;

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
                                {(() => {
                                  const infoLimpo = (info || `Nível ${n}`).replace(/^Tier\s+\d+\s*[—–-]\s*/i, "");
                                  const lines = [
                                    `*Tier ${n}:* ${infoLimpo}`,
                                    !isAtual && !isComprado && !nivelBloqueado && (!ehCla || (ehCla && !nivel1Gratis)) ? `*Custo:* 1 pt` : null,
                                    !isAtual && !isComprado && nivelBloqueado ? `*Requer:* ${motivoBloqueio}` : null,
                                  ].filter(Boolean).join("\n");
                                  return (
                                    <RenderDesc
                                      text={lines}
                                      style={{
                                        fontSize: "0.82rem",
                                        color: isAtual ? cor : isComprado ? "#333" : nivelBloqueado ? "#4a2020" : "#aaa",
                                        lineHeight: 1.6,
                                      }}
                                    />
                                  );
                                })()}
                              </div>

                              {/* Botão expandir detalhe */}
                              {detalhe && !isComprado && (
                                <button
                                  onClick={e => { e.stopPropagation(); toggleNivel(cfg.id, n); }}
                                  style={{ background: "none", border: "none", color: nivelExp ? cor : "#2a4060", cursor: "pointer", fontSize: "0.7rem", padding: "2px 4px", flexShrink: 0 }}
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
                              <div style={{ padding: "10px 16px 14px 24px", background: "#0a1628", borderTop: `1px solid #1a3050` }}>
                                {(() => {
                                  // Strip existing "Tier N — " prefix from info
                                  const infoLimpo = (info || `Nível ${n}`).replace(/^Tier\s+\d+\s*[—–-]\s*/i, "");
                                  // Is it just a simple "+N something" line? (no bullet, no newline, short)
                                  const isSimples = !detalhe.includes("\n") && !detalhe.includes("•") && detalhe.length < 80;
                                  if (isSimples) {
                                    return <RenderDesc text={detalhe} style={{ fontSize: "0.82rem", color: "#888" }} />;
                                  }
                                  return (
                                    <RenderDesc
                                      text={`*Tier ${n}:* ${infoLimpo}${!ehCla ? "\n*Custo:* 1 pt" : ""}\n\n${detalhe}`}
                                      style={{ fontSize: "0.82rem", color: "#888" }}
                                    />
                                  );
                                })()}
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
          {catAtiva !== "restritos" && filtrados.length === 0 && <p className="fn-loja-vazio">Nenhum poder encontrado.</p>}

          {/* ── LISTA DE PODERES RESTRITOS ── */}
          {catAtiva === "restritos" && (
            filtradosRestritos.length === 0
              ? <p className="fn-loja-vazio">Nenhum poder restrito disponível.</p>
              : filtradosRestritos.map(cfg => {
                const atual = nivelAtual(cfg.id);
                const exp = expandidos[cfg.id];
                const cor = cfg.cor;
                const reqPoderCheck = verificarReqPoder(cfg.req, ficha, poderes);
                const poderBloqueado = !reqPoderCheck.ok;

                return (
                  <div key={cfg.id} className={`fn-loja-item${poderBloqueado ? " fn-fn-loja-item-bloqueado" : ""}`}>
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
                          <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#ef4444", border: "1px solid #ef444444", borderRadius: 3, padding: "1px 6px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>
                            RESTRITO
                          </span>
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
                        <div style={{ display: "flex", gap: 3, marginTop: 5, flexWrap: "wrap" }}>
                          {cfg.niveis.map(({ n }) => (
                            <div
                              key={n}
                              title={`Nível ${n}`}
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

                    {exp && (
                      <div className="fn-fn-loja-item-corpo" style={{ paddingLeft: 18 }}>
                        {cfg.desc && <RenderDesc text={cfg.desc} style={{ fontSize: "0.82rem", marginBottom: 10 }} />}
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
                          {cfg.niveis.map((nivelCfg) => {
                            const { n, info, detalhe } = nivelCfg;
                            const isAtual = n === atual;
                            const isComprado = n < atual;
                            const nivelKey = `r_${cfg.id}-${n}`;
                            const nivelExp = niveisExpandidos[nivelKey];
                            const naoEhProximo = n !== atual + 1;
                            const nivelBloqueado = poderBloqueado || naoEhProximo;
                            const semPontos = pontosRestantes !== undefined && 1 > pontosRestantes;

                            return (
                              <div key={n} style={{ borderRadius: 5, overflow: "hidden", border: `1px solid ${isAtual ? cor + "44" : isComprado ? "#0d1320" : nivelBloqueado ? "#2a1a1a" : "#0d1a2e"}` }}>
                                <div
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "6px 10px",
                                    background: isAtual ? `${cor}18` : isComprado ? "#050b14" : nivelBloqueado ? "#0d0608" : "#070e18",
                                    opacity: isComprado ? 0.45 : 1,
                                    cursor: detalhe ? "pointer" : "default",
                                  }}
                                  onClick={() => detalhe && toggleNivel(`r_${cfg.id}`, n)}
                                >
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
                                  <div style={{ flex: 1 }}>
                                    <RenderDesc
                                      text={[
                                        `*Nível ${n}:* ${info || ""}`,
                                        !isAtual && !isComprado && !nivelBloqueado ? `*Custo:* 1 pt` : null,
                                        !isAtual && !isComprado && nivelBloqueado && !isComprado ? `*Requer:* ${n === atual + 1 ? reqPoderCheck.motivo : `Nível ${n - 1} primeiro`}` : null,
                                      ].filter(Boolean).join("\n")}
                                      style={{ fontSize: "0.82rem", color: isAtual ? cor : isComprado ? "#333" : nivelBloqueado ? "#4a2020" : "#aaa", lineHeight: 1.6 }}
                                    />
                                  </div>
                                  {detalhe && !isComprado && (
                                    <button
                                      onClick={e => { e.stopPropagation(); toggleNivel(`r_${cfg.id}`, n); }}
                                      style={{ background: "none", border: "none", color: nivelExp ? cor : "#2a4060", cursor: "pointer", fontSize: "0.7rem", padding: "2px 4px", flexShrink: 0 }}
                                    >
                                      <i className={`fas fa-chevron-${nivelExp ? "up" : "down"}`} />
                                    </button>
                                  )}
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
                                      title={nivelBloqueado ? (n === atual + 1 ? `Requisito: ${reqPoderCheck.motivo}` : `Requer Nível ${n - 1} primeiro`) : semPontos ? `Pontos insuficientes` : `Comprar nível ${n} — custo 1 pt`}
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (nivelBloqueado || semPontos) return;
                                        onComprar({ id: cfg.id, nome: cfg.nome, nivel: n });
                                        mostrarToast(`${cfg.nome} nível ${n} adquirido! (−1 pt)`);
                                      }}
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
                                {nivelExp && detalhe && !isComprado && (
                                  <div style={{ padding: "10px 16px 14px 24px", background: "#0a1628", borderTop: `1px solid #1a3050` }}>
                                    <RenderDesc text={detalhe} style={{ fontSize: "0.82rem", color: "#888" }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
              })
          )}
        </div>
      </div>
    </div>
  );
};

// ── Sub-componente: seção de Poderes dentro da aba Jutsus ─────────────────────
// ── ABA PODERES (aba dedicada) ────────────────────────────────────────────────
const AbaPoderes = ({ poderes, setPoderes, pontosRestantes, salvarAgora, ficha = {}, claId }) => {
  const [lojaAberta, setLojaAberta] = useState(false);
  const [filtroPoderes, setFiltroPoderes] = useState("");
  const [exp, setExp] = useState({});

  const comprarOuAtualizar = ({ id, nome, nivel, efeitos, gratis }) => {
    if (nivel === 0) { setPoderes(prev => prev.filter(p => p.id !== id)); setTimeout(salvarAgora, 100); return; }
    const jaExiste = poderes.find(p => p.id === id);
    if (jaExiste) {
      setPoderes(prev => prev.map(p => p.id === id ? { ...p, nivel, ...(efeitos !== undefined ? { efeitos } : {}), ...(gratis !== undefined ? { gratis } : {}) } : p));
    } else {
      const cfg = PODERES_CONFIG.find(c => c.id === id) || PODERES_RESTRITOS_CONFIG.find(c => c.id === id);
      setPoderes(prev => [...prev, { id, nome: cfg?.nome ?? nome, nivel, efeitos: efeitos || [], ...(gratis ? { gratis: true } : {}), ...(cfg?.restrito ? { restrito: true } : {}) }]);
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
        {(() => {
          const filtrados = poderes.filter(p => filtroPoderes === "" || p.nome.toLowerCase().includes(filtroPoderes.toLowerCase()));
          const comuns = filtrados.filter(p => !PODERES_CONFIG.find(c => c.id === p.id)?.cla);
          const cla = filtrados.filter(p => PODERES_CONFIG.find(c => c.id === p.id)?.cla);
          const renderPoder = (p) => {
            const cfg = PODERES_CONFIG.find(c => c.id === p.id) || PODERES_RESTRITOS_CONFIG.find(c => c.id === p.id);
            const cor = cfg?.cor || "#888";
            const expandido = exp[p.id];
            return (
              <div key={p.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${cor}44` }}>
                {/* Header */}
                <div className="fn-fn-aba-item-header" onClick={() => setExp(e => ({ ...e, [p.id]: !e[p.id] }))}>
                  <button className="fn-aba-chevron fn-fn-aba-chevron">
                    <i className={`fas fa-chevron-${expandido ? "up" : "down"}`} />
                  </button>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, border: `2px solid ${cor}`, display: "flex", alignItems: "center", justifyContent: "center", background: `${cor}15` }}>
                    <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.9rem", fontWeight: 900, color: cor, lineHeight: 1 }}>{p.nivel}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.85rem", fontWeight: 700, color: cor }}>{p.nome}</span>
                      {cfg?.cla && (
                        <span style={{ fontSize: "0.48rem", fontWeight: 800, color: "#c79255", border: "1px solid #c7925544", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>CLÃ {cfg.cla}</span>
                      )}
                      {cfg?.restrito && (
                        <span style={{ fontSize: "0.48rem", fontWeight: 800, color: "#ef4444", border: "1px solid #ef444444", borderRadius: 3, padding: "1px 5px", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>RESTRITO</span>
                      )}
                    </div>
                    {cfg && (
                      <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                        {cfg.niveis.map(({ n }) => (
                          <div key={n} style={{ width: 8, height: 8, borderRadius: "50%", background: n <= p.nivel ? cor : "transparent", border: `2px solid ${n <= p.nivel ? cor : "#1a2535"}` }} title={`Nível ${n}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); comprarOuAtualizar({ id: p.id, nome: p.nome, nivel: 0 }); }}
                    style={{ background: "none", border: "1px solid #1a1a1a", color: "#3a1a1a", borderRadius: 4, cursor: "pointer", padding: "4px 7px", fontSize: "0.7rem", flexShrink: 0, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#c0392b"; e.currentTarget.style.borderColor = "#c0392b"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#3a1a1a"; e.currentTarget.style.borderColor = "#1a1a1a"; }}
                  ><i className="fas fa-trash" /></button>
                </div>
                {expandido && (
                  <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                    <div className="fn-ataque-expandido-info" style={{ flex: 1, paddingRight: 4 }}>
                      {(() => {
                        const niveisComprados = cfg?.niveis?.filter(n => n.n <= p.nivel) ?? [];
                        if (niveisComprados.length === 0) return null;
                        const nivelVendo = exp[p.id + "_vendo"] ?? p.nivel;
                        const nivelVendoCfg = cfg?.niveis?.find(n => n.n === nivelVendo);
                        const idx = niveisComprados.findIndex(n => n.n === nivelVendo);
                        const temAnterior = idx > 0;
                        const temProximo = idx < niveisComprados.length - 1;
                        return (
                          <>
                            {/* Seletor de nível — fora do scroll */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexShrink: 0 }}>
                              <button
                                onClick={() => setExp(e => ({ ...e, [p.id + "_vendo"]: niveisComprados[idx - 1]?.n }))}
                                disabled={!temAnterior}
                                style={{ background: "none", border: `1px solid ${temAnterior ? cor : "#1a2535"}`, color: temAnterior ? cor : "#1a2535", borderRadius: 4, padding: "3px 8px", cursor: temAnterior ? "pointer" : "not-allowed", fontSize: "0.7rem", flexShrink: 0 }}
                              >‹</button>
                              <div style={{ flex: 1, textAlign: "center" }}>
                                <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.6rem", fontWeight: 800, color: cor, letterSpacing: "1.5px", textTransform: "uppercase" }}>
                                  NÍVEL {nivelVendo}{nivelVendo === p.nivel ? " — ATUAL" : ""}
                                </span>
                                {niveisComprados.length > 1 && (
                                  <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
                                    {niveisComprados.map(n => (
                                      <div
                                        key={n.n}
                                        onClick={() => setExp(e => ({ ...e, [p.id + "_vendo"]: n.n }))}
                                        style={{ width: 6, height: 6, borderRadius: "50%", background: n.n === nivelVendo ? cor : cor + "33", border: `1px solid ${cor}55`, cursor: "pointer", flexShrink: 0 }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setExp(e => ({ ...e, [p.id + "_vendo"]: niveisComprados[idx + 1]?.n }))}
                                disabled={!temProximo}
                                style={{ background: "none", border: `1px solid ${temProximo ? cor : "#1a2535"}`, color: temProximo ? cor : "#1a2535", borderRadius: 4, padding: "3px 8px", cursor: temProximo ? "pointer" : "not-allowed", fontSize: "0.7rem", flexShrink: 0 }}
                              >›</button>
                            </div>
                            {/* Conteúdo do nível — com scroll */}
                            <div style={{ maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
                              {nivelVendoCfg?.detalhe && (
                                <RenderDesc text={nivelVendoCfg.detalhe} style={{ fontSize: "0.78rem" }} />
                              )}
                              {PODERES_COM_EFEITOS.includes(p.id) && p.efeitos?.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ fontSize: "0.55rem", color: "#334", fontFamily: "'Be Vietnam Pro',sans-serif", letterSpacing: "0.5px", marginBottom: 5 }}>EFEITOS ESCOLHIDOS</div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {p.efeitos.map((ef, efIdx) => (
                                      <div key={efIdx} style={{ fontSize: "0.6rem", fontFamily: "'Be Vietnam Pro',sans-serif", fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: `${cor}18`, border: `1px solid ${cor}33`, color: cor, display: "flex", alignItems: "center", gap: 4 }}>
                                        <span style={{ color: "#334", fontWeight: 400 }}>Nv{ef.nivelEscolhido}</span>{ef.nome}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          };
          const sectionLabel = (label, count) => count > 0 ? (
            <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "1px", color: "#334", fontFamily: "'Be Vietnam Pro',sans-serif", padding: "10px 4px 4px", textTransform: "uppercase", borderBottom: "1px solid #0d1a28", marginBottom: 4 }}>
              {label} <span style={{ color: "#223", fontWeight: 400 }}>({count})</span>
            </div>
          ) : null;
          return (
            <>
              {sectionLabel("Comuns", comuns.length)}
              {comuns.map(renderPoder)}
              {sectionLabel("✦ Restritos de Clã", cla.length)}
              {cla.map(renderPoder)}
            </>
          );
        })()}
      </div>

      {lojaAberta && (
        <ModalLojaPoderes poderes={poderes} onComprar={comprarOuAtualizar} onFechar={() => setLojaAberta(false)} pontosRestantes={pontosRestantes} ficha={ficha} claId={claId} />
      )}
    </div>
  );
};

// ── PainelPontos ─────────────────────────────────────────────────────────────
// Exibe os contadores de EXP Ganha / Restante para cada categoria
const PainelPontos = ({ nc, atr, pericias, poderes, aptidoes, jutsus, ficha, setFicha, salvarAgora }) => {
  const evo = getEvolucao(parseInt(nc, 10) || 4);
  // Usa valores do banco se disponíveis e válidos (> 0), senão fallback para tabela hardcoded
  const totalAtr = (ficha?.pontos_atributo > 0) ? ficha.pontos_atributo : evo.atributos;
  const totalPericia = (ficha?.pontos_pericia > 0) ? ficha.pontos_pericia : evo.pericias;
  const totalPoder = (ficha?.pontos_poder > 0) ? ficha.pontos_poder : evo.poderes;

  const atrChaves = ["forca", "destreza", "agilidade", "percepcao", "inteligencia", "vigor", "espirito"];

  const gastosAtr = atrChaves.reduce((s, k) => s + (atr[k] ?? 0), 0);
  const gastosPericia = Object.values(pericias).reduce((s, v) => s + (v ?? 0), 0);

  // Tudo custa 1 ponto cada; poderes de clã: nível 1 grátis, demais custam 1 cada
  const gastosPoderes = poderes.reduce((total, p) => {
    if (p.nivel <= 0) return total;
    const cfg = PODERES_CONFIG.find(c => c.id === p.id) || PODERES_RESTRITOS_CONFIG.find(c => c.id === p.id);
    const gratis1 = p.gratis || (!!cfg?.cla && !cfg?.restrito); // nível 1 grátis para poderes de clã (não restritos)
    return total + (gratis1 ? Math.max(0, p.nivel - 1) : p.nivel);
  }, 0);
  const aptsPagas = aptidoes.filter(a => a.cat !== "gratuita" && a.cat !== "restrita").length;
  const gastosAptidoes = aptsPagas;
  const JUTSUS_BASICOS_IDS = new Set(["bunshin_no_jutsu","henge_no_jutsu","kai","kawarimi_no_jutsu","kinobori","shunshin_no_jutsu","tadayou"]);
  const gastosJutsus = jutsus.filter(j => {
    if (j.fromLivro && JUTSUS_BASICOS_IDS.has(j.fromLivro)) return false;
    if ((j.obs || "").toLowerCase().includes("grátis") || (j.obs || "").toLowerCase().includes("gratis")) return false;
    return true;
  }).length;

  const gastosPoder = gastosPoderes + gastosAptidoes + gastosJutsus;

  const linhas = [
    { label: "ATRIBUTOS", total: totalAtr, gastos: gastosAtr, cor: "#4a90e2", chave: "pontos_atributo" },
    { label: "PERÍCIAS", total: totalPericia, gastos: gastosPericia, cor: "#f0a020", chave: "pontos_pericia" },
    { label: "PODERES", total: totalPoder, gastos: gastosPoder, cor: "#b060e0", chave: "pontos_poder" },
  ];

  const handleTotalChange = (chave, novoValor) => {
    if (!setFicha) return;
    setFicha(prev => ({ ...prev, [chave]: novoValor }));
    setTimeout(() => salvarAgora?.(), 100);
  };

  return (
    <div className="fn-painel-pontos">
      <div className="fn-painel-pontos-titulo">
        <span>PONTOS</span>
        <span className="fn-painel-pontos-nc">NC {parseInt(nc, 10) || 4} · {evo.nivelShinobi} · Mín. {ficha?.atributo_minimo ?? evo.minimo} · Lim. Atr. {parseInt(nc, 10) || 4} · Lim. Pod. {Math.floor((parseInt(nc, 10) || 4) / 2)}</span>
      </div>
      {linhas.map(({ label, total, gastos, cor, chave }) => {
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
                  <CampoNumerico
                    valor={total}
                    onChange={v => handleTotalChange(chave, Math.max(0, v))}
                    min={0}
                    className="fn-ponto-counter-val fn-ponto-total-editavel"
                  />
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
// ── ABA COMBATE ───────────────────────────────────────────────────────────────
const AbaCombate = ({ ataques, setAtaques, hcCalc, handleRolar, salvarAgora, atr = {}, aptidoes = [] }) => {
  const [modalAberta, setModalAberta] = useState(false);
  const [editando, setEditando] = useState(null);
  const [exp, setExp] = useState({});
  const [filtro, setFiltro] = useState("");

  const ataquesVazio = { nome: "", tipo: "CC", dano: "", critico: "15-16", atributo: "", imagem: null, descricao: "" };

  const salvar = (atq) => {
    if (editando?.id) {
      setAtaques(p => p.map(a => a.id === editando.id ? { ...atq, id: editando.id } : a));
    } else {
      setAtaques(p => [...p, { ...atq, id: Date.now() }]);
    }
    setModalAberta(false);
    setEditando(null);
    setTimeout(salvarAgora, 100);
  };

  const remover = (id) => { setAtaques(p => p.filter(a => a.id !== id)); setTimeout(salvarAgora, 100); };

  const rolar = (atq) => {
    if (!handleRolar) return;
    const hcVal = hcCalc[atq.tipo] ?? 0;
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const criticoMin = atq.critico ? parseInt(atq.critico.split("-")[0], 10) : 15;
    const falhaCritica = soma <= 3;
    const critico = soma >= criticoMin;
    const grau = soma <= 3 ? 0 : soma <= 8 ? 1 : soma <= 11 ? 2 : soma <= 14 ? 3 : 4;
    const ataqueTotal = soma + hcVal;

    // Bônus de metade atributo no dano:
    // CC → metade Força (ou metade Destreza com Acuidade)
    // CD → metade Destreza
    const temAcuidade = aptidoes.some(a => a.id === "acuidade" || a.id === "g_acuidade" || (a.nome || "").toLowerCase() === "acuidade");
    let bonusAtrDano = 0;
    let nomeAtrDano = "FOR";
    if (atq.tipo === "CC") {
      if (temAcuidade) { bonusAtrDano = Math.floor((atr.destreza ?? 0) / 2); nomeAtrDano = "DES"; }
      else              { bonusAtrDano = Math.floor((atr.forca    ?? 0) / 2); nomeAtrDano = "FOR"; }
    } else {
      bonusAtrDano = Math.floor((atr.destreza ?? 0) / 2); nomeAtrDano = "DES";
    }

    // Calcula dano: danoArmaBase + bonusAtrDano (metade atr), depois × grau
    let danoRolls = [0], danoBonus = 0, danoTotal = 0;
    let danoArmaBase = 0;
    if (atq.dano) {
      const str = String(atq.dano).toUpperCase().replace(/\s/g, "");
      const dadoRx = /([0-9]*)D([0-9]+)/g;
      let m; let processado = str; danoRolls = [];
      while ((m = dadoRx.exec(str)) !== null) {
        const q = parseInt(m[1] || "1", 10);
        const f = parseInt(m[2], 10);
        for (let i = 0; i < q; i++) danoRolls.push(Math.floor(Math.random() * f) + 1);
        processado = processado.replace(m[0], "");
      }
      if (danoRolls.length === 0) {
        const n = parseInt(str.replace(/[^0-9-]/g, ""), 10);
        danoArmaBase = isNaN(n) ? 0 : Math.abs(n);
        danoRolls = [danoArmaBase];
        danoBonus = bonusAtrDano;
        const danoBaseFinal = danoArmaBase + bonusAtrDano;
        danoTotal = grau >= 2 ? danoBaseFinal * grau : danoBaseFinal;
      } else {
        const bonusMatch = processado.replace(/\s/g, "").match(/^([+-][0-9]+)$/);
        const bonusArma = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
        danoArmaBase = danoRolls.reduce((a, b) => a + b, 0) + bonusArma;
        danoBonus = bonusArma + bonusAtrDano;
        const danoBaseFinal = danoRolls.reduce((a, b) => a + b, 0) + danoBonus;
        danoTotal = grau >= 2 ? danoBaseFinal * grau : danoBaseFinal;
      }
    } else if (bonusAtrDano > 0) {
      danoArmaBase = 0;
      danoRolls = [bonusAtrDano];
      danoTotal = grau >= 2 ? bonusAtrDano * grau : bonusAtrDano;
    }
    handleRolar(null, null, null, {
      label: `${atq.nome} — ${atq.tipo}`,
      d1, d2, precisao: hcVal, bonus: 0,
      total: danoTotal, ataqueTotal,
      critico, falhaCritica, grau,
      isDano: true, danoRolls, danoBonus,
      danoArmaBase,
      bonusAtrDano,
      nomeAtrDano,
      timestamp: makeTimestamp(),
    });
  };

  const filtrados = ataques.filter(a => filtro === "" || a.nome.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">
      <div className="fn-aba-filtro-row fn-aba-filtro-com-btn">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar combates" value={filtro} onChange={e => setFiltro(e.target.value)} />
        <button className="fn-aba-btn-novo" onClick={() => { setEditando(null); setModalAberta(true); }}>+ CRIAR</button>
      </div>

      <div className="fn-aba-lista">
        {filtrados.length === 0 && <p className="fn-aba-vazio">{ataques.length === 0 ? "Nenhum ataque criado ainda." : "Nenhum resultado."}</p>}
        {filtrados.map(atq => (
          <div key={atq.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${atq.tipo === "CC" ? "#e05050" : "#4a90e2"}44` }}>
            <div className="fn-fn-aba-item-header" onClick={() => setExp(p => ({ ...p, [atq.id]: !p[atq.id] }))}>
              <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${exp[atq.id] ? "up" : "down"}`} /></button>
              {atq.imagem && <img src={atq.imagem} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome">{atq.nome || "Sem nome"}</span>
                <div style={{ marginTop: 2 }}>
                  <RenderDesc
                    text={[
                      atq.dano ? `*Dano:* ${atq.dano}` : null,
                      atq.critico ? `*Crítico:* ${atq.critico}` : null,
                    ].filter(Boolean).join("      ")}
                    style={{ fontSize: "0.75rem" }}
                  />
                </div>
              </div>
              <button className="fn-btn-rolar fn-hc-rolar" title={`Rolar ${atq.tipo}`} onClick={e => { e.stopPropagation(); rolar(atq); }}>
                <i className="fas fa-dice-d20" />
              </button>
            </div>
            {exp[atq.id] && (
              <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                <div className="fn-ataque-expandido-info" style={{ flex: 1 }}>
                  <RenderDesc
                    text={[
                      `*Tipo de Ataque:* ${atq.tipo === "CC" ? "Combate Corporal [2d8 + CC]" : "Combate à Distância [2d8 + CD]"}`,
                      atq.atributo ? `*Atributo:* ${atq.atributo.charAt(0).toUpperCase() + atq.atributo.slice(1)}` : null,
                      atq.descricao ? `*Descrição:* ${atq.descricao}` : null,
                    ].filter(Boolean).join("\n")}
                    style={{ fontSize: "0.82rem", marginBottom: 8 }}
                  />
                </div>
                <div className="fn-item-acoes">
                  <div className="fn-item-acoes-esq">
                    <button className="fn-btn-editar-item" onClick={e => { e.stopPropagation(); setEditando(atq); setModalAberta(true); }}>EDITAR</button>
                  </div>
                  <button className="fn-aba-btn-remover" onClick={e => { e.stopPropagation(); remover(atq.id); }}>REMOVER</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalAberta && (
        <ModalCriarAtaque
          inicial={editando || ataquesVazio}
          onSalvar={salvar}
          onFechar={() => { setModalAberta(false); setEditando(null); }}
        />
      )}
    </div>
  );
};

const ModalCriarAtaque = ({ inicial, onSalvar, onFechar }) => {
  const [form, setForm] = useState({ nome: "", tipo: "CC", dano: "", critico: "15-16", atributo: "", imagem: null, descricao: "", ...inicial });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const imagemRef = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (inicial?.descricao && descRef.current) descRef.current.innerHTML = inicial.descricao;
    return () => { document.body.style.overflow = prev || ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImagem = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("imagem", ev.target.result);
    reader.readAsDataURL(file);
  };

  const aplicarFormato = (cmd) => { descRef.current?.focus(); document.execCommand(cmd, false, null); };

  const inp = {
    style: {
      background: "#0e0c08", border: "1px solid #2a2218", borderRadius: "4px",
      color: "#fff", fontFamily: "'Google Sans', sans-serif", fontSize: "0.88rem",
      padding: "6px 10px", outline: "none", boxSizing: "border-box", width: "100%",
      transition: "border-color 0.2s",
    },
    onFocus: e => e.target.style.borderColor = "#4a90e2",
    onBlur: e => e.target.style.borderColor = "#2a2218",
  };
  const lbl = { style: { fontFamily: "'Google Sans', sans-serif", fontSize: "0.65rem", color: "#777", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px", display: "block" } };
  const field = { style: { display: "flex", flexDirection: "column" } };


  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.80)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 900, backdropFilter: "blur(2px)", padding: "60px 16px 1px", boxSizing: "border-box", overscrollBehavior: "contain" }} onClick={onFechar}>
      <div style={{ background: "#080d12", border: "1px solid #4a90e2", borderRadius: "12px", width: "100%", maxWidth: "520px", maxHeight: "700px", height: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 48px rgba(0,0,0,0.8)", overflow: "hidden", overscrollBehavior: "contain", isolation: "isolate", margin: "auto" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid #0d1a28", flexShrink: 0 }}>
          <span style={{ fontFamily: "'Google Sans', sans-serif", fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>{inicial.id ? "Editar Ataque" : "Novo Ataque"}</span>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#666", fontSize: "1.2rem", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", transition: "color .15s" }} onMouseOver={e => e.currentTarget.style.color = "#4a90e2"} onMouseOut={e => e.currentTarget.style.color = "#666"}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 4px", display: "flex", flexDirection: "column", gap: "14px", scrollbarWidth: "thin", scrollbarColor: "#1a2535 #060a0e" }}>

          {/* Nome */}
          <div {...field}>
            <label {...lbl}>Nome *</label>
            <input {...inp} value={form.nome} onChange={e => set("nome", e.target.value)} />
          </div>

          {/* Tipo + Dano + Crítico */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
            <div {...field}>
              <label {...lbl}>Tipo de Ataque</label>
              <select {...inp} style={{ ...inp.style, cursor: "pointer" }} value={form.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="CC">Combate Corporal [2d8 + CC]</option>
                <option value="CD">Combate à Distância [2d8 + CD]</option>
              </select>
            </div>
            <div {...field}>
              <label {...lbl}>Dano</label>
              <input {...inp} value={form.dano} onChange={e => set("dano", e.target.value)} />
            </div>
            <div {...field}>
              <label {...lbl}>Crítico</label>
              <input {...inp} value={form.critico} onChange={e => set("critico", e.target.value)} />
            </div>
          </div>

          {/* Atributo */}
          <div {...field}>
            <label {...lbl}>Atributo</label>
            <select {...inp} style={{ ...inp.style, cursor: "pointer" }} value={form.atributo} onChange={e => set("atributo", e.target.value)}>
              <option value="">— SELECIONE —</option>
              <option value="forca">Força</option>
              <option value="destreza">Destreza</option>
              <option value="agilidade">Agilidade</option>
              <option value="percepcao">Percepção</option>
              <option value="inteligencia">Inteligência</option>
              <option value="vigor">Vigor</option>
              <option value="espirito">Espírito</option>
            </select>
          </div>

          {/* Imagem */}
          <div {...field}>
            <label {...lbl}>Imagem</label>
            <div style={{ width: "72px", height: "72px", background: "#060a0e", border: "1px solid #1a2535", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", transition: "border-color .2s" }}
              onClick={() => imagemRef.current?.click()}
              onMouseOver={e => e.currentTarget.style.borderColor = "#4a90e2"}
              onMouseOut={e => e.currentTarget.style.borderColor = "#1a2535"}>
              {form.imagem
                ? <img src={form.imagem} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <i className="fas fa-image" style={{ color: "#2a4060", fontSize: "1.6rem" }} />}
            </div>
            <input ref={imagemRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagem} />
          </div>

          {/* Descrição com formatação */}
          <div {...field}>
            <label style={{ ...lbl.style, marginBottom: "6px" }}>Descrição</label>
            <div style={{ display: "flex", gap: "4px", padding: "6px 8px", background: "#060a0e", border: "1px solid #1a2535", borderBottom: "none", borderRadius: "4px 4px 0 0" }}>
              {[{ cmd: "bold", icon: "B", extra: { fontWeight: 900 } }, { cmd: "italic", icon: "I", extra: { fontStyle: "italic" } }, { cmd: "underline", icon: "U", extra: { textDecoration: "underline" } }].map(({ cmd, icon, extra }) => (
                <button key={cmd} onMouseDown={e => { e.preventDefault(); aplicarFormato(cmd); }}
                  style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontFamily: "'Google Sans', sans-serif", fontSize: "0.85rem", padding: "2px 8px", borderRadius: "3px", transition: "color .15s, background .15s", ...extra }}
                  onMouseOver={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "#0d1a28"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.background = "none"; }}>{icon}</button>
              ))}
            </div>
            <div ref={descRef} contentEditable suppressContentEditableWarning
              onInput={e => set("descricao", e.currentTarget.innerHTML)}
              style={{ background: "#060a0e", border: "1px solid #1a2535", borderRadius: "0 0 4px 4px", color: "#ccc", fontFamily: "'Google Sans', sans-serif", fontSize: "0.82rem", padding: "10px 12px", minHeight: "110px", outline: "none", lineHeight: 1.6, transition: "border-color .2s" }}
              onFocus={e => e.currentTarget.style.borderColor = "#4a90e2"}
              onBlur={e => e.currentTarget.style.borderColor = "#1a2535"} />
          </div>

          <div style={{ height: "6px", flexShrink: 0 }} />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "14px 22px 18px", borderTop: "1px solid #0d1a28", flexShrink: 0 }}>
          <button onClick={onFechar} style={{ background: "none", border: "1px solid #4a1a1a", color: "#c0392b", fontFamily: "'Google Sans', sans-serif", fontSize: "0.65rem", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", transition: "background .2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(192,57,43,.15)"} onMouseOut={e => e.currentTarget.style.background = "none"}>CANCELAR</button>
          <button onClick={() => { if (form.nome.trim() && form.atributo) onSalvar(form); }}
            style={{ background: "#4a90e2", border: "none", color: "#fff", fontFamily: "'Google Sans', sans-serif", fontSize: "12px", fontWeight: 600, letterSpacing: "0.5px", padding: "7px 20px", borderRadius: "4px", cursor: "pointer", transition: "opacity .2s", opacity: form.nome.trim() && form.atributo ? 1 : 0.45 }}
            onMouseOver={e => { if (form.nome.trim() && form.atributo) e.currentTarget.style.opacity = "0.8"; }}
            onMouseOut={e => { e.currentTarget.style.opacity = form.nome.trim() && form.atributo ? "1" : "0.45"; }}>
            {inicial.id ? "SALVAR" : "ADICIONAR"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalEditarJutsu = ({ jutsu, onSalvar, onFechar, poderes = [], atr = {} }) => {
  const [tmp, setTmp] = useState({ ...jutsu });
  const set = (k, v) => setTmp(p => ({ ...p, [k]: v }));
  return (
    <div className="fn-editar-overlay" onClick={onFechar}>
      <div className="fn-editar-modal" onClick={e => e.stopPropagation()} style={{ width: 460 }}>
        <div className="fn-editar-header">
          <span className="fn-editar-titulo">Editar Jutsu</span>
          <button className="fn-editar-fechar" onClick={onFechar}>×</button>
        </div>

        {/* TÉCNICA */}
        <div className="fn-editar-field">
          <label className="fn-editar-label">Técnica</label>
          <input className="fn-editar-input" value={tmp.nome || ""} onChange={e => set("nome", e.target.value)} />
        </div>

        {/* AÇÃO | ALCANCE */}
        <div style={{ display: "flex", gap: 12 }}>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Ação</label>
            <select className="fn-editar-input" value={tmp.acao || ""} onChange={e => set("acao", e.target.value)}>
              <option value="">—</option>
              {["Padrão", "Parcial", "Completa", "Livre", "Reação", "Movimento"].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Alcance</label>
            <input className="fn-editar-input" value={tmp.alcance || ""} onChange={e => set("alcance", e.target.value)} />
          </div>
        </div>

        {/* ALVO | DURAÇÃO */}
        <div style={{ display: "flex", gap: 12 }}>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Alvo / Área</label>
            <input className="fn-editar-input" value={tmp.alvo || ""} onChange={e => set("alvo", e.target.value)} />
          </div>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Duração</label>
            <input className="fn-editar-input" value={tmp.duracao || ""} onChange={e => set("duracao", e.target.value)} />
          </div>
        </div>

        {/* CUSTO DE CHAKRA | TESTE */}
        <div style={{ display: "flex", gap: 12 }}>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Custo de Chakra</label>
            <input className="fn-editar-input" value={tmp.custo || ""} onChange={e => set("custo", e.target.value)} />
          </div>
          <div className="fn-editar-field" style={{ flex: 1 }}>
            <label className="fn-editar-label">Teste</label>
            <select className="fn-editar-input" value={tmp.teste || "CD"} onChange={e => set("teste", e.target.value)}>
              <option value="CD">CD</option>
              <option value="CC">CC</option>
            </select>
          </div>
        </div>

        {/* ATRIBUTO */}
        <div className="fn-editar-field">
          <label className="fn-editar-label">Atributo</label>
          <select className="fn-editar-input" value={tmp.atributo_acerto || ""} onChange={e => set("atributo_acerto", e.target.value)}>
            <option value="">— Nenhum —</option>
            <option value="forca">Força ({atr.forca ?? 0})</option>
            <option value="destreza">Destreza ({atr.destreza ?? 0})</option>
            <option value="agilidade">Agilidade ({atr.agilidade ?? 0})</option>
            <option value="percepcao">Percepção ({atr.percepcao ?? 0})</option>
            <option value="inteligencia">Inteligência ({atr.inteligencia ?? 0})</option>
            <option value="vigor">Vigor ({atr.vigor ?? 0})</option>
            <option value="espirito">Espírito ({atr.espirito ?? 0})</option>
          </select>
        </div>

        {/* DESCRIÇÃO — altura fixa */}
        <div className="fn-editar-field">
          <label className="fn-editar-label">Descrição</label>
          <textarea className="fn-editar-textarea" value={tmp.anotacoes || ""} onChange={e => set("anotacoes", e.target.value)}
            style={{ height: 100, resize: "none" }} />
        </div>

        <div className="fn-editar-btns">
          <button className="fn-editar-btn-cancelar" onClick={onFechar}>CANCELAR</button>
          <button className="fn-editar-btn-salvar" onClick={() => { onSalvar(tmp); onFechar(); }}>SALVAR</button>
        </div>
      </div>
    </div>
  );
};


const AbaJutsus = ({ jutsus, setJutsus, handleRolar, hcCalc, ficha, poderes, setPoderes, pontosRestantes, salvarAgora, pericias = {}, atr = {}, aptidoes = [] }) => {
  const [filtro, setFiltro] = useState("");
  const [exp, setExp] = useState({});
  const [lojaAberta, setLojaAberta] = useState(false);
  const [editando, setEditando] = useState(null);

  const espiritoBase = atr.espirito ?? 0;
  const danoEspBonus = Math.ceil(espiritoBase / 2);

  const calcAcerto = (j) => (hcCalc[j.teste || "CD"] ?? 0) + (j.atributo_acerto ? (atr[j.atributo_acerto] ?? 0) : 0);
  const calcDano = (j) => (parseInt(j.nivel_poder, 10) || 0) + danoEspBonus;

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
          const testeLabel = j.teste || "CD";
          const acertoVal = calcAcerto(j);
          const danoVal = calcDano(j);
          const nivelUsado = parseInt(j.nivel_poder, 10) || 0;
          return (
            <div key={j.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${cor}44` }}>
              {/* HEADER colapsado */}
              <div className="fn-fn-aba-item-header" onClick={() => setExp(p => ({ ...p, [j.id]: !p[j.id] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${exp[j.id] ? "up" : "down"}`} /></button>
                <div className="fn-fn-aba-item-info">
                  <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome">{j.nome || <em style={{ color: "#555" }}>Sem nome</em>}</span>
                  {j.tipo && <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.72rem", color: cor }}>{j.tipo.charAt(0).toUpperCase() + j.tipo.slice(1)}</span>}
                </div>
                {(() => {
                  const BASICOS_SEM_ROLAR = new Set(["bunshin_no_jutsu","henge_no_jutsu","kai","kawarimi_no_jutsu","kinobori","shunshin_no_jutsu","tadayou"]);
                  const ehUtilitario = (j.fromLivro && BASICOS_SEM_ROLAR.has(j.fromLivro)) || (!j.nivel_poder && !j.teste);
                  if (ehUtilitario) return null;
                  return (
                <button className="fn-aba-icon-btn" onClick={e => {
                  e.stopPropagation();
                  const { d1, d2 } = rolar2d8();
                  const soma = d1 + d2;
                  const criticoMin = 15;
                  const falhaCritica = soma <= 3;
                  const critico = soma >= criticoMin;
                  const grau = soma <= 3 ? 0 : soma <= 8 ? 1 : soma <= 11 ? 2 : soma <= 14 ? 3 : 4;
                  const ataqueTotal = soma + acertoVal;
                  const danoBase = danoVal;
                  const danoTotal = grau >= 2 ? danoBase * grau : danoBase;
                  handleRolar(null, null, null, {
                    label: j.nome || "Jutsu",
                    d1, d2, precisao: acertoVal, bonus: 0,
                    total: danoTotal, ataqueTotal,
                    critico, falhaCritica, grau,
                    isDano: true, danoRolls: [danoBase], danoBonus: 0,
                    timestamp: makeTimestamp(),
                  });
                }}>
                  <i className="fas fa-dice-d20" />
                </button>
                  );
                })()}
              </div>

              {/* EXPANDIDO: info + botões */}
              {exp[j.id] && (
                <div className="fn-ataque-expandido fn-fn-ataque-expandido">
                  <div className="fn-ataque-expandido-info" style={{ flex: 1, maxHeight: 200, overflowY: "auto", paddingRight: 4 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span className="fn-ataque-detalhe">{testeLabel}: <strong style={{ color: "#4a90e2" }}>{acertoVal}</strong></span>
                      <span className="fn-ataque-detalhe">Dano: <strong style={{ color: "#22c55e" }}>{danoVal}</strong></span>
                      {nivelUsado > 0 && <span className="fn-ataque-detalhe">Nível usado: <strong style={{ color: "#aaa" }}>{nivelUsado}</strong></span>}
                      {j.acao && <span className="fn-ataque-detalhe">Ação: <strong style={{ color: "#aaa" }}>{j.acao}</strong></span>}
                      {j.alcance && j.alcance !== "-" && <span className="fn-ataque-detalhe">Alcance: <strong style={{ color: "#aaa" }}>{j.alcance}</strong></span>}
                      {j.alvo && <span className="fn-ataque-detalhe">Alvo: <strong style={{ color: "#aaa" }}>{j.alvo}</strong></span>}
                      {j.duracao && <span className="fn-ataque-detalhe">Duração: <strong style={{ color: "#aaa" }}>{j.duracao}</strong></span>}
                      {j.custo && <span className="fn-ataque-detalhe">Chakra: <strong style={{ color: "#aaa" }}>{j.custo}</strong></span>}
                    </div>
                    {j.anotacoes && <RenderDesc text={j.anotacoes} />}
                  </div>
                  <div className="fn-item-acoes">
                    <div className="fn-item-acoes-esq">
                      <button className="fn-btn-editar-item" onClick={e => { e.stopPropagation(); setEditando({ ...j }); }}>EDITAR</button>
                    </div>
                    <button className="fn-aba-btn-remover" onClick={e => { e.stopPropagation(); setJutsus(p => p.filter(x => x.id !== j.id)); setTimeout(salvarAgora, 100); }}>REMOVER</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lojaAberta && (
        <ModalLojaJutsus jutsus={jutsus} onAdicionar={j => { setJutsus(p => [...p, j]); setTimeout(salvarAgora, 100); }} onFechar={() => setLojaAberta(false)} ficha={{ ...ficha, aptidoes: aptidoes, espirito: atr.espirito ?? ficha?.atr_espirito ?? 0 }} poderes={poderes} pontosRestantes={pontosRestantes} />
      )}

      {editando && (
        <ModalEditarJutsu
          jutsu={editando}
          poderes={poderes}
          atr={atr}
          onSalvar={novo => { setJutsus(p => p.map(x => x.id === novo.id ? novo : x)); setTimeout(salvarAgora, 100); }}
          onFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
};


// ── ABA MOCHILA NARUTO ────────────────────────────────────────────────────────
// ── Modal Loja de Itens (estilo TLOU, CSS Naruto) ─────────────────────────────
const ModalLojaItens = ({ ryos, onComprar, onFechar, claId, aptidoes = [] }) => {
  const [catAtiva, setCatAtiva] = useState("arremesso");
  const [abaAtiva, setAbaAtiva] = useState("loja"); // "loja" | "cla"
  const [expandidos, setExpandidos] = useState({});
  const [busca, setBusca] = useState("");

  // Nomes de armas marciais que o personagem tem proficiência via Usar Arma
  const armasPermitidas = aptidoes
    .filter(a => a.id === "usar_arma" || a.id === "g_usar_arma")
    .map(a => (a.obs || "").toLowerCase().trim())
    .filter(Boolean);

  const temUsarArma = (nomeArma) => {
    if (!nomeArma) return false;
    const n = nomeArma.toLowerCase().trim();
    return armasPermitidas.some(p => n.includes(p) || p.includes(n));
  };

  const isMarcial = (item) => item._cat === "armas_marciais" || item.categoria === "armas_marciais";
  const [toast, setToast] = useState(null);
  const [catalogo, setCatalogo] = useState({});
  const [carregando, setCarregando] = useState(true);

  // Itens de clã disponíveis para resgatar
  const itensCla = claId ? (CLA_INICIALIZACAO[claId]?.itens || []) : [];

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
            dano: item.dano ?? null,
            hc: item.hc ?? null,
            critico: item.critico ?? null,
            tipo: item.tipo ?? null,
            alcance: item.alcance ?? null,
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

        {/* Abas principais: LOJA / ITENS DE CLÃ */}
        <div className="fn-loja-cats">
          <button
            className={`fn-loja-cat-btn ${abaAtiva === "loja" ? "fn-loja-cat-ativa" : ""}`}
            style={abaAtiva === "loja" ? { color: "#4a90e2", borderBottomColor: "#4a90e2" } : {}}
            onClick={() => { setAbaAtiva("loja"); setBusca(""); }}
          >LOJA</button>
          {itensCla.length > 0 && (
            <button
              className={`fn-loja-cat-btn ${abaAtiva === "cla" ? "fn-loja-cat-ativa" : ""}`}
              style={abaAtiva === "cla" ? { color: "#c79255", borderBottomColor: "#c79255" } : {}}
              onClick={() => { setAbaAtiva("cla"); setBusca(""); }}
            >✦ ITENS DE CLÃ</button>
          )}
        </div>

        {/* Aba: Itens de Clã */}
        {abaAtiva === "cla" && (
          <div className="fn-loja-lista">
            {itensCla.map(item => {
              const expId = "cla_" + item.id;
              const exp = expandidos[expId];
              return (
                <div key={item.id} className="fn-loja-item" style={{ borderColor: "#1a2a1a" }}>
                  <div className="fn-fn-loja-item-header" style={{ cursor: "pointer" }} onClick={() => setExpandidos(p => ({ ...p, [expId]: !p[expId] }))}>
                    <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${exp ? "up" : "down"}`} /></button>
                    <div className="fn-fn-loja-item-info">
                      <div className="fn-fn-loja-item-nome-row">
                        <span className="fn-fn-loja-item-nome" style={{ color: "#c79255" }}>{item.nome}</span>
                        <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.6rem", fontWeight: 800, color: "#22c55e", background: "#051a0d", border: "1px solid #22c55e33", borderRadius: 3, padding: "1px 6px" }}>GRATUITO</span>
                        <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.5rem", fontWeight: 800, color: "#c79255", border: "1px solid #c7925544", borderRadius: 3, padding: "1px 5px", textTransform: "uppercase", letterSpacing: 1 }}>CLÃ {claId}</span>
                      </div>
                    </div>
                    <button
                      className="fn-fn-loja-item-add"
                      style={{ borderColor: "#c79255", color: "#c79255" }}
                      title={`Resgatar ${item.nome}`}
                      onClick={e => {
                        e.stopPropagation();
                        onComprar({ id: item.id, nome: item.nome, preco: 0, desc: item.descricao, comp: item.compartimentos, categoria: item.categoria, catKey: item.categoria, dano: item.dano ?? null, hc: item.hc ?? null, critico: item.critico ?? null, tipo: item.tipo ?? null, alcance: item.alcance ?? null, danoEscala: item.danoEscala ?? null });
                        mostrarToast(`${item.nome} resgatado!`);
                      }}
                    ><i className="fas fa-plus" /></button>
                  </div>
                  {exp && item.descricao && (
                    <div className="fn-fn-loja-item-corpo">
                      <RenderDesc text={item.descricao} style={{ fontSize: "0.8rem", color: "#888" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Aba: Loja normal */}
        {abaAtiva === "loja" && (<>
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
                          style={{
                            borderColor: (isMarcial(item) && !temUsarArma(item.nome)) ? "#3a1a1a" : cor,
                            color: (isMarcial(item) && !temUsarArma(item.nome)) ? "#4a2020" : cor,
                            cursor: (isMarcial(item) && !temUsarArma(item.nome)) ? "not-allowed" : "pointer",
                            opacity: (isMarcial(item) && !temUsarArma(item.nome)) ? 0.4 : 1,
                          }}
                          title={(isMarcial(item) && !temUsarArma(item.nome)) ? "Requer aptidão Usar Arma para esta arma" : `Adicionar ${item.nome} à mochila`}
                          onClick={e => {
                            e.stopPropagation();
                            if (isMarcial(item) && !temUsarArma(item.nome)) {
                              mostrarToast("Requer aptidão Usar Arma para esta arma marcial.", "erro");
                              return;
                            }
                            comprar(item);
                          }}
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
        </>)}
      </div>
    </div>
  );
};
const AbaMochilaNaruto = ({ itens, setItens, ryos, setRyos, nc, handleRolar, hcCalc = {}, claId, atr = {}, aptidoes = [] }) => {
  const [filtro, setFiltro] = useState("");
  const [exp, setExp] = useState({});
  const [lojaAberta, setLojaAberta] = useState(false);
  const [editando, setEditando] = useState(null); // item sendo editado

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
        // campos de arma
        dano: item.dano ?? null,
        hc: item.hc ?? null,
        critico: item.critico ?? null,
        tipo: item.tipo ?? null,
        alcance: item.alcance ?? null,
        danoEscala: item.danoEscala ?? null,
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

  const filtrados = itens.filter(i => i.nome.toLowerCase().includes(filtro.toLowerCase()));

  // Rola ataque (2d8 + hcVal) e dano separados, com crítico customizável
  const handleRolarArma = (item, hcKey, hcVal, danoDesc, criticoMin = 15, bonusAtr = 0, nomeAtr = "ATR") => {
    if (!handleRolar) return;
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const falhaCritica = soma <= 3;
    const grau = soma <= 3 ? 0 : soma <= 8 ? 1 : soma <= 11 ? 2 : soma <= 14 ? 3 : 4;
    const critico = soma >= criticoMin;
    const ataqueTotal = soma + hcVal;
    // Rola dano: danoBase (arma) + bonusAtr (metade atributo), depois × grau
    let danoRolls = [0];
    let danoBonus = 0;
    let danoTotal = 0;
    let danoArmaBase = 0; // dano puro da arma (sem metade atr)
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
        // Só termos fixos (ex: "+4", "+2")
        const terms = str.match(/[+-]?\d+/g) || [];
        const n = terms.reduce((acc, t) => acc + parseInt(t, 10), 0);
        danoArmaBase = isNaN(n) ? 0 : Math.abs(n);
        danoRolls = [danoArmaBase];
        danoBonus = bonusAtr;
        const danoBaseFinal = danoArmaBase + bonusAtr;
        danoTotal = grau >= 2 ? danoBaseFinal * grau : danoBaseFinal;
      } else {
        const bonusMatch = processado.replace(/\s/g, "").match(/^([+-][0-9]+)$/);
        const bonusArma = bonusMatch ? parseInt(bonusMatch[1], 10) : 0;
        danoArmaBase = danoRolls.reduce((a, b) => a + b, 0) + bonusArma;
        danoBonus = bonusArma + bonusAtr;
        const danoBaseFinal = danoRolls.reduce((a, b) => a + b, 0) + danoBonus;
        danoTotal = grau >= 2 ? danoBaseFinal * grau : danoBaseFinal;
      }
    } else if (bonusAtr > 0) {
      danoArmaBase = 0;
      danoRolls = [bonusAtr];
      danoBonus = 0;
      danoTotal = grau >= 2 ? bonusAtr * grau : bonusAtr;
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
      danoArmaBase,
      bonusAtrDano: bonusAtr,
      nomeAtrDano: nomeAtr,
      timestamp: makeTimestamp(),
    };
    handleRolar(null, null, null, entrada);
  };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">

      {/* Ryos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #0d1a28", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="fas fa-coins" style={{ color: "#f39c12", fontSize: "0.9rem" }} />
          <span style={{ fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "0.58rem", fontWeight: 800, color: "#f39c1288", letterSpacing: "2px" }}>RYOS</span>
        </div>
        <input
          type="text"
          value={ryos === null || ryos === undefined ? "" : ryos}
          onChange={e => {
            const v = e.target.value;
            if (v === "") { setRyos(0); return; }
            const n = parseInt(v, 10);
            if (!isNaN(n)) setRyos(n);
          }}

          className="no-spinner"
          style={{ background: "transparent", border: "none", outline: "none", color: "#f39c12", fontFamily: "'Be Vietnam Pro',sans-serif", fontSize: "1.1rem", fontWeight: 900, width: 80, textAlign: "right" }}
        />
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
          const isArmaCC = ["armas_simples", "armas_marciais", "armas"].includes(catKey) || item.hc === "CC";
          const isArmaCD = ["arremesso", "disparo"].includes(catKey) || item.hc === "CD";
          const temDanoNaDesc = /dano/i.test(item.descricao || "");
          const isArma = isArmaCC || isArmaCD || (temDanoNaDesc && catKey === "");
          // Dano dinâmico: se item.danoEscala existir, calcula com base nos atributos atuais
          const temAcuidade = aptidoes.some(a => a.id === "acuidade" || a.id === "g_acuidade" || (a.nome || "").toLowerCase() === "acuidade");
          // Espada de Chakra Branco (Hatake): usa Espírito no lugar de Força no dano
          const isEspadaChakraBranco = item.catalogId === "espada_chakra_branco" || item.id === "espada_chakra_branco" || (item.nome || "").toLowerCase().includes("chakra branco");
          // metade atributo para somar ao dano SEPARADO (passado para handleRolarArma)
          const { bonusAtrMochila, nomeAtrMochila } = (() => {
            if (item.atributo_dano) {
              const k = item.atributo_dano;
              return { bonusAtrMochila: Math.floor((atr[k] ?? 0) / 2), nomeAtrMochila: k.slice(0,3).toUpperCase() };
            }
            if (isEspadaChakraBranco) return { bonusAtrMochila: Math.floor((atr.espirito ?? 0) / 2), nomeAtrMochila: "ESP" };
            if (isArmaCD)             return { bonusAtrMochila: Math.floor((atr.destreza ?? 0) / 2), nomeAtrMochila: "DES" };
            if (temAcuidade)          return { bonusAtrMochila: Math.floor((atr.destreza ?? 0) / 2), nomeAtrMochila: "DES" };
            return                           { bonusAtrMochila: Math.floor((atr.forca    ?? 0) / 2), nomeAtrMochila: "FOR" };
          })();

          const calcDano = () => {
            // Retorna apenas o dano base da arma (sem embutir o metade atributo)
            // O metade atributo é passado separado via bonusAtrMochila → handleRolarArma
            let base = null;
            if (item.danoEscala && Array.isArray(item.danoEscala)) {
              let dano = item.dano ?? "+0";
              const sorted = [...item.danoEscala].sort((a, b) => a.minAtr - b.minAtr);
              for (const nivel of sorted) {
                const atrKey = (nivel.atr || "").toLowerCase();
                const atrVal = atr?.[atrKey] ?? 0;
                if (atrVal >= nivel.minAtr) dano = nivel.dano;
              }
              base = dano;
            } else {
              base = item.dano
                ? item.dano
                : item.descricao
                  ? (item.descricao.match(/\*[+]?(\d+[dD]\d+[+\-\d]*|[+]?\d+)\*\s*dano/i) || [])[1] ?? null
                  : null;
            }
            return base; // só o base; o metade atributo entra no handleRolarArma
          };
          const danoDesc = calcDano();
          const hcKey = isArmaCD ? "CD" : "CC";
          const hcVal = hcCalc[hcKey] ?? 0;
          // Crítico customizado (ex: "15-16" da espada do clã)
          const criticoCustom = item.critico ?? null;

          // Renderiza linha de descrição (mesmo parser do catálogo)
          return (
            <div key={item.id} className="fn-aba-item fn-fn-aba-item" style={{ borderLeft: `3px solid ${cor}44` }}>
              <div className="fn-fn-aba-item-header" onClick={() => setExp(p => ({ ...p, [item.id]: !p[item.id] }))}>
                <button className="fn-aba-chevron fn-fn-aba-chevron"><i className={`fas fa-chevron-${exp[item.id] ? "up" : "down"}`} /></button>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  {(() => {
                    const sep = item.nome.indexOf(": ");
                    if (sep === -1) return <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome">{item.nome}</span>;
                    return (
                      <>
                        <span className="fn-fn-aba-item-nome fn-fn-fn-aba-item-nome">{item.nome.slice(0, sep)}</span>
                        <span style={{ fontSize: "0.68rem", color: "#555", fontFamily: "'Be Vietnam Pro',sans-serif" }}>{item.nome.slice(sep + 2)}</span>
                      </>
                    );
                  })()}
                </div>
                {isArma && handleRolar ? (
                  <button
                    className="fn-btn-rolar fn-hc-rolar"
                    title={`Rolar ${hcKey}${danoDesc ? ` | Dano: ${danoDesc}+metadeAtr(${bonusAtrMochila})` : bonusAtrMochila ? ` | Dano: metadeAtr(${bonusAtrMochila})` : ""}${criticoCustom ? ` | Crítico: ${criticoCustom}` : ""}`}
                    onClick={e => { e.stopPropagation(); handleRolarArma(item, hcKey, hcVal, danoDesc, criticoCustom ? parseInt(criticoCustom.split("-")[0], 10) : 15, bonusAtrMochila, nomeAtrMochila); }}
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
                  <div className="fn-ataque-expandido-info" style={{ flex: 1, maxHeight: 220, overflowY: "auto", paddingRight: 4 }}>
                    {isArma && (
                      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        {danoDesc && (
                          <span className="fn-ataque-detalhe">
                            Dano: <strong style={{ color: "#22c55e" }}>{danoDesc}</strong>
                          </span>
                        )}
                        {criticoCustom && (
                          <span className="fn-ataque-detalhe">
                            Crítico: <strong style={{ color: "#f0a020" }}>{criticoCustom}</strong>
                          </span>
                        )}
                        {item.tipo && (
                          <span className="fn-ataque-detalhe">
                            Tipo: <strong style={{ color: "#aaa" }}>{item.tipo}</strong>
                          </span>
                        )}
                      </div>
                    )}
                    {item.descricao && <RenderDesc text={item.descricao} />}
                  </div>
                  <div className="fn-item-acoes">
                    <div className="fn-item-acoes-esq">
                      <button
                        className="fn-btn-vender"
                        onClick={e => { e.stopPropagation(); setRyos(r => (r || 0) + (item.preco || 0)); setItens(p => p.filter(x => x.id !== item.id)); }}
                        title={item.preco ? `Vender por ${item.preco} Ryos` : "Sem valor de venda"}
                      >VENDER{item.preco ? ` (+${item.preco})` : ""}</button>
                      <button
                        className="fn-btn-editar-item"
                        onClick={e => { e.stopPropagation(); setEditando({ ...item }); }}
                      >EDITAR</button>
                    </div>
                    <button
                      className="fn-aba-btn-remover"
                      onClick={e => { e.stopPropagation(); setItens(p => p.filter(x => x.id !== item.id)); }}
                    >REMOVER</button>
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
          claId={claId}
          aptidoes={aptidoes}
        />
      )}

      {editando && (
        <div className="fn-editar-overlay" onClick={() => setEditando(null)}>
          <div className="fn-editar-modal" onClick={e => e.stopPropagation()}>
            <div className="fn-editar-header">
              <span className="fn-editar-titulo">Editar Item</span>
              <button className="fn-editar-fechar" onClick={() => setEditando(null)}>×</button>
            </div>
            {[
              { label: "Nome", key: "nome" },
              { label: "Dano", key: "dano" },
              { label: "Crítico", key: "critico" },
              { label: "Alcance", key: "alcance" },
              { label: "Tipo", key: "tipo" },
              { label: "Compartimentos", key: "compartimentos" },
            ].map(({ label, key }) => (
              <div key={key} className="fn-editar-field">
                <label className="fn-editar-label">{label}</label>
                <input
                  className="fn-editar-input"
                  value={editando[key] ?? ""}
                  onChange={e => setEditando(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="fn-editar-field">
              <label className="fn-editar-label">Atributo</label>
              <select
                className="fn-editar-input"
                value={editando.atributo_dano ?? ""}
                onChange={e => setEditando(p => ({ ...p, atributo_dano: e.target.value }))}
              >
                <option value="">Nenhum</option>
                <option value="forca">Força</option>
                <option value="destreza">Destreza</option>
                <option value="agilidade">Agilidade</option>
                <option value="percepcao">Percepção</option>
                <option value="inteligencia">Inteligência</option>
                <option value="vigor">Vigor</option>
                <option value="espirito">Espírito</option>
              </select>
            </div>
            <div className="fn-editar-field">
              <label className="fn-editar-label">Descrição</label>
              <textarea
                className="fn-editar-textarea"
                value={editando.descricao ?? ""}
                onChange={e => setEditando(p => ({ ...p, descricao: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="fn-editar-btns">
              <button className="fn-editar-btn-cancelar" onClick={() => setEditando(null)}>CANCELAR</button>
              <button className="fn-editar-btn-salvar" onClick={() => { setItens(p => p.map(i => i.id === editando.id ? { ...editando } : i)); setEditando(null); }}>SALVAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
const FichaPersonagemNaruto = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ficha, setFicha] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Identidade
  const [nomePersonagem, setNomePersonagem] = useState("");
  const [nomeJogador, setNomeJogador] = useState("");
  const [nc, setNc] = useState("");

  // Energias
  const [vitalAtual, setVitalAtual] = useState(0);
  const [vitalMax, setVitalMax] = useState(0);
  const [chakraAtual, setChakraAtual] = useState(0);
  const [chakraMax, setChakraMax] = useState(0);
  const [ryos, setRyos] = useState(null);

  // Atributos editáveis localmente
  const [atrEdit, setAtrEdit] = useState({});

  // Bônus manuais para habilidades de combate e iniciativa
  const [hcBonus, setHcBonus] = useState({ CC: 0, CD: 0, ESQ: 0, LM: 0 });
  const [iniciativaBonus, setIniciativaBonus] = useState(0);
  const [reacaoBonus, setReacaoBonus] = useState(0);
  const [deslocamentoBonus, setDeslocamentoBonus] = useState(0);
  const [reducaoDano, setReducaoDano] = useState(0);
  const [pontosVisao, setPontosVisao] = useState(10);

  // Perícias — pontos gastos extras (além do base)
  const [pericias, setPericias] = useState({});

  // Aptidões adquiridas
  const [aptidoes, setAptidoes] = useState([]);

  // Abas direita
  const [abaAtiva, setAbaAtiva] = useState("jutsus");

  // Jutsus
  const [jutsus, setJutsus] = useState([]);
  const [ataques, setAtaques] = useState([]);

  // Poderes (Ninpou, Katon, etc.) com nível
  const [poderes, setPoderes] = useState([]);

  // Mochila
  const [itensMochila, setItensMochila] = useState([]);

  // Anotações


  // Rolagens
  const [resultado, setResultado] = useState(null);
  const [modalAtr, setModalAtr] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [painelAberto, setPainelAberto] = useState(false);
  const [modalTesteAberto, setModalTesteAberto] = useState(false);

  const fichaCarregada = useRef(false);
  const salvarTimer = useRef(null);
  const payloadRef = useRef(null);
  const nomeRef = useRef("");
  const nomeJogadorRef = useRef("");
  const ncRef = useRef("");
  const vitalAtualRef = useRef(0);
  const vitalMaxRef = useRef(0);
  const chakraAtualRef = useRef(0);
  const chakraMaxRef = useRef(0);
  const ryosRef = useRef(null);
  useEffect(() => { nomeRef.current = nomePersonagem; }, [nomePersonagem]);
  useEffect(() => { nomeJogadorRef.current = nomeJogador; }, [nomeJogador]);
  useEffect(() => { ncRef.current = nc; }, [nc]);
  useEffect(() => { vitalAtualRef.current = vitalAtual; }, [vitalAtual]);
  useEffect(() => { vitalMaxRef.current = vitalMax; }, [vitalMax]);
  useEffect(() => { chakraAtualRef.current = chakraAtual; }, [chakraAtual]);
  useEffect(() => { chakraMaxRef.current = chakraMax; }, [chakraMax]);
  useEffect(() => { ryosRef.current = ryos; }, [ryos]);
  const imagemRef = useRef(null);
  const fichaRef = useRef(null);

  // Refs espelho dos estados — sempre atualizados, usados no beforeunload
  const jutsusRef = useRef([]);
  const ataquesRef = useRef([]);
  const poderesRef = useRef([]);
  const aptidoesRef = useRef([]);
  const itensMochilaRef = useRef([]);
  const periciasRef = useRef({});
  const historicoRef = useRef([]);
  const atrEditRef = useRef({});
  const hcBonusRef = useRef({});
  const iniciativaBonusRef = useRef(0);
  const reacaoBonusRef = useRef(0);
  const deslocamentoBonusRef = useRef(0);
  const reducaoDanoRef = useRef(0);
  const pontosVisaoRef = useRef(10);
  useEffect(() => { jutsusRef.current = jutsus; }, [jutsus]);
  useEffect(() => { ataquesRef.current = ataques; }, [ataques]);
  useEffect(() => { poderesRef.current = poderes; }, [poderes]);
  useEffect(() => { aptidoesRef.current = aptidoes; }, [aptidoes]);
  useEffect(() => { itensMochilaRef.current = itensMochila; }, [itensMochila]);
  useEffect(() => { periciasRef.current = pericias; }, [pericias]);
  useEffect(() => { historicoRef.current = historico; }, [historico]);
  useEffect(() => { atrEditRef.current = atrEdit; }, [atrEdit]);
  useEffect(() => { hcBonusRef.current = hcBonus; }, [hcBonus]);
  useEffect(() => { iniciativaBonusRef.current = iniciativaBonus; }, [iniciativaBonus]);
  useEffect(() => { reacaoBonusRef.current = reacaoBonus; }, [reacaoBonus]);
  useEffect(() => { deslocamentoBonusRef.current = deslocamentoBonus; }, [deslocamentoBonus]);
  useEffect(() => { reducaoDanoRef.current = reducaoDano; }, [reducaoDano]);
  useEffect(() => { pontosVisaoRef.current = pontosVisao; }, [pontosVisao]);

  // ── Fetch ficha ──
  useEffect(() => {
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setFicha(data);
        fichaRef.current = data;
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
              if (atrCarregado.carisma === undefined && data.carisma != null) atrCarregado.carisma = data.carisma;
              if (atrCarregado.manipulacao === undefined && data.manipulacao != null) atrCarregado.manipulacao = data.manipulacao;
              setAtrEdit(atrCarregado);
            }
            if (extras.hcBonus) setHcBonus(extras.hcBonus);
            if (extras.iniciativaBonus !== undefined) setIniciativaBonus(extras.iniciativaBonus);
            if (extras.reacaoBonus !== undefined) setReacaoBonus(extras.reacaoBonus);
            if (extras.deslocamentoBonus !== undefined) setDeslocamentoBonus(extras.deslocamentoBonus);
            if (extras.reducaoDano !== undefined) setReducaoDano(extras.reducaoDano);
            if (extras.pontosVisao !== undefined) setPontosVisao(extras.pontosVisao);
            if (extras.aptidoes) setAptidoes(extras.aptidoes);
            if (extras.jutsus) setJutsus(extras.jutsus);
            if (extras.ataques) setAtaques(extras.ataques);
            if (extras.poderes) setPoderes(extras.poderes);
            if (extras.itensMochila) setItensMochila(extras.itensMochila);
          } catch (e) { console.error('[carregar] erro ao parsear dados_extras:', e); }
        } else {
          console.warn('[carregar] dados_extras vazio ou nulo');
          // Ficha nova — aplicar inicialização do clã
          const claId = getClaId(data.cla_nome || "");
          const init = CLA_INICIALIZACAO[claId];
          if (init) {
            if (init.aptidoes?.length) setAptidoes(init.aptidoes);
            if (init.poderes?.length) setPoderes(init.poderes.map(p => ({ ...p, efeitos: [] })));
            if (init.itens?.length) setItensMochila(init.itens.map((it, i) => ({ ...it, id: it.id || (Date.now() + i) })));
            if (init.jutsus?.length) setJutsus(init.jutsus.map((j, i) => ({ ...j, id: j.id || (Date.now() + i + 1000) })));
          }
        }
        setTimeout(() => { fichaCarregada.current = true; }, 600);
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
      reacaoBonus: reacaoBonusRef.current,
      deslocamentoBonus: deslocamentoBonusRef.current,
      reducaoDano: reducaoDanoRef.current,
      aptidoes: aptidoesRef.current,
      jutsus: jutsusRef.current,
      ataques: ataquesRef.current,
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
    const atrAtual = atrEditRef.current;
    const temAtrSalvo = ficha && (ficha.atr_forca || ficha.atr_destreza || ficha.atr_agilidade ||
      ficha.atr_percepcao || ficha.atr_inteligencia || ficha.atr_vigor || ficha.atr_espirito);
    if (temAtrSalvo && Object.keys(atrAtual).length === 0) return;
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
      dados_extras: JSON.stringify({ atrEdit, hcBonus, iniciativaBonus, reacaoBonus, deslocamentoBonus, reducaoDano, pontosVisao, aptidoes, jutsus, ataques, poderes, itensMochila }),
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
  }, [id, nomePersonagem, nomeJogador, nc, vitalAtual, vitalMax, chakraAtual, chakraMax, ryos, pericias, historico, atrEdit, hcBonus, iniciativaBonus, reacaoBonus, deslocamentoBonus, aptidoes, jutsus, poderes, itensMochila]); // eslint-disable-line

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
          reacaoBonus: reacaoBonusRef.current,
          deslocamentoBonus: deslocamentoBonusRef.current,
          reducaoDano: reducaoDanoRef.current,
          aptidoes: aptidoesRef.current,
          jutsus: jutsusRef.current,
          ataques: ataquesRef.current,
          poderes: poderesRef.current,
          itensMochila: itensMochilaRef.current,
        }),
      };
      fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(freshPayload),
        keepalive: true,
      }).catch(() => { });
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
      }).catch(() => { });
    }
    navigate("/personagens");
  };

  // ── Rolar 2d8 ──
  const handleRolar = useCallback((label, precisaoExtra = 0, bonusExtra = 0, entradaPreMontada = null) => {
    if (entradaPreMontada) {
      const entrada = { ...entradaPreMontada, personagem: nomeRef.current || "" };
      setResultado(entrada);
      setHistorico(h => [...h.slice(-99), entrada]);
      if (fichaRef.current?.campanha_id) {
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/naruto/campanhas/${fichaRef.current.campanha_id}/rolagens`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ficha_id: fichaRef.current.id,
            personagem: nomeRef.current,
            label: entrada.label,
            valor_dado: entrada.d1 ?? 0,
            bonus: entrada.bonus ?? 0,
            total: entrada.total,
            is_dano: false,
            critico_max: !!(entrada.critico),
            critico_min: !!(entrada.falhaCritica),
            hora: makeTimestamp().slice(-5),
          }),
        }).catch(() => { });
      }
      return;
    }
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const critico = soma >= 15;
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
    if (fichaRef.current?.campanha_id) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/naruto/campanhas/${fichaRef.current.campanha_id}/rolagens`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha_id: fichaRef.current.id,
          personagem: nomeRef.current,
          label,
          valor_dado: d1 + d2,
          bonus: precisaoExtra + bonusExtra,
          total,
          is_dano: false,
          critico_max: critico,
          critico_min: falhaCritica,
          hora: makeTimestamp().slice(-5),
        }),
      }).catch(() => { });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (fichaRef.current?.campanha_id) {
      fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/naruto/campanhas/${fichaRef.current.campanha_id}/rolagens`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ficha_id: fichaRef.current.id,
          personagem: nomeRef.current,
          label,
          valor_dado: d1,
          bonus,
          total,
          is_dano: false,
          critico_max: critico,
          critico_min: falhaCritica,
          hora: makeTimestamp().slice(-5),
        }),
      }).catch(() => { });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers derivados ──
  const _atrBase = {
    forca: atrEdit.forca !== undefined ? atrEdit.forca : (ficha?.atr_forca ?? 0),
    destreza: atrEdit.destreza !== undefined ? atrEdit.destreza : (ficha?.atr_destreza ?? 0),
    agilidade: atrEdit.agilidade !== undefined ? atrEdit.agilidade : (ficha?.atr_agilidade ?? 0),
    percepcao: atrEdit.percepcao !== undefined ? atrEdit.percepcao : (ficha?.atr_percepcao ?? 0),
    inteligencia: atrEdit.inteligencia !== undefined ? atrEdit.inteligencia : (ficha?.atr_inteligencia ?? 0),
    vigor: atrEdit.vigor !== undefined ? atrEdit.vigor : (ficha?.atr_vigor ?? 0),
    espirito: atrEdit.espirito !== undefined ? atrEdit.espirito : (ficha?.atr_espirito ?? 0),
    carisma: atrEdit.carisma !== undefined ? atrEdit.carisma : (ficha?.carisma ?? ficha?.atr_carisma ?? 0),
    manipulacao: atrEdit.manipulacao !== undefined ? atrEdit.manipulacao : (ficha?.manipulacao ?? ficha?.atr_manipulacao ?? 0),
  };
  const atr = ficha ? _atrBase : _atrBase;

  // ── Efeitos das aptidões ──────────────────────────────────────────────────
  const temApt = (id) => aptidoes.some(a => a.id === id || a.id === `g_${id}` || a.id === id.replace(/^g_/, ""));

  // Acuidade: CC usa Destreza
  const ccAtrBase = temApt("acuidade") ? (atr.destreza ?? 0) : (atr.forca ?? 0);

  // Bônus de HC vindo de aptidões
  const aptHcBonus = { CC: 0, CD: 0, ESQ: 0, LM: 0 };
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "hc") aptHcBonus[a.efeito.key] += a.efeito.val;
    // Especialista: +1 no CC ou CD conforme escolha (obs)
    if ((a.id === "especialista" || a.id === "g_especialista") && (a.obs === "CC" || a.obs === "CD")) {
      aptHcBonus[a.obs] += 1;
    }
  });

  // Bônus de Iniciativa vindo de aptidões (Diligente: +3)
  const aptIniciativaBonus = temApt("diligente") ? 3 : 0;

  // Bônus de perícia vindo de aptidões (Perito: +2)
  const aptPericiaBonus = {};
  aptidoes.forEach(a => {
    if (a.efeito?.tipo === "perito" && a.obs) {
      const key = a.obs.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      aptPericiaBonus[key] = (aptPericiaBonus[key] ?? 0) + 2;
    }
  });

  const hcCalc = ficha ? {
    CC: (ficha.hc_base_cc ?? 3) + ccAtrBase + (hcBonus.CC ?? 0) + aptHcBonus.CC,
    CD: (ficha.hc_base_cd ?? 3) + (atr.destreza ?? 0) + (hcBonus.CD ?? 0) + aptHcBonus.CD,
    ESQ: (ficha.hc_base_esq ?? 3) + (atr.agilidade ?? 0) + (hcBonus.ESQ ?? 0) + aptHcBonus.ESQ,
    LM: (ficha.hc_base_lm ?? 3) + (atr.percepcao ?? 0) + (hcBonus.LM ?? 0) + aptHcBonus.LM,
  } : {};

  const prontidaoCalc = Math.ceil((atr.percepcao ?? 0) / 2) + (pericias.prontidao ?? 0);
  const iniciativaCalc = (atr.agilidade ?? 0) + prontidaoCalc + iniciativaBonus + aptIniciativaBonus;
  const reacaoEsqCalc = (hcCalc.ESQ ?? 0) + 9 + reacaoBonus;
  // Velocista: dobra Agilidade para deslocamento
  const deslocamentoCalc = temApt("velocista")
    ? 10 + (atr.agilidade ?? 0) + deslocamentoBonus
    : 10 + Math.floor((atr.agilidade ?? 0) / 2) + deslocamentoBonus;



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
      <div className="fn-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="fn-voltar-btn" onClick={handleVoltar}>← VOLTAR</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {getClaIdFull(ficha) === "inuzuka" && (
            <button
              className="fn-voltar-btn"
              style={{ color: "#4a90e2", borderColor: "#4a90e2" }}
              onClick={() => navigate(`/personagem-naruto/${id}/animal`)}
            >
              COMPANHEIRO →
            </button>
          )}
          {(() => {
            const temKuchiyose = poderes.some(p =>
              p.id === "kuchiyose" ||
              (p.nome ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes("kuchiyose")
            );
            if (!temKuchiyose) return null;

            if (!ficha?.invocacao_id) {
              return (
                <button
                  className="fn-voltar-btn"
                  style={{ color: "#4a90e2", borderColor: "#4a90e2" }}
                  onClick={() => navigate(`/personagem-naruto/${id}/escolher-invocacao`)}
                >
                  SELECIONAR INVOCAÇÃO →
                </button>
              );
            }

            return (
              <button
                className="fn-voltar-btn"
                style={{ color: "#4a90e2", borderColor: "#4a90e2" }}
                onClick={() => navigate(`/personagem-naruto/${id}/invocacao`)}
              >
                INVOCAÇÃO →
              </button>
            );
          })()}
          <button
            className="fn-voltar-btn"
            style={{ color: painelAberto ? "#4a90e2" : "#4a90e2", borderColor: painelAberto ? "#f0a020" : "#4a90e2" }}
            onClick={() => setPainelAberto(p => !p)}
          >
            <i className="fa-solid fa-book" style={{ marginRight: 0 }} />
          </button>
        </div>
      </div>

      <div className="fn-sheet">

        {/* ── IDENTIDADE ── */}
        <div className="fn-identidade">
          <div className="fn-identidade-col">
            <span className="fn-id-label">PERSONAGEM</span>
            <CampoEditavel valor={nomePersonagem} onSalvar={setNomePersonagem} />
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NÍVEL SHINOBI</span>
            <span className="fn-id-static">{ficha.nivel_shinobi}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">JOGADOR</span>
            <CampoEditavel valor={nomeJogador} onSalvar={setNomeJogador} />
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
              onChange={e => {
                const ncNovo = parseInt(e.target.value, 10) || 4;
                const evoNova = getEvolucao(ncNovo);
                setNc(e.target.value);
                setVitalMax(10 + 3 * (atrEditRef.current.vigor ?? 0) + 5 * ncNovo);
                // Sempre atualiza pontos para o padrão da nova NC
                setFicha(prev => ({
                  ...prev,
                  pontos_atributo: evoNova.atributos,
                  pontos_pericia: evoNova.pericias,
                  pontos_poder: evoNova.poderes,
                }));
                setTimeout(() => salvarAgora?.(), 100);
              }}
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

            <div className="fn-avatar-wrapper" onClick={() => setShowCropModal(true)} style={{ cursor: "pointer" }}>
              {ficha.imagem
                ? <img src={ficha.imagem} alt={nomePersonagem} className="fn-avatar-img" />
                : <div className="fn-avatar-placeholder">{nomePersonagem?.[0]?.toUpperCase() || "?"}</div>
              }
              <div className="fn-avatar-edit-overlay"><i className="fas fa-camera" /></div>
            </div>

            {showCropModal && (
              <ImageCropModal
                src={ficha.imagem || null}
                onConfirm={handleSalvarImagem}
                onClose={() => setShowCropModal(false)}
              />
            )}

            {/* Energias */}
            <BarraEnergia label="VITALIDADE" cor="#e05050"
              valor={vitalAtual} max={vitalMax}
              onChange={setVitalAtual} onChangeMax={setVitalMax} />
            <BarraEnergia label="CHAKRA" cor="#4a90e2"
              valor={chakraAtual} max={chakraMax}
              onChange={setChakraAtual} onChangeMax={setChakraMax} />

            {/* Atributos */}
            <div className="fn-secao-titulo">ATRIBUTOS</div>
            <div className="fn-atributos-grid">
              {atributosConfig.filter(a => a.id !== "carisma" && a.id !== "manipulacao").map(a => (
                <div key={a.id} className="fn-atr-row">
                  <span className="fn-atr-sigla">{a.sigla}</span>
                  <span className="fn-atr-nome fn-atr-nome-clicavel" onClick={() => a.desc && setModalAtr(a)} title={a.desc ? "Ver descrição" : undefined}>{a.nome}{a.desc && <i className="fas fa-info-circle fn-atr-info-icon" />}</span>
                  <CampoNumerico
                    valor={atr[a.id] ?? 0}
                    onChange={v => {
                      setAtrEdit(prev => ({ ...prev, [a.id]: v }));
                      if (a.id === "vigor") {
                        const ncNum = parseInt(ncRef.current, 10) || 4;
                        setVitalMax(10 + 3 * v + 5 * ncNum);
                      }
                      if (a.id === "espirito") {
                        setChakraMax(10 + 3 * v);
                      }
                    }}
                    className="fn-atr-val"
                  />
                  <button
                    className="fn-btn-rolar fn-hc-rolar"
                    title={`Rolar ${a.nome}`}
                    onClick={() => handleRolar(a.nome, atr[a.id] ?? 0, 0)}
                  >
                    <i className="fas fa-dice-d20" />
                  </button>
                </div>
              ))}
            </div>

            {/* Habilidades de combate */}
            <div className="fn-secao-titulo">HABILIDADES DE COMBATE</div>
            <div className="fn-combate-grid">
              {[
                { sigla: "CC", nome: "Combate Corporal", key: "CC", desc: "Representa a habilidade do personagem em acertar ou bloquear ataques corporais, rebater projéteis ou tocar um alvo com precisão.\n\nCC é dependente do atributo Força (ou Destreza com a aptidão Acuidade). É usado em todo ataque corpo-a-corpo, manobras de combate, bloqueios e técnicas de toque. Aptidões como Especialista e Reflexos podem aumentar seu valor." },
                { sigla: "CD", nome: "Combate à Distância", key: "CD", desc: "Representa a capacidade do personagem de acertar alvos à distância, seja com projéteis como kunais e shurikens, seja com técnicas de longo alcance como o Canhão.\n\nCD é dependente do atributo Destreza. É o valor usado em todos os ataques à distância, incluindo armas de arremesso e efeitos de Ninjutsu que exigem teste de acerto." },
                { sigla: "ESQ", nome: "Esquiva", key: "ESQ", desc: "Mede o reflexo do personagem para evitar ser atingido — seja conscientemente desviando de um golpe, seja por instinto puro ao escapar de uma avalanche de pedras.\n\nESQ é dependente do atributo Agilidade. É a defesa padrão contra ataques físicos e à distância. A aptidão Reflexos concede +1 em Esquiva. Estar desprevenido remove os bônus de Esquiva." },
                { sigla: "LM", nome: "Ler Movimento", key: "LM", desc: "Mede a capacidade do personagem em prever e acompanhar os movimentos ofensivos do adversário, reagindo de forma elaborada com poderes defensivos e manobras de previsão.\n\nLM é dependente do atributo Percepção. É usado nas Manobras de Previsão, que em sua maioria são ações defensivas (não reações) e consomem ações do turno. A aptidão Intuição concede +1 em Ler Movimento." },
              ].map(h => {
                const base = (ficha[`hc_base_${h.key.toLowerCase()}`] ?? 3) + (
                  h.key === "CC" ? ccAtrBase :
                    h.key === "CD" ? (atr.destreza ?? 0) :
                      h.key === "ESQ" ? (atr.agilidade ?? 0) :
                        (atr.percepcao ?? 0)
                );
                return (
                  <div key={h.sigla} className="fn-hc-row">
                    <span className="fn-hc-sigla">{h.sigla}</span>
                    <span className="fn-hc-nome fn-atr-nome-clicavel" onClick={() => h.desc && setModalAtr({ nome: h.nome, sigla: h.sigla, desc: h.desc })} title={h.desc ? "Ver descrição" : undefined}>{h.nome}{h.desc && <i className="fas fa-info-circle fn-atr-info-icon" />}</span>
                    <CampoNumerico
                      valor={hcCalc[h.key]}
                      onChange={v => setHcBonus(prev => ({ ...prev, [h.key]: v - base - (aptHcBonus[h.key] ?? 0) }))}
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
              {[
                {
                  label: "INICIATIVA",
                  node: <CampoNumerico valor={iniciativaCalc} onChange={v => setIniciativaBonus(v - ((atr.agilidade ?? 0) + prontidaoCalc))} min={0} className="fn-stat-val" />,
                  extra: <button className="fn-btn-rolar fn-stat-rolar" onClick={() => handleRolar1d8("Iniciativa", iniciativaCalc)}><i className="fas fa-dice-d20" /></button>,
                },
                {
                  label: "REAÇÃO ESQ",
                  node: <CampoNumerico valor={reacaoEsqCalc} onChange={v => setReacaoBonus(v - ((hcCalc.ESQ ?? 0) + 9))} min={0} className="fn-stat-val" />,
                },
                {
                  label: "DESLOCAMENTO",
                  node: <CampoNumerico valor={deslocamentoCalc} onChange={v => { const base = temApt("velocista") ? 10 + (atr.agilidade ?? 0) : 10 + Math.floor((atr.agilidade ?? 0) / 2); setDeslocamentoBonus(v - base); }} min={0} className="fn-stat-val" />,
                  sufixo: "m",
                },
                {
                  label: "RED. DANO",
                  node: <CampoNumerico valor={reducaoDano} onChange={v => setReducaoDano(Math.max(0, v))} min={0} className="fn-stat-val" />,
                },
                ...(() => {
                  const temMangekyou = aptidoes.some(a =>
                    a.id === "r_mangekyou" || (a.nome || "").toLowerCase().includes("mangekyou")
                  );
                  if (!temMangekyou) return [];
                  return [{
                    label: "VISÃO",
                    node: <CampoNumerico valor={pontosVisao} onChange={v => setPontosVisao(Math.max(0, Math.min(10, v)))} min={0} className="fn-stat-val" />,
                    extra: <span style={{ fontSize: "0.55rem", color: pontosVisao <= 3 ? "#ef4444" : "#4a90e2" }}>/10 pts</span>,
                  }];
                })(),
              ].map(({ label, node, extra, sufixo }) => (
                <div key={label} style={{
                  flex: 1, minWidth: 70,
                  background: "#0c1424", border: "1px solid #0f1e33", borderRadius: 6,
                  padding: "6px 8px",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 2, textAlign: "center",
                }}>
                  <span className="fn-stat-label">{label}</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    {node}
                    {sufixo && <span style={{ fontSize: "0.6rem", color: "#4a6080" }}>{sufixo}</span>}
                  </div>
                  {extra && extra}
                </div>
              ))}
            </div>

            {/* Sociais */}
            <div className="fn-secao-titulo">SOCIAIS</div>
            <div className="fn-sociais-grid">
              <div className="fn-social-item">
                <span className="fn-social-label">CARISMA</span>
                <CampoNumerico
                  valor={atr.carisma ?? 0}
                  onChange={v => setAtrEdit(prev => ({ ...prev, carisma: Math.max(0, v) }))}
                  min={0}
                  className="fn-social-val"
                />
              </div>
              <div className="fn-social-item">
                <span className="fn-social-label">MANIPULAÇÃO</span>
                <CampoNumerico
                  valor={atr.manipulacao ?? 0}
                  onChange={v => setAtrEdit(prev => ({ ...prev, manipulacao: Math.max(0, v) }))}
                  min={0}
                  className="fn-social-val"
                />
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
                  claId={getClaIdFull(ficha)}
                  atr={atr}
                  aptidoes={aptidoes}
                />
              </div>

            </div>
          </div>

        </div>{/* fim fn-body */}

        {/* ── COL DIREITA: abas — filho direto do fn-sheet (col 3, linhas 1-2) ── */}
        <div className="fn-col-direita">

          {/* Painel de Pontos fixo no topo */}
          <PainelPontos nc={nc} atr={atr} pericias={pericias} poderes={poderes} aptidoes={aptidoes} jutsus={jutsus} ficha={ficha} setFicha={setFicha} salvarAgora={salvarAgora} />

          {/* Barra de abas */}
          <div className="fn-identidade-abas">
            <div className="fn-abas-centro">
              {["combate", "jutsus", "poderes", "aptidões"].map(aba => (
                <button
                  key={aba}
                  className={`fn-aba-btn ${abaAtiva === aba ? "fn-aba-ativa" : ""}`}
                  onClick={() => setAbaAtiva(aba)}
                >
                  {aba.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="fn-aba-conteudo">
            {(() => {
              const evo = getEvolucao(parseInt(nc, 10) || 4);
              const gastosPoderes = poderes.reduce((total, p) => {
                if (p.nivel <= 0) return total;
                const cfg = PODERES_CONFIG.find(c => c.id === p.id) || PODERES_RESTRITOS_CONFIG.find(c => c.id === p.id);
                const gratis1 = p.gratis || (!!cfg?.cla && !cfg?.restrito);
                return total + (gratis1 ? Math.max(0, p.nivel - 1) : p.nivel);
              }, 0);
              const gastosAptidoes = aptidoes.filter(a => a.cat !== "gratuita" && a.cat !== "restrita").length;
              const JUTSUS_BASICOS_IDS2 = new Set(["bunshin_no_jutsu","henge_no_jutsu","kai","kawarimi_no_jutsu","kinobori","shunshin_no_jutsu","tadayou"]);
              const gastosJutsus = jutsus.filter(j => {
                if (j.fromLivro && JUTSUS_BASICOS_IDS2.has(j.fromLivro)) return false;
                if ((j.obs || "").toLowerCase().includes("grátis") || (j.obs || "").toLowerCase().includes("gratis")) return false;
                return true;
              }).length;
              const gastosPoder = gastosPoderes + gastosAptidoes + gastosJutsus;
              const ptsPoder = ((ficha?.pontos_poder > 0) ? ficha.pontos_poder : evo.poderes) - gastosPoder;
              return (
                <>
                  {abaAtiva === "combate" && (
                    <AbaCombate
                      ataques={ataques}
                      setAtaques={setAtaques}
                      hcCalc={hcCalc}
                      handleRolar={handleRolar}
                      salvarAgora={salvarAgora}
                      atr={atr}
                      aptidoes={aptidoes}
                    />
                  )}
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
                      aptidoes={aptidoes}
                    />
                  )}
                  {abaAtiva === "poderes" && (
                    <AbaPoderes
                      poderes={poderes}
                      setPoderes={setPoderes}
                      pontosRestantes={ptsPoder}
                      salvarAgora={salvarAgora}
                      ficha={{ atributos: atr, pericias, aptidoes }}
                      claId={getClaIdFull(ficha)}
                    />
                  )}
                  {abaAtiva === "aptidões" && (
                    <AbaAptidoes
                      aptidoes={aptidoes}
                      setAptidoes={setAptidoes}
                      atr={atr}
                      pericias={pericias}
                      hcCalc={hcCalc}
                      claId={getClaIdFull(ficha)}
                      salvarAgora={salvarAgora}
                      pontosRestantes={ptsPoder}
                      poderes={poderes}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
      <ModalDescAtributo atributo={modalAtr} onFechar={() => setModalAtr(null)} />
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