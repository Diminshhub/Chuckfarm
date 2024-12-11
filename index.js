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

  // Configuração de mensagens automáticas
  const messages = [
    "Estou aqui para ajudar!",
    "Protegendo a área.",
    "Jogadores, fiquem atentos!",
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
    const droppedItems = bot.entities.filter((e) => e.objectType === "Item");
    droppedItems.forEach((item) => {
      bot.chat(`/kill @e[type=item,x=${item.position.x},y=${item.position.y},z=${item.position.z}]`);
    });
    bot.chat("Todos os itens no chão foram removidos!");
  }, 15 * 60 * 1000); // 15 minutos em milissegundos

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
      bot.chat("Hostil detectado! Atacando.");
      bot.pvp.attack(mob);
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
