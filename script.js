const USERNAME = "Super-mario11";
const CACHE_TTL_MS = 5 * 60 * 1000;
const API = {
  user: `https://api.github.com/users/${USERNAME}`,
  repos: `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`,
  events: `https://api.github.com/users/${USERNAME}/events?per_page=20`
};

const state = { repos: [], allRepos: [], events: [] };
let statusTimer;
let cursorRaf = 0;
const languageColors = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Python: "#3572A5",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb"
};

const el = {
  avatar: document.getElementById("avatar"),
  username: document.getElementById("username"),
  bio: document.getElementById("bio"),
  followers: document.getElementById("followers"),
  following: document.getElementById("following"),
  publicRepos: document.getElementById("public-repos"),
  recentCommits: document.getElementById("recent-commits"),
  reposGrid: document.getElementById("repos-grid"),
  recentReposGrid: document.getElementById("recent-repos-grid"),
  reposEmpty: document.getElementById("repos-empty"),
  activityList: document.getElementById("activity-list"),
  status: document.getElementById("status"),
  typingText: document.getElementById("typing-text"),
  repoSearch: document.getElementById("repo-search"),
  refreshBtn: document.getElementById("refresh-btn"),
  themeToggle: document.getElementById("theme-toggle"),
  scrollProgress: document.getElementById("scroll-progress"),
  particles: document.getElementById("particles"),
  cursorAura: document.getElementById("cursor-aura"),
  lastUpdated: document.getElementById("last-updated"),
  apiStatus: document.getElementById("api-status"),
  profileLink: document.getElementById("profile-link"),
  onefetchAscii: document.getElementById("onefetch-ascii"),
  onefetchMeta: document.getElementById("onefetch-meta"),
  statImages: [...document.querySelectorAll(".stat-img")],
  themeMeta: document.querySelector('meta[name="theme-color"]')
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

const formatRelativeTime = (iso) => {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const ranges = [
    { unit: "year", value: 31536000 },
    { unit: "month", value: 2592000 },
    { unit: "day", value: 86400 },
    { unit: "hour", value: 3600 },
    { unit: "minute", value: 60 }
  ];
  for (const range of ranges) {
    if (Math.abs(seconds) >= range.value) {
      return rtf.format(Math.round(seconds / range.value), range.unit);
    }
  }
  return rtf.format(seconds, "second");
};

const escapeHTML = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

function setStatus(message, timeout = 3000) {
  window.clearTimeout(statusTimer);
  el.status.textContent = message;
  el.status.classList.add("show");
  statusTimer = window.setTimeout(() => el.status.classList.remove("show"), timeout);
}

function getCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time > CACHE_TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch {
    // Ignore storage failures to avoid breaking rendering.
  }
}

async function fetchJSON(url, { force = false } = {}) {
  const cacheKey = `portfolio:${url}`;
  if (!force) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
    const resetTime = reset ? new Date(reset).toLocaleTimeString() : "later";
    throw new Error(`GitHub API rate limit reached. Try again around ${resetTime}.`);
  }

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`);
  }

  const remaining = res.headers.get("x-ratelimit-remaining");
  const resetEpoch = Number(res.headers.get("x-ratelimit-reset") || 0) * 1000;
  if (remaining) {
    const when = resetEpoch ? new Date(resetEpoch).toLocaleTimeString() : "later";
    el.apiStatus.textContent = `API: ${remaining} requests left (resets around ${when})`;
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

function renderProfile(user) {
  el.avatar.src = user.avatar_url;
  el.avatar.alt = `${user.login} avatar`;
  el.username.textContent = user.login;
  el.bio.textContent = user.bio || "Building cool things with code.";
  el.followers.textContent = user.followers;
  el.following.textContent = user.following;
  el.publicRepos.textContent = user.public_repos;
  el.profileLink.href = user.html_url;
}

function repoCard(repo) {
  const safeName = escapeHTML(repo.name);
  const safeDescription = escapeHTML(repo.description || "No description available.");
  const safeLanguage = escapeHTML(repo.language || "N/A");
  const safeVisibility = escapeHTML(repo.visibility || "public");
  const color = languageColors[repo.language] || "#00d4ff";
  return `
    <a class="repo-card glass" href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${safeName} repository">
      <div class="repo-top">
        <span class="repo-name">${safeName}</span>
        <span>${repo.stargazers_count} ★</span>
      </div>
      <p class="repo-desc">${safeDescription}</p>
      <div class="repo-meta">
        <span>Language: <i class="lang-dot" style="background:${color}"></i>${safeLanguage}</span>
        <span>Forks: ${repo.forks_count}</span>
        <span>Updated: ${formatDate(repo.updated_at)}</span>
        <span>Visibility: ${safeVisibility}</span>
      </div>
    </a>`;
}

function renderRepoSkeleton() {
  el.reposGrid.innerHTML = Array.from({ length: 6 }, () => '<div class="repo-card glass skeleton"></div>').join("");
}

function renderRecentRepoSkeleton() {
  el.recentReposGrid.innerHTML = Array.from({ length: 3 }, () => '<div class="repo-card glass skeleton"></div>').join("");
}

function renderActivitySkeleton() {
  el.activityList.innerHTML = Array.from({ length: 5 }, () => '<li class="activity-item glass skeleton" style="height:66px"></li>').join("");
}

function renderRepos(repos) {
  el.reposGrid.innerHTML = repos.map(repoCard).join("");
  const cards = [...document.querySelectorAll(".repo-card")];
  cards.forEach((card, i) => window.setTimeout(() => card.classList.add("show"), i * 70));
  initTilt();
}

function renderRecentRepos(repos, events) {
  const eventByRepo = new Map();
  events.forEach((event) => {
    if (!eventByRepo.has(event.repo.name)) {
      eventByRepo.set(event.repo.name, event);
    }
  });

  const recent = [...repos]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  el.recentReposGrid.innerHTML = recent
    .map((repo) => {
      const lastEvent = eventByRepo.get(repo.full_name);
      const lastActivity = lastEvent
        ? `${activityLabel(lastEvent.type)} - ${formatRelativeTime(lastEvent.created_at)}`
        : `Last push - ${formatRelativeTime(repo.pushed_at || repo.updated_at)}`;
      return `
        <a class="repo-card glass show" href="${repo.html_url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(repo.name)} repository">
          <div class="repo-top">
            <span class="repo-name">${escapeHTML(repo.name)}</span>
            <span>${repo.stargazers_count} ★</span>
          </div>
          <p class="repo-desc">${escapeHTML(repo.description || "No description available.")}</p>
          <div class="repo-meta">
            <span>Language: ${escapeHTML(repo.language || "N/A")}</span>
            <span>Forks: ${repo.forks_count}</span>
            <span>Created: ${formatDate(repo.created_at)}</span>
            <span>Updated: ${formatDate(repo.updated_at)}</span>
          </div>
          <p class="repo-activity">${escapeHTML(lastActivity)}</p>
        </a>`;
    })
    .join("");
}

function renderOnefetch(user, repos, events) {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const topRepo = repos[0]?.name || "N/A";
  const pushEvents = events.filter((e) => e.type === "PushEvent");
  const recentPushes = pushEvents.length;
  const languageCounts = repos.reduce((acc, repo) => {
    if (!repo.language) return acc;
    acc[repo.language] = (acc[repo.language] || 0) + 1;
    return acc;
  }, {});

  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalLang = topLanguages.reduce((sum, [, n]) => sum + n, 0) || 1;

  const ascii = [
    "   _____                      __      __",
    "  / ___/__  ______  ___ ____ / /____ / /",
    " / (_ / _ \\/ __/ _ \\/ _ `/ -_) __/ -_) / ",
    " \\___/\\___/_/ / .__/\\_,_/\\__/\\__/\\__/_/  ",
    `             /_/      ${user.login}`,
    "",
    ` repo_count     : ${repos.length}`,
    ` public_repos   : ${user.public_repos}`,
    ` total_stars    : ${totalStars}`,
    ` total_forks    : ${totalForks}`,
    ` top_repo       : ${topRepo}`,
    ` recent_pushes  : ${recentPushes}`
  ].join("\n");

  el.onefetchAscii.textContent = ascii;
  el.onefetchAscii.classList.remove("skeleton");
  el.onefetchMeta.innerHTML = `
    <div class="onefetch-item"><span>Owner</span><strong>${escapeHTML(user.login)}</strong></div>
    <div class="onefetch-item"><span>Profile</span><strong>${escapeHTML(user.html_url)}</strong></div>
    <div class="onefetch-item"><span>Top Repo</span><strong>${escapeHTML(topRepo)}</strong></div>
    <div class="onefetch-item"><span>Updated</span><strong>${escapeHTML(new Date().toLocaleTimeString())}</strong></div>
    <div class="lang-bars">
      ${topLanguages
        .map(([name, count]) => {
          const percent = Math.round((count / totalLang) * 100);
          return `<div class="lang-row">
            <span>${escapeHTML(name)}</span>
            <div class="lang-track"><div class="lang-fill" style="width:${percent}%"></div></div>
            <span>${percent}%</span>
          </div>`;
        })
        .join("")}
    </div>
  `;
}

function activityLabel(type) {
  if (type === "PushEvent") return "Push";
  if (type === "CreateEvent") return "Create";
  if (type === "PullRequestEvent") return "Pull Request";
  return type.replace("Event", "");
}

function renderActivity(events) {
  const preferred = ["PushEvent", "CreateEvent", "PullRequestEvent"];
  const latest = events.filter((e) => preferred.includes(e.type)).slice(0, 5);

  el.activityList.innerHTML = latest
    .map(
      (event) => `<li class="activity-item glass">
        <div class="activity-head">
          <span class="tag">${escapeHTML(activityLabel(event.type))}</span>
          <span class="activity-time" title="${formatDate(event.created_at)}">${escapeHTML(formatRelativeTime(event.created_at))}</span>
        </div>
        <b>${escapeHTML(event.repo.name)}</b><br />
        <small>${formatDate(event.created_at)}</small>
      </li>`
    )
    .join("");

  const commits = events
    .filter((e) => e.type === "PushEvent")
    .reduce((sum, e) => sum + (e.payload?.size || 0), 0);
  el.recentCommits.textContent = commits;

  if (!latest.length) {
    el.activityList.innerHTML = '<li class="activity-item glass">No recent public activity found.</li>';
  }
}

function applyRepoFilter() {
  const q = el.repoSearch.value.trim().toLowerCase();
  const filtered = state.repos.filter(
    (repo) => repo.name.toLowerCase().includes(q) || (repo.description || "").toLowerCase().includes(q)
  );
  renderRepos(filtered);
  el.reposEmpty.classList.toggle("hidden", filtered.length > 0);
}

function debounce(fn, wait = 220) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

function initTyping() {
  const lines = [
    "Crafting playful web experiences...",
    "Live GitHub data, clean design, smooth motion.",
    "Welcome to my coding galaxy."
  ];
  let line = 0;
  let i = 0;
  let deleting = false;

  const tick = () => {
    const current = lines[line];
    el.typingText.textContent = current.slice(0, i);

    if (!deleting && i < current.length) i++;
    else if (deleting && i > 0) i--;
    else if (!deleting) deleting = true;
    else {
      deleting = false;
      line = (line + 1) % lines.length;
    }

    window.setTimeout(tick, deleting ? 35 : 70);
  };

  tick();
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.14 }
  );
  document.querySelectorAll(".reveal").forEach((sec) => observer.observe(sec));
}

function initActiveNav() {
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.remove("active"));
        const matched = links.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        matched?.classList.add("active");
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initTilt() {
  document.querySelectorAll(".repo-card").forEach((card) => {
    if (card.dataset.tiltBound === "true") return;
    card.dataset.tiltBound = "true";
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - y) * 6;
      const ry = (x - 0.5) * 8;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0) rotateY(0) translateY(0)";
    });
  });
}

function initParticles() {
  const count = window.innerWidth < 700 ? 18 : 34;
  el.particles.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${8 + Math.random() * 14}s`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.opacity = `${0.25 + Math.random() * 0.55}`;
    el.particles.appendChild(p);
  }
}

function initCursorAura() {
  let x = 0;
  let y = 0;
  const draw = () => {
    el.cursorAura.style.left = `${x}px`;
    el.cursorAura.style.top = `${y}px`;
    cursorRaf = 0;
  };

  window.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!cursorRaf) cursorRaf = window.requestAnimationFrame(draw);
  });
}

function initRippleButtons() {
  document.querySelectorAll(".ripple-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const ripple = document.createElement("span");
      ripple.className = "ripple";
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.querySelector(".ripple")?.remove();
      btn.appendChild(ripple);
    });
  });
}

function initScrollProgress() {
  const onScroll = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    el.scrollProgress.style.width = `${scrolled}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function initThemeToggle() {
  const key = "portfolio-theme";
  const saved = localStorage.getItem(key);
  if (saved === "light") document.body.classList.add("light");
  syncThemeMeta();
  syncStatsTheme();

  el.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem(key, document.body.classList.contains("light") ? "light" : "dark");
    syncThemeMeta();
    syncStatsTheme();
  });
}

function syncThemeMeta() {
  if (!el.themeMeta) return;
  el.themeMeta.setAttribute("content", document.body.classList.contains("light") ? "#f6f8ff" : "#090c17");
}

function syncStatsTheme() {
  const isLight = document.body.classList.contains("light");
  el.statImages.forEach((img) => {
    if (img.dataset.loaded !== "true") return;
    const nextSrc = isLight ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (nextSrc && img.src !== nextSrc) {
      img.classList.remove("hidden");
      img.closest(".stat-card")?.querySelector(".stat-fallback")?.classList.add("hidden");
      img.src = nextSrc;
    }
  });
}

function initLazyMedia() {
  const getThemeSrc = (img) =>
    document.body.classList.contains("light") ? img.dataset.lightSrc : img.dataset.darkSrc;

  const loadImage = (img) => {
    const nextSrc = getThemeSrc(img);
    if (!nextSrc) return;
    img.src = nextSrc;
    img.dataset.loaded = "true";
  };

  if (!("IntersectionObserver" in window)) {
    el.statImages.forEach(loadImage);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        loadImage(img);
        observer.unobserve(img);
      });
    },
    { rootMargin: "220px 0px" }
  );

  el.statImages.forEach((img) => observer.observe(img));
}

function initStatFallbacks() {
  document.querySelectorAll(".stat-card").forEach((card) => {
    const img = card.querySelector(".stat-img");
    const fallback = card.querySelector(".stat-fallback");
    img?.addEventListener("error", () => {
      img.classList.add("hidden");
      fallback?.classList.remove("hidden");
    });
  });
}

function initAnimatedFavicon() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const link = document.createElement("link");
  link.rel = "icon";
  document.head.appendChild(link);

  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, 64, 64);
    const g = ctx.createLinearGradient(0, 0, 64, 64);
    g.addColorStop(0, "#6a5af9");
    g.addColorStop(1, "#00d4ff");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,255,255,${0.55 + Math.sin(t) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 17 + Math.sin(t) * 2.5, 0, Math.PI * 2);
    ctx.stroke();

    link.href = canvas.toDataURL("image/png");
    t += 0.2;
  };

  draw();
  window.setInterval(draw, 280);
}

async function loadData({ force = false } = {}) {
  renderRepoSkeleton();
  renderRecentRepoSkeleton();
  renderActivitySkeleton();

  try {
    const [user, repos, events] = await Promise.all([
      fetchJSON(API.user, { force }),
      fetchJSON(API.repos, { force }),
      fetchJSON(API.events, { force })
    ]);

    state.allRepos = repos.filter((repo) => !repo.fork);
    state.repos = [...state.allRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);

    state.events = events;
    renderProfile(user);
    renderRepos(state.repos);
    renderRecentRepos(state.allRepos, state.events);
    renderActivity(state.events);
    renderOnefetch(user, state.allRepos, state.events);
    applyRepoFilter();
    el.lastUpdated.textContent = `Last synced: ${new Date().toLocaleTimeString()}`;
    setStatus(force ? "Data refreshed from GitHub." : "Live GitHub data updated.");
  } catch (err) {
    el.reposGrid.innerHTML = "";
    el.activityList.innerHTML = "";
    const message = err instanceof Error ? err.message : "Something went wrong while fetching GitHub data.";
    setStatus(message, 5200);
    el.reposGrid.innerHTML = `<div class="activity-item glass">${escapeHTML(message)}</div>`;
    el.activityList.innerHTML = `<li class="activity-item glass">${escapeHTML(message)}</li>`;
  }
}

function attachListeners() {
  el.repoSearch.addEventListener("input", debounce(applyRepoFilter));
  el.refreshBtn.addEventListener("click", () => loadData({ force: true }));
  window.addEventListener("resize", debounce(initParticles, 180));
}

function init() {
  initTyping();
  initReveal();
  initActiveNav();
  initParticles();
  initCursorAura();
  initRippleButtons();
  initScrollProgress();
  initThemeToggle();
  initLazyMedia();
  initStatFallbacks();
  initAnimatedFavicon();
  attachListeners();
  loadData();
}

init();
