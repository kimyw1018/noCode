// ---- 상태 ----
const STORAGE_KEYS = { backendUrl: "omechu.backendUrl", favorites: "omechu.favorites" };
let history = []; // [{role: 'user'|'bot', text: string}]
let favorites = loadFavorites();
let lastRandomPick = null;

const RANDOM_MENUS = [
  { name: "김치찌개", category: "한식" },
  { name: "된장찌개", category: "한식" },
  { name: "제육볶음", category: "한식" },
  { name: "비빔밥", category: "한식" },
  { name: "짜장면", category: "중식" },
  { name: "짬뽕", category: "중식" },
  { name: "마라탕", category: "중식" },
  { name: "초밥", category: "일식" },
  { name: "라멘", category: "일식" },
  { name: "돈카츠", category: "일식" },
  { name: "파스타", category: "양식" },
  { name: "스테이크", category: "양식" },
  { name: "피자", category: "양식" },
  { name: "떡볶이", category: "분식" },
  { name: "김밥", category: "분식" },
  { name: "순대", category: "분식" },
  { name: "치킨", category: "야식" },
  { name: "족발", category: "야식" },
  { name: "곱창", category: "야식" },
  { name: "샐러드", category: "기타" },
];

// ---- DOM ----
const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

const favPanel = document.getElementById("favPanel");
const favList = document.getElementById("favList");
const favEmpty = document.getElementById("favEmpty");
const favCount = document.getElementById("favCount");
const favBtn = document.getElementById("favBtn");

const randomModal = document.getElementById("randomModal");
const randomBtn = document.getElementById("randomBtn");
const randomResult = document.getElementById("randomResult");
const spinBtn = document.getElementById("spinBtn");
const favFromRandom = document.getElementById("favFromRandom");

const settingsModal = document.getElementById("settingsModal");
const settingsBtn = document.getElementById("settingsBtn");
const backendUrlInput = document.getElementById("backendUrlInput");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");

// ---- 초기화 ----
renderFavorites();
backendUrlInput.value = getBackendUrl();
if (!localStorage.getItem(STORAGE_KEYS.backendUrl)) {
  openModal(settingsModal);
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(document.getElementById(btn.dataset.close)));
});

// ---- 채팅 ----
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addMessage("user", text);
  history.push({ role: "user", text });

  const typingEl = addTyping();
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(-10) }),
    });
    const data = await res.json();
    typingEl.remove();

    if (!res.ok) {
      addMessage("bot", `⚠️ ${data.error || "서버 오류가 발생했어요."}`);
      return;
    }

    addMessage("bot", data.reply, data.recommendations);
    history.push({ role: "bot", text: data.reply });
  } catch (err) {
    typingEl.remove();
    addMessage(
      "bot",
      "⚠️ 백엔드 서버에 연결할 수 없어요. 우측 상단 ⚙️ 설정에서 서버 주소를 확인해주세요."
    );
  }
});

function addMessage(role, text, recommendations) {
  const wrap = document.createElement("div");
  wrap.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, "<br/>");
  wrap.appendChild(bubble);

  if (Array.isArray(recommendations) && recommendations.length) {
    const cards = document.createElement("div");
    cards.className = "rec-cards";
    recommendations.forEach((rec) => cards.appendChild(buildRecCard(rec)));
    wrap.appendChild(cards);
  }

  chatArea.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addTyping() {
  const wrap = document.createElement("div");
  wrap.className = "message bot";
  wrap.innerHTML = `<div class="bubble typing">오메추가 메뉴를 고민하는 중...</div>`;
  chatArea.appendChild(wrap);
  chatArea.scrollTop = chatArea.scrollHeight;
  return wrap;
}

function buildRecCard(rec) {
  const card = document.createElement("div");
  card.className = "rec-card";
  const isFav = isFavorite(rec.name);

  card.innerHTML = `
    <div class="rec-main">
      <span class="rec-name">${escapeHtml(rec.name || "메뉴")}</span>
      <span class="rec-category">${escapeHtml(rec.category || "")}</span>
      <div class="rec-reason">${escapeHtml(rec.reason || "")}</div>
    </div>
    <button class="star-btn ${isFav ? "active" : ""}">${isFav ? "★" : "☆"}</button>
  `;

  const starBtn = card.querySelector(".star-btn");
  starBtn.addEventListener("click", () => {
    toggleFavorite({ name: rec.name, category: rec.category, reason: rec.reason });
    starBtn.classList.toggle("active");
    starBtn.textContent = starBtn.classList.contains("active") ? "★" : "☆";
  });

  return card;
}

// ---- 즐겨찾기 (추가 기능 1) ----
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  favCount.textContent = favorites.length;
}

function isFavorite(name) {
  return favorites.some((f) => f.name === name);
}

function toggleFavorite(item) {
  if (isFavorite(item.name)) {
    favorites = favorites.filter((f) => f.name !== item.name);
  } else {
    favorites.push(item);
  }
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  favList.innerHTML = "";
  favCount.textContent = favorites.length;
  favEmpty.style.display = favorites.length ? "none" : "block";

  favorites.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(item.name)} <small style="opacity:.6">${escapeHtml(item.category || "")}</small></span>
      <button class="remove-btn">✕</button>
    `;
    li.querySelector(".remove-btn").addEventListener("click", () => {
      favorites = favorites.filter((f) => f.name !== item.name);
      saveFavorites();
      renderFavorites();
    });
    favList.appendChild(li);
  });
}

favBtn.addEventListener("click", () => openPanel(favPanel));

// ---- 랜덤 메뉴 룰렛 (추가 기능 2) ----
randomBtn.addEventListener("click", () => {
  randomResult.textContent = "버튼을 눌러 랜덤 메뉴를 뽑아보세요!";
  favFromRandom.disabled = true;
  lastRandomPick = null;
  openModal(randomModal);
});

spinBtn.addEventListener("click", () => {
  randomResult.textContent = "🎲 돌리는 중...";
  let ticks = 0;
  const interval = setInterval(() => {
    const pick = RANDOM_MENUS[Math.floor(Math.random() * RANDOM_MENUS.length)];
    randomResult.textContent = `${pick.name} (${pick.category})`;
    ticks++;
    if (ticks > 12) {
      clearInterval(interval);
      lastRandomPick = pick;
      favFromRandom.disabled = false;
    }
  }, 80);
});

favFromRandom.addEventListener("click", () => {
  if (!lastRandomPick) return;
  toggleFavorite({ name: lastRandomPick.name, category: lastRandomPick.category, reason: "랜덤 룰렛으로 뽑은 메뉴" });
  favFromRandom.textContent = isFavorite(lastRandomPick.name) ? "⭐ 즐겨찾기 완료" : "⭐ 즐겨찾기 추가";
});

// ---- 설정 (백엔드 주소) ----
settingsBtn.addEventListener("click", () => {
  backendUrlInput.value = getBackendUrl();
  openModal(settingsModal);
});

saveSettingsBtn.addEventListener("click", () => {
  const url = backendUrlInput.value.trim().replace(/\/+$/, "");
  if (url) localStorage.setItem(STORAGE_KEYS.backendUrl, url);
  closeModal(settingsModal);
});

function getBackendUrl() {
  return localStorage.getItem(STORAGE_KEYS.backendUrl) || "http://localhost:3000";
}

// ---- 공통 유틸 ----
function openModal(modal) { modal.classList.remove("hidden"); }
function closeModal(modal) { modal.classList.add("hidden"); }
function openPanel(panel) { panel.classList.remove("hidden"); }

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
