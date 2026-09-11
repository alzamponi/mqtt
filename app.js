let client = null;

function conectar() {
  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;
  const erroEl = document.getElementById('erro');

  // Limpa erro anterior
  erroEl.style.display = 'none';

  // Conecta ao HiveMQ Cloud
  client = mqtt.connect('wss://3ab0c9fdcc5a4b86bcf2d4b90c50c0a3.s1.eu.hivemq.cloud:8884/mqtt', {
    username: user,
    password: pass,
    clientId: 'sensor_' + Math.random().toString(16).substr(2, 8)
  });

  // Sucesso: mostra o painel
  client.on('connect', () => {
    document.getElementById('login').style.display = 'none';
    document.getElementById('painel').style.display = 'block';
    client.subscribe('sala/temperatura');
  });

  // Erro de autenticação: mostra a mensagem
  client.on('error', (err) => {
    erroEl.textContent = 'Falha na conexão. Verifique usuário e senha.';
    erroEl.style.display = 'block';
  });

  // Recebe mensagem e atualiza a tela
  client.on('message', (topic, msg) => {
    document.getElementById('temp').textContent = msg.toString() + ' °C';
  });
}

// Publica o valor do botão clicado
function enviar(valor) {
  client.publish('sala/temperatura', valor);
}
