// ============================================================
//  Candela Obscura — Patch de Dado Dourado v8
// ============================================================

const CANDELA_SOCKET = "module.candelafvtt-ptbr-ficha";

function candelaInstalarPatch() {
  if (!game.dice3d) return;

  const factory =
    game.dice3d?.box?.dicefactory ??
    (game.dice3d._buildCanvas && game.dice3d.dicefactory) ??
    null;

  if (!factory) return;
  if (factory._candelaPatched) return;
  factory._candelaPatched = true;
  factory._candelaGilded = false;

  const origGetAppearance = factory.getAppearanceForDice.bind(factory);
  factory.getAppearanceForDice = function(appearance, diceType, diceData) {
    const result = origGetAppearance(appearance, diceType, diceData);
    if (!factory._candelaGilded) return result;
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
  });

  const origShow = game.dice3d.showForRoll.bind(game.dice3d);
  game.dice3d.showForRoll = function(roll, ...rest) {
    const formula = (roll?.formula ?? "").toLowerCase();
    if (formula.includes("dourado")) {
      factory._candelaGilded = true;
    }
    return origShow(roll, ...rest);
  };

  Hooks.on("diceSoNiceRollStart", (messageId, context) => {
    const formula = (context?.roll?.formula ?? "").toLowerCase();
    if (!formula.includes("dourado")) return;
    game.socket.emit(CANDELA_SOCKET, { action: "gildedRoll" });
  });

  game.socket.on(CANDELA_SOCKET, (data) => {
    if (data?.action !== "gildedRoll") return;
    factory._candelaGilded = true;
    if (factory.baseMaterialCache) factory.baseMaterialCache = {};
  });
}

Hooks.once("diceSoNiceReady", () => candelaInstalarPatch());
Hooks.once("ready", () => setTimeout(() => candelaInstalarPatch(), 1500));
