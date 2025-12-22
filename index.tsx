
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { RefreshCw, Maximize2, Minimize2, X, Plus, Minus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Gamepad2, Move, ChevronDown, ExternalLink, ShieldAlert, Lock, Unlock, HelpCircle, Layers, Globe, Zap, Settings, Check, AlertTriangle, Clock, Activity, Stethoscope, Wifi, WifiOff, Smartphone, Monitor } from 'lucide-react';

// --- Types ---
type RenderMode = 'direct' | 'magic' | 'popup';

interface AppSettings {
  defaultRenderMode: RenderMode;
}

interface FrameConfig {
  id: number;
  protocol: 'https://'; // Strictly HTTPS
  url: string; 
  renderMode: RenderMode;
  isMaximized?: boolean;
}

// --- Diagnostic Helper ---
const checkConnection = async (url: string): Promise<{ status: 'ok' | 'error' | 'blocked', msg: string, code?: number }> => {
  if (!url || url === 'about:blank') return { status: 'ok', msg: 'No URL' };
  
  const target = url.startsWith('http') ? url : `https://${url}`;
  
  try {
    // Attempt a no-cors request to check reachability (opaque response means server is up)
    await fetch(target, { mode: 'no-cors', cache: 'no-store' });
    return { status: 'ok', msg: 'Server Reachable' };
  } catch (e) {
    return { status: 'error', msg: 'Unreachable / SSL Error' };
  }
};

// --- Kiwi Guide Modal ---
const KiwiGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="absolute inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-gray-900 border border-gray-600 rounded-xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
      
      <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 mb-4">
        <Smartphone size={24} /> Kiwi Browser 최적화 가이드
      </h2>
      
      <div className="space-y-4 text-sm text-gray-300">
        <p>
          이 앱은 <b>Samsung DeX</b>와 <b>Kiwi Browser</b> 환경에 최적화되어 있습니다.
          화면이 하얗게 나오거나 거부된다면 다음 순서대로 설정하세요.
        </p>

        <ol className="list-decimal pl-5 space-y-2 marker:text-green-500">
          <li>
            <span className="text-white font-bold">확장 프로그램 설치</span>: <br/>
            Kiwi Browser 메뉴 &gt; 확장 프로그램 &gt; 스토어에서 <span className="text-yellow-400">"Ignore X-Frame-Options"</span> 검색 및 설치.
          </li>
          <li>
            <span className="text-white font-bold">SSL 인증서 수락</span>: <br/>
            각 프레임의 주소(https://172.16.8.xx)를 새 탭에서 한 번씩 열어 <span className="text-red-300">"고급 &gt; 안전하지 않음으로 이동"</span>을 클릭하여 인증서를 신뢰시킵니다.
          </li>
          <li>
            <span className="text-white font-bold">Direct 모드 사용</span>: <br/>
            위 설정이 완료되면 <b>Direct 모드</b>(지구본 아이콘)에서도 끊김 없이 4분할 화면을 볼 수 있습니다.
          </li>
        </ol>

        <div className="bg-gray-800 p-3 rounded border border-gray-700 mt-4 text-xs">
          <p className="text-gray-400">
            * 팝업 모드를 사용하지 않아도 되므로 DeX에서의 멀티태스킹 효율이 극대화됩니다.
          </p>
        </div>
      </div>

      <button onClick={onClose} className="w-full mt-6 bg-green-700 hover:bg-green-600 text-white py-3 rounded-lg font-bold text-lg">
        확인했습니다
      </button>
    </div>
  </div>
);

// --- Troubleshoot Modal Component ---
interface TroubleshootModalProps {
  frame: FrameConfig;
  onClose: () => void;
  onUpdateFrame: (id: number, updates: Partial<FrameConfig>) => void;
}

const TroubleshootModal: React.FC<TroubleshootModalProps> = ({ frame, onClose, onUpdateFrame }) => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [diagMsg, setDiagMsg] = useState('');

  useEffect(() => {
    const runDiag = async () => {
      setStatus('checking');
      const res = await checkConnection(frame.url);
      setStatus(res.status === 'ok' ? 'ok' : 'error');
      setDiagMsg(res.msg);
    };
    runDiag();
  }, [frame.url]);

  const rawUrl = frame.url.startsWith('http') ? frame.url : `https://${frame.url}`;

  return (
    <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-sm w-full p-5 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white"><X size={20}/></button>
        
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <Stethoscope size={20} className="text-blue-400"/> 연결 진단 (CH {frame.id})
        </h2>

        <div className="bg-gray-800 rounded p-3 mb-4 font-mono text-xs">
          <div className="text-gray-400 mb-1">Target URL (HTTPS):</div>
          <div className="text-blue-300 break-all">{rawUrl}</div>
        </div>

        {/* Diagnosis Result */}
        <div className={`p-3 rounded border mb-4 flex items-center gap-3 ${status === 'ok' ? 'bg-green-900/20 border-green-700/50' : status === 'checking' ? 'bg-blue-900/20 border-blue-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
          {status === 'checking' && <RefreshCw size={20} className="animate-spin text-blue-400"/>}
          {status === 'ok' && <Wifi size={20} className="text-green-400"/>}
          {status === 'error' && <WifiOff size={20} className="text-red-400"/>}
          
          <div>
            <div className={`font-bold text-sm ${status === 'ok' ? 'text-green-400' : status === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
              {status === 'checking' ? '진단 중...' : status === 'ok' ? '서버 연결 성공' : '서버 연결 실패'}
            </div>
            <div className="text-[10px] text-gray-400">{diagMsg}</div>
          </div>
        </div>

        {/* Recommendations based on status */}
        <div className="space-y-3">
          {status === 'error' && (
            <div className="text-xs text-gray-300">
              <p className="mb-1 text-red-300">⚠️ <b>ERR_ADDRESS_UNREACHABLE</b> 또는 SSL 오류</p>
              <button 
                onClick={() => window.open(rawUrl, '_blank')}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2 font-bold mt-2"
              >
                <ExternalLink size={14} /> 새 탭에서 SSL 인증서 수락
              </button>
            </div>
          )}

          {status === 'ok' && (
             <div className="text-xs text-gray-300">
               <div className="bg-orange-900/20 border border-orange-700/30 p-2 rounded mb-3">
                 <p className="font-bold text-orange-400 mb-1">화면이 하얗게 보이나요?</p>
                 <p className="text-[10px] text-gray-400">Kiwi Browser에서 'Ignore X-Frame-Options' 확장 프로그램을 설치했는지 확인하세요.</p>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => { onUpdateFrame(frame.id, { renderMode: 'direct' }); onClose(); }}
                   className="bg-green-800 hover:bg-green-700 text-white py-2 rounded flex flex-col items-center justify-center gap-1 text-[10px]"
                 >
                   <Monitor size={14} className="text-green-200"/>
                   <span>Direct 모드 (Kiwi 권장)</span>
                 </button>
                 
                 <button 
                   onClick={() => { onUpdateFrame(frame.id, { renderMode: 'popup' }); onClose(); }}
                   className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex flex-col items-center justify-center gap-1 text-[10px]"
                 >
                   <ExternalLink size={14} className="text-orange-400"/>
                   <span>팝업 모드 (대체용)</span>
                 </button>
               </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

// --- Settings Modal Component ---
interface SettingsModalProps {
  settings: AppSettings;
  frames: FrameConfig[];
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onOpenKiwiGuide: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, frames, onUpdateSettings, onClose, onOpenKiwiGuide }) => {
  const [netStatus, setNetStatus] = useState<Record<number, string>>({});
  const [checking, setChecking] = useState(false);

  const runSystemCheck = async () => {
    setChecking(true);
    const results: Record<number, string> = {};
    
    // Parallel check
    await Promise.all(frames.map(async (f) => {
      if (!f.url) {
        results[f.id] = "Empty";
        return;
      }
      const res = await checkConnection(f.url);
      results[f.id] = res.status === 'ok' ? 'Online' : 'Offline/Error';
    }));

    setNetStatus(results);
    setChecking(false);
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-sm w-full p-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={20} /> System Settings
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>

        <div className="space-y-6">
          {/* Kiwi Guide Button */}
          <button 
            onClick={onOpenKiwiGuide}
            className="w-full bg-green-900/30 hover:bg-green-900/50 border border-green-600/50 p-3 rounded flex items-center gap-3 transition-colors text-left"
          >
             <div className="bg-green-600 p-2 rounded-full text-white">
               <Smartphone size={16} />
             </div>
             <div>
               <div className="text-green-400 font-bold text-xs uppercase">Optimization</div>
               <div className="text-white text-sm font-bold">Kiwi Browser 설정 가이드</div>
               <div className="text-gray-400 text-[10px]">DeX 모드에서 화면이 안 나올 때 클릭</div>
             </div>
          </button>

          {/* Network Dashboard */}
          <div>
             <div className="flex justify-between items-center mb-2">
               <label className="text-gray-200 font-bold text-sm flex items-center gap-2">
                 <Activity size={14} /> Network Status
               </label>
               <button 
                 onClick={runSystemCheck}
                 disabled={checking}
                 className="bg-gray-700 hover:bg-gray-600 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1"
               >
                 {checking ? <RefreshCw size={10} className="animate-spin"/> : <Check size={10}/>}
                 Scan All
               </button>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
               {frames.map(f => (
                 <div key={f.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <span className="bg-blue-900 text-blue-200 text-[10px] font-bold px-1.5 rounded">{f.id}</span>
                     <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{f.url || 'Empty'}</span>
                   </div>
                   <div className="text-[10px] font-bold">
                      {netStatus[f.id] === 'Online' && <span className="text-green-400">OK</span>}
                      {netStatus[f.id] === 'Offline/Error' && <span className="text-red-400">ERR</span>}
                      {!netStatus[f.id] && <span className="text-gray-600">-</span>}
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Default Render Mode */}
          <div>
            <label className="text-gray-200 font-bold text-sm block mb-2">기본 렌더링 모드</label>
            <div className="grid grid-cols-3 gap-2">
              {(['direct', 'magic', 'popup'] as RenderMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => onUpdateSettings({ ...settings, defaultRenderMode: mode })}
                  className={`py-2 px-1 rounded border text-xs font-bold uppercase flex flex-col items-center gap-1 ${
                    settings.defaultRenderMode === mode 
                      ? 'bg-blue-900/40 border-blue-500 text-blue-400' 
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {mode === 'direct' && <Globe size={14} />}
                  {mode === 'magic' && <Zap size={14} />}
                  {mode === 'popup' && <ExternalLink size={14} />}
                  {mode}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">* Kiwi Browser는 <b>DIRECT</b> 모드를 권장합니다.</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BrowserFrame Component ---
interface BrowserFrameProps {
  frame: FrameConfig;
  spanClass: string;
  settings: AppSettings;
  onUpdateFrame: (id: number, updates: Partial<FrameConfig>) => void;
  onMaximize: (id: number) => void;
  onRestore: () => void;
  onClose: () => void;
  isMaximizedMode: boolean;
}

const BrowserFrame: React.FC<BrowserFrameProps> = ({
  frame,
  spanClass,
  settings,
  onUpdateFrame,
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
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setInputUrl(frame.url);
    setKey(prev => prev + 1);
    setScale(1.0);
    setPosition({ x: 0, y: 0 });
    setIsDragMode(false);
    setShowModeMenu(false);
    setShowTroubleshoot(false);
  }, [frame.url, frame.protocol, frame.renderMode]);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.startsWith('http://')) val = val.replace('http://', '');
    else if (val.startsWith('https://')) val = val.replace('https://', '');
    setInputUrl(val);
  };

  const handleApplyUrl = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateFrame(frame.id, { url: inputUrl.trim(), protocol: 'https://' });
    setKey(k => k + 1);
  }, [inputUrl, frame.id, onUpdateFrame]);

  const getDisplayUrl = () => {
    if (!frame.url || frame.url === 'about:blank') return 'about:blank';
    const rawUrl = `https://${frame.url}`;
    if (frame.renderMode === 'magic') {
      return `https://translate.google.com/translate?sl=auto&tl=ko&u=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  };

  const displayUrl = getDisplayUrl();
  
  const openExternal = () => {
    if (!frame.url) return;
    window.open(`https://${frame.url}`, '_blank', 'noopener,noreferrer');
  };
  
  const handleZoom = (delta: number) => setScale(prev => parseFloat(Math.max(0.1, Math.min(prev + delta, 5.0)).toFixed(3)));
  const handlePan = (dx: number, dy: number) => {
    const step = 30 / scale;
    setPosition(prev => ({ x: prev.x + dx * step, y: prev.y + dy * step }));
  };
  const handleReset = () => { setScale(1.0); setPosition({ x: 0, y: 0 }); setIsDragMode(false); };

  const onMouseDown = (e: React.MouseEvent) => { if (isDragMode) { setIsDragging(true); dragStartRef.current = { x: e.clientX, y: e.clientY }; } };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isDragMode) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({ x: positionRef.current.x + dx, y: positionRef.current.y + dy });
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => setIsDragging(false);

  if (isMaximizedMode && !frame.isMaximized) return null;

  return (
    <div className={`frame-container relative flex flex-col bg-gray-900 border border-gray-800 overflow-hidden ${frame.isMaximized ? "maximized" : spanClass}`}
         onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      
      {/* 
        [Auto-Hide Toolbar Implementation] 
        1. Invisible Trigger Area (h-4) at the top.
        2. Toolbar is -translate-y-full (hidden above) by default.
        3. peer-hover (on trigger) OR hover (on toolbar) -> translate-y-0.
      */}
      
      {/* Trigger Zone (Invisible, top 16px) */}
      <div className="absolute top-0 left-0 right-0 h-4 z-40 bg-transparent peer transition-none" />

      {/* Toolbar */}
      <div className="toolbar absolute top-0 left-0 right-0 h-10 z-50 bg-gray-950/90 border-b border-gray-700 flex items-center px-2 gap-2 backdrop-blur-md transition-all duration-300 transform -translate-y-full opacity-0 peer-hover:translate-y-0 peer-hover:opacity-100 hover:translate-y-0 hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-lg cursor-default">
            {frame.id}
          </div>
          
          <div className="relative">
             <button 
                onClick={() => setShowModeMenu(!showModeMenu)}
                className={`h-7 px-2 rounded flex items-center gap-1 text-[10px] font-bold border ${
                  frame.renderMode === 'magic' ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 
                  frame.renderMode === 'popup' ? 'border-orange-500 text-orange-400 bg-orange-900/20' : 
                  'border-gray-600 text-gray-400 bg-gray-800'
                }`}
                title="렌더링 모드 변경"
             >
                {frame.renderMode === 'direct' && <Globe size={12}/>}
                {frame.renderMode === 'magic' && <Zap size={12}/>}
                {frame.renderMode === 'popup' && <ExternalLink size={12}/>}
                <span className="hidden sm:inline uppercase">{frame.renderMode}</span>
             </button>
             
             {showModeMenu && (
               <div className="absolute top-8 left-0 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-32 flex flex-col overflow-hidden text-xs">
                 <button onClick={() => { onUpdateFrame(frame.id, { renderMode: 'direct' }); setShowModeMenu(false); }} className="px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-gray-300">
                    <Globe size={14} /> Direct
                 </button>
                 <button onClick={() => { onUpdateFrame(frame.id, { renderMode: 'magic' }); setShowModeMenu(false); }} className="px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-purple-400">
                    <Zap size={14} /> Magic (Google)
                 </button>
                 <button onClick={() => { onUpdateFrame(frame.id, { renderMode: 'popup' }); setShowModeMenu(false); }} className="px-3 py-2 text-left hover:bg-gray-800 flex items-center gap-2 text-orange-400">
                    <ExternalLink size={14} /> Popup Only
                 </button>
               </div>
             )}
          </div>

          <div className="flex-grow flex items-center bg-black/40 rounded border border-gray-700 focus-within:border-blue-500 transition-colors h-7">
            <div 
              className="h-full px-2 text-[10px] font-bold border-r border-gray-700 flex items-center gap-1 text-green-400 cursor-default"
              title="HTTPS Secured"
            >
              <Lock size={10} />
            </div>
            
            <form onSubmit={handleApplyUrl} className="flex-grow h-full flex">
              <input
                type="text"
                value={inputUrl === 'about:blank' ? '' : inputUrl}
                onChange={handleUrlChange}
                className="w-full bg-transparent text-[11px] text-gray-200 px-2 outline-none font-mono h-full"
                placeholder="domain.com"
              />
              <button type="submit" className="hidden">Go</button>
            </form>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowTroubleshoot(true)} 
              title="연결 문제 해결" 
              className="p-1.5 text-yellow-500 hover:text-white hover:bg-gray-800 rounded animate-pulse"
            >
              <Stethoscope size={14} />
            </button>
            <button onClick={() => setKey(k => k + 1)} title="새로고침" className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowPad(!showPad)} title="조작 패드" className={`p-1.5 rounded transition-colors ${showPad ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
              <Gamepad2 size={14} />
            </button>
            
            <div className="w-px h-4 bg-gray-700 mx-1"></div>
            
            {frame.isMaximized ? (
              <button onClick={onRestore} className="p-1.5 text-blue-400"><Minimize2 size={14} /></button>
            ) : (
              <button onClick={() => onMaximize(frame.id)} className="p-1.5 text-gray-400"><Maximize2 size={14} /></button>
            )}
            <button onClick={onClose} className="p-1.5 text-red-500 hover:bg-red-900/30 rounded"><X size={14} /></button>
          </div>
      </div>

      {/* Troubleshoot Modal */}
      {showTroubleshoot && (
        <TroubleshootModal 
          frame={frame} 
          onClose={() => setShowTroubleshoot(false)} 
          onUpdateFrame={onUpdateFrame}
        />
      )}

      {/* Control Pad UI */}
      {showPad && (
        <div className="absolute bottom-4 right-4 z-40 bg-gray-900/95 backdrop-blur-lg p-2 rounded-2xl border border-gray-700 shadow-2xl w-32" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="col-span-3 flex justify-between items-center mb-1 text-[9px] font-bold text-blue-400 px-1">
                <span>ZOOM {Math.round(scale * 100)}%</span>
                <button onClick={() => setShowPad(false)}><ChevronDown size={12}/></button>
              </div>
              <button onClick={() => handleZoom(0.05)} className="bg-gray-800 hover:bg-blue-600 rounded-lg h-9 flex items-center justify-center"><Plus size={16} /></button>
              <button onClick={() => handlePan(0, 1)} className="bg-gray-800 hover:bg-blue-600 rounded-lg h-9 flex items-center justify-center"><ArrowUp size={16} /></button>
              <button onClick={() => handleZoom(-0.05)} className="bg-gray-800 hover:bg-blue-600 rounded-lg h-9 flex items-center justify-center"><Minus size={16} /></button>
              <button onClick={() => handlePan(1, 0)} className="bg-gray-800 hover:bg-blue-600 rounded-lg h-9 flex items-center justify-center"><ArrowLeft size={16} /></button>
              <button onClick={() => setIsDragMode(!isDragMode)} className={`rounded-lg h-9 flex items-center justify-center ${isDragMode ? 'bg-blue-600' : 'bg-gray-800'}`}><Move size={14} /></button>
              <button onClick={() => handlePan(-1, 0)} className="bg-gray-800 hover:bg-blue-600 rounded-lg h-9 flex items-center justify-center"><ArrowRight size={16} /></button>
              <button onClick={handleReset} className="col-span-3 bg-red-900/40 hover:bg-red-600 text-red-200 rounded-lg h-8 text-[10px] font-bold mt-1">RESET VIEW</button>
            </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-grow relative bg-gray-950 overflow-hidden flex items-center justify-center" 
           onMouseDown={onMouseDown}>
        
        {isDragMode && (
          <div className="absolute inset-0 z-20 cursor-move bg-blue-500/5 border-2 border-dashed border-blue-500/20"></div>
        )}

        {frame.url && frame.url !== 'about:blank' ? (
          <>
            {/* 1. Popup Mode Content */}
            {frame.renderMode === 'popup' && (
              <div className="flex flex-col items-center justify-center text-center p-4">
                 <ExternalLink size={48} className="text-gray-700 mb-4" />
                 <h3 className="text-gray-400 text-sm mb-2">Popup Mode Active</h3>
                 <p className="text-gray-500 text-xs mb-4 max-w-[200px]">
                   브라우저 보안 정책을 우회하기 위해<br/>이 페이지는 별도 창에서 실행됩니다.
                 </p>
                 <button onClick={openExternal} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                   OPEN WINDOW <ExternalLink size={14} />
                 </button>
              </div>
            )}

            {/* 2. Iframe (Strictly HTTPS) */}
            {frame.renderMode !== 'popup' && (
               <div className="w-full h-full" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: 'center center' }}>
                  <iframe
                      key={key}
                      src={displayUrl}
                      className="w-full h-full border-0 block"
                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-downloads"
                      referrerPolicy="no-referrer"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
               </div>
            )}
          </>
        ) : (
          <div className="text-gray-800 text-[10px] font-mono flex flex-col items-center gap-2">
            <Globe size={24} className="opacity-10" /> 
            <span>CH_{frame.id} READY</span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- App Component ---
function App() {
  const [frames, setFrames] = useState<FrameConfig[]>([]);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKiwiGuide, setShowKiwiGuide] = useState(false);
  
  // Global Settings State: Default to 'direct' for Kiwi optimization
  const [settings, setSettings] = useState<AppSettings>({
    defaultRenderMode: 'direct' 
  });

  // Initialize frames with default HTTPS IPs
  useEffect(() => {
    setFrames([
      { id: 1, protocol: 'https://', url: '172.16.8.91/remote-access', renderMode: settings.defaultRenderMode },
      { id: 2, protocol: 'https://', url: '172.16.8.92/remote-access', renderMode: settings.defaultRenderMode },
      { id: 3, protocol: 'https://', url: '172.16.8.93/remote-access', renderMode: settings.defaultRenderMode },
      { id: 4, protocol: 'https://', url: '172.16.8.94/remote-access', renderMode: settings.defaultRenderMode },
    ]);
  }, []);

  useEffect(() => {
    const loader = document.getElementById('loading-text');
    if (loader) loader.style.display = 'none';

    const checkOrientation = () => setIsPortrait(window.innerHeight > window.innerWidth);
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const handleUpdateFrame = (id: number, updates: Partial<FrameConfig>) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };
  const handleMaximize = (id: number) => setFrames(prev => prev.map(f => ({ ...f, isMaximized: f.id === id })));
  const handleRestore = () => setFrames(prev => prev.map(f => ({ ...f, isMaximized: false })));
  const handleClose = (id: number) => setFrames(prev => prev.map(f => f.id === id ? { ...f, url: '', protocol: 'https://', renderMode: settings.defaultRenderMode } : f));

  const isAnyMaximized = frames.some(f => f.isMaximized);

  const getGridStyle = () => {
    if (isAnyMaximized) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' };
    if (isPortrait) return { gridTemplateColumns: '1fr', gridTemplateRows: 'repeat(4, 1fr)' };
    return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' };
  };

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-black text-gray-100 overflow-hidden">
      <main className="h-full w-full relative bg-black overflow-hidden">
        <div className="h-full w-full grid gap-px bg-gray-800" style={getGridStyle()}>
          {frames.map((frame) => (
            <BrowserFrame
              key={frame.id}
              frame={frame}
              spanClass="col-span-1 row-span-1"
              settings={settings}
              onUpdateFrame={handleUpdateFrame}
              onMaximize={handleMaximize}
              onRestore={handleRestore}
              onClose={() => handleClose(frame.id)}
              isMaximizedMode={isAnyMaximized}
            />
          ))}
        </div>

        {/* Floating Settings Button */}
        <button 
          onClick={() => setShowSettings(true)}
          className="absolute bottom-6 left-6 z-50 bg-gray-800/80 hover:bg-blue-600 text-white p-3 rounded-full shadow-2xl border border-gray-600 backdrop-blur-md transition-all group"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform" />
        </button>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal 
            settings={settings}
            frames={frames} 
            onUpdateSettings={setSettings} 
            onClose={() => setShowSettings(false)}
            onOpenKiwiGuide={() => setShowKiwiGuide(true)}
          />
        )}

        {/* Kiwi Guide Modal */}
        {showKiwiGuide && (
          <KiwiGuideModal onClose={() => setShowKiwiGuide(false)} />
        )}

      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
