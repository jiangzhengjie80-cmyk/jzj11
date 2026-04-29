const path = require("node:path");
const fs = require("node:fs/promises");
const { 
  MIME_TYPES, 
  CORS_HEADERS, 
  ROOT, 
  POSTER_DIR,
  ensureStorage, 
  readLocalizedCollection, 
  getRandomDirectors, 
  getRandomExternalMovie, 
  searchDirectors, 
  searchVideoUrl 
} = require("./shared");

let storageInitialized = false;

async function initStorage() {
  if (!storageInitialized) {
    await ensureStorage();
    storageInitialized = true;
  }
}

module.exports = async (req, res) => {
  await initStorage();
  
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  res.setHeader("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
  res.setHeader("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
  res.setHeader("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (pathname === "/api/collection") {
      const movies = await readLocalizedCollection();
      res.json({ movies });
      return;
    }

    if (pathname === "/api/directors/random") {
      const results = await getRandomDirectors();
      res.json({ results });
      return;
    }

    if (pathname === "/api/movies/random") {
      const movie = await getRandomExternalMovie();
      res.json({ movie });
      return;
    }

    if (pathname === "/api/search/directors") {
      const query = url.searchParams.get("q") || "";
      if (!query.trim()) {
        res.json({ results: [] });
        return;
      }
      const results = await searchDirectors(query.trim());
      res.json({ results });
      return;
    }

    if (pathname.startsWith("/api/directors/") && pathname.endsWith("/films")) {
      const directorId = decodeURIComponent(pathname.split("/")[3]);
      res.json({ results: [], message: "导演电影功能暂时不可用" });
      return;
    }

    if (pathname === "/api/collection/add" || pathname === "/api/collection/add-batch") {
      res.status(501).json({ error: "收藏功能在 Vercel 上暂时不可用" });
      return;
    }

    if (pathname === "/api/collection/enrich-posters") {
      res.status(501).json({ error: "海报功能在 Vercel 上暂时不可用" });
      return;
    }

    if (pathname.startsWith("/api/collection/")) {
      res.status(501).json({ error: "收藏管理功能在 Vercel 上暂时不可用" });
      return;
    }

    if (pathname.startsWith("/api/video/search")) {
      const movieName = url.searchParams.get("name");
      const result = await searchVideoUrl(movieName);
      res.json(result);
      return;
    }

    const filePath = path.join(ROOT, pathname === "/" ? "/index.html" : pathname.replace(/^\/+/, ""));
    const relative = path.relative(ROOT, filePath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      res.status(403).send("无权访问");
      return;
    }

    try {
      const file = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const isAsset = pathname.startsWith("/assets/");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", isAsset ? "public, max-age=31536000, immutable" : "no-cache");
      res.send(file);
    } catch {
      res.status(404).send("没有找到文件");
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "服务器错误" });
  }
};
