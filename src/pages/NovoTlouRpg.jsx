import React from "react";
import "../styles/NovoTlouRpg.css";

const opcoes = [
  {
    id: "novato",
    titulo: "Sobrevivente Novato",
    descricao:
      "Os Sobreviventes Novatos começam no nível mais baixo. Esta é a melhor opção para novos jogadores e primeiras campanhas.",
    pilulas: 100,
    equipamento: "Lanterna",
    armas: "Arma branca improvisada (2x4) & Pistola",
  },
  {
    id: "capaz",
    titulo: "Sobrevivente Capaz",
    descricao:
      "Os Sobreviventes Capazes iniciam em nível intermediário, ideal para começos de campanha mais desafiadores e campanhas únicas.",
    pilulas: 250,
    equipamento: "Máscara de gás & Lanterna",
    armas: "Arma branca contundente, Rifle de caça & Pistola ou Revólver",
  },
  {
    id: "veterano",
    titulo: "Sobrevivente Veterano",
    descricao:
      "Os Sobreviventes Veteranos são o nível mais alto para começar, recomendados para jogadores avançados e campanhas difíceis.",
    pilulas: 400,
    equipamento: "Máscara de gás & Lanterna",
    armas: "Arma branca cortante & Arma longa & Arma curta",
  },
];

const NovoTlouRpg = () => {
  return (
    <div className="novo-tlou-page">
      <h1 className="novo-tlou-titulo">EQUIPAMENTO INICIAL</h1>
      <p className="novo-tlou-subtitulo">
        Converse com o Mestre da mesa para decidir qual desses funciona mais para a campanha atual.
      </p>

      <div className="novo-tlou-grid">
        {opcoes.map((opcao) => (
          <div key={opcao.id} className="novo-tlou-card">
            <h2>{opcao.titulo}</h2>
            <p className="descricao">{opcao.descricao}</p>
            <p className="atributo">Pílulas iniciais: {opcao.pilulas}</p>
            <p>Equipamento inicial: {opcao.equipamento}</p>
            <p>Armas iniciais: {opcao.armas}</p>
            <button className="escolher-btn">ESCOLHER</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NovoTlouRpg;