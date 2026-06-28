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

const CANDELA_CLASSICO_SIZE = Object.freeze({ width: 900, height: 740 });
const LOCKED_WINDOWS = new WeakSet();
let lockTimer = null;

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
    || !!root?.querySelector?.("[data-action], .sheet-tabs, .tabs, input[name^='system.']");
}

function isCandelaActorSheet(app) {
  const docName = String(app?.object?.documentName ?? app?.actor?.documentName ?? "").toLowerCase();
  const actorType = String(app?.actor?.type ?? app?.object?.type ?? "").toLowerCase();
  return game?.system?.id === "candelafvtt" && (docName === "actor" || actorType === "character");
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

function applyCandelaClassic(app, element) {
  if (!isCandelaApplication(app, element)) return;

  const root = getRoot(element) ?? getRoot(app?.element);
  const win = getAppWindow(app, root);
  if (!root || !win) return;

  translateCandelaSheet(root);

  if (isCandelaActorSheet(app)) {
    root.classList.add("candela-classico-sheet-root");
    applyLockedSize(app, win);
  }
}

Hooks.once("ready", () => {
  console.log("Candela Obscura PT-BR - Ficha Clássica | Tema ativo.");
});

Hooks.on("renderActorSheet", (app, html) => applyCandelaClassic(app, html));
Hooks.on("renderItemSheet", (app, html) => applyCandelaClassic(app, html));
Hooks.on("renderApplicationV2", (app, element) => applyCandelaClassic(app, element));
