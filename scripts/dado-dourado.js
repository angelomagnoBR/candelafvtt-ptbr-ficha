// ============================================================
//  Candela Obscura — Patch de Dado Dourado (multiplayer)
//  Usa socket para sincronizar o estado "gilded" entre clientes
// ============================================================

const CANDELA_SOCKET = "module.candelafvtt-ptbr-ficha";

// ── Instala o patch visual no Dice So Nice de um cliente ──
function candelaInstalarPatch() {
  if (!game.dice3d) return;

  // Tenta achar a factory em diferentes versões do DSN
  const factory =
    (game.dice3d.box && game.dice3d.box.dicefactory) ||
    (game.dice3d._buildCanvas && game.dice3d.dicefactory) ||
    null;

  if (!factory) {
    console.warn("Candela | Dice factory não encontrada.");
    return;
  }

  // Evita instalar duas vezes
  if (factory._candelaPatched) return;
  factory._candelaPatched = true;

  // Guarda estado local "próxima rolagem é dourada?"
  factory._candelaGilded = false;

  // Intercepta getAppearanceForDice para colorir quando necessário
  const origGetAppearance = factory.getAppearanceForDice.bind(factory);
  factory.getAppearanceForDice = function(...args) {
    const result = origGetAppearance(...args);
    if (factory._candelaGilded) {
      factory._candelaGilded = false;
      result.background = "#d4a820";
      result.edge       = "#b8860c";
      result.foreground = "#FFFFFF";
      result.outline    = "none";
      // Limpa cache para garantir que a cor nova seja aplicada
      if (factory.baseMaterialCache) factory.baseMaterialCache = {};
    }
    return result;
  };

  // Intercepta showForRoll para detectar rolagens douradas LOCAIS
  const origShow = game.dice3d.showForRoll.bind(game.dice3d);
  game.dice3d.showForRoll = function(roll, ...rest) {
    const formula = (roll?.formula ?? "").toLowerCase();
    if (formula.includes("dourado")) {
      factory._candelaGilded = true;
    }
    return origShow(roll, ...rest);
  };

  console.log("Candela | Patch de dado dourado instalado.");
}

// ── Recebe aviso de outro cliente e ativa o gilded local ──
function candelaAtivarGildedLocal() {
  const factory =
    (game.dice3d?.box?.dicefactory) ||
    null;
  if (!factory) return;
  factory._candelaGilded = true;
  if (factory.baseMaterialCache) factory.baseMaterialCache = {};
}

// ── Antes de rolar, avisa todos os outros clientes via socket ──
Hooks.on("preCreateChatMessage", (message) => {
  const conteudo = message?.rolls?.[0]?.formula?.toLowerCase() ?? "";
  if (!conteudo.includes("dourado")) return;

  // Emite para todos os outros clientes
  game.socket.emit(CANDELA_SOCKET, {
    action: "gildedRoll"
  });

  // Ativa localmente também (o emitter não recebe o próprio emit)
  candelaAtivarGildedLocal();
});

// ── Escuta mensagens de outros clientes ──
Hooks.once("ready", () => {
  game.socket.on(CANDELA_SOCKET, (data) => {
    if (data?.action === "gildedRoll") {
      candelaAtivarGildedLocal();
    }
  });
});

// ── Instala o patch quando o DSN estiver pronto ──
Hooks.once("diceSoNiceReady", () => {
  candelaInstalarPatch();
});

// ── Fallback caso diceSoNiceReady já tenha passado ──
Hooks.once("ready", () => {
  setTimeout(() => {
    candelaInstalarPatch();
  }, 1500);
});
