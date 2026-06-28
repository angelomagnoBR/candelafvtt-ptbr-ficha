// ============================================================
//  Candela Obscura — Patch de Dado Dourado v4
//  Baseado no debug real: usa diceSoNiceRollStart com o context
//  para detectar a fórmula e colorir só o dado dourado
// ============================================================

const CANDELA_SOCKET = "module.candelafvtt-ptbr-ficha";

// Set de messageIds confirmados como dourados (vindos do socket)
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

  // ID da mensagem sendo renderizada agora
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

  console.log("Candela | Patch v4 instalado.");
}

// ── diceSoNiceRollStart: recebe (messageId, context) ──
// context tem os rolls com as fórmulas reais
Hooks.on("diceSoNiceRollStart", (messageId, context) => {
  const factory =
    game.dice3d?.box?.dicefactory ??
    game.dice3d?.dicefactory ??
    null;
  if (!factory) return;

  // Verifica se algum roll tem "dourado" na fórmula
  const rolls = context?.rolls ?? [];
  const isGilded = rolls.some(r =>
    (r?.formula ?? "").toLowerCase().includes("dourado")
  );

  if (isGilded) {
    // Marca localmente
    candelaGildedMessages.add(messageId);

    // Avisa os outros clientes com o messageId real
    game.socket.emit(CANDELA_SOCKET, {
      action: "gildedRoll",
      messageId: messageId
    });
  }

  // Define o contexto para getAppearanceForDice
  factory._candelaCurrentMsgId = messageId;
});

// ── diceSoNiceRollComplete: limpa o contexto ──
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
      // Adiciona ao Set — quando o diceSoNiceRollStart chegar,
      // o ID já estará marcado
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
