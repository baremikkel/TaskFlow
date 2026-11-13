const API = "/api/tasks";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const list = document.getElementById("task-list");
const template = document.getElementById("task-template");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const counterEl = document.getElementById("counter");

const dateFormat = new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" });

let tasks = [];

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Fejl ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function sortTasks() {
  tasks.sort((a, b) =>
    a.is_completed - b.is_completed || new Date(b.created_at) - new Date(a.created_at)
  );
}

function render() {
  list.replaceChildren(
    ...tasks.map((task) => {
      const li = template.content.firstElementChild.cloneNode(true);
      li.dataset.id = task.id;
      li.classList.toggle("done", task.is_completed);
      li.querySelector(".toggle").checked = task.is_completed;
      li.querySelector(".title").textContent = task.title;
      li.querySelector(".description").textContent = task.description ?? "";
      const time = li.querySelector(".date");
      time.dateTime = task.created_at;
      time.textContent = dateFormat.format(new Date(task.created_at));
      return li;
    })
  );
  emptyEl.hidden = tasks.length > 0;
  const remaining = tasks.filter((t) => !t.is_completed).length;
  counterEl.textContent = tasks.length ? `${remaining} af ${tasks.length} tilbage` : "";
}

// READ
async function loadTasks() {
  try {
    tasks = await request(API);
    render();
  } catch (err) {
    showError(`Kunne ikke hente opgaver: ${err.message}`);
  }
}

// CREATE
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const task = await request(API, {
      method: "POST",
      body: JSON.stringify({ title, description: descInput.value }),
    });
    tasks.push(task);
    sortTasks();
    render();
    form.reset();
    titleInput.focus();
    showError("");
  } catch (err) {
    showError(`Kunne ikke oprette opgave: ${err.message}`);
  } finally {
    button.disabled = false;
  }
});

// UPDATE (toggle) og DELETE via event delegation
list.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("toggle")) return;
  const id = Number(e.target.closest(".task").dataset.id);
  try {
    const updated = await request(`${API}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_completed: e.target.checked }),
    });
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    sortTasks();
    render();
    showError("");
  } catch (err) {
    e.target.checked = !e.target.checked;
    showError(`Kunne ikke opdatere opgave: ${err.message}`);
  }
});

list.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete")) return;
  const id = Number(e.target.closest(".task").dataset.id);
  try {
    await request(`${API}/${id}`, { method: "DELETE" });
    tasks = tasks.filter((t) => t.id !== id);
    render();
    showError("");
  } catch (err) {
    showError(`Kunne ikke slette opgave: ${err.message}`);
  }
});

loadTasks();
