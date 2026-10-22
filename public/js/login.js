(function () {
  const CHAVE_TOKEN = 'biblioteca_token';
  const CHAVE_EMAIL = 'biblioteca_email';
  const formulario = document.getElementById('form-login');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const mensagem = document.getElementById('mensagem');
  const botao = formulario.querySelector('button[type="submit"]');

  function tokenValido(token) {
    try {
      const trecho = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(trecho.padEnd(Math.ceil(trecho.length / 4) * 4, '=')));
      return payload.exp * 1000 > Date.now();
    } catch (erro) {
      return false;
    }
  }

  function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem mensagem-${tipo}`;
  }

  const tokenAtual = localStorage.getItem(CHAVE_TOKEN);
  if (tokenAtual && tokenValido(tokenAtual)) {
    window.location.replace('painel.html');
    return;
  }

  localStorage.removeItem(CHAVE_TOKEN);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrarMensagem('', 'neutra');

    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    if (!email || !senha) {
      mostrarMensagem('Preencha o e-mail e a senha.', 'erro');
      return;
    }

    botao.disabled = true;
    botao.classList.add('carregando');
    botao.querySelector('.texto-botao').textContent = 'Entrando...';

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok || !dados.token) {
        throw new Error(dados.mensagem || 'Não foi possível entrar. Tente novamente.');
      }

      localStorage.setItem(CHAVE_TOKEN, dados.token);
      localStorage.setItem(CHAVE_EMAIL, email);
      mostrarMensagem('Login realizado. Abrindo seu painel...', 'sucesso');
      window.location.replace('painel.html');
    } catch (erro) {
      mostrarMensagem(erro.message, 'erro');
      campoSenha.focus();
      campoSenha.select();
    } finally {
      botao.disabled = false;
      botao.classList.remove('carregando');
      botao.querySelector('.texto-botao').textContent = 'Entrar';
    }
  });
})();
