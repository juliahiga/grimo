import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/Personagens.css";
import tlouImg from "../assets/tlouTTRPG.png";
import { useUser } from "../context/UserContext";

const sistemas = [
  { id: "tlou", nome: "The Last of Us TTRPG", imagem: tlouImg },
];

const formatarData = (dataStr) => {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

const PersonagemCard = ({ p, onDeletar, onDuplicar }) => {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="personagem-card">
      <div className="personagem-card-avatar">
        {p.imagem ? (
          <img src={p.imagem} alt={p.nome_personagem} />
        ) : (
          <div className="personagem-card-avatar-placeholder">
            {p.nome_personagem?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>

      <div className="personagem-card-info">
        <div className="personagem-card-nome" title={p.nome_personagem}>
          {p.nome_personagem}
        </div>
        <div className="personagem-card-nivel">{p.nivel}</div>
        <div className="personagem-card-data">Registrado em {formatarData(p.criado_em)}</div>
        <div className="personagem-card-sistema">The Last of Us</div>
      </div>

      <div className="personagem-card-acoes">
        <button
          className="personagem-acessar-btn"
          onClick={() => navigate(`/ficha/${p.id}`)}
        >
          Acessar Ficha
        </button>
      </div>

      <div className="personagem-card-menu" ref={menuRef}>
        <button
          className="personagem-engrenagem-btn"
          onClick={() => setMenuAberto((v) => !v)}
          title="Opções"
        >
          ⚙
        </button>

        {menuAberto && (
          <div className="personagem-dropdown">
            <button
              className="personagem-dropdown-item"
              onClick={() => { setMenuAberto(false); onDuplicar(p); }}
            >
              <span className="dropdown-icon">⧉</span> Duplicar
            </button>
            <button
              className="personagem-dropdown-item deletar"
              onClick={() => { setMenuAberto(false); onDeletar(p); }}
            >
              <span className="dropdown-icon">🗑</span> Deletar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ModalConfirmar = ({ personagem, onConfirmar, onCancelar }) => {
  const [inputValue, setInputValue] = useState("");
  const confirmado = inputValue === "REMOVER";

  return createPortal(
    <div className="confirmar-overlay" onClick={onCancelar}>
      <div className="confirmar-modal-novo" onClick={(e) => e.stopPropagation()}>
        <div className="confirmar-header">
          <h3 className="confirmar-titulo">Deletar este personagem?</h3>
          <button className="confirmar-fechar" onClick={onCancelar}>✕</button>
        </div>

        <p className="confirmar-descricao">
          Para confirmar, digite <strong>REMOVER</strong> no campo abaixo:
        </p>
        <p className="confirmar-aviso">Atenção: essa operação é permanente e irreversível!</p>

        <div className="confirmar-input-row">
          <input
            className="confirmar-input"
            type="text"
            placeholder=""
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
    </div>,
    document.getElementById("modal-root")
  );
};

const Personagens = () => {
  const { user, triggerLogin } = useUser();
  const [personagens, setPersonagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [modalSistema, setModalSistema] = useState(false);
  const [modalDeletar, setModalDeletar] = useState(null);
  const [hoveredSistema, setHoveredSistema] = useState(null);
  const [aviso, setAviso] = useState(null);
  const navigate = useNavigate();

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(null), 3500);
  };

  const handleNovoPersonagem = () => {
    if (!user) triggerLogin();
    else if (personagens.length >= 12) mostrarAviso("Você atingiu o limite de 12 personagens!");
    else setModalSistema(true);
  };

  const buscarPersonagens = useCallback(() => {
    if (!user) return;
    setCarregando(true);
    fetch("${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/fichas", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setPersonagens(Array.isArray(data) ? data : []))
      .catch(() => setPersonagens([]))
      .finally(() => setCarregando(false));
  }, [user]);

  useEffect(() => {
    buscarPersonagens();
  }, [buscarPersonagens]);

  const handleDeletar = async (p) => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/fichas/${p.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setPersonagens((prev) => prev.filter((x) => x.id !== p.id));
    } catch {
    } finally {
      setModalDeletar(null);
    }
  };

  const handleDuplicar = async (p) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/fichas/${p.id}/duplicar`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) buscarPersonagens();
      else {
        const err = await res.json();
        if (err.error) mostrarAviso(err.error);
      }
    } catch { }
  };

  return (
    <div
      className="personagens-page"
      style={personagens.length > 0 ? { alignItems: "flex-start", overflowY: "auto", paddingTop: "8rem", paddingLeft: "2rem", paddingRight: "2rem" } : {}}
    >

      {carregando ? (
        <p className="personagens-loading">Carregando personagens...</p>

      ) : personagens.length === 0 ? (
        <div className="personagens-empty">
          <p className="personagens-empty-text">NENHUM PERSONAGEM ENCONTRADO!</p>
          <button className="personagens-novo-btn" onClick={handleNovoPersonagem}>
            NOVO PERSONAGEM
          </button>
        </div>

      ) : (
        <div className="personagens-com-lista">
          <div className="personagens-topo">
            <span className="personagens-contador">Personagens: {personagens.length}/12</span>
            <button className="personagens-novo-btn" onClick={handleNovoPersonagem}>
              NOVO PERSONAGEM
            </button>
          </div>

          <div className="personagens-lista">
            {personagens.map((p) => (
              <PersonagemCard
                key={p.id}
                p={p}
                onDeletar={(p) => setModalDeletar(p)}
                onDuplicar={handleDuplicar}
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
                  onClick={() => navigate("/novo-tlourpg")}
                >
                  <img src={s.imagem} alt={s.nome} />
                  <span>{s.nome}</span>
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="sistema-card empty"><span>Em breve</span></div>
              ))}
            </div>
          </div>
        </div>,
        document.getElementById("modal-root")
      )}

      {modalDeletar && (
        <ModalConfirmar
          personagem={modalDeletar}
          onConfirmar={() => handleDeletar(modalDeletar)}
          onCancelar={() => setModalDeletar(null)}
        />
      )}

      {aviso && <div className="aviso-toast">{aviso}</div>}
    </div>
  );
};

export default Personagens;