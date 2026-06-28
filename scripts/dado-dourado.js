// ═══════════════════════════════════════════════════════
//  CANDELA OBSCURA — Dado Dourado com Dice So Nice
//  Mesmo estético do dado principal (metal/auto/auto)
//  só com cores douradas.
//  Arquivo: scripts/dado-dourado.js
// ═══════════════════════════════════════════════════════

Hooks.once("diceSoNiceReady", (dice3d) => {
  // Só registra se o DSN estiver ativo
  if (!game.modules.get("dice-so-nice")?.active) return;

  dice3d.addColorset({
    name        : "candela_gilded",
    description : "Candela — Dado Dourado",
    category    : "Candela Obscura",
    // ── Cores douradas ────────────────────────────────
    labelColor  : "#FFFFFF",   // número escuro (igual ao vermelho usa #FFFFFF)
    diceColor   : "#d4a820",   // corpo dourado
    outlineColor: "#d4a820",   // contorno igual ao corpo (padrão do vermelho)
    edgeColor   : "#b8860c",   // borda igual ao corpo (padrão do vermelho)
    // ── Mesmo estético do dado normal ─────────────────
    texture     : "metal",     // igual ao seu dado vermelho
    material    : "auto",      // igual ao seu dado vermelho
    font        : "auto",      // igual ao seu dado vermelho
    system      : "candelafvtt",
    default     : false
  }, "preferred");
});

Hooks.on("diceSoNiceRollStart", (id, data) => {
  if (!game.modules.get("dice-so-nice")?.active) return;

  const terms = data?.roll?.terms ?? [];
  terms.forEach((term) => {
    if (!term.results) return;
    const flavor = term.options?.flavor ?? "";
    if (!flavor.toLowerCase().includes("dourado")) return;

    term.options.appearance = { colorset: "candela_gilded" };
    term.results.forEach(r => { r.appearance = { colorset: "candela_gilded" }; });
  });
});
