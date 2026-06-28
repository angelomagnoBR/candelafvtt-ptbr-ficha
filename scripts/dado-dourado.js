Hooks.on("diceSoNiceMessageProcessed", (id, data) => {
  const hasGilded = data?.roll?.dice?.some(d =>
    d.options?.flavor?.toLowerCase().includes("dourado")
  );
  if (!hasGilded) return;

  const original = foundry.utils.deepClone(
    game.user.getFlag("dice-so-nice", "appearance") ?? {}
  );

  game.user.setFlag("dice-so-nice", "appearance", {
    global: {
      labelColor  : "#FFFFFF",
      diceColor   : "#d4a820",
      outlineColor: "#d4a820",
      edgeColor   : "#b8860c",
      texture     : "metal",
      material    : "auto",
      font        : "auto",
      colorset    : "custom",
      system      : "candelafvtt"
    }
  }).then(() => {
    Hooks.once("diceSoNiceRollComplete", () => {
      game.user.setFlag("dice-so-nice", "appearance", {
        global: original.global ?? {}
      });
    });
  });
});
