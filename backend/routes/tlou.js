const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../db");

async function getUserId(pool, google_id) {
  const result = await pool.request()
    .input("google_id", sql.VarChar, google_id)
    .query("SELECT id, name FROM users WHERE google_id = @google_id");
  return result.recordset[0] || null;
}

function calcularPericias(body) {
  const pericias = {
    sobrevivencia: 0, agilidade: 0, coleta: 0, instinto: 0,
    brutalidade: 0, mira: 0, manutencao: 0, medicina: 0,
  };
  const mapa = {
    Sobrevivência: "sobrevivencia", Agilidade: "agilidade", Coleta: "coleta",
    Instinto: "instinto", Brutalidade: "brutalidade", Mira: "mira",
    Manutenção: "manutencao", Medicina: "medicina",
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
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const result = await pool.request()
      .input("user_id", sql.Int, user.id)
      .query(`
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
        WHERE f.user_id = @user_id ORDER BY f.criado_em DESC
      `);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { nome_personagem, nome_jogador, nivel_id, pilulas_iniciais,
    idade_id, personalidade_id, pericia_escolhida, traco_id, motivacao_id, classe_id } = req.body;
  if (!nome_personagem || !nivel_id || !idade_id || !personalidade_id || !traco_id || !motivacao_id || !classe_id)
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const count = await pool.request().input("user_id", sql.Int, user.id)
      .query("SELECT COUNT(*) AS total FROM tlou_fichas WHERE user_id = @user_id");
    if (count.recordset[0].total >= 12)
      return res.status(400).json({ error: "Limite de 12 personagens atingido" });
    const pericias = calcularPericias(req.body);
    const result = await pool.request()
      .input("user_id", sql.Int, user.id)
      .input("nome_jogador", sql.NVarChar(100), nome_jogador || user.name)
      .input("nome_personagem", sql.NVarChar(100), nome_personagem)
      .input("nivel_id", sql.Int, nivel_id)
      .input("classe_id", sql.Int, classe_id)
      .input("idade_id", sql.Int, idade_id)
      .input("personalidade_id", sql.Int, personalidade_id)
      .input("pericia_escolhida", sql.NVarChar(50), pericia_escolhida)
      .input("traco_id", sql.Int, traco_id)
      .input("motivacao_id", sql.Int, motivacao_id)
      .input("pilulas", sql.Int, pilulas_iniciais || 100)
      .input("sobrevivencia", sql.Int, pericias.sobrevivencia)
      .input("agilidade", sql.Int, pericias.agilidade)
      .input("coleta", sql.Int, pericias.coleta)
      .input("instinto", sql.Int, pericias.instinto)
      .input("brutalidade", sql.Int, pericias.brutalidade)
      .input("mira", sql.Int, pericias.mira)
      .input("manutencao", sql.Int, pericias.manutencao)
      .input("medicina", sql.Int, pericias.medicina)
      .input("imagem", sql.NVarChar(sql.MAX), req.body.imagem || null)
      .query(`
        INSERT INTO tlou_fichas (
          user_id, nome_jogador, nome_personagem, nivel_sobrevivente_id, classe_id, idade_surto_id,
          personalidade_id, pericia_escolhida, traco_id, motivacao_id, pilulas,
          sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
        ) OUTPUT INSERTED.id
        VALUES (
          @user_id, @nome_jogador, @nome_personagem, @nivel_id, @classe_id, @idade_id,
          @personalidade_id, @pericia_escolhida, @traco_id, @motivacao_id, @pilulas,
          @sobrevivencia, @agilidade, @coleta, @instinto, @brutalidade, @mira, @manutencao, @medicina, @imagem
        )
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("user_id", sql.Int, user.id)
      .query(`
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
        WHERE f.id = @id AND f.user_id = @user_id
      `);
    if (result.recordset.length === 0) return res.status(404).json({ error: "Ficha não encontrada" });
    res.json(result.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/fichas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("user_id", sql.Int, user.id)
      .query("DELETE FROM tlou_fichas WHERE id = @id AND user_id = @user_id");
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/fichas/:id/duplicar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const count = await pool.request().input("user_id", sql.Int, user.id)
      .query("SELECT COUNT(*) AS total FROM tlou_fichas WHERE user_id = @user_id");
    if (count.recordset[0].total >= 12)
      return res.status(400).json({ error: "Limite de 12 personagens atingido" });
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("user_id", sql.Int, user.id)
      .query(`
        INSERT INTO tlou_fichas (
          user_id, nome_jogador, nome_personagem, nivel_sobrevivente_id, classe_id, idade_surto_id,
          personalidade_id, pericia_escolhida, traco_id, motivacao_id,
          pilulas, vida_maxima, vida_atual,
          sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
        ) OUTPUT INSERTED.id
        SELECT user_id, nome_jogador, nome_personagem + ' (cópia)',
          nivel_sobrevivente_id, classe_id, idade_surto_id,
          personalidade_id, pericia_escolhida, traco_id, motivacao_id,
          pilulas, vida_maxima, vida_atual,
          sobrevivencia, agilidade, coleta, instinto, brutalidade, mira, manutencao, medicina, imagem
        FROM tlou_fichas WHERE id = @id AND user_id = @user_id
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CAMPANHAS ────────────────────────────────────────────────────────────────

router.get("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const result = await pool.request().input("user_id", sql.Int, user.id).query(`
      SELECT DISTINCT c.id, c.nome, c.descricao, c.nome_mestre, c.max_jogadores, c.criado_em,
        CAST(c.image AS NVARCHAR(MAX)) AS imagem, n.nome AS nivel,
        CASE WHEN c.user_id_mestre = @user_id THEN 1 ELSE 0 END AS sou_mestre,
        (SELECT COUNT(*) FROM tlou_campanha_jogadores cj WHERE cj.campanha_id = c.id) AS total_jogadores
      FROM tlou_campanhas c
      LEFT JOIN tlou_niveis_sobrevivente n ON c.nivel_sobrevivente_id = n.id
      LEFT JOIN tlou_campanha_jogadores cj2 ON cj2.campanha_id = c.id AND cj2.user_id = @user_id
      WHERE c.user_id_mestre = @user_id OR cj2.user_id = @user_id
      ORDER BY c.criado_em DESC
    `);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { nome, descricao, max_jogadores, nivel_id, imagem } = req.body;
  if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const result = await pool.request()
      .input("user_id_mestre", sql.Int, user.id)
      .input("nome_mestre", sql.NVarChar(100), user.name)
      .input("nome", sql.NVarChar(150), nome)
      .input("descricao", sql.NVarChar(1000), descricao || null)
      .input("max_jogadores", sql.Int, max_jogadores || 4)
      .input("nivel_sobrevivente_id", sql.Int, nivel_id || null)
      .input("imagem", sql.NVarChar(sql.MAX), imagem || null)
      .query(`
        INSERT INTO tlou_campanhas (user_id_mestre, nome_mestre, nome, descricao, max_jogadores, nivel_sobrevivente_id, image)
        OUTPUT INSERTED.id
        VALUES (@user_id_mestre, @nome_mestre, @nome, @descricao, @max_jogadores, @nivel_sobrevivente_id, @imagem)
      `);
    res.status(201).json({ id: result.recordset[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const check = await pool.request().input("id", sql.Int, req.params.id).input("user_id", sql.Int, user.id)
      .query("SELECT id FROM tlou_campanhas WHERE id = @id AND user_id_mestre = @user_id");
    if (check.recordset.length === 0)
      return res.status(403).json({ error: "Sem permissão para deletar esta campanha" });
    await pool.request().input("campanha_id", sql.Int, req.params.id)
      .query("DELETE FROM tlou_campanha_jogadores WHERE campanha_id = @campanha_id");
    await pool.request().input("id", sql.Int, req.params.id)
      .query("DELETE FROM tlou_campanhas WHERE id = @id");
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/campanhas/:id", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const campanha = await pool.request().input("id", sql.Int, req.params.id).query(`
      SELECT c.*, CAST(c.image AS NVARCHAR(MAX)) AS imagem, n.nome AS nivel
      FROM tlou_campanhas c
      LEFT JOIN tlou_niveis_sobrevivente n ON c.nivel_sobrevivente_id = n.id
      WHERE c.id = @id
    `);
    if (campanha.recordset.length === 0) return res.status(404).json({ error: "Campanha não encontrada" });
    const jogadores = await pool.request().input("campanha_id", sql.Int, req.params.id).query(`
      SELECT cj.id, cj.user_id, cj.nome_jogador, cj.nome_personagem, cj.entrou_em,
        f.vida_atual, f.vida_maxima, f.pilulas, cl.nome AS classe
      FROM tlou_campanha_jogadores cj
      JOIN tlou_fichas f  ON cj.ficha_id = f.id
      JOIN tlou_classes cl ON f.classe_id = cl.id
      WHERE cj.campanha_id = @campanha_id ORDER BY cj.entrou_em ASC
    `);
    res.json({ ...campanha.recordset[0], sou_mestre: campanha.recordset[0].user_id_mestre === user.id, jogadores: jogadores.recordset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/campanhas/:id/entrar", async (req, res) => {
  if (!req.session.google_id) return res.status(401).json({ error: "Não autenticado" });
  const { ficha_id } = req.body;
  if (!ficha_id) return res.status(400).json({ error: "ficha_id é obrigatório" });
  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    const fichaCheck = await pool.request().input("ficha_id", sql.Int, ficha_id).input("user_id", sql.Int, user.id)
      .query("SELECT id, nome_personagem FROM tlou_fichas WHERE id = @ficha_id AND user_id = @user_id");
    if (fichaCheck.recordset.length === 0) return res.status(403).json({ error: "Ficha não pertence a você" });
    const campanha = await pool.request().input("id", sql.Int, req.params.id)
      .query("SELECT max_jogadores FROM tlou_campanhas WHERE id = @id");
    const totalAtual = await pool.request().input("campanha_id", sql.Int, req.params.id)
      .query("SELECT COUNT(*) AS total FROM tlou_campanha_jogadores WHERE campanha_id = @campanha_id");
    if (totalAtual.recordset[0].total >= campanha.recordset[0].max_jogadores)
      return res.status(400).json({ error: "Campanha já está cheia" });
    await pool.request()
      .input("campanha_id", sql.Int, req.params.id).input("user_id", sql.Int, user.id)
      .input("ficha_id", sql.Int, ficha_id).input("nome_jogador", sql.NVarChar(100), user.name)
      .input("nome_personagem", sql.NVarChar(100), fichaCheck.recordset[0].nome_personagem)
      .query(`INSERT INTO tlou_campanha_jogadores (campanha_id, user_id, ficha_id, nome_jogador, nome_personagem)
              VALUES (@campanha_id, @user_id, @ficha_id, @nome_jogador, @nome_personagem)`);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.number === 2627) return res.status(400).json({ error: "Você já está nessa campanha com essa ficha" });
    res.status(500).json({ error: err.message });
  }
});

// ─── REFERÊNCIAS ──────────────────────────────────────────────────────────────

router.get("/referencias", async (req, res) => {
  try {
    const pool = await poolPromise;
    const [niveis, idades, personalidades, tracos, motivacoes, classes] = await Promise.all([
      pool.request().query("SELECT * FROM tlou_niveis_sobrevivente ORDER BY id"),
      pool.request().query("SELECT * FROM tlou_idades_surto ORDER BY id"),
      pool.request().query("SELECT * FROM tlou_personalidades ORDER BY id"),
      pool.request().query("SELECT * FROM tlou_tracos ORDER BY id"),
      pool.request().query("SELECT * FROM tlou_motivacoes ORDER BY id"),
      pool.request().query("SELECT * FROM tlou_classes ORDER BY id"),
    ]);
    res.json({ niveis: niveis.recordset, idades: idades.recordset, personalidades: personalidades.recordset, tracos: tracos.recordset, motivacoes: motivacoes.recordset, classes: classes.recordset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/loja", async (req, res) => {
  try {
    const pool = await poolPromise;
    const [armas, melhorias, municoes, geral] = await Promise.all([
      pool.request().query("SELECT * FROM tlou_armas ORDER BY nome"),
      pool.request().query("SELECT * FROM tlou_armas_melhorias ORDER BY arma_id, id"),
      pool.request().query("SELECT * FROM tlou_municoes ORDER BY nome"),
      pool.request().query("SELECT * FROM tlou_itens_gerais ORDER BY nome"),
    ]);
    res.set("Cache-Control", "no-store");
    res.set("ETag", undefined);
    res.json({ armas: armas.recordset, melhorias: melhorias.recordset, municoes: municoes.recordset, geral: geral.recordset });
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
    recursos_fabricacao,
    coldre_longo, coldre_curto,
    historico_rolagens,
  } = req.body;

  try {
    const pool = await poolPromise;
    const user = await getUserId(pool, req.session.google_id);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    await pool.request()
      .input("id", sql.Int, parseInt(req.params.id))
      .input("user_id", sql.Int, user.id)
      .input("nome_personagem", sql.NVarChar(100), nome_personagem)
      .input("nome_jogador", sql.NVarChar(100), nome_jogador)
      .input("vida_atual", sql.Int, vida_atual)
      .input("vida_maxima", sql.Int, vida_maxima)
      .input("pilulas", sql.Int, pilulas)
      .input("sucata", sql.Int, sucata)
      .input("nivel_ferramenta", sql.Int, nivel_ferramenta)
      .input("medicina_val", sql.NVarChar(50), medicina_val || null)
      .input("brutalidade", sql.Int, brutalidade)
      .input("mira", sql.Int, mira)
      .input("agilidade", sql.Int, agilidade)
      .input("instinto", sql.Int, instinto)
      .input("coleta", sql.Int, coleta)
      .input("sobrevivencia", sql.Int, sobrevivencia)
      .input("manutencao", sql.Int, manutencao)
      .input("medicina", sql.Int, medicina)
      .input("dados_pericias", sql.NVarChar(500), dados_pericias || null)
      .input("habilidades_compradas", sql.NVarChar(sql.MAX), habilidades_compradas || null)
      .input("itens_mochila", sql.NVarChar(sql.MAX), itens_mochila || null)
      .input("recursos_fabricacao", sql.NVarChar(sql.MAX), recursos_fabricacao || null)
      .input("coldre_longo", sql.Bit, coldre_longo ? 1 : 0)   // ← NOVO
      .input("coldre_curto",  sql.Bit, coldre_curto  ? 1 : 0)
      .input("historico_rolagens", sql.NVarChar(sql.MAX), historico_rolagens || null)
      .query(`
        UPDATE tlou_fichas SET
          nome_personagem       = @nome_personagem,
          nome_jogador          = @nome_jogador,
          vida_atual            = @vida_atual,
          vida_maxima           = @vida_maxima,
          pilulas               = @pilulas,
          sucata                = @sucata,
          nivel_ferramenta      = @nivel_ferramenta,
          medicina_val          = @medicina_val,
          brutalidade           = @brutalidade,
          mira                  = @mira,
          agilidade             = @agilidade,
          instinto              = @instinto,
          coleta                = @coleta,
          sobrevivencia         = @sobrevivencia,
          manutencao            = @manutencao,
          medicina              = @medicina,
          dados_pericias        = @dados_pericias,
          habilidades_compradas = @habilidades_compradas,
          itens_mochila         = @itens_mochila,
          recursos_fabricacao   = @recursos_fabricacao,
          coldre_longo          = @coldre_longo,
          coldre_curto          = @coldre_curto,
          historico_rolagens    = @historico_rolagens,
          atualizado_em         = GETDATE()
        WHERE id = @id AND user_id = @user_id
      `);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;