
import React, { useState, useEffect } from 'react';
import { BrowserFrame } from './BrowserFrame';
import { FrameConfig, GeminiUrlResponse } from './types';
import { generateWorkspaceConfig } from './geminiService';
import { Loader2, Plus, Monitor, LayoutGrid, Smartphone } from 'lucide-react';

const INITIAL_FRAMES: FrameConfig[] = [
  { id: 1, url: 'https://172.16.8.91/remote-access', isMaximized: false },
  { id: 2, url: 'https://172.16.8.92/remote-access', isMaximized: false },
  { id: 3, url: 'https://172.16.8.93/remote-access', isMaximized: false },
  { id: 4, url: 'https://172.16.8.94/remote-access', isMaximized: false },
];

export default function App() {
  const [frames, setFrames] = useState<FrameConfig[]>(INITIAL_FRAMES);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  // Detect orientation for mobile optimization
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleUpdateUrl = (id: number, url: string) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, url } : f));
  };

  const handleMaximize = (id: number) => {
    setFrames(prev => prev.map(f => ({ ...f, isMaximized: f.id === id })));
  };

  const handleRestore = () => {
    setFrames(prev => prev.map(f => ({ ...f, isMaximized: false })));
  };

  const handleClose = (id: number) => {
    if (frames.length <= 1) return;
    setFrames(prev => prev.filter(f => f.id !== id));
  };

  const handleAddFrame = () => {
    if (frames.length >= 4) return;
    const newId = Math.max(...frames.map(f => f.id), 0) + 1;
    setFrames(prev => [...prev, { id: newId, url: 'about:blank', isMaximized: false }]);
  };

  const handleAiSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const result: GeminiUrlResponse = await generateWorkspaceConfig(aiPrompt);
      if (result && result.urls.length > 0) {
        const newFrames = result.urls.slice(0, 4).map((url, idx) => ({
          id: idx + 1, url, isMaximized: false
        }));
        setFrames(newFrames);
      }
    } catch (error) {
      alert("AI Setup requires internet. Please check connection.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAnyMaximized = frames.some(f => f.isMaximized);

  const getGridStyle = () => {
    if (isAnyMaximized) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    
    // Mobile Portrait Optimization: Stack frames vertically if screen is narrow
    if (isPortrait && window.innerWidth < 768) {
       // On mobile portrait, we just stack them equal height
       return { 
         gridTemplateColumns: '1fr', 
         gridTemplateRows: `repeat(${frames.length}, 1fr)` 
       };
    }

    // Desktop / DeX / Landscape Logic (Original 2x2)
    if (frames.length === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (frames.length === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
    // 3 or 4 frames -> 2x2 grid
    return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  };

  return (
    // Added pt-[env(safe-area-inset-top)] for notch support
    // Added pb-[env(safe-area-inset-bottom)] for home bar support
    <div className="flex flex-col h-screen w-screen bg-black text-gray-100 font-sans overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      
      {/* Header with improved styling for mobile visibility */}
      <header className="flex-none h-10 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-3 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          {isPortrait && window.innerWidth < 600 ? <Smartphone size={16} className="text-blue-500" /> : <Monitor size={16} className="text-blue-500" />}
          <h1 className="text-xs font-black text-gray-300 tracking-tighter uppercase hidden sm:block">QUAD_VNC_DEX</h1>
          <h1 className="text-xs font-black text-gray-300 tracking-tighter uppercase sm:hidden">QUAD</h1>
        </div>

        <form onSubmit={handleAiSetup} className="flex items-center gap-1 w-full max-w-[200px] sm:max-w-[300px] mx-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={isPortrait ? "AI Setup..." : "AI Workspace Setup..."}
            className="w-full bg-gray-900 text-[11px] text-white border border-gray-700 rounded px-2 h-7 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-900 placeholder-gray-600"
          />
          <button type="submit" disabled={isAiLoading} className="bg-blue-900/40 text-blue-400 text-[10px] px-3 h-7 rounded hover:bg-blue-600 hover:text-white transition-all font-bold border border-blue-800/50">
            {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : "GO"}
          </button>
        </form>

        <div className="flex items-center gap-2">
           {frames.length < 4 && !isAnyMaximized && (
             <button onClick={handleAddFrame} className="flex items-center gap-1 text-[10px] bg-gray-800 text-green-400 px-2 h-7 rounded border border-gray-700 hover:bg-green-900/50 hover:border-green-800">
               <Plus size={12} /> <span className="hidden sm:inline">ADD</span>
             </button>
           )}
           <div className="text-[10px] text-gray-500 font-mono font-bold">{frames.length}/4</div>
        </div>
      </header>

      <main className="flex-grow relative bg-black overflow-hidden">
        <div 
          className="h-full w-full grid gap-px bg-gray-900" 
          style={getGridStyle()}
        >
          {frames.map((frame) => (
            <BrowserFrame
              key={frame.id}
              frame={frame}
              spanClass="col-span-1 row-span-1"
              onUpdateUrl={handleUpdateUrl}
              onMaximize={handleMaximize}
              onRestore={handleRestore}
              onClose={() => handleClose(frame.id)}
              isMaximizedMode={isAnyMaximized}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
