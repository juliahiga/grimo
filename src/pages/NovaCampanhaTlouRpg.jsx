import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/NovaCampanhaTlouRpg.css";
import { useUser } from "../context/UserContext";
import ImageCropModalCapa from "../components/ImageCropModalCapa";

const NovaCampanhaTLOU = () => {
  useUser();
  const navigate = useNavigate();

  const [nome, setNome]                   = useState("");
  const [imagem, setImagem]               = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [enviando, setEnviando]           = useState(false);
  const [cropSrc, setCropSrc]             = useState(null); // src bruto para o modal de crop
  const editorRef                         = useRef(null);
  const fileInputRef                      = useRef(null);

  /* Abre o seletor de arquivo */
  const abrirSeletor = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  /* Quando o usuário seleciona um arquivo → abre o modal de crop */
  const handleImagem = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
  };

  /* Callback do modal de crop: recebe o base64 já cortado */
  const handleCropConfirm = (base64) => {
    setImagem(base64);
    setImagemPreview(base64);
    setCropSrc(null);
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/campanhas`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          descricao: descricaoHTML,
          imagem: imagem || null,
        }),
      });
      if (res.ok) { const data = await res.json(); navigate(`/campanha/${data.id}`); }
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
              <button className="nc-remover-imagem" onClick={abrirSeletor} title="Trocar imagem">
                🔄 Trocar
              </button>
              <button className="nc-remover-imagem" onClick={handleRemoverImagem}>
                ✕ Remover
              </button>
            </div>
          ) : (
            <button className="nc-upload-btn" onClick={abrirSeletor}>
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

      {/* Modal de crop — aparece ao escolher ou trocar imagem */}
      {cropSrc && (
        <ImageCropModalCapa
          src={cropSrc}
          title="Imagem de Capa"
          onConfirm={handleCropConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}
    </div>
  );
};

export default NovaCampanhaTLOU;