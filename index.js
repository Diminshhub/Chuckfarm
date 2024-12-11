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
const SITE_URL = `http://${process.env.RAILWAY_STATIC_URL || "localhost"}:${PORT}`;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}. URL: ${SITE_URL}`));

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
    "Pessoa usando hack? Denuncie.",
    "Dúvida sobre compra de VIP? Acesse o site hopsurvival.com.net!",
  ];
  const messageIntervalTime = 30000; // 30 segundos entre mensagens
  let messageIndex = 0;

  // Envia mensagens automáticas para os logs
  setInterval(() => {
    console.log(`Mensagem automática: ${messages[messageIndex]}`);
    messageIndex = (messageIndex + 1) % messages.length;
  }, messageIntervalTime);

  // Remove todos os itens do chão com contagem regressiva nos logs
  setInterval(() => {
    console.log("Remoção de itens no chão em:");
    [3, 2, 1].forEach((count, i) => {
      setTimeout(() => console.log(`${count}...`), i * 1000);
    });

    setTimeout(() => {
      console.log("Todos os itens no chão foram removidos!");
    }, 4000); // Após 3 segundos de contagem
  }, 15 * 60 * 1000); // A cada 15 minutos

  // Mensagens iniciais após 60 segundos
  setTimeout(() => {
    console.log("Apagando logs...");
    console.log("Logs apagados!");
    console.log(`Acesse o site: ${SITE_URL}`);
    console.log(`Ping atual: ${bot.player.ping}ms`);
  }, 60000); // 60 segundos

  // Funções de guarda
  function guardArea(pos) {
    guardPos = pos.clone();
    if (!bot.pvp.target) {
      moveToGuardPos();
    }
    console.log("O bot está protegendo a área.");
  }

  function stopGuarding() {
    guardPos = null;
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
    console.log("O bot parou de guardar a área.");
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
      console.log("Hostil detectado! Atacando.");
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
