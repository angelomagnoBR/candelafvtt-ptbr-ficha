// ============================================================
//  Candela Obscura — Patch de Dado Dourado v3 (sem race condition)
//  Estratégia: sincroniza pelo messageId, sem estado global volátil
// ============================================================

const CANDELA_SOCKET = "module.candelafvtt-ptbr-ficha";

// Mapa local: messageId -> true (rolagem dourada pendente)
const candelaGildedMessages = new Set();

// ── Instala interceptador no Dice So Nice ──
function candelaInstalarPatch() {
  if (!game.dice3d) return;

  const factory =
    game.dice3d?.box?.dicefactory ??
    game.dice3d?.dicefactory ??
    null;

  if (!factory) {
    console.warn("Candela | Dice factory não encontrada.");
    return;
  }
  if (factory._candelaPatched) return;
  factory._candelaPatched = true;

  factory._candelaCurrentMsgId = null;

  const origGetAppearance = factory.getAppearanceForDice.bind(factory);
  factory.getAppearanceForDice = function(...args) {
    const result = origGetAppearance(...args);
    if (
      factory._candelaCurrentMsgId &&
      candelaGildedMessages.has(factory._candelaCurrentMsgId)
    ) {
      result.background = "#d4a820";
      result.edge       = "#b8860c";
      result.foreground = "#FFFFFF";
      result.outline    = "none";
      if (factory.baseMaterialCache) factory.baseMaterialCache = {};
    }
    return result;
  };

  console.log("Candela | Patch v3 instalado.");
}

// ── Marca a mensagem como dourada antes de criar no chat ──
Hooks.on("preCreateChatMessage", (message) => {
  const rolls = message.rolls ?? [];
  const isGilded = rolls.some(r =>
    (r?.formula ?? "").toLowerCase().includes("dourado")
  );
  if (!isGilded) return;

  const msgId = message.id ?? message._id;
  if (!msgId) return;

  candelaGildedMessages.add(msgId);

  game.socket.emit(CANDELA_SOCKET, {
    action: "gildedRoll",
    messageId: msgId
  });
});

// ── DSN começa a renderizar: diz qual messageId está ativo ──
Hooks.on("diceSoNiceRollStart", (messageId) => {
  const factory =
    game.dice3d?.box?.dicefactory ??
    game.dice3d?.dicefactory ??
    null;
  if (!factory) return;
  factory._candelaCurrentMsgId = messageId;
});

// ── DSN terminou: limpa o contexto ──
Hooks.on("diceSoNiceRollComplete", (messageId) => {
  const factory =
    game.dice3d?.box?.dicefactory ??
    game.dice3d?.dicefactory ??
    null;
  if (!factory) return;
  factory._candelaCurrentMsgId = null;
  candelaGildedMessages.delete(messageId);
});

// ── Escuta socket dos outros clientes ──
Hooks.once("ready", () => {
  game.socket.on(CANDELA_SOCKET, (data) => {
    if (data?.action === "gildedRoll" && data?.messageId) {
      candelaGildedMessages.add(data.messageId);
    }
  });
});

// ── Instala o patch quando DSN estiver pronto ──
Hooks.once("diceSoNiceReady", () => {
  candelaInstalarPatch();
});

Hooks.once("ready", () => {
  setTimeout(() => candelaInstalarPatch(), 1500);
});
