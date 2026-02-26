import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // import para navegação
import "../styles/Personagens.css";
import tlouImg from "../assets/tlouTTRPG.png";

const sistemas = [
  { id: "tlou", nome: "The Last of Us TTRPG", imagem: tlouImg },
];

const Personagens = () => {
  const personagens = [];
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredSistema, setHoveredSistema] = useState(null);

  const navigate = useNavigate();

  return (
    <div className="personagens-page">
      {personagens.length === 0 ? (
        <div className="personagens-empty">
          <p className="personagens-empty-text">NENHUM PERSONAGEM ENCONTRADO!</p>
          <button
            className="personagens-novo-btn"
            onClick={() => setModalOpen(true)}
          >
            NOVO PERSONAGEM
          </button>
        </div>
      ) : (
        <div className="personagens-lista" />
      )}

      {modalOpen && (
        <div className="sistema-overlay" onClick={() => setModalOpen(false)}>
          <div className="sistema-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="sistema-titulo">
              Em qual sistema você gostaria de criar seu personagem?
            </h2>
            <div className="sistema-grid">
              {sistemas.map((s) => (
                <div
                  key={s.id}
                  className={`sistema-card ${
                    hoveredSistema === s.id ? "hovered" : ""
                  }`}
                  onMouseEnter={() => setHoveredSistema(s.id)}
                  onMouseLeave={() => setHoveredSistema(null)}
                  onClick={() => navigate("/novo-tlourpg")} // redireciona ao clicar
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
        </div>
      )}
    </div>
  );
};

export default Personagens;