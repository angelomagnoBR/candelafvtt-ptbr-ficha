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
// INTEGRAÇÃO DE ARREMESSO ÚNICO COM DICE SO NICE (CANDELA OBSCURA)
// =====================================================================

// 1. Registra o set de cores douradas
Hooks.on('diceSoNiceReady', (dice3d) => {
    dice3d.addColorset({
        name: 'candela_gilded',
        description: 'Candela Obscura - Dado Dourado',
        category: 'Candela Obscura',
        foreground: '#FFFFFF', // Números brancos
        background: '#D4AF37', // Corpo dourado
        outline: '#8B6508',    // Contorno
        edge: '#AA7C11',       // Bordas
        texture: 'none'
    }, "preferred");
});

// 2. Intercepta o arremesso e pinta os dados baseado na ordem da fórmula
Hooks.on('diceSoNiceRollStart', (messageId, diceData) => {
    const chatMessage = game.messages.get(messageId);
    if (!chatMessage || !chatMessage.rolls || !diceData.throws || !diceData.throws[0]) return;

    let flatDieIndex = 0; // Ponteiro para acompanhar qual dado físico estamos olhando
    const currentThrow = diceData.throws[0]; // Pega o arremesso unificado na mesa

    // Varre as rolagens da mensagem
    chatMessage.rolls.forEach(roll => {
        // Passa por cada termo da fórmula (ex: Termo 0 = 2d6, Termo 2 = 1d6)
        roll.terms.forEach(term => {
            // Se o termo não for um dado (ex: o sinal de "+"), pula
            if (!term.results) return;

            // Verifica se a marcação deste termo específico diz "dourado"
            const isGilded = term.faces === 6 && 
                             term.options && 
                             term.options.flavor && 
                             term.options.flavor.toLowerCase().includes("dourado");

            // Passa por cada um dos dados gerados por este termo
            term.results.forEach(() => {
                // Se for um termo dourado, pinta o dado correspondente no 3D
                if (isGilded && currentThrow.dice[flatDieIndex]) {
                    currentThrow.dice[flatDieIndex].colorset = 'candela_gilded';
                }
                flatDieIndex++; // Avança para o próximo dado da fila física
            });
        });
    });
});
