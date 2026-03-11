/**
 * КЛИЕНТСКАЯ ЛОГИКА САЙТА НПО МЕЛОДИЯ
 * Оптимизировано: параллельная загрузка и кэширование данных.
 */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad2 = (n) => String(n).padStart(2, "0");

const ASSET_PREFIX = ""; [span_1](start_span)// Префикс для путей к картинкам[span_1](end_span)

const monthsRu = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const fmtDT = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

const sortAsc = (arr, key) => [...arr].sort((a, b) => new Date(a[key]) - new Date(b[key]));

[span_2](start_span)// Основной объект данных[span_2](end_span)
let data = {
  events: [],
  artists: [],
  releases: [],
  podcasts: [],
  streams: [],
  merch: []
};

const CLUB_TOKEN_KEY = "npo_club_token_v1";
const ARTISTS_VISIBLE = 6;

// --- УТИЛИТЫ ---

const el = (tag, { className, text } = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const safeHttpUrl = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
};

const createTag = (text) => el("span", { className: "tag", text: String(text || "").trim() || "—" });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- КЛУБНАЯ ЗОНА (AUTH) ---

let clubSession = null;

function renderExclusiveItems(items = []) {
  const exclusiveContent = $("#exclusiveContent");
  if (!exclusiveContent) return;
  exclusiveContent.replaceChildren();

  items.forEach((item) => {
    const card = el("div", { className: "card pad" });
    card.appendChild(el("b", { text: item.title || "Эксклюзив" }));
    const desc = el("div", { className: "muted", text: item.description || "" });
    desc.style.marginTop = "6px";
    card.appendChild(desc);
    exclusiveContent.appendChild(card);
  });
}

function renderClubAccess() {
  const authGuest = $("#authGuest");
  const authMember = $("#authMember");
  const memberName = $("#memberName");
  const authStatus = $("#authStatus");
  const exclusiveLocked = $("#exclusiveLocked");
  const exclusiveContent = $("#exclusiveContent");
  const exclusiveBadge = $("#exclusiveBadge");

  const isAuthorized = Boolean(clubSession?.email);

  if (authGuest) authGuest.style.display = isAuthorized ? "none" : "grid";
  if (authMember) authMember.style.display = isAuthorized ? "block" : "none";
  if (memberName) memberName.textContent = clubSession?.name || clubSession?.email || "участник";

  if (exclusiveLocked) exclusiveLocked.style.display = isAuthorized ? "none" : "block";
  if (exclusiveContent) exclusiveContent.style.display = isAuthorized ? "block" : "none";
  if (exclusiveBadge) exclusiveBadge.textContent = isAuthorized ? "открыт" : "закрыт";

  if (authStatus) {
    authStatus.textContent = isAuthorized ? "Доступ к эксклюзиву активен." : "Доступ к эксклюзиву закрыт.";
  }
}

function setClubStatus(message) {
  const authStatus = $("#authStatus");
  if (authStatus && message) authStatus.textContent = message;
}

async function refreshClubSession() {
  try {
    const session = await window.dbLayer.getSession();
    if (!session) {
      clubSession = null;
      renderClubAccess();
      return;
    }
    clubSession = {
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email
    };
    const mockExclusive = [
      { title: 'Early Access: NPO VA 002', description: 'Превью треков + закрытый pre-save.' },
      { title: 'Private Stream Archive', description: 'Закрытые записи из ночных сетов.' },
      { title: 'Members Promo Code', description: 'Скидка 15% на мерч и закрытые дропы.' }
    ];
    renderExclusiveItems(mockExclusive);
    renderClubAccess();
  } catch (err) {
    clubSession = null;
    renderClubAccess();
  }
}

function initClubAuth() {
  const registerForm = $("#registerForm");
  const loginForm = $("#loginForm");
  const logoutBtn = $("#logoutBtn");

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = form.elements.name?.value.trim();
    const email = normalizeEmail(form.elements.email?.value);
    const password = form.elements.password?.value;

    try {
      await window.dbLayer.register(email, password, name);
      const session = await window.dbLayer.getSession();
      clubSession = { email: session.user.email, name: session.user.user_metadata?.name || name };
      renderClubAccess();
    } catch (err) {
      setClubStatus(err.message);
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = normalizeEmail(e.currentTarget.elements.email?.value);
    const password = e.currentTarget.elements.password?.value;
    try {
      await window.dbLayer.login(email, password);
      const session = await window.dbLayer.getSession();
      clubSession = { email: session.user.email, name: session.user.user_metadata?.name || email };
      renderClubAccess();
    } catch (err) {
      setClubStatus("Неверный email или пароль.");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await window.dbLayer.logout();
    clubSession = null;
    renderClubAccess();
  });

  refreshClubSession();
}

// --- ОТРИСОВКА (RENDERING) ---

function setupOpenCard(node, type, id) {
  if (!node) return;
  node.classList.add("open-card");
  node.dataset.open = type;
  node.dataset.id = id;
  node.addEventListener("click", () => { /* логика модалки ниже */ });
}

function createMedia(imgSrc, imgAlt, className = "media") {
  const media = el("div", { className });
  const img = document.createElement("img");
  img.src = imgSrc && /^https?:\/\//i.test(imgSrc) ? imgSrc : ASSET_PREFIX + (imgSrc || "smile.png");
  img.alt = imgAlt || "";
  img.loading = "lazy"; [span_3](start_span)// Ускоряем загрузку[span_3](end_span)
  media.appendChild(img);
  return media;
}

function renderEvents() {
  const wrap = $("#eventsGrid");
  if (!wrap) return;
  wrap.replaceChildren();
  data.events.forEach((item) => {
    const card = el("div", { className: "card event-card" });
    card.appendChild(createMedia(item.poster, item.title, "media event-poster"));
    const pad = el("div", { className: "pad" });
    pad.appendChild(el("b", { text: item.title }));
    card.appendChild(pad);
    setupOpenCard(card, "event", item.id);
    wrap.appendChild(card);
  });
}

function renderArtists() {
  const wrap = $("#artistsGrid");
  if (!wrap) return;
  wrap.replaceChildren();
  data.artists.slice(0, ARTISTS_VISIBLE).forEach((artist) => {
    const card = el("div", { className: "card artist-card" });
    card.appendChild(createMedia(artist.poster, artist.name, "media square"));
    const pad = el("div", { className: "pad" });
    pad.appendChild(el("b", { text: artist.name }));
    card.appendChild(pad);
    setupOpenCard(card, "artist", artist.id);
    wrap.appendChild(card);
  });
}

function renderReleases() {
  const wrap = $("#releasesGrid");
  if (!wrap) return;
  wrap.replaceChildren();
  data.releases.forEach((item) => {
    const card = el("div", { className: "card" });
    card.appendChild(createMedia(item.image, item.title, "media square"));
    const pad = el("div", { className: "pad" });
    pad.appendChild(el("b", { text: item.title }));
    card.appendChild(pad);
    setupOpenCard(card, "release", item.id);
    wrap.appendChild(card);
  });
}

function renderStreams() {
  const wrap = $("#streamsList");
  if (!wrap) return;
  wrap.replaceChildren();
  data.streams.forEach((s) => {
    const row = el("div", { className: "card pad row sp" });
    row.appendChild(el("b", { text: s.title }));
    row.appendChild(createTag(s.date));
    setupOpenCard(row, "stream", s.id);
    wrap.appendChild(row);
  });
}

function renderMerch() {
  const wrap = $("#merchGrid");
  if (!wrap) return;
  wrap.replaceChildren();
  data.merch.forEach((m) => {
    const card = el("div", { className: "card" });
    card.appendChild(createMedia(m.image, m.title, "media square"));
    const pad = el("div", { className: "pad row sp" });
    pad.appendChild(el("b", { text: m.title }));
    pad.appendChild(createTag(m.price));
    card.appendChild(pad);
    setupOpenCard(card, "merch", m.id);
    wrap.appendChild(card);
  });
}

[span_4](start_span)// Вспомогательная функция для обновления всего интерфейса[span_4](end_span)
function renderAll() {
  renderEvents();
  renderArtists();
  renderReleases();
  renderStreams();
  renderMerch();
}

// --- МОДАЛЬНОЕ ОКНО ---

const modal = $("#modal");
const closeModal = () => { if (modal) modal.style.display = "none"; };
$("#mClose")?.addEventListener("click", closeModal);

document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-open]");
  if (!card) return;
  const { open: type, id } = card.dataset;
  [span_5](start_span)// Тут логика открытия модалок из вашего старого кода (buildEventModalBody и т.д.)[span_5](end_span)
  if (modal) modal.style.display = "flex";
});

// --- ИНИЦИАЛИЗАЦИЯ (OPTIMIZED) ---

const initApp = async () => {
  [span_6](start_span)// 1. Пытаемся мгновенно загрузить данные из кэша[span_6](end_span)
  const cachedData = localStorage.getItem('npo_data_cache');
  if (cachedData) {
    try {
      data = JSON.parse(cachedData);
      renderAll(); 
    } catch (e) { console.error("Кэш поврежден"); }
  }

  if (window.dbLayer) {
    try {
      [span_7](start_span)// 2. Параллельный запрос ко всем таблицам Supabase[span_7](end_span)
      const [events, artists, releases, podcasts, streams, merch] = await Promise.all([
        window.dbLayer.getEvents(),
        window.dbLayer.getArtists(),
        window.dbLayer.getReleases(),
        window.dbLayer.getPodcasts(),
        window.dbLayer.getStreams(),
        window.dbLayer.getMerch()
      ]);

      // Обновляем данные актуальными значениями
      data = { events, artists, releases, podcasts, streams, merch };

      [span_8](start_span)// 3. Сохраняем свежие данные в кэш для следующего раза[span_8](end_span)
      localStorage.setItem('npo_data_cache', JSON.stringify(data));
      
      // Перерисовываем интерфейс с новыми данными
      renderAll();
    } catch (err) {
      console.error("Ошибка Supabase:", err);
    }
  }

  const yearNode = $("#year");
  if (yearNode) yearNode.textContent = new Date().getFullYear();

  initClubAuth();
};

[span_9](start_span)// Запуск при загрузке страницы[span_9](end_span)
document.addEventListener("DOMContentLoaded", initApp);
