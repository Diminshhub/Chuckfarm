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
app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));

// Inicia o servidor na porta definida pelo Replit
app.listen(process.env.PORT, () => console.log("Servidor rodando!"));

// Manter o Replit ativo
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.repl.co/`);
}, 224000);

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
  let isFarming = false;
  let farmInterval = null;
  let messageInterval = null;

  // Configuração de mensagens automáticas com cores
  const messages = [
    "§5Sou um bot staff! Posso ajudar no servidor!", // Roxo
    "§4Cuidado! Estou monitorando jogadores suspeitos.", // Vermelho
    "§1Vejam nosso Discord /desligado!", // Azul
  ];
  const messageIntervalTime = 30000; // Tempo entre mensagens em milissegundos (30 segundos)

  function startMessages() {
    if (messageInterval) return;
    let index = 0;
    messageInterval = setInterval(() => {
      bot.chat(messages[index]);
      index = (index + 1) % messages.length; // Alterna entre as mensagens
    }, messageIntervalTime);
  }

  function stopMessages() {
    if (messageInterval) {
      clearInterval(messageInterval);
      messageInterval = null;
    }
  }

  // Funções de guarda
  function guardArea(pos) {
    guardPos = pos.clone();
    if (!bot.pvp.target) {
      moveToGuardPos();
    }
    bot.chat("Estou protegendo a área!");
  }

  function stopGuarding() {
    guardPos = null;
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
    bot.chat("Parei de guardar a área.");
  }

  function moveToGuardPos() {
    const mcData = require("minecraft-data")(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z));
  }

  bot.on("physicTick", () => {
    if (guardPos && !bot.pvp.target && !bot.pathfinder.isMoving()) {
      moveToGuardPos();
    }

    // Ataca mobs hostis a até 6 chunks
    const mob = bot.nearestEntity(
      (e) => e.type === "mob" && bot.entity.position.distanceTo(e.position) <= 96
    );
    if (mob) {
      bot.chat("§4Hostil detectado! Atacando.");
      bot.pvp.attack(mob);
    }
  });

  // Modo Farm
  function startFarming() {
    if (isFarming) return;
    isFarming = true;
    bot.chat("§2Modo farm ativado! Ficarei pulando no lugar.");
    farmInterval = setInterval(() => {
      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 200);
    }, 1000); // Pula a cada 1 segundo
  }

  function stopFarming() {
    if (!isFarming) return;
    isFarming = false;
    clearInterval(farmInterval);
    farmInterval = null;
    bot.chat("Modo farm desativado!");
  }

  // Seguir jogador
  function followPlayer(player) {
    if (!player || !player.entity) {
      bot.chat("§cNão consigo encontrar você para seguir.");
      return;
    }
    const mcData = require("minecraft-data")(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 2), true);
    bot.chat(`Seguindo o jogador ${player.username}.`);
  }

  function stopFollowing() {
    bot.pathfinder.setGoal(null);
    bot.chat("Parei de seguir.");
  }

  // Verificar "hack" (simulado)
  function checkForHack(player) {
    if (!player || !player.entity) {
      bot.chat("§cJogador não encontrado para análise.");
      return;
    }
    bot.chat(`Analisando ${player.username}...`);
    setTimeout(() => {
      bot.chat(`Nenhuma irregularidade encontrada em ${player.username}.`);
    }, 5000); // Simula 5 segundos para análise
  }

  // Comandos via chat
  bot.on("chat", (username, message) => {
    const player = bot.players[username];

    if (message === "guard") {
      if (player) {
        guardArea(player.entity.position);
      }
    }

    if (message === "stop") {
      stopGuarding();
      stopFarming();
      stopMessages();
      stopFollowing();
    }

    if (message === "farm") {
      startFarming();
    }

    if (message === "stop farm") {
      stopFarming();
    }

    if (message === "follow") {
      followPlayer(player);
    }

    if (message === "stop follow") {
      stopFollowing();
    }

    if (message === "start messages") {
      bot.chat("Mensagens automáticas ativadas.");
      startMessages();
    }

    if (message === "stop messages") {
      bot.chat("Mensagens automáticas desativadas.");
      stopMessages();
    }

    if (message.startsWith("check")) {
      checkForHack(player);
    }
  });

  bot.on("physicTick", () => {
    const player = bot.players[Object.keys(bot.players)[0]]?.entity;
    if (player) {
      bot.lookAt(player.position.offset(0, player.height, 0)); // Olha para o jogador
    }
  });

  bot.on("kicked", console.log);
  bot.on("error", console.log);
  bot.on("end", createBot);
}

createBot();
