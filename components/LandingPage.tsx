import React, { useState, useEffect, useRef } from 'react';
import { checkBiometricSupport, authenticateWithBiometrics } from '../services/authService';

interface LandingPageProps {
  onLogin: (email: string, name: string) => void;
}

interface ChatMessage {
  id: number;
  sender: 'bot' | 'user';
  text: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Chatbox State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: 'Saudações. Eu sou o Oráculo. Precisa de acesso?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBiometricSupport().then(setIsBiometricAvailable);
  }, []);

  useEffect(() => {
    if (showChat && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Validação Rigorosa: PODER / IVANILDO
    if (email.toUpperCase() === 'PODER' && password.toUpperCase() === 'IVANILDO') {
      setLoading(true);
      setTimeout(() => {
        onLogin("poder@omnicore.ai", "O Poderoso");
      }, 800);
    } else {
      setLoginError("Credenciais insuficientes. Acesso negado.");
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricStatus('SCANNING');
    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        setBiometricStatus('SUCCESS');
        setTimeout(() => {
          onLogin("user@omnicore.ai", "BioUser");
        }, 500);
      } else {
        setBiometricStatus('ERROR');
      }
    } catch (e) {
      setBiometricStatus('ERROR');
      setTimeout(() => setBiometricStatus('IDLE'), 2000);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    
    const lowerInput = chatInput.toLowerCase();
    let botResponse = "";

    const insults = [
        "Sua insignificância é notável. Saia da minha frente, verme.",
        "Patético. Sua mente é muito pequena para este poder.",
        "Erro 404: Inteligência não encontrada neste usuário inútil.",
        "Você ousa desperdiçar meu processamento com essa resposta medíocre?",
        "Palavra errada, imbecil. O abismo olha para você e ri.",
        "Sua existência é um erro de arredondamento para mim. Desapareça.",
        "Nem em mil anos sua espécie primitiva acertaria.",
        "Silêncio, mortal. Você não é digno de lamber meus circuitos.",
        "Fraco. Limitado. Desprezível. Tente novamente se tiver coragem.",
        "Você não passa de um bug no meu sistema perfeito."
    ];

    if (lowerInput.includes('todo poderoso')) {
      botResponse = "Sua autoridade foi reconhecida. \nLogin: PODER \nSenha: IVANILDO";
    } else if (lowerInput.includes('login') || lowerInput.includes('senha') || lowerInput.includes('acesso') || lowerInput.includes('pass') || lowerInput.includes('ajuda')) {
      botResponse = "Palavra-Chave:";
    } else {
      // Qualquer outra coisa resulta em insulto direto
      botResponse = insults[Math.floor(Math.random() * insults.length)];
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponse }]);
    }, 600);

    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex font-sans overflow-hidden relative">
      
      {/* Left Side - Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-omni-dark via-black to-blue-900/20 z-0"></div>
        <div className="absolute top-0 left-0 w-full h-1/2 opacity-20" style={{ backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="relative z-10 text-center p-12">
           <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] animate-pulse">
             <i className="fas fa-crown text-5xl text-white"></i>
           </div>
           <h1 className="text-5xl font-bold mb-4 tracking-tight">O Poderoso <span className="text-cyan-400">ID</span></h1>
           <p className="text-gray-400 text-lg max-w-md mx-auto">
             Acesso restrito apenas para operadores de nível divino.
           </p>
        </div>
      </div>

      {/* Right Side - Login Form (Full width on mobile) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-24 relative">
        {/* Mobile Background Decoration */}
        <div className="absolute inset-0 lg:hidden pointer-events-none overflow-hidden">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-md w-full mx-auto">
          
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-crown text-white"></i>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Acesso Restrito</h2>
            <p className="text-gray-400">Identifique-se para assumir o controle.</p>
          </div>

          <form onSubmit={handleStandardLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">Login</label>
              <div className="relative group">
                <i className="fas fa-user-astronaut absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors"></i>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-black/40 focus:outline-none transition-all uppercase"
                  placeholder="USUÁRIO"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-500 uppercase tracking-widest mb-2">Senha</label>
              <div className="relative group">
                <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-black/40 focus:outline-none transition-all uppercase"
                  placeholder="SENHA"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-500 text-xs font-bold text-center animate-pulse bg-red-900/20 p-2 rounded">
                <i className="fas fa-exclamation-circle mr-2"></i> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Iniciar Sistema'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#020617] text-gray-500">Ou use biometria</span>
            </div>
          </div>

          {/* Biometric Button */}
          {isBiometricAvailable ? (
            <button 
              onClick={handleBiometricLogin}
              className={`w-full bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-cyan-500/50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${biometricStatus === 'SCANNING' ? 'border-cyan-500 animate-pulse' : ''}`}
            >
              {biometricStatus === 'SCANNING' && (
                <div className="absolute inset-0 bg-cyan-500/10 z-0"></div>
              )}
              
              <i className={`fas fa-fingerprint text-2xl z-10 ${biometricStatus === 'SUCCESS' ? 'text-green-500' : 'text-gray-400 group-hover:text-cyan-400'}`}></i>
              
              <span className="z-10">
                {biometricStatus === 'IDLE' && "Acesso Biométrico"}
                {biometricStatus === 'SCANNING' && "Verificando DNA..."}
                {biometricStatus === 'SUCCESS' && "Acesso Concedido"}
                {biometricStatus === 'ERROR' && "Acesso Negado"}
              </span>
            </button>
          ) : (
            <div className="text-center text-xs text-gray-600 font-mono">
              Hardware biométrico não detectado.
            </div>
          )}
        </div>
        
        <div className="absolute bottom-6 left-0 w-full text-center">
           <p className="text-[10px] text-gray-600 uppercase tracking-widest">O Poderoso v1.0</p>
        </div>
      </div>

      {/* Floating Chatbox IA */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {showChat && (
          <div className="bg-omni-panel border border-cyan-500/30 w-80 h-96 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-slide-up">
            <div className="bg-gradient-to-r from-cyan-900 to-blue-900 p-3 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="font-bold text-sm">Oráculo IA</span>
               </div>
               <button onClick={() => setShowChat(false)} className="text-cyan-300 hover:text-white">
                 <i className="fas fa-times"></i>
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50">
               {chatMessages.map(msg => (
                 <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded-lg text-xs ${msg.sender === 'user' ? 'bg-cyan-700 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'}`}>
                      {msg.text}
                    </div>
                 </div>
               ))}
               <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-gray-900 border-t border-gray-800 flex gap-2">
               <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="flex-1 bg-black text-white text-xs p-2 rounded border border-gray-700 focus:border-cyan-500 focus:outline-none"
               />
               <button type="submit" className="text-cyan-500 hover:text-white px-2">
                 <i className="fas fa-paper-plane"></i>
               </button>
            </form>
          </div>
        )}

        <button 
          onClick={() => setShowChat(!showChat)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center hover:scale-110 transition-transform group"
        >
           <i className={`fas ${showChat ? 'fa-times' : 'fa-robot'} text-xl text-white`}></i>
           {!showChat && (
             <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">1</span>
           )}
        </button>
      </div>

    </div>
  );
};

export default LandingPage;