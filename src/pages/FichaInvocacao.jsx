import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaInvocacao.css";
import ImageCropModal from "../components/ImageCropModal";

import imgAguia    from "../assets/invocacoes/aguia.png";
import imgCao      from "../assets/invocacoes/cao.png";
import imgCobra    from "../assets/invocacoes/cobra.png";
import imgLesma    from "../assets/invocacoes/lesma.png";
import imgMacaco   from "../assets/invocacoes/macaco.png";
import imgSapo     from "../assets/invocacoes/sapo.png";
import imgElefante from "../assets/invocacoes/elefante.png";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

// ── Tabela de pontos por NC (igual à ficha principal) ─────────────────────────
const TABELA_NC = [
  { nc:4,  atributos:12  }, { nc:5,  atributos:18  }, { nc:6,  atributos:24  },
  { nc:7,  atributos:30  }, { nc:8,  atributos:36  }, { nc:9,  atributos:42  },
  { nc:10, atributos:48  }, { nc:11, atributos:54  }, { nc:12, atributos:60  },
  { nc:13, atributos:66  }, { nc:14, atributos:72  }, { nc:15, atributos:78  },
  { nc:16, atributos:84  }, { nc:17, atributos:90  }, { nc:18, atributos:96  },
  { nc:19, atributos:102 }, { nc:20, atributos:108 },
];
const getPontosAtributo = nc => {
  const n = parseInt(nc,10);
  if (isNaN(n)||n<4) return 12;
  const row = TABELA_NC.find(r=>r.nc===n);
  if (row) return row.atributos;
  if (n>20) return 108+(n-20)*6;
  return 12;
};
// Pontos de poder: 1 para cada 2 NC completos
const getPontosPoder = nc => Math.floor(parseInt(nc,10)/2)||0;

// ── Helpers ───────────────────────────────────────────────────────────────────
const rolar2d8 = () => ({ d1:Math.floor(Math.random()*8)+1, d2:Math.floor(Math.random()*8)+1 });
const makeTimestamp = () => {
  const n=new Date();
  return `${String(n.getDate()).padStart(2,"0")}/${String(n.getMonth()+1).padStart(2,"0")} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
};
const normStr = s=>(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

// ── Dados base das invocações ─────────────────────────────────────────────────
const INV_BASE = {
  caes:{
    nome:"Cães Ninjas", img:imgCao,
    atributosPrincipais:["agilidade","percepcao"],
    pericias:[
      {id:"acrobacia",  nome:"Acrobacia",  atr:"agilidade"},
      {id:"atletismo",  nome:"Atletismo",  atr:"forca"},
      {id:"escapar",    nome:"Escapar",    atr:"destreza"},
      {id:"furtividade",nome:"Furtividade",atr:"agilidade"},
      {id:"procurar",   nome:"Procurar",   atr:"percepcao"},
      {id:"prontidao",  nome:"Prontidão",  atr:"percepcao"},
      {id:"rastrear",   nome:"Rastrear",   atr:"percepcao"},
    ],
    aptidoes:["Acuidade","Ataque em Movimento","Especialista","Intuição","Reflexos","Velocista","Perito","Perícia Inata","Lutador","Ponto Cego","Ataque Atordoante","Ataque Poderoso","Derrubar Agressivo","De Pé","Desarme Agressivo","Rasteira","Sensor (via olfato; requer Per 1; duração contínua)"],
    tecnicas:[
      { id:"tadayou", nome:"Tadayou", desc:"Técnica de caminhada sobre a água. A invocação pode se mover sobre superfícies aquáticas normalmente, sem necessidade de testes." },
      { id:"tsuiga", nome:"Kuchiyose: Doton: Tsuiga no Jutsu", desc:"*Pré-requisito:* Kuchiyose 6 (Cães), Imergir 4 (Doton)\n*Ação:* Padrão\n*Alcance:* Comum do poder Doton\n*Duração:* Instantânea\n*Custo de Chakra:* 10\n\nPara essa técnica, você precisa marcar o oponente com seu próprio sangue (ocorre se o inimigo já tiver lhe ferido com grau de dano 3 em ataque corpo-a-corpo). Você marca sangue em um pergaminho de jutsu preparado e bate contra o chão. Oito cães ninjas são invocados dentro do solo e viajam seguindo o cheiro do sangue marcado até o inimigo. Quando o alvo é encontrado, eles saem do chão e o seguram com a boca.\n\nNão há teste de ataque. O alvo deve fazer um teste de *Prontidão ou Agilidade (Dif padrão Doton)*. Se falhar, fica agarrado e desprevenido por 2 turnos." },
    ],
    ataques:[{nome:"Mordida",tipo:"perfuração",desc:"Dano base = Força −3 (mín. 3)."}],
    poderes:[],
    obs:"Invocação Numerosa: até 8 cães simultaneamente (todos no NC máximo do poder). Em qualquer teste de HC falham automaticamente e são capangas com 1 de Vitalidade. Tamanho máximo: Médio.",
  },
  cobras:{
    nome:"Cobras Gigantes", img:imgCobra,
    atributosPrincipais:["forca","agilidade","percepcao"],
    pericias:[
      {id:"acrobacia",  nome:"Acrobacia",  atr:"agilidade"},
      {id:"atletismo",  nome:"Atletismo",  atr:"forca"},
      {id:"furtividade",nome:"Furtividade",atr:"agilidade"},
      {id:"prontidao",  nome:"Prontidão",  atr:"percepcao"},
      {id:"rastrear",   nome:"Rastrear",   atr:"percepcao"},
    ],
    aptidoes:["Ataque em Movimento","Especialista","Reflexos","Intuição","Velocista","Perito","Perícia Inata","Lutador","Ponto Cego","Arremessar","Ataque Atordoante","Ataque Poderoso","Derrubar Agressivo","Sensor (via olfato; requer Per 1; duração contínua)"],
    tecnicas:[
      {id:"kawarimi",nome:"Kawarimi no Jutsu",desc:"A cobra substitui seu corpo por um objeto próximo para evitar ataques. Funciona como o Kawarimi padrão do sistema."},
      {id:"kinobori",nome:"Kinobori",desc:"Permite caminhada em superfícies verticais e tetos usando controle de chakra nos membros/corpo."},
      {id:"imergir", nome:"Imergir (Doton)",desc:"A cobra pode submergir no solo como se fosse água, movendo-se por ele com deslocamento normal."},
      {id:"amedrontar",nome:"Amedrontar Nv 2 (Magen)",desc:"*Dificuldade:* 6 + Inteligência da invocação\n*Restrição:* somente contra criaturas menores\n\nA cobra usa uma técnica de genjutsu para aterrorizar oponentes menores. Alvos que falhem no teste ficam com a condição *amedrontado* conforme as regras de Amedrontar do sistema."},
    ],
    ataques:[
      {nome:"Mordida",tipo:"perfuração",desc:"Dano base = Força −3 (mín. 3)."},
      {nome:"Batida com Cauda",tipo:"esmagamento",desc:"Dano base = Força −3 (mín. 3). Pode derrubar."},
    ],
    poderes:[],
    obs:"",
  },
  lesmas:{
    nome:"Lesmas", img:imgLesma,
    atributosPrincipais:["inteligencia","espirito","vigor"],
    pericias:[
      {id:"ciencias_naturais",nome:"Ciências Naturais",atr:"inteligencia"},
      {id:"concentracao",     nome:"Concentração",     atr:"inteligencia"},
      {id:"escapar",          nome:"Escapar",          atr:"destreza"},
      {id:"furtividade",      nome:"Furtividade",      atr:"agilidade"},
      {id:"medicina",         nome:"Medicina",         atr:"inteligencia"},
      {id:"prontidao",        nome:"Prontidão",        atr:"percepcao"},
    ],
    aptidoes:["Acuidade","Ataque em Movimento","Intuição","Reflexos","Ninja Médico","Perito","Perícia Inata","Lutar às Cegas","Maestria","Resistência Maior (Vigor)","Duro de Matar"],
    tecnicas:[
      {id:"tadayou",nome:"Tadayou",desc:"Técnica de caminhada sobre a água. A invocação pode se mover sobre superfícies aquáticas normalmente."},
      {id:"kinobori",nome:"Kinobori",desc:"Permite caminhada em superfícies verticais e tetos usando controle de chakra."},
      {id:"daibunretsu",nome:"Katsuyu Daibunretsu",desc:"*Pré-requisito:* Kuchiyose 6 (Lesma)\n*Ação:* Movimento\n*Custo de Chakra:* 6\n\nPor serem invertebradas, lesmas de tamanho Grande ou maior podem dividir todo o corpo em mini-lesmas e reuni-lo com ação livre.\n\n*Divisão:* Cada mini-lesma é uma invocação do mesmo NC, no tamanho Miúdo. A divisão permite escapar de amarras sem testes.\n*Quantidade:* máximo de mini-lesmas = NC da criatura (+10 se Enorme, +20 se Imenso).\n*Energias:* A Vitalidade é dividida igualmente; mínimo 1 Vit por mini-lesma. A criatura só morre se todas as mini-lesmas forem abatidas. Chakra é compartilhado.\n*Reunião:* Sem custo. Ação parcial + movimento de cada lesma para se juntarem. Vitalidades restantes são somadas.\n*Ações:* Cada mini-lesma possui suas próprias ações, mas sem ação padrão (não podem usar Iryou Ninjutsu). Podem ser usadas como canalização de chakra para cura à distância (ver Byakugou no In).\n*Defesa:* Pode ser usada como Kawarimi no Jutsu. Este Kawarimi não conta no limite do invocador."},
      {id:"byakugou",nome:"Byakugou no In",desc:"*Pré-requisito:* Kuchiyose 6 (Lesma), Iryou Ninjutsu 8, Fuuinjutsu 5\n*Ação:* Padrão (liberação)\n*Custo de Chakra:* 15 permanente\n\nSelo que armazena chakra na testa. Para criar, é necessário anos de prática (mínimo 3 anos para ninjas promissores). Quando liberado, marcas se espalham e o chakra retorna, conferindo imensa regeneração.\n\n*Uso:* Reduz 15 pontos da reserva de Chakra permanentemente. Quando liberado, duplica o total de Chakra (ex: 60 → 45 permanente → 90 ao liberar). O chakra extra só pode ser usado em Iryou Ninjutsu ou nos efeitos desta técnica.\n\nOs efeitos terminam quando o chakra extra zera. Após usar, 1 dia inteiro de descanso e concentração para refazer as reservas.\n\n*1) Sozou Saisei:* Cura instantânea até o máximo da Vitalidade — 1 chakra extra por 3 Vit curada.\n*2) Byakugou no Jutsu:* Regeneração de 2 Vit por 1 chakra extra, instantânea após cada ferimento.\n\n*Cura à Distância:* Sem liberar o selo, usa mini-lesmas do Daibunretsu como canalizadoras para Iryou Ninjutsu à distância. Alcance suficiente para curar aliados por toda a vila. Requer concentração total (invocador fica indefeso). O custo pode vir do chakra da lesma ou do invocador."},
      {id:"acido",nome:"Ácido",desc:"*Efeito:* Sopro Destrutivo Nv 4\n*Dano base:* igual ao Espírito da invocação\n*Restrição:* somente para tamanho Médio ou maior\n\nA lesma cospe ácido em cone. Segue as regras do efeito Sopro Destrutivo do sistema."},
    ],
    ataques:[{nome:"Batida de Corpo",tipo:"esmagamento",desc:"Dano base = Força −3 (mín. 3)."}],
    poderes:["Iryou Ninjutsu"],
    obs:"Iryou Ninjutsu: para curar, lesma e invocador usam o poder ao mesmo tempo no mesmo alvo; cada um gasta ações e chakra individualmente. Os efeitos de cura são somados. A lesma não pode usar as técnicas específicas do Iryou, somente a cura geral.\n\nInvocação Unitária: somente uma lesma por cena.",
  },
  macacos:{
    nome:"Macacos Ninjas", img:imgMacaco,
    atributosPrincipais:["forca","agilidade","vigor"],
    pericias:[
      {id:"acrobacia",nome:"Acrobacia",atr:"agilidade"},
      {id:"atletismo",nome:"Atletismo",atr:"forca"},
      {id:"disfarces",nome:"Disfarces",atr:"percepcao"},
      {id:"prontidao",nome:"Prontidão",atr:"percepcao"},
    ],
    aptidoes:["Ataque em Movimento","Especialista","Reflexos","Velocista","Perito","Perícia Inata","Lutador","Lutar às Cegas","Ponto Cego","Arremessar","Ataque Atordoante","Ataque Múltiplo","Ataque Poderoso","Derrubar Agressivo","De Pé","Desarme Agressivo","Soco Agarrado","Chute Inverso","Voadora"],
    tecnicas:[
      {id:"henge",nome:"Henge no Jutsu",desc:"Técnica de transformação básica. Permite ao macaco se transformar em qualquer forma."},
      {id:"kongonyoi",nome:"Henge: Kongōnyoi (Bastão Adamantino)",desc:"*Pré-requisito:* Kuchiyose 6 (Macacos), NC mínimo 12, tamanho Médio\n*Ação:* Padrão\n*Duração:* Sustentada\n*Custo de Chakra:* 10 (pago pelo macaco)\n\nO macaco se transforma em um bastão pesado duro como diamante. Requer aptidão *Usar Arma* para manejar sem penalidades. Não pode aplicar Energizar. Pode bloquear técnicas de projétil (macaco pode sofrer dano). Transformado, possui *35 de dureza de corpo*.\n\n*Bastão Adamantino:* Dano +5, Crítico 15-16, Tipo: Esmagamento, 1 item/2 compartimentos.\n\n*Alongar Bastão:* Ação de movimento + 1 chakra → ataque corporal a até 5m usando CC. Voltar: ação livre.\n\n*Afinar Bastão:* Ação de movimento + 2 chakra → pode aplicar Acuidade e substituir FOR por DES no dano, mas Dano de Arma reduz para +2. Voltar: ação livre.\n\n*Enjaular:* Cria jaula usando regras de Barreira Nv 6 (Ninpou), dureza = NC da invocação +4. Custa 6 chakra da invocação; testes com precisão do invocador; ações pagas pelo invocador.\n\n*Ataque Oculto:* Ação de movimento → braço aparece brevemente para atacar. Pode ser usado sempre que inimigo for bem-sucedido em Bloqueio, Esquiva ou Antecipar contra o usuário."},
    ],
    ataques:[
      {nome:"Socos",tipo:"esmagamento",desc:"Dano base = Força −3 (mín. 3). Com Bastão Adamantino: Força −3 +5."},
      {nome:"Chutes",tipo:"esmagamento",desc:"Dano base = Força −3 (mín. 3)."},
    ],
    poderes:[],
    obs:"Tamanho máximo: Grande.",
  },
  sapos:{
    nome:"Sapos Ninjas", img:imgSapo,
    atributosPrincipais:["agilidade","espirito","forca"],
    pericias:[
      {id:"acrobacia",nome:"Acrobacia",atr:"agilidade"},
      {id:"atletismo",nome:"Atletismo",atr:"forca"},
      {id:"escapar",  nome:"Escapar",  atr:"destreza"},
      {id:"prontidao",nome:"Prontidão",atr:"percepcao"},
    ],
    aptidoes:["Ataque em Movimento","Especialista","Guerreiro","Intuição","Reflexos","Velocista","Maestria","Perito","Perícia Inata","Usar Arma"],
    tecnicas:[
      {id:"tadayou",nome:"Tadayou",desc:"Técnica de caminhada sobre a água. A invocação pode se mover sobre superfícies aquáticas normalmente."},
      {id:"oleo",nome:"Óleo do Sapo",desc:"*Pré-requisito:* possuir o poder Suiton.\n\nSe o sapo possuir o poder Suiton, recebe o efeito *Inflamável Nv 5* gratuitamente. Somente para tamanho Médio ou maior.\n\nO sapo cospe um óleo viscoso altamente inflamável. Em contato com fogo (ex: Katon), causa explosão e propagação das chamas seguindo as regras do efeito Inflamável."},
    ],
    ataques:[
      {nome:"Clava",tipo:"esmagamento",desc:"Dano base = Força −3 +1 (arma marcial, mín. 3)."},
      {nome:"Lança",tipo:"perfuração",desc:"Dano base = Força −3 +1 (arma marcial, mín. 3)."},
      {nome:"Espada",tipo:"corte",desc:"Dano base = Força −3 +1 (arma marcial, mín. 3)."},
    ],
    poderes:["Fuuton","Suiton","Katon"],
    obs:"Pode ter apenas UM dos poderes elementais listados. Efeitos permitidos: Canhão, Orbe, Flechas, Coluna, Sopro Destrutivo, Raio, Míssil e Ricochete.",
  },
  aguias:{
    nome:"Águias", img:imgAguia,
    atributosPrincipais:["agilidade","percepcao"],
    pericias:[
      {id:"acrobacia",nome:"Acrobacia",atr:"agilidade"},
      {id:"atletismo",nome:"Atletismo",atr:"forca"},
      {id:"voo",      nome:"Voo",      atr:"agilidade"},
      {id:"prontidao",nome:"Prontidão",atr:"percepcao"},
      {id:"rastrear", nome:"Rastrear", atr:"percepcao"},
    ],
    aptidoes:["Ataque em Movimento","Especialista","Reflexos","Intuição","Velocista","Perito","Perícia Inata","Ponto Cego","Ataque Atordoante","Ataque Poderoso","Derrubar Agressivo (não requer Lutador; sem penalidade de precisão)"],
    tecnicas:[
      {id:"asas",nome:"Bater de Asas",desc:"*Ação:* Padrão\n*Área:* Diâmetro = 2m por nível de Força\n*Dano:* Nenhum (ou dano base = Força para dissipar gases)\n\nCria uma forte ventania em área. Não causa dano direto, mas pode dissipar gases. Criaturas na área devem usar *Kinobori como reação* para não ficarem caídas, ou fazer um teste resistido de *Acrobacia ou Força* contra a Força da águia."},
    ],
    ataques:[
      {nome:"Garras",tipo:"corte",desc:"Dano base = Força −3 (mín. 3)."},
      {nome:"Bico",tipo:"perfuração",desc:"Dano base = Força −3 (mín. 3)."},
    ],
    poderes:[],
    obs:"Não falam a língua humana.",
  },
  baku:{
    nome:"Baku", img:imgElefante,
    atributosPrincipais:["forca","inteligencia","espirito"],
    pericias:[
      {id:"atletismo",   nome:"Atletismo",   atr:"forca"},
      {id:"concentracao",nome:"Concentração",atr:"inteligencia"},
      {id:"prontidao",   nome:"Prontidão",   atr:"percepcao"},
      {id:"rastrear",    nome:"Rastrear",    atr:"percepcao"},
    ],
    aptidoes:["Arremessar","Ataque em Movimento","Ataque Poderoso","Derrubar Agressivo","Especialista","Intuição","Lutador","Perícia Inata","Perito","Reflexos","Técnica Elevada"],
    tecnicas:[
      {id:"kyuuin",nome:"Akumu no Kyuuin (Técnica da Sucção de Pesadelo)",desc:"*Pré-requisito:* Kuchiyose 6 (Baku)\n*Ação:* Padrão\n*Alcance:* 0m +15m por categoria de tamanho acima do Normal\n*Duração:* Concentração\n*Área de Efeito:* Cone\n*Custo de Chakra:* ½ do NC da invocação por turno\n\nAo abrir a boca, o Baku cria uma sucção em área, atrapalhando o equilíbrio de todos os atingidos (exceto o invocador) e potencializando técnicas Fuuton e Katon.\n\nNenhum teste pela invocação. Todos na área devem testar *Escapar (Dif 9 + ½NC + ½ESP da invocação)* ou *Força (Dif 7 + ½NC + ½ESP da invocação)*. Se falharem: caídos e lentos, precisam de ação parcial por turno para refazer o teste. Se passarem: nada acontece. Caso não saiam da área, devem testar novamente.\n\nTécnicas Fuuton e Katon direcionadas ao sentido da sucção têm *mínimo de grau 2 de dano*.\n\nAkumu no Kyuuin reduz por turno a dureza imaginária de certas técnicas (como Névoa e Nuvem) em *½NC + ½ESP* da invocação."},
      {id:"amedrontar",nome:"Amedrontar Nv 2 (Magen)",desc:"*Dificuldade:* 6 + ½ NC da invocação + ½ Inteligência da invocação\n\nO Baku usa uma técnica de genjutsu para aterrorizar inimigos. Segue as regras de Amedrontar Nv 2 do sistema."},
      {id:"kinobori2",nome:"Kinobori",desc:"Permite caminhada em superfícies verticais e tetos usando controle de chakra."},
    ],
    ataques:[
      {nome:"Atropelar",tipo:"esmagamento",desc:"Dano base = Força −3 (mín. 3). Pode derrubar múltiplos alvos em linha."},
      {nome:"Garras",tipo:"perfuração",desc:"Dano base = Força −3 (mín. 3)."},
    ],
    poderes:[],
    obs:"Não falam a língua humana.\nInvocação Unitária: somente um Baku por cena.",
  },
};

const TAMANHOS = ["Miúdo","Pequeno","Médio","Grande","Enorme","Imenso"];

const ATR_LISTA = [
  {id:"forca",        sigla:"FOR", nome:"Força"        },
  {id:"destreza",     sigla:"DES", nome:"Destreza"     },
  {id:"agilidade",    sigla:"AGI", nome:"Agilidade"    },
  {id:"percepcao",    sigla:"PER", nome:"Percepção"    },
  {id:"inteligencia", sigla:"INT", nome:"Inteligência" },
  {id:"vigor",        sigla:"VIG", nome:"Vigor"        },
  {id:"espirito",     sigla:"ESP", nome:"Espírito"     },
];

const HC_LISTA = [
  {key:"CC",  sigla:"CC",  nome:"Combate Corporal",    atrKey:"forca"    },
  {key:"CD",  sigla:"CD",  nome:"Combate à Distância", atrKey:"destreza" },
  {key:"ESQ", sigla:"ESQ", nome:"Esquiva",             atrKey:"agilidade"},
  {key:"LM",  sigla:"LM",  nome:"Ler Movimento",       atrKey:"percepcao"},
];

// ── Sub-componentes ───────────────────────────────────────────────────────────
const CampoEditavel = ({ valor, onSalvar, placeholder }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(valor);
  const ref = useRef(null);
  useEffect(()=>{ setTmp(valor); },[valor]);
  useEffect(()=>{ if(editando) ref.current?.focus(); },[editando]);
  const salvar=()=>{ onSalvar(tmp); setEditando(false); };
  if(editando) return <input ref={ref} className="fn-campo-input" value={tmp} onChange={e=>setTmp(e.target.value)} onBlur={salvar} onKeyDown={e=>{ if(e.key==="Enter") salvar(); if(e.key==="Escape") setEditando(false); }} placeholder={placeholder}/>;
  return <span className="fn-campo-valor fn-campo-editavel" onClick={()=>setEditando(true)}>{valor||<span className="fn-campo-vazio">{placeholder||"—"}</span>}<i className="fas fa-pen fn-campo-edit-icon"/></span>;
};

const CampoNumerico = ({ valor, onChange, min=0, className="" }) => {
  const [editando, setEditando] = useState(false);
  const [tmp, setTmp] = useState(String(valor));
  const ref = useRef(null);
  useEffect(()=>{ if(!editando) setTmp(String(valor)); },[valor,editando]);
  useEffect(()=>{ if(editando&&ref.current){ ref.current.focus(); ref.current.select(); } },[editando]);
  const salvar=()=>{ const n=parseInt(tmp,10); onChange(isNaN(n)?min:Math.max(min,n)); setEditando(false); };
  if(editando) return <input ref={ref} className={`fn-num-input ${className}`} type="number" value={tmp} onChange={e=>setTmp(e.target.value)} onBlur={salvar} onKeyDown={e=>{ if(e.key==="Enter") salvar(); if(e.key==="Escape") setEditando(false); }}/>;
  return <span className={`fn-num-val ${className}`} onClick={()=>setEditando(true)}>{valor}</span>;
};

const BarraEnergia = ({ label, cor, valor, max, onChange, onChangeMax }) => {
  const [eA,setEA]=useState(false); const [eM,setEM]=useState(false);
  const [iA,setIA]=useState(String(valor)); const [iM,setIM]=useState(String(max));
  const rA=useRef(null); const rM=useRef(null);
  useEffect(()=>{ if(eA&&rA.current) rA.current.select(); },[eA]);
  useEffect(()=>{ if(eM&&rM.current) rM.current.select(); },[eM]);
  const cA=()=>{ const n=parseInt(iA,10); if(!isNaN(n)) onChange(n); setEA(false); };
  const cM=()=>{ const n=parseInt(iM,10); if(!isNaN(n)) onChangeMax(n); setEM(false); };
  const pct=max>0?Math.min(100,Math.round((valor/max)*100)):0;
  const sl={display:"inline-block",width:"42px",textAlign:"center",cursor:"text"};
  const inp={width:"42px",background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:"1rem",fontWeight:"700",textAlign:"center",fontFamily:"Outfit,sans-serif",letterSpacing:"2px"};
  return (
    <div className="fn-energia-bloco">
      <div className="fn-energia-titulo">{label}</div>
      <div className="fn-energia-barra-wrapper">
        <div className="fn-energia-barra-fill" style={{width:`${pct}%`,background:cor}}/>
        <button className="fn-energia-btn" onClick={()=>onChange(valor-5)}>«</button>
        <button className="fn-energia-btn" onClick={()=>onChange(valor-1)}>‹</button>
        <div className="fn-energia-barra-bg">
          <div className="fn-energia-texto">
            <span style={sl}>{eA?<input ref={rA} style={inp} type="number" value={iA} onChange={e=>setIA(e.target.value)} onBlur={cA} onKeyDown={e=>{if(e.key==="Enter")cA();if(e.key==="Escape")setEA(false);}}/>:<span onClick={()=>{setIA(String(valor));setEA(true);}}>{valor}</span>}</span>
            <span style={{opacity:0.5}}>/</span>
            <span style={sl}>{eM?<input ref={rM} style={inp} type="number" value={iM} onChange={e=>setIM(e.target.value)} onBlur={cM} onKeyDown={e=>{if(e.key==="Enter")cM();if(e.key==="Escape")setEM(false);}}/>:<span onClick={()=>{setIM(String(max));setEM(true);}}>{max}</span>}</span>
          </div>
        </div>
        <button className="fn-energia-btn" onClick={()=>onChange(valor+1)}>›</button>
        <button className="fn-energia-btn" onClick={()=>onChange(valor+5)}>»</button>
      </div>
    </div>
  );
};

// RenderDesc — igual à ficha principal
const RenderDesc = ({ text }) => {
  if(!text) return null;
  const paragraphs=text.split(/\n\n+/);
  return (
    <div style={{fontFamily:"Outfit,sans-serif",fontSize:"0.82rem",color:"#aaa",lineHeight:1.65}}>
      {paragraphs.map((para,pi)=>{
        const lines=para.split("\n");
        return <p key={pi} style={{margin:pi===0?0:"8px 0 0"}}>
          {lines.map((line,li)=>{
            const parts=line.split(/\*([^*]+)\*/g);
            return <span key={li}>{parts.map((p,j)=>j%2===1?<strong key={j} style={{color:"#4a90e2",fontWeight:700}}>{p}</strong>:p)}{li<lines.length-1&&<br/>}</span>;
          })}
        </p>;
      })}
    </div>
  );
};

// RenderTecDesc — renderiza descrição de técnica com meta-tags visuais
// Linhas que começam com "Ação:", "Alcance:", "Duração:", "Área:", "Custo:", "Pré-requisito:" viram badges
const META_KEYS = ["Ação","Alcance","Duração","Área de Efeito","Área","Custo","Pré-requisito","Pré-requisitos"];
const RenderTecDesc = ({ text }) => {
  if(!text) return null;
  const lines = text.split("\n");
  const metaLinhas = [];
  const textoLinhas = [];
  let passouMeta = false;

  lines.forEach(line => {
    const trimmed = line.trim();
    const isMeta = META_KEYS.some(k => trimmed.startsWith(`${k}:`)||trimmed.startsWith(`*${k}*:`)||trimmed.startsWith(`*${k}:`));
    if(isMeta && !passouMeta) {
      metaLinhas.push(trimmed);
    } else {
      passouMeta = true;
      textoLinhas.push(line);
    }
  });

  // Parse meta: "Ação: Padrão" → { key: "Ação", val: "Padrão" }
  const metas = metaLinhas.map(l => {
    const idx = l.indexOf(":");
    if(idx === -1) return null;
    const key = l.slice(0,idx).replace(/\*/g,"").trim();
    const val = l.slice(idx+1).trim();
    return { key, val };
  }).filter(Boolean);

  const textoFinal = textoLinhas.join("\n").trim();

  return (
    <div>
      {metas.length>0&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
          {metas.map((m,i)=>(
            <div key={i} style={{display:"flex",alignItems:"baseline",gap:4,background:"#060d16",border:"1px solid #0f2040",borderRadius:4,padding:"3px 8px"}}>
              <span style={{fontSize:"0.58rem",fontWeight:800,color:"#3a6090",letterSpacing:"1px",textTransform:"uppercase",flexShrink:0}}>{m.key}</span>
              <span style={{fontSize:"0.78rem",color:"#90b8e0",fontFamily:"Outfit,sans-serif"}}>{m.val}</span>
            </div>
          ))}
        </div>
      )}
      {textoFinal&&<RenderDesc text={textoFinal}/>}
    </div>
  );
};

const ResultadoRolagem = ({ resultado, onFechar }) => {
  const [animando,setAnimando]=useState(false);
  const prev=useRef(null);
  useEffect(()=>{ if(resultado&&resultado!==prev.current){ prev.current=resultado; setAnimando(true); const t=setTimeout(()=>setAnimando(false),500); return ()=>clearTimeout(t); } },[resultado]);
  if(!resultado) return null;
  const {label,d1,d2,precisao,bonus,total,critico,falhaCritica}=resultado;
  const soma=d1+(d2??0);
  const cls=critico?"fn-critico-max":falhaCritica?"fn-critico-min":"";
  const cor=cls==="fn-critico-max"?"#22c55e":cls==="fn-critico-min"?"#ef4444":"#4a90e2";
  return (
    <div className="fn-rolagem-overlay" onClick={onFechar}>
      <div className={`fn-rolagem-painel ${animando?"fn-rolagem-animando":""}`} onClick={e=>e.stopPropagation()}>
        <button className="fn-rolagem-fechar" onClick={onFechar}>×</button>
        <div className={`fn-rolagem-icone ${cls}`}><i className="fas fa-dice-d20 fn-rolagem-dado-svg" style={{color:cor}}/></div>
        <div className="fn-rolagem-nome">{label}</div>
        <div className="fn-rolagem-nova-formula">
          <div className={`fn-rolagem-dado-destaque ${cls}`}>[{soma}]</div>
          {(precisao!==0||bonus!==0)&&<div className="fn-rolagem-formula-resto">{precisao!==0?`${precisao>=0?"+":""}${precisao}`:""}{bonus!==0?`${bonus>=0?"+":""}${bonus}`:""}</div>}
        </div>
        <div className={`fn-rolagem-total ${cls}`} style={{color:cor}}>{total}</div>
        {critico&&<div className="fn-rolagem-crit fn-critico-max">CRÍTICO!</div>}
        {falhaCritica&&<div className="fn-rolagem-crit fn-critico-min">FALHA CRÍTICA!</div>}
      </div>
    </div>
  );
};

const PainelHistorico = ({ historico, aberto, onFechar }) => {
  if(!aberto) return null;
  return (
    <div className="fn-historico-overlay" onClick={onFechar}>
      <div className="fn-historico-painel" onClick={e=>e.stopPropagation()}>
        <div className="fn-historico-header"><span><i className="fa-solid fa-book"/></span><button className="fn-historico-fechar" onClick={onFechar}><i className="fas fa-times"/></button></div>
        <div className="fn-historico-lista">
          {historico.length===0?<p style={{color:"#2a4060",fontSize:"0.85rem",textAlign:"center",padding:16}}>Nenhuma rolagem ainda.</p>
            :[...historico].reverse().map((h,i)=>(
              <div key={i} className="fn-historico-item">
                <span className="fn-hist-label">{h.label}</span>
                <span className="fn-hist-total" style={{color:h.critico?"#22c55e":h.falhaCritica?"#ef4444":"#4a90e2"}}>{h.total}</span>
                <span className="fn-hist-ts">{h.timestamp}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Painel de pontos — igual ao da ficha principal
const PainelPontos = ({ nc, atr, aptAdq, temPoder }) => {
  const ncNum     = parseInt(nc,10)||4;
  const totalAtr  = getPontosAtributo(ncNum);
  const gastosAtr = Object.values(atr).reduce((s,v)=>s+(v||0),0);

  const totalPts   = getPontosPoder(ncNum);
  const aptExtras  = aptAdq.filter(a=>!a.startsWith("g_")).length;
  const gastosPts  = aptExtras + (temPoder ? 1 : 0);

  const linhas = [
    { label:"ATRIBUTOS", total:totalAtr,  gastos:gastosAtr, cor:"#4a90e2" },
    { label:"PODERES",   total:totalPts,  gastos:gastosPts, cor:"#b060e0" },
  ];

  return (
    <div className="fn-painel-pontos">
      <div className="fn-painel-pontos-titulo">
        <span>PONTOS</span>
        <span className="fn-painel-pontos-nc">NC {ncNum} · 3 apt. gratuitas · apt. extra = 1pt · poder = 1pt</span>
      </div>
      {linhas.map(({ label, total, gastos, cor }) => {
        const restante = total - gastos;
        const pct = total > 0 ? Math.min(100, Math.round((gastos/total)*100)) : 0;
        const corBar = restante < 0 ? "#ef4444" : restante === 0 ? "#22c55e" : cor;
        return (
          <div key={label} className="fn-ponto-linha">
            <div className="fn-ponto-linha-top">
              <span className="fn-ponto-label" style={{color:cor}}>{label}</span>
              <div className="fn-ponto-counters">
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">TOTAL</span>
                  <span className="fn-ponto-counter-val">{total}</span>
                </div>
                <div className="fn-ponto-sep">|</div>
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">GASTOS</span>
                  <span className="fn-ponto-counter-val" style={{color:"#aaa"}}>{gastos}</span>
                </div>
                <div className="fn-ponto-sep">|</div>
                <div className="fn-ponto-counter-group">
                  <span className="fn-ponto-counter-sub">RESTANTE</span>
                  <span className="fn-ponto-counter-val" style={{color:restante<0?"#ef4444":restante>0?"#22c55e":"#555",fontWeight:800}}>
                    {restante>0?`+${restante}`:restante}
                  </span>
                </div>
              </div>
            </div>
            <div className="fn-ponto-barra-bg">
              <div className="fn-ponto-barra-fill" style={{width:`${pct}%`,background:corBar}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Tabela de perícias — igual à AbaPericiasNova (somente atributo da espécie, sem pontos distribuídos)
const TabelaPericias = ({ periciasConfig, atr, handleRolar }) => (
  <div className="fn-pericias-wrapper">
    <div className="fn-pericias-box">
      <table className="fn-pericias-tabela">
        <thead>
          <tr>
            <th className="fnt-col-rolar"></th>
            <th className="fnt-col-nome">PERÍCIA</th>
            <th className="fnt-col-atr">ATR</th>
            <th className="fnt-col-total" style={{width:60}}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {periciasConfig.map(p=>{
            const val = atr[p.atr]||0;
            const sigla = ATR_LISTA.find(a=>a.id===p.atr)?.sigla||"—";
            return (
              <tr key={p.id}>
                <td className="fnt-pericia-rolar">
                  <button className="fn-btn-rolar" onClick={()=>handleRolar(p.nome,val,0)}>
                    <i className="fas fa-dice-d20"/>
                  </button>
                </td>
                <td className="fnt-pericia-nome">{p.nome}</td>
                <td className="fnt-pericia-atr-cell">
                  <span className="fn-atr-badge">{sigla}</span>
                </td>
                <td className="fnt-pericia-total-cell">
                  <span className="fn-pericia-total-num">{val}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

// Aba técnicas — expansível igual à aba de poderes
const AbaTecnicas = ({ invBase, aptAdq, setAptAdq, salvarAgora, aba, temPoder, setTemPoder }) => {
  const [expandidos, setExpandidos] = useState({});
  const [filtro, setFiltro] = useState("");
  const toggle = id => setExpandidos(p=>({...p,[id]:!p[id]}));

  if (aba==="técnicas") return (
    <div className="fn-aba-content fn-aba-conteudo-inner">
      <div className="fn-aba-lista">
        {invBase.tecnicas.map(t=>(
          <div key={t.id} className="fn-loja-item">
            <div className="fn-fn-loja-item-header" style={{cursor:"pointer"}} onClick={()=>toggle(t.id)}>
              <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${expandidos[t.id]?"up":"down"}`}/></button>
              <div className="fn-fn-loja-item-info">
                <div className="fn-fn-loja-item-nome-row">
                  <span className="fn-fn-loja-item-nome" style={{color:"#4a90e2"}}>{t.nome}</span>
                </div>
              </div>
            </div>
            {expandidos[t.id]&&(
              <div className="fn-fn-loja-item-corpo">
                <RenderTecDesc text={t.desc}/>
              </div>
            )}
          </div>
        ))}
        {invBase.ataques.length>0&&(
          <>
            <div style={{marginTop:8,marginBottom:4,fontSize:"0.62rem",color:"#3a5a7a",letterSpacing:"2px",fontWeight:800,textTransform:"uppercase",padding:"0 4px"}}>ATAQUES</div>
            {invBase.ataques.map((a,i)=>(
              <div key={i} className="fn-loja-item">
                <div className="fn-fn-loja-item-header" style={{cursor:"pointer"}} onClick={()=>toggle(`atk_${i}`)}>
                  <button className="fn-fn-loja-item-chevron"><i className={`fas fa-chevron-${expandidos[`atk_${i}`]?"up":"down"}`}/></button>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{color:"#8aaccc"}}>{a.nome}</span>
                      <span style={{fontSize:"0.55rem",color:"#3a6080",border:"1px solid #1a3050",borderRadius:3,padding:"1px 5px",textTransform:"uppercase",letterSpacing:1}}>{a.tipo}</span>
                    </div>
                  </div>
                </div>
                {expandidos[`atk_${i}`]&&(
                  <div className="fn-fn-loja-item-corpo">
                    <RenderDesc text={a.desc}/>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
        {invBase.poderes.length>0&&(
          <>
            <div style={{marginTop:8,marginBottom:4,fontSize:"0.62rem",color:"#3a5a7a",letterSpacing:"2px",fontWeight:800,textTransform:"uppercase",padding:"0 4px"}}>
              PODER DA ESPÉCIE <span style={{color:"#4a90e2",fontWeight:400}}>(1 pt de poder)</span>
            </div>
            {invBase.poderes.map((p,i)=>(
              <div key={i} className={`fn-loja-item ${temPoder?"fn-fn-loja-item-max":""}`} style={{cursor:"pointer"}}
                onClick={()=>{ setTemPoder(prev=>!prev); setTimeout(salvarAgora,100); }}>
                <div className="fn-fn-loja-item-header">
                  <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${temPoder?"#4a90e2":"#1a3050"}`,background:temPoder?"#071828":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:"#4a90e2",flexShrink:0}}>
                    {temPoder&&<i className="fas fa-check"/>}
                  </div>
                  <div className="fn-fn-loja-item-info">
                    <div className="fn-fn-loja-item-nome-row">
                      <span className="fn-fn-loja-item-nome" style={{color:temPoder?"#4a90e2":"#8aaccc"}}>{p}</span>
                      {temPoder&&<span className="fn-loja-badge-max">1 PT</span>}
                    </div>
                    <div style={{fontSize:"0.65rem",color:"#3a5a7a",marginTop:2}}>Efeitos: Canhão, Orbe, Flechas, Coluna, Sopro Destrutivo, Raio, Míssil, Ricochete</div>
                  </div>
                </div>
              </div>
            ))}
            {invBase.obs&&<div style={{margin:"6px 4px",padding:"8px 12px",background:"#060d16",border:"1px solid #0f1e33",borderRadius:4}}><RenderDesc text={invBase.obs}/></div>}
          </>
        )}
      </div>
    </div>
  );

  // Aba aptidões — 3 gratuitas (g_key) + extras que custam 1pt cada
  const aptFiltradas = invBase.aptidoes.filter(a=>filtro===""||normStr(a).includes(normStr(filtro)));
  const gratuitasUsadas = aptAdq.filter(a=>a.startsWith("g_")).length;
  const extrasUsadas    = aptAdq.filter(a=>!a.startsWith("g_")).length;

  const toggleApt = (a) => {
    const key  = normStr(a).replace(/\s+/g,"_").slice(0,40);
    const gKey = `g_${key}`;
    const temGratis = aptAdq.includes(gKey);
    const temExtra  = aptAdq.includes(key);
    if (temGratis)            setAptAdq(prev=>prev.filter(x=>x!==gKey));
    else if (temExtra)        setAptAdq(prev=>prev.filter(x=>x!==key));
    else if (gratuitasUsadas<3) setAptAdq(prev=>[...prev,gKey]);
    else                      setAptAdq(prev=>[...prev,key]);
    setTimeout(salvarAgora,100);
  };

  return (
    <div className="fn-aba-content fn-aba-conteudo-inner">
      <div className="fn-aba-filtro-row">
        <input className="fn-fn-aba-filtro-input" placeholder="Filtrar aptidões" value={filtro} onChange={e=>setFiltro(e.target.value)}/>
      </div>
      {/* Legenda */}
      <div style={{display:"flex",gap:12,padding:"4px 6px 6px",fontSize:"0.62rem"}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{width:8,height:8,borderRadius:2,background:"#22c55e",display:"inline-block"}}/>
          <span style={{color:"#22c55e"}}>Gratuita ({gratuitasUsadas}/3)</span>
        </span>
        <span style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{width:8,height:8,borderRadius:2,background:"#4a90e2",display:"inline-block"}}/>
          <span style={{color:"#4a90e2"}}>Comprada ({extrasUsadas} pt)</span>
        </span>
      </div>
      <div className="fn-aba-lista">
        {aptFiltradas.map((a,i)=>{
          const key  = normStr(a).replace(/\s+/g,"_").slice(0,40);
          const gKey = `g_${key}`;
          const isGratis = aptAdq.includes(gKey);
          const isExtra  = aptAdq.includes(key);
          const adq = isGratis||isExtra;
          const corBadge = isGratis?"#22c55e":"#4a90e2";
          return (
            <div key={i} className={`fn-loja-item ${adq?"fn-fn-loja-item-max":""}`} style={{cursor:"pointer"}}
              onClick={()=>toggleApt(a)}>
              <div className="fn-fn-loja-item-header">
                <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${adq?corBadge:"#1a3050"}`,background:adq?`${corBadge}22`:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",color:corBadge,flexShrink:0}}>
                  {adq&&<i className="fas fa-check"/>}
                </div>
                <div className="fn-fn-loja-item-info">
                  <div className="fn-fn-loja-item-nome-row">
                    <span className="fn-fn-loja-item-nome" style={{color:adq?corBadge:"#8aaccc"}}>{a}</span>
                    {isGratis&&<span className="fn-loja-badge-max" style={{color:"#22c55e",borderColor:"#22c55e44",background:"#051a0d"}}>GRATUITA</span>}
                    {isExtra &&<span className="fn-loja-badge-max">1 PT</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {aptFiltradas.length===0&&<p className="fn-loja-vazio">Nenhuma encontrada.</p>}
      </div>
    </div>
  );
};

// ── Componente Principal ──────────────────────────────────────────────────────
const FichaInvocacao = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [ficha, setFicha]           = useState(null);
  const [invBase, setInvBase]       = useState(null);

  const [nomeInv,  setNomeInv]  = useState("");
  const [nc,       setNc]       = useState(4);
  const [tamanho,  setTamanho]  = useState("Médio");
  const [imagem,   setImagem]   = useState(null);
  const [showCrop, setShowCrop] = useState(false);

  // Atributos — distribuídos pelo usuário conforme NC
  const [atr, setAtr] = useState({forca:0,destreza:0,agilidade:0,percepcao:0,inteligencia:0,vigor:0,espirito:0});
  const [hcBase, setHcBase] = useState({CC:3,CD:3,ESQ:3,LM:3});

  // Vitalidade = (10 + 3×VIG + 5×NC) / 2   |   Chakra = 10 + 3×ESP
  const [vitAtual,  setVitAtual]  = useState(5);
  const [vitMax,    setVitMax]    = useState(5);
  const [chakAtual, setChakAtual] = useState(10);
  const [chakMax,   setChakMax]   = useState(10);

  const [aptAdq,   setAptAdq]   = useState([]);
  const [temPoder, setTemPoder] = useState(false); // se comprou o poder da espécie (1pt)
  const [abaAtiva, setAbaAtiva] = useState("técnicas");

  const [resultado,    setResultado]    = useState(null);
  const [historico,    setHistorico]    = useState([]);
  const [painelAberto, setPainelAberto] = useState(false);

  const salvarTimer = useRef(null);
  const fichaRef    = useRef(ficha);
  useEffect(()=>{ fichaRef.current=ficha; },[ficha]);

  // Recalcula barras quando atributos ou NC mudam
  useEffect(()=>{
    const ncNum=parseInt(nc,10)||4;
    const novoVitMax = Math.floor((10 + 3*(atr.vigor||0) + 5*ncNum)/2);
    const novoChakMax= 10 + 3*(atr.espirito||0);
    setVitMax(novoVitMax);
    if(vitAtual>novoVitMax) setVitAtual(novoVitMax);
    setChakMax(novoChakMax);
    if(chakAtual>novoChakMax) setChakAtual(novoChakMax);
  },[atr.vigor, atr.espirito, nc]); // eslint-disable-line

  useEffect(()=>{
    fetch(`${API}/api/naruto/fichas/${id}`,{credentials:"include"})
      .then(r=>r.json())
      .then(data=>{
        if(!data||data.error){ setCarregando(false); return; }
        setFicha(data);
        const base=INV_BASE[data.invocacao_id];
        setInvBase(base||null);
        let inv={};
        try{ inv=JSON.parse(data.invocacao_dados||"{}"); }catch{}
        setNomeInv(inv.nome||(base?.nome||"Invocação"));
        setNc(inv.nc||4);
        setTamanho(inv.tamanho||"Médio");
        setImagem(inv.imagem||null);
        setAtr(inv.atr||{forca:0,destreza:0,agilidade:0,percepcao:0,inteligencia:0,vigor:0,espirito:0});
        setHcBase(inv.hcBase||{CC:3,CD:3,ESQ:3,LM:3});
        setVitAtual(inv.vitAtual??5);
        setVitMax(inv.vitMax??5);
        setChakAtual(inv.chakAtual??10);
        setChakMax(inv.chakMax??10);
        setAptAdq(inv.aptAdq||[]);
        setTemPoder(inv.temPoder||false);
        if(inv.historico) setHistorico(inv.historico);
      })
      .catch(console.error)
      .finally(()=>setCarregando(false));
  },[id]);

  const salvarAgora = useCallback(()=>{
    fetch(`${API}/api/naruto/fichas/${id}`,{
      method:"PATCH",credentials:"include",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        invocacao_dados:JSON.stringify({
          nome:nomeInv, nc, tamanho, imagem,
          atr, hcBase, vitAtual, vitMax, chakAtual, chakMax,
          aptAdq, temPoder, historico,
        })
      }),
    }).catch(console.error);
  },[id,nomeInv,nc,tamanho,imagem,atr,hcBase,vitAtual,vitMax,chakAtual,chakMax,aptAdq,temPoder,historico]);

  useEffect(()=>{
    if(!ficha) return;
    clearTimeout(salvarTimer.current);
    salvarTimer.current=setTimeout(salvarAgora,1500);
    return ()=>clearTimeout(salvarTimer.current);
  },[nomeInv,nc,tamanho,imagem,atr,hcBase,vitAtual,vitMax,chakAtual,chakMax,aptAdq,temPoder]); // eslint-disable-line

  const handleRolar = useCallback((label,precisaoVal=0,bonus=0)=>{
    const {d1,d2}=rolar2d8();
    const total=d1+d2+precisaoVal+bonus;
    const critico=(d1+d2)>=15;
    const falhaCritica=(d1+d2)<=3;
    const entrada={label,d1,d2,precisao:precisaoVal,bonus,total,critico,falhaCritica,timestamp:makeTimestamp()};
    setResultado(entrada);
    setHistorico(h=>[...h.slice(-99),entrada]);
  },[]);

  const hcCalc = {
    CC:  hcBase.CC  + (atr.forca      ||0),
    CD:  hcBase.CD  + (atr.destreza   ||0),
    ESQ: hcBase.ESQ + (atr.agilidade  ||0),
    LM:  hcBase.LM  + (atr.percepcao  ||0),
  };

  if(carregando) return <div className="fn-loading-page"><p className="fn-loading-text">Carregando ficha...</p></div>;
  if(!ficha||!invBase) return (
    <div className="fn-loading-page">
      <p className="fn-loading-text">Invocação não encontrada.</p>
      <button className="fn-voltar-btn" onClick={()=>navigate(`/personagem-naruto/${id}`)}>← VOLTAR</button>
    </div>
  );

  return (
    <div className="fn-page">

      {/* TOPBAR */}
      <div className="fn-topbar" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <button className="fn-voltar-btn" onClick={()=>navigate(`/personagem-naruto/${id}`)}>← VOLTAR</button>
        <div style={{fontSize:"0.85rem",fontWeight:700,letterSpacing:"3px",color:"#4a90e2",textTransform:"uppercase",display:"flex",alignItems:"center",gap:10}}>
          FICHA DE INVOCAÇÃO
        </div>
        <button className="fn-voltar-btn" style={{color:painelAberto?"#f0a020":"#4a90e2",borderColor:painelAberto?"#f0a020":"#4a90e2"}}
          onClick={()=>setPainelAberto(p=>!p)}>
          <i className="fa-solid fa-book"/>
        </button>
      </div>

      {/* SHEET */}
      <div className="fn-sheet" style={{gridTemplateColumns:"280px 1fr 380px"}}>

        {/* IDENTIDADE */}
        <div className="fn-identidade" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NOME DA INVOCAÇÃO</span>
            <CampoEditavel valor={nomeInv} onSalvar={setNomeInv} placeholder="Nome"/>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">TIPO</span>
            <span className="fn-id-static">{invBase.nome}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">INVOCADOR</span>
            <span className="fn-id-static">{ficha.nome_personagem}</span>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">NC — NÍVEL DA FICHA</span>
            <select className="fn-nc-select" value={nc} onChange={e=>setNc(parseInt(e.target.value,10)||4)}>
              {Array.from({length:17},(_,i)=>i+4).map(n=>(
                <option key={n} value={n}>NC {n}</option>
              ))}
            </select>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">TAMANHO</span>
            <select className="fn-nc-select" value={tamanho} onChange={e=>setTamanho(e.target.value)}>
              {TAMANHOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="fn-identidade-col">
            <span className="fn-id-label">CLÃ DO INVOCADOR</span>
            <span className="fn-id-static">{ficha.cla_nome}</span>
          </div>
        </div>

        {/* BODY */}
        <div className="fn-body">

          {/* COL ESQUERDA */}
          <div className="fn-col-esquerda">

            {/* Avatar */}
            <div className="fn-avatar-wrapper" onClick={()=>setShowCrop(true)} style={{cursor:"pointer"}} title="Clique para alterar">
              {imagem
                ?<img src={imagem} alt={nomeInv} className="fn-avatar-img"/>
                :<div className="fn-avatar-placeholder">
                  <img src={invBase.img} alt="" style={{width:"65%",height:"65%",objectFit:"contain",filter:"invert(1) brightness(1.5) sepia(1) hue-rotate(190deg) saturate(2)",opacity:0.4}}/>
                </div>}
              <div className="fn-avatar-edit-overlay"><i className="fas fa-camera"/></div>
            </div>

            {/* Barras */}
            <BarraEnergia label="VITALIDADE (÷2)" cor="#e05050"
              valor={vitAtual} max={vitMax}
              onChange={v=>setVitAtual(Math.max(0,v))}
              onChangeMax={v=>{setVitMax(v);if(vitAtual>v)setVitAtual(v);}}/>
            <BarraEnergia label="CHAKRA" cor="#4a90e2"
              valor={chakAtual} max={chakMax}
              onChange={v=>setChakAtual(Math.max(0,v))}
              onChangeMax={v=>{setChakMax(v);if(chakAtual>v)setChakAtual(v);}}/>

            {/* Pontos */}
            <PainelPontos nc={nc} atr={atr} aptAdq={aptAdq} temPoder={temPoder}/>

            {/* ATRIBUTOS — igual à ficha principal */}
            <div className="fn-secao-titulo">ATRIBUTOS</div>
            <div className="fn-atributos-grid">
              {ATR_LISTA.map(a=>{
                const isPrinc=invBase.atributosPrincipais.includes(a.id);
                return (
                  <div key={a.id} className="fn-atr-row">
                    <span className="fn-atr-sigla" style={{color:isPrinc?"#4a90e2":undefined}}>{a.sigla}</span>
                    <span className="fn-atr-nome">{a.nome}</span>
                    <CampoNumerico valor={atr[a.id]??0}
                      onChange={v=>setAtr(prev=>({...prev,[a.id]:Math.max(0,v)}))}
                      className="fn-atr-val"/>
                    <button className="fn-btn-rolar fn-hc-rolar" title={`Rolar ${a.nome}`}
                      onClick={()=>handleRolar(a.nome,atr[a.id]??0,0)}>
                      <i className="fas fa-dice-d20"/>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* HABILIDADES DE COMBATE — igual à ficha principal */}
            <div className="fn-secao-titulo">HABILIDADES DE COMBATE</div>
            <div className="fn-combate-grid">
              {HC_LISTA.map(h=>(
                <div key={h.key} className="fn-hc-row">
                  <span className="fn-hc-sigla">{h.sigla}</span>
                  <span className="fn-hc-nome">{h.nome}</span>
                  <CampoNumerico valor={hcCalc[h.key]}
                    onChange={v=>setHcBase(prev=>({...prev,[h.key]:Math.max(0,v-(atr[h.atrKey]||0))}))}
                    min={0} className="fn-hc-val"/>
                  <button className="fn-btn-rolar fn-hc-rolar" onClick={()=>handleRolar(h.nome,hcCalc[h.key],0)}>
                    <i className="fas fa-dice-d20"/>
                  </button>
                </div>
              ))}
            </div>

          </div>{/* fim col-esquerda */}

          {/* COL MEIO: perícias ao lado de anotações (layout 2 colunas) */}
          <div className="fn-col-meio">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",height:"100%",gap:0}}>

              {/* Coluna perícias */}
              <div style={{borderRight:"1px solid #0f1e33",display:"flex",flexDirection:"column"}}>
                <div className="fn-meio-col-titulo">PERÍCIAS</div>
                <div style={{fontSize:"0.65rem",color:"#3a5a7a",padding:"2px 12px 6px",lineHeight:1.4}}>
                  Total = nível do atributo vinculado
                </div>
                <TabelaPericias periciasConfig={invBase.pericias} atr={atr} handleRolar={handleRolar}/>
              </div>

              {/* Coluna anotações */}
              <div style={{display:"flex",flexDirection:"column"}}>
                <div className="fn-meio-col-titulo">ANOTAÇÕES</div>
                <div style={{flex:1,padding:"8px"}}>
                  <textarea
                    style={{width:"100%",height:"100%",minHeight:200,background:"#050b14",border:"1px solid #0f1e33",borderRadius:4,color:"#90aac8",fontSize:"0.82rem",fontFamily:"Outfit,sans-serif",padding:10,resize:"none",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}
                    placeholder="Anotações sobre a invocação, contratos, comportamento…"
                    onChange={()=>{ clearTimeout(salvarTimer.current); salvarTimer.current=setTimeout(salvarAgora,1500); }}
                  />
                </div>
                {invBase.obs&&(
                  <div style={{margin:"0 8px 8px",padding:"8px 12px",background:"#060d16",border:"1px solid #1a3050",borderRadius:4}}>
                    <div style={{fontSize:"0.6rem",color:"#4a6080",letterSpacing:"2px",textTransform:"uppercase",marginBottom:4}}>REGRAS ESPECIAIS</div>
                    <RenderDesc text={invBase.obs}/>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>{/* fim fn-body */}

        {/* COL DIREITA */}
        <div className="fn-col-direita">
          <div className="fn-identidade-abas">
            <div className="fn-abas-centro">
              {["técnicas","aptidões"].map(aba=>(
                <button key={aba} className={`fn-aba-btn ${abaAtiva===aba?"fn-aba-ativa":""}`}
                  onClick={()=>setAbaAtiva(aba)}>
                  {aba.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="fn-aba-conteudo">
            <AbaTecnicas invBase={invBase} aptAdq={aptAdq} setAptAdq={setAptAdq} salvarAgora={salvarAgora} aba={abaAtiva} temPoder={temPoder} setTemPoder={setTemPoder}/>
          </div>
        </div>

      </div>{/* fim fn-sheet */}

      {showCrop&&(
        <ImageCropModal
          title="Imagem da Invocação"
          src={imagem||null}
          onConfirm={img=>{ setImagem(img); setShowCrop(false); setTimeout(salvarAgora,100); }}
          onClose={()=>setShowCrop(false)}
        />
      )}

      <ResultadoRolagem resultado={resultado} onFechar={()=>setResultado(null)}/>
      <PainelHistorico historico={historico} aberto={painelAberto} onFechar={()=>setPainelAberto(false)}/>
    </div>
  );
};

export default FichaInvocacao;