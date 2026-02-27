import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NovaCampanhaTlouRpg.css";

const NovaCampanhaTlouRpg = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [escudoPrivado, setEscudoPrivado] = useState(false);
  const descricaoRef = useRef(null);

  const formatarTexto = (comando) => {
    document.execCommand(comando, false, null);
    descricaoRef.current?.focus();
  };

  const handleCriar = () => {
    // futuramente: salvar campanha
    navigate("/campanhas");
  };

  return (
    <div className="nova-campanha-page">
      <h1 className="nova-campanha-titulo">Criar Campanha</h1>

      <div className="nova-campanha-form">

        {/* Nome */}
        <div className="nc-field">
          <label className="nc-label">Nome<span className="nc-obrigatorio">*</span></label>
          <input
            className="nc-input"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da campanha"
          />
        </div>

        {/* Escudo do Mestre */}
        <div className="nc-field">
          <label className="nc-label">Escudo do Mestre Privado</label>
          <p className="nc-obs">Obs: essa opção pode ser editada após a criação da campanha</p>
          <div className="nc-toggle">
            <button
              className={`nc-toggle-btn ${!escudoPrivado ? "active" : ""}`}
              onClick={() => setEscudoPrivado(false)}
            >
              DESLIGADO
            </button>
            <button
              className={`nc-toggle-btn ${escudoPrivado ? "active" : ""}`}
              onClick={() => setEscudoPrivado(true)}
            >
              LIGADO
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="nc-field">
          <label className="nc-label">Descrição</label>
          <div className="nc-editor">
            <div className="nc-editor-toolbar">
              <button className="nc-format-btn" onClick={() => formatarTexto("bold")}><b>B</b></button>
              <button className="nc-format-btn" onClick={() => formatarTexto("italic")}><i>I</i></button>
              <button className="nc-format-btn" onClick={() => formatarTexto("underline")}><u>U</u></button>
            </div>
            <div
              ref={descricaoRef}
              className="nc-editor-body"
              contentEditable
              suppressContentEditableWarning
            />
          </div>
        </div>

        {/* Ações */}
        <div className="nc-acoes">
          <button className="nc-cancelar-btn" onClick={() => navigate("/campanhas")}>
            Cancelar
          </button>
          <button
            className={`nc-criar-btn ${!nome.trim() ? "disabled" : ""}`}
            onClick={handleCriar}
            disabled={!nome.trim()}
          >
            Criar
          </button>
        </div>

      </div>
    </div>
  );
};

export default NovaCampanhaTlouRpg;