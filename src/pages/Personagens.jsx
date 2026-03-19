import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/Personagens.css";
import tlouImg from "../assets/tlouTTRPG.png";
import narutoImg from "../assets/naruto_sns.png";
import { useUser } from "../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

const sistemas = [
  { id: "tlou",   nome: "The Last of Us TTRPG",   imagem: tlouImg,   rota: "/novo-tlourpg" },
  { id: "naruto", nome: "Naruto: Shinobi no Sho",  imagem: narutoImg, rota: "/novo-naruto"  },
];

const formatarData = (dataStr) => {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
};

// ── Card genérico (TLOU, Naruto e futuros sistemas) ──────────────────────────
const PersonagemCard = ({ p, onDeletar, onDuplicar, subtitulo, sistema, rota }) => {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="personagem-card">
      <div className="personagem-card-avatar">
        {p.imagem
          ? <img src={p.imagem} alt={p.nome_personagem} />
          : <div className="personagem-card-avatar-placeholder">{p.nome_personagem?.[0]?.toUpperCase() || "?"}</div>
        }
      </div>

      <div className="personagem-card-info">
        <div className="personagem-card-nome" title={p.nome_personagem}>{p.nome_personagem}</div>
        <div className="personagem-card-nivel">{subtitulo}</div>
        <div className="personagem-card-data">Registrado em {formatarData(p.criado_em)}</div>
        <div className="personagem-card-sistema">{sistema}</div>
      </div>

      <div className="personagem-card-acoes">
        <button className="personagem-acessar-btn" onClick={() => navigate(rota)}>
          Acessar Ficha
        </button>
      </div>

      <div className="personagem-card-menu" ref={menuRef}>
        <button className="personagem-engrenagem-btn" onClick={() => setMenuAberto((v) => !v)} title="Opções">⚙</button>
        {menuAberto && (
          <div className="personagem-dropdown">
            {onDuplicar && (
              <button className="personagem-dropdown-item" onClick={() => { setMenuAberto(false); onDuplicar(p); }}>
                <span className="dropdown-icon">⧉</span> Duplicar
              </button>
            )}
            <button className="personagem-dropdown-item deletar" onClick={() => { setMenuAberto(false); onDeletar(p); }}>
              <span className="dropdown-icon">🗑</span> Deletar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Modal confirmar deletar ───────────────────────────────────────────────────
const ModalConfirmar = ({ onConfirmar, onCancelar }) => {
  const [inputValue, setInputValue] = useState("");
  const confirmado = inputValue === "REMOVER";

  const conteudo = (
    <div className="confirmar-overlay" onClick={onCancelar}>
      <div className="confirmar-modal-novo" onClick={(e) => e.stopPropagation()}>
        <div className="confirmar-header">
          <h3 className="confirmar-titulo">Deletar este personagem?</h3>
          <button className="confirmar-fechar" onClick={onCancelar}>✕</button>
        </div>
        <p className="confirmar-descricao">Para confirmar, digite <strong>REMOVER</strong> no campo abaixo:</p>
        <p className="confirmar-aviso">Atenção: essa operação é permanente e irreversível!</p>
        <div className="confirmar-input-row">
          <input
            className="confirmar-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
          <button
            className={`confirmar-btn-confirmar ${confirmado ? "ativo" : ""}`}
            onClick={confirmado ? onConfirmar : undefined}
            disabled={!confirmado}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById("modal-root");
  return modalRoot ? createPortal(conteudo, modalRoot) : conteudo;
};

// ── Página principal ──────────────────────────────────────────────────────────
const Personagens = () => {
  const { user, triggerLogin } = useUser();
  const [personagensTlou,   setPersonagensTlou]   = useState([]);
  const [personagensNaruto, setPersonagensNaruto] = useState([]);
  const [carregando,   setCarregando]   = useState(false);
  const [modalSistema, setModalSistema] = useState(false);
  const [modalDeletar, setModalDeletar] = useState(null); // { p, sistema }
  const [hoveredSistema, setHoveredSistema] = useState(null);
  const [aviso, setAviso] = useState(null);
  const navigate = useNavigate();

  const mostrarAviso = (msg) => { setAviso(msg); setTimeout(() => setAviso(null), 3500); };

  const totalPersonagens = personagensTlou.length + personagensNaruto.length;

  const handleNovoPersonagem = () => {
    if (!user) triggerLogin();
    else if (totalPersonagens >= 12) mostrarAviso("Você atingiu o limite de 12 personagens!");
    else setModalSistema(true);
  };

  const buscarPersonagens = useCallback(() => {
    if (!user) return;
    setCarregando(true);
    Promise.all([
      fetch(`${API}/api/tlou/fichas`,   { credentials: "include" }).then((r) => r.json()).catch(() => []),
      fetch(`${API}/api/naruto/fichas`, { credentials: "include" }).then((r) => r.json()).catch(() => []),
    ]).then(([tlou, naruto]) => {
      setPersonagensTlou(Array.isArray(tlou)     ? tlou   : []);
      setPersonagensNaruto(Array.isArray(naruto) ? naruto : []);
    }).finally(() => setCarregando(false));
  }, [user]);

  useEffect(() => { buscarPersonagens(); }, [buscarPersonagens]);

  // ── Deletar TLOU
  const handleDeletarTlou = async (p) => {
    try {
      const res = await fetch(`${API}/api/tlou/fichas/${p.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setPersonagensTlou((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        mostrarAviso("Erro ao deletar personagem. Tente novamente.");
      }
    } catch {
      mostrarAviso("Erro de conexão ao deletar personagem.");
    } finally {
      setModalDeletar(null);
    }
  };

  // ── Deletar Naruto
  const handleDeletarNaruto = async (p) => {
    try {
      const res = await fetch(`${API}/api/naruto/fichas/${p.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setPersonagensNaruto((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        mostrarAviso("Erro ao deletar personagem. Tente novamente.");
      }
    } catch {
      mostrarAviso("Erro de conexão ao deletar personagem.");
    } finally {
      setModalDeletar(null);
    }
  };

  const handleDuplicarTlou = async (p) => {
    try {
      const res = await fetch(`${API}/api/tlou/fichas/${p.id}/duplicar`, { method: "POST", credentials: "include" });
      if (res.ok) buscarPersonagens();
      else { const err = await res.json(); if (err.error) mostrarAviso(err.error); }
    } catch { }
  };

  const handleDuplicarNaruto = async (p) => {
    try {
      const res = await fetch(`${API}/api/naruto/fichas/${p.id}/duplicar`, { method: "POST", credentials: "include" });
      if (res.ok) buscarPersonagens();
      else { const err = await res.json(); if (err.error) mostrarAviso(err.error); }
    } catch { }
  };

  const confirmarDeletar = () => {
    if (!modalDeletar) return;
    if (modalDeletar.sistema === "naruto") handleDeletarNaruto(modalDeletar.p);
    else handleDeletarTlou(modalDeletar.p);
  };

  const emBreveCount = 8 - sistemas.length;

  return (
    <div
      className="personagens-page"
      style={totalPersonagens > 0 ? { alignItems: "flex-start", overflowY: "auto", paddingTop: "8rem", paddingLeft: "2rem", paddingRight: "2rem" } : {}}
    >
      {carregando ? (
        <p className="personagens-loading">Carregando personagens...</p>

      ) : totalPersonagens === 0 ? (
        <div className="personagens-empty">
          <p className="personagens-empty-text">NENHUM PERSONAGEM ENCONTRADO!</p>
          <button className="personagens-novo-btn" onClick={handleNovoPersonagem}>NOVO PERSONAGEM</button>
        </div>

      ) : (
        <div className="personagens-com-lista">
          <div className="personagens-topo">
            <span className="personagens-contador">Personagens: {totalPersonagens}/12</span>
            <button className="personagens-novo-btn" onClick={handleNovoPersonagem}>NOVO PERSONAGEM</button>
          </div>

          <div className="personagens-lista">
            {personagensTlou.map((p) => (
              <PersonagemCard
                key={`tlou-${p.id}`}
                p={p}
                subtitulo={p.nivel}
                sistema="The Last of Us"
                rota={`/ficha/${p.id}`}
                onDeletar={(per) => setModalDeletar({ p: per, sistema: "tlou" })}
                onDuplicar={handleDuplicarTlou}
              />
            ))}
            {personagensNaruto.map((p) => (
              <PersonagemCard
                key={`naruto-${p.id}`}
                p={p}
                subtitulo={`${p.nivel_shinobi} | ${p.cla_nome}`}
                sistema="Naruto: Shinobi no Sho"
                rota={`/naruto/ficha/${p.id}`}
                onDeletar={(per) => setModalDeletar({ p: per, sistema: "naruto" })}
                onDuplicar={handleDuplicarNaruto}
              />
            ))}
          </div>
        </div>
      )}

      {modalSistema && createPortal(
        <div className="sistema-overlay" onClick={() => setModalSistema(false)}>
          <div className="sistema-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="sistema-titulo">Em qual sistema você gostaria de criar seu personagem?</h2>
            <div className="sistema-grid">
              {sistemas.map((s) => (
                <div
                  key={s.id}
                  className={`sistema-card ${hoveredSistema === s.id ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredSistema(s.id)}
                  onMouseLeave={() => setHoveredSistema(null)}
                  onClick={() => navigate(s.rota)}
                >
                  <img src={s.imagem} alt={s.nome} />
                  <span>{s.nome}</span>
                </div>
              ))}
              {Array.from({ length: emBreveCount }).map((_, i) => (
                <div key={`empty-${i}`} className="sistema-card empty"><span>Em breve</span></div>
              ))}
            </div>
          </div>
        </div>,
        document.getElementById("modal-root") || document.body
      )}

      {modalDeletar && (
        <ModalConfirmar
          onConfirmar={confirmarDeletar}
          onCancelar={() => setModalDeletar(null)}
        />
      )}

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </div>
  );
};

export default Personagens;