import React, { useState } from "react";
import "../styles/NovoTlouRpg.css";

const idadeOpcoes = [
  { id: "nao_nascido", label: "Não nascido", pericia: "Sobrevivência" },
  { id: "crianca", label: "Criança", pericia: "Agilidade" },
  { id: "adolescente", label: "Adolescente", pericia: "Coleta" },
  { id: "jovem_adulto", label: "Jovem Adulto", pericia: "Instinto" },
  { id: "adulto", label: "Adulto", pericia: "Brutalidade" },
];

const personalidadePerguntas = [
  {
    id: "p1",
    pergunta: "Você é Atlético ou Ágil?",
    opcoes: [
      { id: "atletico", label: "Atlético", pericia: "Brutalidade" },
      { id: "agil", label: "Ágil", pericia: "Agilidade" },
    ],
  },
  {
    id: "p2",
    pergunta: "Você é Caçador ou Coletor?",
    opcoes: [
      { id: "cacador", label: "Caçador", pericia: "Mira" },
      { id: "coletor", label: "Coletor", pericia: "Coleta" },
    ],
  },
  {
    id: "p3",
    pergunta: "Você é Habilidoso ou Acadêmico?",
    opcoes: [
      { id: "habilidoso", label: "Habilidoso", pericia: "Manutenção" },
      { id: "academico", label: "Acadêmico", pericia: "Medicina" },
    ],
  },
  {
    id: "p4",
    pergunta: "Você é Sobrevivencialista ou Instintivo?",
    opcoes: [
      { id: "sobrevivencialista", label: "Sobrevivencialista", pericia: "Sobrevivência" },
      { id: "instintivo", label: "Instintivo", pericia: "Instinto" },
    ],
  },
];

const tracoOpcoes = [
  { id: "esperancoso", label: "Esperançoso", pericia: "Medicina" },
  { id: "prestativo", label: "Prestativo", pericia: "Manutenção" },
  { id: "cauteloso", label: "Cauteloso", pericia: "Instinto" },
  { id: "impiedoso", label: "Impiedoso", pericia: "Brutalidade" },
  { id: "focado", label: "Focado", pericia: "Mira" },
  { id: "minucioso", label: "Minucioso", pericia: "Coleta" },
  { id: "resiliente", label: "Resiliente", pericia: "Sobrevivência" },
];

const motivacaoOpcoes = [
  { id: "resistir", label: "Resistir e sobreviver?", pericia: "Instinto" },
  { id: "comunidade", label: "Fazer parte de algum grupo?", pericia: "Manutenção" },
  { id: "paraiso", label: "Encontrar o paraíso?", pericia: "Sobrevivência" },
  { id: "evitar", label: "Evitar perigo?", pericia: "Agilidade" },
  { id: "cura", label: "Achar a cura da infecção?", pericia: "Medicina" },
  { id: "preparado", label: "Estar preparado para qualquer coisa?", pericia: "Coleta" },
  { id: "defender", label: "Defender a si mesmo e seus entes queridos?", pericia: "Mira" },
  { id: "matar", label: "Matar seus inimigos?", pericia: "Brutalidade" },
];

const classeOpcoes = [
  {
    id: "cidadao",
    titulo: "Cidadão",
    pericias: "+1 Manutenção, +1 Coleta",
    descricao: "Sobreviveu sob a dura supervisão da FEDRA em uma Zona de Quarentena. Trabalhou na manutenção da zona e na coleta de suprimentos durante tarefas externas.",
  },
  {
    id: "contrabandista",
    titulo: "Contrabandista",
    pericias: "+1 Instinto, +1 Furtividade",
    descricao: "Entrando ou formando um grupo, ou atuando sozinho, operações de contrabando dentro das Zonas de Quarentena exigem percepção e a habilidade de evitar adversários.",
  },
  {
    id: "vaga_lume",
    titulo: "Vaga-lume",
    pericias: "+1 Mira, +1 Medicina",
    descricao: "Lutando por uma crença apesar das grandes perdas, a esperança é a única coisa a se agarrar. A única forma de construir um futuro melhor é agir, custe o que custar.",
  },
  {
    id: "sobrevivente",
    titulo: "Sobrevivente",
    pericias: "+1 Sobrevivência, +1 Coleta",
    descricao: "Parte de um grupo ou vagando sozinho, suportou clima severo, fome, os Infectados e a humanidade em seu pior estado no mundo pós-surto. O único objetivo é sobreviver mais um dia.",
  },
  {
    id: "soldado",
    titulo: "Soldado",
    pericias: "+1 Mira, +1 Brutalidade",
    descricao: "Um conjunto de habilidades físicas útil para FEDRA, milícias, assentamentos e rebeldes. Usa treinamento militar para lutar, proteger ou extorquir.",
  },
  {
    id: "renegado",
    titulo: "Renegado",
    pericias: "+1 Brutalidade, +1 Instinto",
    descricao: "Ou você é a presa, ou é o caçador. A sobrevivência exige sacrifício moral.",
  },
];

const BioStep = ({ onConcluir }) => {
  const [subStep, setSubStep] = useState(0);
  const [idade, setIdade] = useState(null);
  const [personalidade, setPersonalidade] = useState({});
  const [traco, setTraco] = useState(null);
  const [motivacao, setMotivacao] = useState(null);

  const personalidadeCompleta = personalidadePerguntas.every((p) => personalidade[p.id]);

  const handleConcluir = () => {
    onConcluir({ idade, personalidade, traco, motivacao });
  };

  return (
    <div className="bio-wrapper">

      {subStep === 0 && (
        <div className="bio-section">
          <p className="bio-pergunta">Quando o surto começou, quantos anos você tinha?</p>
          <div className="bio-opcoes-lista">
            {idadeOpcoes.map((op) => (
              <button
                key={op.id}
                className={`bio-opcao-btn${idade?.id === op.id ? " selected" : ""}`}
                onClick={() => setIdade(op)}
              >
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-nav">
            <div />
            <button
              className={`escolher-btn confirmar-btn${idade ? "" : " disabled"}`}
              disabled={!idade}
              onClick={() => setSubStep(1)}
            >
              PRÓXIMA
            </button>
          </div>
        </div>
      )}

      {subStep === 1 && (
        <div className="bio-section bio-section-personalidade">
          <p className="bio-pergunta">Personalidade</p>
          <div className="bio-personalidade-grid">
            {personalidadePerguntas.map((perg) => (
              <div key={perg.id} className="bio-personalidade-item">
                <p className="bio-sub-pergunta">{perg.pergunta}</p>
                <div className="bio-opcoes-row">
                  {perg.opcoes.map((op) => (
                    <button
                      key={op.id}
                      className={`bio-opcao-btn${personalidade[perg.id]?.id === op.id ? " selected" : ""}`}
                      onClick={() => setPersonalidade((prev) => ({ ...prev, [perg.id]: op }))}
                    >
                      <span className="bio-opcao-label">{op.label}</span>
                      <span className="bio-opcao-pericia">+1 {op.pericia}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(0)}>
              ANTERIOR
            </button>
            <button
              className={`escolher-btn confirmar-btn${personalidadeCompleta ? "" : " disabled"}`}
              disabled={!personalidadeCompleta}
              onClick={() => setSubStep(2)}
            >
              PRÓXIMA
            </button>
          </div>
        </div>
      )}

      {subStep === 2 && (
        <div className="bio-section">
          <p className="bio-pergunta">Traço</p>
          <div className="bio-traco-grid">
            {tracoOpcoes.slice(0, 6).map((op) => (
              <button
                key={op.id}
                className={`bio-opcao-btn${traco?.id === op.id ? " selected" : ""}`}
                onClick={() => setTraco(op)}
              >
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-traco-ultima-linha">
            <button
              className={`bio-opcao-btn${traco?.id === tracoOpcoes[6].id ? " selected" : ""}`}
              onClick={() => setTraco(tracoOpcoes[6])}
            >
              <span className="bio-opcao-label">{tracoOpcoes[6].label}</span>
              <span className="bio-opcao-pericia">+1 {tracoOpcoes[6].pericia}</span>
            </button>
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(1)}>
              ANTERIOR
            </button>
            <button
              className={`escolher-btn confirmar-btn${traco ? "" : " disabled"}`}
              disabled={!traco}
              onClick={() => setSubStep(3)}
            >
              PRÓXIMA
            </button>
          </div>
        </div>
      )}

      {subStep === 3 && (
        <div className="bio-section">
          <p className="bio-pergunta">Qual é sua Motivação?</p>
          <div className="bio-motivacao-grid">
            {motivacaoOpcoes.map((op) => (
              <button
                key={op.id}
                className={`bio-opcao-btn bio-motivacao-btn${op.id !== "comunidade" ? " bio-motivacao-btn-large" : ""}${motivacao?.id === op.id ? " selected" : ""}`}
                onClick={() => setMotivacao(op)}
              >
                <span className="bio-opcao-label">{op.label}</span>
                <span className="bio-opcao-pericia">+1 {op.pericia}</span>
              </button>
            ))}
          </div>
          <div className="bio-nav">
            <button className="escolher-btn anterior-btn" onClick={() => setSubStep(2)}>
              ANTERIOR
            </button>
            <button
              className={`escolher-btn confirmar-btn${motivacao ? "" : " disabled"}`}
              disabled={!motivacao}
              onClick={handleConcluir}
            >
              CONFIRMAR
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const opcoes = [
  {
    id: "novato",
    titulo: "Sobrevivente\nNovato",
    descricao: "Os Sobreviventes Novatos começam os jogadores no nível mais baixo. Esta é a melhor opção para novos jogadores e campanhas de primeira vez.",
    pilulas: 100,
    equipamento: "Lanterna",
    arma: "Arma branca improvisada (2x4) e Pistola",
  },
  {
    id: "adaptado",
    titulo: "Sobrevivente\nAdaptado",
    descricao: "Os Sobreviventes Adaptados iniciam os jogadores em nível intermediário, ideal para começos de campanha mais desafiadores e partidas únicas.",
    pilulas: 250,
    equipamento: "Máscara de gás & Lanterna",
    arma: "Arma branca contundente, Rifle de caça & Pistola ou Revólver",
  },
  {
    id: "veterano",
    titulo: "Sobrevivente\nVeterano",
    descricao: "Os Sobreviventes Veteranos são o nível mais alto para começar, recomendados para jogadores avançados e campanhas difíceis.",
    pilulas: 400,
    equipamento: "Máscara de gás & Lanterna",
    arma: "Arma branca cortante & Arma longa & Arma curta",
  },
];

const steps = ["Equipamento Inicial", "Bio", "Classe", "Finalizar"];

const NovoTlouRpg = () => {
  const [ficha, setFicha] = useState(null);
  const [step, setStep] = useState(0);
  const [aviso, setAviso] = useState(null);

  const escolherOpcao = (opcao) => {
    const novaFicha = {
      classe_inicial: opcao.titulo.replace("\n", " "),
      recursos: { pilulas: opcao.pilulas, vida_max: 25, vida_atual: 25 },
      equipamentos: opcao.equipamento,
      armas: opcao.arma,
    };
    setFicha(novaFicha);
    setStep(1);
  };

  const handleBioConcluir = (bioData) => {
    setFicha((prev) => ({ ...prev, bio: bioData }));
    setStep(2);
  };

  const handleClasseEscolher = (classe) => {
    setFicha((prev) => ({ ...prev, classe: classe.id, classe_nome: classe.titulo }));
    setStep(3);
  };

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(null), 3500);
  };

  const validarFicha = () => {
    if (!ficha?.classe_inicial) return "o Equipamento Inicial";
    if (!ficha?.bio?.idade) return "a Idade";
    if (!ficha?.bio?.personalidade || !personalidadePerguntas.every(p => ficha.bio.personalidade[p.id])) return "a Personalidade";
    if (!ficha?.bio?.traco) return "o Traço";
    if (!ficha?.bio?.motivacao) return "a Motivação";
    if (!ficha?.classe) return "a Classe";
    return null;
  };

  const handleFinalizar = () => {
    const erro = validarFicha();
    if (erro) {
      mostrarAviso(erro);
      return;
    }
    console.log("Finalizar:", ficha);
  };

  return (
    <div className="novo-tlou-page">

      <div className="novo-tlou-stepper">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <span
              className={`novo-tlou-stepper-label${i === step ? " active" : ""}`}
              onClick={() => setStep(i)}
              style={{ cursor: "pointer" }}
            >
              {label}
            </span>
            {i < steps.length - 1 && <div className="novo-tlou-stepper-line" />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && (
        <>
          <p className="novo-tlou-subtitulo">
            Converse com o Mestre da mesa para decidir qual desses funciona mais para a campanha atual.
          </p>
          <div className="novo-tlou-grid">
            {opcoes.map((opcao) => (
              <div key={opcao.id} className="novo-tlou-card">
                <h2>{opcao.titulo}</h2>
                <p className="descricao">{opcao.descricao}</p>
                <p><span className="label">Pílulas iniciais:</span> {opcao.pilulas}</p>
                <p><span className="label">Equipamento inicial:</span> {opcao.equipamento}</p>
                <p><span className="label">Arma inicial:</span> {opcao.arma}</p>
                <button className="escolher-btn" onClick={() => escolherOpcao(opcao)}>
                  ESCOLHER
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 1 && <BioStep onConcluir={handleBioConcluir} />}

      {step === 2 && (
        <>
          <p className="novo-tlou-subtitulo">
            Selecione sua Classe de Personagem. Como você tem sobrevivido?
          </p>
          <div className="novo-tlou-grid classe-grid">
            {classeOpcoes.map((classe) => (
              <div
                key={classe.id}
                className={`novo-tlou-card classe-card${ficha?.classe === classe.id ? " card-selected" : ""}`}
              >
                <h2>{classe.titulo}</h2>
                <p className="card-pericias">{classe.pericias}</p>
                <p className="descricao">{classe.descricao}</p>
                <button className="escolher-btn" onClick={() => handleClasseEscolher(classe)}>
                  ESCOLHER
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <div className="final-wrapper">
          <div className="final-header">
            <p className="final-intro">
              Nenhum RPG vive só de atributos e mecânicas. Sem profundidade, é só mais uma ficha andando pelo mapa. Agora é a hora de dizer quem seu personagem realmente é, um personagem com personalidade é alguém que faz escolhas, erra, ama, sobrevive e deixa uma marca na história do seu mestre.
            </p>
            <button className="escolher-btn final-btn" onClick={handleFinalizar}>
              FINALIZAR
            </button>
          </div>

          <div className="final-scroll">
            <div className="final-row">
              <div className="final-field">
                <label className="final-label">Personagem</label>
                <input className="final-input" placeholder="Nome do personagem" />
              </div>
              <div className="final-field">
                <label className="final-label">Jogador</label>
                <input className="final-input" placeholder="Nome do jogador" />
              </div>
            </div>

            <div className="final-field">
              <label className="final-label">Aparência</label>
              <textarea className="final-textarea" placeholder="Nome, gênero, idade, descrição física..." />
            </div>

            <div className="final-field">
              <label className="final-label">Personalidade</label>
              <textarea className="final-textarea" placeholder="Traços marcantes, opiniões, ideais..." />
            </div>

            <div className="final-field">
              <label className="final-label">Histórico</label>
              <textarea className="final-textarea" placeholder="Infância, relação com a família, contato com os Infectados, eventos bons e ruins..." />
            </div>

            <div className="final-field">
              <label className="final-label">Objetivo</label>
              <textarea className="final-textarea" placeholder="Por que ele sobrevive? O que o faz continuar?" />
            </div>
          </div>
        </div>
      )}

      {aviso && (
        <div className="aviso-toast">
          Escolha {aviso} antes de finalizar a ficha!
        </div>
      )}

    </div>
  );
};

export default NovoTlouRpg;