// 1. Conecta ao seu HiveMQ Cloud usando o que usuário
function conectar() {
  const client = mqtt.connect('wss://3ab0c9fdcc5a4b86bcf2d4b90c50c0a3.s1.eu.hivemq.cloud:8884/mqtt', {
    username: document.getElementById('user').value,
    password: document.getElementById('pass').value,
    clientId: 'sensor_' + Math.random().toString(16).substr(2, 8)
  });

  // 2. Ao conectar, mostra o painel e assina o tópico
  client.on('connect', () => {
    document.getElementById('login').style.display = 'none';
    document.getElementById('painel').style.display = 'block';
    document.getElementById('status').textContent = 'Conectado';
    client.subscribe('sala/temperatura');
  });

  // 3. Ao receber mensagem, mostra na tela
  client.on('message', (topic, msg) => {
    document.getElementById('temp').textContent = msg.toString() + ' °C';
  });

  // 4. Botão publica um valor
  window.enviar = () => client.publish('sala/temperatura', '25');
}
