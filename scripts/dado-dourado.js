// ═══════════════════════════════════════════════════════
//  CANDELA OBSCURA — Dado Dourado com Dice So Nice
//  Intercepta getAppearanceForDice + limpa cache
//  para aplicar cores douradas no dado especial.
//  Arquivo: scripts/dado-dourado.js
// ═══════════════════════════════════════════════════════

Hooks.once("ready", function() {
  if (!game.modules.get("dice-so-nice")?.active) return;
  if (!game.dice3d) return;

  var factory = game.dice3d.box && game.dice3d.box.dicefactory;
  if (!factory) return;

  // Flag de controle — true quando a próxima rolagem tem dado dourado
  window._candelaGilded = false;

  // ── 1. Intercepta getAppearanceForDice ─────────────
  //  É aqui que as cores finais são resolvidas antes
  //  de criar o material 3D.
  if (!factory._candelaOrigGetAppearance) {
    factory._candelaOrigGetAppearance = factory.getAppearanceForDice.bind(factory);
    factory.getAppearanceForDice = function() {
      var result = factory._candelaOrigGetAppearance.apply(factory, arguments);
      if (window._candelaGilded) {
        window._candelaGilded = false;
        result.background = "#d4a820";   // dourado
        result.edge      = "#b8860c";   // âmbar
        result.foreground = "#FFFFFF";  // número branco
        result.outline   = "none";
      }
      return result;
    };
  }

  // ── 2. Intercepta showForRoll ───────────────────────
  //  Detecta dado dourado pela fórmula e seta a flag
  //  + limpa o cache para forçar recriação do material.
  if (!game.dice3d._candelaOrigShow) {
    game.dice3d._candelaOrigShow = game.dice3d.showForRoll;
    game.dice3d.showForRoll = function(roll) {
      var formula = (roll && roll.formula) ? roll.formula : "";
      if (formula.toLowerCase().indexOf("dourado") !== -1) {
        window._candelaGilded = true;
        // Limpa cache para forçar recriação com as novas cores
        if (factory.baseMaterialCache) {
          factory.baseMaterialCache = {};
        }
      }
      return game.dice3d._candelaOrigShow.apply(game.dice3d, arguments);
    };
  }
});
