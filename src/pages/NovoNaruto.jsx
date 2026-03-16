import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ImageCropModal from "../components/ImageCropModal";
import "../styles/NovoNaruto.css";

// ── Dados do sistema ──────────────────────────────────────────────────────────

const niveisNC = [
  { nivel: "Estudante",      nc: 4,  atributos: 12,  pericias: 8,  poderes: 0,  atributoMinimo: 0, descricao: "Ainda em treinamento na Academia. Ideal para campanhas de origem." },
  { nivel: "Genin",          nc: 4,  atributos: 12,  pericias: 8,  poderes: 4,  atributoMinimo: 0, descricao: "Recém-formado, dando os primeiros passos como shinobi. Bom ponto de partida para campanhas longas." },
  { nivel: "Chuunin",        nc: 8,  atributos: 36,  pericias: 24, poderes: 12, atributoMinimo: 2, descricao: "Ninja com experiência moderada, capaz de liderar pequenas equipes. Ideal para campanhas intermediárias." },
  { nivel: "Jounin Especial",nc: 10, atributos: 48,  pericias: 32, poderes: 16, atributoMinimo: 3, descricao: "Especialistas de alto nível em uma área específica. Ótimos para campanhas focadas em missões complexas." },
  { nivel: "Jounin",         nc: 12, atributos: 60,  pericias: 40, poderes: 20, atributoMinimo: 4, descricao: "Elite dos ninjas, prontos para as missões mais perigosas. Recomendado para jogadores experientes." },
  { nivel: "Jounin Elite",   nc: 16, atributos: 84,  pericias: 56, poderes: 28, atributoMinimo: 6, descricao: "Os melhores entre os melhores. Para campanhas de alto impacto com vilões de grande escala." },
  { nivel: "Sannin / Kage",  nc: 20, atributos: 108, pericias: 72, poderes: 40, atributoMinimo: 8, descricao: "Lendas vivas do mundo ninja. Campanhas épicas com stakes que podem mudar o destino de nações." },
];

const clasList = [
  { id: "akimichi",  nome: "Clã Akimichi",  icon: require("../assets/clas/Akimichi.png"),  kekkei: "Baika no Jutsu",             descricao: "Mestres em técnicas de expansão corporal. Guerreiros resistentes e poderosos em combate frontal." },
  { id: "fuuma",     nome: "Clã Fuuma",     icon: require("../assets/clas/Fuma.png"),      kekkei: "Tensai / Fuuma Shuriken",    descricao: "Clã renomado no País do Fogo e na Vila da Chuva. Criadores das Fuuma Shurikens e especialistas incomparáveis em armas de arremesso." },
  { id: "hatake",    nome: "Clã Hatake",    icon: require("../assets/clas/Hatake.png"),    kekkei: "Genialidade",                descricao: "Ninjas excepcionalmente talentosos com contrato de invocação com Cães Ninjas e a Espada de Chakra Branco." },
  { id: "hoshigaki", nome: "Clã Hoshigaki", icon: require("../assets/clas/Hoshigaki.png"), kekkei: "Suiton / Predador Aquático", descricao: "Clã de Kirigakure com características de tubarão. Mortais em combate aquático, com pele escamada e afinidade extrema com Suiton." },
  { id: "hozuki",    nome: "Clã Hōzuki",    icon: require("../assets/clas/Hōzuki.png"),    kekkei: "Suika no Jutsu",             descricao: "Família ninja da Vila da Névoa capaz de liquefazer o próprio corpo. Quase imunes a ataques físicos e com alto valor estratégico em combate." },
  { id: "hyuuga",    nome: "Clã Hyuuga",    icon: require("../assets/clas/Hyuuga.png"),    kekkei: "Byakugan",                   descricao: "Olhos que enxergam tudo. Mestres do Juuken, o estilo de combate mais poderoso de Konoha." },
  { id: "inuzuka",   nome: "Clã Inuzuka",   icon: require("../assets/clas/Inuzuka.png"),   kekkei: "Shikakyu",                   descricao: "Guerreiros com afinidade com animais caninos. Usam técnicas combinadas com seus companheiros para devastar inimigos." },
  { id: "kaguya",    nome: "Clã Kaguya",    icon: require("../assets/clas/Kaguya.png"),    kekkei: "Shikotsumyaku",              descricao: "Guerreiros bárbaros que amam o combate acima de tudo. O Shikotsumyaku permite moldar os próprios ossos em armas e armaduras devastadoras." },
  { id: "katsuragi", nome: "Clã Katsuragi", icon: require("../assets/clas/Katsuragi.png"), kekkei: "Hijutsu exclusivo",          descricao: "Clã de tradição antiga com técnicas exclusivas transmitidas apenas entre seus membros." },
  { id: "mikoto",    nome: "Clã Mikoto",    icon: require("../assets/clas/Mikoto.png"),    kekkei: "Hijutsu exclusivo",          descricao: "Clã com habilidades únicas e segredos guardados entre seus descendentes." },
  { id: "nara",      nome: "Clã Nara",      icon: require("../assets/clas/Nara.png"),      kekkei: "Kagejutsu",                  descricao: "Estrategistas inteligentes que manipulam sombras para paralisar e controlar inimigos à distância." },
  { id: "senju",     nome: "Clã Senju",     icon: require("../assets/clas/Senju.png"),     kekkei: "Mokuton",                    descricao: "Fundadores de Konoha. Usuários do Mokuton, o elemento Madeira — combinação única de Terra e Água." },
  { id: "shimura",   nome: "Clã Shimura",   icon: require("../assets/clas/Shimura.png"),   kekkei: "Fuuton / Fuuinjutsu",        descricao: "Um dos primeiros clãs aliados de Konoha. Mestres em técnicas de selamento e Fuuton, famosos por sua lealdade e sacrifício nas guerras." },
  { id: "uchiha",    nome: "Clã Uchiha",    icon: require("../assets/clas/Uchiha.png"),    kekkei: "Sharingan",                  descricao: "O clã mais famoso de Konoha. O Sharingan permite copiar técnicas e prever movimentos do oponente." },
  { id: "uzumaki",   nome: "Clã Uzumaki",   icon: require("../assets/clas/Uzumaki.png"),   kekkei: "Chakra Expandido",           descricao: "Descendentes do Clã Senju com reservas de chakra imensas e técnicas de selamento incomparáveis." },
  { id: "yamanaka",  nome: "Clã Yamanaka",  icon: require("../assets/clas/Yamanaka.png"),  kekkei: "Hijutsu Mental",             descricao: "Especialistas em técnicas de controle mental e transferência de consciência. Fundamentais em missões de inteligência." },
  { id: "yotsuki",   nome: "Clã Yotsuki",   icon: require("../assets/clas/Yotsuki.png"),   kekkei: "Tensai / Lâmina da Lua",     descricao: "Clã da Vila da Nuvem, modelo de lealdade entre os shinobi. Espadachins excepcionais com domínio inato sobre Raiton e lâminas marciais." },
  { id: "yuki",      nome: "Clã Yuki",      icon: require("../assets/clas/Yuki.png"),      kekkei: "Hyouton (Gelo)",             descricao: "Oriundos do País da Água, portadores do poderoso Hyouton. Temidos por suas técnicas de gelo e pela habilidade de realizar selos com uma única mão." },
  { id: "sem_cla",   nome: "Sem Clã",       icon: null,                                    kekkei: "Hijutsu livre",              descricao: "Sem afiliação a clã. Pode escolher Hijutsus especiais disponíveis para ninjas independentes." },
];

const tendencias = [
  { id: "LB", nome: "Leal e Bondoso",    eixoEtico: "Bondoso", eixoMoral: "Leal",    descricao: "Faz o que é esperado de uma pessoa justa. Respeita a lei e sacrifica-se para ajudar os necessitados." },
  { id: "NB", nome: "Neutro e Bondoso",  eixoEtico: "Bondoso", eixoMoral: "Neutro",  descricao: "Bom coração, colabora com autoridades mas prioriza ajudar o próximo a seguir ordens." },
  { id: "CB", nome: "Caótico e Bondoso", eixoEtico: "Bondoso", eixoMoral: "Caótico", descricao: "Espírito livre que promove o bem seguindo seus próprios instintos, não as regras." },
  { id: "LN", nome: "Leal e Neutro",     eixoEtico: "Neutro",  eixoMoral: "Leal",    descricao: "Metódico e disciplinado. Obedece às leis e cumpre promessas a qualquer custo." },
  { id: "N",  nome: "Neutro",            eixoEtico: "Neutro",  eixoMoral: "Neutro",  descricao: "Usa simples bom senso. Faz o que parece uma boa ideia, sem grandes convicções morais." },
  { id: "CN", nome: "Caótico e Neutro",  eixoEtico: "Neutro",  eixoMoral: "Caótico", descricao: "Faz o que bem entende, sem se importar com o que outros pensam. Valoriza a própria liberdade." },
  { id: "LM", nome: "Leal e Maligno",    eixoEtico: "Maligno", eixoMoral: "Leal",    descricao: "Acredita que ordem e tradição são mais importantes que liberdade e dignidade alheias." },
  { id: "NM", nome: "Neutro e Maligno",  eixoEtico: "Maligno", eixoMoral: "Neutro",  descricao: "Egoísta e mesquinho. Pega o que quer, pouco importando quem precisar prejudicar." },
  { id: "CM", nome: "Caótico e Maligno", eixoEtico: "Maligno", eixoMoral: "Caótico", descricao: "Verdadeiramente cruel. Tira prazer do sofrimento alheio. Violento e imprevisível." },
];

const atributosLista = [
  { id: "forca",        nome: "Força",        sigla: "FOR", descricao: "Capacidade muscular. Base para Combate Corporal." },
  { id: "destreza",     nome: "Destreza",     sigla: "DES", descricao: "Habilidade manual e precisão à distância. Base para Combate à Distância." },
  { id: "agilidade",    nome: "Agilidade",    sigla: "AGI", descricao: "Reflexos e velocidade. Base para Esquiva." },
  { id: "percepcao",    nome: "Percepção",    sigla: "PER", descricao: "Sentidos aguçados e intuição. Base para Ler Movimento." },
  { id: "inteligencia", nome: "Inteligência", sigla: "INT", descricao: "Intelecto e raciocínio. Essencial para Genjutsu e Ninjutsu." },
  { id: "vigor",        nome: "Vigor",        sigla: "VIG", descricao: "Resistência física. Define Vitalidade." },
  { id: "espirito",     nome: "Espírito",     sigla: "ESP", descricao: "Controle de chakra. Define Chakra total." },
];

const periciasLista = [
  { id: "acrobacia",     nome: "Acrobacia",        atributo: "agilidade",    treinada: false },
  { id: "arte",          nome: "Arte",              atributo: "percepcao",    treinada: false },
  { id: "atletismo",     nome: "Atletismo",         atributo: "forca",        treinada: false },
  { id: "atuacao",       nome: "Atuação",           atributo: "percepcao",    treinada: false },
  { id: "barganha",      nome: "Barganha",          atributo: "percepcao",    treinada: false },
  { id: "concentracao",  nome: "Concentração",      atributo: "espirito",     treinada: false },
  { id: "cultura",       nome: "Cultura",           atributo: "inteligencia", treinada: false },
  { id: "disfarces",     nome: "Disfarces",         atributo: "percepcao",    treinada: false },
  { id: "escapar",       nome: "Escapar",           atributo: "agilidade",    treinada: false },
  { id: "furtividade",   nome: "Furtividade",       atributo: "agilidade",    treinada: false },
  { id: "intimidacao",   nome: "Intimidação",       atributo: "forca",        treinada: false },
  { id: "lidar_animais", nome: "Lidar c/ Animais",  atributo: "percepcao",    treinada: true,  requisito: null },
  { id: "mecanismos",    nome: "Mecanismos",        atributo: "inteligencia", treinada: true,  requisito: null },
  { id: "medicina",      nome: "Medicina",          atributo: "inteligencia", treinada: true,  requisito: null },
  { id: "obter_info",    nome: "Obter Informação",  atributo: "percepcao",    treinada: false },
  { id: "ocultismo",     nome: "Ocultismo",         atributo: "inteligencia", treinada: true,  requisito: null },
  { id: "procurar",      nome: "Procurar",          atributo: "percepcao",    treinada: false },
  { id: "prontidao",     nome: "Prontidão",         atributo: "percepcao",    treinada: false },
  { id: "rastrear",      nome: "Rastrear",          atributo: "percepcao",    treinada: false },
  { id: "sobrevivencia", nome: "Sobrevivência",     atributo: "percepcao",    treinada: false },
  { id: "veneficio",     nome: "Venefício",         atributo: "inteligencia", treinada: true,  requisito: "Esta perícia somente pode ser comprada se possuir a aptidão Químico." },
];

const steps = ["Nível de Campanha","Clã","Tendência","Atributos","Combate","Aptidões Sociais","Perícias","Finalizar"];

// ── Tooltip treinada ──────────────────────────────────────────────────────────
const TrainadaTag = ({ texto, aberto, onToggle }) => {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (!aberto) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onToggle();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aberto, onToggle]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!aberto && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top - 12, left: rect.left + rect.width / 2 });
    }
    onToggle();
  };

  return (
    <span className="treinada-tag-wrapper" ref={ref}>
      <span className="treinada-tag" onClick={handleToggle}>[x]</span>
      {aberto && (
        <span
          className="treinada-tooltip"
          style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -100%)' }}
        >
          {texto}
          <button className="treinada-tooltip-close" onClick={(e) => { e.stopPropagation(); onToggle(); }}>✕</button>
        </span>
      )}
    </span>
  );
};

// ── Pericia Row ───────────────────────────────────────────────────────────────
const PericiaRow = ({ p, base, extra, limiteGasto, restantes, onAlterar }) => {
  const [tooltipAberto, setTooltipAberto] = useState(null);
  const total       = base + extra;
  const intervalRef = React.useRef(null);
  const timeoutRef  = React.useRef(null);
  const callbackRef = React.useRef(null);

  const stopHold = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    timeoutRef.current  = null;
    intervalRef.current = null;
  };

  const startHold = (id, delta) => {
    stopHold();
    callbackRef.current = () => onAlterar(id, delta);
    callbackRef.current();
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => callbackRef.current?.(), 80);
    }, 350);
  };

  React.useEffect(() => () => stopHold(), []);

  const podeDecrementar = extra > 0;
  const podeIncrementar = extra < limiteGasto && restantes > 0;

  return (
    <div className="pericia-row">
      <div className="pericia-info">
        <span className="pericia-nome">
          {p.nome}
          {p.treinada && (
            <TrainadaTag
              texto="Perícia só pode ser usada caso um ponto seja aplicado."
              aberto={tooltipAberto === 'treinada'}
              onToggle={() => setTooltipAberto(t => t === 'treinada' ? null : 'treinada')}
            />
          )}
          {p.requisito && (
            <TrainadaTag
              texto={p.requisito}
              aberto={tooltipAberto === 'requisito'}
              onToggle={() => setTooltipAberto(t => t === 'requisito' ? null : 'requisito')}
            />
          )}
        </span>
        <span className="pericia-atr">{atributosLista.find(a => a.id === p.atributo)?.sigla}</span>
      </div>
      <div className="pericia-valores">
        <span className="pericia-base">base {base}</span>
        <div className="atr-controle">
          <button
            className={"atr-btn sm" + (!podeDecrementar ? " disabled" : "")}
            disabled={!podeDecrementar}
            onMouseDown={(e) => { e.preventDefault(); if (podeDecrementar) startHold(p.id, -1); }}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
          >−</button>
          <span className="pericia-extra">+{extra}</span>
          <button
            className={"atr-btn sm" + (!podeIncrementar ? " disabled" : "")}
            disabled={!podeIncrementar}
            onMouseDown={(e) => { e.preventDefault(); if (podeIncrementar) startHold(p.id, +1); }}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
          >+</button>
        </div>
        <span className="pericia-total">{total}</span>
      </div>
    </div>
  );
};

// ── Step: NC ──────────────────────────────────────────────────────────────────
const StepNC = ({ onConcluir, initialValue }) => {
  const [sel, setSel] = useState(() =>
    initialValue ? niveisNC.findIndex(n => n.nivel === initialValue.nivel) : null
  );
  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">Converse com o Mestre para definir o Nível de Campanha da sua aventura.</p>
      <div className="nn-nc-grid">
        <div className="nn-nc-row">
          {niveisNC.slice(0, 4).map((n, idx) => (
            <div key={idx} className={`nn-nc-card${sel === idx ? " selected" : ""}`} onClick={() => setSel(idx)}>
              <div className="nc-card-header">
                <span className="nc-card-nivel">{n.nivel}</span>
                <span className="nc-card-nc">NC {n.nc}</span>
              </div>
              <p className="nc-card-descricao">{n.descricao}</p>
              <div className="nc-card-stats">
                <div className="nc-stat"><span className="nc-stat-val">{n.atributos}</span><span className="nc-stat-label">Atributos</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.pericias}</span><span className="nc-stat-label">Perícias</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.poderes}</span><span className="nc-stat-label">Poderes</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.atributoMinimo}</span><span className="nc-stat-label">Mín.</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="nn-nc-row">
          {niveisNC.slice(4).map((n, idx) => (
            <div key={idx + 4} className={`nn-nc-card${sel === idx + 4 ? " selected" : ""}`} onClick={() => setSel(idx + 4)}>
              <div className="nc-card-header">
                <span className="nc-card-nivel">{n.nivel}</span>
                <span className="nc-card-nc">NC {n.nc}</span>
              </div>
              <p className="nc-card-descricao">{n.descricao}</p>
              <div className="nc-card-stats">
                <div className="nc-stat"><span className="nc-stat-val">{n.atributos}</span><span className="nc-stat-label">Atributos</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.pericias}</span><span className="nc-stat-label">Perícias</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.poderes}</span><span className="nc-stat-label">Poderes</span></div>
                <div className="nc-stat"><span className="nc-stat-val">{n.atributoMinimo}</span><span className="nc-stat-label">Mín.</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="step-nav">
        <div />
        <button className={"nn-btn" + (sel !== null ? "" : " disabled")} disabled={sel === null} onClick={() => onConcluir(niveisNC[sel])}>ESCOLHER</button>
      </div>
    </div>
  );
};

// ── Step: Clã ─────────────────────────────────────────────────────────────────
const PER_PAGE = 6;
const StepCla = ({ onConcluir, initialValue }) => {
  const [sel, setSel] = useState(() => initialValue ?? null);
  const [page, setPage] = useState(() => {
    if (!initialValue) return 0;
    const idx = clasList.findIndex(c => c.id === initialValue.id);
    return idx >= 0 ? Math.floor(idx / PER_PAGE) : 0;
  });
  const totalPages = Math.ceil(clasList.length / PER_PAGE);
  const pageItems  = clasList.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">Escolha o clã do seu personagem. Isso determina quais aptidões e poderes exclusivos estarão disponíveis.</p>
      <div className="nn-cla-paginator">
        <button
          className="nn-cla-arrow"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          aria-label="Página anterior"
        ><i className="fa-solid fa-caret-left"></i></button>
        <div className="nn-cla-grid">
          {pageItems.map(c => (
            <div key={c.id} className={`nn-cla-card${sel?.id === c.id ? " selected" : ""}`} onClick={() => setSel(c)}>
              <div className="cla-nome-row">
                {c.icon && <img src={c.icon} alt={c.nome} className="cla-icon" />}
                <span className="cla-nome">{c.nome}</span>
              </div>
              <span className="cla-kekkei">{c.kekkei}</span>
              <p className="cla-descricao">{c.descricao}</p>
            </div>
          ))}
          {Array.from({ length: PER_PAGE - pageItems.length }).map((_, i) => (
            <div key={"empty-" + i} className="nn-cla-card-empty" />
          ))}
        </div>
        <button
          className="nn-cla-arrow"
          onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          aria-label="Proxima pagina"
        ><i className="fa-solid fa-caret-right"></i></button>
      </div>
      <div className="nn-cla-dots">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button key={i} className={"nn-cla-dot" + (i === page ? " active" : "")} onClick={() => setPage(i)} aria-label={"Pagina " + (i + 1)} />
        ))}
      </div>
      <div className="step-nav">
        <div />
        <button className={"nn-btn" + (sel ? "" : " disabled")} disabled={!sel} onClick={() => onConcluir(sel)}>PROXIMA</button>
      </div>
    </div>
  );
};

// ── Step: Tendência ───────────────────────────────────────────────────────────
const StepTendencia = ({ onConcluir, onAnterior, initialValue }) => {
  const [sel, setSel] = useState(() => initialValue ?? null);
  const grid    = [["LB","NB","CB"],["LN","N","CN"],["LM","NM","CM"]];
  const colunas = ["Leal","Neutro","Caótico"];
  const linhas  = ["Bondoso","Neutro","Maligno"];
  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">A tendência indica o comportamento, a filosofia de vida e a forma de ver o mundo do seu personagem.</p>
      <div className="nn-tend-container">
        <div className="nn-tend-grid">
          <div className="tend-corner" />
          {colunas.map(c => <div key={c} className="tend-header-col">{c}</div>)}
          {linhas.map((linha, li) => (
            <React.Fragment key={linha}>
              <div className="tend-header-row">{linha}</div>
              {grid[li].map(id => {
                const t = tendencias.find(x => x.id === id);
                return (
                  <div key={id} className={`tend-cell${sel?.id === id ? " selected" : ""}`} onClick={() => setSel(t)}>
                    {t.nome}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        {sel && (
          <div className="tend-detalhe">
            <span className="tend-nome-sel">{sel.nome}</span>
            <p className="tend-desc-sel">{sel.descricao}</p>
          </div>
        )}
      </div>
      <div className="step-nav">
        <button className="nn-btn anterior" onClick={onAnterior}>ANTERIOR</button>
        <button className={`nn-btn${sel ? "" : " disabled"}`} disabled={!sel} onClick={() => onConcluir(sel)}>PRÓXIMA</button>
      </div>
    </div>
  );
};

// ── Step: Atributos ───────────────────────────────────────────────────────────
const StepAtributos = ({ ncData, onConcluir, onAnterior, initialValue }) => {
  const minimo = ncData.atributoMinimo;
  const max    = ncData.nc;
  const total  = ncData.atributos;
  const [atributos, setAtributos] = useState(() => {
    if (initialValue) return initialValue;
    const obj = {}; atributosLista.forEach(a => { obj[a.id] = minimo; }); return obj;
  });
  const gastos    = Object.values(atributos).reduce((s, v) => s + v, 0);
  const restantes = total - gastos;
  const alterar   = (id, delta) => {
    const novo = atributos[id] + delta;
    if (novo < minimo || novo > max) return;
    if (delta > 0 && restantes <= 0) return;
    setAtributos(prev => ({ ...prev, [id]: novo }));
  };
  const vitalidade = 10 + 3 * (atributos.vigor ?? 0) + 5 * ncData.nc;
  const chakra     = 10 + 3 * (atributos.espirito ?? 0);
  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">
        Distribua <strong>{total} pontos</strong> entre os atributos. Mínimo: <strong>{minimo}</strong> | Máximo: <strong>{max}</strong>.
      </p>
      <div className="nn-pontos-badge">
        <span className={restantes === 0 ? "pontos-ok" : "pontos-resto"}>
          {restantes > 0 ? `${restantes} pontos restantes` : restantes < 0 ? `${Math.abs(restantes)} pontos excedidos!` : "Todos os pontos distribuídos."}
        </span>
      </div>
      <div className="nn-atributos-grid">
        {atributosLista.map(a => (
          <div key={a.id} className="atr-row">
            <div className="atr-info">
              <span className="atr-sigla">{a.sigla}</span>
              <span className="atr-nome">{a.nome}</span>
              <span className="atr-desc">{a.descricao}</span>
            </div>
            <div className="atr-controle">
              <button className="atr-btn" onClick={() => alterar(a.id, -1)} disabled={atributos[a.id] <= minimo}>−</button>
              <span className="atr-valor">{atributos[a.id]}</span>
              <button className="atr-btn" onClick={() => alterar(a.id, +1)} disabled={atributos[a.id] >= max || restantes <= 0}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="nn-energias">
        <div className="energia-card vida"><span className="en-label">Vitalidade</span><span className="en-valor">{vitalidade}</span></div>
        <div className="energia-card chakra-en"><span className="en-label">Chakra</span><span className="en-valor">{chakra}</span></div>
      </div>
      <div className="step-nav">
        <button className="nn-btn anterior" onClick={onAnterior}>ANTERIOR</button>
        <button className={`nn-btn${restantes === 0 ? "" : " disabled"}`} disabled={restantes !== 0} onClick={() => onConcluir(atributos)}>PRÓXIMA</button>
      </div>
    </div>
  );
};

// ── Step: Combate ─────────────────────────────────────────────────────────────
const StepCombate = ({ atributos, onConcluir, onAnterior, initialValue }) => {
  const [bases, setBases] = useState(() => initialValue?.bases ?? { CC: 3, CD: 3, ESQ: 3, LM: 3 });
  const habs = [
    { id: "CC",  nome: "Combate Corporal",    sigla: "CC",  atrId: "forca",     atrNome: "FOR" },
    { id: "CD",  nome: "Combate à Distância", sigla: "CD",  atrId: "destreza",  atrNome: "DES" },
    { id: "ESQ", nome: "Esquiva",             sigla: "ESQ", atrId: "agilidade", atrNome: "AGI" },
    { id: "LM",  nome: "Ler Movimento",       sigla: "LM",  atrId: "percepcao", atrNome: "PER" },
  ];

  const somaAtual  = Object.values(bases).reduce((s, v) => s + v, 0); // deve sempre ser 12
  const valido     = somaAtual === 12 && Object.values(bases).every(v => v >= 1 && v <= 5);
  const getValor   = (h) => bases[h.id] + (atributos[h.atrId] ?? 0);

  const handleInput = (id, raw) => {
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    const clamped = Math.min(5, Math.max(1, num));
    setBases(prev => ({ ...prev, [id]: clamped }));
  };

  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">
        Cada habilidade começa com <strong>Valor Base 3</strong>. Você pode mover até <strong>2 pontos</strong> entre as habilidades — mínimo <strong>1</strong>, máximo <strong>5</strong> por habilidade. A soma total dos valores base deve ser sempre <strong>12</strong>.
      </p>
      <div className="nn-pontos-badge">
        <span className={valido ? "pontos-ok" : "pontos-resto"}>
          {valido
            ? "Distribuição válida."
            : somaAtual > 12
              ? `Soma atual: ${somaAtual} — retire ${somaAtual - 12} ponto${somaAtual - 12 > 1 ? "s" : ""}`
              : `Soma atual: ${somaAtual} — adicione ${12 - somaAtual} ponto${12 - somaAtual > 1 ? "s" : ""}`
          }
        </span>
      </div>
      <div className="nn-combate-grid">
        {habs.map(h => {
          const total = getValor(h);
          const invalido = bases[h.id] < 1 || bases[h.id] > 5;
          return (
            <div key={h.id} className={`combate-card${invalido ? " combate-card-erro" : ""}`}>
              <span className="combate-nome">{h.nome}</span>
              <span className="combate-formula">
                <input
                  type="number"
                  className="combate-base-input"
                  value={bases[h.id]}
                  min={1}
                  max={5}
                  onChange={(e) => handleInput(h.id, e.target.value)}
                />
                <span className="combate-formula-sep">+</span>
                <span className="combate-atr-val">{atributos[h.atrId] ?? 0}</span>
                <span className="combate-atr-sigla">({h.atrNome})</span>
              </span>
              <span className="combate-total">{total}</span>
            </div>
          );
        })}
      </div>
      <div className="combate-info">
        <p>Iniciativa = Agilidade + Prontidão ({(atributos.agilidade ?? 0) + Math.ceil((atributos.percepcao ?? 0) / 2)} base, cresce com pontos em Prontidão)</p>
        <p>Deslocamento = 10m + Agilidade ÷ 2 ({10 + Math.floor((atributos.agilidade ?? 0) / 2)}m)</p>
        <p>Reação de Esquiva = ESQ + 9 ({getValor(habs[2]) + 9})</p>
      </div>
      <div className="step-nav">
        <button className="nn-btn anterior" onClick={onAnterior}>ANTERIOR</button>
        <button className={`nn-btn${valido ? "" : " disabled"}`} disabled={!valido} onClick={() => onConcluir({ CC: getValor(habs[0]), CD: getValor(habs[1]), ESQ: getValor(habs[2]), LM: getValor(habs[3]), bases })}>PRÓXIMA</button>
      </div>
    </div>
  );
};

// ── Step: Sociais ─────────────────────────────────────────────────────────────
const StepSociais = ({ ncData, onConcluir, onAnterior, initialValue }) => {
  const pontosTotal = Math.max(2, 2 * ncData.atributoMinimo);
  const maxNivel    = Math.floor(ncData.nc / 2);
  const [carisma,     setCarisma]     = useState(() => initialValue?.carisma     ?? 0);
  const [manipulacao, setManipulacao] = useState(() => initialValue?.manipulacao ?? 0);
  const restantes = pontosTotal - carisma - manipulacao;
  const alterar = (setter, val, delta) => {
    const novo = val + delta;
    if (novo < 0 || novo > maxNivel) return;
    if (delta > 0 && restantes <= 0) return;
    setter(novo);
  };
  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">
        Distribua <strong>{pontosTotal} pontos</strong> entre Carisma e Manipulação. Nível máximo: <strong>{maxNivel}</strong>.
      </p>
      <div className="nn-social-desc">
        <p><strong>Carisma</strong> — Atrair e agradar pessoas pelo charme e personalidade.</p>
        <p><strong>Manipulação</strong> — Fazer pessoas agirem como você quer, através de blefe e enganação.</p>
      </div>
      <div className="nn-pontos-badge">
        <span className={restantes === 0 ? "pontos-ok" : "pontos-resto"}>
          {restantes > 0 ? `${restantes} pontos restantes` : "Pontos distribuídos."}
        </span>
      </div>
      <div className="nn-sociais-grid">
        {[
          { label: "Carisma",     val: carisma,     set: (d) => alterar(setCarisma, carisma, d) },
          { label: "Manipulação", val: manipulacao, set: (d) => alterar(setManipulacao, manipulacao, d) },
        ].map(s => (
          <div key={s.label} className="social-card">
            <span className="social-nome">{s.label}</span>
            <div className="atr-controle">
              <button className="atr-btn" onClick={() => s.set(-1)} disabled={s.val <= 0}>−</button>
              <span className="atr-valor">{s.val}</span>
              <button className="atr-btn" onClick={() => s.set(+1)} disabled={s.val >= maxNivel || restantes <= 0}>+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="step-nav">
        <button className="nn-btn anterior" onClick={onAnterior}>ANTERIOR</button>
        <button className="nn-btn" onClick={() => onConcluir({ carisma, manipulacao })}>PRÓXIMA</button>
      </div>
    </div>
  );
};

// ── Step: Perícias ────────────────────────────────────────────────────────────
const StepPericias = ({ ncData, atributos, onConcluir, onAnterior, initialValue }) => {
  const totalPontos = ncData.pericias;
  const limiteGasto = Math.floor(ncData.nc / 2);
  const getBase     = (p) => Math.ceil((atributos[p.atributo] ?? 0) / 2);
  const [gastos, setGastos] = useState(() => {
    if (initialValue) return initialValue;
    const obj = {}; periciasLista.forEach(p => { obj[p.id] = 0; }); return obj;
  });
  const totalGasto = Object.values(gastos).reduce((s, v) => s + v, 0);
  const restantes  = totalPontos - totalGasto;

  // ← functional setState: interval sempre lê o valor atual, sem closure stale
  const alterar = (id, delta) => {
    setGastos(prev => {
      const atual = prev[id] ?? 0;
      const novo  = atual + delta;
      if (novo < 0 || novo > limiteGasto) return prev;
      const totalAtual = Object.values(prev).reduce((s, v) => s + v, 0);
      if (delta > 0 && totalAtual >= totalPontos) return prev;
      return { ...prev, [id]: novo };
    });
  };

  return (
    <div className="step-wrapper">
      <p className="novo-naruto-subtitulo">
        Distribua <strong>{totalPontos} pontos</strong> de perícia. Máximo por perícia: <strong>{limiteGasto}</strong>.
        O nível base é metade do atributo vinculado.
      </p>
      <div className="nn-pontos-badge">
        <span className={restantes === 0 ? "pontos-ok" : "pontos-resto"}>
          {restantes > 0 ? `${restantes} pontos restantes` : "Todos os pontos distribuídos."}
        </span>
      </div>
      <div className="nn-pericias-grid">
        {periciasLista.map(p => {
          const base  = getBase(p);
          const extra = gastos[p.id] ?? 0;
          return (
            <PericiaRow
              key={p.id}
              p={p}
              base={base}
              extra={extra}
              limiteGasto={limiteGasto}
              restantes={restantes}
              onAlterar={alterar}
            />
          );
        })}
      </div>
      <div className="step-nav">
        <button className="nn-btn anterior" onClick={onAnterior}>ANTERIOR</button>
        <button className={`nn-btn${restantes === 0 ? "" : " disabled"}`} disabled={restantes !== 0} onClick={() => onConcluir(gastos)}>PRÓXIMA</button>
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const NovoNaruto = () => {
  const navigate       = useNavigate();
  const inputImagemRef = useRef(null);
  const [step, setStep] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso]       = useState(null);

  const [ncData,        setNcData]        = useState(null);
  const [claData,       setClaData]       = useState(null);
  const [tendenciaData, setTendenciaData] = useState(null);
  const [atributosData, setAtributosData] = useState(null);
  const [combateData,   setCombateData]   = useState(null);
  const [sociaisData,   setSociaisData]   = useState(null);
  const [periciasData,  setPericiasData]  = useState(null);

  const [nomePersonagem, setNomePersonagem] = useState("");
  const [nomeJogador,    setNomeJogador]    = useState("");
  const [vila,           setVila]           = useState("");
  const [aparencia,      setAparencia]      = useState("");
  const [personalidade,  setPersonalidade]  = useState("");
  const [historico,      setHistorico]      = useState("");
  const [objetivo,       setObjetivo]       = useState("");
  const [imagemPreview,  setImagemPreview]  = useState(null);
  const [imagemBase64,   setImagemBase64]   = useState(null);
  const [cropModalOpen,  setCropModalOpen]  = useState(false);
  const [imagemParaCrop, setImagemParaCrop] = useState(null);

  const mostrarAviso = (msg) => { setAviso(msg); setTimeout(() => setAviso(null), 3000); };

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { mostrarAviso("imagem (máx 2MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setImagemParaCrop(ev.target.result); setCropModalOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFinalizar = async () => {
    if (!nomePersonagem.trim()) { mostrarAviso("nome do personagem"); return; }
    const body = {
      nc: ncData.nc, nivel_shinobi: ncData.nivel, cla: claData.id,
      tendencia: tendenciaData.id, atributos: atributosData,
      combate: combateData, sociais: sociaisData, pericias: periciasData,
      nome_personagem: nomePersonagem, nome_jogador: nomeJogador, vila,
      aparencia, personalidade, historico, objetivo,
      imagem: imagemBase64 || null,
    };
    setSalvando(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/naruto/fichas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); mostrarAviso(err.error || "Erro ao salvar"); return; }
      navigate("/personagens");
    } catch { mostrarAviso("Erro de conexão"); }
    finally { setSalvando(false); }
  };

  return (
    <div className="novo-naruto-page">

      <div className="novo-naruto-stepper">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <span
              className={`nn-step-label${i === step ? " active" : i < step ? " done" : ""}`}
              onClick={() => setStep(i)}
              style={{ cursor: "pointer" }}
            >{label}</span>
            {i < steps.length - 1 && <div className={`nn-step-line${i < step ? " done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 0 && <StepNC onConcluir={(d) => { setNcData(d); setStep(1); }} initialValue={ncData} />}
      {step === 1 && <StepCla onConcluir={(d) => { setClaData(d); setStep(2); }} initialValue={claData} />}
      {step === 2 && <StepTendencia onConcluir={(d) => { setTendenciaData(d); setStep(3); }} onAnterior={() => setStep(1)} initialValue={tendenciaData} />}
      {step === 3 && ncData && <StepAtributos ncData={ncData} onConcluir={(d) => { setAtributosData(d); setStep(4); }} onAnterior={() => setStep(2)} initialValue={atributosData} />}
      {step === 4 && atributosData && <StepCombate atributos={atributosData} onConcluir={(d) => { setCombateData(d); setStep(5); }} onAnterior={() => setStep(3)} initialValue={combateData} />}
      {step === 5 && ncData && <StepSociais ncData={ncData} onConcluir={(d) => { setSociaisData(d); setStep(6); }} onAnterior={() => setStep(4)} initialValue={sociaisData} />}
      {step === 6 && ncData && atributosData && <StepPericias ncData={ncData} atributos={atributosData} onConcluir={(d) => { setPericiasData(d); setStep(7); }} onAnterior={() => setStep(5)} initialValue={periciasData} />}

      {step === 7 && (
        <div className="final-wrapper">
          <div className="final-header">
            <p className="final-intro">Um ninja não é feito só de atributos ou números na ficha. No RPG, o que realmente define um shinobi são suas escolhas, sua personalidade e sua história. Os atributos mostram o potencial, mas é a forma como o personagem age e enfrenta os desafios que realmente constrói quem ele é, qual o seu jeito ninja?</p>
            <button className={`nn-btn final-btn${salvando ? " disabled" : ""}`} onClick={handleFinalizar} disabled={salvando}>
              {salvando ? "SALVANDO..." : "FINALIZAR"}
            </button>
          </div>
          <div className="final-scroll">
            <div className="final-field">
              <label className="final-label">Imagem do Personagem</label>
              <div className="final-imagem-wrapper">
                <div className="final-imagem-area" onClick={() => inputImagemRef.current?.click()}>
                  {imagemPreview
                    ? <img src={imagemPreview} alt="preview" className="final-imagem-preview" />
                    : <div className="final-imagem-placeholder"><span>Clique para fazer upload</span><span style={{ fontSize: "0.75rem", opacity: 0.6 }}>JPG, PNG — máx. 2MB</span></div>
                  }
                </div>
                {imagemPreview && <button className="final-remover-imagem" onClick={() => { setImagemPreview(null); setImagemBase64(null); }}>Remover imagem</button>}
              </div>
              <input ref={inputImagemRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleImagemChange} />
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
              <label className="final-label">Vila</label>
              <input className="final-input" placeholder="Ex: Konohagakure, Sunagakure..." value={vila} onChange={(e) => setVila(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Aparência</label>
              <textarea className="final-textarea" placeholder="Nome, gênero, idade, descrição física..." value={aparencia} onChange={(e) => setAparencia(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Personalidade</label>
              <textarea className="final-textarea" placeholder="Traços marcantes, opiniões, ideais..." value={personalidade} onChange={(e) => setPersonalidade(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Histórico</label>
              <textarea className="final-textarea" placeholder="Infância, família, como se tornou ninja..." value={historico} onChange={(e) => setHistorico(e.target.value)} />
            </div>
            <div className="final-field">
              <label className="final-label">Objetivo</label>
              <textarea className="final-textarea" placeholder="Por que ele luta? O que o move?" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {aviso && <div className="aviso-toast">Preencha {aviso} antes de finalizar!</div>}
      {cropModalOpen && imagemParaCrop && (
        <ImageCropModal src={imagemParaCrop} title="Imagem do Personagem"
          onConfirm={(c) => { setImagemPreview(c); setImagemBase64(c); setCropModalOpen(false); setImagemParaCrop(null); }}
          onClose={() => { setCropModalOpen(false); setImagemParaCrop(null); }}
        />
      )}
    </div>
  );
};

export default NovoNaruto;