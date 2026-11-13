import React from 'react';
import { X, Film, Sparkles, Check } from 'lucide-react';
import { VaultSceneMeta } from '../types';

interface Props {
  isOpen: boolean;
  scenes: VaultSceneMeta[];
  activeSceneId?: string;
  onSelectScene: (sceneId: string) => void;
  onClose: () => void;
}

export const VaultExplorerModal: React.FC<Props> = ({
  isOpen,
  scenes,
  activeSceneId,
  onSelectScene,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-tea-border bg-tea-paper shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-tea-border px-6 py-4 bg-tea-bg/60">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-tea-accent" />
            <h2 className="font-serif text-lg font-semibold text-tea-ink">
              Kho Kịch Bản 3 Hồi Trà Nguội ({scenes.length} Truyện Ngụ Ngôn)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-tea-muted hover:bg-tea-edge/60 hover:text-tea-ink"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenes.map((scene) => {
            const isSelected = scene.sceneId === activeSceneId;
            return (
              <div
                key={scene.sceneId}
                className={`p-4 rounded-xl border transition flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-tea-accent bg-tea-accent/5 shadow-sm'
                    : 'border-tea-border bg-white/75 hover:border-tea-accent/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tea-edge/70 text-tea-muted mr-2">
                        {scene.category === 'TRAVELER'
                          ? 'Kẻ Lữ Hành'
                          : 'Đồ Vật Ẩn Dụ'}
                      </span>
                      {scene.origin === 'script' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tea-accent/15 text-tea-accent">
                          <Sparkles className="w-3 h-3" /> Stage Script JSON
                        </span>
                      )}
                      {scene.origin === 'custom' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-tea-edge/90 text-tea-ink">
                          Code .tsx
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-tea-muted">
                      Đã dùng: {scene.usageCount} lần
                    </span>
                  </div>

                  <h3 className="font-serif font-semibold text-base text-tea-ink mb-2">
                    {scene.name}
                  </h3>

                  <div className="space-y-1 text-xs text-tea-muted leading-relaxed">
                    <p>
                      <strong className="text-tea-ink">Hồi I:</strong> {scene.act1}
                    </p>
                    <p>
                      <strong className="text-tea-ink">Hồi II (Pivot):</strong>{' '}
                      {scene.act2AtPivot}
                    </p>
                    <p>
                      <strong className="text-tea-ink">Hồi III:</strong>{' '}
                      {scene.act3Afterimage}
                    </p>
                    <p className="text-tea-accent font-medium pt-0.5">
                      • Đạo cụ Đỏ: {scene.redProp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-tea-border/60">
                  <code className="text-[11px] text-tea-muted">
                    {scene.sceneId}
                  </code>
                  <button
                    onClick={() => {
                      onSelectScene(scene.sceneId);
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      isSelected
                        ? 'bg-tea-accent text-white'
                        : 'bg-tea-edge/80 text-tea-ink hover:bg-tea-accent hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Đang chọn
                      </>
                    ) : (
                      'Chọn kịch bản này'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
