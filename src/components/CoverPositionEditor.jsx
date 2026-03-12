import { useState } from 'react';
import { Move, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CoverPositionEditor({ 
  coverUrl, 
  initialPosition = { x: 50, y: 50 }, 
  initialZoom = 100,
  onSave, 
  onCancel 
}) {
  const [position, setPosition] = useState(initialPosition);
  const [zoom, setZoom] = useState(initialZoom);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - rect.top) / rect.height) * 100));
    setPosition({ x, y });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] bg-black/80 flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl">
        <p className="text-white text-sm mb-3 text-center flex items-center justify-center gap-2">
          <Move className="w-4 h-4" /> Drag to reposition • Use zoom to resize
        </p>
        
        {/* Preview area */}
        <div
          className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border-2 border-purple-500/50 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <img
            src={coverUrl}
            alt="Cover preview"
            className="absolute w-full h-full select-none pointer-events-none"
            style={{
              objectFit: 'cover',
              objectPosition: `${position.x}% ${position.y}%`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: `${position.x}% ${position.y}%`,
            }}
            draggable={false}
          />
          {/* Crosshair indicator */}
          <div 
            className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none"
            style={{ 
              left: `${position.x}%`, 
              top: `${position.y}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }}
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setZoom(Math.max(100, zoom - 10))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="w-12 text-center">{zoom}%</span>
            <input
              type="range"
              min="100"
              max="200"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32 accent-purple-500"
            />
          </div>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={() => onSave({ position, zoom })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
          >
            <Check className="w-4 h-4" /> Save Position
          </button>
        </div>
      </div>
    </motion.div>
  );
}