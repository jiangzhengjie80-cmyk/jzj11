const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// 云环境配置
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// MIME类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// CORS头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 模拟数据存储（在云环境中使用内存存储）
let collection = [];

// 静态文件服务
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('文件未找到');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

// API路由处理
function handleApiRoutes(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 设置CORS头
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API路由
  if (pathname === '/api/collection' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ movies: collection }));
    return;
  }
  
  if (pathname === '/api/collection/add' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { sourceId } = JSON.parse(body);
        const newMovie = {
          id: sourceId,
          title: `电影 ${collection.length + 1}`,
          year: new Date().getFullYear(),
          watched: false,
          addedAt: new Date().toISOString()
        };
        
        collection.push(newMovie);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ movies: collection, added: newMovie }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '无效的请求数据' }));
      }
    });
    return;
  }
  
  // 其他API路由返回404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'API路由未找到' }));
}

// 主请求处理函数
function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 处理API请求
  if (pathname.startsWith('/api/')) {
    handleApiRoutes(req, res);
    return;
  }
  
  // 处理静态文件
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(ROOT, '..', filePath);
  
  // 安全检查
  if (!filePath.startsWith(path.join(ROOT, '..'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('禁止访问');
    return;
  }
  
  serveStaticFile(filePath, res);
}

// 创建服务器
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`电影收藏网站服务器运行在端口 ${PORT}`);
  console.log(`访问地址: http://localhost:${PORT}`);
});

module.exports = server;