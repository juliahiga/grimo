const express = require("express");
const router = express.Router();
const { pool } = require("../db");

async function getUserId(google_id) {
  const [rows] = await pool.query("SELECT id, name FROM users WHERE google_id = ?", [google_id]);
  return rows[0] || null;
}

function calcularPericias(body) {
  const pericias = {
    sobrevivencia: 0, agilidade: 0, coleta: 0, instinto: 0,
    brutalidade: 0, mira: 0, manutencao: 0, medicina: 0,
  };
  const mapa = {
    "Sobrevivência": "sobrevivencia", "Agilidade": "agilidade", "Coleta": "coleta",
    "Instinto": "instinto", "Brutalidade": "brutalidade", "Mira": "mira",
    "Manutenção": "manutencao", "Medicina": "medicina",
  };
  const bonus = (pericia) => { if (mapa[pericia] !== undefined) pericias[mapa[pericia]] += 1; };
  bonus(body.idade_pericia);
  if (Array.isArray(body.personalidade_pericias)) body.personalidade_pericias.forEach(bonus);
  bonus(body.traco_pericia);
  bonus(body.motivacao_pericia);
  bonus(body.classe_pericia_a);
  bonus(body.classe_pericia_b);
  return pericias;
}

router.get("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [rows] = await pool.query(`
      SELECT f.id, f.nome_personagem, f.nome_jogador, f.vida_atual, f.vida_maxima,
        f.pilulas, f.sobrevivencia, f.agilidade, f.coleta, f.instinto,
        f.brutalidade, f.mira, f.manutencao, f.medicina, f.criado_em, f.imagem,
        n.nome AS nivel, c.nome AS classe, i.nome AS idade_surto,
        t.nome AS traco, m.descricao AS motivacao
      FROM tlou_fichas f
      JOIN tlou_niveis_sobrevivente n ON f.nivel_sobrevivente_id = n.id
      JOIN tlou_classes             c ON f.classe_id = c.id
      JOIN tlou_idades_surto        i ON f.idade_surto_id = i.id
      JOIN tlou_tracos              t ON f.traco_id = t.id
      JOIN tlou_motivacoes          m ON f.motivacao_id = m.id
      WHERE f.user_id = ? ORDER BY f.criado_em DESC
    `, [user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { nome_personagem, nome_jogador, nivel_id, pilulas_iniciais,
    idade_id, personalidade_id, pericia_escolhida, traco_id, motivacao_id, classe_id } = req.body;
  if (!nome_personagem || !nivel_id || !idade_id || !personalidade_id || !traco_id || !motivacao_id || !classe_id)
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM tlou_fichas WHERE user_id = ?", [user.id]);
    if (total >= 12) return res.status(400).json({ error: "Limite de 12 personagens atingido" });
    const pericias = calcularPericias(req.body);
    const [result] = await pool.query(`
      INSERT INTO tlou_fichas (
        user_id, nome_jogador, nome_personagem, nivel_sobrevivente_id, classe_id, idade_surto_id,
        personalidade_id, pericia_escolhida, traco_id, motivacao_id, pilulas,
        sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [user.id, nome_jogador || user.name, nome_personagem, nivel_id, classe_id, idade_id,
      personalidade_id, pericia_escolhida, traco_id, motivacao_id, pilulas_iniciais || 100,
      pericias.sobrevivencia, pericias.agilidade, pericias.coleta, pericias.instinto,
      pericias.brutalidade, pericias.mira, pericias.manutencao, pericias.medicina,
      req.body.imagem || null]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [rows] = await pool.query(`
      SELECT f.*, n.nome AS nivel, n.pilulas_iniciais, n.equipamentos_iniciais, n.armas_iniciais,
        c.nome AS classe, i.nome AS idade_surto, p.nome AS personalidade,
        t.nome AS traco, m.descricao AS motivacao
      FROM tlou_fichas f
      JOIN tlou_niveis_sobrevivente n ON f.nivel_sobrevivente_id = n.id
      JOIN tlou_classes             c ON f.classe_id = c.id
      JOIN tlou_idades_surto        i ON f.idade_surto_id = i.id
      JOIN tlou_personalidades      p ON f.personalidade_id = p.id
      JOIN tlou_tracos              t ON f.traco_id = t.id
      JOIN tlou_motivacoes          m ON f.motivacao_id = m.id
      WHERE f.id = ? AND f.user_id = ?
    `, [req.params.id, user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Ficha não encontrada" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.query("DELETE FROM tlou_fichas WHERE id = ? AND user_id = ?", [req.params.id, user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas/:id/duplicar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [[{ total }]] = await pool.query("SELECT COUNT(*) AS total FROM tlou_fichas WHERE user_id = ?", [user.id]);
    if (total >= 12) return res.status(400).json({ error: "Limite de 12 personagens atingido" });
    const [result] = await pool.query(`
      INSERT INTO tlou_fichas (
        user_id, nome_jogador, nome_personagem, nivel_sobrevivente_id, classe_id, idade_surto_id,
        personalidade_id, pericia_escolhida, traco_id, motivacao_id,
        pilulas, vida_maxima, vida_atual,
        sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
      )
      SELECT user_id, nome_jogador, CONCAT(nome_personagem, ' (cópia)'),
        nivel_sobrevivente_id, classe_id, idade_surto_id,
        personalidade_id, pericia_escolhida, traco_id, motivacao_id,
        pilulas, vida_maxima, vida_atual,
        sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
      FROM tlou_fichas WHERE id = ? AND user_id = ?
    `, [req.params.id, user.id]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CAMPANHAS ────────────────────────────────────────────────────────────────

router.get("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [rows] = await pool.query(`
      SELECT DISTINCT c.id, c.nome, c.descricao, c.nome_mestre, c.criado_em,
        c.image AS imagem,
        CASE WHEN c.user_id_mestre = ? THEN 1 ELSE 0 END AS sou_mestre,
        (SELECT COUNT(*) FROM tlou_campanha_jogadores cj WHERE cj.campanha_id = c.id) AS total_jogadores
      FROM tlou_campanhas c
      LEFT JOIN tlou_campanha_jogadores cj2 ON cj2.campanha_id = c.id AND cj2.user_id = ?
      WHERE c.user_id_mestre = ? OR cj2.user_id = ?
      ORDER BY c.criado_em DESC
    `, [user.id, user.id, user.id, user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { nome, descricao, imagem } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [result] = await pool.query(`
      INSERT INTO tlou_campanhas (user_id_mestre, nome_mestre, nome, descricao, image)
      VALUES (?, ?, ?, ?, ?)
    `, [user.id, user.name, nome, descricao || null, imagem || null]);
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [check] = await pool.query("SELECT id FROM tlou_campanhas WHERE id = ? AND user_id_mestre = ?", [req.params.id, user.id]);
    if (check.length === 0) return res.status(403).json({ error: "Sem permissão para deletar esta campanha" });
    await pool.query("DELETE FROM tlou_campanha_jogadores WHERE campanha_id = ?", [req.params.id]);
    await pool.query("DELETE FROM tlou_campanhas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [campanhaRows] = await pool.query(`
      SELECT c.*, c.image AS imagem
      FROM tlou_campanhas c
      WHERE c.id = ?
    `, [req.params.id]);
    if (campanhaRows.length === 0) return res.status(404).json({ error: "Campanha não encontrada" });
    const [jogadores] = await pool.query(`
      SELECT cj.id, cj.user_id, cj.nome_jogador, cj.nome_personagem, cj.entrou_em,
        f.vida_atual, f.vida_maxima, f.pilulas, cl.nome AS classe
      FROM tlou_campanha_jogadores cj
      JOIN tlou_fichas f ON cj.ficha_id = f.id
      JOIN tlou_classes cl ON f.classe_id = cl.id
      WHERE cj.campanha_id = ? ORDER BY cj.entrou_em ASC
    `, [req.params.id]);
    res.json({ ...campanhaRows[0], sou_mestre: campanhaRows[0].user_id_mestre === user.id, jogadores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas/:id/entrar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { ficha_id } = req.body;
  if (!ficha_id) return res.status(400).json({ error: "ficha_id é obrigatório" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [fichaCheck] = await pool.query("SELECT id, nome_personagem FROM tlou_fichas WHERE id = ? AND user_id = ?", [ficha_id, user.id]);
    if (fichaCheck.length === 0) return res.status(403).json({ error: "Ficha não pertence a você" });
    await pool.query(
      "INSERT INTO tlou_campanha_jogadores (campanha_id, user_id, ficha_id, nome_jogador, nome_personagem) VALUES (?, ?, ?, ?, ?)",
      [req.params.id, user.id, ficha_id, user.name, fichaCheck[0].nome_personagem]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Você já está nessa campanha com essa ficha" });
    res.status(500).json({ error: err.message });
  }
});

// ─── REFERÊNCIAS ──────────────────────────────────────────────────────────────

router.get("/referencias", async (req, res) => {
  try {
    const [[niveis], [idades], [personalidades], [tracos], [motivacoes], [classes]] = await Promise.all([
      pool.query("SELECT * FROM tlou_niveis_sobrevivente ORDER BY id"),
      pool.query("SELECT * FROM tlou_idades_surto ORDER BY id"),
      pool.query("SELECT * FROM tlou_personalidades ORDER BY id"),
      pool.query("SELECT * FROM tlou_tracos ORDER BY id"),
      pool.query("SELECT * FROM tlou_motivacoes ORDER BY id"),
      pool.query("SELECT * FROM tlou_classes ORDER BY id"),
    ]);
    res.json({ niveis, idades, personalidades, tracos, motivacoes, classes });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/loja", async (req, res) => {
  try {
    const [[armas], [melhorias], [municoes], [geral]] = await Promise.all([
      pool.query("SELECT * FROM tlou_armas ORDER BY nome"),
      pool.query("SELECT * FROM tlou_armas_melhorias ORDER BY arma_id, id"),
      pool.query("SELECT * FROM tlou_municoes ORDER BY nome"),
      pool.query("SELECT * FROM tlou_itens_gerais ORDER BY nome"),
    ]);
    res.set("Cache-Control", "no-store");
    res.json({ armas, melhorias, municoes, geral });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SALVAR FICHA ─────────────────────────────────────────────────────────────

router.put("/fichas/:id/salvar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const {
    nome_personagem, nome_jogador,
    vida_atual, vida_maxima, pilulas, sucata,
    nivel_ferramenta, medicina_val,
    brutalidade, mira, agilidade, instinto,
    coleta, sobrevivencia, manutencao, medicina,
    dados_pericias, habilidades_compradas, itens_mochila,
    recursos_fabricacao, coldre_longo, coldre_curto,
    historico_rolagens, ataques_combate, coldres_slots,
  } = req.body;
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.query(`
      UPDATE tlou_fichas SET
        nome_personagem       = ?,
        nome_jogador          = ?,
        vida_atual            = ?,
        vida_maxima           = ?,
        pilulas               = ?,
        sucata                = ?,
        nivel_ferramenta      = ?,
        medicina_val          = ?,
        brutalidade           = ?,
        mira                  = ?,
        agilidade             = ?,
        instinto              = ?,
        coleta                = ?,
        sobrevivencia         = ?,
        manutencao            = ?,
        medicina              = ?,
        dados_pericias        = ?,
        habilidades_compradas = ?,
        itens_mochila         = ?,
        recursos_fabricacao   = ?,
        coldre_longo          = ?,
        coldre_curto          = ?,
        historico_rolagens    = ?,
        ataques_combate       = ?,
        coldres_slots         = ?,
        atualizado_em         = NOW()
      WHERE id = ? AND user_id = ?
    `, [nome_personagem, nome_jogador, vida_atual, vida_maxima, pilulas, sucata,
      nivel_ferramenta, medicina_val || null, brutalidade, mira, agilidade, instinto,
      coleta, sobrevivencia, manutencao, medicina, dados_pericias || null,
      habilidades_compradas || null, itens_mochila || null, recursos_fabricacao || null,
      coldre_longo ? 1 : 0, coldre_curto ? 1 : 0, historico_rolagens || null,
      ataques_combate || null, coldres_slots || null,
      parseInt(req.params.id), user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;