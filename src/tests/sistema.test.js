const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo-exclusivo-dos-testes';

const Usuario = require('../models/Usuario');
const Produto = require('../models/produtos');
const Movimentacao = require('../models/Movimentacao');
const sequelize = require('../config/database');
const authController = require('../controllers/authController');
const produtoController = require('../controllers/produtosController');
const movimentacaoController = require('../controllers/movimentacaoControllers');
const autenticar = require('../middlewares/auth');
const permitir = require('../middlewares/checkRole');

function respostaSimulada() {
  return {
    statusCode: 200,
    body: undefined,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(conteudo) {
      this.body = conteudo;
      return this;
    },
  };
}

async function comMetodosSimulados(alvos, executar) {
  const originais = alvos.map(({ objeto, metodo }) => ({
    objeto,
    metodo,
    valor: objeto[metodo],
  }));

  for (const { objeto, metodo, valor } of alvos) {
    objeto[metodo] = valor;
  }

  try {
    return await executar();
  } finally {
    for (const { objeto, metodo, valor } of originais) {
      objeto[metodo] = valor;
    }
  }
}

test('CT01 - login com dados corretos retorna token', async () => {
  const senhaHash = await bcrypt.hash('senha-correta', 4);
  const res = respostaSimulada();

  await comMetodosSimulados([
    {
      objeto: Usuario,
      metodo: 'findOne',
      valor: async () => ({ id: 7, tipo: 'administrador', senha: senhaHash }),
    },
  ], async () => {
    await authController.login({
      body: { email: 'adm@email.com', senha: 'senha-correta' },
    }, res);
  });

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
  const tokenDecodificado = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(tokenDecodificado.id, 7);
  assert.equal(tokenDecodificado.tipo, 'administrador');
  assert.equal(typeof tokenDecodificado.iat, 'number');
  assert.equal(typeof tokenDecodificado.exp, 'number');
  assert.equal(tokenDecodificado.exp - tokenDecodificado.iat, 8 * 60 * 60);
});

test('CT02 - login com senha errada é recusado e não retorna token', async () => {
  const senhaHash = await bcrypt.hash('senha-correta', 4);
  const res = respostaSimulada();

  await comMetodosSimulados([
    {
      objeto: Usuario,
      metodo: 'findOne',
      valor: async () => ({ id: 8, tipo: 'operador', senha: senhaHash }),
    },
  ], async () => {
    await authController.login({
      body: { email: 'operador@email.com', senha: 'senha-errada' },
    }, res);
  });

  assert.equal(res.statusCode, 401);
  assert.match(res.body.mensagem, /inválidos/i);
  assert.equal(res.body.token, undefined);
});

test('CT03 - listagem sem token é bloqueada', () => {
  const res = respostaSimulada();
  let chamouProximo = false;

  autenticar({ headers: {} }, res, () => {
    chamouProximo = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(chamouProximo, false);
});

test('CT04 - cadastro de produto válido retorna 201', async () => {
  const res = respostaSimulada();
  const dados = {
    nome: 'Cimento CP II 50 kg',
    quantidade_estoque: 4,
  };

  await comMetodosSimulados([
    {
      objeto: Produto,
      metodo: 'create',
      valor: async (entrada) => ({ id: 21, ...entrada }),
    },
  ], async () => {
    await produtoController.cadastrar({ body: dados }, res);
  });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.id, 21);
  assert.equal(res.body.nome, dados.nome);
});

test('CT05 - operador não pode excluir produto', () => {
  const res = respostaSimulada();
  let chamouProximo = false;

  permitir('administrador')(
    { usuario: { id: 2, tipo: 'operador' } },
    res,
    () => { chamouProximo = true; },
  );

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.mensagem, 'Sem permissão para essa ação');
  assert.equal(chamouProximo, false);
});

test('CT06 - administrador pode excluir produto', async () => {
  const res = respostaSimulada();
  let removido = false;

  await comMetodosSimulados([
    {
      objeto: Produto,
      metodo: 'findByPk',
      valor: async () => ({
        destroy: async () => { removido = true; },
      }),
    },
  ], async () => {
    await produtoController.deletar({ params: { id: '21' } }, res);
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mensagem, 'Produto removido com sucesso');
  assert.equal(removido, true);
});

test('CT07 - listagem respeita paginação e filtro por nome', async () => {
  const res = respostaSimulada();
  let consulta;

  await comMetodosSimulados([
    {
      objeto: Produto,
      metodo: 'findAll',
      valor: async (opcoes) => {
        consulta = opcoes;
        return [{ id: 1, nome: 'Cimento' }, { id: 2, nome: 'Argamassa' }];
      },
    },
  ], async () => {
    await produtoController.listar({ query: { pagina: '2', limite: '2', nome: 'cimento' } }, res);
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.length, 2);
  assert.equal(consulta.limit, 2);
  assert.equal(consulta.offset, 2);
  assert.ok(consulta.where.nome);
});

test('CT08 - movimentação registra o usuário autenticado e atualiza o estoque', async () => {
  const res = respostaSimulada();
  const produto = {
    quantidade_estoque: 5,
    update: async ({ quantidade_estoque }) => {
      produto.quantidade_estoque = quantidade_estoque;
    },
  };
  const transacao = {
    LOCK: { UPDATE: 'UPDATE' },
    finished: false,
    async commit() { this.finished = 'commit'; },
    async rollback() { this.finished = 'rollback'; },
  };
  let dadosGravados;

  await comMetodosSimulados([
    { objeto: sequelize, metodo: 'transaction', valor: async () => transacao },
    { objeto: Produto, metodo: 'findByPk', valor: async () => produto },
    {
      objeto: Movimentacao,
      metodo: 'create',
      valor: async (dados) => {
        dadosGravados = dados;
        return { id: 31, ...dados };
      },
    },
  ], async () => {
    await movimentacaoController.cadastrar({
      body: { produtos_id: 3, tipo: 'entrada', quantidade: 2 },
      usuario: { id: 9, tipo: 'operador' },
    }, res);
  });

  assert.equal(res.statusCode, 201);
  assert.equal(dadosGravados.usuario_id, 9);
  assert.equal(produto.quantidade_estoque, 7);
  assert.equal(transacao.finished, 'commit');
});

test('CT09 - movimentação com quantidade zero é recusada sem acessar o banco', async () => {
  const res = respostaSimulada();
  let abriuTransacao = false;

  await comMetodosSimulados([
    {
      objeto: sequelize,
      metodo: 'transaction',
      valor: async () => {
        abriuTransacao = true;
        throw new Error('A transação não deveria ser aberta');
      },
    },
  ], async () => {
    await movimentacaoController.cadastrar({
      body: { produtos_id: 3, tipo: 'saida', quantidade: 0 },
      usuario: { id: 9, tipo: 'operador' },
    }, res);
  });

  assert.equal(res.statusCode, 400);
  assert.match(res.body.mensagem, /maior que zero/i);
  assert.equal(abriuTransacao, false);
});
