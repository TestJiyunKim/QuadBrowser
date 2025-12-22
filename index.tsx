
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Maximize2, Minimize2, X, Plus, Minus, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, KeyRound, Monitor, MousePointer2, Gamepad2, Move, ChevronDown, ExternalLink, ShieldAlert } from 'lucide-react';

// --- Types ---
interface FrameConfig {
  id: number;
  url: string;
  title?: string;
  isMaximized?: boolean;
}

// --- BrowserFrame Component ---
interface BrowserFrameProps {
  frame: FrameConfig;
  spanClass: string;
  onUpdateUrl: (id: number, url: string) => void;
  onMaximize: (id: number) => void;
  onRestore: () => void;
  onClose: () => void;
  isMaximizedMode: boolean;
}

const BrowserFrame: React.FC<BrowserFrameProps> = ({
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
  const [scale, setScale] = useState(1.0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showPad, setShowPad] = useState(false);
  
  const [isDragMode, setIsDragMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setInputUrl(frame.url);
    setKey(prev => prev + 1);
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setShowPad(false);
    setIsDragMode(false);
  }, [frame.url]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?$/.test(finalUrl) || finalUrl.includes('localhost');
        finalUrl = `${isIP ? 'http' : 'https'}://${finalUrl}`;
    }
    setInputUrl(finalUrl);
    onUpdateUrl(frame.id, finalUrl);
  };

  const openExternal = () => window.open(inputUrl, '_blank');
  
  const openCertFix = () => {
    const win = window.open(inputUrl, '_blank');
    if (win) {
        setTimeout(() => alert("사설 인증서(HTTPS 에러)를 허용하신 후, 이 창에서 새로고침 버튼을 눌러주세요."), 500);
    }
  };

  const handleZoom = (delta: number) => {
    setScale(prev => parseFloat(Math.max(0.1, Math.min(prev + delta, 5.0)).toFixed(3)));
  };

  const handlePan = (dx: number, dy: number) => {
    const step = 25 / scale;
    setPosition(prev => ({ x: prev.x + dx * step, y: prev.y + dy * step }));
  };

  const handleReset = () => {
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setIsDragMode(false);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isDragMode) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({ x: positionRef.current.x + dx, y: positionRef.current.y + dy });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => setIsDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    if (isDragMode) {
      e.preventDefault(); 
      e.stopPropagation();
      handleZoom(e.deltaY < 0 ? 0.05 : -0.05);
    }
  };

  const toggleDragMode = () => {
    setIsDragMode(prev => !prev);
    setIsDragging(false);
  };

  const copyCredentials = () => navigator.clipboard.writeText("admin");

  if (isMaximizedMode && !frame.isMaximized) return null;

  const containerClasses = `frame-container ${frame.isMaximized ? "maximized" : spanClass}`;
  const isInternalIp = inputUrl.includes('192.168.') || inputUrl.includes('172.') || inputUrl.includes('10.') || inputUrl.includes('localhost');

  return (
    <div className={`relative flex flex-col bg-gray-900 border border-gray-800 overflow-hidden ${containerClasses}`}>
      
      {/* Toolbar (opacity-0 by default, hover:opacity-100 via standard CSS if Tailwind fails) */}
      <div className="toolbar absolute top-0 left-0 right-0 h-9 z-30 bg-black/95 flex items-center px-1 gap-1 border-b border-gray-700 shadow-xl backdrop-blur-sm transition-opacity">
          <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0">{frame.id}</div>
          
          <form onSubmit={handleSubmit} className="flex-grow min-w-[50px]">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-[10px] text-gray-300 border-none focus:ring-0 px-1 outline-none font-mono"
            />
          </form>

          <div className="flex items-center gap-0.5 bg-gray-800/50 rounded p-0.5">
            <button onClick={() => setShowPad(!showPad)} title="Control Pad" className={`p-1 rounded ${showPad ? 'text-blue-400 bg-gray-700' : 'text-gray-400'}`}>
              <Gamepad2 size={12} />
            </button>
            <div className="w-px h-3 bg-gray-700 mx-0.5"></div>
            <button onClick={() => handleZoom(-0.05)} className="p-1 text-gray-400 hover:text-white"><Minus size={12} /></button>
            <span className="text-[9px] font-mono text-blue-400 w-8 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => handleZoom(0.05)} className="p-1 text-gray-400 hover:text-white"><Plus size={12} /></button>
            <button onClick={handleReset} className="p-1 text-green-500/80 hover:text-green-400"><Monitor size={12} /></button>
          </div>

          <div className="h-4 w-px bg-gray-700 mx-1"></div>
          
          {isInternalIp && (
             <button onClick={openCertFix} className="p-1 text-orange-500 animate-pulse"><ShieldAlert size={12} /></button>
          )}
          <button onClick={openExternal} className="p-1 text-blue-400"><ExternalLink size={12} /></button>
          <button onClick={copyCredentials} className="p-1 text-yellow-500/80"><KeyRound size={12} /></button>
          <button onClick={() => setKey(k => k + 1)} className="p-1 text-gray-400"><RefreshCw size={12} /></button>
          
          {frame.isMaximized ? (
            <button onClick={onRestore} className="p-1 text-blue-400"><Minimize2 size={12} /></button>
          ) : (
            <button onClick={() => onMaximize(frame.id)} className="p-1 text-gray-400"><Maximize2 size={12} /></button>
          )}
          <button onClick={onClose} className="p-1 text-red-800 hover:text-red-500"><X size={12} /></button>
      </div>

      {showPad && (
        <div className="absolute bottom-4 right-4 z-40 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/10 flex flex-col gap-1 shadow-2xl w-28" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPad(false)} className="w-full flex items-center justify-center p-1 bg-white/5 hover:bg-white/10 rounded-lg"><ChevronDown size={14} /></button>
            <div className="grid grid-cols-3 gap-1 h-28">
              <div className="flex items-center justify-center text-[9px] font-mono text-blue-400 bg-black/40 rounded border border-blue-900/30">{Math.round(scale * 100)}%</div>
              <button onClick={() => handlePan(0, 1)} className="bg-gray-800/50 hover:bg-blue-600 rounded flex items-center justify-center"><ArrowUp size={16} /></button>
              <button onClick={handleReset} className="bg-red-900/30 hover:bg-red-600 rounded flex items-center justify-center"><RotateCcw size={12} /></button>
              <button onClick={() => handlePan(1, 0)} className="bg-gray-800/50 hover:bg-blue-600 rounded flex items-center justify-center"><ArrowLeft size={16} /></button>
              <button onClick={toggleDragMode} className={`rounded flex items-center justify-center ${isDragMode ? 'bg-blue-600' : 'bg-gray-800/50'}`}><Move size={12} /></button>
              <button onClick={() => handlePan(-1, 0)} className="bg-gray-800/50 hover:bg-blue-600 rounded flex items-center justify-center"><ArrowRight size={16} /></button>
              <button onClick={() => handleZoom(0.05)} className="bg-blue-900/30 hover:bg-blue-600 rounded flex items-center justify-center"><Plus size={16} /></button>
              <button onClick={() => handlePan(0, -1)} className="bg-gray-800/50 hover:bg-blue-600 rounded flex items-center justify-center"><ArrowDown size={16} /></button>
              <button onClick={() => handleZoom(-0.05)} className="bg-blue-900/30 hover:bg-blue-600 rounded flex items-center justify-center"><Minus size={16} /></button>
            </div>
        </div>
      )}

      <div className="flex-grow relative bg-gray-950 overflow-hidden flex items-center justify-center">
        {isDragMode && (
          <div className="absolute inset-0 z-20 cursor-move touch-none" onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel}>
            <div className="absolute top-2 right-2 bg-blue-600/80 text-white text-[9px] px-2 py-1 rounded shadow-lg">DRAG & ZOOM ON</div>
          </div>
        )}

        {frame.url && frame.url !== 'about:blank' ? (
          <div className="origin-center w-full h-full" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}>
            <iframe
                key={key}
                src={frame.url}
                className="w-full h-full border-0 block"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-presentation allow-downloads allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="text-gray-800 text-[10px] font-mono flex flex-col items-center gap-2">
            <MousePointer2 size={24} className="opacity-20" /> CH_{frame.id} READY
          </div>
        )}
      </div>
    </div>
  );
};

// --- App Component ---
const INITIAL_FRAMES: FrameConfig[] = [
  { id: 1, url: 'http://172.16.8.91/remote-access', isMaximized: false },
  { id: 2, url: 'http://172.16.8.92/remote-access', isMaximized: false },
  { id: 3, url: 'http://172.16.8.93/remote-access', isMaximized: false },
  { id: 4, url: 'http://172.16.8.94/remote-access', isMaximized: false },
];

function App() {
  const [frames, setFrames] = useState<FrameConfig[]>(INITIAL_FRAMES);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const loader = document.getElementById('loading-text');
    if (loader) loader.style.display = 'none';

    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleUpdateUrl = (id: number, url: string) => setFrames(prev => prev.map(f => f.id === id ? { ...f, url } : f));
  const handleMaximize = (id: number) => setFrames(prev => prev.map(f => ({ ...f, isMaximized: f.id === id })));
  const handleRestore = () => setFrames(prev => prev.map(f => ({ ...f, isMaximized: false })));
  const handleClose = (id: number) => frames.length > 1 && setFrames(prev => prev.filter(f => f.id !== id));

  const isAnyMaximized = frames.some(f => f.isMaximized);

  const getGridStyle = () => {
    if (isAnyMaximized) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (isPortrait) return { gridTemplateColumns: '1fr', gridTemplateRows: `repeat(${frames.length}, 1fr)` };
    if (frames.length === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (frames.length === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
    return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-black text-gray-100 font-sans overflow-hidden">
      <main className="h-full w-full relative bg-black overflow-hidden">
        <div className="grid-container h-full w-full grid gap-px bg-gray-900" style={getGridStyle()}>
          {frames.map((frame, index) => {
            let spanClass = "col-span-1 row-span-1";
            if (!isAnyMaximized && frames.length === 3 && !isPortrait) {
               // 유저 요청: 위/아래를 키워줘 (세로 늘리기)
               // 첫 번째 프레임을 왼쪽 열 전체(2행) 차지하게 하여 세로로 늘림
               if (index === 0) spanClass = "col-span-1 row-span-2";
            }
            return (
              <BrowserFrame
                key={frame.id}
                frame={frame}
                spanClass={spanClass}
                onUpdateUrl={handleUpdateUrl}
                onMaximize={handleMaximize}
                onRestore={handleRestore}
                onClose={() => handleClose(frame.id)}
                isMaximizedMode={isAnyMaximized}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
