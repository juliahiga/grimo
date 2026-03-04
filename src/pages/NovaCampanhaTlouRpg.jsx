import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NovaCampanhaTlouRpg.css";
import { useUser } from "../context/UserContext";

const NovaCampanhaTLOU = () => {
  useUser();
  const navigate = useNavigate();

  const [nome, setNome]                   = useState("");
  const [imagem, setImagem]               = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [enviando, setEnviando]           = useState(false);
  const editorRef                         = useRef(null);
  const fileInputRef                      = useRef(null);

  const handleImagem = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagem(ev.target.result);
      setImagemPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverImagem = () => {
    setImagem(null);
    setImagemPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!nome.trim()) return;
    setEnviando(true);
    try {
      const descricaoHTML = editorRef.current?.innerHTML || "";
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/campanhas", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao: descricaoHTML,
          imagem: imagem || null,
        }),
      });
      const data = await res.json();
      if (res.ok) navigate(`/campanha/${data.id}`);
    } finally {
      setEnviando(false);
    }
  };

  const podeCriar = nome.trim().length > 0;

  return (
    <div className="nova-campanha-page">
      <h1 className="nova-campanha-titulo">Nova Campanha</h1>

      <div className="nova-campanha-form">

        {/* Nome */}
        <div className="nc-field">
          <label className="nc-label">
            Nome da Campanha <span className="nc-obrigatorio">*</span>
          </label>
          <input
            className="nc-input"
            type="text"
            placeholder="Ex: A Última Esperança"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={150}
          />
        </div>

        {/* Imagem */}
        <div className="nc-field">
          <label className="nc-label">Imagem de Campanha</label>
          {imagemPreview ? (
            <div className="nc-imagem-preview-wrap">
              <img src={imagemPreview} alt="preview" className="nc-imagem-preview" />
              <button className="nc-remover-imagem" onClick={handleRemoverImagem}>
                ✕ Remover
              </button>
            </div>
          ) : (
            <button className="nc-upload-btn" onClick={() => fileInputRef.current?.click()}>
              📁 Escolher imagem
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImagem}
          />
        </div>

        {/* Descrição */}
        <div className="nc-field">
          <label className="nc-label">Descrição</label>
          <div className="nc-editor">
            <div className="nc-editor-toolbar">
              <button className="nc-format-btn" onClick={() => handleFormat("bold")}><b>B</b></button>
              <button className="nc-format-btn" onClick={() => handleFormat("italic")}><i>I</i></button>
              <button className="nc-format-btn" onClick={() => handleFormat("underline")}><u>U</u></button>
            </div>
            <div
              ref={editorRef}
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
            className={`nc-criar-btn ${!podeCriar || enviando ? "disabled" : ""}`}
            onClick={podeCriar && !enviando ? handleSubmit : undefined}
          >
            {enviando ? "Criando..." : "Criar Campanha"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default NovaCampanhaTLOU;