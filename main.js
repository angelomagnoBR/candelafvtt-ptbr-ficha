const CANDELA_PTBR_REPLACEMENTS = new Map([
  ["pronouns", "pronomes"],
  ["Body", "Corpo"],
  ["Brain", "Mente"],
  ["Bleed", "Sangria"],
  ["Actions", "Ações"],
  ["Abilities", "Habilidades"],
  ["Biography", "Biografia"],
  ["Gear", "Equipamento"],
  ["Nerve", "Coragem"],
  ["Cunning", "Astúcia"],
  ["Intuition", "Intuição"],
  ["Drives", "Impulsos"],
  ["Resistances", "Resistências"],
  ["Move", "Mover"],
  ["Strike", "Atacar"],
  ["Control", "Controlar"],
  ["Sway", "Persuadir"],
  ["Read", "Ler"],
  ["Hide", "Esconder"],
  ["Survey", "Investigar"],
  ["Focus", "Focar"],
  ["Sense", "Sentir"],
  ["run, dodge, navigate", "correr, desviar, navegar"],
  ["punch, break, knock down", "socar, quebrar, derrubar"],
  ["drive, shoot, finesse", "dirigir, atirar, manusear"],
  ["convince, command, consort", "convencer, comandar, socializar"],
  ["interpret body language, spot lies, gather motive", "interpretar linguagem corporal, detectar mentiras, reconhecer motivos"],
  ["sneak, distract, sleight of hand", "esgueirar, distrair, prestidigitar"],
  ["search, track, spot", "pesquisar, rastrear, localizar"],
  ["inspect, analyze, remember", "inspecionar, analisar, lembrar"],
  ["attune, channel, reveal", "sintonizar, canalizar, revelar"]
]);

function getRoot(element) {
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element)) return element[0] ?? null;
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

function translateCandelaSheet(element) {
  const root = getRoot(element);
  if (!root) return;

  root.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((input) => {
    const replacement = CANDELA_PTBR_REPLACEMENTS.get(input.getAttribute("placeholder"));
    if (replacement) input.setAttribute("placeholder", replacement);
  });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, textarea")) return NodeFilter.FILTER_REJECT;
      return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const original = node.nodeValue;
    const trimmed = original.replace(/\s+/g, " ").trim();
    const replacement = CANDELA_PTBR_REPLACEMENTS.get(trimmed);
    if (!replacement) continue;
    node.nodeValue = original.replace(original.trim(), replacement);
  }
}

Hooks.on("renderActorSheet", (_app, html) => translateCandelaSheet(html));
Hooks.on("renderItemSheet", (_app, html) => translateCandelaSheet(html));
Hooks.on("renderApplicationV2", (app, element) => {
  const name = String(app?.constructor?.name ?? "").toLowerCase();
  const root = getRoot(element);
  const isCandela = name.includes("candela") || root?.closest?.(".candelafvtt") || root?.querySelector?.(".candelafvtt");
  if (isCandela) translateCandelaSheet(root);
});

// =====================================================================
// NOVO: INTEGRAÇÃO COM DICE SO NICE (FORÇAR COR DO DADO DOURADO NO CHAT)
// =====================================================================

Hooks.on('preCreateChatMessage', (document, data, options, userId) => {
    if (!document.rolls || document.rolls.length === 0) return;

    // Linha de diagnóstico: Abra o console do navegador (F12) para ver a estrutura da rolagem
    console.log("Candela Obscura - Rolagem detectada:", document);

    const flavorText = document.flavor || "";
    
    document.rolls.forEach(roll => {
        // Verifica termos em português (da sua tradução) e termos nativos do sistema em inglês
        const isGildedRoll = flavorText.toLowerCase().includes("dado dourado") || 
                             flavorText.toLowerCase().includes("dados dourados") || 
                             flavorText.toLowerCase().includes("gilded") ||
                             (roll.options && roll.options.flavor && roll.options.flavor.toLowerCase().includes("gilded")) ||
                             (roll.options && roll.options.flavor && roll.options.flavor.toLowerCase().includes("dourado"));
        
        if (isGildedRoll) {
            roll.dice.forEach(dice => {
                if (dice.faces === 6) {
                    dice.options.colorset = 'candela_gilded';
                }
            });
        }
    });
});
    });
});
