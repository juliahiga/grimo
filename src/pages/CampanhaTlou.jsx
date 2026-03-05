import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/CampanhaTlou.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

const formatarData = (dataStr) => {
  if (!dataStr) return "";
  const d = new Date(dataStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
};

/* ── Card de personagem (igual Personagens.jsx) ── */
const PersonagemCard = ({ p }) => {
  const navigate = useNavigate();
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
        <div className="personagem-card-nome" title={p.nome_personagem}>{p.nome_personagem}</div>
        <div className="personagem-card-nivel">{p.classe}</div>
        <div className="personagem-card-data">Registrado em {formatarData(p.entrou_em)}</div>
        <div className="personagem-card-sistema">The Last of Us</div>
      </div>
      <div className="personagem-card-acoes">
        <button className="personagem-acessar-btn" onClick={() => navigate(`/ficha/${p.ficha_id || p.id}`)}>
          Acessar Ficha
        </button>
      </div>
    </div>
  );
};

/* ── Modal foto de capa ── */
const ModalFotoCapa = ({ imagemAtual, onSalvar, onFechar }) => {
  const [preview, setPreview] = useState(imagemAtual || null);
  const [imagem, setImagem] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setImagem(ev.target.result); setPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="ct-overlay" onClick={onFechar}>
      <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-header">
          <h3 className="ct-modal-titulo">Foto de Capa</h3>
          <button className="ct-modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="ct-modal-body">
          {preview ? (
            <img src={preview} alt="capa" className="ct-capa-preview" />
          ) : (
            <div className="ct-capa-placeholder">Sem imagem</div>
          )}
          <button className="ct-btn-secundario" onClick={() => fileRef.current?.click()}>
            📁 Escolher imagem
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
        <div className="ct-modal-footer">
          <button className="ct-btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button className="ct-btn-salvar" onClick={() => onSalvar(imagem)}>Salvar</button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

/* ── Modal editar campanha ── */
const ModalEditarCampanha = ({ campanha, onSalvar, onFechar }) => {
  const [nome, setNome] = useState(campanha.nome || "");
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && campanha.descricao) {
      editorRef.current.innerHTML = campanha.descricao;
    }
  }, [campanha.descricao]);

  const handleFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
  };

  return createPortal(
    <div className="ct-overlay" onClick={onFechar}>
      <div className="ct-modal ct-modal-largo" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-header">
          <h3 className="ct-modal-titulo">Editar Campanha</h3>
          <button className="ct-modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="ct-modal-body">
          <div className="nc-field">
            <label className="nc-label">Nome da Campanha <span className="nc-obrigatorio">*</span></label>
            <input className="nc-input" type="text" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} />
          </div>
          <div className="nc-field">
            <label className="nc-label">Descrição</label>
            <div className="nc-editor">
              <div className="nc-editor-toolbar">
                <button className="nc-format-btn" onClick={() => handleFormat("bold")}><b>B</b></button>
                <button className="nc-format-btn" onClick={() => handleFormat("italic")}><i>I</i></button>
                <button className="nc-format-btn" onClick={() => handleFormat("underline")}><u>U</u></button>
              </div>
              <div ref={editorRef} className="nc-editor-body" contentEditable suppressContentEditableWarning />
            </div>
          </div>
        </div>
        <div className="ct-modal-footer">
          <button className="ct-btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button
            className="ct-btn-salvar"
            onClick={() => nome.trim() && onSalvar({ nome, descricao: editorRef.current?.innerHTML || "" })}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

/* ── Modal convidar jogadores ── */
const ModalConvidar = ({ campanhaId, onFechar }) => {
  const link = `${window.location.origin}/entrar-campanha/${campanhaId}`;
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return createPortal(
    <div className="ct-overlay" onClick={onFechar}>
      <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-header">
          <h3 className="ct-modal-titulo">Convidar Jogadores</h3>
          <button className="ct-modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="ct-modal-body">
          <p className="ct-modal-desc">Compartilhe o link abaixo para convidar jogadores para sua campanha:</p>
          <div className="ct-link-row">
            <input className="ct-link-input" type="text" readOnly value={link} />
            <button className="ct-btn-copiar" onClick={copiar}>
              {copiado ? "✓ Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
        <div className="ct-modal-footer">
          <button className="ct-btn-salvar" onClick={onFechar}>Fechar</button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

/* ── Modal adicionar personagem ── */
const ModalAdicionarPersonagem = ({ campanhaId, onSucesso, onFechar }) => {
  const [fichas, setFichas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/tlou/fichas`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFichas(Array.isArray(d) ? d : []))
      .catch(() => setFichas([]))
      .finally(() => setCarregando(false));
  }, []);

  const handleEntrar = async () => {
    if (!selecionado) return;
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch(`${API}/api/tlou/campanhas/${campanhaId}/entrar`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ficha_id: selecionado }),
      });
      const data = await res.json();
      if (res.ok) { onSucesso(); onFechar(); }
      else setErro(data.error || "Erro ao entrar na campanha");
    } catch { setErro("Erro de conexão"); }
    finally { setEnviando(false); }
  };

  return createPortal(
    <div className="ct-overlay" onClick={onFechar}>
      <div className="ct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ct-modal-header">
          <h3 className="ct-modal-titulo">Adicionar Personagem</h3>
          <button className="ct-modal-fechar" onClick={onFechar}>✕</button>
        </div>
        <div className="ct-modal-body">
          {carregando ? (
            <p className="ct-modal-desc">Carregando fichas...</p>
          ) : fichas.length === 0 ? (
            <p className="ct-modal-desc">Você não tem nenhuma ficha criada.</p>
          ) : (
            <>
              <p className="ct-modal-desc">Selecione a ficha que deseja adicionar à campanha:</p>
              <div className="ct-fichas-lista">
                {fichas.map((f) => (
                  <div
                    key={f.id}
                    className={`ct-ficha-item ${selecionado === f.id ? "selecionado" : ""}`}
                    onClick={() => setSelecionado(f.id)}
                  >
                    <div className="ct-ficha-avatar">
                      {f.imagem ? <img src={f.imagem} alt={f.nome_personagem} /> : <span>{f.nome_personagem?.[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="ct-ficha-info">
                      <div className="ct-ficha-nome">{f.nome_personagem}</div>
                      <div className="ct-ficha-classe">{f.classe}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {erro && <p className="ct-erro">{erro}</p>}
        </div>
        <div className="ct-modal-footer">
          <button className="ct-btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button className="ct-btn-salvar" onClick={handleEntrar} disabled={!selecionado || enviando}>
            {enviando ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

/* ── Modal sair da campanha ── */
const ModalSairCampanha = ({ onConfirmar, onCancelar }) => {
  const [inputValue, setInputValue] = useState("");
  const confirmado = inputValue === "SAIR";

  return createPortal(
    <div className="confirmar-overlay" onClick={onCancelar}>
      <div className="confirmar-modal-novo" onClick={(e) => e.stopPropagation()}>
        <div className="confirmar-header">
          <h3 className="confirmar-titulo">Sair da campanha?</h3>
          <button className="confirmar-fechar" onClick={onCancelar}>✕</button>
        </div>
        <p className="confirmar-descricao">
          Para confirmar, digite <strong>SAIR</strong> no campo abaixo:
        </p>
        <p className="confirmar-aviso">Você será removido da campanha!</p>
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

/* ── Página principal ── */
const CampanhaTlou = () => {
  const { id } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();

  const [campanha, setCampanha] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("personagens");

  const [modalFoto, setModalFoto] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalConvidar, setModalConvidar] = useState(false);
  const [modalAddPersonagem, setModalAddPersonagem] = useState(false);
  const [modalSair, setModalSair] = useState(false);

  const buscarCampanha = useCallback(() => {
    setCarregando(true);
    fetch(`${API}/api/tlou/campanhas/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d && d.id) setCampanha(d); else navigate("/campanhas"); })
      .catch(() => navigate("/campanhas"))
      .finally(() => setCarregando(false));
  }, [id, navigate]);

  useEffect(() => { buscarCampanha(); }, [buscarCampanha]);

  const handleSalvarFoto = async (novaImagem) => {
    if (!novaImagem) { setModalFoto(false); return; }
    await fetch(`${API}/api/tlou/campanhas/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagem: novaImagem }),
    });
    setCampanha((prev) => ({ ...prev, imagem: novaImagem }));
    setModalFoto(false);
  };

  const handleSalvarEdicao = async ({ nome, descricao }) => {
    await fetch(`${API}/api/tlou/campanhas/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, descricao }),
    });
    setCampanha((prev) => ({ ...prev, nome, descricao }));
    setModalEditar(false);
  };

  const handleSairCampanha = async () => {
    await fetch(`${API}/api/tlou/campanhas/${id}/sair`, {
      method: "DELETE",
      credentials: "include",
    });
    navigate("/campanhas");
  };

  if (carregando) return (
    <div className="ct-page">
      <p className="ct-loading">Carregando campanha...</p>
    </div>
  );

  if (!campanha) return null;

  const sou_mestre = campanha.sou_mestre;
  const jogadores = campanha.jogadores || [];
  const personagens = jogadores;

  return (
    <div className="ct-page">
      {/* ── Barra de ações ── */}
      <div className="ct-acoes-bar">
        {sou_mestre ? (
          <>
            <button className="ct-acao-btn" onClick={() => setModalFoto(true)}>
              <i className="fa-solid fa-image" /> Foto de Capa
            </button>
            <button className="ct-acao-btn" onClick={() => setModalAddPersonagem(true)}>
              <i className="fa-solid fa-user-plus" /> Adicionar Personagem
            </button>
            <button className="ct-acao-btn" onClick={() => setModalConvidar(true)}>
              <i className="fa-solid fa-link" /> Convidar Jogadores
            </button>
            <button className="ct-acao-btn" onClick={() => setModalEditar(true)}>
              <i className="fa-solid fa-pen" /> Editar Campanha
            </button>
          </>
        ) : (
          <>
            <button className="ct-acao-btn ct-acao-sair" onClick={() => setModalSair(true)}>
              <i className="fa-solid fa-right-from-bracket" /> Sair da Campanha
            </button>
            <button className="ct-acao-btn" onClick={() => setModalAddPersonagem(true)}>
              <i className="fa-solid fa-user-plus" /> Adicionar Personagem
            </button>
            <button className="ct-acao-btn" onClick={() => setModalConvidar(true)}>
              <i className="fa-solid fa-link" /> Convidar Jogadores
            </button>
          </>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div className="ct-conteudo">
        {/* Capa + info */}
        <div className="ct-capa-section">
          {campanha.imagem ? (
            <img src={campanha.imagem} alt={campanha.nome} className="ct-capa-img" />
          ) : (
            <div className="ct-capa-placeholder-grande">
              {campanha.nome?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="ct-capa-info">
            <h1 className="ct-nome">{campanha.nome}</h1>
            {campanha.descricao && (
              <div
                className="ct-descricao"
                dangerouslySetInnerHTML={{ __html: campanha.descricao }}
              />
            )}
          </div>
        </div>

        {/* Abas */}
        <div className="ct-abas">
          <button
            className={`ct-aba ${abaAtiva === "personagens" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("personagens")}
          >
            Personagens
          </button>
          <button
            className={`ct-aba ${abaAtiva === "jogadores" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("jogadores")}
          >
            Jogadores
          </button>
        </div>

        {/* Aba: Personagens */}
        {abaAtiva === "personagens" && (
          <div className="ct-aba-conteudo">
            {personagens.length === 0 ? (
              <p className="ct-empty-text">Ainda não há personagens nesta campanha!</p>
            ) : (
              <div className="personagens-lista">
                {personagens.map((p) => (
                  <PersonagemCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aba: Jogadores */}
        {abaAtiva === "jogadores" && (
          <div className="ct-aba-conteudo">
            {jogadores.length === 0 ? (
              <p className="ct-empty-text">Ainda não há jogadores nesta campanha!</p>
            ) : (
              <div className="ct-jogadores-lista">
                {jogadores.map((j) => (
                  <div key={j.id} className="ct-jogador-item">
                    <div className="ct-jogador-avatar">
                      {j.nome_jogador?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="ct-jogador-info">
                      <div className="ct-jogador-nome">{j.nome_jogador}</div>
                      <div className="ct-jogador-personagem">{j.nome_personagem}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modais ── */}
      {modalFoto && (
        <ModalFotoCapa
          imagemAtual={campanha.imagem}
          onSalvar={handleSalvarFoto}
          onFechar={() => setModalFoto(false)}
        />
      )}
      {modalEditar && (
        <ModalEditarCampanha
          campanha={campanha}
          onSalvar={handleSalvarEdicao}
          onFechar={() => setModalEditar(false)}
        />
      )}
      {modalConvidar && (
        <ModalConvidar
          campanhaId={id}
          onFechar={() => setModalConvidar(false)}
        />
      )}
      {modalAddPersonagem && (
        <ModalAdicionarPersonagem
          campanhaId={id}
          onSucesso={buscarCampanha}
          onFechar={() => setModalAddPersonagem(false)}
        />
      )}
      {modalSair && (
        <ModalSairCampanha
          onConfirmar={handleSairCampanha}
          onCancelar={() => setModalSair(false)}
        />
      )}
    </div>
  );
};

export default CampanhaTlou;