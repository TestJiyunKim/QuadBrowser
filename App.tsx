
import React, { useState } from 'react';
import { BrowserFrame } from './BrowserFrame';
import { FrameConfig, GeminiUrlResponse } from './types';
import { generateWorkspaceConfig } from './geminiService';
import { Loader2, Plus, Monitor } from 'lucide-react';

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
    if (frames.length === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (frames.length === 2) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr' };
    return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-gray-100 font-sans overflow-hidden">
      <header className="flex-none h-8 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-2 z-50">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-blue-500" />
          <h1 className="text-[11px] font-black text-gray-400 tracking-tighter uppercase">QUAD_VNC_DEX</h1>
        </div>

        <form onSubmit={handleAiSetup} className="flex items-center gap-1 w-full max-w-[220px]">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="AI Setup (Online)..."
            className="w-full bg-gray-900 text-[10px] text-white border border-gray-800 rounded px-2 h-6 outline-none focus:border-blue-600"
          />
          <button type="submit" disabled={isAiLoading} className="bg-blue-600/20 text-blue-400 text-[9px] px-2 h-6 rounded hover:bg-blue-600 hover:text-white transition-all">
            {isAiLoading ? <Loader2 size={10} className="animate-spin" /> : "RUN"}
          </button>
        </form>

        <div className="flex items-center gap-2">
           {frames.length < 4 && !isAnyMaximized && (
             <button onClick={handleAddFrame} className="flex items-center gap-1 text-[9px] bg-green-900/30 text-green-400 px-2 h-6 rounded hover:bg-green-600 hover:text-white">
               <Plus size={10} /> ADD
             </button>
           )}
           <div className="text-[10px] text-gray-600 font-mono font-bold">{frames.length}/4 CH</div>
        </div>
      </header>

      <main className="flex-grow p-0.5 relative bg-black">
        <div 
          className="h-full w-full grid gap-0.5" 
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
