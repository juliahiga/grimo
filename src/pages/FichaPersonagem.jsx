import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/FichaPersonagem.css";

const periciasConfig = [
    { key: "brutalidade", label: "Brutalidade" },
    { key: "mira", label: "Mira" },
    { key: "agilidade", label: "Agilidade" },
    { key: "instinto", label: "Instinto" },
    { key: "coleta", label: "Sucatear" },
    { key: "sobrevivencia", label: "Sobrevivência" },
    { key: "manutencao", label: "Mecânica" },
    { key: "medicina", label: "Medicina" },
];

const dadosOpcoes = ["D4", "D6", "D8", "D10", "D12"];

const rolarDado = (dadoStr) => {
    const faces = parseInt(dadoStr.replace("D", ""), 10);
    return Math.floor(Math.random() * faces) + 1;
};

const DadoSelector = ({ valor, onChange }) => {
    const [aberto, setAberto] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAberto(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="dado-selector" ref={ref}>
            <div className="ficha-circulo ficha-circulo-dado" onClick={() => setAberto((v) => !v)}>
                {valor}
            </div>
            {aberto && (
                <div className="dado-dropdown">
                    {dadosOpcoes.map((d) => (
                        <div
                            key={d}
                            className={`dado-opcao ${d === valor ? "dado-opcao-ativo" : ""}`}
                            onClick={() => { onChange(d); setAberto(false); }}
                        >
                            {d}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* ── PAINEL RESULTADO ROLAGEM ── */
const ResultadoRolagem = ({ resultado, onFechar }) => {
    const [animando, setAnimando] = useState(false);
    const prevResultado = useRef(null);

    useEffect(() => {
        if (resultado && resultado !== prevResultado.current) {
            prevResultado.current = resultado;
            setAnimando(true);
            const t = setTimeout(() => setAnimando(false), 500);
            return () => clearTimeout(t);
        }
    }, [resultado]);

    if (!resultado) return null;

    const { label, dado, valorDado, bonus, total } = resultado;
    const bonusNum = parseInt(bonus, 10) || 0;

    const faces = parseInt(dado.replace("D", ""), 10);
    const criticoMax = valorDado === faces;
    const criticoMin = valorDado === 1;

    const classeCritico = criticoMax
        ? "critico-max"
        : criticoMin
            ? "critico-min"
            : "";

    return (
        <div className="rolagem-overlay" onClick={onFechar}>
            <div className={`rolagem-painel ${animando ? "rolagem-animando" : ""}`} onClick={(e) => e.stopPropagation()}>
                <button className="rolagem-fechar" onClick={onFechar}>×</button>

                <div className={`rolagem-icone ${classeCritico}`}>
                    <i className="fas fa-dice-d20 rolagem-dado-svg"></i>
                </div>

                <div className="rolagem-nome">{label}</div>

                <div className="rolagem-formula">
                    <div className={`rolagem-dado-bloco ${classeCritico}`}>
                        <span className="rolagem-dado-num">{valorDado}</span>
                        <span className="rolagem-dado-tag">{dado}</span>
                    </div>

                    {bonusNum !== 0 && (
                        <>
                            <span className="rolagem-op">{bonusNum >= 0 ? "+" : "−"}</span>
                            <div className="rolagem-bonus-bloco">
                                <span className="rolagem-bonus-num">{Math.abs(bonusNum)}</span>
                                <span className="rolagem-bonus-tag">BÔNUS</span>
                            </div>
                        </>
                    )}

                    <span className="rolagem-op">=</span>

                    <div className="rolagem-total-bloco">
                        <span className="rolagem-total">{total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── VIDA CONTROL ── */
const VidaControl = ({ valor, max, onChange }) => {
    const [editando, setEditando] = useState(false);
    const [inputVal, setInputVal] = useState(String(valor));
    const inputRef = useRef(null);

    useEffect(() => {
        if (editando && inputRef.current) inputRef.current.select();
    }, [editando]);

    const confirmar = () => {
        const num = parseInt(inputVal, 10);
        if (!isNaN(num)) onChange(num);
        setEditando(false);
    };

    const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0;

    return (
        <div className="vida-control">
            <div className="vida-titulo">VIDA</div>
            <div className="vida-barra-wrapper">
                <div className="vida-barra-fill" style={{ width: `${pct}%` }} />  {/* ← fora do bg */}
                <button className="vida-btn" onClick={() => onChange(valor - 5)}>«</button>
                <button className="vida-btn" onClick={() => onChange(valor - 1)}>‹</button>
                <div className="vida-barra-bg">
                    <span className="vida-barra-texto">{valor} / {max}</span>
                </div>
                <button className="vida-btn" onClick={() => onChange(valor + 1)}>›</button>
                <button className="vida-btn" onClick={() => onChange(valor + 5)}>»</button>
            </div>
        </div>
    );
};

/* ── ARMA SLOT ── */
const ArmaSlot = ({ titulo }) => (
    <div className="ficha-arma-slot">
        <div className="ficha-arma-titulo">{titulo}</div>
        <div className="ficha-arma-row ficha-arma-row-top">
            <div className="ficha-arma-field ficha-arma-nome">
                <span className="ficha-field-label">NOME</span>
                <input className="ficha-input" />
            </div>
            <div className="ficha-arma-field ficha-arma-small">
                <span className="ficha-field-label">DANO</span>
                <input className="ficha-input" />
            </div>
            <div className="ficha-arma-field ficha-arma-small">
                <span className="ficha-field-label">PENTE</span>
                <input className="ficha-input" />
            </div>
            <div className="ficha-arma-field ficha-arma-small">
                <span className="ficha-field-label">CAPACIDADE</span>
                <input className="ficha-input" />
            </div>
        </div>
        <div className="ficha-arma-row">
            <div className="ficha-arma-field ficha-arma-medium">
                <span className="ficha-field-label">CADÊNCIA DE TIRO</span>
                <input className="ficha-input" />
            </div>
            <div className="ficha-arma-field ficha-arma-medium">
                <span className="ficha-field-label">PERFURAÇÃO DA ARMA</span>
                <input className="ficha-input" />
            </div>
        </div>
    </div>
);

/* ── FICHA PERSONAGEM ── */
const FichaPersonagem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [ficha, setFicha] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [abaAtiva, setAbaAtiva] = useState("combate");

    const [vidaAtual, setVidaAtual] = useState(0);
    const [vidaMax, setVidaMax] = useState(0);
    const [sucata, setSucata] = useState("");
    const [pilulas, setPilulas] = useState("");
    const [nivFerramenta, setNivFerramenta] = useState("");
    const [medicinaVal, setMedicinaVal] = useState("");
    const [bonus, setBonus] = useState({});
    const [dados, setDados] = useState({});
    const [mochila, setMochila] = useState(Array(12).fill(""));
    const [resultado, setResultado] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/tlou/fichas/${id}`, { credentials: "include" })
            .then((r) => r.json())
            .then((data) => {
                setFicha(data);
                setVidaAtual(data.vida_atual ?? data.vida_maxima ?? 0);
                setVidaMax(data.vida_maxima ?? 0);
                setPilulas(data.pilulas ?? "");
                const b = {};
                const d = {};
                periciasConfig.forEach((p) => {
                    b[p.key] = data[p.key] ?? 0;
                    d[p.key] = "D10";
                });
                setBonus(b);
                setDados(d);
            })
            .catch(() => setFicha(null))
            .finally(() => setCarregando(false));
    }, [id]);

    const updateMochila = (i, val) => {
        setMochila((prev) => { const n = [...prev]; n[i] = val; return n; });
    };

    const handleRolar = (periciaKey, periciaLabel) => {
        const dado = dados[periciaKey] ?? "D10";
        const bonusVal = parseInt(bonus[periciaKey], 10) || 0;
        const valorDado = rolarDado(dado);
        const total = valorDado + bonusVal;
        setResultado({ label: periciaLabel, dado, valorDado, bonus: bonusVal, total });
    };

    if (carregando) return (
        <div className="ficha-loading-page">
            <p className="ficha-loading-text">Carregando ficha...</p>
        </div>
    );

    if (!ficha || ficha.error) return (
        <div className="ficha-loading-page">
            <p className="ficha-loading-text">Ficha não encontrada.</p>
            <button className="ficha-voltar-btn" onClick={() => navigate("/personagens")}>← Voltar</button>
        </div>
    );

    return (
        <div className="ficha-page">
            <div className="ficha-topbar">
                <button className="ficha-voltar-btn" onClick={() => navigate("/personagens")}>← Voltar</button>
            </div>

            <div className="ficha-sheet">
                <div className="ficha-identidade">
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">NOME DO PERSONAGEM</span>
                        <span className="ficha-identidade-valor">{ficha.nome_personagem}</span>
                    </div>
                    <div className="ficha-identidade-col">
                        <span className="ficha-identidade-label">JOGADOR</span>
                        <span className="ficha-identidade-valor">{ficha.nome_jogador}</span>
                    </div>
                </div>

                <div className="ficha-body">

                    {/* COLUNA ESQUERDA */}
                    <div className="ficha-col-esquerda">
                        <div className="ficha-pericias-bloco">
                            <div className="ficha-avatar-wrapper">
                                {ficha.imagem ? (
                                    <img src={ficha.imagem} alt={ficha.nome_personagem} className="ficha-avatar-img" />
                                ) : (
                                    <div className="ficha-avatar-placeholder">
                                        {ficha.nome_personagem?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>

                            <VidaControl valor={vidaAtual} max={vidaMax} onChange={setVidaAtual} />

                            <table className="ficha-pericias-tabela">
                                <thead>
                                    <tr>
                                        <th>PERÍCIA</th>
                                        <th>BÔNUS</th>
                                        <th>DADO</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {periciasConfig.map((p) => (
                                        <tr key={p.key}>
                                            <td className="ficha-pericia-nome">{p.label}</td>
                                            <td className="ficha-pericia-bonus">
                                                <div className="ficha-circulo">
                                                    <input
                                                        className="ficha-circulo-input"
                                                        type="number"
                                                        min={0}
                                                        max={9}
                                                        value={bonus[p.key] ?? 0}
                                                        onChange={(e) => setBonus((prev) => ({ ...prev, [p.key]: e.target.value }))}
                                                    />
                                                </div>
                                            </td>
                                            <td className="ficha-pericia-dado">
                                                <DadoSelector
                                                    valor={dados[p.key] ?? "D10"}
                                                    onChange={(v) => setDados((prev) => ({ ...prev, [p.key]: v }))}
                                                />
                                            </td>
                                            <td className="ficha-pericia-rolar">
                                                <button
                                                    className="ficha-btn-rolar"
                                                    title={`Rolar ${p.label}`}
                                                    onClick={() => handleRolar(p.key, p.label)}
                                                >
                                                    <i className="fas fa-dice-d20 ficha-btn-rolar-icon"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COLUNA MEIO */}
                    <div className="ficha-col-meio">
                        <div className="ficha-status-row">
                            <div className="ficha-status-campo">
                                <span className="ficha-field-label">SUCATA</span>
                                <input className="ficha-input ficha-status-input" value={sucata} onChange={(e) => setSucata(e.target.value)} />
                            </div>
                            <div className="ficha-status-campo">
                                <span className="ficha-field-label">PÍLULAS</span>
                                <input className="ficha-input ficha-status-input" value={pilulas} onChange={(e) => setPilulas(e.target.value)} />
                            </div>
                            <div className="ficha-status-campo">
                                <span className="ficha-field-label">NÍV. FERRAMENTA</span>
                                <input className="ficha-input ficha-status-input" value={nivFerramenta} onChange={(e) => setNivFerramenta(e.target.value)} />
                            </div>
                            <div className="ficha-status-campo">
                                <span className="ficha-field-label">MEDICINA</span>
                                <input className="ficha-input ficha-status-input" value={medicinaVal} onChange={(e) => setMedicinaVal(e.target.value)} />
                            </div>
                        </div>

                        <ArmaSlot titulo="ARMA LONGA" />
                        <ArmaSlot titulo="ARMA CURTA" />
                        <ArmaSlot titulo="COLDRE ARMA LONGA" />
                        <ArmaSlot titulo="COLDRE ARMA CURTA" />
                        <ArmaSlot titulo="MELEE" />

                        <div className="ficha-consumiveis">
                            <div className="ficha-consumivel-grupo">
                                <div className="ficha-consumivel-item"><span>💣</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>💥</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🧱</span><div className="ficha-consumivel-bar">/3</div></div>
                            </div>
                            <div className="ficha-consumivel-label">ARMAS</div>
                            <div className="ficha-consumivel-grupo">
                                <div className="ficha-consumivel-item"><span>🔗</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🔪</span><div className="ficha-consumivel-bar">/3</div></div>
                                <div className="ficha-consumivel-item"><span>🗡</span><div className="ficha-consumivel-bar">/1</div></div>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DIREITA — PAINEL DE ABAS */}
                    <div className="ficha-col-direita">
                        <div className="ficha-abas-nav">
                            {["combate", "habilidades", "mochila"].map((aba) => (
                                <button
                                    key={aba}
                                    className={`ficha-aba-btn ${abaAtiva === aba ? "ficha-aba-ativa" : ""}`}
                                    onClick={() => setAbaAtiva(aba)}
                                >
                                    {aba.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="ficha-aba-conteudo">
                            {abaAtiva === "combate" && (
                                <div className="ficha-aba-painel">
                                    <p className="ficha-aba-vazio">Ataques e ações de combate serão exibidos aqui.</p>
                                </div>
                            )}
                            {abaAtiva === "habilidades" && (
                                <div className="ficha-aba-painel">
                                    <p className="ficha-aba-vazio">Habilidades especiais serão exibidas aqui.</p>
                                </div>
                            )}
                            {abaAtiva === "mochila" && (
                                <div className="ficha-aba-painel ficha-aba-mochila">
                                    <div className="ficha-mochila-grid">
                                        {mochila.map((val, i) => (
                                            <input
                                                key={i}
                                                className="ficha-mochila-slot"
                                                placeholder={`Item ${i + 1}`}
                                                value={val}
                                                onChange={(e) => updateMochila(i, e.target.value)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* RESULTADO FLUTUANTE */}
            <ResultadoRolagem resultado={resultado} onFechar={() => setResultado(null)} />
        </div>
    );
};

export default FichaPersonagem;