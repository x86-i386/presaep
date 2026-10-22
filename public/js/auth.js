(function () {
  const CHAVE_TOKEN = 'biblioteca_token';
  const CHAVE_EMAIL = 'biblioteca_email';
  const token = localStorage.getItem(CHAVE_TOKEN);

  function decodificarToken(valor) {
    try {
      const trecho = valor.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(trecho.padEnd(Math.ceil(trecho.length / 4) * 4, '=')));
    } catch (erro) {
      return null;
    }
  }

  const usuario = token ? decodificarToken(token) : null;
  const expirado = !usuario || !usuario.exp || usuario.exp * 1000 <= Date.now();

  if (!token || expirado) {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_EMAIL);
    window.location.replace('index.html');
    return;
  }

  window.bibliotecaAuth = {
    token,
    usuario,
    cabecalhos() {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
    },
  };

  document.querySelectorAll('#link-sair').forEach((link) => {
    link.addEventListener('click', (evento) => {
      evento.preventDefault();
      localStorage.removeItem(CHAVE_TOKEN);
      localStorage.removeItem(CHAVE_EMAIL);
      window.location.replace('index.html');
    });
  });

  const identificacao = document.getElementById('identificacao-usuario');
  if (identificacao) {
    const email = localStorage.getItem(CHAVE_EMAIL) || 'Usuário autenticado';
    identificacao.textContent = email;
  }

  const perfil = document.getElementById('perfil-usuario');
  if (perfil) {
    perfil.textContent = usuario.tipo === 'administrador' ? 'Administrador' : 'Operador';
  }

  const avatar = document.getElementById('avatar-usuario');
  if (avatar) {
    const email = localStorage.getItem(CHAVE_EMAIL) || 'U';
    avatar.textContent = email.charAt(0).toUpperCase();
  }
})();
