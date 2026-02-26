import React from "react";
import "../styles/Personagens.css";

const Personagens = () => {
  const personagens = [];

  return (
    <div className="personagens-page">
      {personagens.length === 0 ? (
        <div className="personagens-empty">
          <p className="personagens-empty-text">NENHUM PERSONAGEM ENCONTRADO!</p>
          <button className="personagens-novo-btn">Novo Personagem</button>
        </div>
      ) : (
        <div className="personagens-lista">
          {/* lista de personagens aqui futuramente */}
        </div>
      )}
    </div>
  );
};

export default Personagens;