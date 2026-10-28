import React, { useEffect, useRef } from 'react';
import { useAudio } from '../context/AudioContext';

interface VisualizerProps {
  height?: number;
  barCount?: number;
  interactive?: boolean;
  className?: string;
}

export const AudioVisualizer: React.FC<VisualizerProps> = ({
  height = 48,
  barCount = 36,
  className = '',
}) => {
  const { analyserNode, isPlaying } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : barCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Subtle ambient idle pulse when paused
        const t = performance.now() * 0.003;
        for (let i = 0; i < barCount; i++) {
          dataArray[i] = isPlaying ? Math.sin(t + i * 0.4) * 40 + 50 : 12;
        }
      }

      const barWidth = (width / barCount) * 0.75;
      const gap = (width - barWidth * barCount) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        const step = Math.floor((i / barCount) * (dataArray.length * 0.75));
        const value = dataArray[step] || 8;
        const percent = Math.min(1, Math.max(0.08, value / 255));
        const barHeight = percent * h * 0.9;

        const x = i * (barWidth + gap);
        const y = h - barHeight;

        // Gradient matching BC Africa logo (cyan to deep royal blue)
        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, '#38bdf8'); // sky light blue
        gradient.addColorStop(0.6, '#0284c7'); // cerulean
        gradient.addColorStop(1, '#1d4ed8'); // royal blue

        ctx.fillStyle = gradient;
        // Rounded bar top
        const radius = Math.min(barWidth / 2, 4);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 1, 1]);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyserNode, isPlaying, barCount]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        width={240}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
