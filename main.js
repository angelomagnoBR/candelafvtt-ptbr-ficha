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

// ==========================================
// ADICIONADO: INTEGRAÇÃO COM DICE SO NICE (DADOS DOURADOS)
// ==========================================

// 1. Cria a paleta de cores dourada no Dice So Nice assim que o módulo de dados iniciar
Hooks.on('diceSoNiceReady', (dice3d) => {
    dice3d.addColorset({
        name: 'candela_gilded',
        description: 'Candela Obscura - Dado Dourado',
        category: 'Candela Obscura',
        foreground: '#FFFFFF', // Números Brancos
        background: '#D4AF37', // Corpo do dado Dourado (Gold metálico)
        outline: '#8B6508',    // Contorno do número em marrom/ouro velho
        edge: '#AA7C11',       // Bordas do dado
        texture: 'none'
    }, "preferred");
});

// 2. Escuta as mensagens do chat e altera a cor do dado se for um teste dourado
Hooks.on('preCreateChatMessage', (document, data, options, userId) => {
    // Se a mensagem não contiver dados matemáticos/rolagens, ignora
    if (!document.rolls || document.rolls.length === 0) return;

    // Obtém o texto descritivo (flavor text) anexado à rolagem
    const flavorText = document.flavor || "";
    
    // Como o seu sistema está traduzido e o chat exibe "dados dourados" (visto nas imagens image_e0b7d7.jpg e image_e0b472.jpg)
    if (flavorText.includes("dados dourados")) {
        
        // Pega a primeira rolagem contida no chat
        const roll = document.rolls[0];
        
        // Altera a propriedade visual de todos os d6 pertencentes a esta rolagem específica
        roll.dice.forEach(dice => {
            if (dice.faces === 6) {
                // Força o Dice So Nice a renderizar usando o set 'candela_gilded' criado acima
                dice.options.colorset = 'candela_gilded';
            }
        });
    }
});
