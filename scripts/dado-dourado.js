function candelaInstalarPatch() {
  if (!game.dice3d) return;
  var factory = game.dice3d.box && game.dice3d.box.dicefactory;
  if (!factory) return;

  window._candelaGilded = false;

  if (!factory._candelaOrigGetAppearance) {
    factory._candelaOrigGetAppearance = factory.getAppearanceForDice.bind(factory);
    factory.getAppearanceForDice = function() {
      var result = factory._candelaOrigGetAppearance.apply(factory, arguments);
      if (window._candelaGilded) {
        window._candelaGilded = false;
        result.background = "#d4a820";
        result.edge       = "#b8860c";
        result.foreground = "#FFFFFF";
        result.outline    = "none";
      }
      return result;
    };
  }

  if (!game.dice3d._candelaOrigShow) {
    game.dice3d._candelaOrigShow = game.dice3d.showForRoll;
    game.dice3d.showForRoll = function(roll) {
      var formula = (roll && roll.formula) ? roll.formula : "";
      if (formula.toLowerCase().indexOf("dourado") !== -1) {
        window._candelaGilded = true;
        if (factory.baseMaterialCache) factory.baseMaterialCache = {};
      }
      return game.dice3d._candelaOrigShow.apply(game.dice3d, arguments);
    };
  }
}

// Tenta no diceSoNiceReady (DSN pronto)
Hooks.once("diceSoNiceReady", function() {
  candelaInstalarPatch();
});

// Fallback: tenta no ready com delay
Hooks.once("ready", function() {
  setTimeout(function() {
    candelaInstalarPatch();
  }, 2000);
});
