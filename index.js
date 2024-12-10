const express = require("express");
const http = require("http");
const mineflayer = require('mineflayer');
const pvp = require('mineflayer-pvp').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const armorManager = require('mineflayer-armor-manager');
const AutoAuth = require('mineflayer-auto-auth');
const app = express();

app.use(express.json());

// Página inicial do bot (você pode personalizar a página)
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));

// Inicia o servidor na porta definida pelo Replit
app.listen(process.env.PORT, () => console.log("Servidor rodando!"));

// Manter o Replit ativo
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.repl.co/`);
}, 224000); // Envia uma requisição a cada 224 segundos (4 minutos)

// Função para criar o bot
function createBot() {
  const bot = mineflayer.createBot({
    host: 'mc1501586.fmcs.cloud',
    version: false,
    username: 'Bruxinho',
    port: 48433,
    plugins: [AutoAuth],
    AutoAuth: 'bot112022'
  });

  bot.loadPlugin(pvp);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(pathfinder);

  let guardPos = null;
  let isFarming = false;
  let farmInterval = null;

  // Funções de guarda
  function guardArea(pos) {
    guardPos = pos.clone();
    if (!bot.pvp.target) {
      moveToGuardPos();
    }
  }

  function stopGuarding() {
    guardPos = null;
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
  }

  function moveToGuardPos() {
    const mcData = require('minecraft-data')(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z));
  }

  // Modo Farm
  function startFarming() {
    if (isFarming) return;
    isFarming = true;
    bot.chat("Modo farm ativado! Ficarei pulando no lugar.");
    farmInterval = setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 200); // Pula e para de pular rapidamente
    }, 1000); // Pula a cada 1 segundo
  }

  function stopFarming() {
    if (!isFarming) return;
    isFarming = false;
    clearInterval(farmInterval);
    farmInterval = null;
    bot.chat("Modo farm desativado!");
  }

  // Comandos via chat
  bot.on('chat', (username, message) => {
    const player = bot.players[username];

    if (message === 'guard') {
      if (player) {
        bot.chat('Protegendo a área!');
        guardArea(player.entity.position);
      }
    }

    if (message === 'stop') {
      bot.chat('Parando todas as ações.');
      stopGuarding();
      stopFarming();
    }

    if (message === 'farm') {
      startFarming();
    }

    if (message === 'stop farm') {
      stopFarming();
    }
  });

  bot.on('physicTick', () => {
    if (guardPos && !bot.pvp.target && !bot.pathfinder.isMoving()) {
      moveToGuardPos();
    }
  });

  bot.on('kicked', console.log);
  bot.on('error', console.log);
  bot.on('end', createBot); // Reinicia o bot caso ele seja desconectado
}

createBot();
