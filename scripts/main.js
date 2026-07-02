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

const CANDELA_CLASSICO_SIZE = Object.freeze({ width: 680, height: 920 });
const LOCKED_WINDOWS = new WeakSet();
let lockTimer = null;

// Estado do cadeado por ator
const coLockState = {};

function getRoot(element) {
  if (!element) return null;
  if (element instanceof HTMLElement) return element;
  if (Array.isArray(element)) return element[0] ?? null;
  if (element[0] instanceof HTMLElement) return element[0];
  return null;
}

function getAppWindow(app, element) {
  const root = getRoot(element) ?? getRoot(app?.element);
  if (!root) return getRoot(app?.element);
  return root.closest?.(".app, .application, .window-app") ?? root;
}

function isCandelaApplication(app, element) {
  const systemId = game?.system?.id;
  if (systemId !== "candelafvtt") return false;

  const root = getRoot(element) ?? getRoot(app?.element);
  const appName = String(app?.constructor?.name ?? "").toLowerCase();
  const actorType = String(app?.actor?.type ?? app?.object?.type ?? "").toLowerCase();
  const docName = String(app?.object?.documentName ?? app?.actor?.documentName ?? "").toLowerCase();

  return appName.includes("candela")
    || appName.includes("actor")
    || appName.includes("item")
    || docName === "actor"
    || docName === "item"
    || actorType === "character"
    || actorType === "circle"
    || !!root?.querySelector?.("[data-action], .sheet-tabs, .tabs, input[name^='system.']");
}

function isCandelaActorSheet(app) {
  const docName = String(app?.object?.documentName ?? app?.actor?.documentName ?? "").toLowerCase();
  const actorType = String(app?.actor?.type ?? app?.object?.type ?? "").toLowerCase();
  return game?.system?.id === "candelafvtt" && (docName === "actor" || docName === "item") && actorType === "character";
}

// Ficha de Círculo (grupo) — mesma família de sheets, tipo de ator diferente
function isCandelaCircleSheet(app) {
  const docName = String(app?.object?.documentName ?? app?.actor?.documentName ?? "").toLowerCase();
  const actorType = String(app?.actor?.type ?? app?.object?.type ?? "").toLowerCase();
  return game?.system?.id === "candelafvtt" && docName === "actor" && actorType === "circle";
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

function applyLockedSize(app, windowElement) {
  if (!windowElement || !isCandelaActorSheet(app)) return;

  const { width, height } = CANDELA_CLASSICO_SIZE;
  windowElement.classList.add("candela-classico-window", "candela-classico-locked");
  windowElement.dataset.candelaLockedWidth = String(width);
  windowElement.dataset.candelaLockedHeight = String(height);

  try {
    if (app?.options) app.options.resizable = false;
    if (typeof app?.setPosition === "function") app.setPosition({ width, height });
  } catch (err) {
    console.warn("Candela Clássico | Não foi possível aplicar setPosition.", err);
  }

  Object.assign(windowElement.style, {
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
    height: `${height}px`,
    minHeight: `${height}px`,
    maxHeight: `${height}px`,
    resize: "none"
  });

  windowElement.querySelectorAll(".window-resizable-handle, .resize-handle, [data-resize-handle]").forEach((handle) => {
    handle.remove();
  });

  if (LOCKED_WINDOWS.has(windowElement)) return;
  LOCKED_WINDOWS.add(windowElement);

  const observer = new MutationObserver(() => {
    if (lockTimer) return;
    lockTimer = window.setTimeout(() => {
      lockTimer = null;
      if (!document.body.contains(windowElement)) {
        observer.disconnect();
        return;
      }
      if (windowElement.offsetWidth !== width || windowElement.offsetHeight !== height) {
        applyLockedSize(app, windowElement);
      }
    }, 80);
  });

  observer.observe(windowElement, { attributes: true, attributeFilter: ["style", "class"] });
}

// ══════════════════════════════════════════════
//  REESTRUTURAÇÃO DO CABEÇALHO (robusta a mudanças de HTML)
//
//  Em vez de confiar em grid-template-columns fixo (que quebra
//  se a ordem/estrutura do HTML gerado pelo sistema mudar), o
//  cabeçalho é remontado fisicamente em 3 blocos:
//    .co-header-photo  -> a foto
//    .co-header-mid    -> nome, pronomes/chapter house, papel/especialidade
//    .co-header-right  -> recursos (Corpo/Mente/Sangria ou Curar/Descansar/Treinar)
//  O CSS só precisa estilizar esses 3 blocos com flexbox simples.
// ══════════════════════════════════════════════

function moveIfExists(el, target) {
  if (el) target.appendChild(el);
}

// Remove a "/" que o sistema imprime antes do valor máximo dos
// recursos (Corpo/Mente/Sangria), deixando só o número.
function coLimparBarraMaximo(root) {
  root.querySelectorAll(".mark-content span[name$='.max'], .resource-content span.flexrow").forEach((span) => {
    span.textContent = span.textContent.replace(/^\s*\/\s*/, "");
  });
}

function restructureCandelaHeader(app, root, kind) {
  const header = root.querySelector(".sheet-header");
  if (!header) return;
  if (header.dataset.coRestructured === "true") return;

  const photo = header.querySelector("img.profile-img");
  if (!photo) return; // estrutura desconhecida — não mexe para não quebrar mais

  const left = document.createElement("div");
  left.className = "co-header-photo";

  const mid = document.createElement("div");
  mid.className = "co-header-mid";

  const right = document.createElement("div");
  right.className = "co-header-right";

  moveIfExists(photo, left);

  if (kind === "character") {
    const nameField = header.querySelector(".charname") ?? header.querySelector("input[name='name']");
    const pronounsField = header.querySelector(".pronouns") ?? header.querySelector("input[name='system.pronouns']");
    const role = header.querySelector(".role");
    const specialty = header.querySelector(".specialty");
    const resources = header.querySelector(".resources");

    // A foto já foi movida para "left" acima e agora preenche
    // sozinha toda a coluna esquerda do cabeçalho.

    moveIfExists(nameField, mid);
    moveIfExists(pronounsField, mid);

    // Papel e Especialidade viram dois campos com rótulo em cima
    // (Papel / Estranho, Especialidade / Ocultista), abaixo do nome.
    const roleField = document.createElement("div");
    roleField.className = "co-trait-field";
    roleField.dataset.label = "Papel";
    moveIfExists(role, roleField);
    mid.appendChild(roleField);

    const specialtyField = document.createElement("div");
    specialtyField.className = "co-trait-field";
    specialtyField.dataset.label = "Especialidade";
    moveIfExists(specialty, specialtyField);
    mid.appendChild(specialtyField);

    moveIfExists(resources, right);
  } else if (kind === "circle") {
    const nameField = header.querySelector(".charname") ?? header.querySelector("input[name='name']");
    const chapterRow = header.querySelector(".grid.grid-8col")
      ?? header.querySelector(".chapterhouse")?.closest("div")
      ?? header.querySelector("input[name='system.chapterHouse']")?.closest("div");
    const resources = header.querySelector(".resources");

    moveIfExists(nameField, mid);
    moveIfExists(chapterRow, mid);
    moveIfExists(resources, right);
  }

  // Qualquer coisa que tenha sobrado no header (wrappers vazios, elementos
  // não previstos) é preservada dentro de .co-header-mid em vez de perdida.
  Array.from(header.children).forEach((child) => {
    mid.appendChild(child);
  });

  header.innerHTML = "";
  header.appendChild(left);
  header.appendChild(mid);
  header.appendChild(right);
  header.classList.add("co-header-restructured");
  header.dataset.coRestructured = "true";
}

function applyCandelaClassic(app, element) {
  if (!isCandelaApplication(app, element)) return;

  const root = getRoot(element) ?? getRoot(app?.element);
  const win = getAppWindow(app, root);
  if (!root || !win) return;

  translateCandelaSheet(root);

  const isCharacterSheet = isCandelaActorSheet(app);
  const isCircleSheet = isCandelaCircleSheet(app);

  if (isCharacterSheet || isCircleSheet) {
    win.classList.add("candela-classico-window");
    root.classList.add("candela-classico-sheet-root");
    restructureCandelaHeader(app, root, isCircleSheet ? "circle" : "character");
    coLimparBarraMaximo(root);
  }

  if (isCharacterSheet) {
    applyLockedSize(app, win);
  }
}

// ══════════════════════════════════════════════
//  CADEADO DE TRAVAMENTO DA FICHA
// ══════════════════════════════════════════════

function coAplicarTravamento(html, travar) {
  // Inputs FIXOS — definidos na criação da ficha, bloqueados quando travado
  // (score de cada ação, valores máximos dos recursos, nome do personagem)
  const fixos = html.querySelectorAll([
    "input.action-value",
    "input[name$='.max']",
    "input[name='name']",
  ].join(","));

  fixos.forEach(el => {
    el.readOnly = travar;
    el.style.pointerEvents = travar ? "none" : "";
    el.style.opacity = travar ? "0.5" : "";
    el.style.cursor = travar ? "not-allowed" : "";
  });

  // Checkbox do dado dourado (marca em qual ação ele fica) — checkbox não
  // respeita "readOnly", então usamos "disabled" para travar de verdade.
  const dadoDourado = html.querySelectorAll(".action-checkbox-icon input[type='checkbox']");
  dadoDourado.forEach(el => {
    el.disabled = travar;
    el.style.pointerEvents = travar ? "none" : "";
    el.style.opacity = travar ? "0.5" : "";
    el.style.cursor = travar ? "not-allowed" : "";
  });

  // Inputs EDITÁVEIS — sempre liberados (impulsos, resistências gastas, marks)
  const editaveis = html.querySelectorAll([
    "input.actioncategory-value",
    "input[name$='.value']",
    "input[name='system.pronouns']",
  ].join(","));

  editaveis.forEach(el => {
    el.readOnly = false;
    el.style.pointerEvents = "";
    el.style.opacity = "";
    el.style.cursor = "";
  });
}

function coInjetarCadeado(app, html) {
  // Só para fichas de personagem Character
  if (app?.actor?.type !== "Character") return;

  const header = html.querySelector(".sheet-header");
  if (!header) return;
  if (html.querySelector(".co-lock-btn")) return; // já existe

  const win = getAppWindow(app, html);
  const right = header.querySelector(".co-header-right");
  const actorId = app?.actor?.id;
  const locked = coLockState[actorId] ?? false;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "co-lock-btn" + (locked ? " locked" : "");
  btn.title = locked ? "Ficha travada — clique para destravar" : "Clique para travar os valores fixos";
  btn.innerHTML = `<i class="fa-solid ${locked ? "fa-lock" : "fa-lock-open"}"></i>`;

  // Botão vai no topo do bloco de recursos (direita), acima de Corpo/Mente/Sangria.
  // Se por algum motivo o cabeçalho não foi reestruturado ainda, cai no fallback antigo.
  if (right) {
    right.insertBefore(btn, right.firstChild);
  } else {
    header.style.position = "relative";
    header.appendChild(btn);
  }

  // Aplica estado inicial
  win?.classList.toggle("co-locked", locked);
  if (locked) coAplicarTravamento(html, true);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const novoEstado = !coLockState[actorId];
    coLockState[actorId] = novoEstado;

    btn.classList.toggle("locked", novoEstado);
    btn.title = novoEstado
      ? "Ficha travada — clique para destravar"
      : "Clique para travar os valores fixos";

    const icon = btn.querySelector("i");
    icon.className = `fa-solid ${novoEstado ? "fa-lock" : "fa-lock-open"}`;

    win?.classList.toggle("co-locked", novoEstado);
    coAplicarTravamento(html, novoEstado);
  });
}

// Fix: última ação (Sentir) não fica cortada
function coFixSentir(html) {
  const lista = html.querySelectorAll("ol.actions-list");
  if (lista.length) {
    lista[lista.length - 1].style.marginBottom = "12px";
  }
}

// ══════════════════════════════════════════════
//  HOOKS PRINCIPAIS
// ══════════════════════════════════════════════

Hooks.once("ready", () => {
  console.log("Candela Obscura PT-BR - Ficha Clássica | Tema ativo.");
});

Hooks.on("renderActorSheet", (app, html) => {
  const element = getRoot(html);
  applyCandelaClassic(app, html);
  if (element) {
    coInjetarCadeado(app, element);
    coFixSentir(element);
  }
});

Hooks.on("renderItemSheet", (app, html) => applyCandelaClassic(app, html));
Hooks.on("renderApplicationV2", (app, element) => applyCandelaClassic(app, element));

// ══════════════════════════════════════════════
//  DADO DOURADO — DSN
// ══════════════════════════════════════════════

Hooks.on('diceSoNiceReady', (dice3d) => {
  dice3d.addColorset({
    name: 'candela_gilded',
    description: 'Candela Obscura - Dado Dourado',
    category: 'Candela Obscura',
    foreground: '#FFFFFF',
    background: '#D4AF37',
    outline: '#8B6508',
    edge: '#AA7C11',
    texture: 'none'
  }, "preferred");
});

Hooks.on('diceSoNiceRollStart', (messageId, diceData) => {
  const chatMessage = game.messages.get(messageId);
  if (!chatMessage || !chatMessage.rolls || !diceData.throws || !diceData.throws[0]) return;

  let flatDieIndex = 0;
  const currentThrow = diceData.throws[0];

  chatMessage.rolls.forEach(roll => {
    roll.terms.forEach(term => {
      if (!term.results) return;

      const isGilded = term.faces === 6 &&
        term.options &&
        term.options.flavor &&
        (term.options.flavor.toLowerCase().includes("dourado") ||
         term.options.flavor.toLowerCase().includes("gilded"));

      term.results.forEach(() => {
        if (isGilded && currentThrow.dice[flatDieIndex]) {
          currentThrow.dice[flatDieIndex].colorset = 'candela_gilded';
        }
        flatDieIndex++;
      });
    });
  });
});
