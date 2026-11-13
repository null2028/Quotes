import http from 'http';
import path from 'path';
import { execFile } from 'child_process';
import react from '@vitejs/plugin-react';
import { createServer as createViteServer } from 'vite';
import { createStudioApiApp } from './index';

const DEFAULT_STUDIO_PORT = 3688;

function openBrowser(url: string, onDone?: () => void) {
  execFile('/usr/bin/open', [url], () => {
    onDone?.();
  });
}

function requestPreviousInstanceShutdown(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/system/shutdown',
        method: 'POST',
        timeout: 600,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function tryListenOnce(server: http.Server, port: number): Promise<'ok' | 'in_use'> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.removeListener('listening', onListening);
      if (err.code === 'EADDRINUSE') {
        resolve('in_use');
      } else {
        reject(err);
      }
    };
    const onListening = () => {
      server.removeListener('error', onError);
      resolve('ok');
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port);
  });
}

async function startUnifiedStudio() {
  const PORT = Number(process.env.STUDIO_PORT || DEFAULT_STUDIO_PORT);
  const url = `http://localhost:${PORT}`;
  const projectRoot = path.resolve(__dirname, '..');

  // Dọn tiến trình cổng 3300 cũ nếu còn sót từ phiên trước
  if (PORT !== 3300) {
    void requestPreviousInstanceShutdown(3300);
  }

  let requestHandler: http.RequestListener = (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html><head><meta http-equiv="refresh" content="1"></head><body style="background:#141312;color:#e7e2d8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">Đang khởi động Trà Nguội Studio...</body></html>'
    );
  };

  let httpServer = http.createServer((req, res) => {
    requestHandler(req, res);
  });

  let bindResult = await tryListenOnce(httpServer, PORT);

  if (bindResult === 'in_use') {
    const replacedOld = await requestPreviousInstanceShutdown(PORT);
    if (replacedOld) {
      await new Promise((r) => setTimeout(r, 450));
      httpServer = http.createServer((req, res) => {
        requestHandler(req, res);
      });
      bindResult = await tryListenOnce(httpServer, PORT);
    }
  }

  if (bindResult === 'in_use') {
    console.log(
      `🍵 [Trà Nguội Studio] Cổng ${PORT} đang hoạt động, mở thẳng trình duyệt: ${url}`
    );
    if (process.env.AUTO_OPEN_BROWSER === '1') {
      openBrowser(url, () => process.exit(0));
    } else {
      process.exit(0);
    }
    return;
  }

  const app = createStudioApiApp();

  const vite = await createViteServer({
    configFile: false,
    root: path.resolve(projectRoot, 'studio-ui'),
    publicDir: path.resolve(projectRoot, 'public'),
    plugins: [react()],
    css: {
      postcss: path.resolve(projectRoot, 'studio-ui/postcss.config.cjs'),
    },
    resolve: {
      alias: {
        '@core': path.resolve(projectRoot, 'src'),
      },
    },
    server: {
      middlewareMode: true,
      hmr: {
        server: httpServer,
      },
      fs: {
        allow: [projectRoot],
      },
      proxy: {
        '/airtable-api': {
          target: 'https://api.airtable.com/v0',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/airtable-api/, ''),
        },
      },
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);
  requestHandler = app;

  console.log(
    `🍵 [Trà Nguội Studio] Đang chạy ngầm tại ${url} (arch=${process.arch}, pid=${process.pid})`
  );

  if (process.env.AUTO_OPEN_BROWSER === '1') {
    openBrowser(url);
  }
}

void startUnifiedStudio().catch((err) => {
  console.error('[Trà Nguội Studio] Lỗi khởi động:', err);
  process.exit(1);
});
