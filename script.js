const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad2 = (n) => String(n).padStart(2, "0");

const ASSET_PREFIX = ""; 
const monthsRu = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

const fmtDT = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

let data = { events: [], artists: [], releases: [], podcasts: [], streams: [], merch: [] };
const ARTISTS_VISIBLE = 6;
let clubSession = null;

// --- УТИЛИТЫ ---
const el = (tag, { className, text } = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const createTag = (text) => el("span", { className: "tag", text: String(text || "").trim() || "—" });

function createMedia(imgSrc, imgAlt, className = "media") {
  const media = el("div", { className });
  const img = document.createElement("img");
  img.src = imgSrc && /^https?:\/\//i.test(imgSrc) ? imgSrc : ASSET_PREFIX + (imgSrc || "smile.png");
  img.alt = imgAlt || "";
  img.loading = "lazy";
  media.appendChild(img);
  return media;
}

// --- ОТРИСОВКА ГРИДОВ ---
function setupOpenCard(node, type, id) {
  if (!node) return;
  node.dataset.open = type;
  node.dataset.id = id;
  node.style.cursor = "pointer";
}

function renderEvents() {
  const wrap = $("#eventsGrid"); if (!wrap) return;
  wrap.replaceChildren();
  // Сортировка по дате (ближайшие сверху)
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
  const searchEl = $("#artistSearch");
  const q = (searchEl?.value || "").trim().toLowerCase();
  const wrap = $("#artistsGrid"); if (!wrap) return;
  wrap.replaceChildren();

  let list = [...data.artists].sort((a, b) => a.name.localeCompare(b.name));
  if (q) list = list.filter(a => a.name.toLowerCase().includes(q));

  const toShow = q ? list : list.slice(0, ARTISTS_VISIBLE);
  toShow.forEach((artist) => {
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
  const wrap = $("#releasesGrid"); if (!wrap) return;
  wrap.replaceChildren();
  data.releases.forEach((item) => {
    const card = el("div", { className: "card" });
    card.appendChild(createMedia(item.image, item.title, "media square"));
    const pad = el("div", { className: "pad" });
    pad.appendChild(el("b", { text: item.title }));
    const date = el("div", { className: "muted", text: item.date || "" });
    date.style.marginTop = "4px";
    pad.appendChild(date);
    card.appendChild(pad);
    setupOpenCard(card, "release", item.id);
    wrap.appendChild(card);
  });
}

function renderStreams() {
  const wrap = $("#streamsList"); if (!wrap) return;
  wrap.replaceChildren();
  data.streams.forEach((s) => {
    const row = el("div", { className: "card pad" });
    const content = el("div", { className: "row sp" });
    content.appendChild(el("b", { text: s.title }));
    content.appendChild(createTag(s.date));
    row.appendChild(content);
    setupOpenCard(row, "stream", s.id);
    wrap.appendChild(row);
  });
}

function renderMerch() {
  const wrap = $("#merchGrid"); if (!wrap) return;
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

function renderAll() {
  renderEvents(); renderArtists(); renderReleases(); renderStreams(); renderMerch();
}

// --- МОБИЛЬНОЕ МЕНЮ ---
const closeMobileMenu = () => {
  document.body.classList.remove("menu-open");
  if ($("#mobileMenu")) $("#mobileMenu").hidden = true;
  if ($("#mobileMenuBackdrop")) $("#mobileMenuBackdrop").hidden = true;
};

const openMobileMenu = () => {
  if ($("#mobileMenu")) $("#mobileMenu").hidden = false;
  if ($("#mobileMenuBackdrop")) $("#mobileMenuBackdrop").hidden = false;
  document.body.classList.add("menu-open");
};

// --- МОДАЛЬНЫЕ ОКНА (ЛОГИКА) ---
const modal = $("#modal");
const openModal = ({ title, sub, body }) => {
  if ($("#mTitle")) $("#mTitle").textContent = title || "—";
  if ($("#mSub")) $("#mSub").textContent = sub || "";
  if ($("#mBody")) $("#mBody").replaceChildren(body || "");
  if (modal) modal.style.display = "flex";
};

$("#mClose")?.addEventListener("click", () => { if (modal) modal.style.display = "none"; });

document.addEventListener("click", (e) => {
  const card = e.target.closest("[data-open]");
  if (!card) return;
  const { open: type, id } = card.dataset;
  const item = data[type + 's']?.find(x => x.id == id);
  if (!item) return;

  if (type === 'event') {
    openModal({ title: item.title, sub: fmtDT(item.date), body: el("div", { text: item.about || "Описание отсутствует" }) });
  } else if (type === 'artist') {
    openModal({ title: item.name, sub: item.role, body: el("div", { text: item.bio || "Биография отсутствует" }) });
  } else {
    openModal({ title: item.title, sub: "", body: el("div", { text: "Детали скоро появятся" }) });
  }
});

// --- ИНИЦИАЛИЗАЦИЯ ---
const initApp = async () => {
  // 1. Загрузка из кэша для мгновенного появления
  const cached = localStorage.getItem('npo_data_cache');
  if (cached) {
    try { data = JSON.parse(cached); renderAll(); } catch(e) {}
  }

  // 2. Параллельная загрузка из базы
  if (window.dbLayer) {
    try {
      const [ev, ar, re, po, st, me] = await Promise.all([
        window.dbLayer.getEvents(), window.dbLayer.getArtists(), window.dbLayer.getReleases(),
        window.dbLayer.getPodcasts(), window.dbLayer.getStreams(), window.dbLayer.getMerch()
      ]);
      data = { events: ev, artists: ar, releases: re, podcasts: po, streams: st, merch: me };
      localStorage.setItem('npo_data_cache', JSON.stringify(data));
      renderAll();
    } catch (err) { console.error("Ошибка Supabase:", err); }
  }

  $("#artistSearch")?.addEventListener("input", renderArtists);
  $("#mobileMenuToggle")?.addEventListener("click", () => {
    if (document.body.classList.contains("menu-open")) closeMobileMenu(); else openMobileMenu();
  });
  $("#mobileMenuBackdrop")?.addEventListener("click", closeMobileMenu);
};

document.addEventListener("DOMContentLoaded", initApp);
