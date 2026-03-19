import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaAnimalInuzuka.css";
import ImageCropModal from "../components/ImageCropModal";

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

// ── Aptidões permitidas ao animal ─────────────────────────────────────────────
const APTIDOES_PERMITIDAS = [
  { id: "acuidade",         nome: "Acuidade",             desc: "CC usa Destreza em vez de Força." },
  { id: "ataque_movimento", nome: "Ataque em Movimento",  desc: "Divide o deslocamento antes e depois do ataque." },
  { id: "especialista",     nome: "Especialista",         desc: "CC ou CD +1 (escolha tipo de arma)." },
  { id: "intuicao",         nome: "Intuição",             desc: "LM +1." },
  { id: "reflexos",         nome: "Reflexos",             desc: "ESQ +1." },
  { id: "velocista",        nome: "Velocista",            desc: "Deslocamento: dobra Agilidade." },
  { id: "perito",           nome: "Perito",               desc: "+2 precisão em perícia escolhida." },
  { id: "pericia_inata",    nome: "Perícia Inata",        desc: "Refaz um teste de perícia escolhida." },
  { id: "lutador",          nome: "Lutador",              desc: "Manobras desarmadas sem penalidade -2." },
  { id: "ponto_cego",       nome: "Ponto Cego",           desc: "Finta como ação de movimento." },
  { id: "ataque_atordoante",nome: "Ataque Atordoante",    desc: "Ataque sem dano; alvo testa VIG ou fica atordoado." },
  { id: "ataque_poderoso",  nome: "Ataque Poderoso",      desc: "CC -1, +1 dano." },
  { id: "derrubar_agr",     nome: "Derrubar Agressivo",   desc: "Derruba e causa dano ao mesmo tempo." },
  { id: "de_pe",            nome: "De Pé",                desc: "Levanta como ação livre; 1x/cena como reação." },
  { id: "desarme_agr",      nome: "Desarme Agressivo",    desc: "Desarma e causa dano ao mesmo tempo." },
  { id: "rasteira",         nome: "Rasteira",             desc: "Chute baixo para derrubar." },
  { id: "hakken",           nome: "Hakken no Jutsu",      desc: "Concentra chakra no nariz — olfato sobre-humano." },
];

// ── Perícias permitidas ao animal ─────────────────────────────────────────────
const PERICIAS_PERMITIDAS = [
  { id: "acrobacia",   nome: "Acrobacia",   atr: "agilidade" },
  { id: "atletismo",   nome: "Atletismo",   atr: "forca"     },
  { id: "escapar",     nome: "Escapar",     atr: "destreza"  },
  { id: "furtividade", nome: "Furtividade", atr: "agilidade" },
  { id: "procurar",    nome: "Procurar",    atr: "percepcao" },
  { id: "prontidao",   nome: "Prontidão",   atr: "percepcao" },
  { id: "rastrear",    nome: "Rastrear",    atr: "percepcao" },
];

// ── Tamanho baseado em Lidar com Animais do dono ────────────────────────────
const getTamanho = (lidarAnimais) => {
  const lv = parseInt(lidarAnimais, 10) || 0;
  if (lv >= 14) return { label: "Grande",  fala: true  };
  if (lv >= 10) return { label: "Médio",   fala: false };
  return              { label: "Pequeno",  fala: false };
};

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

// ── Resultado de rolagem — idêntico à ficha do dono ─────────────────────────
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
const FichaAnimalInuzuka = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [donorFicha,   setDonorFicha]   = useState(null);
  const [carregando,   setCarregando]   = useState(true);
  const [nomeAnimal,   setNomeAnimal]   = useState("");
  const [especie,      setEspecie]      = useState("cão");
  const [vitalAtual,   setVitalAtual]   = useState(0);
  const [vitalMax,     setVitalMax]     = useState(0);
  const [chakraAtual,  setChakraAtual]  = useState(0);
  const [chakraMax,    setChakraMax]    = useState(0);
  const [hcBonus,      setHcBonus]      = useState({ CC: 0, CD: 0, ESQ: 0, LM: 0 });
  const [pericias,     setPericias]     = useState({});
  const [aptidoes,     setAptidoes]     = useState([]);
  const [anotacoes,    setAnotacoes]    = useState("");
  const [lidarAnimais, setLidarAnimais] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imagemAnimal, setImagemAnimal] = useState(null);
  const [resultado,    setResultado]    = useState(null);
  const [historico,    setHistorico]    = useState([]);
  const [painelAberto, setPainelAberto] = useState(false);

  // ── Ref para controlar se já carregou (evita save durante load) ────────────
  const fichaCarregada = useRef(false);

  // ── Carrega ficha do dono ─────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setDonorFicha(data);
        let extrasCarregado = {};
        try { extrasCarregado = data.dados_extras ? JSON.parse(data.dados_extras) : {}; } catch { }

        // lidarAnimais SEMPRE da ficha do dono
        let periciasD = {};
        try { periciasD = data.dados_pericias ? JSON.parse(data.dados_pericias) : {}; } catch { }
        const lidar = periciasD.lidar_animais ?? periciasD.lidarAnimais ?? 0;
        setLidarAnimais(lidar);

        // Carregar atrEdit do dono como estado (mais confiável que parse inline no render)
        if (extrasCarregado.atrEdit && Object.keys(extrasCarregado.atrEdit).length > 0) {
          setAtrEditDono(extrasCarregado.atrEdit);
        }

        const salvo = extrasCarregado.animal_companion ?? null;
        if (salvo) {
          setNomeAnimal(salvo.nome         ?? "");
          setEspecie   (salvo.especie      ?? "cão");
          setVitalAtual(salvo.vitalAtual   ?? 0);
          setVitalMax  (salvo.vitalMax     ?? 0);
          setChakraAtual(salvo.chakraAtual ?? 0);
          setChakraMax (salvo.chakraMax    ?? 0);
          setHcBonus   (salvo.hcBonus      ?? { CC: 0, CD: 0, ESQ: 0, LM: 0 });
          setPericias  (salvo.pericias     ?? {});
          setAptidoes  (salvo.aptidoes     ?? []);
          setAnotacoes (salvo.anotacoes    ?? "");
          if (salvo.imagemAnimal) setImagemAnimal(salvo.imagemAnimal);
        } else {
          let extrasD = {};
          try { extrasD = data.dados_extras ? JSON.parse(data.dados_extras) : {}; } catch { }
          const atrEditD = extrasD.atrEdit ?? {};
          const vigor    = Math.max(0, (atrEditD.vigor    ?? data.atr_vigor    ?? 0) - 2);
          const espirito = Math.max(0, (atrEditD.espirito ?? data.atr_espirito ?? 0) - 2);
          const vMax = 20 + vigor   * 5;
          const cMax = 10 + espirito * 5;
          setVitalMax(vMax); setVitalAtual(vMax);
          setChakraMax(cMax); setChakraAtual(cMax);
        }
      })
      .then(() => { setTimeout(() => { fichaCarregada.current = true; }, 500); })
      .catch(() => { setDonorFicha({ error: true }); fichaCarregada.current = true; })
      .finally(() => setCarregando(false));
  }, [id]);

  // ── Atributos derivados ───────────────────────────────────────────────────
  // atrEditDono: estado carregado uma vez no useEffect, mais confiável que parse inline
  const [atrEditDono, setAtrEditDono] = useState({});
  // Animal = dono - 2, mín 0
  const atrDono = {
    forca:        atrEditDono.forca        ?? donorFicha?.atr_forca        ?? 0,
    destreza:     atrEditDono.destreza     ?? donorFicha?.atr_destreza     ?? 0,
    agilidade:    atrEditDono.agilidade    ?? donorFicha?.atr_agilidade    ?? 0,
    percepcao:    atrEditDono.percepcao    ?? donorFicha?.atr_percepcao    ?? 0,
    inteligencia: atrEditDono.inteligencia ?? donorFicha?.atr_inteligencia ?? 0,
    vigor:        atrEditDono.vigor        ?? donorFicha?.atr_vigor        ?? 0,
    espirito:     atrEditDono.espirito     ?? donorFicha?.atr_espirito     ?? 0,
  };
  // Atributos do animal = dono - 2, mín 0
  const atr = {
    forca:        Math.max(0, atrDono.forca        - 2),
    destreza:     Math.max(0, atrDono.destreza     - 2),
    agilidade:    Math.max(0, atrDono.agilidade    - 2),
    percepcao:    Math.max(0, atrDono.percepcao    - 2),
    inteligencia: Math.max(0, atrDono.inteligencia - 2),
    vigor:        Math.max(0, atrDono.vigor        - 2),
    espirito:     Math.max(0, atrDono.espirito     - 2),
  };

  // ── Recalcula Vitalidade/Chakra quando os atributos do dono mudarem ────────
  useEffect(() => {
    if (!fichaCarregada.current) return;
    const novaVit = 20 + atr.vigor   * 5;
    const novaChk = 10 + atr.espirito * 5;
    setVitalMax(novaVit);
    setChakraMax(novaChk);
  }, [atr.vigor, atr.espirito]); // eslint-disable-line

  // ── HC calculados ─────────────────────────────────────────────────────────
  const temApt = (aptId) => aptidoes.some(a => a.id === aptId);
  const ccBase = temApt("acuidade") ? atr.destreza : atr.forca;
  const hcCalc = {
    CC:  3 + ccBase        + (hcBonus.CC  ?? 0),
    CD:  3 + atr.destreza  + (hcBonus.CD  ?? 0),
    ESQ: 3 + atr.agilidade + (hcBonus.ESQ ?? 0) + (temApt("reflexos") ? 1 : 0),
    LM:  3 + atr.percepcao + (hcBonus.LM  ?? 0) + (temApt("intuicao") ? 1 : 0),
  };

  const deslocamento = temApt("velocista")
    ? 10 + atr.agilidade
    : 10 + Math.floor(atr.agilidade / 2);

  const tamanho = getTamanho(lidarAnimais);

  // ── Rolagem 2d8 ───────────────────────────────────────────────────────────
  const rolar = useCallback((label, bonus = 0) => {
    const { d1, d2 } = rolar2d8();
    const soma = d1 + d2;
    const total = soma + bonus;
    const critico = soma === 16;
    const falhaCritica = soma === 2;
    const r = { label, d1, d2, bonus, total, critico, falhaCritica, is1d8: false };
    setResultado(r);
    setHistorico(h => [{ ...r, ts: makeTimestamp() }, ...h].slice(0, 50));
  }, []);

  // ── Rolagem 1d8 (atributos) ───────────────────────────────────────────────
  const rolarAtributo = useCallback((label, valorAtr) => {
    const d1 = rolar1d8();
    const total = d1 + valorAtr;
    const critico = d1 === 8;
    const falhaCritica = d1 === 1;
    const r = { label, d1, d2: null, bonus: valorAtr, total, critico, falhaCritica, is1d8: true };
    setResultado(r);
    setHistorico(h => [{ ...r, ts: makeTimestamp() }, ...h].slice(0, 50));
  }, []);

  // ── Refs para dados frescos no save (evita closure stale) ──────────────────
  const nomeAnimalRef  = useRef(nomeAnimal);
  const especieRef     = useRef(especie);
  const vitalAtualRef  = useRef(vitalAtual);
  const vitalMaxRef    = useRef(vitalMax);
  const chakraAtualRef = useRef(chakraAtual);
  const chakraMaxRef   = useRef(chakraMax);
  const hcBonusRef     = useRef(hcBonus);
  const periciasRef    = useRef(pericias);
  const aptidoesRef    = useRef(aptidoes);
  const anotacoesRef   = useRef(anotacoes);
  const imagemAnimalRef = useRef(imagemAnimal);
  const donorFichaRef  = useRef(donorFicha);
  useEffect(() => { nomeAnimalRef.current   = nomeAnimal;   }, [nomeAnimal]);
  useEffect(() => { especieRef.current      = especie;      }, [especie]);
  useEffect(() => { vitalAtualRef.current   = vitalAtual;   }, [vitalAtual]);
  useEffect(() => { vitalMaxRef.current     = vitalMax;     }, [vitalMax]);
  useEffect(() => { chakraAtualRef.current  = chakraAtual;  }, [chakraAtual]);
  useEffect(() => { chakraMaxRef.current    = chakraMax;    }, [chakraMax]);
  useEffect(() => { hcBonusRef.current      = hcBonus;      }, [hcBonus]);
  useEffect(() => { periciasRef.current     = pericias;     }, [pericias]);
  useEffect(() => { aptidoesRef.current     = aptidoes;     }, [aptidoes]);
  useEffect(() => { anotacoesRef.current    = anotacoes;    }, [anotacoes]);
  useEffect(() => { imagemAnimalRef.current = imagemAnimal; }, [imagemAnimal]);
  useEffect(() => { donorFichaRef.current   = donorFicha;   }, [donorFicha]);

  // ── Salvar — usa refs para dados frescos, sem GET intermediário ──────────────
  const salvar = useCallback((overrides = {}) => {
    if (!id || !fichaCarregada.current) return;
    let extrasBase = {};
    try { extrasBase = donorFichaRef.current?.dados_extras ? JSON.parse(donorFichaRef.current.dados_extras) : {}; } catch { }
    const novoExtras = {
      ...extrasBase,
      animal_companion: {
        nome:         nomeAnimalRef.current,
        especie:      especieRef.current,
        vitalAtual:   vitalAtualRef.current,
        vitalMax:     vitalMaxRef.current,
        chakraAtual:  chakraAtualRef.current,
        chakraMax:    chakraMaxRef.current,
        hcBonus:      hcBonusRef.current,
        pericias:     periciasRef.current,
        aptidoes:     aptidoesRef.current,
        anotacoes:    anotacoesRef.current,
        imagemAnimal: imagemAnimalRef.current ?? null,
        ...overrides,
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
      .then(r => { if (!r.ok) console.error("[animal] save failed:", r.status); })
      .catch(e => console.error("[animal] save error:", e));
  }, [id]); // eslint-disable-line

  const saveTimer = useRef(null);
  const [prontoParaSalvar, setProntoParaSalvar] = useState(false);

  // Marca pronto após carregar
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
  }, [nomeAnimal, especie, vitalAtual, vitalMax, chakraAtual, chakraMax, hcBonus, pericias, aptidoes, anotacoes, imagemAnimal, prontoParaSalvar]);

  const toggleApt = (aptId) => {
    setAptidoes(prev =>
      prev.some(a => a.id === aptId) ? prev.filter(a => a.id !== aptId) : [...prev, { id: aptId }]
    );
  };

  // Perícia total do animal: ½ atr do ANIMAL (já com -2) + pts extras
  // Conforme regra: "ficha igual ao personagem, porém com 2 níveis a menos em todos os atributos, habilidades e perícias"
  const periciaTotal = (p) => {
    const pts  = pericias[p.id] ?? 0;
    // base = ½ atributo do ANIMAL (já aplicado -2)
    const base = Math.floor((atr[p.atr] ?? 0) / 2);
    return Math.max(0, base + pts);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (carregando) return (
    <div className="fai-loading"><p className="fai-loading-txt">Carregando companheiro...</p></div>
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

  return (
    <div className="fai-page">

      {/* ── TOPBAR ── */}
      <div className="fai-topbar">
        <button className="fai-voltar-btn" onClick={() => navigate(`/personagem-naruto/${id}`)}>← VOLTAR</button>
        <div className="fai-topbar-centro">
          <span className="fai-topbar-tag">FICHA COMPANHEIRO</span>
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
            <span className="fai-cab-label">NOME DO ANIMAL</span>
            <input className="fai-cab-input" value={nomeAnimal} onChange={e => setNomeAnimal(e.target.value)} placeholder="Ex: Akamaru" />
          </div>
          <div className="fai-cab-field">
            <span className="fai-cab-label">ESPÉCIE</span>
            <select className="fai-cab-select" value={especie} onChange={e => setEspecie(e.target.value)}>
              <option value="cão">Cão</option>
              <option value="lobo">Lobo</option>
            </select>
          </div>
          <div className="fai-cab-field">
            <span className="fai-cab-label">TAMANHO</span>
            <span className="fai-cab-static">
              {tamanho.label}
            </span>
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

            {/* Avatar */}
            <div className="fai-avatar-wrapper" onClick={() => setShowCropModal(true)} title="Clique para alterar a foto">
              {imagemAnimal
                ? <img src={imagemAnimal} alt={nomeAnimal} className="fai-avatar-img" />
                : <div className="fai-avatar-placeholder"><i className="fas fa-paw" /></div>
              }
              <div className="fai-avatar-edit-overlay"><i className="fas fa-camera" /></div>
            </div>

            {showCropModal && (
              <ImageCropModal
                title="Foto do Animal"
                src={imagemAnimal || null}
                onConfirm={(base64) => {
                  setImagemAnimal(base64);
                  imagemAnimalRef.current = base64;
                  setShowCropModal(false);
                  salvar({ imagemAnimal: base64 });
                }}
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
            <div className="fai-secao-titulo">ATRIBUTOS</div>
            <div className="fai-atr-grid">
              {ATRIBUTOS_LABELS.map(({ key, label, nome }) => (
                <div key={key} className="fai-atr-item">
                  <span className="fai-atr-label">{label}</span>
                  <span className="fai-atr-nome">{nome}</span>
                  <span className="fai-atr-val">{atr[key]}</span>
                  <button
                    className="fai-btn-rolar fai-atr-rolar"
                    onClick={() => rolarAtributo(label, atr[key])}
                    title={`Rolar ${label} (1d8 + ${atr[key]})`}
                  >
                    <i className="fas fa-dice-d20" />
                  </button>
                </div>
              ))}
            </div>

            {/* HC */}
            <div className="fai-secao-titulo">HABILIDADES DE COMBATE</div>
            <div className="fai-hc-grid">
              {[
                { key: "CC",  label: "CC",  nome: "Combate Corporal"    },
                { key: "CD",  label: "CD",  nome: "Combate à Distância" },
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
                  <button className="fai-btn-rolar fai-hc-rolar" onClick={() => rolar(label, hcCalc[key])} title={`Rolar ${label}`}>
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
                <span className="fai-stat-val">{deslocamento}m</span>
              </div>
            </div>

          </div>{/* fim col-esq */}

          {/* ── COL MEIO: Perícias ── */}
          <div className="fai-col-meio">
            <div className="fai-secao-titulo">PERÍCIAS PERMITIDAS</div>
            <p className="fai-obs-pequena">Base = ½ atr do animal. Demais perícias = Nível Zero.</p>
            <div className="fai-pericias-lista">
              {PERICIAS_PERMITIDAS.map(p => {
                const total = periciaTotal(p);
                const pts   = pericias[p.id] ?? 0;
                return (
                  <div key={p.id} className="fai-pericia-row">
                    <span className="fai-pericia-nome">{p.nome}</span>
                    <span className="fai-pericia-atr">{p.atr.slice(0,3).toUpperCase()}</span>
                    <button className="fai-pericia-menos" onClick={() => setPericias(pr => ({ ...pr, [p.id]: Math.max(0, (pr[p.id]??0) - 1) }))}>-</button>
                    <span className="fai-pericia-pts">{pts}</span>
                    <button className="fai-pericia-mais" onClick={() => setPericias(pr => ({ ...pr, [p.id]: (pr[p.id]??0) + 1 }))}>+</button>
                    <span className="fai-pericia-total">{total}</span>
                    <button className="fai-btn-rolar fai-pericia-rolar" onClick={() => rolar(p.nome, total)}>
                      <i className="fas fa-dice-d20" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="fai-secao-titulo" style={{ marginTop: 20 }}>ANOTAÇÕES</div>
            <textarea className="fai-anotacoes" value={anotacoes} onChange={e => setAnotacoes(e.target.value)} />
          </div>

        </div>{/* fim fai-body */}

        {/* ── COL DIREITA ── */}
        <div className="fai-col-dir">
          <div className="fai-secao-titulo">APTIDÕES PERMITIDAS</div>
          <p className="fai-obs-pequena">Selecione as aptidões adquiridas pelo companheiro.</p>
          <div className="fai-aptidoes-lista">
            {APTIDOES_PERMITIDAS.map(apt => {
              const ativa = temApt(apt.id);
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
        </div>

      </div>{/* fim fai-sheet */}

      <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
      <PainelHistorico historico={historico} aberto={painelAberto} onFechar={() => setPainelAberto(false)} />
    </div>
  );
};

export default FichaAnimalInuzuka;