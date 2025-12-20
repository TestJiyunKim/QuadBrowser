
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Maximize2, Minimize2, X, Plus, Minus, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, KeyRound, Monitor, MousePointer2, Gamepad2, Move } from 'lucide-react';
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
  // Default scale 0.75 fits a 1280px remote screen into a half-width DeX window nicely
  const [scale, setScale] = useState(0.75);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showPad, setShowPad] = useState(false);
  
  // Drag Mode States
  const [isDragMode, setIsDragMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setInputUrl(frame.url);
    setKey(prev => prev + 1);
    // Reset to "Fit" view on URL change
    setScale(0.75);
    setPosition({ x: 0, y: 0 });
    setShowPad(false);
    setIsDragMode(false);
  }, [frame.url]);

  // Sync ref with state for drag calculations
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        if (/^(192|172|10|localhost|127)/.test(finalUrl)) {
            finalUrl = `https://${finalUrl}`;
        } else {
            finalUrl = `https://${finalUrl}`;
        }
    }
    setInputUrl(finalUrl);
    onUpdateUrl(frame.id, finalUrl);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => {
      const newScale = Math.max(0.1, Math.min(prev + delta, 5.0));
      return parseFloat(newScale.toFixed(3));
    });
  };

  const handlePan = (dx: number, dy: number) => {
    const step = 25 / scale;
    setPosition(prev => ({ x: prev.x + dx * step, y: prev.y + dy * step }));
  };

  const handleReset = () => {
    setScale(0.75); 
    setPosition({ x: 0, y: 0 });
    setIsDragMode(false);
  };

  // Mouse Drag Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (!isDragMode) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isDragMode) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setPosition({
      x: positionRef.current.x + dx,
      y: positionRef.current.y + dy
    });
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom Handler (Active only in Drag Mode)
  const onWheel = (e: React.WheelEvent) => {
    if (isDragMode) {
      // Prevent default scrolling behavior
      e.preventDefault(); 
      e.stopPropagation();
      
      // Check deltaY for direction (Up = negative = Zoom In, Down = positive = Zoom Out)
      // Using a small step for smooth wheel zooming
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      handleZoom(delta);
    }
  };

  const toggleDragMode = () => {
    setIsDragMode(prev => !prev);
    setIsDragging(false); // safety reset
  };

  // Stop propagation helper to isolate Control Pad from VNC/Drag layers
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText("admin");
  };

  if (isMaximizedMode && !frame.isMaximized) return null;

  const containerClasses = frame.isMaximized ? "absolute inset-0 z-50 bg-black" : spanClass;

  return (
    <div className={`relative flex flex-col bg-gray-900 border border-gray-800 overflow-hidden ${containerClasses}`}>
      
      {/* Top toolbar (Auto-hide) */}
      <div className="absolute top-0 left-0 right-0 h-9 z-30 opacity-0 hover:opacity-100 transition-opacity bg-black/95 flex items-center px-1 gap-1 border-b border-gray-700 shadow-xl backdrop-blur-sm">
          <div className="w-5 h-5 bg-blue-700 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0">{frame.id}</div>
          
          <form onSubmit={handleSubmit} className="flex-grow min-w-[50px]">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent text-[10px] text-gray-300 border-none focus:ring-0 px-1 outline-none font-mono"
            />
          </form>

          {/* Compact Control Group */}
          <div className="flex items-center gap-0.5 bg-gray-800/50 rounded p-0.5">
            <button onClick={() => setShowPad(!showPad)} title="Toggle Control Pad" className={`p-1 rounded ${showPad ? 'text-blue-400 bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
              <Gamepad2 size={12} />
            </button>
            <div className="w-px h-3 bg-gray-700 mx-0.5"></div>
            <button onClick={() => handleZoom(-0.05)} title="Zoom Out" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"><Minus size={12} /></button>
            <span className="text-[9px] font-mono text-blue-400 w-8 text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={() => handleZoom(0.05)} title="Zoom In" className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"><Plus size={12} /></button>
            <button onClick={handleReset} title="Fit Screen (75%)" className="p-1 text-green-500/80 hover:text-green-400 hover:bg-gray-700 rounded"><Monitor size={12} /></button>
          </div>

          <div className="h-4 w-px bg-gray-700 mx-1"></div>

          <button onClick={copyCredentials} title="Copy ID (admin)" className="p-1 text-yellow-500/80 hover:text-yellow-400 hover:bg-gray-800 rounded"><KeyRound size={12} /></button>
          <button onClick={() => setKey(k => k + 1)} title="Reload VNC" className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"><RefreshCw size={12} /></button>
          
          {frame.isMaximized ? (
            <button onClick={onRestore} title="Restore Grid" className="p-1 text-blue-400 hover:bg-blue-900/30 rounded"><Minimize2 size={12} /></button>
          ) : (
            <button onClick={() => onMaximize(frame.id)} title="Maximize" className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded"><Maximize2 size={12} /></button>
          )}
          <button onClick={onClose} title="Close Frame" className="p-1 text-red-800 hover:text-red-500 hover:bg-gray-800 rounded"><X size={12} /></button>
      </div>

      {/* Control Pad */}
      {showPad && (
        <div 
            className="absolute bottom-4 right-4 z-40 animate-in fade-in zoom-in duration-200"
            // ISOLATION: Stop propagation to prevent clicks/drags on the pad from affecting the VNC layer underneath
            onMouseDown={stopPropagation}
            onMouseUp={stopPropagation}
            onClick={stopPropagation}
            onDoubleClick={stopPropagation}
            onWheel={stopPropagation}
        >
            <div className="bg-black/80 backdrop-blur p-1 rounded-xl border border-white/10 grid grid-cols-3 gap-1 w-28 h-28 shadow-2xl">
                {/* Row 1 */}
                <div className="flex items-center justify-center text-[9px] font-mono text-blue-400 bg-black/40 rounded border border-blue-900/30 select-none">
                  {Math.round(scale * 100)}%
                </div>
                <button onClick={() => handlePan(0, 1)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><ArrowUp size={16} /></button>
                <button onClick={handleReset} title="Reset View" className="bg-red-900/30 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors active:bg-red-700"><RotateCcw size={12} /></button>

                {/* Row 2 */}
                <button onClick={() => handlePan(1, 0)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><ArrowLeft size={16} /></button>
                
                {/* Drag Mode Toggle Button */}
                <button 
                  onClick={toggleDragMode} 
                  title={isDragMode ? "Disable Drag Mode" : "Enable Drag Mode"} 
                  className={`${isDragMode ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800/50 text-gray-400 hover:bg-blue-600 hover:text-white'} rounded flex items-center justify-center transition-colors`}
                >
                  <Move size={12} />
                </button>
                
                <button onClick={() => handlePan(-1, 0)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><ArrowRight size={16} /></button>

                {/* Row 3 */}
                <button onClick={() => handleZoom(0.05)} className="bg-blue-900/30 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><Plus size={16} /></button>
                <button onClick={() => handlePan(0, -1)} className="bg-gray-800/50 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><ArrowDown size={16} /></button>
                <button onClick={() => handleZoom(-0.05)} className="bg-blue-900/30 hover:bg-blue-600 text-white rounded flex items-center justify-center transition-colors active:bg-blue-700"><Minus size={16} /></button>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-grow relative bg-gray-950 overflow-hidden flex items-center justify-center cursor-crosshair">
        
        {/* DRAG OVERLAY: Intercepts mouse events when Drag Mode is ON to prioritize Panning over VNC */}
        {isDragMode && (
          <div 
            className="absolute inset-0 z-20 cursor-move touch-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel} // Attach Wheel Zoom logic here
          >
            {/* Visual Indicator for Drag Mode */}
            <div className="absolute top-2 right-2 bg-blue-600/80 text-white text-[9px] px-2 py-1 rounded shadow-lg pointer-events-none backdrop-blur">
              DRAG & ZOOM ON
            </div>
          </div>
        )}

        {frame.url && frame.url !== 'about:blank' ? (
          <div 
            className="origin-center transition-transform duration-75 ease-out will-change-transform"
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                width: '100%',
                height: '100%'
            }}
          >
            <iframe
                key={key}
                src={frame.url}
                className="w-full h-full border-0 block"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock"
                referrerPolicy="no-referrer"
                loading="eager"
            />
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-950">
             <div className="text-gray-800 text-[10px] font-mono tracking-widest flex flex-col items-center gap-2">
               <MousePointer2 size={24} className="opacity-20" />
               CH_{frame.id} READY
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
