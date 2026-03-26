const apiStatus = document.getElementById("apiStatus");
const apiBaseInput = document.getElementById("apiBase");
const saveApiButton = document.getElementById("saveApi");
const filterAll = document.getElementById("filterAll");
const filterUnread = document.getElementById("filterUnread");
const refreshNow = document.getElementById("refreshNow");
const markAll = document.getElementById("markAll");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const errorBox = document.getElementById("error");
const summary = document.getElementById("summary");
const lastUpdated = document.getElementById("lastUpdated");

const DEFAULT_API_BASE = "http://localhost:5000";
const API_KEY = "shiftlog_notification_api";

let mode = "all";
let notifications = [];

const getApiBase = () => {
  return localStorage.getItem(API_KEY) || DEFAULT_API_BASE;
};

const setApiBase = (value) => {
  localStorage.setItem(API_KEY, value);
};

const formatTime = (value) => {
  const date = new Date(value);
  return date.toLocaleString();
};

const setStatus = (state) => {
  apiStatus.classList.remove("online", "offline");
  if (state === "online") {
    apiStatus.classList.add("online");
    apiStatus.textContent = "API online";
  } else if (state === "offline") {
    apiStatus.classList.add("offline");
    apiStatus.textContent = "API offline";
  } else {
    apiStatus.textContent = "Checking API...";
  }
};

const showError = (message) => {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
};

const clearError = () => {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
};

const updateSummary = () => {
  const visible = notifications.filter((item) => mode === "all" || !item.read);
  summary.textContent = `${visible.length} notification${visible.length === 1 ? "" : "s"}`;
  empty.classList.toggle("hidden", visible.length !== 0);
};

const render = () => {
  list.innerHTML = "";

  const items = notifications.filter((item) => mode === "all" || !item.read);

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = `card ${item.type || "info"}`;

    const header = document.createElement("div");
    header.className = "card-header";

    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = item.title || "Notification";

    const badge = document.createElement("span");
    badge.className = `badge ${item.read ? "read" : ""}`;
    badge.textContent = item.read ? "read" : "unread";

    header.appendChild(title);
    header.appendChild(badge);

    const desc = document.createElement("p");
    desc.className = "card-desc";
    desc.textContent = item.desc || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `<span>${item.type || "info"}</span><span>${formatTime(item.createdAt)}</span><span>${item.source || "system"}</span>`;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const toggle = document.createElement("button");
    toggle.className = "secondary";
    toggle.textContent = item.read ? "Mark unread" : "Mark read";
    toggle.addEventListener("click", () => toggleRead(item));

    actions.appendChild(toggle);

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(meta);
    card.appendChild(actions);

    list.appendChild(card);
  });

  updateSummary();
};

const fetchNotifications = async () => {
  clearError();
  setStatus("checking");

  const apiBase = getApiBase();

  try {
    const response = await fetch(`${apiBase}/`);
    setStatus(response.ok ? "online" : "offline");
    if (!response.ok) {
      throw new Error("Backend not reachable");
    }

    const query = mode === "unread" ? "?unread=true" : "";
    const data = await fetch(`${apiBase}/api/notifications${query}`).then((res) => {
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      return res.json();
    });

    notifications = data;
    render();
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    setStatus("offline");
    showError(err.message || "Failed to fetch notifications.");
  }
};

const toggleRead = async (item) => {
  const apiBase = getApiBase();
  try {
    await fetch(`${apiBase}/api/notifications/${item._id}/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: !item.read })
    });
    item.read = !item.read;
    render();
  } catch {
    showError("Failed to update notification status.");
  }
};

const markAllRead = async () => {
  const apiBase = getApiBase();
  try {
    await fetch(`${apiBase}/api/notifications/mark-all-read`, { method: "POST" });
    notifications = notifications.map((item) => ({ ...item, read: true }));
    render();
  } catch {
    showError("Failed to mark all as read.");
  }
};

filterAll.addEventListener("click", () => {
  mode = "all";
  filterAll.classList.add("active");
  filterUnread.classList.remove("active");
  render();
});

filterUnread.addEventListener("click", () => {
  mode = "unread";
  filterUnread.classList.add("active");
  filterAll.classList.remove("active");
  render();
});

refreshNow.addEventListener("click", fetchNotifications);
markAll.addEventListener("click", markAllRead);

saveApiButton.addEventListener("click", () => {
  const value = apiBaseInput.value.trim();
  if (value) {
    setApiBase(value);
  }
  fetchNotifications();
});

apiBaseInput.value = getApiBase();

fetchNotifications();
setInterval(fetchNotifications, 15000);
