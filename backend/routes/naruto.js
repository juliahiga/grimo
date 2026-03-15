const express = require("express");
const router  = express.Router();
const { pool } = require("../db");

async function getUserId(google_id) {
  const [rows] = await pool.query(
    "SELECT id, name FROM users WHERE google_id = ?",
    [google_id]
  );
  return rows[0] || null;
}

const RYOS_POR_NC = {
  4: 100, 5: 100, 6: 100,
  7: 1000, 8: 1000, 9: 1000,
  10: 5000, 11: 5000,
  12: 13000, 13: 13000, 14: 13000,
  15: 36000, 16: 36000, 17: 36000,
  18: 88000, 19: 88000, 20: 88000,
};

router.get("/referencias", async (req, res) => {
  try {
    const [clas]       = await pool.query("SELECT id, nome, kekkei FROM naruto_clas ORDER BY nome");
    const [tendencias] = await pool.query("SELECT id, nome FROM naruto_tendencias ORDER BY id");
    const [niveis]     = await pool.query(
      "SELECT id, nc, nivel_shinobi, pontos_atributo, pontos_pericia, pontos_poder, atributo_minimo, dinheiro_inicial FROM naruto_niveis_campanha ORDER BY nc, id"
    );
    res.json({ clas, tendencias, niveis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [rows] = await pool.query(`
      SELECT
        f.id, f.nome_personagem, f.nome_jogador,
        f.vitalidade_atual, f.vitalidade_maxima,
        f.chakra_atual, f.chakra_maximo,
        f.ryos, f.imagem, f.criado_em, f.atualizado_em,
        n.nc, n.nivel_shinobi,
        cl.nome  AS cla_nome,
        t.nome   AS tendencia_nome
      FROM naruto_fichas f
      JOIN naruto_niveis_campanha n  ON n.id = f.nc_id
      JOIN naruto_clas            cl ON cl.id = f.cla_id
      JOIN naruto_tendencias      t  ON t.id  = f.tendencia_id
      WHERE f.user_id = ?
      ORDER BY f.criado_em DESC
    `, [user.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });

  const {
    nome_personagem, nome_jogador,
    nc_id: nc_id_raw, cla_id: cla_id_raw, tendencia_id: tendencia_id_raw,
    nc, cla, tendencia, imagem,
    carisma, manipulacao,
    vitalidade_maxima, chakra_maximo,
    atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
    atr_inteligencia, atr_vigor, atr_espirito,
    hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
    atributos, combate, sociais, pericias,
  } = req.body;

  if (!nome_personagem || (!nc_id_raw && !nc) || (!cla_id_raw && !cla) || (!tendencia_id_raw && !tendencia))
    return res.status(400).json({ error: "nome_personagem, nc_id, cla_id e tendencia_id são obrigatórios" });

  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM naruto_fichas WHERE user_id = ?",
      [user.id]
    );
    if (total >= 12) return res.status(400).json({ error: "Limite de 12 personagens atingido" });

    let nc_id = nc_id_raw;
    if (!nc_id && nc) {
      const [ncFind] = await pool.query(
        "SELECT id FROM naruto_niveis_campanha WHERE nc = ? ORDER BY pontos_poder DESC LIMIT 1",
        [parseInt(nc)]
      );
      if (!ncFind.length) return res.status(400).json({ error: "nc inválido" });
      nc_id = ncFind[0].id;
    }

    let cla_id = cla_id_raw;
    if (!cla_id && cla) {
      const [claFind] = await pool.query(
        "SELECT id FROM naruto_clas WHERE id = ? LIMIT 1",
        [cla]
      );
      if (!claFind.length) return res.status(400).json({ error: "cla inválido" });
      cla_id = claFind[0].id;
    }

    let tendencia_id = tendencia_id_raw;
    if (!tendencia_id && tendencia) {
      const [tendFind] = await pool.query(
        "SELECT id FROM naruto_tendencias WHERE id = ? LIMIT 1",
        [tendencia]
      );
      if (!tendFind.length) return res.status(400).json({ error: "tendencia inválida" });
      tendencia_id = tendFind[0].id;
    }

    const [ncRow] = await pool.query(
      "SELECT nc, dinheiro_inicial FROM naruto_niveis_campanha WHERE id = ?",
      [nc_id]
    );
    if (!ncRow.length) return res.status(400).json({ error: "nc_id inválido" });

    const atrObj   = atributos || {};
    const combObj  = combate   || {};
    const socObj   = sociais   || {};

    const nc_num       = ncRow[0].nc;
    const ryosIniciais = ncRow[0].dinheiro_inicial ?? RYOS_POR_NC[nc_num] ?? 100;
    const vigFinal     = parseInt(atr_vigor)   || parseInt(atrObj.vigor)   || 0;
    const espFinal     = parseInt(atr_espirito)|| parseInt(atrObj.espirito)|| 0;
    const vitMax       = vitalidade_maxima != null ? vitalidade_maxima : (10 + 3 * vigFinal + 5 * nc_num);
    const chakMax      = chakra_maximo     != null ? chakra_maximo     : (10 + 3 * espFinal);

    const [result] = await pool.query(`
      INSERT INTO naruto_fichas (
        user_id, nome_jogador, nome_personagem,
        nc_id, cla_id, tendencia_id, imagem,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual,
        ryos,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        dados_pericias, poderes, aptidoes, equipamentos, historico_rolagens
      ) VALUES (
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?,
        ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        '{}', '[]', '[]', '[]', '[]'
      )
    `, [
      user.id, nome_jogador || user.name, nome_personagem,
      nc_id, cla_id, tendencia_id, imagem || null,
      carisma || 0, manipulacao || 0,
      vitMax, vitMax,
      chakMax, chakMax,
      ryosIniciais,
      atr_forca        || atrObj.forca        || 0,
      atr_destreza     || atrObj.destreza     || 0,
      atr_agilidade    || atrObj.agilidade    || 0,
      atr_percepcao    || atrObj.percepcao    || 0,
      atr_inteligencia || atrObj.inteligencia || 0,
      atr_vigor        || atrObj.vigor        || 0,
      atr_espirito     || atrObj.espirito     || 0,
      hc_base_cc || combObj.cc || 3,
      hc_base_cd || combObj.cd || 3,
      hc_base_esq|| combObj.esq|| 3,
      hc_base_lm || combObj.lm || 3,
    ]);

    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [rows] = await pool.query(`
      SELECT
        f.*,
        CAST(f.dados_pericias     AS CHAR) AS dados_pericias,
        CAST(f.poderes            AS CHAR) AS poderes,
        CAST(f.aptidoes           AS CHAR) AS aptidoes,
        CAST(f.equipamentos       AS CHAR) AS equipamentos,
        CAST(f.historico_rolagens AS CHAR) AS historico_rolagens,
        CAST(f.notas              AS CHAR) AS dados_extras,
        n.nc, n.nivel_shinobi,
        n.pontos_atributo, n.pontos_pericia, n.pontos_poder, n.atributo_minimo,
        cl.nome   AS cla_nome,
        cl.kekkei AS cla_kekkei,
        t.nome    AS tendencia_nome,
        cj.campanha_id,
        cj.campanha_id,
        camp.nome AS campanha_nome
      FROM naruto_fichas f
      JOIN naruto_niveis_campanha n  ON n.id  = f.nc_id
      JOIN naruto_clas            cl ON cl.id = f.cla_id
      JOIN naruto_tendencias      t  ON t.id  = f.tendencia_id
      LEFT JOIN naruto_campanha_jogadores cj   ON cj.ficha_id = f.id
      LEFT JOIN naruto_campanhas          camp ON camp.id     = cj.campanha_id
      WHERE f.id = ?
        AND (
          f.user_id = ?
          OR EXISTS (
            SELECT 1 FROM naruto_campanha_jogadores cj2
            JOIN naruto_campanhas c2 ON c2.id = cj2.campanha_id
            WHERE cj2.ficha_id = f.id
              AND (cj2.user_id = ? OR c2.user_id_mestre = ?)
          )
        )
    `, [req.params.id, user.id, user.id, user.id]);

    if (!rows.length) return res.status(404).json({ error: "Ficha não encontrada" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/fichas/:id/salvar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });

  const {
    nome_personagem, nome_jogador, nc,
    vitalidade_atual, vitalidade_maxima,
    chakra_atual, chakra_maximo,
    ryos,
    dados_pericias,
    historico_rolagens,
    dados_extras,
  } = req.body;

  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [check] = await pool.query(
      "SELECT id, nc_id FROM naruto_fichas WHERE id = ? AND user_id = ?",
      [req.params.id, user.id]
    );
    if (!check.length) return res.status(403).json({ error: "Sem permissão" });

    let nc_id = check[0].nc_id;
    if (nc) {
      const [ncRow] = await pool.query(
        "SELECT id FROM naruto_niveis_campanha WHERE nc = ? ORDER BY pontos_poder DESC LIMIT 1",
        [parseInt(nc)]
      );
      if (ncRow.length) nc_id = ncRow[0].id;
    }

    let extrasObj = {};
    try { extrasObj = JSON.parse(dados_extras || "{}"); } catch {}

    const atrEdit      = extrasObj.atrEdit || {};
    const temAtrEdit   = Object.keys(atrEdit).length > 0;
    const poderes      = JSON.stringify(extrasObj.poderes      ?? []);
    const aptidoes     = JSON.stringify(extrasObj.aptidoes     ?? []);
    const equipamentos = JSON.stringify(extrasObj.itensMochila ?? []);
    const notas        = dados_extras || null;

    const atrFields = temAtrEdit
      ? `atr_forca = ?, atr_destreza = ?, atr_agilidade = ?, atr_percepcao = ?,
         atr_inteligencia = ?, atr_vigor = ?, atr_espirito = ?,`
      : "";
    const atrValues = temAtrEdit
      ? [atrEdit.forca || 0, atrEdit.destreza || 0, atrEdit.agilidade || 0,
         atrEdit.percepcao || 0, atrEdit.inteligencia || 0, atrEdit.vigor || 0,
         atrEdit.espirito || 0]
      : [];

    await pool.query(`
      UPDATE naruto_fichas SET
        nome_personagem    = ?,
        nome_jogador       = ?,
        nc_id              = ?,
        vitalidade_atual   = ?,
        vitalidade_maxima  = ?,
        chakra_atual       = ?,
        chakra_maximo      = ?,
        ryos               = ?,
        ${atrFields}
        dados_pericias     = ?,
        poderes            = ?,
        aptidoes           = ?,
        equipamentos       = ?,
        historico_rolagens = ?,
        notas              = ?
      WHERE id = ? AND user_id = ?
    `, [
      nome_personagem, nome_jogador,
      nc_id,
      vitalidade_atual || 0, vitalidade_maxima || 0,
      chakra_atual || 0, chakra_maximo || 0,
      ryos || 0,
      ...atrValues,
      dados_pericias     || "{}",
      poderes,
      aptidoes,
      equipamentos,
      historico_rolagens || "[]",
      notas,
      parseInt(req.params.id), user.id,
    ]);

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.query("DELETE FROM naruto_campanha_jogadores WHERE ficha_id = ? AND user_id = ?", [req.params.id, user.id]);
    await pool.query("DELETE FROM naruto_campanha_jogadores WHERE ficha_id = ? AND user_id = ?", [req.params.id, user.id]);
    await pool.query("DELETE FROM naruto_fichas WHERE id = ? AND user_id = ?", [req.params.id, user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas/:id/duplicar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM naruto_fichas WHERE user_id = ?", [user.id]
    );
    if (total >= 12) return res.status(400).json({ error: "Limite de 12 personagens atingido" });

    const [result] = await pool.query(`
      INSERT INTO naruto_fichas (
        user_id, nome_jogador, nome_personagem,
        nc_id, cla_id, tendencia_id, imagem,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual, ryos,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        dados_pericias, poderes, aptidoes, equipamentos, historico_rolagens
      )
      SELECT
        user_id, nome_jogador, CONCAT(nome_personagem, ' (cópia)'),
        nc_id, cla_id, tendencia_id, imagem,
        carisma, manipulacao,
        vitalidade_maxima, vitalidade_atual,
        chakra_maximo, chakra_atual, ryos,
        atr_forca, atr_destreza, atr_agilidade, atr_percepcao,
        atr_inteligencia, atr_vigor, atr_espirito,
        hc_base_cc, hc_base_cd, hc_base_esq, hc_base_lm,
        dados_pericias, poderes, aptidoes, equipamentos, '[]'
      FROM naruto_fichas WHERE id = ? AND user_id = ?
    `, [req.params.id, user.id]);

    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [rows] = await pool.query(`
      SELECT DISTINCT
        c.id, c.nome, c.descricao, c.imagem, c.criado_em,
        n.nc AS nc_campanha,
        CASE WHEN c.user_id_mestre = ? THEN 1 ELSE 0 END AS sou_mestre,
        (SELECT COUNT(*) FROM naruto_campanha_jogadores cj2 WHERE cj2.campanha_id = c.id) AS total_jogadores
      FROM naruto_campanhas c
      LEFT JOIN naruto_niveis_campanha n ON n.id = c.nc_id
      LEFT JOIN naruto_campanha_jogadores cj ON cj.campanha_id = c.id AND cj.user_id = ?
      WHERE c.user_id_mestre = ? OR cj.user_id = ?
      ORDER BY c.criado_em DESC
    `, [user.id, user.id, user.id, user.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { nome, descricao, imagem, nc_id } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [result] = await pool.query(
      "INSERT INTO naruto_campanhas (nome, descricao, imagem, user_id_mestre, nome_mestre, nc_id) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, descricao || null, imagem || null, user.id, user.name, nc_id || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id", async (req, res) => {
  try {
    const [campanhaRows] = await pool.query(`
      SELECT c.*
      FROM naruto_campanhas c
      WHERE c.id = ?
    `, [req.params.id]);
    if (!campanhaRows.length) return res.status(404).json({ error: "Campanha não encontrada" });

    const [jogadores] = await pool.query(`
      SELECT cj.id, cj.user_id, cj.ficha_id, cj.nome_jogador, cj.nome_personagem, cj.entrou_em,
        f.imagem, f.nc_id,
        n.nivel_shinobi,
        COALESCE(u.custom_picture, u.picture) AS picture
      FROM naruto_campanha_jogadores cj
      JOIN naruto_fichas f ON cj.ficha_id = f.id
      LEFT JOIN naruto_niveis_campanha n ON n.id = f.nc_id
      LEFT JOIN users u ON cj.user_id = u.id
      WHERE cj.campanha_id = ? ORDER BY cj.entrou_em ASC
    `, [req.params.id]);

    let sou_mestre = false;
    let sou_membro = false;
    if (req.session.google_id) {
      const user = await getUserId(req.session.google_id);
      if (user) {
        sou_mestre = campanhaRows[0].user_id_mestre === user.id;
        sou_membro = jogadores.some(j => j.user_id === user.id);
      }
    }

    res.json({ ...campanhaRows[0], sou_mestre, sou_membro, jogadores });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const { nome, descricao, imagem } = req.body;
    const fields = [];
    const values = [];
    if (nome      !== undefined) { fields.push("nome = ?");      values.push(nome); }
    if (descricao !== undefined) { fields.push("descricao = ?"); values.push(descricao); }
    if (imagem    !== undefined) { fields.push("imagem = ?");    values.push(imagem); }
    if (!fields.length) return res.status(400).json({ error: "Nada para atualizar" });
    values.push(req.params.id, user.id);
    await pool.query(
      `UPDATE naruto_campanhas SET ${fields.join(", ")} WHERE id = ? AND user_id_mestre = ?`,
      values
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const [check] = await pool.query("SELECT id FROM naruto_campanhas WHERE id = ? AND user_id_mestre = ?", [req.params.id, user.id]);
    if (!check.length) return res.status(403).json({ error: "Sem permissão para deletar esta campanha" });
    await pool.query("DELETE FROM naruto_campanha_jogadores WHERE campanha_id = ?", [req.params.id]);
    await pool.query("DELETE FROM naruto_campanhas WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas/:id/entrar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { ficha_id } = req.body;
  if (!ficha_id) return res.status(400).json({ error: "ficha_id é obrigatório" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [fichaCheck] = await pool.query(
      "SELECT id, nome_personagem FROM naruto_fichas WHERE id = ? AND user_id = ?",
      [ficha_id, user.id]
    );
    if (!fichaCheck.length) return res.status(403).json({ error: "Ficha não pertence ao usuário" });

    await pool.query(`
      INSERT IGNORE INTO naruto_campanha_jogadores
        (campanha_id, user_id, ficha_id, nome_jogador, nome_personagem)
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.id, user.id, ficha_id, user.name, fichaCheck[0].nome_personagem]);

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/campanhas/:id/sair", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.query(
      "DELETE FROM naruto_campanha_jogadores WHERE campanha_id = ? AND user_id = ?",
      [req.params.id, user.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [campCheck] = await pool.query(
      "SELECT id FROM naruto_campanhas WHERE id = ? AND user_id_mestre = ?",
      [req.params.id, user.id]
    );
    if (!campCheck.length) return res.status(403).json({ error: "Apenas o mestre pode acessar essa rota" });

    const [rows] = await pool.query(`
      SELECT
        f.id, f.nome_personagem, f.nome_jogador,
        f.vitalidade_atual, f.vitalidade_maxima,
        f.chakra_atual, f.chakra_maximo,
        f.atr_forca, f.atr_destreza, f.atr_agilidade,
        f.atr_percepcao, f.atr_inteligencia, f.atr_vigor, f.atr_espirito,
        f.atr_forca, f.atr_destreza, f.atr_agilidade,
        f.atr_percepcao, f.atr_inteligencia, f.atr_vigor, f.atr_espirito,
        f.ryos, f.imagem,
        n.nc, n.nivel_shinobi,
        cl.nome AS cla_nome,
        CAST(f.poderes  AS CHAR) AS poderes,
        CAST(f.aptidoes AS CHAR) AS aptidoes,
        u.name AS nome_usuario, u.picture AS avatar
      FROM naruto_campanha_jogadores cj
      JOIN naruto_fichas          f  ON f.id  = cj.ficha_id
      JOIN naruto_niveis_campanha n  ON n.id  = f.nc_id
      JOIN naruto_clas            cl ON cl.id = f.cla_id
      JOIN users                  u  ON u.id  = cj.user_id
      WHERE cj.campanha_id = ?
      ORDER BY cj.entrou_em ASC
    `, [req.params.id]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id/rolagens", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [acesso] = await pool.query(`
      SELECT 1 FROM naruto_campanhas WHERE id = ? AND user_id_mestre = ?
      UNION
      SELECT 1 FROM naruto_campanha_jogadores WHERE campanha_id = ? AND user_id = ?
      LIMIT 1
    `, [req.params.id, user.id, req.params.id, user.id]);
    if (!acesso.length) return res.status(403).json({ error: "Sem acesso a esta campanha" });

    const sinceId = parseInt(req.query.since_id) || 0;
    const [rows] = await pool.query(`
      SELECT id, ficha_id, campanha_id,
             tipo, descricao AS label,
             personagem, hora,
             dado1 AS valor_dado, dado2, precisao, bonus, total,
             critico AS critico_max, falha_critica AS critico_min,
             rolado_em
      FROM naruto_rolagens
      WHERE campanha_id = ? AND id > ?
      ORDER BY id DESC LIMIT 100
    `, [req.params.id, sinceId]);

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas/:id/rolagens", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const {
    ficha_id,
    label, valor_dado, is_dano, critico_max, critico_min, hora, personagem,
    tipo, descricao, dado1, dado2, precisao, bonus, total, dificuldade, sucesso,
  } = req.body;
  if (total === undefined) return res.status(400).json({ error: "total é obrigatório" });
  try {
    const user = await getUserId(req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const [acesso] = await pool.query(`
      SELECT 1 FROM naruto_campanhas WHERE id = ? AND user_id_mestre = ?
      UNION
      SELECT 1 FROM naruto_campanha_jogadores WHERE campanha_id = ? AND user_id = ?
      LIMIT 1
    `, [req.params.id, user.id, req.params.id, user.id]);
    if (!acesso.length) return res.status(403).json({ error: "Sem acesso a esta campanha" });

    const _tipo     = tipo || (is_dano ? "dano" : "pericia");
    const _descricao = descricao || label || null;
    const _d1        = dado1 ?? valor_dado ?? 0;
    const _d2        = dado2 ?? 0;
    const _bonus     = bonus ?? 0;
    const _critico   = critico_max ? 1 : ((_d1 + _d2) >= 15 ? 1 : 0);
    const _falha     = critico_min ? 1 : ((_d1 + _d2) <= 3  ? 1 : 0);

    const [result] = await pool.query(`
      INSERT INTO naruto_rolagens
        (ficha_id, campanha_id, tipo, descricao, personagem, hora, dado1, dado2, precisao, bonus, total, critico, falha_critica)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ficha_id || null, req.params.id,
      _tipo, _descricao, personagem || null, hora || null,
      _d1, _d2, precisao ?? 0, _bonus, total,
      _critico, _falha,
    ]);

    res.status(201).json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/itens", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, categoria, nome, preco, descricao, comp FROM naruto_itens ORDER BY categoria, nome"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;