import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaAnimalInuzuka.css"; // Reutiliza o mesmo CSS do companheiro Inuzuka

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Helpers ───────────────────────────────────────────────────────────────────
const rolar2d8 = () => ({
  d1: Math.floor(Math.random() * 8) + 1,
  d2: Math.floor(Math.random() * 8) + 1,
});

const rolar1d8 = () => Math.floor(Math.random() * 8) + 1;

const makeTimestamp = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
};

const TIPOS_INSETO = [
  { id: "kikaichuu",  nome: "Kikaichuu",  desc: "Inseto sugador de chakra (grupo de 100)" },
  { id: "kidaichuu",  nome: "Kidaichuu",  desc: "Inseto parasita gigante (individual)"    },
];

const APTIDOES_KIDAICHUU = [
  { id: "intuicao",         nome: "Intuição",          desc: "LM +1." },
  { id: "reflexos",         nome: "Reflexos",           desc: "ESQ +1." },
  { id: "ataque_movimento", nome: "Ataque em Movimento",desc: "Divide deslocamento antes e depois do ataque." },
  { id: "maestria",         nome: "Maestria",           desc: "+1 precisão em CC/CD com ataque escolhido." },
  { id: "lutador",          nome: "Lutador",            desc: "Manobras desarmadas sem penalidade −2." },
];

// ── Campos numéricos inline ──────────────────────────────────────────────────
const CampoNumerico = ({ valor, onChange, min = 0, className = "" }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(String(valor));
  const inputRef = useRef(null);
  useEffect(() => { if (!editando) setTmp(String(valor)); }, [valor, editando]);
  useEffect(() => { if (editando && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editando]);
  const salvar = () => { const n = parseInt(tmp, 10); onChange(isNaN(n) ? min : Math.max(min, n)); setEditando(false); };
  if (editando) return (
    <input ref={inputRef} className={`fai-num-input ${className}`} type="number" value={tmp}
      onChange={e => setTmp(e.target.value)}
      onBlur={salvar}
      onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") setEditando(false); }}
    />
  );
  return <span className={`fai-num-val ${className}`} onClick={() => setEditando(true)}>{valor}</span>;
};

// ── Barra de energia ─────────────────────────────────────────────────────────
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
  const inp  = { width: "42px", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "1rem", fontWeight: "700", textAlign: "center", fontFamily: '"Outfit",sans-serif', letterSpacing: "2px", MozAppearance: "textfield" };
  return (
    <div className="fai-energia-bloco">
      <div className="fai-energia-titulo">{label}</div>
      <div className="fai-energia-barra-wrapper">
        <div className="fai-energia-barra-fill" style={{ width: `${pct}%`, background: cor }} />
        <button className="fai-energia-btn" onClick={() => onChange(valor - 5)}>«</button>
        <button className="fai-energia-btn" onClick={() => onChange(valor - 1)}>‹</button>
        <div className="fai-energia-barra-bg">
          <div className="fai-energia-texto">
            <span style={slot}>{eA
              ? <input ref={rA} style={inp} type="number" value={iA} onChange={e => setIA(e.target.value)} onBlur={cA} onKeyDown={e => { if (e.key === "Enter") cA(); if (e.key === "Escape") setEA(false); }} />
              : <span onClick={() => { setIA(String(valor)); setEA(true); }}>{valor}</span>}
            </span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={slot}>{eM
              ? <input ref={rM} style={inp} type="number" value={iM} onChange={e => setIM(e.target.value)} onBlur={cM} onKeyDown={e => { if (e.key === "Enter") cM(); if (e.key === "Escape") setEM(false); }} />
              : <span onClick={() => { setIM(String(max)); setEM(true); }}>{max}</span>}
            </span>
          </div>
        </div>
        <button className="fai-energia-btn" onClick={() => onChange(valor + 1)}>›</button>
        <button className="fai-energia-btn" onClick={() => onChange(valor + 5)}>»</button>
      </div>
    </div>
  );
};

// ── Resultado de rolagem ──────────────────────────────────────────────────────
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
  const { label, d1, d2, bonus, total, critico, falhaCritica, is1d8 } = resultado;
  const soma = is1d8 ? d1 : d1 + (d2 ?? 0);
  const cls = critico ? "fn-critico-max" : falhaCritica ? "fn-critico-min" : "";
  const formula = is1d8
    ? `1d8(${d1})${bonus !== 0 ? `+bônus(${bonus})` : ""}`
    : `2d8(${d1}+${d2}=${soma})${bonus !== 0 ? `+bônus(${bonus})` : ""}`;
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
          {bonus !== 0 && (
            <div className="fn-rolagem-formula-resto">{bonus >= 0 ? "+" : ""}{bonus}</div>
          )}
          <div className="fn-rolagem-igual">=</div>
          <div className={`fn-rolagem-total-novo ${cls}`}>{total}</div>
        </div>
        <div className="fn-rolagem-formula-label">{formula}</div>
      </div>
    </div>
  );
};

// ── Painel histórico ──────────────────────────────────────────────────────────
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
              <div className="fn-painel-item-personagem">{h.label}</div>
              <div className="fn-painel-item-card-row">
                <i className="fas fa-dice-d20 fn-painel-item-icone" style={{ color: cor }} />
                <div className="fn-painel-item-card-body">
                  <span className="fn-painel-item-nome">{h.label}</span>
                  <div className="fn-painel-item-pericia-row">
                    <span className="fn-painel-item-formula-inline">[{h.d1}{h.d2 != null ? `+${h.d2}` : ""}]</span>
                    <span className="fn-painel-item-igual">=</span>
                    <span className="fn-painel-item-total" style={{ color: cor }}>{h.total}</span>
                  </div>
                </div>
              </div>
              <div className="fn-painel-item-ts">{h.ts}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
const FichaInsetoAburame = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── Estado da ficha do dono ───────────────────────────────────────────────
  const [donorFicha,    setDonorFicha]    = useState(null);
  const [carregando,    setCarregando]    = useState(true);

  // ── Tipo de inseto selecionado para a ficha ───────────────────────────────
  const [tipoInseto,    setTipoInseto]    = useState("kikaichuu");

  // ── Estado do Kikaichuu ───────────────────────────────────────────────────
  // Quantidade de grupos (1 por nível de Lidar com Animais do dono)
  const [qtdGrupos,     setQtdGrupos]     = useState(0);   // total de grupos no corpo
  const [gruposAtivos,  setGruposAtivos]  = useState(0);   // grupos atualmente fora do corpo
  const [lidarAnimais,  setLidarAnimais]  = useState(0);   // copiado da ficha do dono

  // ── Estado do Kidaichuu ───────────────────────────────────────────────────
  // Quantidade: 1 inseto por cada 3 níveis completos de Lidar com Animais
  const [qtdKidaichuu,  setQtdKidaichuu]  = useState(0);
  const [vitalAtual,    setVitalAtual]    = useState(0);
  const [vitalMax,      setVitalMax]      = useState(0);
  const [chakraAtual,   setChakraAtual]   = useState(0);   // chakra = soma do drenado das vítimas
  const [chakraMax,     setChakraMax]     = useState(0);
  const [hcBonus,       setHcBonus]       = useState({ CC: 0, CD: 0, ESQ: 0, LM: 0 });
  const [aptidoes,      setAptidoes]      = useState([]);

  // ── Anotações gerais ──────────────────────────────────────────────────────
  const [anotacoes,     setAnotacoes]     = useState("");

  // ── UI ────────────────────────────────────────────────────────────────────
  const [resultado,     setResultado]     = useState(null);
  const [historico,     setHistorico]     = useState([]);
  const [painelAberto,  setPainelAberto]  = useState(false);

  const fichaCarregada = useRef(false);

  // ── Carrega dados da ficha do dono ────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setDonorFicha(data);

        // Extrai lidar com animais das perícias do dono
        let periciasD = {};
        try { periciasD = data.dados_pericias ? JSON.parse(data.dados_pericias) : {}; } catch {}
        const lidar = periciasD.lidar_animais ?? periciasD.lidarAnimais ?? 0;
        setLidarAnimais(lidar);

        // Atributos do dono para cálculo do Kidaichuu
        let extrasD = {};
        try { extrasD = data.dados_extras ? JSON.parse(data.dados_extras) : {}; } catch {}
        const atrEditD = extrasD.atrEdit ?? {};

        // Calcula quantidades conforme regras
        const qtdKika  = lidar; // 1 grupo por nível de Lidar com Animais
        const qtdKida  = Math.floor(lidar / 3); // 1 por cada 3 níveis completos

        // Carrega dados salvos do inseto
        const salvo = extrasD.inseto_aburame ?? null;
        if (salvo) {
          setTipoInseto   (salvo.tipoInseto    ?? "kikaichuu");
          setQtdGrupos    (salvo.qtdGrupos     ?? qtdKika);
          setGruposAtivos (salvo.gruposAtivos  ?? 0);
          setQtdKidaichuu (salvo.qtdKidaichuu  ?? qtdKida);
          setVitalAtual   (salvo.vitalAtual    ?? 0);
          setVitalMax     (salvo.vitalMax      ?? 0);
          setChakraAtual  (salvo.chakraAtual   ?? 0);
          setChakraMax    (salvo.chakraMax     ?? 0);
          setHcBonus      (salvo.hcBonus       ?? { CC: 0, CD: 0, ESQ: 0, LM: 0 });
          setAptidoes     (salvo.aptidoes      ?? []);
          setAnotacoes    (salvo.anotacoes     ?? "");
        } else {
          // Valores iniciais calculados pelas regras
          setQtdGrupos(qtdKika);
          setQtdKidaichuu(qtdKida);

          // Kidaichuu: VIT = 2x Lidar com Animais; Chakra = chakra drenado (começa em 0)
          const vitKida = 2 * lidar;
          setVitalMax(vitKida); setVitalAtual(vitKida);
          setChakraMax(20); setChakraAtual(0); // chakra max é apenas referência
        }
      })
      .then(() => { setTimeout(() => { fichaCarregada.current = true; }, 500); })
      .catch(() => { setDonorFicha({ error: true }); fichaCarregada.current = true; })
      .finally(() => setCarregando(false));
  }, [id]);

  // ── Atributos derivados do Kidaichuu (conforme regras) ───────────────────
  // FOR e AGI = Lidar com Animais - 2; demais = metade disso
  const kidaAtributos = {
    forca:        Math.max(0, lidarAnimais - 2),
    destreza:     Math.max(0, Math.floor((lidarAnimais - 2) / 2)),
    agilidade:    Math.max(0, lidarAnimais - 2),
    percepcao:    Math.max(0, Math.floor((lidarAnimais - 2) / 2)),
    inteligencia: Math.max(0, Math.floor((lidarAnimais - 2) / 2)),
    vigor:        Math.max(0, Math.floor((lidarAnimais - 2) / 2)),
    espirito:     Math.max(0, Math.floor((lidarAnimais - 2) / 2)),
  };

  const temApt = (aptId) => aptidoes.some(a => a.id === aptId);

  // HC do Kidaichuu: CC e CD usam precisão do Aburame (representados pelo hcBonus)
  // ESQ usa LM do Aburame (mesmo padrão)
  const hcCalc = {
    CC:  3 + kidaAtributos.forca     + (hcBonus.CC  ?? 0) + (temApt("maestria") ? 1 : 0),
    CD:  3 + kidaAtributos.destreza  + (hcBonus.CD  ?? 0),
    ESQ: 3 + kidaAtributos.agilidade + (hcBonus.ESQ ?? 0) + (temApt("reflexos") ? 1 : 0),
    LM:  3 + kidaAtributos.percepcao + (hcBonus.LM  ?? 0) + (temApt("intuicao") ? 1 : 0),
  };

  // ── Rolagem ───────────────────────────────────────────────────────────────
  const rolar = useCallback((label, bonus = 0) => {
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const total = soma + bonus;
    const r = { label, d1, d2, bonus, total, critico: soma === 16, falhaCritica: soma === 2 };
    setResultado(r);
    setHistorico(h => [{ ...r, ts: makeTimestamp() }, ...h].slice(0, 50));
  }, []);

  const rolarAtributo = useCallback((label, valorAtr) => {
    const d1 = rolar1d8();
    const total = d1 + valorAtr;
    const r = { label, d1, d2: null, bonus: valorAtr, total, critico: d1 === 8, falhaCritica: d1 === 1, is1d8: true };
    setResultado(r);
    setHistorico(h => [{ ...r, ts: makeTimestamp() }, ...h].slice(0, 50));
  }, []);

  // ── Refs para save sem stale closure ─────────────────────────────────────
  const tipoInsetoRef   = useRef(tipoInseto);
  const qtdGruposRef    = useRef(qtdGrupos);
  const gruposAtivosRef = useRef(gruposAtivos);
  const qtdKidaichuuRef = useRef(qtdKidaichuu);
  const vitalAtualRef   = useRef(vitalAtual);
  const vitalMaxRef     = useRef(vitalMax);
  const chakraAtualRef  = useRef(chakraAtual);
  const chakraMaxRef    = useRef(chakraMax);
  const hcBonusRef      = useRef(hcBonus);
  const aptidoesRef     = useRef(aptidoes);
  const anotacoesRef    = useRef(anotacoes);
  const donorFichaRef   = useRef(donorFicha);

  useEffect(() => { tipoInsetoRef.current   = tipoInseto;   }, [tipoInseto]);
  useEffect(() => { qtdGruposRef.current    = qtdGrupos;    }, [qtdGrupos]);
  useEffect(() => { gruposAtivosRef.current = gruposAtivos; }, [gruposAtivos]);
  useEffect(() => { qtdKidaichuuRef.current = qtdKidaichuu; }, [qtdKidaichuu]);
  useEffect(() => { vitalAtualRef.current   = vitalAtual;   }, [vitalAtual]);
  useEffect(() => { vitalMaxRef.current     = vitalMax;     }, [vitalMax]);
  useEffect(() => { chakraAtualRef.current  = chakraAtual;  }, [chakraAtual]);
  useEffect(() => { chakraMaxRef.current    = chakraMax;    }, [chakraMax]);
  useEffect(() => { hcBonusRef.current      = hcBonus;      }, [hcBonus]);
  useEffect(() => { aptidoesRef.current     = aptidoes;     }, [aptidoes]);
  useEffect(() => { anotacoesRef.current    = anotacoes;    }, [anotacoes]);
  useEffect(() => { donorFichaRef.current   = donorFicha;   }, [donorFicha]);

  // ── Salvar ────────────────────────────────────────────────────────────────
  const salvar = useCallback(() => {
    if (!id || !fichaCarregada.current) return;
    let extrasBase = {};
    try { extrasBase = donorFichaRef.current?.dados_extras ? JSON.parse(donorFichaRef.current.dados_extras) : {}; } catch {}
    const novoExtras = {
      ...extrasBase,
      inseto_aburame: {
        tipoInseto:   tipoInsetoRef.current,
        qtdGrupos:    qtdGruposRef.current,
        gruposAtivos: gruposAtivosRef.current,
        qtdKidaichuu: qtdKidaichuuRef.current,
        vitalAtual:   vitalAtualRef.current,
        vitalMax:     vitalMaxRef.current,
        chakraAtual:  chakraAtualRef.current,
        chakraMax:    chakraMaxRef.current,
        hcBonus:      hcBonusRef.current,
        aptidoes:     aptidoesRef.current,
        anotacoes:    anotacoesRef.current,
      },
    };
    if (donorFichaRef.current) {
      donorFichaRef.current = { ...donorFichaRef.current, dados_extras: JSON.stringify(novoExtras) };
    }
    fetch(`${API}/api/naruto/fichas/${id}/salvar`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dados_extras: JSON.stringify(novoExtras) }),
    })
      .then(r => { if (!r.ok) console.error("[inseto] save failed:", r.status); })
      .catch(e => console.error("[inseto] save error:", e));
  }, [id]);

  const saveTimer = useRef(null);
  const [prontoParaSalvar, setProntoParaSalvar] = useState(false);

  useEffect(() => {
    if (!fichaCarregada.current) return;
    setProntoParaSalvar(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donorFicha]);

  useEffect(() => {
    if (!prontoParaSalvar) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(salvar, 1500);
    return () => clearTimeout(saveTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoInseto, qtdGrupos, gruposAtivos, qtdKidaichuu, vitalAtual, vitalMax, chakraAtual, chakraMax, hcBonus, aptidoes, anotacoes, prontoParaSalvar]);

  const toggleApt = (aptId) => {
    setAptidoes(prev =>
      prev.some(a => a.id === aptId) ? prev.filter(a => a.id !== aptId) : [...prev, { id: aptId }]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (carregando) return (
    <div className="fai-loading"><p className="fai-loading-txt">Carregando insetos...</p></div>
  );
  if (!donorFicha || donorFicha.error) return (
    <div className="fai-loading">
      <p className="fai-loading-txt">Ficha não encontrada.</p>
      <button className="fai-voltar-btn" onClick={() => navigate(`/personagem-naruto/${id}`)}>← VOLTAR</button>
    </div>
  );

  const ATRIBUTOS_LABELS = [
    { key: "forca",        label: "FOR", nome: "Força"        },
    { key: "destreza",     label: "DES", nome: "Destreza"     },
    { key: "agilidade",    label: "AGI", nome: "Agilidade"    },
    { key: "percepcao",    label: "PER", nome: "Percepção"    },
    { key: "inteligencia", label: "INT", nome: "Inteligência" },
    { key: "vigor",        label: "VIG", nome: "Vigor"        },
    { key: "espirito",     label: "ESP", nome: "Espírito"     },
  ];

  // Grupos no corpo = total - ativos
  const gruposNoCorpo = Math.max(0, qtdGrupos - gruposAtivos);

  return (
    <div className="fai-page">

      {/* ── TOPBAR ── */}
      <div className="fai-topbar">
        <button className="fai-voltar-btn" onClick={() => navigate(`/personagem-naruto/${id}`)}>← VOLTAR</button>
        <div className="fai-topbar-centro">
          <span className="fai-topbar-tag">FICHA DE INSETOS</span>
          <span className="fai-topbar-dono">{donorFicha.nome_personagem}</span>
        </div>
        <button className="fai-hist-btn" onClick={() => setPainelAberto(p => !p)} title="Histórico">
          <i className="fa-solid fa-book" />
        </button>
      </div>

      <div className="fai-sheet">

        {/* ── CABEÇALHO ── */}
        <div className="fai-cabecalho">
          <div className="fai-cab-field">
            <span className="fai-cab-label">TIPO DE INSETO</span>
            <select className="fai-cab-select" value={tipoInseto} onChange={e => setTipoInseto(e.target.value)}>
              {TIPOS_INSETO.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <div className="fai-cab-field">
            <span className="fai-cab-label">CLÃ</span>
            <span className="fai-cab-static">Aburame</span>
          </div>
          <div className="fai-cab-field">
            <span className="fai-cab-label">LIDAR C/ ANIMAIS</span>
            <span className="fai-cab-static">{lidarAnimais}</span>
          </div>
          <div className="fai-cab-field">
            <span className="fai-cab-label">DONO</span>
            <span className="fai-cab-static">{donorFicha.nome_personagem}</span>
          </div>
        </div>

        {/* ── CORPO ── */}
        <div className="fai-body">

          {/* ── COL ESQUERDA ── */}
          <div className="fai-col-esq">

            {/* Avatar / ícone do inseto */}
            <div className="fai-avatar-wrapper" style={{ cursor: "default" }}>
              <div className="fai-avatar-placeholder">
                <i className={tipoInseto === "kikaichuu" ? "fas fa-bug" : "fas fa-spider"} style={{ fontSize: "2rem" }} />
              </div>
            </div>

            {/* ── SEÇÃO KIKAICHUU ── */}
            {tipoInseto === "kikaichuu" && (
              <>
                <div className="fai-secao-titulo" style={{ marginTop: 14 }}>GRUPOS DE KIKAICHUU</div>
                <p className="fai-obs-pequena">
                  1 grupo (100 insetos) por nível de Lidar com Animais. Ataque usa até metade do total. Drena chakra igual ao nº de grupos usados.
                </p>

                {/* Contador principal de grupos */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 4px" }}>
                  {/* Total no corpo */}
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">TOTAL DE GRUPOS</span>
                    <CampoNumerico
                      valor={qtdGrupos}
                      onChange={v => setQtdGrupos(Math.max(0, v))}
                      className="fai-stat-val"
                    />
                  </div>

                  {/* Grupos fora do corpo (ativos / implantados / em técnica) */}
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">GRUPOS FORA DO CORPO</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        className="fai-energia-btn"
                        style={{ borderRadius: 4 }}
                        onClick={() => setGruposAtivos(v => Math.max(0, v - 1))}
                      >‹</button>
                      <CampoNumerico
                        valor={gruposAtivos}
                        onChange={v => setGruposAtivos(Math.max(0, Math.min(qtdGrupos, v)))}
                        className="fai-stat-val"
                      />
                      <button
                        className="fai-energia-btn"
                        style={{ borderRadius: 4 }}
                        onClick={() => setGruposAtivos(v => Math.min(qtdGrupos, v + 1))}
                      >›</button>
                    </div>
                  </div>

                  {/* No corpo (calculado) */}
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">GRUPOS NO CORPO</span>
                    <span className="fai-stat-val" style={{ color: gruposNoCorpo <= 0 ? "#ef4444" : "#4a90e2" }}>
                      {gruposNoCorpo}
                    </span>
                  </div>

                  {/* Máx para ataque = metade do total */}
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">MÁX. P/ ATAQUE</span>
                    <span className="fai-stat-val">{Math.floor(qtdGrupos / 2)}</span>
                  </div>
                </div>

                {/* Regras-resumo Kikaichuu */}
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#060d16", border: "1px solid #0f2040", borderRadius: 4 }}>
                  <div style={{ fontSize: "0.6rem", color: "#4a6080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>REGRAS RÁPIDAS</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      "Liberar/Recolher: ação livre",
                      "Atacar: ação padrão (Combate à Distância)",
                      "Mover: ação parcial — 15m por ação",
                      "Máx fora do corpo: 100m (acima = perdido)",
                      "Regenera: 1 grupo a cada 2 dias",
                      "Não causa dano — drena chakra igual ao nº de grupos",
                      "Bloqueio não funciona contra kikaichuu",
                    ].map((r, i) => (
                      <li key={i} style={{ fontSize: "0.75rem", color: "#6a8aaa", lineHeight: 1.5, display: "flex", gap: 6 }}>
                        <span style={{ color: "#2a5080", flexShrink: 0 }}>·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* ── SEÇÃO KIDAICHUU ── */}
            {tipoInseto === "kidaichuu" && (
              <>
                <div className="fai-secao-titulo" style={{ marginTop: 14 }}>KIDAICHUU</div>
                <p className="fai-obs-pequena">
                  1 inseto por cada 3 níveis completos de Lidar com Animais. Implantado por toque (CC). Cresce a tamanho Médio no fim do turno.
                </p>

                {/* Quantidade de Kidaichuu */}
                <div className="fai-stat-item">
                  <span className="fai-stat-label">QUANTIDADE DISPONÍVEL</span>
                  <CampoNumerico
                    valor={qtdKidaichuu}
                    onChange={v => setQtdKidaichuu(Math.max(0, v))}
                    className="fai-stat-val"
                  />
                </div>

                {/* Energias */}
                <BarraEnergia label="VITALIDADE" cor="#e05050"
                  valor={vitalAtual} max={vitalMax}
                  onChange={v => setVitalAtual(Math.max(0, v))} onChangeMax={v => setVitalMax(Math.max(0, v))} />

                {/* Chakra drenado (dinâmico) */}
                <BarraEnergia label="CHAKRA DRENADO" cor="#4a90e2"
                  valor={chakraAtual} max={chakraMax}
                  onChange={v => setChakraAtual(Math.max(0, v))} onChangeMax={v => setChakraMax(Math.max(0, v))} />

                {/* Atributos derivados */}
                <div className="fai-secao-titulo" style={{ marginTop: 10 }}>ATRIBUTOS</div>
                <div className="fai-atr-grid">
                  {ATRIBUTOS_LABELS.map(({ key, label, nome }) => (
                    <div key={key} className="fai-atr-item">
                      <span className="fai-atr-label">{label}</span>
                      <span className="fai-atr-nome">{nome}</span>
                      <span className="fai-atr-val">{kidaAtributos[key]}</span>
                      <button
                        className="fai-btn-rolar fai-atr-rolar"
                        onClick={() => rolarAtributo(label, kidaAtributos[key])}
                        title={`Rolar ${label} (1d8 + ${kidaAtributos[key]})`}
                      >
                        <i className="fas fa-dice-d20" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* HC do Kidaichuu */}
                <div className="fai-secao-titulo">HABILIDADES DE COMBATE</div>
                <p className="fai-obs-pequena" style={{ marginBottom: 4 }}>
                  CC e CD usam precisão do Aburame. ESQ usa LM do Aburame. Ajuste o bônus conforme a ficha do dono.
                </p>
                <div className="fai-hc-grid">
                  {[
                    { key: "CC",  label: "CC",  nome: "Combate Corporal"    },
                    { key: "ESQ", label: "ESQ", nome: "Esquiva"             },
                    { key: "LM",  label: "LM",  nome: "Ler Movimento"       },
                  ].map(({ key, label, nome }) => (
                    <div key={key} className="fai-hc-item">
                      <span className="fai-hc-label">{label}</span>
                      <span className="fai-hc-nome">{nome}</span>
                      <CampoNumerico
                        valor={hcCalc[key]}
                        onChange={v => setHcBonus(b => ({ ...b, [key]: v - (hcCalc[key] - (hcBonus[key] ?? 0)) }))}
                        min={0}
                        className="fai-hc-val"
                      />
                      <button className="fai-btn-rolar fai-hc-rolar" onClick={() => rolar(label, hcCalc[key])}>
                        <i className="fas fa-dice-d20" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="fai-stats-grid">
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">REAÇÃO ESQ</span>
                    <span className="fai-stat-val">{hcCalc.ESQ + 9}</span>
                  </div>
                  <div className="fai-stat-item">
                    <span className="fai-stat-label">DESLOCAMENTO</span>
                    <span className="fai-stat-val">15m</span>
                  </div>
                </div>

                {/* Regras-resumo Kidaichuu */}
                <div style={{ marginTop: 12, padding: "8px 12px", background: "#060d16", border: "1px solid #0f2040", borderRadius: 4 }}>
                  <div style={{ fontSize: "0.6rem", color: "#4a6080", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>REGRAS RÁPIDAS</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {[
                      "Implante via toque direto (teste CC)",
                      "Drena 2 chakra/turno — cresce a Médio no fim do 1º turno",
                      "A partir daí: capanga parceiro com ações próprias",
                      "Mordida: dano base zero + drena 2 chakra por acerto",
                      "Vitalidade = 2× Lidar com Animais",
                      "Chakra do inseto = total drenado das vítimas",
                      "Não pode voar — deve tocar o alvo",
                      "Fracasso automático em testes fora de combate",
                    ].map((r, i) => (
                      <li key={i} style={{ fontSize: "0.75rem", color: "#6a8aaa", lineHeight: 1.5, display: "flex", gap: 6 }}>
                        <span style={{ color: "#2a5080", flexShrink: 0 }}>·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

          </div>{/* fim col-esq */}

          {/* ── COL MEIO ── */}
          <div className="fai-col-meio">

            {/* ── KIKAICHUU: aptidões especiais e técnicas ── */}
            {tipoInseto === "kikaichuu" && (
              <>
                <div className="fai-secao-titulo">APTIDÕES ESPECIAIS (ABURAME)</div>
                <p className="fai-obs-pequena">Aptidões do clã Aburame que afetam os Kikaichuu. Marque as que o personagem possui.</p>
                <div className="fai-aptidoes-lista" style={{ marginBottom: 16 }}>
                  {[
                    { id: "apt_kikaichuu2",   nome: "Kikaichuu Nv 2",       desc: "Notar Genjutsu via insetos (Lidar c/ Animais ao invés de INT), Esconder Insetos, Drenar Veneno." },
                    { id: "apt_shokaichuu",   nome: "Shōkaichuu",           desc: "Insetos rastreadores: cobrem 20m de raio por grupo, retornam em 5 turnos com posições de chakra." },
                    { id: "apt_maestria_kika",nome: "Maestria (Kikaichuu)", desc: "Maestria comprada para Kikaichuu serve para todos os insetos e para o Kikai Ninpou." },
                    { id: "apt_sensor_kika",  nome: "Sensor (Interferência)",desc: "Kikai Ninpou Nv 3 — emite sinais falsos de chakra em área. Inimigos sensores testam Rastrear." },
                  ].map(apt => {
                    const ativa = aptidoes.some(a => a.id === apt.id);
                    return (
                      <div key={apt.id} className={`fai-apt-card ${ativa ? "fai-apt-ativa" : ""}`}
                        onClick={() => toggleApt(apt.id)} title={apt.desc}>
                        <div className="fai-apt-check">{ativa ? "✓" : ""}</div>
                        <div className="fai-apt-info">
                          <span className="fai-apt-nome">{apt.nome}</span>
                          <span className="fai-apt-desc">{apt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="fai-secao-titulo">TÉCNICAS DOS INSETOS</div>
                <p className="fai-obs-pequena">Técnicas do Kuchiyose e Kikaichuu disponíveis com os requisitos atendidos.</p>
                <div className="fai-aptidoes-lista">
                  {[
                    { id: "tec_mushi_bunshin",   nome: "Mushi Bunshin",                 desc: "Clone de Insetos — Rank C. Pré: Clone (apt); Kikaichuu. Ação: Padrão. Custo: 1 chakra/clone. Cria clone com insetos no interior. Drena chakra ao atacar ou ser atacado." },
                    { id: "tec_mushi_kame",       nome: "Mushi Kame no Jutsu",           desc: "Jarro de Insetos — Pré: Kikaichuu; Kikai Ninpou 3 (Barreira). Ação: Movimento. Insetos voam ao redor em grande velocidade — segue regras de Barreira do Ninpou." },
                    { id: "tec_mushidama",        nome: "Mushidama",                     desc: "Esfera de Insetos — Pré: Kikaichuu; Kikai Ninpou 4 (Sopro Destrutivo). Ação: Padrão. Insetos se juntam ao redor do alvo. Segue regras de Sopro Destrutivo." },
                    { id: "tec_senro",            nome: "Senro (Rastreamento)",          desc: "Rank D — Pré: Kikai Ninpou 1. Ação: Padrão. Alcance: Toque. Custo: 1. Prende kikaichuu fêmea no alvo; macho rastreia até 50m." },
                    { id: "tec_tsuiga",           nome: "Kuchiyose: Tsuiga no Jutsu",   desc: "Pré: Kuchiyose 6 (Cães); Imergir 4 (Doton). Ação: Padrão. Requer marcação de sangue. 8 cães invadem pelo solo — alvo testa Prontidão/Agilidade ou fica agarrado/desprevenido 2 turnos." },
                    { id: "tec_interferencia",    nome: "Interferência (Kikai Ninpou 3)",desc: "Ação: Padrão. Área: Círculo 30m+3m/LA. Duração: Sustentada. Espalha insetos emitindo sinais falsos de chakra. Sensores devem testar Rastrear (dif padrão do poder) ou falham." },
                  ].map(tec => {
                    const ativa = aptidoes.some(a => a.id === tec.id);
                    return (
                      <div key={tec.id} className={`fai-apt-card ${ativa ? "fai-apt-ativa" : ""}`}
                        onClick={() => toggleApt(tec.id)} title={tec.desc}>
                        <div className="fai-apt-check">{ativa ? "✓" : ""}</div>
                        <div className="fai-apt-info">
                          <span className="fai-apt-nome">{tec.nome}</span>
                          <span className="fai-apt-desc">{tec.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── KIDAICHUU: aptidões do capanga ── */}
            {tipoInseto === "kidaichuu" && (
              <>
                <div className="fai-secao-titulo">APTIDÕES DO KIDAICHUU</div>
                <p className="fai-obs-pequena">Aptidões permitidas ao Kidaichuu como capanga parceiro.</p>
                <div className="fai-aptidoes-lista">
                  {APTIDOES_KIDAICHUU.map(apt => {
                    const ativa = aptidoes.some(a => a.id === apt.id);
                    return (
                      <div key={apt.id} className={`fai-apt-card ${ativa ? "fai-apt-ativa" : ""}`}
                        onClick={() => toggleApt(apt.id)} title={apt.desc}>
                        <div className="fai-apt-check">{ativa ? "✓" : ""}</div>
                        <div className="fai-apt-info">
                          <span className="fai-apt-nome">{apt.nome}</span>
                          <span className="fai-apt-desc">{apt.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── ANOTAÇÕES (comum) ── */}
            <div className="fai-secao-titulo" style={{ marginTop: 20 }}>ANOTAÇÕES</div>
            <textarea
              className="fai-anotacoes"
              value={anotacoes}
              onChange={e => setAnotacoes(e.target.value)}
              placeholder="Anotações sobre os insetos, alvos marcados, chakra drenado..."
            />
          </div>

          {/* ── COL DIREITA (apenas Kidaichuu tem ficha completa) ── */}
          {tipoInseto === "kidaichuu" && (
            <div className="fai-col-dir">
              <div className="fai-secao-titulo">FICHA DE EXEMPLO (NC ATUAL)</div>
              <p className="fai-obs-pequena">
                Referência calculada automaticamente com base no Lidar com Animais {lidarAnimais}.
              </p>

              {/* Tabela resumo conforme livro */}
              <div style={{ padding: "0 4px", display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "FOR / AGI",          val: `${kidaAtributos.forca} / ${kidaAtributos.agilidade}` },
                  { label: "DES / PER / INT / VIG / ESP", val: `${kidaAtributos.destreza} cada` },
                  { label: "CC (base)",           val: `${hcCalc.CC}` },
                  { label: "ESQ (base)",          val: `${hcCalc.ESQ}` },
                  { label: "LM (base)",           val: `${hcCalc.LM}` },
                  { label: "Vitalidade",          val: `${2 * lidarAnimais}` },
                  { label: "Chakra",              val: "= chakra drenado" },
                  { label: "Deslocamento",        val: "15m (terrestre)" },
                  { label: "Ataque — Mordida",    val: `CC; Dano 0 + drena 2 chakra/acerto` },
                  { label: "Qtd disponível",      val: `${Math.floor(lidarAnimais / 3)}` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#060d16", border: "1px solid #0a1828", borderRadius: 4 }}>
                    <span style={{ fontSize: "0.7rem", color: "#4a6080", letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontSize: "0.82rem", color: "#90b0d0", fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Lembrete de restrição */}
              <div style={{ marginTop: 16, padding: "8px 12px", background: "#0f0608", border: "1px solid #3a1018", borderRadius: 4 }}>
                <div style={{ fontSize: "0.6rem", color: "#5a2030", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>RESTRIÇÃO</div>
                <p style={{ fontSize: "0.75rem", color: "#7a4050", margin: 0, lineHeight: 1.5 }}>
                  Não pode ter Kidaichuu e Rinkaichuu simultaneamente.
                </p>
              </div>
            </div>
          )}

          {/* ── COL DIREITA (Kikaichuu: resumo de drenagem) ── */}
          {tipoInseto === "kikaichuu" && (
            <div className="fai-col-dir">
              <div className="fai-secao-titulo">KIKAI NINPOU</div>
              <p className="fai-obs-pequena">
                Poder Restrito — perícia chave: Lidar com Animais {lidarAnimais}.
              </p>
              <div style={{ padding: "0 4px", display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Alcance médio",        val: `${10 + 2 * lidarAnimais}m` },
                  { label: "Tamanho máx criação",  val: `${lidarAnimais}m Ø` },
                  { label: "Usa kikaichuu",         val: "1 grupo por nível do poder" },
                  { label: "Drena chakra",          val: "1 chakra/nível em contato" },
                  { label: "Efeitos permitidos",    val: "Canhão, Orbe, Raio, Barreira, Flechas, Ricochete, Coluna, Nuvem, Sopro Destrutivo, Míssil" },
                  { label: "Efeito exclusivo",      val: "Interferência (Nv 3)" },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "5px 8px", background: "#060d16", border: "1px solid #0a1828", borderRadius: 4 }}>
                    <span style={{ fontSize: "0.6rem", color: "#4a6080", letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                    <span style={{ fontSize: "0.8rem", color: "#90b0d0" }}>{val}</span>
                  </div>
                ))}
              </div>

              <div className="fai-secao-titulo" style={{ marginTop: 16 }}>DISPERSAR INSETOS</div>
              <div style={{ padding: "8px 12px", background: "#060d16", border: "1px solid #0a1828", borderRadius: 4 }}>
                <p style={{ fontSize: "0.75rem", color: "#6a8aaa", margin: 0, lineHeight: 1.5 }}>
                  Se uma criação do Kikai Ninpou for atacada: gaste ação de movimento e teste de Ler Movimento como defesa. Sucesso → insetos dispersam antes do ataque, sem ser destruídos. Pode retorná-los como ação livre.
                </p>
              </div>

              <div className="fai-secao-titulo" style={{ marginTop: 16 }}>CHAKRA ABAIXO DE ZERO</div>
              <div style={{ padding: "8px 12px", background: "#0f0608", border: "1px solid #3a1018", borderRadius: 4 }}>
                <p style={{ fontSize: "0.75rem", color: "#7a4050", margin: 0, lineHeight: 1.5 }}>
                  Se o alvo já estiver com 0 de chakra natural e sofrer drenagem ≥ metade da reserva natural → morre. Ex: reserva 40 → morre com 20 drenados abaixo de zero.
                </p>
              </div>
            </div>
          )}

        </div>{/* fim fai-body */}
      </div>{/* fim fai-sheet */}

      <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
      <PainelHistorico historico={historico} aberto={painelAberto} onFechar={() => setPainelAberto(false)} />
    </div>
  );
};

export default FichaInsetoAburame;
