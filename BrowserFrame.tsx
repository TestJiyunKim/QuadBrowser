
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Maximize2, Minimize2, X, Plus, Minus, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, KeyRound, Monitor } from 'lucide-react';
import { FrameConfig } from './types';

interface BrowserFrameProps {
  frame: FrameConfig;
  spanClass: string;
  onUpdateUrl: (id: number, url: string) => void;
  onMaximize: (id: number) => void;
  onRestore: () => void;
  onClose: () => void;
  isMaximizedMode: boolean;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  frame,
  spanClass,
  onUpdateUrl,
  onMaximize,
  onRestore,
  onClose,
  isMaximizedMode
}) => {
  const [inputUrl, setInputUrl] = useState(frame.url);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setInputUrl(frame.url);
    setKey(prev => prev + 1);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [frame.url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        if (/^(192|172|10|localhost|127)/.test(finalUrl)) {
            finalUrl = `https://${finalUrl}`; // Defaulting to https as requested
        } else {
            finalUrl = `https://${finalUrl}`;
        }
    }
    setInputUrl(finalUrl);
    onUpdateUrl(frame.id, finalUrl);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.max(0.3, Math.min(prev + delta, 5.0));
      return parseFloat(newScale.toFixed(2));
    });
  };

  const handlePan = (dx: number, dy: number) => {
    const step = 80 / scale;
    setPosition(prev => ({ x: prev.x + (dx * step), y: prev.y + (dy * step) }));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText("admin");
    alert("ID Copied");
  };

  if (isMaximizedMode && !frame.isMaximized) return null;

  const containerClasses = frame.isMaximized ? "absolute inset-0 z-50 bg-black" : spanClass;

  return (
    <div className={`relative flex flex-col bg-gray-900 border border-gray-800 overflow-hidden ${containerClasses}`}>
      
      {/* Top toolbar (Show on hover) */}
      <div className="absolute top-0 left-0 right-0 h-8 z-30 opacity-0 hover:opacity-100 transition-opacity bg-black/90 flex items-center px-2 gap-2 border-b border-gray-800">
          <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center text-[9px] font-bold text-white">{frame.id}</div>
          <form onSubmit={handleSubmit} className="flex-grow">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-[10px] text-gray-400 border-none focus:ring-0 px-1 outline-none"
            />
          </form>
          <button onClick={copyCredentials} title="Copy Creds" className="p-1 text-yellow-500/70 hover:text-yellow-500"><KeyRound size={12} /></button>
          <button onClick={() => setKey(k => k + 1)} title="Reload" className="p-1 text-gray-500 hover:text-white"><RefreshCw size={12} /></button>
          {frame.isMaximized ? (
            <button onClick={onRestore} title="Restore" className="p-1 text-blue-500"><Minimize2 size={12} /></button>
          ) : (
            <button onClick={() => onMaximize(frame.id)} title="Maximize" className="p-1 text-gray-500 hover:text-white"><Maximize2 size={12} /></button>
          )}
          <button onClick={onClose} title="Close" className="p-1 text-red-900 hover:text-red-500"><X size={12} /></button>
      </div>

      {/* Control Pad (3x3 Grid) */}
      <div className="absolute bottom-4 right-4 z-40 opacity-10 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/80 backdrop-blur p-1 rounded-xl border border-white/10 grid grid-cols-3 gap-1 w-28 h-28 shadow-2xl">
              <div className="flex items-center justify-center text-[9px] font-mono text-blue-400 bg-black/40 rounded border border-blue-900/30">
                {Math.round(scale * 100)}%
              </div>
              <button onClick={() => handlePan(0, 1)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><ArrowUp size={16} /></button>
              <button onClick={handleReset} className="bg-red-900/30 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors"><RotateCcw size={12} /></button>

              <button onClick={() => handlePan(1, 0)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><ArrowLeft size={16} /></button>
              <div className="flex items-center justify-center opacity-10"><div className="w-1 h-1 bg-white rounded-full"></div></div>
              <button onClick={() => handlePan(-1, 0)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><ArrowRight size={16} /></button>

              <button onClick={() => handleZoom(0.1)} className="bg-blue-900/30 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><Plus size={16} /></button>
              <button onClick={() => handlePan(0, -1)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><ArrowDown size={16} /></button>
              <button onClick={() => handleZoom(-0.1)} className="bg-blue-900/30 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors"><Minus size={16} /></button>
          </div>
      </div>

      <div className="flex-grow relative bg-white overflow-hidden flex items-center justify-center">
        {frame.url && frame.url !== 'about:blank' ? (
          <div 
            className="origin-top-left transition-transform duration-75 ease-out will-change-transform"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                width: `${100 / scale}%`,
                height: `${100 / scale}%`
            }}
          >
            <iframe
                key={key}
                src={frame.url}
                className="w-full h-full border-0 block"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                referrerPolicy="no-referrer"
                loading="lazy"
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-950">
             <div className="text-gray-800 text-[10px] font-mono tracking-widest flex flex-col items-center gap-2">
               <Monitor size={24} className="opacity-20" />
               CH_{frame.id} STANDBY
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
