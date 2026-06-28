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
// NOVO: INTEGRAÇÃO DIRETA COM GATILHO 3D DO DICE SO NICE (FOUNDRY v12+)
// =====================================================================

// 1. Cria a paleta de cores dourada no Dice So Nice assim que o módulo iniciar
Hooks.on('diceSoNiceReady', (dice3d) => {
    dice3d.addColorset({
        name: 'candela_gilded',
        description: 'Candela Obscura - Dado Dourado',
        category: 'Candela Obscura',
        foreground: '#FFFFFF', // Números Brancos
        background: '#D4AF37', // Corpo do dado Dourado (Gold)
        outline: '#8B6508',    // Contorno do número em marrom
        edge: '#AA7C11',       // Bordas do dado
        texture: 'none'
    }, "preferred");
});

// 2. Intercepta a animação 3D diretamente no início da rolagem física
Hooks.on('diceSoNiceRollStart', (messageId, diceData) => {
    // Pegamos a mensagem de chat que gerou essa rolagem 3D
    const chatMessage = game.messages.get(messageId);
    if (!chatMessage) return;

    // Obtém o flavor text geral ou o conteúdo da mensagem
    const flavorText = chatMessage.flavor || "";
    const contentText = chatMessage.content || "";
    
    // Unifica os textos para buscar os termos chaves em português ou inglês
    const textToSearch = (flavorText + " " + contentText).toLowerCase();

    // Se a mensagem contiver indicações de que é um dado dourado
    if (textToSearch.includes("dado dourado") || textToSearch.includes("dados dourados") || textToSearch.includes("gilded")) {
        
        // O Dice So Nice nos dá uma lista direta de dados 3D (diceData.throws)
        diceData.throws.forEach(throwItem => {
            throwItem.dice.forEach(die => {
                // Se for um dado de 6 faces (d6), força a cor dourada que criamos
                if (die.faces === 6) {
                    die.colorset = 'candela_gilded';
                }
            });
        });
    }
});
