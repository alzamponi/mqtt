// ===== Configuração do broker (WSS público) =====
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
const TOPIC = 'sala/temperatura';

// ===== Elementos da interface =====
const statusEl   = document.getElementById('status');
const valueEl    = document.getElementById('value');
const metaEl     = document.getElementById('meta');
const btnStart   = document.getElementById('btnStart');
const btnStop    = document.getElementById('btnStop');
const intervalEl = document.getElementById('interval');
const intervalLabel = document.getElementById('intervalLabel');
const canvas     = document.getElementById('chart');
const ctx        = canvas.getContext('2d');

// ===== Estado da simulação =====
let timer = null;
let tempAtual = 22.0;   // temperatura inicial
const historico = [];   // {t, valor}
const MAX_POINTS = 60;  // mantém os últimos 60 pontos no gráfico

// ===== Modelo físico do sensor simulado =====
// Random walk com tendência: cada amostra é a anterior + ruído gaussiano
// e uma leve puxada de volta à média (22°C), imitando inércia térmica.
function proximaLeitura() {
  const ruido = (Math.random() - 0.5) * 0.8;      // ±0.4°C
  const media = (22.0 - tempAtual) * 0.05;        // regressão à média
  tempAtual = tempAtual + ruido + media;
  return tempAtual.toFixed(1);
}

// ===== Publica uma leitura e registra no gráfico =====
function publicarLeitura() {
  const valor = proximaLeitura();
  client.publish(TOPIC, valor);
  historico.push({ t: new Date(), valor: parseFloat(valor) });
  if (historico.length > MAX_POINTS) historico.shift();
  desenharGrafico();
}

// ===== Conexão MQTT =====
client.on('connect', () => {
  statusEl.textContent = 'Conectado';
  statusEl.classList.add('online');
  client.subscribe(TOPIC);  // assina para receber o próprio publish
});

// Recebe (inclusive o próprio sensor) e atualiza a interface
client.on('message', (topic, message) => {
  const v = message.toString();
  valueEl.textContent = v + ' °C';
  metaEl.textContent = `Tópico: ${topic} | ${new Date().toLocaleTimeString()}`;
});

client.on('close', () => {
  statusEl.textContent = 'Desconectado';
  statusEl.classList.add('offline');
});

// ===== Controles =====
btnStart.addEventListener('click', () => {
  if (timer) return;
  publicarLeitura();  // envia imediatamente
  timer = setInterval(publicarLeitura, +intervalEl.value);
  btnStart.disabled = true;
  btnStop.disabled = false;
});

btnStop.addEventListener('click', () => {
  clearInterval(timer);
  timer = null;
  btnStart.disabled = false;
  btnStop.disabled = true;
});

intervalEl.addEventListener('input', () => {
  intervalLabel.textContent = intervalEl.value;
  if (timer) {
    clearInterval(timer);
    timer = setInterval(publicarLeitura, +intervalEl.value);
  }
});

// ===== Gráfico de histórico (Canvas puro, sem libs) =====
function desenharGrafico() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  if (historico.length < 2) return;

  const valores = historico.map(p => p.valor);
  const min = Math.min(...valores) - 1;
  const max = Math.max(...valores) + 1;

  // Eixos
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 10); ctx.lineTo(30, h - 20); ctx.lineTo(w - 10, h - 20);
  ctx.stroke();

  // Linha do gráfico
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  historico.forEach((p, i) => {
    const x = 30 + (i / (historico.length - 1)) * (w - 50);
    const y = h - 20 - ((p.valor - min) / (max - min)) * (h - 40);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Rótulo do valor atual
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.fillText(`${valores[valores.length - 1].toFixed(1)}°C`, w - 60, 20);
}
