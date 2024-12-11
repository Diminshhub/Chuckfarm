const express = require("express");
const http = require("http");
const mineflayer = require("mineflayer");
const pvp = require("mineflayer-pvp").plugin;
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const armorManager = require("mineflayer-armor-manager");
const AutoAuth = require("mineflayer-auto-auth");
const app = express();

app.use(express.json());

// Página inicial do bot
app.get("/", (_, res) => res.send("Bot Minecraft está rodando!"));

// Inicia o servidor na porta definida pelo Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

// Função para criar o bot
function createBot() {
  const bot = mineflayer.createBot({
    host: "mc1501586.fmcs.cloud",
    version: false,
    username: "Bruxinho",
    port: 48433,
    plugins: [AutoAuth],
    AutoAuth: "bot112022",
  });

  bot.loadPlugin(pvp);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(pathfinder);

  let guardPos = null;

  // Configuração de mensagens automáticas
  const messages = [
    "Vejam as regras no servidor!",
    "&ePessoa usando hack? Denuncie.",
    "Dúvidas sobre como comprar VIP? Entre no site hopsurvival.com.net!",
  ];
  const messageIntervalTime = 30000; // Tempo entre mensagens em milissegundos (30 segundos)
  let messageIndex = 0;

  // Envia mensagens automáticas
  setInterval(() => {
    bot.chat(messages[messageIndex]);
    messageIndex = (messageIndex + 1) % messages.length;
  }, messageIntervalTime);

  // Remove todos os itens do chão a cada 15 minutos
  setInterval(() => {
    let countdown = 3;

    // Contagem regressiva
    const countdownInterval = setInterval(() => {
      bot.chat(`Itens no chão serão removidos em ${countdown}...`);
      countdown--;

      if (countdown ===
