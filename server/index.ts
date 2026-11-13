import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import {
  loadVaultMeta,
  getSceneCode,
  upsertCustomSceneCode,
  deleteCustomScene,
  importDirectorBundle,
  getStageScriptById,
  upsertStageScript,
  deleteStageScript,
} from './sceneManagerService';
import {
  loadCups,
  saveCups,
  enqueueCupsForRender,
  invalidateRemotionBundleCache,
  buildTraNguoiCaption,
  CupRecord,
} from './renderQueueService';
import { VideoInputSchema } from '../src/schemas/videoSchema';
import { heuristicFallbackMapper } from '../src/automation/semanticMapper';
import { ensureValidPivotSubstring } from '../src/automation/validator';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.resolve(PROJECT_ROOT, 'public/audio');
const OUTPUT_DIR = path.resolve(PROJECT_ROOT, 'output');
const AUTO_TRIGGER_PATH = path.resolve(
  PROJECT_ROOT,
  'data/auto-render-trigger.json'
);

fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export function createStudioApiApp() {
  const app = express();
  app.use(cors());
  app.use('/api', express.json({ limit: '5mb' }));

  // Phục vụ trực tiếp các video MP4 đã xuất và các tệp WAV Foley tổng hợp
  app.use('/output', express.static(OUTPUT_DIR));
  app.use('/audio', express.static(AUDIO_DIR));

  // 1. Health Check & Clean Shutdown
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      version: '8.3.1',
      mode: 'universal-stage-script-engine-9x16-foley-master',
    });
  });

  app.post('/api/system/shutdown', (_req, res) => {
    res.json({
      ok: true,
      message: 'Đã nhận lệnh dừng tiến trình ngầm Trà Nguội Studio.',
    });
    setTimeout(() => {
      process.exit(0);
    }, 200);
  });

  // 2. Kho Cảnh & Quản lý Code Cảnh .tsx (Scene Manager)
  app.get('/api/vault', (_req, res) => {
    res.json({ scenes: loadVaultMeta() });
  });

  app.get('/api/scenes/:sceneId/code', (req, res) => {
    try {
      const data = getSceneCode(req.params.sceneId);
      res.json(data);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/scenes/upsert', (req, res) => {
    try {
      const result = upsertCustomSceneCode({
        sceneId: String(req.body?.sceneId || 'CUSTOM_SCENE'),
        name: req.body?.name,
        description: req.body?.description,
        act1: req.body?.act1,
        act2AtPivot: req.body?.act2AtPivot,
        act3Afterimage: req.body?.act3Afterimage,
        redProp: req.body?.redProp,
        tsxCode: String(req.body?.tsxCode || ''),
        cupId: req.body?.cupId,
        onInvalidateBundle: invalidateRemotionBundleCache,
      });
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.delete('/api/scenes/:sceneId', (req, res) => {
    try {
      if (req.params.sceneId.startsWith('SCRIPT_')) {
        const result = deleteStageScript(req.params.sceneId);
        invalidateRemotionBundleCache();
        res.json(result);
        return;
      }
      const result = deleteCustomScene(
        req.params.sceneId,
        invalidateRemotionBundleCache
      );
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 3. Kho Kịch Bản Sân Khấu Khai Báo JSON (V7.0 StageScript)
  app.get('/api/stage-scripts/:sceneId', (req, res) => {
    try {
      const data = getStageScriptById(req.params.sceneId);
      res.json(data);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/stage-scripts/upsert', (req, res) => {
    try {
      const result = upsertStageScript({
        sceneId: req.body?.sceneId,
        name: req.body?.name,
        description: req.body?.description,
        rawScript: req.body?.script ?? req.body?.rawScript,
        cupId: req.body?.cupId,
      });
      invalidateRemotionBundleCache();
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.delete('/api/stage-scripts/:sceneId', (req, res) => {
    try {
      const result = deleteStageScript(req.params.sceneId);
      invalidateRemotionBundleCache();
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 4. Nạp Gói Đạo Diễn (Direct Cup Bundle JSON Import)
  app.post('/api/bundles/import', (req, res) => {
    try {
      const result = importDirectorBundle(
        req.body,
        invalidateRemotionBundleCache
      );
      res.json(result);
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 5. Quản lý Danh sách Chén (Cups CRUD)
  function computeNextCupIdentity(existingCups: CupRecord[]): {
    id: string;
    cupNumber: string;
  } {
    let maxNum = 0;
    for (const c of existingCups) {
      const m = c.id.match(/\d+/) || c.cupNumber.match(/\d+/);
      if (m) maxNum = Math.max(maxNum, parseInt(m[0], 10));
    }
    const next = maxNum + 1;
    const padded2 = String(next).padStart(2, '0');
    const padded3 = String(next).padStart(3, '0');
    return { id: `quote-${padded3}`, cupNumber: padded2 };
  }

  app.get('/api/cups', (_req, res) => {
    res.json({ cups: loadCups() });
  });

  app.post('/api/cups', (req, res) => {
    try {
      const cups = loadCups();
      const { id, cupNumber } = computeNextCupIdentity(cups);

      const body = req.body || {};
      let props;
      if (body.props) {
        props = VideoInputSchema.parse({
          stageTuning: { offsetX: 0, offsetY: 0, scale: 1, strokeScale: 1 },
          ...body.props,
          id,
        });
      } else {
        const rawText =
          typeof body.rawText === 'string' && body.rawText.trim()
            ? body.rawText.trim()
            : 'Ngồi xuống uống chén trà\nMọi chuyện rồi sẽ qua.';
        const mapped = heuristicFallbackMapper({
          id,
          rawText,
          title: body.title || 'Trà chiều',
          pivotWord: body.pivotWord,
          themeId: body.themeId || 'MINIMAL_LIGHT',
          brandText: 'TRÀ NGUỘI',
        });
        mapped.motion.sceneId = body.sceneId || mapped.motion.archetype;
        mapped.stageTuning = { offsetX: 0, offsetY: 0, scale: 1, strokeScale: 1 };
        props = mapped;
      }

      const newCup: CupRecord = {
        id,
        cupNumber,
        status: 'draft',
        progress: 0,
        captionText: buildTraNguoiCaption(id, props),
        props,
      };

      cups.push(newCup);
      saveCups(cups);
      res.json({ cup: newCup, cups });
    } catch (err: unknown) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.put('/api/cups/:id', (req, res) => {
    try {
      const cups = loadCups();
      const idx = cups.findIndex((c) => c.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Không tìm thấy Chén này.' });
        return;
      }

      const incomingProps = VideoInputSchema.parse({
        ...cups[idx].props,
        ...(req.body?.props || {}),
        id: cups[idx].id,
      });
      incomingProps.pivotWord = ensureValidPivotSubstring(
        incomingProps.segments,
        incomingProps.pivotWord
      );

      const activeSceneId =
        incomingProps.motion.sceneId || incomingProps.motion.archetype;
      if (activeSceneId.startsWith('SCRIPT_')) {
        if (
          !incomingProps.motion.stageScript ||
          incomingProps.motion.stageScript.sceneId !== activeSceneId
        ) {
          const scriptEntry = getStageScriptById(activeSceneId);
          if (scriptEntry.isScript) {
            incomingProps.motion.stageScript = scriptEntry.script;
          }
        }
      } else {
        incomingProps.motion.stageScript = undefined;
      }

      cups[idx] = {
        ...cups[idx],
        props: incomingProps,
        captionText: buildTraNguoiCaption(cups[idx].id, incomingProps),
      };
      saveCups(cups);
      res.json({ cup: cups[idx] });
    } catch (err: unknown) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.delete('/api/cups/:id', (req, res) => {
    const cups = loadCups().filter((c) => c.id !== req.params.id);
    saveCups(cups);
    res.json({ cups });
  });

  // 6. Hàng đợi Xuất Video MP4 Hàng loạt
  app.post('/api/render/enqueue', (req, res) => {
    const cupIds: string[] = Array.isArray(req.body?.cupIds)
      ? req.body.cupIds
      : [];
    if (cupIds.length === 0) {
      res
        .status(400)
        .json({ error: 'Vui lòng chọn ít nhất 1 Chén để xuất video.' });
      return;
    }
    const enqueued = enqueueCupsForRender(cupIds);
    res.json({ enqueued, cups: loadCups() });
  });

  app.get('/api/render/status', (_req, res) => {
    res.json({ cups: loadCups() });
  });

  // 6b. Kho Bản sao Airtable Cục bộ (đồng bộ 2 chiều với Tủ Chén & Lịch Đăng)
  const airtableCachePath = path.resolve(
    PROJECT_ROOT,
    'data/airtable-cache.json'
  );

  app.get('/api/airtable/cache', (_req, res) => {
    if (!fs.existsSync(airtableCachePath)) {
      res.json({ cache: null });
      return;
    }
    try {
      const cache = JSON.parse(fs.readFileSync(airtableCachePath, 'utf-8'));
      res.json({ cache });
    } catch {
      res.json({ cache: null });
    }
  });

  app.post('/api/airtable/cache', (req, res) => {
    try {
      const cache = req.body?.cache;
      if (!cache || typeof cache !== 'object') {
        res.status(400).json({ error: 'Dữ liệu cache Airtable không hợp lệ.' });
        return;
      }
      fs.mkdirSync(path.dirname(airtableCachePath), { recursive: true });
      fs.writeFileSync(
        airtableCachePath,
        JSON.stringify(cache, null, 2),
        'utf-8'
      );
      res.json({ ok: true, cache });
    } catch (err: unknown) {
      res.status(400).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  // 7. Hộp thư Tự động Nạp & Xuất Video
  setInterval(() => {
    if (!fs.existsSync(AUTO_TRIGGER_PATH)) return;
    try {
      const raw = fs.readFileSync(AUTO_TRIGGER_PATH, 'utf-8');
      fs.unlinkSync(AUTO_TRIGGER_PATH);
      const payload = JSON.parse(raw);

      if (payload.upsertScript && payload.upsertScript.sceneId) {
        upsertStageScript({
          sceneId: payload.upsertScript.sceneId,
          name: payload.upsertScript.name,
          description: payload.upsertScript.description,
          rawScript: payload.upsertScript.script ?? payload.upsertScript,
          cupId: payload.upsertScript.cupId,
        });
        invalidateRemotionBundleCache();
      }

      const targetIds: string[] = [];
      if (payload.createCupProps) {
        const cups = loadCups();
        const { id, cupNumber } = computeNextCupIdentity(cups);
        const props = VideoInputSchema.parse({
          stageTuning: { offsetX: 0, offsetY: 0, scale: 1, strokeScale: 1 },
          ...payload.createCupProps,
          id,
        });
        props.pivotWord = ensureValidPivotSubstring(
          props.segments,
          props.pivotWord
        );
        const newCup: CupRecord = {
          id,
          cupNumber,
          status: 'draft',
          progress: 0,
          captionText: buildTraNguoiCaption(id, props),
          props,
        };
        cups.push(newCup);
        saveCups(cups);
        if (!payload.skipRender) targetIds.push(id);
      }

      if (payload.updateCup && payload.updateCup.id) {
        const cups = loadCups();
        const idx = cups.findIndex((c) => c.id === payload.updateCup.id);
        if (idx !== -1) {
          const incomingProps = VideoInputSchema.parse({
            ...cups[idx].props,
            ...payload.updateCup.props,
            id: cups[idx].id,
          });
          incomingProps.pivotWord = ensureValidPivotSubstring(
            incomingProps.segments,
            incomingProps.pivotWord
          );
          cups[idx] = {
            ...cups[idx],
            props: incomingProps,
            captionText: buildTraNguoiCaption(cups[idx].id, incomingProps),
          };
          saveCups(cups);
          if (!payload.skipRender) targetIds.push(cups[idx].id);
        }
      }

      if (Array.isArray(payload.cupIds) && !payload.skipRender) {
        for (const cid of payload.cupIds) {
          if (!targetIds.includes(cid)) targetIds.push(cid);
        }
      }

      if (targetIds.length > 0) {
        console.log(
          `🎬 [Auto-Render DropBox] Đang kết xuất tự động: ${targetIds.join(', ')}`
        );
        enqueueCupsForRender(targetIds);
      }
    } catch (err) {
      console.error('[Auto-Render DropBox] Lỗi xử lý file trigger:', err);
    }
  }, 1500);

  return app;
}

if (require.main === module) {
  const app = createStudioApiApp();
  const PORT = Number(process.env.SERVER_PORT || 3689);
  app.listen(PORT, () => {
    console.log(
      `🍵 [Trà Nguội Workbench API V8.3 · 9:16 SafeZone + Foley Master] Đang chạy tại http://localhost:${PORT}`
    );
  });
}
