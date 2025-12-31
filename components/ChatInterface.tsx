import React, { useState, useRef, useEffect } from 'react';
import { generateTextResponse } from '../services/geminiService';
import { saveChatHistory, getChatHistory, clearStorage } from '../services/storageService';
import { Message } from '../types';

interface ChatInterfaceProps {
  systemPrompt: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ systemPrompt }) => {
  const defaultMessage: Message = { 
    id: '0', 
    role: 'model', 
    content: 'O Poderoso v1.0 // Nível de Acesso: DIVINO. \nEstou pronto para executar sua vontade.', 
    type: 'text', 
    timestamp: Date.now() 
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = getChatHistory();
    return saved && saved.length > 0 ? saved : [defaultMessage];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save to storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  const handleClearMemory = () => {
    if (window.confirm("ATENÇÃO: Isso apagará toda a memória de contexto desta sessão. Confirmar?")) {
      clearStorage();
      setMessages([defaultMessage]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: 'text',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const { text, sources } = await generateTextResponse(input, history, systemPrompt);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        type: 'text',
        timestamp: Date.now(),
        sources: sources
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-omni-dark/50 backdrop-blur-sm rounded-xl overflow-hidden border border-omni-panel shadow-2xl">
      
      {/* Mini Header for Chat Actions */}
      <div className="h-8 bg-omni-panel/40 border-b border-white/5 flex items-center justify-end px-4">
        <button 
          onClick={handleClearMemory}
          className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1 font-mono uppercase tracking-wider"
          title="Apagar histórico local"
        >
          <i className="fas fa-trash-alt"></i> Limpar Memória
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
              <div 
                className={`max-w-[85%] p-5 rounded-2xl shadow-lg relative overflow-hidden ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-omni-secondary/20 to-omni-secondary/10 text-white border border-omni-secondary/40 rounded-br-none' 
                    : 'bg-omni-panel/90 text-gray-100 border border-omni-accent/20 rounded-bl-none'
                }`}
              >
                 {msg.role === 'model' && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-omni-accent/50"></div>
                )}
                
                <div className="flex justify-between items-center mb-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-60 flex items-center gap-2">
                     {msg.role === 'user' ? (
                       <><i className="fas fa-user-astronaut"></i> COMANDO DE ENTRADA</>
                     ) : (
                       <><i className="fas fa-network-wired text-omni-accent"></i> RESPOSTA DO PODEROSO</>
                     )}
                  </div>
                  <div className="text-[10px] font-mono opacity-40">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {msg.content}
                </div>
              </div>
            </div>

            {/* Display Sources/Grounding Data */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 max-w-[85%] flex flex-wrap gap-2 animate-fade-in">
                <div className="w-full text-[10px] font-mono text-omni-accent uppercase tracking-wider mb-1">
                  <i className="fas fa-link mr-1"></i> Dados Verificados:
                </div>
                {msg.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-black/40 hover:bg-omni-accent/10 border border-omni-accent/20 hover:border-omni-accent/50 rounded px-3 py-1.5 transition-all group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-omni-accent/50 group-hover:bg-omni-accent shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                    <span className="text-xs text-gray-400 group-hover:text-omni-accent truncate max-w-[200px]">
                      {source.title}
                    </span>
                    <i className="fas fa-external-link-alt text-[10px] text-gray-600 group-hover:text-omni-accent ml-1"></i>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start w-full">
            <div className="bg-omni-panel/40 p-4 rounded-2xl border border-omni-accent/10 rounded-bl-none flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-6 bg-omni-accent/80 animate-[pulse_1s_ease-in-out_infinite]"></span>
                <span className="w-1.5 h-4 bg-omni-accent/60 animate-[pulse_1.2s_ease-in-out_infinite]"></span>
                <span className="w-1.5 h-5 bg-omni-accent/40 animate-[pulse_0.8s_ease-in-out_infinite]"></span>
              </div>
              <span className="text-omni-accent text-xs font-mono tracking-widest">
                PROCESSANDO VONTADE DIVINA...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-omni-panel/90 border-t border-gray-800 backdrop-blur">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Insira parâmetros da missão..."
            className="flex-1 bg-omni-dark/80 text-white p-4 rounded-xl border border-gray-700/50 focus:border-omni-accent/70 focus:bg-black/50 focus:outline-none resize-none h-14 font-mono text-sm transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-gradient-to-r from-omni-accent to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 text-black font-bold px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transform hover:scale-105 active:scale-95"
          >
            <i className="fas fa-terminal text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;