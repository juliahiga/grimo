import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/Campanhas.css";
import tlouImg from "../assets/tlouTTRPG.png";
import { useUser } from "../context/UserContext";

const sistemas = [
  { id: "tlou", nome: "The Last of Us", imagem: tlouImg },
];

const formatarData = (dataStr) => {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

/* ── Modal de confirmação de deleção ── */
const ModalDeletarCampanha = ({ campanha, onConfirmar, onCancelar }) => {
  const [inputValue, setInputValue] = useState("");
  const confirmado = inputValue === "REMOVER";

  return createPortal(
    <div className="confirmar-overlay" onClick={onCancelar}>
      <div className="confirmar-modal-novo" onClick={(e) => e.stopPropagation()}>
        <div className="confirmar-header">
          <h3 className="confirmar-titulo">Deletar campanha?</h3>
          <button className="confirmar-fechar" onClick={onCancelar}>✕</button>
        </div>
        <p className="confirmar-descricao">
          Para confirmar essa operação, digite <strong>REMOVER</strong> no campo abaixo:
        </p>
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
    </div>,
    document.getElementById("modal-root")
  );
};

/* ── Card de campanha ── */
const CampanhaCard = ({ c, onDeletar }) => {
  const navigate = useNavigate();
  // jogadores sem contar o mestre
  //const totalJogadores = c.sou_mestre
  //  ? c.total_jogadores
  //    : c.total_jogadores;

  return (
    <div
      className="campanha-card"
      onClick={() => navigate(`/campanha/${c.id}`)}
    >
      <div className="campanha-card-imagem">
        {c.imagem ? (
          <img src={c.imagem} alt={c.nome} />
        ) : (
          <div className="campanha-card-imagem-placeholder">
            {c.nome?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Badge de jogadores — fundo transparente */}
        <div className="campanha-card-jogadores">
          <i className="fa-solid fa-people-group" />
          <span>{c.total_jogadores}</span>
        </div>

        {/* Lixeira — só aparece para o mestre */}
        {c.sou_mestre && (
          <button
            className="campanha-card-deletar"
            onClick={(e) => { e.stopPropagation(); onDeletar(c); }}
            title="Deletar campanha"
          >
            <i className="fa-solid fa-trash" />
          </button>
        )}
      </div>

      <div className="campanha-card-info">
        <div className="campanha-card-nome">{c.nome}</div>
        <div className="campanha-card-sistema">The Last of Us</div>
      </div>

      <div className="campanha-card-footer">
        <div className="campanha-card-meta">
          Iniciada em: {formatarData(c.criado_em)} |{" "}
          <span className={c.sou_mestre ? "campanha-role mestre" : "campanha-role jogador"}>
            {c.sou_mestre ? "Mestre" : "Jogador"}
          </span>
        </div>
        <button
          className="campanha-acessar-btn"
          onClick={(e) => { e.stopPropagation(); navigate(`/campanha/${c.id}`); }}
        >
          Acessar
        </button>
      </div>
    </div>
  );
};

/* ── Página principal ── */
const Campanhas = () => {
  const { user, loading: userLoading, triggerLogin } = useUser();
  const [campanhas, setCampanhas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDeletar, setModalDeletar] = useState(null);
  const [hoveredSistema, setHoveredSistema] = useState(null);
  const navigate = useNavigate();

  const buscarCampanhas = () => {
    setCarregando(true);
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/campanhas`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCampanhas(Array.isArray(data) ? data : []))
      .catch(() => setCampanhas([]))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) { setCarregando(false); return; }
    buscarCampanhas();
  }, [user, userLoading]);

  const handleDeletar = async () => {
    if (!modalDeletar) return;
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/campanhas/${modalDeletar.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setCampanhas((prev) => prev.filter((c) => c.id !== modalDeletar.id));
    } catch {}
    finally { setModalDeletar(null); }
  };

  const handleNovaCampanha = () => {
    if (!user) triggerLogin();
    else setModalOpen(true);
  };

  return (
    <div
      className="campanhas-page"
      style={campanhas.length > 0 ? { alignItems: "flex-start", overflowY: "auto", paddingTop: "8rem", paddingLeft: "2rem", paddingRight: "2rem" } : {}}
    >
      {carregando ? (
        <p className="campanhas-loading">Carregando campanhas...</p>

      ) : campanhas.length === 0 ? (
        <div className="campanhas-empty">
          <p className="campanhas-empty-text">
            VOCÊ AINDA NÃO CRIOU OU PARTICIPA DE NENHUMA CAMPANHA!
          </p>
          <button className="campanhas-novo-btn" onClick={handleNovaCampanha}>
            NOVA CAMPANHA
          </button>
        </div>

      ) : (
        <div className="campanhas-com-lista">
          <div className="campanhas-topo">
            <span className="campanhas-contador">Campanhas: {campanhas.length}/6</span>
            <button className="campanhas-novo-btn" onClick={handleNovaCampanha}>
              NOVA CAMPANHA
            </button>
          </div>
          <div className="campanhas-lista">
            {campanhas.map((c) => (
              <CampanhaCard
                key={c.id}
                c={c}
                onDeletar={(c) => setModalDeletar(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal seleção de sistema */}
      {modalOpen && createPortal(
        <div className="sistema-overlay" onClick={() => setModalOpen(false)}>
          <div className="sistema-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="sistema-titulo">
              Em qual sistema você gostaria de criar sua campanha?
            </h2>
            <div className="sistema-grid">
              {sistemas.map((s) => (
                <div
                  key={s.id}
                  className={`sistema-card ${hoveredSistema === s.id ? "hovered" : ""}`}
                  onMouseEnter={() => setHoveredSistema(s.id)}
                  onMouseLeave={() => setHoveredSistema(null)}
                  onClick={() => navigate("/nova-campanha-tlourpg")}
                >
                  <img src={s.imagem} alt={s.nome} />
                  <span>{s.nome}</span>
                </div>
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="sistema-card empty">
                  <span>Em breve</span>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.getElementById("modal-root")
      )}

      {/* Modal deletar campanha */}
      {modalDeletar && (
        <ModalDeletarCampanha
          campanha={modalDeletar}
          onConfirmar={handleDeletar}
          onCancelar={() => setModalDeletar(null)}
        />
      )}
    </div>
  );
};

export default Campanhas;