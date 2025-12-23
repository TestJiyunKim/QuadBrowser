
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  RefreshCw, Maximize2, Minimize2, X, Plus, Minus, 
  Gamepad2, Move, Globe, LayoutGrid, Monitor, Settings
} from 'lucide-react';

interface FrameConfig {
  id: number;
  url: string; 
  isMaximized?: boolean;
}

const BrowserFrame: React.FC<{
  frame: FrameConfig;
  onUpdateFrame: (id: number, updates: Partial<FrameConfig>) => void;
  onMaximize: (id: number) => void;
  onRestore: () => void;
  onClose: () => void;
  isMaximizedMode: boolean;
}> = ({ frame, onUpdateFrame, onMaximize, onRestore, onClose, isMaximizedMode }) => {
  const [inputUrl, setInputUrl] = useState(frame.url);
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showPad, setShowPad] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  if (isMaximizedMode && !frame.isMaximized) return null;

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateFrame(frame.id, { url: inputUrl.trim() });
    setKey(k => k + 1);
  };

  const handleZoom = (delta: number) => setScale(prev => Math.max(0.1, Math.min(prev + delta, 5.0)));
  const handleReset = () => { setScale(1.0); setPosition({ x: 0, y: 0 }); setIsDragMode(false); };

  const onPointerDown = (e: React.PointerEvent) => { 
    if (isDragMode) { 
      setIsDragging(true); 
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      try { (e.target as Element).setPointerCapture(e.pointerId); } catch(err) {}
    } 
  };
  
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isDragMode) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (isDragMode) try { (e.target as Element).releasePointerCapture(e.pointerId); } catch(e){}
  };

  return (
    <div className={`frame-item ${frame.isMaximized ? "fixed inset-0 z-50 m-0 border-0 rounded-none shadow-none" : ""}`}>
      {/* Frame Header - Minimal & Functional */}
      <div className="flex items-center h-9 px-3 bg-[#111] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 flex-grow overflow-hidden">
          <div className="w-5 h-5 rounded bg-blue-600 text-[11px] font-black text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
            {frame.id}
          </div>
          <input 
            type="text" 
            value={inputUrl} 
            onChange={e => setInputUrl(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleApplyUrl()} 
            className="flex-grow bg-black/40 border border-white/10 rounded px-3 h-6 text-[11px] text-zinc-300 focus:text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none min-w-0 transition-all"
            placeholder="enter address..."
          />
        </div>

        <div className="flex items-center gap-1 ml-3">
          <button onClick={() => setKey(k => k + 1)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded transition-all"><RefreshCw size={14}/></button>
          <button onClick={() => setShowPad(!showPad)} className={`p-1.5 rounded transition-all ${showPad ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:bg-white/5'}`}><Gamepad2 size={14}/></button>
          {frame.isMaximized ? (
            <button onClick={onRestore} className="p-1.5 text-blue-400 bg-blue-500/10 rounded"><Minimize2 size={14}/></button>
          ) : (
            <button onClick={() => onMaximize(frame.id)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded"><Maximize2 size={14}/></button>
          )}
          <button onClick={onClose} className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded"><X size={14}/></button>
        </div>
      </div>

      {/* Control Pad Floating */}
      {showPad && (
        <div className="absolute top-11 right-3 z-40 bg-zinc-900 border border-white/10 p-2.5 rounded-xl shadow-2xl w-32 animate-in fade-in zoom-in-95 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => handleZoom(0.1)} className="bg-white/5 h-9 rounded-lg flex items-center justify-center hover:bg-white/10"><Plus size={16}/></button>
            <button onClick={() => handleZoom(-0.1)} className="bg-white/5 h-9 rounded-lg flex items-center justify-center hover:bg-white/10"><Minus size={16}/></button>
            <button onClick={handleReset} className="col-span-2 bg-red-900/30 text-red-400 text-[9px] h-7 rounded-lg font-bold uppercase tracking-wider hover:bg-red-900/40">Reset View</button>
            <button 
              onClick={() => setIsDragMode(!isDragMode)} 
              className={`col-span-2 h-9 rounded-lg flex items-center justify-center gap-2 text-[9px] font-bold transition-all ${isDragMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-zinc-400'}`}
            >
              <Move size={12}/> {isDragMode ? 'UNLOCK' : 'LOCK & PAN'}
            </button>
          </div>
        </div>
      )}

      {/* Viewport Content */}
      <div 
        className="flex-grow relative overflow-hidden bg-black"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {frame.url ? (
          <div className="w-full h-full" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: 'center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
            <iframe 
              key={key} 
              src={`https://${frame.url}`} 
              style={{ pointerEvents: isDragMode ? 'none' : 'auto' }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
            <Globe size={48} className="mb-3 text-zinc-500"/>
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase">Input Terminal Address</span>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const [frames, setFrames] = useState<FrameConfig[]>([
    { id: 1, url: '172.16.8.91/remote-access' },
    { id: 2, url: '172.16.8.92/remote-access' },
    { id: 3, url: '172.16.8.93/remote-access' },
    { id: 4, url: '172.16.8.94/remote-access' },
  ]);

  useEffect(() => {
    const loader = document.getElementById('loading-container');
    if (loader) {
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, []);

  const onUpdateFrame = (id: number, updates: Partial<FrameConfig>) => setFrames(fs => fs.map(f => f.id === id ? {...f, ...updates} : f));
  const isAnyMax = frames.some(f => f.isMaximized);

  return (
    <div className="flex flex-col h-full w-full bg-black text-slate-200 overflow-hidden">
      {/* Main OS-style Header */}
      {!isAnyMax && (
        <header className="h-11 shrink-0 bg-black border-b border-white/10 flex items-center justify-between px-5">
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl shadow-blue-900/40">
              <LayoutGrid size={16} className="text-white"/>
            </div>
            <div>
              <h1 className="text-[12px] font-black tracking-tighter leading-none text-white">QUADBROWSER <span className="text-blue-500 font-normal">v44</span></h1>
              <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-1">Industrial Monitor System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-zinc-900/50 rounded-full border border-white/5 text-[9px] font-bold text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              CORE ACTIVE
            </div>
            <button className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors"><Settings size={18}/></button>
          </div>
        </header>
      )}

      {/* Grid Container */}
      <main className={`grid-master ${isAnyMax ? 'p-0 gap-0' : ''}`}>
        {frames.map(f => (
          <BrowserFrame 
            key={f.id} 
            frame={f} 
            onUpdateFrame={onUpdateFrame} 
            onMaximize={id => setFrames(fs => fs.map(x => ({...x, isMaximized: x.id === id})))} 
            onRestore={() => setFrames(fs => fs.map(x => ({...x, isMaximized: false})))} 
            onClose={() => onUpdateFrame(f.id, {url: ''})}
            isMaximizedMode={isAnyMax}
          />
        ))}
      </main>

      {/* System Footer */}
      {!isAnyMax && (
        <footer className="h-7 shrink-0 bg-black border-t border-white/5 flex items-center justify-between px-5 text-[9px] text-zinc-600 font-mono">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5"><Monitor size={10}/> DISPLAY: QUAD_SYNC</span>
            <span>OS: DEX_ENGINE</span>
          </div>
          <div className="text-blue-700 font-black tracking-widest uppercase">Samsung DeX Optimized</div>
        </footer>
      )}
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
