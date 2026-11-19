#!/usr/bin/env node
/**
 * run-preview.mjs — Điểm chạy thống nhất cho `npm run preview -- <file.json> [sceneId] [--out=...]`.
 * Hoạt động nguyên bản trên cả macOS (darwin-arm64/x64) lẫn Linux (linux-arm64/x64):
 * - Nếu node_modules đã có binary esbuild + @resvg/resvg-js đúng hệ điều hành → chạy thẳng.
 * - Nếu chạy trên Linux arm64/x64 gắn chung node_modules cài từ macOS → tự cài 2 gói binary
 *   vào thư mục đệm tạm `/tmp/tra-nguoi-native-<platform>-<arch>` (không sửa node_modules repo),
 *   hoặc in lệnh 1 dòng nếu không có mạng.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

const platform = process.platform;
const arch = process.arch;

function detectLinuxLibc() {
  if (platform !== 'linux') return '';
  try {
    const report = process.report?.getReport?.();
    if (report?.header?.glibcVersionRuntime) return 'gnu';
  } catch {
    // ignore
  }
  return fs.existsSync('/lib/ld-musl-aarch64.so.1') || fs.existsSync('/lib/ld-musl-x86_64.so.1')
    ? 'musl'
    : 'gnu';
}

function getPlatformPackages() {
  const esbuildPkg = `@esbuild/${platform}-${arch}`;
  let resvgPkg = null;
  if (platform === 'darwin') {
    resvgPkg = `@resvg/resvg-js-darwin-${arch}`;
  } else if (platform === 'linux') {
    const libc = detectLinuxLibc();
    resvgPkg = `@resvg/resvg-js-linux-${arch}-${libc}`;
  } else if (platform === 'win32') {
    resvgPkg = `@resvg/resvg-js-win32-${arch}-msvc`;
  }
  return { esbuildPkg, resvgPkg };
}

function getInstalledVersion(pkgName) {
  try {
    const p = require.resolve(`${pkgName}/package.json`, { paths: [ROOT] });
    return JSON.parse(fs.readFileSync(p, 'utf8')).version;
  } catch {
    return null;
  }
}

function findEsbuildBin(baseDir, esbuildPkg) {
  const binName = platform === 'win32' ? 'esbuild.exe' : 'bin/esbuild';
  const candidate = path.join(baseDir, 'node_modules', esbuildPkg, binName);
  return fs.existsSync(candidate) ? candidate : null;
}

function hasResvgNative(baseDir, resvgPkg) {
  if (!resvgPkg) return true;
  return fs.existsSync(path.join(baseDir, 'node_modules', resvgPkg));
}

function ensureNativeRuntimeEnv() {
  const env = { ...process.env };
  const { esbuildPkg, resvgPkg } = getPlatformPackages();

  const repoEsbuild = findEsbuildBin(ROOT, esbuildPkg);
  const repoResvg = hasResvgNative(ROOT, resvgPkg);
  if (repoEsbuild && repoResvg) {
    return env;
  }

  // Fallback tự xử lý cho Linux arm64/x64 dùng chung node_modules từ macOS (không đụng repo)
  const cacheDir = path.join(os.tmpdir(), `tra-nguoi-native-${platform}-${arch}`);
  const missing = [];
  let cachedEsbuild = findEsbuildBin(cacheDir, esbuildPkg);
  let cachedResvg = hasResvgNative(cacheDir, resvgPkg);

  if (!repoEsbuild && !cachedEsbuild) {
    const esVer = getInstalledVersion('esbuild') || '0.21.5';
    missing.push(`${esbuildPkg}@${esVer}`);
  }
  if (!repoResvg && !cachedResvg && resvgPkg) {
    const rsVer = getInstalledVersion('@resvg/resvg-js') || '2.6.2';
    missing.push(`${resvgPkg}@${rsVer}`);
  }

  if (missing.length > 0) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.error(
      `[preview] Phát hiện thiếu binary native cho ${platform}-${arch} (${missing.join(', ')}) — đang tải vào thư mục đệm ${cacheDir}...`
    );
    const inst = spawnSync(
      'npm',
      ['install', '--prefix', cacheDir, '--no-save', '--no-audit', '--no-fund', '--force', ...missing],
      { stdio: 'inherit', cwd: ROOT }
    );
    if (inst.status !== 0) {
      console.error(
        `\n❌ Không tự tải được binary ${platform}-${arch}. Chạy 1 dòng sau trên máy Linux:\n` +
          `   npm install --no-save --force ${missing.join(' ')}\n`
      );
      process.exit(1);
    }
    cachedEsbuild = findEsbuildBin(cacheDir, esbuildPkg);
    cachedResvg = hasResvgNative(cacheDir, resvgPkg);
  }

  if (!repoEsbuild && cachedEsbuild) {
    env.ESBUILD_BINARY_PATH = cachedEsbuild;
  }
  const cacheNodeModules = path.join(cacheDir, 'node_modules');
  if (fs.existsSync(cacheNodeModules)) {
    env.NODE_PATH = env.NODE_PATH
      ? `${cacheNodeModules}${path.delimiter}${env.NODE_PATH}`
      : cacheNodeModules;
  }
  return env;
}

const env = ensureNativeRuntimeEnv();
const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const targetScript = path.join(ROOT, 'scripts', 'stage-preview.mjs');
const forwardedArgs = process.argv.slice(2);

const run = spawnSync(process.execPath, [tsxCli, targetScript, ...forwardedArgs], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
});

process.exit(run.status ?? 1);
