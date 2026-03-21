import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/EscolherInvocacao.css";

import imgAguia    from "../assets/invocacoes/aguia.png";
import imgCao      from "../assets/invocacoes/cao.png";
import imgCobra    from "../assets/invocacoes/cobra.png";
import imgLesma    from "../assets/invocacoes/lesma.png";
import imgMacaco   from "../assets/invocacoes/macaco.png";
import imgSapo     from "../assets/invocacoes/sapo.png";
import imgElefante from "../assets/invocacoes/elefante.png";
import imgSalamandra from "../assets/invocacoes/salamandra.png";
import imgMarisco    from "../assets/invocacoes/marisco.png";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Dados das Invocações ──────────────────────────────────────────────────────
const INVOCACOES = [
  {
    id: "caes",
    nome: "Cães Ninjas",
    subtitulo: "Kuchiyose exclusivo — Clã Hatake",
    img: imgCao,
    exclusivo: "hatake",
    exclusivoNome: "Clã Hatake",
    descricao:
      "Os Ninken (Cães Ninjas) são essencialmente cães que aumentaram os sentidos e habilidades ninjas, capazes de trabalhar ao lado do shinobi como suporte. Podem andar sobre a água, possuem grande olfato e inteligência suficiente para auxiliar em estratégias de combate.\n\nInvocação Numerosa: você pode invocar até 8 cães ao mesmo tempo, todos no nível mais alto que o poder permitir. Contudo, eles falham em qualquer teste de Habilidade de Combate e são considerados capangas com 1 de Vitalidade.\n\nTamanho: Cães são limitados até o tamanho Médio.",
    atributos: ["Agilidade", "Percepção"],
    pericias: ["Acrobacia", "Atletismo", "Escapar", "Furtividade", "Procurar", "Prontidão", "Rastrear"],
    poderes: "Nenhum.",
    aptidoes: [
      "Acuidade",
      "Ataque em Movimento",
      "Especialista",
      "Intuição",
      "Reflexos",
      "Velocista",
      "Perito",
      "Perícia Inata",
      "Lutador",
      "Ponto Cego",
      "Ataque Atordoante",
      "Ataque Poderoso",
      "Derrubar Agressivo",
      "De Pé",
      "Desarme Agressivo",
      "Rasteira",
      "Sensor (via olfato; requer Per 1; duração contínua)",
    ],
    tecnicas: [
      "Tadayou",
      "Kuchiyose: Doton: Tsuiga no Jutsu",
    ],
    ataques: ["Mordida (perfuração)"],
  },
  {
    id: "cobras",
    nome: "Cobras Gigantes",
    subtitulo: "Kyodaija — Disponível para todos os clãs os clãs",
    img: imgCobra,
    exclusivo: null,
    descricao:
      "As Kyodaija ('Cobras Gigantes') são serpentes imensas dotadas de grande poder de batalha. A maioria delas, principalmente as líderes, são temperamentais e cheias de caprichos, muitas vezes exigindo sacrifícios humanos como pagamento pela obediência ao invocador. As cobras podem utilizar sua troca de pele durante os combates, numa espécie de Kawarimi no Jutsu.",
    atributos: ["Força", "Agilidade", "Percepção"],
    pericias: ["Acrobacia", "Atletismo", "Furtividade", "Prontidão", "Rastrear"],
    poderes: "Nenhum.",
    aptidoes: [
      "Ataque em Movimento",
      "Especialista",
      "Reflexos",
      "Intuição",
      "Velocista",
      "Perito",
      "Perícia Inata",
      "Lutador",
      "Ponto Cego",
      "Arremessar",
      "Ataque Atordoante",
      "Ataque Poderoso",
      "Derrubar Agressivo",
      "Sensor (via olfato; requer Per 1; duração contínua)",
    ],
    tecnicas: [
      "Kawarimi no Jutsu",
      "Kinobori",
      "Imergir (Doton)",
      "Amedrontar Nv 2 (Magen; Dif 6 + Int; somente contra criaturas menores)",
    ],
    ataques: ["Mordida (perfuração)", "Batida com Cauda (esmagamento)"],
  },
  {
    id: "lesmas",
    nome: "Lesmas",
    subtitulo: "Disponível para todos os clãs os clãs",
    img: imgLesma,
    exclusivo: null,
    descricao:
      "As lesmas são tranquilas e obedientes ao seu mestre, especialmente quando comparadas aos Sapos e principalmente às Cobras. São sérias quando necessárias, mas também possuem um lado brincalhão.\n\nLesmas possuem pouco poder ofensivo, mas são grandes suportes, principalmente para ninjas médicos: podem usar o poder Iryou Ninjutsu junto com seu Mestre e assim aumentar a taxa de cura. A lesma e o invocador devem usar o poder ao mesmo tempo, no mesmo alvo; cada um gasta suas ações e custos de chakra individualmente. Os efeitos de cura de ambos são somados. A lesma não pode usar as técnicas específicas do Iryou, somente a cura geral.\n\nInvocação Unitária: somente uma única lesma por cena.",
    atributos: ["Inteligência", "Espírito", "Vigor"],
    pericias: ["Ciências Naturais", "Concentração", "Escapar", "Furtividade", "Medicina", "Prontidão"],
    poderes: "Iryou Ninjutsu (somente cura geral; a lesma não pode usar as técnicas específicas do poder).",
    aptidoes: [
      "Acuidade",
      "Ataque em Movimento",
      "Intuição",
      "Reflexos",
      "Ninja Médico",
      "Perito",
      "Perícia Inata",
      "Lutar às Cegas",
      "Maestria",
      "Resistência Maior (Vigor)",
      "Duro de Matar",
    ],
    tecnicas: [
      "Tadayou",
      "Kinobori",
      "Katsuyu Daibunretsu",
      "Byakugou no In",
      "Ácido (efeito Sopro Destrutivo Nv 4; dano base = Espírito; somente tamanho médio ou maior)",
    ],
    ataques: ["Batida de Corpo (esmagamento)"],
  },
  {
    id: "macacos",
    nome: "Macacos Ninjas",
    subtitulo: "Kuchiyose exclusivo — Clã Sarutobi",
    img: imgMacaco,
    exclusivo: "sarutobi",
    exclusivoNome: "Clã Sarutobi",
    descricao:
      "Os macacos possuem grande força física e bastante habilidade nas artes marciais. Os mais poderosos ainda possuem a capacidade de se transformar em um bastão largo e extensível por meio da técnica Henge: Kongōnyoi (Transformação: Bastão Adamantino). Essa arma é muito resistente, pode mudar de tamanho e largura, e o macaco consegue usar os membros mesmo estando transformado, fazendo os braços e pernas aparecerem no meio ou extremidades do bastão.\n\nTamanho: Macacos são limitados até o tamanho Grande.",
    atributos: ["Força", "Agilidade", "Vigor"],
    pericias: ["Acrobacia", "Atletismo", "Disfarces", "Prontidão"],
    poderes: "Nenhum.",
    aptidoes: [
      "Ataque em Movimento",
      "Especialista",
      "Reflexos",
      "Velocista",
      "Perito",
      "Perícia Inata",
      "Lutador",
      "Lutar às Cegas",
      "Ponto Cego",
      "Arremessar",
      "Ataque Atordoante",
      "Ataque Múltiplo",
      "Ataque Poderoso",
      "Derrubar Agressivo",
      "De Pé",
      "Desarme Agressivo",
      "Soco Agarrado",
      "Chute Inverso",
      "Voadora",
    ],
    tecnicas: ["Henge no Jutsu"],
    ataques: ["Socos (esmagamento)", "Chutes (esmagamento)"],
  },
  {
    id: "sapos",
    nome: "Sapos Ninjas",
    subtitulo: "Disponível para todos os clãs os clãs",
    img: imgSapo,
    exclusivo: null,
    descricao:
      "Esses poderosos seres são conhecidos por secretar uma espécie de óleo viscoso e altamente inflamável, usando tal habilidade como variação do poder Suiton. Também são capazes de usar armas de corte, como verdadeiros espadachins.",
    atributos: ["Agilidade", "Espírito", "Força"],
    pericias: ["Acrobacia", "Atletismo", "Escapar", "Prontidão"],
    poderes: "Fuuton, Suiton, Katon.",
    aptidoes: [
      "Ataque em Movimento",
      "Especialista",
      "Guerreiro",
      "Intuição",
      "Reflexos",
      "Velocista",
      "Maestria",
      "Perito",
      "Perícia Inata",
      "Usar Arma",
    ],
    tecnicas: [
      "Tadayou",
      "Óleo do Sapo (se possuir Suiton, recebe o efeito Inflamável Nv 5 gratuitamente; somente para tamanho médio ou maior)",
    ],
    ataques: ["Clava (esmagamento)", "Lança (perfuração)", "Espadas de qualquer tipo (corte)"],
  },
  {
    id: "aguias",
    nome: "Águias",
    subtitulo: "Disponível para todos os clãs os clãs",
    img: imgAguia,
    exclusivo: null,
    descricao:
      "Uma águia de penas coloridas, conhecida por ser utilizada por personagens do País do Ar. Seus ataques rasantes a tornam um terrível oponente.\n\nNão falam a língua humana.",
    atributos: ["Agilidade", "Percepção"],
    pericias: ["Acrobacia", "Atletismo", "Voo", "Prontidão", "Rastrear"],
    poderes: "—",
    aptidoes: [
      "Ataque em Movimento",
      "Especialista",
      "Reflexos",
      "Intuição",
      "Velocista",
      "Perito",
      "Perícia Inata",
      "Ponto Cego",
      "Ataque Atordoante",
      "Ataque Poderoso",
      "Derrubar Agressivo (não requer Lutador; sem penalidade de precisão da manobra)",
    ],
    tecnicas: [
      "Bater de Asas: ação padrão, cria ventania em área de 2m por nível de Força. Não causa dano, mas pode dissipar gases. Criaturas resistem com Kinobori (reação) ou Acrobacia/Força contra a Força da águia.",
    ],
    ataques: ["Garras (corte)", "Bico (perfuração)"],
  },
  {
    id: "baku",
    nome: "Baku",
    subtitulo: "Kuchiyose Restrito — exclusivo Clã Shimura",
    img: imgElefante,
    exclusivo: "shimura",
    exclusivoNome: "Clã Shimura",
    descricao:
      "Baku é a invocação especial dos membros do Clã Shimura. Os integrantes da espécie, que se assemelha a uma Anta-Elefante, possuem fitas coladas ao redor de suas cabeças e armaduras entre os olhos. Segundo conta-se, todos descendem de uma antiga criatura mitológica: uma quimera com tronco de elefante, olhos de rinoceronte, cauda de boi e patas de tigre, que podia comer os sonhos e os pesadelos de suas vítimas.\n\nNão falam a língua humana.\n\nInvocação Unitária: somente um único Baku por cena.",
    atributos: ["Força", "Inteligência", "Espírito"],
    pericias: ["Atletismo", "Concentração", "Prontidão", "Rastrear"],
    poderes: "Nenhum.",
    aptidoes: [
      "Arremessar",
      "Ataque em Movimento",
      "Ataque Poderoso",
      "Derrubar Agressivo",
      "Especialista",
      "Intuição",
      "Lutador",
      "Perícia Inata",
      "Perito",
      "Reflexos",
      "Técnica Elevada",
    ],
    tecnicas: [
      "Akumu no Kyuuin",
      "Amedrontar Nv 2 (Magen; dificuldade = 6 + ½ NC da invocação + ½ Inteligência da invocação)",
      "Kinobori",
    ],
    ataques: ["Atropelar (esmagamento)", "Garras (perfuração)"],
  },
  {
    id: "salamandra",
    nome: "Salamandra",
    subtitulo: "Disponível para todos os clãs",
    img: imgSalamandra,
    exclusivo: null,
    descricao:
      "Uma salamandra gigante capaz de guardar veneno dentro de si e expeli-lo em cone, seguindo as regras do efeito Venenoso do Fuuton. Também pode engolir inimigos quando está imersa no solo.\n\nInvocação Unitária: somente uma única salamandra por cena.\n\nTamanho Único: limitada até o tamanho Enorme.",
    atributos: ["Inteligência", "Força", "Destreza"],
    pericias: ["Furtividade", "Prontidão", "Atletismo", "Acrobacia"],
    poderes: "Nenhum.",
    aptidoes: [
      "Acuidade",
      "De Pé",
      "Maestria",
      "Perito",
      "Perícia Inata",
      "Resistência Maior (Vigor)",
      "Lutar às Cegas",
    ],
    tecnicas: [
      "Dokugiri (req. Kuchiyose 6): expele cone de veneno, segue regras do efeito Venenoso Fuuton. Pode guardar 1 comp. de veneno por categoria de tamanho acima de Médio (máx. Venenos IV; Venenos V com Kuchiyose 10). Quem for engolido falha automaticamente no teste de Vigor contra o veneno.",
      "Imergir (Doton)",
      "Engolimento (req. Imergir Doton): quando imersa, pode agarrar alvo imediatamente acima como ataque furtivo (ação completa). Alvo deve ser uma categoria de tamanho menor. Para escapar: teste resistido de CC ou Força, ou Escapar (Dif 4 + CC). Substitui a Falsa Decapitação do Imergir.",
    ],
    ataques: ["Batida com Cauda (esmagamento)"],
  },
  {
    id: "marisco",
    nome: "Marisco",
    subtitulo: "Disponível para todos os clãs",
    img: imgMarisco,
    exclusivo: null,
    descricao:
      "Um marisco gigante capaz de produzir grandes quantidades de névoa a partir do próprio corpo, criando uma névoa densa similar ao efeito Névoa Nv 5. A névoa cobre uma área de 30m de diâmetro + 3m por Espírito do invocador, com altura comum do poder, e serve como base para o uso da aptidão Miragem sem a restrição de alcance de 2m.\n\nTamanho: segue as regras padrão de invocação.",
    atributos: ["Espírito", "Vigor", "Inteligência"],
    pericias: ["Concentração", "Prontidão"],
    poderes: "Nenhum.",
    aptidoes: [
      "Perito",
      "Perícia Inata",
      "Resistência Maior (Vigor)",
    ],
    tecnicas: [
      "Névoa Densa (custo 5 chakra do Marisco; área 30m de diâmetro + 3m/ESP; altura comum do poder; duração sustentada): similar ao efeito Névoa Nv 5. A partir de toda a área de efeito, o invocador pode usar a aptidão Miragem sem ficar restrito pelo alcance de 2m.",
    ],
    ataques: ["Batida de Corpo (esmagamento)"],
  },
];

// ── Normaliza clã ─────────────────────────────────────────────────────────────
const normStr = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const extrairClaId = (ficha) => {
  const raw = normStr(ficha?.cla_id || ficha?.cla_nome || "");
  if (raw.includes("hatake"))  return "hatake";
  if (raw.includes("sarutobi"))return "sarutobi";
  if (raw.includes("shimura")) return "shimura";
  return raw.split(" ")[0] || raw;
};

// ── Componente ────────────────────────────────────────────────────────────────
const EscolherInvocacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [carregando, setCarregando]         = useState(true);
  const [claId, setClaId]                   = useState("");
  const [invocacaoSalva, setInvocacaoSalva] = useState(null);
  const [selecionada, setSelecionada]       = useState(null);
  const [confirmando, setConfirmando]       = useState(false);
  const [salvando, setSalvando]             = useState(false);

  useEffect(() => {
    fetch(`${API}/api/naruto/fichas/${id}`, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setClaId(extrairClaId(data));
          if (data.invocacao_id) setInvocacaoSalva(data.invocacao_id);
        }
      })
      .catch(console.error)
      .finally(() => setCarregando(false));
  }, [id]);

  const handleConcluir = async () => {
    if (!selecionada || salvando) return;
    setSalvando(true);
    try {
      const res = await fetch(`${API}/api/naruto/fichas/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invocacao_id: selecionada.id }),
      });
      if (res.ok) {
        setInvocacaoSalva(selecionada.id);
        setSelecionada(null);
        setConfirmando(false);
        navigate(`/personagem-naruto/${id}/invocacao`);
      } else {
        alert("Erro ao salvar. Tente novamente.");
      }
    } catch { alert("Erro de conexão."); }
    finally { setSalvando(false); }
  };

  if (carregando) return (
    <div className="ei-loading-page">
      <div className="ei-spinner" />
      <p className="ei-loading-txt">Carregando...</p>
    </div>
  );

  const invAtual = invocacaoSalva ? INVOCACOES.find(i => i.id === invocacaoSalva) : null;

  return (
    <div className="ei-page">

      {/* TOPBAR */}
      <div className="ei-topbar">
        <button className="ei-back-btn" onClick={() => navigate(`/personagem-naruto/${id}`)}>
          ← VOLTAR
        </button>
        <div className="ei-topbar-center">
          <i className="fas fa-scroll" />
          ESCOLHA SUA INVOCAÇÃO
        </div>
        <div style={{ width: 120 }} />
      </div>

      <div className="ei-content">

        {/* Aviso permanência */}
        <div className="ei-aviso">
          <i className="fas fa-exclamation-circle" />
          <span>
            {invocacaoSalva
              ? <>Sua invocação foi escolhida: <strong>{invAtual?.nome}</strong>. Esta escolha é permanente e não pode ser alterada.</>
              : "Esta escolha é única e não pode ser alterada no futuro. Escolha com cuidado."}
          </span>
        </div>

        {/* Grid das 7 invocações */}
        <div className="ei-grid">
          {INVOCACOES.map(inv => {
            const bloqueada  = !!inv.exclusivo && inv.exclusivo !== claId;
            const ativa      = invocacaoSalva === inv.id;
            const jaEscolheu = !!invocacaoSalva && !ativa;
            const clicavel   = !bloqueada && !jaEscolheu;

            return (
              <div
                key={inv.id}
                className={[
                  "ei-card",
                  ativa       ? "ei-card-ativa"    : "",
                  bloqueada   ? "ei-card-bloqueada" : "",
                  jaEscolheu  ? "ei-card-opaca"     : "",
                  clicavel    ? "ei-card-clicavel"  : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { if (clicavel) { setSelecionada(inv); setConfirmando(false); } }}
              >
                {/* Badge exclusividade */}
                {inv.exclusivo && (
                  <div className={`ei-badge ${bloqueada ? "ei-badge-lock" : "ei-badge-ok"}`}>
                    {bloqueada
                      ? <><i className="fas fa-lock" /> {inv.exclusivoNome}</>
                      : <><i className="fas fa-star" /> Exclusivo</>}
                  </div>
                )}

                {/* Imagem */}
                <div className={`ei-card-img-wrap ${bloqueada ? "ei-img-bloqueada" : ""}`}>
                  <img src={inv.img} alt={inv.nome} className="ei-card-img" />
                </div>

                <div className="ei-card-nome">{inv.nome}</div>

                {ativa && (
                  <div className="ei-tag-escolhida">
                    <i className="fas fa-check-circle" /> ESCOLHIDA
                  </div>
                )}
                {bloqueada && (
                  <div className="ei-lock-overlay"><i className="fas fa-lock" /></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL de informações */}
      {selecionada && (
        <div className="ei-overlay" onClick={() => { setSelecionada(null); setConfirmando(false); }}>
          <div className="ei-modal" onClick={e => e.stopPropagation()}>

            <div className="ei-modal-header">
              <img src={selecionada.img} alt={selecionada.nome} className="ei-modal-img" />
              <div className="ei-modal-header-txt">
                <div className="ei-modal-nome">{selecionada.nome}</div>
                <div className="ei-modal-sub">{selecionada.subtitulo}</div>
              </div>
              <button className="ei-modal-close" onClick={() => { setSelecionada(null); setConfirmando(false); }}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="ei-modal-body">

              <div className="ei-secao">
                <div className="ei-secao-titulo">DESCRIÇÃO</div>
                {selecionada.descricao.split("\n\n").map((p, i) => (
                  <p key={i} className="ei-texto">{p}</p>
                ))}
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">ATRIBUTOS PRINCIPAIS</div>
                <div className="ei-tags">
                  {selecionada.atributos.map((a, i) => (
                    <span key={i} className="ei-tag ei-tag-azul">{a}</span>
                  ))}
                </div>
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">PERÍCIAS</div>
                <div className="ei-tags">
                  {selecionada.pericias.map((p, i) => (
                    <span key={i} className="ei-tag ei-tag-cinza">{p}</span>
                  ))}
                </div>
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">PODERES</div>
                <p className="ei-texto">{selecionada.poderes}</p>
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">APTIDÕES</div>
                <ul className="ei-lista">
                  {selecionada.aptidoes.map((a, i) => (
                    <li key={i}><i className="fas fa-chevron-right" />{a}</li>
                  ))}
                </ul>
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">TÉCNICAS</div>
                <ul className="ei-lista">
                  {selecionada.tecnicas.map((t, i) => (
                    <li key={i}><i className="fas fa-bolt" />{t}</li>
                  ))}
                </ul>
              </div>

              <div className="ei-secao">
                <div className="ei-secao-titulo">TIPOS DE ATAQUES</div>
                <div className="ei-tags">
                  {selecionada.ataques.map((a, i) => (
                    <span key={i} className="ei-tag ei-tag-ataque">{a}</span>
                  ))}
                </div>
              </div>

            </div>

            {confirmando && !invocacaoSalva && (
              <div className="ei-confirmar-aviso">
                <i className="fas fa-exclamation-triangle" />
                <span>Atenção: esta escolha é <strong>permanente</strong> e não poderá ser alterada. Confirma?</span>
              </div>
            )}

            <div className="ei-modal-footer">
              <button className="ei-btn-pensar" onClick={() => { setSelecionada(null); setConfirmando(false); }}>
                <i className="fas fa-arrow-left" /> PENSAR MELHOR
              </button>
              {!invocacaoSalva && (
                !confirmando ? (
                  <button className="ei-btn-concluir" onClick={() => setConfirmando(true)}>
                    <i className="fas fa-check" /> CONCLUIR
                  </button>
                ) : (
                  <button className="ei-btn-concluir ei-btn-final" onClick={handleConcluir} disabled={salvando}>
                    {salvando
                      ? <><i className="fas fa-spinner fa-spin" /> SALVANDO...</>
                      : <><i className="fas fa-check-double" /> CONFIRMAR ESCOLHA</>}
                  </button>
                )
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EscolherInvocacao;