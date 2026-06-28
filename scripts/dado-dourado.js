
// scripts/dado-dourado.js

const GILDED = {
  name        : "candela_gilded",
  description : "Candela — Dado Dourado",
  category    : "Candela Obscura",
  labelColor  : "#FFFFFF",
  diceColor   : "#d4a820",
  outlineColor: "#d4a820",
  edgeColor   : "#b8860c",
  texture     : "metal",
  material    : "auto",
  font        : "auto",
  system      : "candelafvtt",
  default     : false
};

// Tenta registrar quando o DSN estiver pronto
Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addColorset(GILDED, "preferred");
});

// Fallback: se diceSoNiceReady já disparou, registra agora
Hooks.once("ready", () => {
  const dsn = game.dice3d;
  if (!dsn) return;
  // Evita registrar duplicado
  if (!game.dice3d.constructor.COLORSETS?.["candela_gilded"]) {
    dsn.addColorset(GILDED, "preferred");
  }
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
