// Só roda se o Dice So Nice estiver ativo
Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addColorset({
    name        : "candela_gilded",
    description : "Candela — Dado Dourado",
    category    : "Candela Obscura",
    foreground  : "#1a1000",
    background  : "#d4a820",
    outline     : "#f0c93a",
    edge        : "#b8960c",
    texture     : "none",
    material    : "metal",
    font        : "Arial",
    default     : false
  }, "preferred");
});

Hooks.on("diceSoNiceRollStart", (id, data) => {
  const terms = data?.roll?.terms ?? [];
  terms.forEach((term) => {
    if (!term.results) return;
    const flavor = term.options?.flavor ?? "";
    if (!flavor.toLowerCase().includes("dourado")) return;
    term.options.appearance = { colorset: "candela_gilded" };
    term.results.forEach(r => { r.appearance = { colorset: "candela_gilded" }; });
  });
});