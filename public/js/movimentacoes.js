(function () {
  const auth = window.bibliotecaAuth;
  if (!auth) return;

  const formulario = document.getElementById('form-movimentacao');
  const campoProdutos = document.getElementById('produtos_id');
  const mensagem = document.getElementById('mensagem');
  const mensagemHistorico = document.getElementById('mensagem-historico');
  const lista = document.getElementById('lista-movimentacoes');

  function mostrarMensagem(texto, tipo = 'sucesso') {
    mensagem.textContent = texto;
    mensagem.className = texto ? `mensagem mensagem-${tipo}` : 'mensagem';
  }

  function mostrarMensagemHistorico(texto, tipo = 'erro') {
    mensagemHistorico.textContent = texto;
    mensagemHistorico.className = texto ? `mensagem mensagem-${tipo}` : 'mensagem';
  }

  async function requisicao(url, opcoes = {}) {
    const resposta = await fetch(url, {
      ...opcoes,
      headers: {
        ...auth.cabecalhos(),
        ...(opcoes.headers || {}),
      },
    });

    const dados = await resposta.json().catch(() => ({}));

    if (resposta.status === 401) {
      localStorage.removeItem('biblioteca_token');
      window.location.replace('index.html');
      throw new Error('Sua sessão expirou. Entre novamente.');
    }

    if (!resposta.ok) {
      throw new Error(dados.mensagem || 'Não foi possível concluir a operação.');
    }

    return dados;
  }

  function celula(texto) {
    const td = document.createElement('td');
    td.textContent = texto;
    return td;
  }

  async function carregarProdutos(silencioso = false) {
    try {
      const produtos = await requisicao('/produtos?pagina=1&limite=100');
      campoProdutos.replaceChildren();

      const inicial = document.createElement('option');
      inicial.value = '';
      inicial.textContent = produtos.length ? 'Selecione um produto' : 'Nenhum produto cadastrado';
      campoProdutos.appendChild(inicial);

      produtos.forEach((produto) => {
        const opcao = document.createElement('option');
        opcao.value = produto.id;
        opcao.textContent = `${produto.nome} — estoque: ${produto.quantidade_estoque}`;
        campoProdutos.appendChild(opcao);
      });
      campoProdutos.disabled = false;
    } catch (erro) {
      campoProdutos.replaceChildren();
      const opcao = document.createElement('option');
      opcao.textContent = 'Erro ao carregar produtos';
      campoProdutos.appendChild(opcao);
      campoProdutos.disabled = true;
      if (!silencioso) {
        mostrarMensagem(erro.message, 'erro');
      }
    }
  }

  function renderizarMovimentacoes(movimentacoes) {
    lista.replaceChildren();

    if (!movimentacoes.length) {
      const linha = document.createElement('tr');
      const td = celula('Nenhuma movimentação registrada.');
      td.colSpan = 4;
      td.className = 'estado-tabela';
      linha.appendChild(td);
      lista.appendChild(linha);
      return;
    }

    movimentacoes.forEach((movimentacao) => {
      const linha = document.createElement('tr');
      const data = new Date(movimentacao.data || movimentacao.createdAt);
      const produto = movimentacao.produto?.nome
        || (movimentacao.produtos_id ? `Produto #${movimentacao.produtos_id}` : 'Produto não informado');
      const tipo = document.createElement('td');
      const etiqueta = document.createElement('span');
      etiqueta.className = `etiqueta ${movimentacao.tipo}`;
      etiqueta.textContent = movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída';
      tipo.appendChild(etiqueta);

      linha.append(
        celula(Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR')),
        celula(produto),
        tipo,
        celula(movimentacao.quantidade),
      );
      lista.appendChild(linha);
    });
  }

  async function carregarMovimentacoes(silencioso = false) {
    try {
      const movimentacoes = await requisicao('/movimentacoes');
      renderizarMovimentacoes(movimentacoes);
      mostrarMensagemHistorico('');
    } catch (erro) {
      renderizarMovimentacoes([]);
      if (!silencioso) {
        mostrarMensagemHistorico(erro.message, 'erro');
      }
    }
  }

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarMensagem('');
    const botao = formulario.querySelector('button[type="submit"]');
    const dados = {
      produtos_id: Number(campoProdutos.value),
      tipo: document.getElementById('tipo').value,
      quantidade: Number(document.getElementById('quantidade').value),
    };

    if (!Number.isInteger(dados.produtos_id) || !Number.isInteger(dados.quantidade) || dados.quantidade <= 0) {
      mostrarMensagem('Selecione um produto e informe uma quantidade maior que zero.', 'erro');
      return;
    }

    botao.disabled = true;
    try {
      await requisicao('/movimentacoes', {
        method: 'POST',
        body: JSON.stringify(dados),
      });
      formulario.reset();
      document.getElementById('quantidade').value = 1;
      mostrarMensagem('Movimentação registrada com sucesso.');
      await Promise.all([
        carregarProdutos(true),
        carregarMovimentacoes(true),
      ]);
    } catch (erro) {
      mostrarMensagem(erro.message, 'erro');
    } finally {
      botao.disabled = false;
    }
  });

  Promise.allSettled([carregarProdutos(), carregarMovimentacoes()]);
})();
