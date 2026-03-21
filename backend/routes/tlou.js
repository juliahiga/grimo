const express = require("express");
const router = express.Router();
const { pool } = require("../db");

async function getUserId(google_id) {
  const [rows] = await pool.query("SELECT id, name FROM users WHERE google_id = ?", [google_id]);
  return rows[0] || null;
}

// ─── PISO DE DADO POR GOOGLE_ID ───────────────────────────────────────────────
// google_id (string) → resultado mínimo garantido nos dados do TLOU.
// Adicione ou remova entradas aqui conforme necessário.
const DICE_FLOOR_BY_GOOGLE_ID = {
  "101236900829368048922": 6,
  "109832805199820068187": 6,
};

// Aplica o piso ao valor_dado recebido do cliente.
// Se o floor for >= número de faces do dado, o piso é ignorado — o dado já rolou
// livremente no cliente e não deve ser alterado. Ex: floor 6 num D4 → valor mantido.
function applyDiceFloor(googleId, valorDado, dadoStr) {
  const floor = DICE_FLOOR_BY_GOOGLE_ID[googleId] ?? 0;
  if (!floor || floor <= 0 || !valorDado) return valorDado;
  // Extrai faces do tipo de dado enviado (ex: "D4" → 4). Se não informado, aplica normalmente.
  const faces = dadoStr ? parseInt(String(dadoStr).replace(/[Dd]/, ""), 10) : Infinity;
  // Só aplica piso se o floor for menor que o máximo do dado
  if (faces && floor >= faces) return valorDado;
  return Math.max(Number(valorDado), floor);
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
    const user = await getUserId(req.session.google_id, req.session);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [rows] = await pool.query(`
      SELECT f.*, n.nome AS nivel, n.pilulas_iniciais, n.equipamentos_iniciais, n.armas_iniciais,
        c.nome AS classe, i.nome AS idade_surto, p.nome AS personalidade,
        t.nome AS traco, m.descricao AS motivacao,
        cj.campanha_id, camp.nome AS campanha_nome
      FROM tlou_fichas f
      JOIN tlou_niveis_sobrevivente n ON f.nivel_sobrevivente_id = n.id
      JOIN tlou_classes             c ON f.classe_id = c.id
      JOIN tlou_idades_surto        i ON f.idade_surto_id = i.id
      JOIN tlou_personalidades      p ON f.personalidade_id = p.id
      JOIN tlou_tracos              t ON f.traco_id = t.id
      JOIN tlou_motivacoes          m ON f.motivacao_id = m.id
      LEFT JOIN tlou_campanha_jogadores cj ON cj.ficha_id = f.id
      LEFT JOIN tlou_campanhas camp ON camp.id = cj.campanha_id
      WHERE f.id = ?
        AND (
          f.user_id = ?
          OR EXISTS (
            SELECT 1 FROM tlou_campanha_jogadores cj2
            JOIN tlou_campanhas camp2 ON cj2.campanha_id = camp2.id
            WHERE cj2.ficha_id = f.id
              AND (cj2.user_id = ? OR camp2.user_id_mestre = ?)
          )
        )
    `, [req.params.id, user.id, user.id, user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Ficha não encontrada" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const fichaId = parseInt(req.params.id);
    await pool.query("DELETE FROM tlou_campanha_jogadores WHERE ficha_id = ?", [fichaId]);
    await pool.query("DELETE FROM tlou_fichas WHERE id = ? AND user_id = ?", [fichaId, user.id]);
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
    await pool.query("DELETE FROM tlou_rolagens WHERE campanha_id = ?", [req.params.id]);
    await pool.query("DELETE FROM tlou_campanha_jogadores WHERE campanha_id = ?", [req.params.id]);
    await pool.query("DELETE FROM tlou_campanhas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id", async (req, res) => {
  try {
    const [campanhaRows] = await pool.query(`
      SELECT c.*, c.image AS imagem
      FROM tlou_campanhas c
      WHERE c.id = ?
    `, [req.params.id]);
    if (campanhaRows.length === 0) return res.status(404).json({ error: "Campanha não encontrada" });

    const [jogadores] = await pool.query(`
      SELECT cj.id, cj.user_id, cj.ficha_id, cj.nome_jogador, cj.nome_personagem, cj.entrou_em,
        f.vida_atual, f.vida_maxima, f.pilulas, f.imagem, cl.nome AS classe,
        COALESCE(u.custom_picture, u.picture) AS picture
      FROM tlou_campanha_jogadores cj
      JOIN tlou_fichas f ON cj.ficha_id = f.id
      JOIN tlou_classes cl ON f.classe_id = cl.id
      LEFT JOIN users u ON cj.user_id = u.id
      WHERE cj.campanha_id = ? ORDER BY cj.entrou_em ASC
    `, [req.params.id]);

    let sou_mestre = false;
    let sou_membro = false;
    if (req.session.google_id) {
      const user = await getUserId(req.session.google_id, req.session);
      if (user) {
        sou_mestre = campanhaRows[0].user_id_mestre === user.id;
        sou_membro = jogadores.some(j => j.user_id === user.id);
      }
    }

    res.json({ ...campanhaRows[0], sou_mestre, sou_membro, jogadores });
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

// DELETE /campanhas/:id/sair — jogador sai da campanha
router.delete("/campanhas/:id/sair", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.query(
      "DELETE FROM tlou_campanha_jogadores WHERE campanha_id = ? AND user_id = ?",
      [req.params.id, user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
// ─── ESCUDO DO MESTRE ─────────────────────────────────────────────────────────

// GET /campanhas/:id/fichas — fichas completas dos jogadores (só mestre)
router.get("/campanhas/:id/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [campCheck] = await pool.query(
      "SELECT id FROM tlou_campanhas WHERE id = ? AND user_id_mestre = ?",
      [req.params.id, user.id]
    );
    if (campCheck.length === 0)
      return res.status(403).json({ error: "Apenas o mestre pode acessar essa rota" });

    const [rows] = await pool.query(`
      SELECT
        f.id, f.nome_personagem, f.nome_jogador,
        f.vida_atual, f.vida_maxima,
        f.pilulas, f.sucata, f.nivel_ferramenta,
        f.brutalidade, f.mira, f.agilidade, f.instinto,
        f.coleta, f.sobrevivencia, f.manutencao, f.medicina,
        f.imagem,
        u.name AS nome_usuario, u.picture AS avatar
      FROM tlou_campanha_jogadores cj
      JOIN tlou_fichas f ON cj.ficha_id = f.id
      JOIN users u ON cj.user_id = u.id
      WHERE cj.campanha_id = ?
      ORDER BY cj.entrou_em ASC
    `, [req.params.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /campanhas/:id/rolagens — busca rolagens públicas da campanha (polling)
router.get("/campanhas/:id/rolagens", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [acesso] = await pool.query(`
      SELECT 1 FROM tlou_campanhas WHERE id = ? AND user_id_mestre = ?
      UNION
      SELECT 1 FROM tlou_campanha_jogadores WHERE campanha_id = ? AND user_id = ?
      LIMIT 1
    `, [req.params.id, user.id, req.params.id, user.id]);
    if (acesso.length === 0)
      return res.status(403).json({ error: "Sem acesso a esta campanha" });

    const sinceId = parseInt(req.query.since_id) || 0;

    const [rows] = await pool.query(`
      SELECT id, campanha_id, ficha_id, personagem, label,
        valor_dado, bonus, total, ataque_total,
        is_dano, critico_max, critico_min, hora, criado_em
      FROM tlou_rolagens
      WHERE campanha_id = ? AND id > ?
      ORDER BY id DESC
      LIMIT 100
    `, [req.params.id, sinceId]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /dice-floor — retorna o piso configurado para o usuário logado
router.get("/dice-floor", (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const floor = DICE_FLOOR_BY_GOOGLE_ID[req.session.google_id] ?? 0;
  res.json({ floor });
});

// POST /campanhas/:id/rolagens — salva uma rolagem pública na campanha
router.post("/campanhas/:id/rolagens", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const {
    personagem, label,
    valor_dado, bonus, total, ataque_total,
    is_dano, critico_max, critico_min, hora,
    ficha_id, dado_tipo,
  } = req.body;

  if (!label || total === undefined)
    return res.status(400).json({ error: "label e total são obrigatórios" });

  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [acesso] = await pool.query(`
      SELECT 1 FROM tlou_campanhas WHERE id = ? AND user_id_mestre = ?
      UNION
      SELECT 1 FROM tlou_campanha_jogadores WHERE campanha_id = ? AND user_id = ?
      LIMIT 1
    `, [req.params.id, user.id, req.params.id, user.id]);
    if (acesso.length === 0)
      return res.status(403).json({ error: "Sem acesso a esta campanha" });

    // Aplica piso de dado se o usuário tiver vantagem configurada.
    // dado_tipo (ex: "D4") é usado para ignorar o piso em dados menores que o floor.
    const valorDadoFinal = applyDiceFloor(req.session.google_id, valor_dado ?? 0, dado_tipo);
    // Recalcula total se o dado foi corrigido para cima
    const diferencaDado  = valorDadoFinal - (valor_dado ?? 0);
    const totalFinal     = (total ?? 0) + diferencaDado;
    const ataqueFinal    = ataque_total != null ? ataque_total + diferencaDado : null;

    const [result] = await pool.query(`
      INSERT INTO tlou_rolagens
        (campanha_id, ficha_id, user_id, personagem, label,
         valor_dado, bonus, total, ataque_total,
         is_dano, critico_max, critico_min, hora)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.params.id,
      ficha_id || null,
      user.id,
      personagem || user.name,
      label,
      valorDadoFinal,
      bonus ?? 0,
      totalFinal,
      ataqueFinal,
      is_dano ? 1 : 0,
      critico_max ? 1 : 0,
      critico_min ? 1 : 0,
      hora || null,
    ]);

    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;