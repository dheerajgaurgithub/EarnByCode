import React from 'react';

export interface Achievement {
  title: string;
  description: string;
  earned: boolean;
}

interface AchievementModalProps { open: boolean; onClose: () => void; achievement: Achievement | null }

export function AchievementModal({ open, onClose, achievement }: AchievementModalProps) {
  if (!open || !achievement) return null;
  const earned = achievement.earned;
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!earned || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let running = true;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7'];
    const P = 60;
    const particles = Array.from({ length: P }).map(() => ({
      x: Math.random() * canvas.clientWidth,
      y: -10 + Math.random() * 10,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 2,
      size: 4 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      rot: Math.random() * Math.PI,
      vr: -0.1 + Math.random() * 0.2,
    }));
    const start = performance.now();
    const duration = 1800; // ms
    const step = (t: number) => {
      if (!running) return;
      const elapsed = t - start;
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.rot += p.vr;
        p.life += 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      });
      if (elapsed < duration) {
        raf = requestAnimationFrame(step);
      } else {
        setTimeout(() => { running = false; }, 200);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [earned]);

  const onShare = async () => {
    try {
      const shareText = `I just unlocked: ${achievement.title} on AlgoBucks! 🎉`;
      if ((navigator as any).share) {
        try { await (navigator as any).share({ title: 'AlgoBucks Achievement', text: shareText, url: window.location.href }); return; } catch {}
      }
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-blue-200 dark:border-gray-700 max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {earned && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl select-none">🎉✨🎊</div>
        )}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">{achievement.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
        </div>
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">{achievement.description}</p>
        <div className={`p-3 rounded-lg ${earned ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'}`}>
          {earned ? 'Unlocked! Congratulations on achieving this milestone! 🥳' : 'You are close! Keep going to unlock this achievement! 🚀'}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="relative w-full h-0">
            <canvas ref={canvasRef} className="pointer-events-none absolute -top-32 left-0 w-full h-32"></canvas>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I just unlocked: ' + achievement.title + ' on AlgoBucks! 🎉')}&url=${encodeURIComponent(window.location.href)}&via=AlgoBucks`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-900 text-sm"
            >
              Share on X
            </a>
            <button onClick={onShare} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm">
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementModal;
