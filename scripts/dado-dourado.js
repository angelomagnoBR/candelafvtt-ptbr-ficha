// ============================================================
//  Candela Obscura — Patch de Dado Dourado v9
// ============================================================

const CANDELA_SOCKET = "module.candelafvtt-ptbr-ficha";

// Timestamp de quando o socket chegou — só ativa durante 3 segundos
let candelaGildedUntil = 0;

function candelaGetFactory() {
  return game.dice3d?.box?.dicefactory ?? game.dice3d?.dicefactory ?? null;
}

function candelaInstalarPatch() {
  if (!game.dice3d) return;
  const factory = candelaGetFactory();
  if (!factory) return;
  if (factory._candelaPatched) return;
  factory._candelaPatched = true;
  factory._candelaGilded = false;

  const origGetAppearance = factory.getAppearanceForDice.bind(factory);
  factory.getAppearanceForDice = function(appearance, diceType, diceData) {
    const result = origGetAppearance(appearance, diceType, diceData);

    // Caminho 1: quem rola (flag local)
    const localActive = factory._candelaGilded;
    // Caminho 2: outros clientes (timestamp)
    const socketActive = Date.now() < candelaGildedUntil;

    if (!localActive && !socketActive) return result;

    const flavor = (diceData?.options?.flavor ?? "").toLowerCase();
    if (flavor.includes("dourado")) {
      result.background = "#d4a820";
      result.edge       = "#b8860c";
      result.foreground = "#FFFFFF";
      result.outline    = "none";
      if (factory.baseMaterialCache) factory.baseMaterialCache = {};
    }
    return result;
  };

  Hooks.on("diceSoNiceRollComplete", () => {
    factory._candelaGilded = false;
    candelaGildedUntil = 0;
  });

  // Quem rola: ativa flag local
  const origShow = game.dice3d.showForRoll.bind(game.dice3d);
  game.dice3d.showForRoll = function(roll, ...rest) {
    const formula = (roll?.formula ?? "").toLowerCase();
    if (formula.includes("dourado")) {
      factory._candelaGilded = true;
    }
    return origShow(roll, ...rest);
  };
}

// Quem rola: emite socket no RollStart
Hooks.on("diceSoNiceRollStart", (messageId, context) => {
  const formula = (context?.roll?.formula ?? "").toLowerCase();
  if (!formula.includes("dourado")) return;
  game.socket.emit(CANDELA_SOCKET, { action: "gildedRoll" });
});

// Outros clientes: recebem socket e ativam por 3 segundos
Hooks.once("ready", () => {
  game.socket.on(CANDELA_SOCKET, (data) => {
    if (data?.action !== "gildedRoll") return;
    candelaGildedUntil = Date.now() + 3000;
    const factory = candelaGetFactory();
    if (factory?.baseMaterialCache) factory.baseMaterialCache = {};
  });
});

Hooks.once("diceSoNiceReady", () => candelaInstalarPatch());
Hooks.once("ready", () => setTimeout(() => candelaInstalarPatch(), 1500));
