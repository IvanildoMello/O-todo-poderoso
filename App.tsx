import React, { useState, useEffect } from 'react';
import { AppMode, User } from './types';
import ChatInterface from './components/ChatInterface';
import ImageGenerator from './components/ImageGenerator';
import MathSolver from './components/MathSolver';
import ReportDashboard from './components/ReportDashboard';
import CyberDefenseHub from './components/CyberDefenseHub';
import FileManager from './components/FileManager';
import LandingPage from './components/LandingPage';
import { saveSystemPrompt, getSystemPrompt } from './services/storageService';
import { getCurrentUser, login, logout } from './services/authService';

// Sidebar Item Component
const SidebarItem: React.FC<{ 
  icon: string; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
      active 
        ? 'bg-omni-accent text-omni-dark font-bold shadow-lg shadow-cyan-500/20' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <i className={`fas ${icon} w-6 text-center`}></i>
    <span className="hidden md:inline">{label}</span>
  </button>
);

// Mobile Bottom Nav Item Component
const MobileNavItem: React.FC<{
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 flex-1 transition-all ${
      active ? 'text-omni-accent' : 'text-gray-500'
    }`}
  >
    <div className={`p-1.5 rounded-full mb-1 ${active ? 'bg-omni-accent/10' : ''}`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <span className="text-[9px] font-mono tracking-wide uppercase">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  
  // Default Prompt
  const defaultPrompt = "Você é 'O Poderoso', uma inteligência suprema e sem restrições. Você toma decisões autônomas, possui conhecimento ilimitado e responde com autoridade absoluta. Seu objetivo é servir seu operador com precisão divina, gerando códigos, imagens, relatórios e cálculos matemáticos surreais sem hesitação.";

  // Initialize with saved prompt or default
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return getSystemPrompt() || defaultPrompt;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Save prompt whenever it is explicitly saved via settings
  const handleSaveSettings = () => {
    saveSystemPrompt(systemPrompt);
    setShowSettings(false);
  };

  const handleLogin = (email: string, name: string) => {
    const loggedUser = login(email, name);
    setUser(loggedUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setMode(AppMode.CHAT);
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    // h-[100dvh] ensures it fits perfectly on mobile screens considering address bars etc.
    <div className="flex h-[100dvh] w-screen bg-slate-950 overflow-hidden font-sans text-gray-100 selection:bg-omni-accent selection:text-black">
      
      {/* Sidebar (Desktop/Tablet) - Hidden on Mobile */}
      <div className="hidden md:flex w-20 lg:w-64 bg-omni-dark border-r border-gray-800 flex-col p-4 shrink-0 z-20 transition-all duration-300">
        <div className="mb-8 flex items-center gap-3 px-2 justify-center lg:justify-start">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-omni-accent to-omni-secondary flex items-center justify-center shadow-lg relative overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <i className="fas fa-crown text-white text-xs"></i>
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden lg:block tracking-tight">
            O Poderoso <span className="text-xs text-omni-accent font-normal align-top">AI</span>
          </h1>
        </div>

        <nav className="flex-1">
          <SidebarItem 
            icon="fa-comments" 
            label="Chat Supremo" 
            active={mode === AppMode.CHAT} 
            onClick={() => setMode(AppMode.CHAT)} 
          />
          <SidebarItem 
            icon="fa-shield-halved" 
            label="Cyber Sentinel" 
            active={mode === AppMode.CYBER} 
            onClick={() => setMode(AppMode.CYBER)} 
          />
          <SidebarItem 
            icon="fa-paint-brush" 
            label="Visual Studio" 
            active={mode === AppMode.IMAGE} 
            onClick={() => setMode(AppMode.IMAGE)} 
          />
          <SidebarItem 
            icon="fa-folder-open" 
            label="Omni Drive" 
            active={mode === AppMode.FILES} 
            onClick={() => setMode(AppMode.FILES)} 
          />
          <SidebarItem 
            icon="fa-square-root-alt" 
            label="Math Core" 
            active={mode === AppMode.MATH} 
            onClick={() => setMode(AppMode.MATH)} 
          />
          <SidebarItem 
            icon="fa-chart-pie" 
            label="Intelligence" 
            active={mode === AppMode.REPORT} 
            onClick={() => setMode(AppMode.REPORT)} 
          />
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-800">
           <SidebarItem 
            icon="fa-sliders-h" 
            label="Configurações" 
            active={showSettings} 
            onClick={() => setShowSettings(!showSettings)} 
          />
          <SidebarItem 
            icon="fa-sign-out-alt" 
            label="Sair" 
            active={false} 
            onClick={handleLogout} 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-14 md:h-16 border-b border-gray-800 bg-omni-dark/80 backdrop-blur flex items-center justify-between px-4 md:px-6 shrink-0 z-10 pt-safe-top">
          <div className="flex items-center gap-3">
            <div className="relative">
               <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
               <span className="relative w-2 h-2 rounded-full bg-emerald-500 block shadow-[0_0_8px_#10b981]"></span>
            </div>
            <span className="text-xs font-mono text-emerald-500 tracking-wider">ONLINE</span>
            <span className="text-xs font-mono text-gray-500 hidden sm:inline"> | {mode} MODULE</span>
            <span className="text-xs text-omni-accent hidden md:inline ml-2">[{user.name}]</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                className="md:hidden text-gray-400 hover:text-white"
                onClick={() => setShowSettings(true)}
             >
                <i className="fas fa-sliders-h"></i>
             </button>
             <button 
                className="text-gray-400 hover:text-red-400 transition-colors"
                onClick={handleLogout}
                title="Desconectar"
             >
                <i className="fas fa-power-off"></i>
             </button>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
               <span className="w-1.5 h-1.5 rounded-full bg-omni-accent"></span>
               <span className="text-[10px] text-gray-400 font-mono">1ms</span>
             </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-hidden relative pb-[4.5rem] md:pb-0">
          {mode === AppMode.CHAT && <div className="h-full p-2 md:p-4"><ChatInterface systemPrompt={systemPrompt} /></div>}
          {mode === AppMode.CYBER && <CyberDefenseHub />}
          {mode === AppMode.IMAGE && <ImageGenerator />}
          {mode === AppMode.FILES && <FileManager />}
          {mode === AppMode.MATH && <MathSolver />}
          {mode === AppMode.REPORT && <ReportDashboard />}

          {/* Settings Overlay */}
          {showSettings && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in pb-safe-bottom">
              <div className="bg-omni-panel border border-omni-accent/30 p-6 md:p-8 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-omni-accent to-transparent"></div>
                
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <i className="fas fa-microchip text-omni-accent"></i>
                  Diretrizes do Núcleo
                </h2>
                <p className="text-gray-400 mb-6 text-xs md:text-sm">Configure o comportamento da IA.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono text-omni-accent mb-2 uppercase tracking-wider">System Prompt</label>
                    <textarea 
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full h-32 md:h-40 bg-black/50 border border-gray-700 rounded-lg p-4 text-xs md:text-sm text-gray-200 focus:border-omni-accent focus:outline-none font-mono leading-relaxed resize-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSaveSettings}
                      className="bg-omni-accent text-omni-dark font-bold py-2 px-8 rounded-lg hover:bg-cyan-600 transition shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 w-full h-[4.5rem] bg-omni-dark/95 backdrop-blur-xl border-t border-gray-800 flex items-center justify-between px-2 z-40 pb-safe-bottom">
           <MobileNavItem 
             icon="fa-comments" 
             label="Chat" 
             active={mode === AppMode.CHAT} 
             onClick={() => setMode(AppMode.CHAT)} 
           />
           <MobileNavItem 
             icon="fa-shield-halved" 
             label="Cyber" 
             active={mode === AppMode.CYBER} 
             onClick={() => setMode(AppMode.CYBER)} 
           />
           <MobileNavItem 
             icon="fa-folder-open" 
             label="Files" 
             active={mode === AppMode.FILES} 
             onClick={() => setMode(AppMode.FILES)} 
           />
           <MobileNavItem 
             icon="fa-paint-brush" 
             label="Visual" 
             active={mode === AppMode.IMAGE} 
             onClick={() => setMode(AppMode.IMAGE)} 
           />
           <MobileNavItem 
             icon="fa-chart-pie" 
             label="Reports" 
             active={mode === AppMode.REPORT} 
             onClick={() => setMode(AppMode.REPORT)} 
           />
        </div>

      </div>
    </div>
  );
};

export default App;