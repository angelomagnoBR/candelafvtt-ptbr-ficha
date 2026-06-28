Hooks.on("diceSoNiceRollStart", (id, data) => {
  const terms = data?.roll?.terms ?? [];
  terms.forEach((term) => {
    if (!term.results) return;
    const flavor = term.options?.flavor ?? "";
    if (!flavor.toLowerCase().includes("dourado")) return;

    // Cores diretas, sem depender de colorset registrado
    const appearance = {
      colorset    : "custom",
      labelColor  : "#FFFFFF",
      diceColor   : "#d4a820",
      outlineColor: "#d4a820",
      edgeColor   : "#b8860c",
      texture     : "metal",
      material    : "auto",
      font        : "auto"
    };

    term.options.appearance = appearance;
    term.results.forEach(r => { r.appearance = appearance; });
  });
});
