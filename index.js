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

  // Funções de guarda
  function guardArea(pos) {
    guardPos = pos.clone();
    if (!bot.pvp.target) {
      moveToGuardPos();
    }
    console.log("[LOG] Bot está protegendo a área!");
  }

  function stopGuarding() {
    guardPos = null;
    bot.pvp.stop();
    bot.pathfinder.setGoal(null);
    console.log("[LOG] Bot parou de guardar a área.");
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
      console.log("[LOG] Hostil detectado! Atacando.");
      bot.pvp.attack(mob);
    }
  });

  // Seguir jogador
  function followPlayer(player) {
    if (!player || !player.entity) {
      console.log("[LOG] Não foi possível encontrar o jogador para seguir.");
      return;
    }
    const mcData = require("minecraft-data")(bot.version);
    bot.pathfinder.setMovements(new Movements(bot, mcData));
    bot.pathfinder.setGoal(new goals.GoalFollow(player.entity, 2), true);
    console.log(`[LOG] Seguindo o jogador ${player.username}.`);
  }

  function stopFollowing() {
    bot.pathfinder.setGoal(null);
    console.log("[LOG] Bot parou de seguir o jogador.");
  }

  // Registrar ping nas logs
  setInterval(() => {
    const botPing = bot.player ? bot.player.ping : "Desconectado";
    const serverPing = bot.server ? bot.server.latency : "N/A";
    console.log(`[PING] Bot: ${botPing}ms | Servidor: ${serverPing}ms`);
  }, 5000); // Atualiza a cada 5 segundos

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
      stopFollowing();
    }

    if (message === "follow") {
      followPlayer(player);
    }

    if (message === "stop follow") {
      stopFollowing();
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
