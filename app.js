const state = {
  collection: [],
  filteredCollection: [],
  activeCollectionDirectorKey: "",
  directors: [],
  plazaDirectors: [],
  filmResults: [],
  activeDirector: null,
  spotlightMovie: null,
  spotlightIndex: 0,
  collectionQuery: "",
  statusFilter: "all",
  searchingDirectors: false,
  refreshingPlaza: false,
  loadingSpotlight: false,
  loadingFilms: false,
  addingMovieId: "",
  addingAll: false,
  enrichingPosters: false,
};

const recommendedDirectors = [
  {
    id: "cinemeta:Wong%20Kar%20Wai",
    label: "王家卫",
    searchName: "Wong Kar Wai",
    description: "霓虹灯、错过、慢镜头",
    accent: "#bd3830",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMTY4MTQyMjI4NV5BMl5BanBnXkFtZTcwNDk2MzQ2MQ@@._V1_.jpg",
  },
  {
    id: "cinemeta:Quentin%20Tarantino",
    label: "昆汀·塔伦蒂诺",
    searchName: "Quentin Tarantino",
    description: "暴力美学、精彩对白、类型片融合",
    accent: "#c0862d",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMTgyMjI3ODA3Nl5BMl5BanBnXkFtZTcwNzY2MDYxOQ@@._V1_.jpg",
  },
  {
    id: "cinemeta:Stanley%20Kubrick",
    label: "斯坦利·库布里克",
    searchName: "Stanley Kubrick",
    description: "精密构图与冷峻寓言",
    accent: "#2b5f9c",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMDZlOGFiZmYtZDRmZi00M2RkLTg1MDgtYjUwYjJiYmNiZjhmXkEyXkFqcGc@._V1_.jpg",
  },
  {
    id: "cinemeta:Christopher%20Nolan",
    label: "克里斯托弗·诺兰",
    searchName: "Christopher Nolan",
    description: "时间概念、谜题叙事、宏大场面",
    accent: "#19735f",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BNjE3NDQyOTYyMV5BMl5BanBnXkFtZTcwODcyODU2Mw@@._V1_.jpg",
  },
  {
    id: "cinemeta:Martin%20Scorsese",
    label: "马丁·斯科塞斯",
    searchName: "Martin Scorsese",
    description: "犯罪、信仰与纽约街头文化",
    accent: "#8f3f35",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMTcyNDA4Nzk3N15BMl5BanBnXkFtZTcwNDYzMjMxMw@@._V1_.jpg",
  },
  {
    id: "cinemeta:Hayao%20Miyazaki",
    label: "宫崎骏",
    searchName: "Hayao Miyazaki",
    description: "飞行、自然、温柔冒险",
    accent: "#2f7f8f",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMjcyNjk2OTkwNF5BMl5BanBnXkFtZTcwOTk0MTQ3Mg@@._V1_.jpg",
  },
  {
    id: "cinemeta:Bong%20Joon%20Ho",
    label: "奉俊昊",
    searchName: "Bong Joon Ho",
    description: "社会阶层寓言与类型片创新",
    accent: "#695f3b",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BYmZhZTY3ZGEtOTA1ZC00ODcwLTg2ZjMtODViNzIwNzAxMDVmXkEyXkFqcGc@._V1_.jpg",
  },
  {
    id: "cinemeta:Denis%20Villeneuve",
    label: "丹尼斯·维伦纽瓦",
    searchName: "Denis Villeneuve",
    description: "沉浸式科幻与宏大孤独感",
    accent: "#5c668f",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMzU2MDk5MDI2MF5BMl5BanBnXkFtZTcwNDkwMjMzNA@@._V1_.jpg",
  },
  {
    id: "cinemeta:David%20Fincher",
    label: "大卫·芬奇",
    searchName: "David Fincher",
    description: "冷峻悬疑与精准控制感",
    accent: "#4f5b4d",
    avatarUrl: "https://m.media-amazon.com/images/M/MV5BMTc1NDkwMTQ2MF5BMl5BanBnXkFtZTcwMzY0ODkyMg@@._V1_.jpg",
  },
];

const collectionDirectorAccents = ["#bd3830", "#c0862d", "#2b5f9c", "#19735f", "#8f3f35", "#2f7f8f", "#695f3b", "#5c668f", "#4f5b4d"];

const knownDirectorAvatars = {
  "王家卫": "https://m.media-amazon.com/images/M/MV5BMTY4MTQyMjI4NV5BMl5BanBnXkFtZTcwNDk2MzQ2MQ@@._V1_.jpg",
  "Wong Kar Wai": "https://m.media-amazon.com/images/M/MV5BMTY4MTQyMjI4NV5BMl5BanBnXkFtZTcwNDk2MzQ2MQ@@._V1_.jpg",
  "昆汀·塔伦蒂诺": "https://m.media-amazon.com/images/M/MV5BMTgyMjI3ODA3Nl5BMl5BanBnXkFtZTcwNzY2MDYxOQ@@._V1_.jpg",
  "Quentin Tarantino": "https://m.media-amazon.com/images/M/MV5BMTgyMjI3ODA3Nl5BMl5BanBnXkFtZTcwNzY2MDYxOQ@@._V1_.jpg",
  "斯坦利·库布里克": "https://m.media-amazon.com/images/M/MV5BMDZlOGFiZmYtZDRmZi00M2RkLTg1MDgtYjUwYjJiYmNiZjhmXkEyXkFqcGc@._V1_.jpg",
  "Stanley Kubrick": "https://m.media-amazon.com/images/M/MV5BMDZlOGFiZmYtZDRmZi00M2RkLTg1MDgtYjUwYjJiYmNiZjhmXkEyXkFqcGc@._V1_.jpg",
  "大卫·芬奇": "https://m.media-amazon.com/images/M/MV5BMTc1NDkwMTQ2MF5BMl5BanBnXkFtZTcwMzY0ODkyMg@@._V1_.jpg",
  "David Fincher": "https://m.media-amazon.com/images/M/MV5BMTc1NDkwMTQ2MF5BMl5BanBnXkFtZTcwMzY0ODkyMg@@._V1_.jpg",
  "奉俊昊": "https://m.media-amazon.com/images/M/MV5BYmZhZTY3ZGEtOTA1ZC00ODcwLTg2ZjMtODViNzIwNzAxMDVmXkEyXkFqcGc@._V1_.jpg",
  "Bong Joon Ho": "https://m.media-amazon.com/images/M/MV5BYmZhZTY3ZGEtOTA1ZC00ODcwLTg2ZjMtODViNzIwNzAxMDVmXkEyXkFqcGc@._V1_.jpg",
  "马丁·斯科塞斯": "https://m.media-amazon.com/images/M/MV5BMTcyNDA4Nzk3N15BMl5BanBnXkFtZTcwNDYzMjMxMw@@._V1_.jpg",
  "Martin Scorsese": "https://m.media-amazon.com/images/M/MV5BMTcyNDA4Nzk3N15BMl5BanBnXkFtZTcwNDYzMjMxMw@@._V1_.jpg",
  "丹尼斯·维伦纽瓦": "https://m.media-amazon.com/images/M/MV5BMzU2MDk5MDI2MF5BMl5BanBnXkFtZTcwNDkwMjMzNA@@._V1_.jpg",
  "Denis Villeneuve": "https://m.media-amazon.com/images/M/MV5BMzU2MDk5MDI2MF5BMl5BanBnXkFtZTcwNDkwMjMzNA@@._V1_.jpg",
  "宫崎骏": "https://m.media-amazon.com/images/M/MV5BMjcyNjk2OTkwNF5BMl5BanBnXkFtZTcwOTk0MTQ3Mg@@._V1_.jpg",
  "Hayao Miyazaki": "https://m.media-amazon.com/images/M/MV5BMjcyNjk2OTkwNF5BMl5BanBnXkFtZTcwOTk0MTQ3Mg@@._V1_.jpg",
  "朴赞郁": "https://m.media-amazon.com/images/M/MV5BMTgyODk3MTU5OV5BMl5BanBnXkFtZTcwMTc3NjcyMQ@@._V1_.jpg",
  "Park Chan-wook": "https://m.media-amazon.com/images/M/MV5BMTgyODk3MTU5OV5BMl5BanBnXkFtZTcwMTc3NjcyMQ@@._V1_.jpg",
  "大卫·林奇": "https://m.media-amazon.com/images/M/MV5BMTQ1MTY2MTY2Nl5BMl5BanBnXkFtZTcwMDg1ODYwNA@@._V1_.jpg",
  "David Lynch": "https://m.media-amazon.com/images/M/MV5BMTQ1MTY2MTY2Nl5BMl5BanBnXkFtZTcwMDg1ODYwNA@@._V1_.jpg",
  "李沧东": "https://m.media-amazon.com/images/M/MV5BMTc5NjIwOTc0MV5BMl5BanBnXkFtZTcwMzQ2Mzc3NA@@._V1_.jpg",
  "Lee Chang-dong": "https://m.media-amazon.com/images/M/MV5BMTc5NjIwOTc0MV5BMl5BanBnXkFtZTcwMzQ2Mzc3NA@@._V1_.jpg",
  "保罗·托马斯·安德森": "https://m.media-amazon.com/images/M/MV5BMTQwNjc5NjY2NV5BMl5BanBnXkFtZTcwNDIxMzg1MQ@@._V1_.jpg",
  "Paul Thomas Anderson": "https://m.media-amazon.com/images/M/MV5BMTQwNjc5NjY2NV5BMl5BanBnXkFtZTcwNDIxMzg1MQ@@._V1_.jpg",
  "阿尔弗雷德·希区柯克": "https://m.media-amazon.com/images/M/MV5BMjNjZDM0NGUtZmE0Yy00MTI3LThkNTYtODVlZTUzM2M4Yjk5XkEyXkFqcGc@._V1_.jpg",
  "Alfred Hitchcock": "https://m.media-amazon.com/images/M/MV5BMjNjZDM0NGUtZmE0Yy00MTI3LThkNTYtODVlZTUzM2M4Yjk5XkEyXkFqcGc@._V1_.jpg",
};

// 云部署API配置
const isFilePage = window.location.protocol === "file:";
const apiOrigin = isFilePage ? "http://localhost:4194" : "";
const assetOrigin = isFilePage ? "http://localhost:4194" : window.location.origin;

const collectionGrid = document.querySelector("#collectionGrid");
const collectionModeBar = document.querySelector("#collectionModeBar");
const directorPlaza = document.querySelector("#directorPlaza");
const directorResults = document.querySelector("#directorResults");
const filmResults = document.querySelector("#filmResults");
const emptyState = document.querySelector("#emptyState");
const emptyStateIcon = emptyState.querySelector("i");
const emptyStateText = emptyState.querySelector("p");
const collectionSearch = document.querySelector("#collectionSearch");
const directorSearch = document.querySelector("#directorSearch");
const directorSearchButton = document.querySelector("#directorSearchButton");
const statusFilters = document.querySelector("#statusFilters");
const refreshButton = document.querySelector("#refreshButton");
const posterButton = document.querySelector("#posterButton");
const plazaRefreshButton = document.querySelector("#plazaRefreshButton");
const addAllButton = document.querySelector("#addAllButton");
const filmToolbarTitle = document.querySelector("#filmToolbarTitle");
const filmToolbarMeta = document.querySelector("#filmToolbarMeta");
const spotlightPanel = document.querySelector("#spotlightPanel");
const spotlightPoster = document.querySelector("#spotlightPoster");
const spotlightKicker = document.querySelector("#spotlightKicker");
const spotlightTitle = document.querySelector("#spotlightTitle");
const spotlightMeta = document.querySelector("#spotlightMeta");
const shuffleButton = document.querySelector("#shuffleButton");
const spotlightWatchButton = document.querySelector("#spotlightWatchButton");
const totalCount = document.querySelector("#totalCount");
const watchedCount = document.querySelector("#watchedCount");
const progressCount = document.querySelector("#progressCount");
const sourceStatus = document.querySelector("#sourceStatus");
let spotlightTimer = null;
let ignoreNextPlazaClick = false;
const plazaDrag = {
  active: false,
  moved: false,
  pointerId: null,
  startX: 0,
  scrollLeft: 0,
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiRequest(path, options = {}) {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${apiOrigin}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(fetchOptions.headers || {}),
      },
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("网络响应超时，请稍后再试");
    }
    throw new Error("网络连接不稳定，请稍后再试");
  } finally {
    window.clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

function assetUrl(value = "") {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${assetOrigin}${value.startsWith("/") ? value : `/${value}`}`;
}

function getFilmAddId(film) {
  return film.addId || film.wikidataId || (film.imdbId ? `imdb:${film.imdbId}` : "");
}

function isFilmInCollection(film) {
  return state.collection.some(
    (movie) =>
      (film.wikidataId && movie.wikidataId === film.wikidataId) ||
      (film.imdbId && movie.imdbId === film.imdbId),
  );
}

function getAddableFilms() {
  return state.filmResults.filter((film) => getFilmAddId(film) && !isFilmInCollection(film));
}

function findDirectorById(directorId) {
  return [...state.directors, ...state.plazaDirectors, ...recommendedDirectors].find((item) => item.id === directorId);
}

function getRenrenPlayUrl(movie) {
  const title = movie?.title || movie?.originalTitle || "";
  return title ? `https://www.renren.pro/search?wd=${encodeURIComponent(title)}` : "";
}

function setButtonContent(button, icon, text) {
  button.innerHTML = icon ? `<i data-lucide="${icon}" aria-hidden="true"></i><span>${escapeHtml(text)}</span>` : escapeHtml(text);
  refreshIcons();
}

function getItemStyle(index = 0, extraVars = {}) {
  const vars = Object.entries(extraVars)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([name, value]) => `${name}: ${value}`);

  vars.push(`--item-index: ${index % 12}`);
  return vars.join("; ");
}

function renderSkeletonItems(count, className) {
  return Array.from({ length: count }, (_, index) => `<span class="${className}" style="${getItemStyle(index)}"></span>`).join("");
}

function setBusy(element, busy) {
  element.setAttribute("aria-busy", busy ? "true" : "false");
}

function runViewTransition(update) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || prefersReducedMotion) {
    update();
    return;
  }

  document.startViewTransition(update);
}

function isActivationKey(event) {
  return event.key === "Enter" || event.key === " ";
}

function getMovieText(movie) {
  return [
    movie.title,
    movie.originalTitle,
    movie.year,
    movie.directors?.map((director) => director.name).join(" "),
    movie.genres?.join(" "),
    movie.countries?.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getDirectorAccent(name = "") {
  const hash = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0);
  return collectionDirectorAccents[hash % collectionDirectorAccents.length];
}

function getMovieDirectors(movie) {
  const directors = Array.isArray(movie.directors) ? movie.directors : [];
  if (!directors.length) {
    return [{ id: "unknown-director", name: "未知导演", color: "#69645c", avatarUrl: "" }];
  }

  return directors.map((director) => {
    const name = (typeof director === "string" ? director : director?.name || "未知导演").trim() || "未知导演";
    return {
      id: (typeof director === "string" ? "" : director?.id) || name,
      name,
      color: (typeof director === "string" ? "" : director?.color) || getDirectorAccent(name),
      avatarUrl: (typeof director === "string" ? "" : director?.avatarUrl) || findKnownDirectorAvatar(name),
    };
  });
}

function getDirectorKey(director) {
  const name = typeof director === "string" ? director : director?.name;
  return (name || "未知导演").trim().toLocaleLowerCase("zh-CN");
}

function getDirectorInitials(name = "未知导演") {
  const cleanName = name.trim() || "未知导演";
  const parts = cleanName.split(/\s+/).filter(Boolean);

  if (parts.length > 1 && /^[a-z]/i.test(cleanName)) {
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return Array.from(cleanName).slice(0, 2).join("");
}

function renderDirectorAvatar(name, avatarUrl = "", className = "director-avatar") {
  if (avatarUrl) {
    return `<img class="${className} director-avatar-image" src="${assetUrl(avatarUrl)}" alt="${escapeHtml(name)} 头像" loading="lazy" />`;
  }

  return `<span class="${className}">${escapeHtml(getDirectorInitials(name))}</span>`;
}

function findKnownDirectorAvatar(name = "") {
  const target = getDirectorKey(name);
  return (
    Object.entries(knownDirectorAvatars).find(([directorName]) => getDirectorKey(directorName) === target)?.[1] ||
    [...state.plazaDirectors, ...state.directors, ...recommendedDirectors].find((director) => getDirectorKey(director.label) === target)?.avatarUrl ||
    ""
  );
}

function getDirectorYearLabel(years = []) {
  const validYears = years.filter((year) => Number.isFinite(year)).sort((a, b) => a - b);
  if (!validYears.length) return "年份未知";

  const firstYear = validYears[0];
  const lastYear = validYears[validYears.length - 1];
  return firstYear === lastYear ? `${firstYear}` : `${firstYear}-${lastYear}`;
}

function getCollectionDirectorGroups(movies = state.filteredCollection) {
  const groups = new Map();

  movies.forEach((movie) => {
    getMovieDirectors(movie).forEach((director) => {
      const key = getDirectorKey(director);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          id: director.id,
          name: director.name,
          color: director.color || getDirectorAccent(director.name),
          avatarUrl: director.avatarUrl || "",
          movies: [],
          posterMovies: [],
          watched: 0,
          years: [],
        });
      }

      const group = groups.get(key);
      if (group.movies.some((item) => item.id === movie.id)) return;

      if (!group.avatarUrl && director.avatarUrl) group.avatarUrl = director.avatarUrl;
      group.movies.push(movie);
      if (movie.watched) group.watched += 1;
      if (movie.posterPath && group.posterMovies.length < 3) group.posterMovies.push(movie);
      if (Number.isFinite(Number(movie.year))) group.years.push(Number(movie.year));
    });
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      movieCount: group.movies.length,
      yearLabel: getDirectorYearLabel(group.years),
    }))
    .sort((a, b) => b.movieCount - a.movieCount || a.name.localeCompare(b.name, "zh-CN"));
}

function getCollectionDirectorMovies(directorKey) {
  return state.filteredCollection.filter((movie) => getMovieDirectors(movie).some((director) => getDirectorKey(director) === directorKey));
}

function findCollectionDirectorMeta(directorKey) {
  return getCollectionDirectorGroups(state.collection).find((group) => group.key === directorKey);
}

function getVisibleCollectionCount() {
  if (state.activeCollectionDirectorKey) {
    return getCollectionDirectorMovies(state.activeCollectionDirectorKey).length;
  }

  return getCollectionDirectorGroups().length;
}

function applyCollectionFilters() {
  const keyword = state.collectionQuery.trim().toLowerCase();

  state.filteredCollection = state.collection.filter((movie) => {
    const matchesText = !keyword || getMovieText(movie).toLowerCase().includes(keyword);
    const matchesStatus =
      state.statusFilter === "all" ||
      (state.statusFilter === "watched" && movie.watched) ||
      (state.statusFilter === "unwatched" && !movie.watched);

    return matchesText && matchesStatus;
  });
}

function renderStats() {
  const watched = state.collection.filter((movie) => movie.watched).length;
  const percent = state.collection.length ? Math.round((watched / state.collection.length) * 100) : 0;

  totalCount.textContent = getVisibleCollectionCount();
  watchedCount.textContent = watched;
  progressCount.textContent = `${percent}%`;
}

function getSpotlightMovie() {
  return state.spotlightMovie;
}

function setSpotlightArtwork(movie) {
  const posterSource = movie?.posterPath || movie?.imageUrl || "";
  if (posterSource) {
    spotlightPanel.style.setProperty("--spotlight-art", `url("${assetUrl(posterSource)}")`);
    return;
  }

  spotlightPanel.style.removeProperty("--spotlight-art");
}

function renderSpotlight() {
  spotlightPanel.classList.toggle("is-loading", state.loadingSpotlight);
  setBusy(spotlightPanel, state.loadingSpotlight);

  if (state.loadingSpotlight) {
    setSpotlightArtwork(state.spotlightMovie);
    spotlightKicker.textContent = "联网随机电影";
    spotlightTitle.textContent = "正在寻找电影...";
    spotlightMeta.textContent = "正在从外部电影资料库拉取推荐。";
    spotlightPoster.innerHTML = "";
    spotlightWatchButton.disabled = true;
    setButtonContent(spotlightWatchButton, "loader-circle", "加载中");
    return;
  }

  const movie = getSpotlightMovie();
  if (!movie) {
    setSpotlightArtwork(null);
    spotlightKicker.textContent = "联网随机电影";
    spotlightTitle.textContent = "还没有推荐";
    spotlightMeta.textContent = "点击换一部，从互联网随机拉取电影。";
    spotlightPoster.innerHTML = "";
    spotlightWatchButton.disabled = true;
    setButtonContent(spotlightWatchButton, "plus", "添加到收藏");
    return;
  }

  const addId = getFilmAddId(movie);
  const inCollection = isFilmInCollection(movie);
  const busy = state.addingMovieId === addId;
  const directors = getMovieDirectors(movie).map((director) => director.name).join(" / ") || "未知导演";
  const genres = movie.genres?.slice(0, 3).join(" / ") || "未分类";
  spotlightKicker.textContent = "联网随机电影";
  spotlightTitle.textContent = movie.title || movie.originalTitle;
  spotlightMeta.textContent = [directors, movie.year, genres].filter(Boolean).join(" · ");
  setSpotlightArtwork(movie);
  spotlightPoster.innerHTML = renderPoster(movie);
  spotlightWatchButton.disabled = !addId || inCollection || busy;
  setButtonContent(spotlightWatchButton, busy ? "loader-circle" : inCollection ? "check" : "plus", busy ? "正在添加" : inCollection ? "已收藏" : "添加到收藏");

  spotlightPanel.classList.remove("is-swapping");
  void spotlightPanel.offsetWidth;
  spotlightPanel.classList.add("is-swapping");
  refreshIcons();
}

function nextSpotlight() {
  loadRandomSpotlightMovie();
}

function startSpotlightRoll() {
  window.clearInterval(spotlightTimer);
  spotlightTimer = window.setInterval(loadRandomSpotlightMovie, 30000);
}

function renderPoster(movie) {
  const posterSource = movie.posterPath || movie.imageUrl;
  if (posterSource) {
    return `<img class="poster-image" src="${assetUrl(posterSource)}" alt="${escapeHtml(movie.title)} 海报" loading="lazy" />`;
  }

  return `
    <div class="poster-placeholder">
      <span>${escapeHtml(movie.year || "未知年份")}</span>
      <strong>${escapeHtml(movie.title || movie.originalTitle || "未命名电影")}</strong>
    </div>
  `;
}

function renderCollectionModeBar(groups, activeGroup, visibleMovies) {
  if (!collectionModeBar) return;

  collectionModeBar.hidden = false;
  if (state.activeCollectionDirectorKey) {
    collectionModeBar.innerHTML = `
      <button class="utility-button collection-back-button" type="button" data-show-directors>
        <i data-lucide="arrow-left" aria-hidden="true"></i>
        <span>导演</span>
      </button>
      <div class="collection-mode-copy">
        <strong>${escapeHtml(activeGroup?.name || "所选导演")}</strong>
        <span>${visibleMovies.length} 部匹配电影</span>
      </div>
    `;
    return;
  }

  collectionModeBar.innerHTML = `
    <div class="collection-mode-copy">
      <strong>导演</strong>
      <span>${groups.length} 位导演 · ${state.filteredCollection.length} 部电影</span>
    </div>
  `;
}

function renderDirectorPosterStrip(group) {
  const posterMovies = group.posterMovies.length ? group.posterMovies : group.movies.slice(0, 3);

  return `
    <span class="director-poster-strip" aria-hidden="true">
      ${posterMovies
        .map((movie) =>
          movie.posterPath
            ? `<img src="${assetUrl(movie.posterPath)}" alt="" loading="lazy" />`
            : `<span>${escapeHtml(Array.from(movie.title || movie.originalTitle || "?")[0] || "?")}</span>`,
        )
        .join("")}
    </span>
  `;
}

function renderCollectionDirectorCard(group, index = 0) {
  const watchedMeta = `${group.watched} 已看`;

  return `
    <div class="collection-director-card" data-collection-director="${escapeHtml(group.key)}" role="button" tabindex="0" style="${getItemStyle(index, { "--accent": group.color })}" aria-label="${escapeHtml(group.name)}，${group.movieCount} 部电影">
      <span class="collection-director-remove" data-remove-director-group="${escapeHtml(group.key)}" role="button" tabindex="0" title="删除该导演的所有电影">×</span>
      <span class="director-avatar-frame">
        ${renderDirectorAvatar(group.name, group.avatarUrl)}
      </span>
      <span class="director-card-body">
        <strong>${escapeHtml(group.name)}</strong>
        <span class="director-card-meta">${group.movieCount} 部电影 · ${escapeHtml(watchedMeta)}</span>
        <span class="director-card-years">${escapeHtml(group.yearLabel)}</span>
        ${renderDirectorPosterStrip(group)}
      </span>
    </div>
  `;
}

function renderMovieCard(movie, index = 0) {
  const directors = getMovieDirectors(movie)
    .map((director) => director.name)
    .join(" / ");
  const tags = movie.genres?.slice(0, 3) || [];
  const meta = [movie.year, movie.runtimeMinutes ? `${movie.runtimeMinutes} 分钟` : "", movie.countries?.[0]].filter(Boolean).join(" · ");
  const secondaryText = movie.description && /[\u3400-\u9fff]/.test(movie.description) ? movie.description : "";

  return `
    <article class="movie-card ${movie.watched ? "watched" : ""}" data-movie-id="${escapeHtml(movie.id)}" role="button" tabindex="0" style="${getItemStyle(index)}" title="点击打开外部播放页" aria-label="${escapeHtml(movie.title || movie.originalTitle)}，点击打开外部播放页">
      <div class="poster-frame">
        ${renderPoster(movie)}
        ${movie.external?.imdb ? `<a class="poster-source" href="${movie.external.imdb}" target="_blank" rel="noreferrer" title="外部资料"><i data-lucide="external-link" aria-hidden="true"></i></a>` : ""}
      </div>
      <div class="movie-content">
        <div class="movie-topline">
          <span class="director-pill">${escapeHtml(directors)}</span>
          <span class="year">${escapeHtml(meta)}</span>
        </div>
        <h3 class="movie-title">${escapeHtml(movie.title || movie.originalTitle)}</h3>
        <p class="movie-original">${escapeHtml(secondaryText)}</p>
        <div class="movie-bottom">
          <div class="tags">
            ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <label class="watch-toggle" aria-label="${escapeHtml(movie.title)} 是否已看">
            <input type="checkbox" data-watch-id="${escapeHtml(movie.id)}" ${movie.watched ? "checked" : ""} />
            <span class="switch-ui" aria-hidden="true"></span>
          </label>
        </div>
      </div>
    </article>
  `;
}

function renderCollection() {
  applyCollectionFilters();
  renderStats();

  const groups = getCollectionDirectorGroups();
  const activeGroup = state.activeCollectionDirectorKey ? findCollectionDirectorMeta(state.activeCollectionDirectorKey) : null;
  const visibleMovies = state.activeCollectionDirectorKey ? getCollectionDirectorMovies(state.activeCollectionDirectorKey) : [];
  const isDirectorIndex = !state.activeCollectionDirectorKey;
  const hasVisibleItems = isDirectorIndex ? groups.length > 0 : visibleMovies.length > 0;

  collectionGrid.classList.toggle("director-card-grid", isDirectorIndex);
  collectionGrid.setAttribute("aria-label", isDirectorIndex ? "导演列表" : "电影列表");
  collectionGrid.innerHTML = isDirectorIndex
    ? groups.map((group, index) => renderCollectionDirectorCard(group, index)).join("")
    : visibleMovies.map((movie, index) => renderMovieCard(movie, index)).join("");

  renderCollectionModeBar(groups, activeGroup, visibleMovies);
  emptyState.hidden = hasVisibleItems;
  emptyStateIcon.setAttribute("data-lucide", isDirectorIndex ? "user-round" : "film");
  emptyStateText.textContent = isDirectorIndex ? "没有匹配的导演" : "这个导演下没有匹配的电影";

  refreshIcons();
}

function renderDirectorPlaza() {
  const plazaDirectors = state.plazaDirectors.length ? state.plazaDirectors : recommendedDirectors;
  setBusy(directorPlaza, state.refreshingPlaza);

  if (state.refreshingPlaza && !state.plazaDirectors.length) {
    directorPlaza.innerHTML = renderSkeletonItems(4, "skeleton-card");
    return;
  }

  directorPlaza.classList.toggle("is-refreshing", state.refreshingPlaza);
  directorPlaza.innerHTML = plazaDirectors
    .map(
      (director, index) => `
        <div class="director-tile ${state.activeDirector?.id === director.id ? "active" : ""}" role="button" tabindex="0" data-plaza-director="${escapeHtml(director.id)}" style="${getItemStyle(index, { "--accent": director.accent })}">
          <span class="director-remove-btn" data-remove-director="${escapeHtml(director.id)}" role="button" tabindex="0" title="从广场移除">×</span>
          <span class="plaza-director-avatar">
            ${renderDirectorAvatar(director.label, director.avatarUrl, "plaza-avatar-image")}
          </span>
          <span class="plaza-director-copy">
            <strong>${escapeHtml(director.label)}</strong>
            <span>${escapeHtml(director.description)}</span>
          </span>
        </div>
      `,
    )
    .join("");
}

function renderDirectorResults() {
  setBusy(directorResults, state.searchingDirectors);

  if (state.searchingDirectors) {
    directorResults.innerHTML = renderSkeletonItems(3, "skeleton-row");
    return;
  }

  if (!state.directors.length) {
    directorResults.innerHTML = `<p class="panel-note">输入导演名，例如 王家卫、克里斯托弗·诺兰、是枝裕和。</p>`;
    return;
  }

  directorResults.innerHTML = state.directors
    .map(
      (director, index) => `
        <button class="result-row ${state.activeDirector?.id === director.id ? "active" : ""}" type="button" data-director-id="${escapeHtml(director.id)}" style="${getItemStyle(index)}">
          <span class="result-avatar">
            ${renderDirectorAvatar(director.label, director.avatarUrl, "result-avatar-image")}
          </span>
          <span>
            <strong>${escapeHtml(director.label)}</strong>
            <small>${escapeHtml(director.description || director.id)}</small>
          </span>
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </button>
      `,
    )
    .join("");

  refreshIcons();
}

async function refreshDirectorPlaza({ silent = false } = {}) {
  state.refreshingPlaza = true;
  if (!silent) {
    renderDirectorPlaza();
    renderSourceStatus("正在联网随机刷新导演广场...", "muted");
  }
  if (plazaRefreshButton) {
    plazaRefreshButton.disabled = true;
  }

  try {
    const data = await apiRequest("/api/directors/random");
    state.plazaDirectors = data.results?.length ? data.results : recommendedDirectors;
    if (!silent) {
      renderSourceStatus(`导演广场已刷新：${state.plazaDirectors.length} 位导演`, "ok");
    }
  } catch (error) {
    if (!silent) {
      renderSourceStatus(error.message, "error");
    }
  } finally {
    state.refreshingPlaza = false;
    if (plazaRefreshButton) {
      plazaRefreshButton.disabled = false;
    }
    renderDirectorPlaza();
  }
}

function renderFilmToolbar() {
  const addableCount = getAddableFilms().length;
  const total = state.filmResults.length;
  const activeName = state.activeDirector?.label || "作品列表";

  filmToolbarTitle.textContent = activeName;
  filmToolbarMeta.textContent = state.loadingFilms
    ? "加载中"
    : total
      ? `${total} 部作品 · ${addableCount} 部可添加`
      : "选择导演后出现";
  addAllButton.disabled = state.loadingFilms || state.addingAll || addableCount === 0;
  setButtonContent(addAllButton, state.addingAll ? "loader-circle" : "list-plus", state.addingAll ? "正在添加" : "一键添加");
}

function renderFilmResults() {
  renderFilmToolbar();
  setBusy(filmResults, state.loadingFilms);

  if (state.loadingFilms) {
    filmResults.innerHTML = renderSkeletonItems(5, "skeleton-row");
    return;
  }

  if (!state.activeDirector) {
    filmResults.innerHTML = `<p class="panel-note">先选择一个导演，再从作品列表里添加到收藏。</p>`;
    return;
  }

  if (!state.filmResults.length) {
    filmResults.innerHTML = `<p class="panel-note">暂时没有从外部资料库找到电影作品。</p>`;
    return;
  }

  filmResults.innerHTML = state.filmResults
    .map((film, index) => {
      const addId = getFilmAddId(film);
      const inCollection = isFilmInCollection(film);
      const busy = state.addingMovieId === addId;
      const icon = busy ? "loader-circle" : inCollection ? "check" : "plus";
      const label = busy ? "正在下载" : inCollection ? "已收藏" : "添加到收藏";

      return `
        <article class="film-row" style="${getItemStyle(index)}">
          <div>
            <strong>${escapeHtml(film.title)}</strong>
            <p>${escapeHtml([film.year, film.genres?.slice(0, 2).join(" / ")].filter(Boolean).join(" · "))}</p>
          </div>
          <button class="add-button" type="button" data-add-id="${escapeHtml(addId)}" ${!addId || inCollection || busy ? "disabled" : ""}>
            <i data-lucide="${icon}" aria-hidden="true"></i>
            <span>${label}</span>
          </button>
        </article>
      `;
    })
    .join("");

  refreshIcons();
}

function renderSourceStatus(message, tone = "muted") {
  sourceStatus.textContent = message;
  sourceStatus.dataset.tone = tone;
}

async function loadRandomSpotlightMovie() {
  if (state.loadingSpotlight) return;

  state.loadingSpotlight = true;
  renderSpotlight();

  try {
    const data = await apiRequest("/api/movies/random");
    state.spotlightMovie = data.movie || null;
  } catch (error) {
    state.spotlightMovie = null;
    renderSourceStatus(error.message, "error");
  } finally {
    state.loadingSpotlight = false;
    renderSpotlight();
  }
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

async function loadCollection() {
  const data = await apiRequest("/api/collection");
  state.collection = data.movies || [];
  state.spotlightIndex = Math.min(state.spotlightIndex, Math.max(state.collection.length - 1, 0));
  renderCollection();
  renderSpotlight();
  renderFilmResults();
  renderSourceStatus(`本地已保存 ${state.collection.length} 部电影`, "ok");
}

async function searchDirectors() {
  const query = directorSearch.value.trim();
  if (!query) return;

  state.searchingDirectors = true;
  state.activeDirector = null;
  state.filmResults = [];
  renderDirectorPlaza();
  renderDirectorResults();
  renderFilmResults();
  renderSourceStatus("正在连接维基数据搜索导演...", "muted");

  try {
    const data = await apiRequest(`/api/search/directors?q=${encodeURIComponent(query)}`);
    state.directors = data.results || [];
    renderSourceStatus(`找到 ${state.directors.length} 个候选导演`, "ok");
  } catch (error) {
    state.directors = [];
    renderSourceStatus(error.message, "error");
  } finally {
    state.searchingDirectors = false;
    renderDirectorResults();
  }
}

async function loadDirectorFilms(directorId) {
  const director = findDirectorById(directorId);
  if (!director) return;

  state.activeDirector = director;
  state.loadingFilms = true;
  state.filmResults = [];
  renderDirectorPlaza();
  renderDirectorResults();
  renderFilmResults();
  renderSourceStatus(`正在读取 ${director.label} 的作品...`, "muted");

  try {
    const params = new URLSearchParams({ name: director.searchName || director.label });
    const data = await apiRequest(`/api/directors/${encodeURIComponent(directorId)}/films?${params.toString()}`);
    state.filmResults = data.results || [];
    renderSourceStatus(`作品列表已加载：${state.filmResults.length} 部`, "ok");
  } catch (error) {
    renderSourceStatus(error.message, "error");
  } finally {
    state.loadingFilms = false;
    renderDirectorPlaza();
    renderFilmResults();
  }
}

async function addMovie(wikidataId) {
  state.addingMovieId = wikidataId;
  renderFilmResults();
  renderSpotlight();
  renderSourceStatus("正在下载电影资料和封面...", "muted");

  try {
    const data = await apiRequest("/api/collection/add", {
      method: "POST",
      body: JSON.stringify({ sourceId: wikidataId }),
      timeoutMs: 20000,
    });

    state.collection = data.movies || state.collection;
    renderCollection();
    renderSpotlight();
    renderFilmResults();
    renderSourceStatus("已成功添加到本地收藏", "ok");
  } catch (error) {
    renderSourceStatus(error.message, "error");
  } finally {
    state.addingMovieId = "";
    renderFilmResults();
    renderSpotlight();
  }
}

async function addAllMovies() {
  const sourceIds = getAddableFilms().map(getFilmAddId);
  if (!sourceIds.length) return;

  state.addingAll = true;
  renderFilmResults();
  renderSourceStatus(`正在一键添加 ${sourceIds.length} 部电影，封面会一起下载...`, "muted");

  try {
    const data = await apiRequest("/api/collection/add-batch", {
      method: "POST",
      body: JSON.stringify({ sourceIds }),
      timeoutMs: 45000,
    });

    state.collection = data.movies || state.collection;
    renderCollection();
    renderSpotlight();
    renderFilmResults();
    renderSourceStatus(`一键添加完成：新增 ${data.added || 0} 部，跳过 ${data.skipped || 0} 部`, "ok");
  } catch (error) {
    renderSourceStatus(error.message, "error");
  } finally {
    state.addingAll = false;
    renderFilmResults();
  }
}

async function updateWatched(movieId, watched) {
  const movie = state.collection.find((item) => item.id === movieId);
  if (movie) {
    movie.watched = watched;
    renderCollection();
  }

  try {
    const data = await apiRequest(`/api/collection/${encodeURIComponent(movieId)}`, {
      method: "PATCH",
      body: JSON.stringify({ watched }),
    });
    state.collection = data.movies || state.collection;
    renderCollection();
    renderSpotlight();
  } catch (error) {
    renderSourceStatus(error.message, "error");
    await loadCollection();
  }
}

async function removeDirectorMovies(directorKey) {
  const directorMovies = getCollectionDirectorMovies(directorKey);
  if (!directorMovies.length) return;

  for (const movie of directorMovies) {
    try {
      const data = await apiRequest(`/api/collection/${encodeURIComponent(movie.id)}`, {
        method: "DELETE",
      });
      state.collection = data.movies || state.collection;
    } catch (error) {
      renderSourceStatus(error.message, "error");
    }
  }

  state.activeCollectionDirectorKey = "";
  renderCollection();
  renderSpotlight();
}

async function enrichPosters() {
  state.enrichingPosters = true;
  posterButton.disabled = true;
  setButtonContent(posterButton, "download", "下载中");
  renderSourceStatus("正在下载缺失封面，已有文件会跳过...", "muted");

  try {
    const data = await apiRequest("/api/collection/enrich-posters", { method: "POST", timeoutMs: 60000 });
    state.collection = data.movies || state.collection;
    renderCollection();
    renderSpotlight();
    renderSourceStatus(`封面下载完成：新增 ${data.downloaded || 0} 张`, "ok");
  } catch (error) {
    renderSourceStatus(error.message, "error");
  } finally {
    state.enrichingPosters = false;
    posterButton.disabled = false;
    setButtonContent(posterButton, "download", "下载封面");
  }
}

function beginPlazaDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (event.target.closest("[data-remove-director]")) return;

  plazaDrag.active = true;
  plazaDrag.moved = false;
  plazaDrag.pointerId = event.pointerId;
  plazaDrag.startX = event.clientX;
  plazaDrag.scrollLeft = directorPlaza.scrollLeft;
  directorPlaza.classList.add("is-dragging");
  directorPlaza.setPointerCapture?.(event.pointerId);
}

function movePlazaDrag(event) {
  if (!plazaDrag.active || event.pointerId !== plazaDrag.pointerId) return;

  const deltaX = event.clientX - plazaDrag.startX;
  if (Math.abs(deltaX) > 4) {
    plazaDrag.moved = true;
  }

  if (plazaDrag.moved) {
    event.preventDefault();
    directorPlaza.scrollLeft = plazaDrag.scrollLeft - deltaX;
  }
}

function endPlazaDrag(event) {
  if (!plazaDrag.active || event.pointerId !== plazaDrag.pointerId) return;

  if (plazaDrag.moved) {
    ignoreNextPlazaClick = true;
    window.setTimeout(() => {
      ignoreNextPlazaClick = false;
    }, 160);
  }

  plazaDrag.active = false;
  plazaDrag.moved = false;
  plazaDrag.pointerId = null;
  directorPlaza.classList.remove("is-dragging");
  if (directorPlaza.hasPointerCapture?.(event.pointerId)) {
    directorPlaza.releasePointerCapture(event.pointerId);
  }
}

function setupLiquidGlassPointer() {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");
  if (!motionQuery.matches) return;

  let frameId = 0;
  let nextX = 52;
  let nextY = 18;

  const updatePointerVars = () => {
    frameId = 0;
    document.documentElement.style.setProperty("--glass-x", `${nextX.toFixed(2)}%`);
    document.documentElement.style.setProperty("--glass-y", `${nextY.toFixed(2)}%`);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      nextX = Math.max(0, Math.min(100, (event.clientX / window.innerWidth) * 100));
      nextY = Math.max(0, Math.min(100, (event.clientY / window.innerHeight) * 100));
      if (!frameId) {
        frameId = window.requestAnimationFrame(updatePointerVars);
      }
    },
    { passive: true },
  );
}

collectionSearch.addEventListener("input", (event) => {
  state.collectionQuery = event.target.value;
  renderCollection();
});

statusFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-status]");
  if (!button) return;

  state.statusFilter = button.dataset.status;
  statusFilters.querySelectorAll(".segment").forEach((segment) => {
    segment.classList.toggle("active", segment.dataset.status === state.statusFilter);
  });
  runViewTransition(renderCollection);
});

directorSearchButton.addEventListener("click", searchDirectors);

directorSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchDirectors();
  }
});

directorResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-director-id]");
  if (!button) return;

  loadDirectorFilms(button.dataset.directorId);
});

directorPlaza.addEventListener("pointerdown", beginPlazaDrag);
directorPlaza.addEventListener("pointermove", movePlazaDrag);
directorPlaza.addEventListener("pointerup", endPlazaDrag);
directorPlaza.addEventListener("pointercancel", endPlazaDrag);
directorPlaza.addEventListener("lostpointercapture", (event) => {
  if (plazaDrag.active && event.pointerId === plazaDrag.pointerId) {
    plazaDrag.active = false;
    plazaDrag.moved = false;
    plazaDrag.pointerId = null;
    directorPlaza.classList.remove("is-dragging");
  }
});

directorPlaza.addEventListener("click", (event) => {
  if (ignoreNextPlazaClick) {
    event.preventDefault();
    event.stopPropagation();
    ignoreNextPlazaClick = false;
    return;
  }

  const removeButton = event.target.closest("[data-remove-director]");
  if (removeButton) {
    event.stopPropagation();
    const directorId = removeButton.dataset.removeDirector;
    state.plazaDirectors = state.plazaDirectors.filter((d) => d.id !== directorId);
    if (state.plazaDirectors.length === 0) {
      state.plazaDirectors = recommendedDirectors;
    }
    renderDirectorPlaza();
    return;
  }

  const button = event.target.closest("[data-plaza-director]");
  if (!button) return;

  loadDirectorFilms(button.dataset.plazaDirector);
});

directorPlaza.addEventListener("keydown", (event) => {
  if (!isActivationKey(event)) return;
  const target = event.target.closest("[data-remove-director], [data-plaza-director]");
  if (!target) return;

  event.preventDefault();
  target.click();
});

filmResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-id]");
  if (!button) return;

  addMovie(button.dataset.addId);
});

addAllButton.addEventListener("click", addAllMovies);

collectionModeBar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-show-directors]");
  if (!button) return;

  state.activeCollectionDirectorKey = "";
  runViewTransition(renderCollection);
});

collectionGrid.addEventListener("click", (event) => {
  if (event.target.closest("a, button, input, label")) {
    return;
  }

  const removeButton = event.target.closest("[data-remove-director-group]");
  if (removeButton) {
    event.stopPropagation();
    const directorKey = removeButton.dataset.removeDirectorGroup;
    removeDirectorMovies(directorKey);
    return;
  }

  const directorButton = event.target.closest("[data-collection-director]");
  if (directorButton) {
    state.activeCollectionDirectorKey = directorButton.dataset.collectionDirector;
    runViewTransition(renderCollection);
    return;
  }

  const movieCard = event.target.closest(".movie-card");
  if (movieCard) {
    const movieId = movieCard.dataset.movieId;
    const movie = state.filteredCollection.find((item) => item.id === movieId);
    if (movie) {
      openPlayer(movie);
    }
  }
});

collectionGrid.addEventListener("keydown", (event) => {
  if (!isActivationKey(event)) return;
  const target = event.target.closest("[data-remove-director-group], [data-collection-director], .movie-card");
  if (!target) return;

  event.preventDefault();
  target.click();
});

collectionGrid.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-watch-id]");
  if (!checkbox) return;

  updateWatched(checkbox.dataset.watchId, checkbox.checked);
});

refreshButton.addEventListener("click", loadCollection);
posterButton.addEventListener("click", enrichPosters);
plazaRefreshButton?.addEventListener("click", () => refreshDirectorPlaza());
shuffleButton.addEventListener("click", nextSpotlight);
spotlightWatchButton.addEventListener("click", () => {
  const movie = getSpotlightMovie();
  const addId = movie ? getFilmAddId(movie) : "";
  if (!addId || isFilmInCollection(movie)) return;
  addMovie(addId);
});

setupLiquidGlassPointer();
state.plazaDirectors = recommendedDirectors;
renderDirectorPlaza();
renderFilmResults();
loadRandomSpotlightMovie();
startSpotlightRoll();
refreshDirectorPlaza({ silent: true });
loadCollection().catch((error) => {
  const message = isFilePage
    ? `连接本地服务失败，请先运行 npm start，然后打开 ${assetOrigin}`
    : error.message;
  renderSourceStatus(message, "error");
});

// 播放器功能
const playerModal = document.querySelector("#playerModal");
const playerClose = document.querySelector("#playerClose");
const playerTitle = document.querySelector("#playerTitle");
const playerSubtitle = document.querySelector("#playerSubtitle");
const videoPlayer = document.querySelector("#videoPlayer");
const playerPlaceholder = document.querySelector("#playerPlaceholder");
const playerError = document.querySelector("#playerError");
const progressTrack = document.querySelector("#progressTrack");
const progressFill = document.querySelector("#progressFill");
const progressBuffer = document.querySelector("#progressBuffer");
const progressThumb = document.querySelector("#progressThumb");
const playPauseBtn = document.querySelector("#playPauseBtn");
const timeDisplay = document.querySelector("#timeDisplay");
const volumeBtn = document.querySelector("#volumeBtn");
const volumeSlider = document.querySelector("#volumeSlider");
const fullscreenBtn = document.querySelector("#fullscreenBtn");
const qualitySelect = document.querySelector("#qualitySelect");

let currentPlayingMovie = null;

async function fetchVideoUrl(movieName) {
  try {
    const response = await fetch(`${apiOrigin}/api/video/search?name=${encodeURIComponent(movieName)}`);
    const data = await response.json();
    return data.url || null;
  } catch (error) {
    console.error("获取视频链接失败:", error);
    return null;
  }
}

function openPlayer(movie) {
  if (!movie) return;

  const playUrl = getRenrenPlayUrl(movie);
  if (!playUrl) {
    renderSourceStatus("这部电影缺少可用于搜索的片名", "error");
    return;
  }

  const opened = window.open(playUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    renderSourceStatus("浏览器拦截了新窗口，请允许弹出窗口后重试", "error");
    return;
  }

  renderSourceStatus(`已打开外部播放页：${movie.title || movie.originalTitle}`, "ok");
}

async function loadVideo(movie) {
  const videoUrl = await fetchVideoUrl(movie.title);
  
  if (!videoUrl) {
    playerPlaceholder.hidden = true;
    playerError.hidden = false;
    return;
  }
  
  playerPlaceholder.hidden = true;
  videoPlayer.style.display = "block";
  videoPlayer.src = videoUrl;
}

function closePlayer() {
  if (videoPlayer) {
    videoPlayer.src = "";
  }
  playerModal.close();
  currentPlayingMovie = null;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function updateProgress() {
  if (!videoPlayer) return;
  
  const current = videoPlayer.currentTime;
  const duration = videoPlayer.duration;
  const buffered = videoPlayer.buffered.end(0) || 0;
  
  if (duration > 0) {
    progressFill.style.width = `${(current / duration) * 100}%`;
    progressBuffer.style.width = `${(buffered / duration) * 100}%`;
    progressThumb.style.left = `${(current / duration) * 100}%`;
    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  }
}

function togglePlayPause() {
  if (!videoPlayer) return;
  
  if (videoPlayer.paused) {
    videoPlayer.play();
    playPauseBtn.innerHTML = `<i data-lucide="pause" aria-hidden="true"></i>`;
  } else {
    videoPlayer.pause();
    playPauseBtn.innerHTML = `<i data-lucide="play" aria-hidden="true"></i>`;
  }
  refreshIcons();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    playerModal.requestFullscreen();
    fullscreenBtn.innerHTML = `<i data-lucide="minimize" aria-hidden="true"></i>`;
  } else {
    document.exitFullscreen();
    fullscreenBtn.innerHTML = `<i data-lucide="maximize" aria-hidden="true"></i>`;
  }
  refreshIcons();
}

function toggleMute() {
  if (!videoPlayer) return;
  
  videoPlayer.muted = !videoPlayer.muted;
  volumeBtn.innerHTML = videoPlayer.muted 
    ? `<i data-lucide="volume-x" aria-hidden="true"></i>` 
    : `<i data-lucide="volume-2" aria-hidden="true"></i>`;
  refreshIcons();
}

playerClose.addEventListener("click", closePlayer);

playerModal.addEventListener("click", (e) => {
  if (e.target === playerModal) {
    closePlayer();
  }
});

playPauseBtn.addEventListener("click", togglePlayPause);
fullscreenBtn.addEventListener("click", toggleFullscreen);
volumeBtn.addEventListener("click", toggleMute);

volumeSlider.addEventListener("input", (e) => {
  if (videoPlayer) {
    videoPlayer.volume = parseFloat(e.target.value);
  }
});

progressTrack.addEventListener("click", (e) => {
  if (!videoPlayer) return;
  
  const rect = progressTrack.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  videoPlayer.currentTime = percent * videoPlayer.duration;
});

videoPlayer.addEventListener("timeupdate", updateProgress);
videoPlayer.addEventListener("play", () => {
  playPauseBtn.innerHTML = `<i data-lucide="pause" aria-hidden="true"></i>`;
  refreshIcons();
});

videoPlayer.addEventListener("pause", () => {
  playPauseBtn.innerHTML = `<i data-lucide="play" aria-hidden="true"></i>`;
  refreshIcons();
});

videoPlayer.addEventListener("ended", () => {
  playPauseBtn.innerHTML = `<i data-lucide="play" aria-hidden="true"></i>`;
  refreshIcons();
});

document.addEventListener("keydown", (e) => {
  if (!playerModal.open) return;
  
  if (e.key === "Escape") {
    closePlayer();
  } else if (e.key === " ") {
    e.preventDefault();
    togglePlayPause();
  }
});
