const seedFiles = [
  {
    path: "README.md",
    content: `# Model Playground

Mali workspace za eksperimente s različitim AI agentima.

## Ideja
- Isprobaj promptove i male prototipe.
- Odaberi aktivnog agenta prije spremanja izmjene.
- Pregledaj historiju promjena u desnom panelu.

Izmjene se čuvaju lokalno u pregledniku ovog uređaja.`,
  },
  {
    path: "src/experiment.py",
    content: `def score_idea(clarity, usefulness, novelty):
    """Jednostavan primjer za poređenje ideja."""
    weights = {
        "clarity": 0.30,
        "usefulness": 0.45,
        "novelty": 0.25,
    }

    return (
        clarity * weights["clarity"]
        + usefulness * weights["usefulness"]
        + novelty * weights["novelty"]
    )


if __name__ == "__main__":
    print(score_idea(8, 9, 7))`,
  },
  {
    path: "prompts/reviewer.md",
    content: `# Reviewer prompt

Pregledaj ideju kao pažljiv, konstruktivan saradnik.

1. Ukratko opiši šta ideja pokušava riješiti.
2. Navedi jednu stvar koja već dobro funkcioniše.
3. Pronađi najveću nejasnoću ili rizik.
4. Predloži sljedeći mali eksperiment.

Odgovaraj konkretno i bez pretpostavki o korisniku.`,
  },
  {
    path: "notes/ideas.txt",
    content: `Ideje za sljedeći eksperiment
==============================\n\n- Uporediti kratki i detaljni prompt\n- Tražiti od dva modela da pregledaju isti primjer\n- Zabilježiti gdje se njihovi prijedlozi razlikuju\n- Mjeriti korisnost, ne samo dužinu odgovora\n`,
  },
  {
    path: "config.json",
    content: `{
  "project": "model-playground",
  "purpose": "sigurno eksperimentisanje",
  "agents": ["Codex", "Claude", "Copilot", "Gemini"],
  "saveHistory": true
}`,
  },
];

const STORAGE_KEY = "model-playground-v1";
const seededHistory = [
  { agent: "Codex", path: "src/experiment.py", summary: "Dodao funkciju za bodovanje", time: Date.now() - 1000 * 60 * 18 },
  { agent: "Claude", path: "prompts/reviewer.md", summary: "Doradio korake pregleda", time: Date.now() - 1000 * 60 * 55 },
  { agent: "Copilot", path: "README.md", summary: "Postavio opis projekta", time: Date.now() - 1000 * 60 * 60 * 3 },
];

const fileList = document.querySelector("#file-list");
const editor = document.querySelector("#file-editor");
const search = document.querySelector("#file-search");
const agentSelect = document.querySelector("#agent-select");
const saveButton = document.querySelector("#save-button");

function loadWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.files && typeof saved.files === "object" && !Array.isArray(saved.files)) {
      const defaults = Object.fromEntries(seedFiles.map((file) => [file.path, file.content]));
      const files = Object.fromEntries(
        Object.entries(saved.files).filter(([, content]) => typeof content === "string"),
      );
      const history = Array.isArray(saved.history)
        ? saved.history.filter((entry) =>
            entry && typeof entry.agent === "string" && typeof entry.path === "string"
            && typeof entry.summary === "string" && Number.isFinite(entry.time),
          )
        : [];
      return { files: { ...defaults, ...files }, history };
    }
  } catch (error) {
    console.warn("Nije moguće pročitati sačuvani workspace.", error);
  }
  return {
    files: Object.fromEntries(seedFiles.map((file) => [file.path, file.content])),
    history: seededHistory,
  };
}

const workspace = loadWorkspace();
let activePath = seedFiles[0].path;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch (error) {
    console.error("Nije moguće sačuvati workspace u ovom pregledniku.", error);
    alert("Izmjene nisu sačuvane. Provjeri dozvole i prostor za lokalnu pohranu preglednika.");
    return false;
  }
  return true;
}

function iconFor(path) {
  const extension = path.split(".").pop();
  return { md: "M", py: "Py", json: "{}", txt: "T" }[extension] || "F";
}

function renderFiles() {
  const query = search.value.trim().toLowerCase();
  const paths = Object.keys(workspace.files).filter((path) => path.toLowerCase().includes(query));
  fileList.replaceChildren();
  paths.forEach((path) => {
    const extension = path.split(".").pop();
    const button = document.createElement("button");
    button.type = "button";
    button.className = `file-item${path === activePath ? " active" : ""}`;
    button.dataset.ext = extension;
    button.setAttribute("aria-current", path === activePath ? "page" : "false");
    const icon = document.createElement("span");
    icon.className = "file-icon";
    icon.textContent = iconFor(path);
    const name = document.createElement("span");
    name.textContent = path;
    button.append(icon, name);
    if (workspace.history.some((entry) => entry.path === path)) {
      const dot = document.createElement("span");
      dot.className = "changed-dot";
      dot.setAttribute("aria-label", "Ima zabilježenu aktivnost");
      button.append(dot);
    }
    button.addEventListener("click", () => selectFile(path));
    fileList.append(button);
  });
  document.querySelector("#file-count").textContent = `${Object.keys(workspace.files).length} FAJLOVA`;
}

function selectFile(path) {
  if (typeof workspace.files[path] !== "string") return;
  activePath = path;
  editor.value = workspace.files[path];
  updateEditor();
  renderFiles();
}

function updateEditor() {
  const extension = activePath.split(".").pop();
  document.querySelector("#active-path").textContent = activePath;
  document.querySelector("#file-type").textContent = extension.toUpperCase();
  const lines = editor.value.split("\n").length;
  const lineWord = lines === 1 ? "red" : lines < 5 ? "reda" : "redova";
  document.querySelector("#line-count").textContent = `${lines} ${lineWord}`;
  document.querySelector("#footer-agent").textContent = agentSelect.value;
  const changed = editor.value !== workspace.files[activePath];
  document.querySelector("#unsaved-indicator").hidden = !changed;
  saveButton.disabled = !changed;
  const lastChange = workspace.history.find((entry) => entry.path === activePath);
  document.querySelector("#last-updated").textContent = lastChange
    ? `Zadnje: ${lastChange.agent} · ${formatTime(lastChange.time)}`
    : "Ogledni fajl";
}

function formatTime(timestamp) {
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60000) return "upravo";
  if (elapsed < 3600000) return `prije ${Math.floor(elapsed / 60000)} min`;
  if (elapsed < 86400000) return `prije ${Math.floor(elapsed / 3600000)} h`;
  return new Date(timestamp).toLocaleDateString("hr-HR");
}

function summarizeChange(before, after) {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  let start = 0;
  while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start += 1;
  let oldEnd = oldLines.length - 1;
  let newEnd = newLines.length - 1;
  while (oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
    oldEnd -= 1;
    newEnd -= 1;
  }
  const changed = Math.max(1, oldEnd - start + 1, newEnd - start + 1);
  return `${changed} ${changed === 1 ? "red" : "redova"} · sadržaj ažuriran`;
}

function renderHistory() {
  const container = document.querySelector("#history-list");
  container.replaceChildren();
  const entries = workspace.history.slice(0, 8);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Još nema izmjena. Uredi fajl i sačuvaj ga da započneš historiju.";
    container.append(empty);
    return;
  }
  entries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = `history-entry${entry.before !== undefined && entry.after !== undefined ? " clickable" : ""}`;
    if (entry.before !== undefined && entry.after !== undefined) {
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", `Pregledaj izmjenu fajla ${entry.path}`);
      item.addEventListener("click", () => openDiff(entry));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDiff(entry);
        }
      });
    }
    const avatar = document.createElement("span");
    avatar.className = "history-avatar";
    avatar.textContent = entry.agent.slice(0, 1).toUpperCase();
    const main = document.createElement("div");
    main.className = "history-main";
    const title = document.createElement("p");
    title.className = "history-title";
    const agent = document.createElement("strong");
    agent.textContent = entry.agent;
    title.append(agent, document.createTextNode(` izmijenio ${entry.path.split("/").pop()}`));
    const detail = document.createElement("p");
    detail.className = "history-detail";
    detail.textContent = entry.summary;
    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = formatTime(entry.time);
    main.append(title, detail, time);
    item.append(avatar, main);
    container.append(item);
  });
}

editor.addEventListener("input", () => {
  updateEditor();
});
agentSelect.addEventListener("change", updateEditor);
search.addEventListener("input", renderFiles);
saveButton.addEventListener("click", () => {
  if (editor.value === workspace.files[activePath]) return;
  const before = workspace.files[activePath];
  const after = editor.value;
  const previousHistory = workspace.history;
  workspace.files[activePath] = after;
  workspace.history.unshift({
    agent: agentSelect.value,
    path: activePath,
    summary: summarizeChange(before, after),
    time: Date.now(),
    before,
    after,
  });
  workspace.history = workspace.history.slice(0, 40);
  if (!persist()) {
    workspace.files[activePath] = before;
    workspace.history = previousHistory;
    return;
  }
  updateEditor();
  renderFiles();
  renderHistory();
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    search.focus();
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    saveButton.click();
  }
});

renderFiles();
renderHistory();
selectFile(activePath);
