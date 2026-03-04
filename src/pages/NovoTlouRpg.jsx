import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import ImageCropModal from "../components/ImageCropModal";
import "../styles/NovoTlouRpg.css";

const idadeOpcoes = [
  { label: "Não nascido", pericia: "Sobrevivência" },
  { label: "Criança",     pericia: "Agilidade" },
  { label: "Adolescente", pericia: "Coleta" },
  { label: "Jovem Adulto",pericia: "Instinto" },
  { label: "Adulto",      pericia: "Brutalidade" },
];

const personalidadePerguntas = [
  {
    pergunta: "Você é Atlético ou Ágil?",
    opcoes: [
      { label: "Atlético", pericia: "Brutalidade" },
      { label: "Ágil",     pericia: "Agilidade" },
    ],
  },
  {
    pergunta: "Você é Caçador ou Coletor?",
    opcoes: [
      { label: "Caçador", pericia: "Mira" },
      { label: "Coletor", pericia: "Coleta" },
    ],
  },
  {
    pergunta: "Você é Habilidoso ou Acadêmico?",
    opcoes: [
      { label: "Habilidoso", pericia: "Manutenção" },
      { label: "Acadêmico",  pericia: "Medicina" },
    ],
  },
  {
    pergunta: "Você é Sobrevivencialista ou Instintivo?",
    opcoes: [
      { label: "Sobrevivencialista", pericia: "Sobrevivência" },
      { label: "Instintivo",         pericia: "Instinto" },
    ],
  },
];

const tracoOpcoes = [
  { label: "Esperançoso", pericia: "Medicina" },
  { label: "Prestativo",  pericia: "Manutenção" },
  { label: "Cauteloso",   pericia: "Instinto" },
  { label: "Impiedoso",   pericia: "Brutalidade" },
  { label: "Focado",      pericia: "Mira" },
  { label: "Minucioso",   pericia: "Coleta" },
  { label: "Resiliente",  pericia: "Sobrevivência" },
];

const motivacaoOpcoes = [
  { label: "Resistir e sobreviver",                        pericia: "Instinto" },
  { label: "Fazer parte de algum grupo",                   pericia: "Manutenção" },
  { label: "Encontrar o paraíso",                          pericia: "Sobrevivência" },
  { label: "Evitar perigo",                                pericia: "Agilidade" },
  { label: "Achar a cura da infecção",                     pericia: "Medicina" },
  { label: "Estar preparado para qualquer coisa",          pericia: "Coleta" },
  { label: "Defender a si mesmo e seus entes queridos",    pericia: "Mira" },
  { label: "Matar seus inimigos",                          pericia: "Brutalidade" },
];

const opcoesSobrevivente = [
  {
    titulo: "Sobrevivente\nNovato",
    descricao: "Os Sobreviventes Novatos começam os jogadores no nível mais baixo. Esta é a melhor opção para novos jogadores e campanhas de primeira vez.",
    nivelIdx: 0,
  },
  {
    titulo: "Sobrevivente\nAdaptado",
    descricao: "Os Sobreviventes Adaptados iniciam os jogadores em nível intermediário, ideal para começos de campanha mais desafiadores e partidas únicas.",
    nivelIdx: 1,
  },
  {
    titulo: "Sobrevivente\nVeterano",
    descricao: "Os Sobreviventes Veteranos são o nível mais alto para começar, recomendados para jogadores avançados e campanhas difíceis.",
    nivelIdx: 2,
  },
];

const steps = ["Equipamento Inicial", "Bio", "Classe", "Finalizar"];

const BioStep = ({ onConcluir }) => {
  const [subStep, setSubStep] = useState(0);
  const [idadeIdx, setIdadeIdx] = useState(null);
  const [personalidade, setPersonalidade] = useState({});
  const [tracoIdx, setTracoIdx] = useState(null);
  const [motivacaoIdx, setMotivacaoIdx] = useState(null);

  const personalidadeCompleta = personalidadePerguntas.every((_, i) => personalidade[i] !== undefined);

  return (
    <div className="bio-wrapper">
      {subStep === 0 && (
        <div className="bio-section">
          <p className="bio-pergunta">Quando o surto começou, quantos anos você tinha?</p>
          <div className="bio-opcoes-lista">
            {idadeOpcoes.map((op, idx) => (
              <button key={idx} className={`bio-opcao-btn${idadeIdx === idx ? " selected" : ""}`} onClick={() => setIdadeIdx(idx)}>
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-nav">
            <div />
            <button className={`escolher-btn confirmar-btn${idadeIdx !== null ? "" : " disabled"}`} disabled={idadeIdx === null} onClick={() => setSubStep(1)}>PRÓXIMA</button>
          </div>
        </div>
      )}

      {subStep === 1 && (
        <div className="bio-section bio-section-personalidade">
          <p className="bio-pergunta">Personalidade</p>
          <div className="bio-personalidade-grid">
            {personalidadePerguntas.map((perg, pi) => (
              <div key={pi} className="bio-personalidade-item">
                <p className="bio-sub-pergunta">{perg.pergunta}</p>
                <div className="bio-opcoes-row">
                  {perg.opcoes.map((op, oi) => (
                    <button key={oi} className={`bio-opcao-btn${personalidade[pi] === oi ? " selected" : ""}`} onClick={() => setPersonalidade((prev) => ({ ...prev, [pi]: oi }))}>
                      <span className="bio-opcao-label">{op.label}</span>
                      <span className="bio-opcao-pericia">+1 {op.pericia}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(0)}>ANTERIOR</button>
            <button className={`escolher-btn confirmar-btn${personalidadeCompleta ? "" : " disabled"}`} disabled={!personalidadeCompleta} onClick={() => setSubStep(2)}>PRÓXIMA</button>
          </div>
        </div>
      )}

      {subStep === 2 && (
        <div className="bio-section">
          <p className="bio-pergunta">Traço</p>
          <div className="bio-traco-grid">
            {tracoOpcoes.slice(0, 6).map((op, idx) => (
              <button key={idx} className={`bio-opcao-btn${tracoIdx === idx ? " selected" : ""}`} onClick={() => setTracoIdx(idx)}>
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-traco-ultima-linha">
            <button className={`bio-opcao-btn${tracoIdx === 6 ? " selected" : ""}`} onClick={() => setTracoIdx(6)}>
              <span className="bio-opcao-label">{tracoOpcoes[6].label}</span>
              <span className="bio-opcao-pericia">+1 {tracoOpcoes[6].pericia}</span>
            </button>
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(1)}>ANTERIOR</button>
            <button className={`escolher-btn confirmar-btn${tracoIdx !== null ? "" : " disabled"}`} disabled={tracoIdx === null} onClick={() => setSubStep(3)}>PRÓXIMA</button>
          </div>
        </div>
      )}

      {subStep === 3 && (
        <div className="bio-section">
          <p className="bio-pergunta">Qual é sua Motivação?</p>
          <div className="bio-motivacao-grid">
            {motivacaoOpcoes.map((op, idx) => (
              <button key={idx} className={`bio-opcao-btn bio-motivacao-btn${motivacaoIdx === idx ? " selected" : ""}`} onClick={() => setMotivacaoIdx(idx)}>
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(2)}>ANTERIOR</button>
            <button
              className={`escolher-btn confirmar-btn${motivacaoIdx !== null ? "" : " disabled"}`}
              disabled={motivacaoIdx === null}
              onClick={() => onConcluir({ idadeIdx, personalidade, tracoIdx, motivacaoIdx })}
            >
              CONFIRMAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const NovoTlouRpg = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const inputImagemRef = useRef(null);

  const [refs, setRefs] = useState(null);
  const [step, setStep] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const [nivelIdx, setNivelIdx] = useState(null);
  const [bioData, setBioData] = useState(null);
  const [classeIdx, setClasseIdx] = useState(null);

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [nomeJogador, setNomeJogador] = useState("");
  const [aparencia, setAparencia] = useState("");
  const [personalidadeTexto, setPersonalidadeTexto] = useState("");
  const [historico, setHistorico] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [imagemPreview, setImagemPreview] = useState(null);
  const [imagemBase64, setImagemBase64] = useState(null);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imagemParaCrop, setImagemParaCrop] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/referencias`)
      .then((r) => r.json())
      .then(setRefs)
      .catch(() => mostrarAviso("Erro ao carregar dados do servidor."));
  }, []);

  useEffect(() => {
    if (user?.name) setNomeJogador(user.name);
  }, [user]);

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(null), 3500);
  };

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      mostrarAviso("Imagem muito grande. Use uma imagem menor que 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagemParaCrop(ev.target.result);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleConfirmCrop = (croppedImage) => {
    setImagemPreview(croppedImage);
    setImagemBase64(croppedImage);
    setCropModalOpen(false);
    setImagemParaCrop(null);
  };

  const handleCloseCrop = () => {
    setCropModalOpen(false);
    setImagemParaCrop(null);
  };

  const handleFinalizar = async () => {
    if (!nomePersonagem.trim()) return mostrarAviso("o nome do personagem");
    if (nivelIdx === null || !bioData || classeIdx === null) return mostrarAviso("todas as etapas anteriores");
    if (!user) return mostrarAviso("Você precisa estar logado");

    const nivel     = refs.niveis[nivelIdx];
    const idade     = refs.idades[bioData.idadeIdx];
    const traco     = refs.tracos[bioData.tracoIdx];
    const motivacao = refs.motivacoes[bioData.motivacaoIdx];
    const classe    = refs.classes[classeIdx];

    const personalidade_pericias = Object.keys(bioData.personalidade)
      .sort()
      .map((pi) => personalidadePerguntas[pi].opcoes[bioData.personalidade[pi]].pericia);

    const body = {
      nome_personagem:        nomePersonagem.trim(),
      nome_jogador:           nomeJogador.trim() || user.name,
      nivel_id:               nivel.id,
      pilulas_iniciais:       nivel.pilulas_iniciais,
      idade_id:               idade.id,
      idade_pericia:          idadeOpcoes[bioData.idadeIdx].pericia,
      personalidade_id:       refs.personalidades[0].id,
      pericia_escolhida:      personalidade_pericias[0],
      personalidade_pericias,
      traco_id:               traco.id,
      traco_pericia:          tracoOpcoes[bioData.tracoIdx].pericia,
      motivacao_id:           motivacao.id,
      motivacao_pericia:      motivacaoOpcoes[bioData.motivacaoIdx].pericia,
      classe_id:              classe.id,
      classe_pericia_a:       classe.pericia_bonus_a,
      classe_pericia_b:       classe.pericia_bonus_b,
      imagem:                 imagemBase64 || null,
    };

    setSalvando(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/tlou/fichas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        mostrarAviso(err.error || "Erro ao salvar ficha");
        return;
      }

      navigate("/personagens");
    } catch {
      mostrarAviso("Erro de conexão com o servidor");
    } finally {
      setSalvando(false);
    }
  };

  if (!refs) {
    return <div className="novo-tlou-page"><p style={{ color: "#ccc", textAlign: "center" }}>Carregando...</p></div>;
  }

  return (
    <div className="novo-tlou-page">

      <div className="novo-tlou-stepper">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <span className={`novo-tlou-stepper-label${i === step ? " active" : ""}`} onClick={() => setStep(i)} style={{ cursor: "pointer" }}>
              {label}
            </span>
            {i < steps.length - 1 && <div className="novo-tlou-stepper-line" />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <>
          <p className="novo-tlou-subtitulo">Converse com o Mestre da mesa para decidir qual desses funciona mais para a campanha atual.</p>
          <div className="novo-tlou-grid">
            {opcoesSobrevivente.map((opcao, idx) => {
              const nivel = refs.niveis[idx];
              return (
                <div key={idx} className="novo-tlou-card">
                  <h2>{opcao.titulo}</h2>
                  <p className="descricao">{opcao.descricao}</p>
                  <p><span className="label">Pílulas iniciais:</span> {nivel.pilulas_iniciais}</p>
                  <p><span className="label">Equipamento inicial:</span> {nivel.equipamentos_iniciais}</p>
                  <p><span className="label">Arma inicial:</span> {nivel.armas_iniciais}</p>
                  <button className="escolher-btn" onClick={() => { setNivelIdx(idx); setStep(1); }}>ESCOLHER</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {step === 1 && <BioStep onConcluir={(data) => { setBioData(data); setStep(2); }} />}

      {step === 2 && (
        <>
          <p className="novo-tlou-subtitulo">Selecione sua Classe de Personagem. Como você tem sobrevivido?</p>
          <div className="novo-tlou-grid classe-grid">
            {refs.classes.map((classe, idx) => (
              <div key={classe.id} className={`novo-tlou-card classe-card${classeIdx === idx ? " card-selected" : ""}`}>
                <h2>{classe.nome}</h2>
                <p className="card-pericias">+1 {classe.pericia_bonus_a}, +1 {classe.pericia_bonus_b}</p>
                <p className="descricao">{classe.descricao}</p>
                <button className="escolher-btn" onClick={() => { setClasseIdx(idx); setStep(3); }}>ESCOLHER</button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="final-wrapper">
          <div className="final-header">
            <p className="final-intro">
              Nenhum RPG vive só de atributos e mecânicas. Sem profundidade, é só mais uma ficha andando pelo mapa.
              Agora é a hora de dizer quem seu personagem realmente é.
            </p>
            <button className={`escolher-btn final-btn${salvando ? " disabled" : ""}`} onClick={handleFinalizar} disabled={salvando}>
              {salvando ? "SALVANDO..." : "FINALIZAR"}
            </button>
          </div>

          <div className="final-scroll">

            <div className="final-field">
              <label className="final-label">Imagem do Personagem</label>
              <div className="final-imagem-wrapper">
                <div className="final-imagem-area" onClick={() => inputImagemRef.current?.click()}>
                  {imagemPreview ? (
                    <img src={imagemPreview} alt="preview" className="final-imagem-preview" />
                  ) : (
                    <div className="final-imagem-placeholder">
                      <span>Clique para fazer upload</span>
                      <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>JPG, PNG — máx. 2MB</span>
                    </div>
                  )}
                </div>
                {imagemPreview && (
                  <button
                    className="final-remover-imagem"
                    onClick={() => { setImagemPreview(null); setImagemBase64(null); }}
                  >
                    Remover imagem
                  </button>
                )}
              </div>
              <input
                ref={inputImagemRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleImagemChange}
              />
            </div>

            <div className="final-row">
              <div className="final-field">
                <label className="final-label">Personagem *</label>
                <input className="final-input" placeholder="Nome do personagem" value={nomePersonagem} onChange={(e) => setNomePersonagem(e.target.value)} />
              </div>
              <div className="final-field">
                <label className="final-label">Jogador</label>
                <input className="final-input" placeholder="Nome do jogador" value={nomeJogador} onChange={(e) => setNomeJogador(e.target.value)} />
              </div>
            </div>

            <div className="final-field">
              <label className="final-label">Aparência</label>
              <textarea className="final-textarea" placeholder="Nome, gênero, idade, descrição física..." value={aparencia} onChange={(e) => setAparencia(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Personalidade</label>
              <textarea className="final-textarea" placeholder="Traços marcantes, opiniões, ideais..." value={personalidadeTexto} onChange={(e) => setPersonalidadeTexto(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Histórico</label>
              <textarea className="final-textarea" placeholder="Infância, relação com a família, contato com os Infectados..." value={historico} onChange={(e) => setHistorico(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Objetivo</label>
              <textarea className="final-textarea" placeholder="Por que ele sobrevive? O que o faz continuar?" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {aviso && <div className="aviso-toast">Preencha {aviso} antes de finalizar a ficha!</div>}

      {/* Crop Modal — abre após selecionar imagem */}
      {cropModalOpen && imagemParaCrop && (
        <ImageCropModal
          src={imagemParaCrop}
          title="Imagem do Personagem"
          onConfirm={handleConfirmCrop}
          onClose={handleCloseCrop}
        />
      )}
    </div>
  );
};

export default NovoTlouRpg;