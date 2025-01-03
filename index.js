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
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`URL do site no Railway: http://${process.env.PROJECT_DOMAIN}.railway.app`);
});

// Função para criar o bot
function createBot() {
  const bot = mineflayer.createBot({
    host: "Rucm.aternos.me",
    version: false,
    username: "Bruxinho",
    port: 58191,
    plugins: [AutoAuth],
    AutoAuth: "bot112022",
  });

  bot.loadPlugin(pvp);
  bot.loadPlugin(armorManager);
  bot.loadPlugin(pathfinder);

  let guardPos = null;

  // Configuração de mensagens automáticas
  const messages = [
    "Vejam as regras no servindo!",
    "&ePessoa usando hack? denuncie.",
    "Duvida compra vip? entre no site hopsurvival.com.net!",
  ];
  const messageIntervalTime = 30000; // Tempo entre mensagens em milissegundos (30 segundos)
  let messageIndex = 0;

  // Envia mensagens automáticas
  setInterval(() => {
    bot.chat(messages[messageIndex]);
    messageIndex = (messageIndex + 1) % messages.length;
  }, messageIntervalTime);

  // Função para deletar itens do chão com contagem regressiva
  function deleteItemsWithCountdown() {
    let countdown = 3;

    const countdownInterval = setInterval(() => {
      if (countdown > 0) {
        bot.chat(`Removendo itens em ${countdown}...`);
        countdown--;
      } else {
        clearInterval(countdownInterval);
        // Deletando itens
        const droppedItems = bot.entities.filter((e) => e.objectType === "Item");
        droppedItems.forEach((item) => {
          bot.chat(`/kill @e[type=item,x=${item.position.x},y=${item.position.y},z=${item.position.z}]`);
        });
        bot.chat("Todos os itens no chão foram removidos!");
      }
    }, 1000);
  }

  // Remove todos os itens do chão a cada 15 minutos
  setInterval(() => {
    deleteItemsWithCountdown();
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
