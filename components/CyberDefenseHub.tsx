import React, { useState, useEffect, useRef } from 'react';
import { generateSecurityAnalysis, fetchLiveThreatIntel, analyzeCodeSandbox } from '../services/geminiService';
import { ThreatIntel, SandboxResult, AlertConfig, Countermeasure } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine 
} from 'recharts';

interface MonitorPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number; // MB/s
  disk: number; // MB/s
  isAnomaly: boolean;
}

interface SecurityLog {
  id: number;
  time: string;
  type: 'INFO' | 'WARN' | 'CRITICAL' | 'DEFENSE';
  message: string;
}

const CyberDefenseHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STRATEGY' | 'SANDBOX'>('STRATEGY');
  
  // Strategy State
  const [scenario, setScenario] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Threat Intel State
  const [threats, setThreats] = useState<ThreatIntel[]>([]);
  const [loadingThreats, setLoadingThreats] = useState(false);

  // Sandbox State
  const [code, setCode] = useState('');
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Anomaly Monitor State
  const [monitorData, setMonitorData] = useState<MonitorPoint[]>([]);
  const [alertLevel, setAlertLevel] = useState<'NORMAL' | 'WARNING' | 'CRITICAL'>('NORMAL');
  const [isIsolated, setIsIsolated] = useState(false); 
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  
  // Countermeasures State
  const [activeCountermeasures, setActiveCountermeasures] = useState<Countermeasure[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Alert Configuration & Stress Test
  const [showConfig, setShowConfig] = useState(false);
  const [stressTest, setStressTest] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    cpuWarning: 70,
    cpuCritical: 90,
    memWarning: 75,
    memCritical: 95,
    netCritical: 80, // MB/s
    diskCritical: 150, // MB/s
    autoIsolation: true
  });

  const addLog = (type: SecurityLog['type'], message: string) => {
    setSecurityLogs(prev => [...prev.slice(-49), {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message
    }]);
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [securityLogs]);

  // Initialize Monitor Data
  useEffect(() => {
    const initialData: MonitorPoint[] = Array.from({ length: 40 }, (_, i) => ({
      time: new Date(Date.now() - (40 - i) * 5000).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      cpu: 10 + Math.random() * 20,
      memory: 20 + Math.random() * 10,
      network: Math.random() * 5,
      disk: Math.random() * 5,
      isAnomaly: false
    }));
    setMonitorData(initialData);
    addLog('INFO', 'Monitoramento ativo. Protocolos de heurística iniciados.');
  }, []);

  // Monitor Simulation Loop
  useEffect(() => {
    loadThreats();
    
    const interval = setInterval(() => {
      // If isolated, metrics drop to zero (simulating freeze/cut)
      if (isIsolated) {
        setMonitorData(prev => {
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
          const newData = [...prev, { time: timeStr, cpu: 5, memory: 5, network: 0, disk: 0, isAnomaly: false }];
          if (newData.length > 40) newData.shift();
          return newData;
        });
        return; 
      }

      setMonitorData(prev => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        
        // Base values depend on Stress Test Mode
        const baseCpu = stressTest ? 85 : 15;
        const baseMem = stressTest ? 80 : 25;
        const baseNet = stressTest ? 120 : 5; // MB/s
        const baseDisk = stressTest ? 200 : 10; // MB/s
        const variance = stressTest ? 15 : 5;

        // Generate fluctuated data
        let newCpu = Math.min(100, Math.max(5, baseCpu + (Math.random() * variance * 2 - variance)));
        let newMem = Math.min(100, Math.max(10, baseMem + (Math.random() * variance * 2 - variance)));
        let newNet = Math.max(0, baseNet + (Math.random() * variance * 4 - variance * 2));
        let newDisk = Math.max(0, baseDisk + (Math.random() * variance * 4 - variance * 2));
        
        // Occasional random spikes if not in stress test
        const randomSpike = !stressTest && Math.random() > 0.95;
        if (randomSpike) {
           newCpu += 30;
           newNet += 90; // Sudden data burst
           addLog('WARN', 'Pico de tráfego de rede detectado.');
        }

        // --- ALERT LOGIC ---
        // Determine Anomaly based on thresholds
        const isCpuCritical = newCpu >= alertConfig.cpuCritical;
        const isMemCritical = newMem >= alertConfig.memCritical;
        const isNetCritical = newNet >= alertConfig.netCritical;
        const isDiskCritical = newDisk >= alertConfig.diskCritical;
        
        let currentLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
        let isAnomaly = false;

        if (isCpuCritical || isMemCritical || isNetCritical || isDiskCritical) {
          currentLevel = 'CRITICAL';
          isAnomaly = true;
          
          if (isNetCritical) addLog('CRITICAL', `Anomalia de Rede: ${newNet.toFixed(1)} MB/s (Exfiltração provável)`);
          if (isDiskCritical) addLog('CRITICAL', `Anomalia de I/O: ${newDisk.toFixed(1)} MB/s (Criptografia em massa?)`);

          // Auto Isolation Trigger
          if (alertConfig.autoIsolation && !isIsolated) {
            setIsIsolated(true);
            setStressTest(false); // Stop the simulation source
            setAlertLevel('CRITICAL');
            
            addLog('DEFENSE', 'PROTOCOLOS DE ISOLAMENTO ATIVADOS AUTOMATICAMENTE.');
            addLog('DEFENSE', 'Interfaces de rede desabilitadas. Processos suspensos.');

            // Generate Proactive Countermeasures based on anomaly type
            const newMeasures: Countermeasure[] = [];
            
            if (isNetCritical) {
                newMeasures.push({
                    id: `cm-${Date.now()}-1`,
                    type: 'NETWORK',
                    action: 'BLOCK_IP',
                    target: '203.0.113.45 (Remote Host)',
                    status: 'PENDING',
                    riskLevel: 'MEDIUM'
                });
                newMeasures.push({
                    id: `cm-${Date.now()}-2`,
                    type: 'NETWORK',
                    action: 'DISABLE_PORT',
                    target: 'TCP/445 (SMB)',
                    status: 'PENDING',
                    riskLevel: 'HIGH'
                });
            }
            if (isDiskCritical || isCpuCritical) {
                newMeasures.push({
                    id: `cm-${Date.now()}-3`,
                    type: 'PROCESS',
                    action: 'KILL_PROCESS',
                    target: 'PID 9942 (svchost.exe - injected)',
                    status: 'PENDING',
                    riskLevel: 'HIGH'
                });
                newMeasures.push({
                    id: `cm-${Date.now()}-4`,
                    type: 'FILE',
                    action: 'LOCK_DIR',
                    target: '/usr/local/data (Read-Only)',
                    status: 'PENDING',
                    riskLevel: 'LOW'
                });
            }

            setActiveCountermeasures(newMeasures);
            
            return prev; // Stop updating prev immediately visually
          }

        } else if (newCpu >= alertConfig.cpuWarning) {
          currentLevel = 'WARNING';
        }

        setAlertLevel(currentLevel);

        const newPoint: MonitorPoint = {
          time: timeStr,
          cpu: Math.floor(newCpu),
          memory: Math.floor(newMem),
          network: Math.floor(newNet),
          disk: Math.floor(newDisk),
          isAnomaly
        };

        const newData = [...prev, newPoint];
        if (newData.length > 40) newData.shift();
        return newData;
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, [stressTest, alertConfig, isIsolated]);

  const loadThreats = async () => {
    setLoadingThreats(true);
    const data = await fetchLiveThreatIntel();
    setThreats(data);
    setLoadingThreats(false);
  };

  const handleAnalyze = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await generateSecurityAnalysis(scenario);
      setAnalysis(result);
      addLog('INFO', 'Análise estratégica concluída via Gemini 3 Pro.');
    } catch (e) {
      setAnalysis("Erro crítico na conexão com a rede de inteligência.");
      addLog('WARN', 'Falha na conexão com motor neural.');
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxAnalyze = async () => {
    if (!code.trim()) return;
    setAnalyzingCode(true);
    setSandboxResult(null);
    try {
      addLog('INFO', 'Iniciando análise estática de payload...');
      const result = await analyzeCodeSandbox(code);
      setSandboxResult(result);
      addLog('INFO', `Sandbox finalizada. Veredito: ${result.verdict}`);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingCode(false);
    }
  };

  const downloadSandboxReport = () => {
    if (!sandboxResult) return;
    const content = `OMNICORE SECURITY - RELATÓRIO DE SANDBOX
========================================
DATA: ${new Date().toLocaleString()}

VEREDITO: ${sandboxResult.verdict}
SCORE DE RISCO: ${sandboxResult.riskScore}/100
AÇÃO DE ISOLAMENTO: ${sandboxResult.isolationAction}

COMPORTAMENTOS DETECTADOS:
${sandboxResult.detectedBehaviors.map(b => `- ${b}`).join('\n')}

ANÁLISE TÉCNICA:
${sandboxResult.technicalAnalysis}
========================================
Generated by OmniCore AI Defense Hub`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sandbox_analysis_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSafeExecute = () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setExecutionLogs(['> Inicializando Container de Isolamento (Web Worker)...', '> Compilando...']);
    addLog('WARN', 'Execução de código não verificado iniciada em Web Worker.');

    // Create a secure Web Worker dynamically
    const workerCode = `
      self.onmessage = function(e) {
        const userCode = e.data;
        
        // Hijack console
        const logs = [];
        console.log = function(...args) {
          self.postMessage({ type: 'log', content: args.join(' ') });
        };
        console.error = function(...args) {
          self.postMessage({ type: 'error', content: args.join(' ') });
        };
        console.warn = function(...args) {
           self.postMessage({ type: 'warn', content: args.join(' ') });
        };

        try {
          // Dangerous execution isolated in worker
          const result = new Function(userCode)();
          if (result !== undefined) {
            self.postMessage({ type: 'result', content: String(result) });
          }
          self.postMessage({ type: 'done' });
        } catch (error) {
          self.postMessage({ type: 'error', content: error.toString() });
          self.postMessage({ type: 'done' });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    // Safety Timeout (5 seconds)
    const timeoutId = setTimeout(() => {
      worker.terminate();
      setExecutionLogs(prev => [...prev, '!!! TIMEOUT DE SEGURANÇA: PROCESSO TERMINADO !!!']);
      addLog('DEFENSE', 'Processo do Worker excedeu tempo limite. Encerrado.');
      setIsRunning(false);
    }, 5000);

    worker.onmessage = (e) => {
      const { type, content } = e.data;
      if (type === 'done') {
        clearTimeout(timeoutId);
        worker.terminate();
        setExecutionLogs(prev => [...prev, '> Execução finalizada.']);
        setIsRunning(false);
      } else if (type === 'log') {
        setExecutionLogs(prev => [...prev, `[STDOUT] ${content}`]);
      } else if (type === 'error') {
        setExecutionLogs(prev => [...prev, `[STDERR] ${content}`]);
      } else if (type === 'warn') {
        setExecutionLogs(prev => [...prev, `[WARN] ${content}`]);
      } else if (type === 'result') {
         setExecutionLogs(prev => [...prev, `[RETURN] ${content}`]);
      }
    };

    worker.postMessage(code);
  };

  const executeCountermeasure = (id: string) => {
    setActiveCountermeasures(prev => prev.map(cm => 
        cm.id === id ? { ...cm, status: 'EXECUTING' } : cm
    ));

    // Simulate async execution
    setTimeout(() => {
        setActiveCountermeasures(prev => {
            const updated = prev.map(cm => 
                cm.id === id ? { ...cm, status: 'COMPLETED' as const } : cm
            );
            const targetCM = updated.find(cm => cm.id === id);
            if (targetCM) {
                addLog('DEFENSE', `CONTRAMEDIDA EXECUTADA: ${targetCM.action} em ${targetCM.target}`);
            }
            return updated;
        });
    }, 1500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-600 text-white shadow-[0_0_10px_#dc2626]';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-gray-600';
    }
  };

  const resetIsolation = () => {
    setIsIsolated(false);
    setAlertLevel('NORMAL');
    setStressTest(false);
    setActiveCountermeasures([]);
    addLog('INFO', 'Protocolos de isolamento suspensos manualmente pelo operador.');
    addLog('INFO', 'Sistemas de rede e I/O reativados.');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6 text-gray-200 overflow-y-auto lg:overflow-hidden relative custom-scrollbar">
      
      {/* ISOLATION MODE OVERLAY */}
      {isIsolated && (
        <div className="fixed inset-0 bg-red-950/95 z-[60] backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in border-4 border-red-600 p-6 overflow-y-auto">
          <div className="bg-black/90 p-6 md:p-8 rounded-2xl border-2 border-red-500 text-center shadow-[0_0_100px_#dc2626] max-w-3xl w-full">
            <div className="flex flex-col items-center mb-6">
                <i className="fas fa-shield-virus text-5xl md:text-7xl text-red-500 mb-4 animate-pulse"></i>
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tighter uppercase">Protocolo de Isolamento Ativo</h1>
                <p className="text-red-300 mt-2 text-sm md:text-lg max-w-xl">
                O OmniCore detectou anomalias críticas e iniciou o bloqueio de I/O.
                Revisão de contramedidas proativas requerida pelo operador.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                {/* System Status Panel */}
                <div className="bg-red-900/20 p-4 rounded border border-red-800">
                    <h3 className="text-red-400 font-mono text-xs uppercase mb-3 border-b border-red-800 pb-1">Status de Infraestrutura</h3>
                    <div className="space-y-2 font-mono text-xs md:text-sm">
                        <div className="flex justify-between text-white"><span>NETWORK:</span> <span className="text-red-500 font-bold animate-pulse">DISABLED</span></div>
                        <div className="flex justify-between text-white"><span>DISK I/O:</span> <span className="text-red-500 font-bold">READ-ONLY</span></div>
                        <div className="flex justify-between text-white"><span>KERNEL:</span> <span className="text-yellow-500">SAFE MODE</span></div>
                    </div>
                </div>

                {/* Countermeasures Panel */}
                <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                    <h3 className="text-omni-accent font-mono text-xs uppercase mb-3 border-b border-gray-700 pb-1">Contramedidas Sugeridas (IA)</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {activeCountermeasures.map(cm => (
                            <div key={cm.id} className="flex items-center justify-between bg-black/40 p-2 rounded border border-gray-700">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white flex items-center gap-2">
                                        {cm.type === 'NETWORK' && <i className="fas fa-network-wired text-cyan-500"></i>}
                                        {cm.type === 'PROCESS' && <i className="fas fa-microchip text-yellow-500"></i>}
                                        {cm.type === 'FILE' && <i className="fas fa-file-code text-blue-500"></i>}
                                        {cm.action}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">{cm.target}</span>
                                </div>
                                
                                {cm.status === 'PENDING' && (
                                    <button 
                                        onClick={() => executeCountermeasure(cm.id)}
                                        className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-colors"
                                    >
                                        EXECUTAR
                                    </button>
                                )}
                                {cm.status === 'EXECUTING' && (
                                    <span className="text-yellow-500 text-[10px] font-mono animate-pulse">
                                        <i className="fas fa-circle-notch fa-spin mr-1"></i> APLICANDO
                                    </span>
                                )}
                                {cm.status === 'COMPLETED' && (
                                    <span className="text-green-500 text-[10px] font-mono">
                                        <i className="fas fa-check mr-1"></i> FEITO
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                onClick={resetIsolation}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 md:py-4 rounded-lg text-sm md:text-lg shadow-lg transition-all border border-gray-500"
                >
                <i className="fas fa-undo mr-2"></i> RESTAURAR SISTEMA
                </button>
                {activeCountermeasures.some(c => c.status === 'PENDING') && (
                    <button 
                    onClick={() => activeCountermeasures.forEach(cm => { if (cm.status === 'PENDING') executeCountermeasure(cm.id) })}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 md:py-4 rounded-lg text-sm md:text-lg shadow-[0_0_20px_#dc2626] transition-all animate-pulse"
                    >
                    <i className="fas fa-radiation mr-2"></i> EXECUTAR TODAS
                    </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Visual Overlay for Critical Alert (Non-isolated) */}
      {alertLevel === 'CRITICAL' && !isIsolated && (
        <div className="absolute inset-0 border-4 border-red-600 animate-pulse pointer-events-none z-40 rounded-lg shadow-[inset_0_0_50px_rgba(220,38,38,0.5)] bg-red-900/10"></div>
      )}

      {/* Main Analysis Column */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 shrink-0 lg:h-full lg:overflow-hidden z-10 min-h-[500px]">
        
        {/* Navigation */}
        <div className="flex gap-2 md:gap-4 mb-0 overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setActiveTab('STRATEGY')}
            className={`px-4 md:px-6 py-2 rounded-lg md:rounded-t-lg font-mono text-xs md:text-sm font-bold border md:border-b-2 transition-all whitespace-nowrap ${activeTab === 'STRATEGY' ? 'bg-omni-panel border-omni-accent text-white' : 'border-gray-700 bg-black/20 text-gray-500'}`}
          >
            <i className="fas fa-chess-knight mr-2"></i> ESTRATÉGIA
          </button>
          <button 
            onClick={() => setActiveTab('SANDBOX')}
            className={`px-4 md:px-6 py-2 rounded-lg md:rounded-t-lg font-mono text-xs md:text-sm font-bold border md:border-b-2 transition-all whitespace-nowrap ${activeTab === 'SANDBOX' ? 'bg-red-900/20 border-red-500 text-red-100' : 'border-gray-700 bg-black/20 text-gray-500'}`}
          >
            <i className="fas fa-microchip mr-2"></i> SANDBOX
          </button>
        </div>

        {activeTab === 'STRATEGY' ? (
          // STRATEGY VIEW
          <div className="flex flex-col gap-4 h-full">
            <div className="bg-omni-dark/80 p-4 md:p-6 rounded-xl border border-red-900/50 shadow-[0_0_20px_rgba(153,27,27,0.15)] relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <i className="fas fa-shield-virus text-6xl md:text-9xl text-red-600"></i>
              </div>
              <h2 className="text-lg md:text-xl text-red-500 mb-2 font-mono uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-user-shield"></i> Cyber Sentinel
              </h2>
              <p className="text-xs md:text-sm text-gray-400 max-w-2xl mb-4">
                Descreva um cenário suspeito para receber protocolos de endurecimento.
              </p>
              
              <div className="flex gap-4 relative z-10">
                <textarea
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Ex: Recebi um email com anexo .js de um remetente conhecido..."
                  className="flex-1 bg-black/60 text-red-50 p-3 rounded-lg border border-red-900/30 focus:border-red-500 focus:outline-none h-20 resize-none font-mono text-sm"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full md:w-auto bg-red-900/80 hover:bg-red-800 text-white font-bold px-6 py-3 md:py-2 rounded-lg transition-all disabled:opacity-50 border border-red-700 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-radar"></i>}
                  {loading ? 'Analisando...' : 'Iniciar Defesa'}
                </button>
              </div>
            </div>

            <div className="flex-1 bg-omni-panel/30 rounded-xl border border-gray-800 p-4 md:p-6 overflow-y-auto min-h-[300px]">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-red-500/70 py-10">
                  <i className="fas fa-biohazard fa-spin text-4xl mb-4"></i>
                  <p className="font-mono tracking-wider animate-pulse text-xs">PROCESSANDO VETORES...</p>
                </div>
              ) : analysis ? (
                <div className="animate-fade-in">
                  <div className="prose prose-invert prose-sm max-w-none font-sans">
                    <div className="whitespace-pre-wrap">{analysis}</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 py-10">
                  <i className="fas fa-lock text-4xl mb-4"></i>
                  <p className="font-mono text-xs">AGUARDANDO INPUT</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // SANDBOX VIEW (Updated Layout)
          <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Input Area */}
            <div className="h-48 md:h-1/3 bg-black/80 rounded-xl border border-red-500/30 flex flex-col overflow-hidden shrink-0">
               <div className="bg-red-900/20 p-2 border-b border-red-500/30 flex justify-between items-center">
                 <span className="font-mono text-xs text-red-400 tracking-wider">
                   <i className="fas fa-code mr-2"></i> JS SANDBOX
                 </span>
                 <div className="flex gap-2">
                   <button onClick={() => {setCode(''); setExecutionLogs([]); setSandboxResult(null);}} className="text-xs text-gray-500 hover:text-white">
                     <i className="fas fa-eraser"></i> Limpar
                   </button>
                 </div>
               </div>
               <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Cole o script suspeito aqui para análise ou execução segura (Worker)..."
                  className="flex-1 bg-transparent text-green-400 p-3 font-mono text-xs md:text-sm focus:outline-none resize-none"
                  spellCheck={false}
                />
            </div>
            
            {/* Action Bar - Stacked on mobile */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                 onClick={handleSandboxAnalyze}
                 disabled={analyzingCode || !code.trim() || isRunning}
                 className="flex-1 bg-omni-panel hover:bg-gray-700 text-white font-bold py-3 rounded-lg border border-gray-600 transition-all flex justify-center items-center gap-2 text-sm"
              >
                 {analyzingCode ? <i className="fas fa-search fa-spin"></i> : <i className="fas fa-microscope"></i>}
                 ANÁLISE ESTÁTICA
              </button>
              <button
                 onClick={handleSafeExecute}
                 disabled={analyzingCode || !code.trim() || isRunning}
                 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] border border-red-500 transition-all flex justify-center items-center gap-2 text-sm"
              >
                 {isRunning ? <i className="fas fa-cog fa-spin"></i> : <i className="fas fa-play"></i>}
                 EXECUTAR EM ISOLAMENTO
              </button>
            </div>

            {/* Split View: Results & Console - Stacked on mobile */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden">
              
              {/* Static Analysis Result */}
              <div className="flex-1 bg-omni-panel/50 rounded-xl border border-gray-700 overflow-y-auto min-h-[200px]">
                <div className="bg-gray-800/50 p-2 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-mono text-gray-400 uppercase">Relatório de Análise Estática</span>
                  {sandboxResult && (
                    <button 
                      onClick={downloadSandboxReport}
                      className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors flex items-center gap-1"
                      title="Baixar Relatório .txt"
                    >
                      <i className="fas fa-download"></i> SALVAR
                    </button>
                  )}
                </div>
                {sandboxResult ? (
                   <div className="p-4 animate-slide-up">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded font-bold text-sm ${
                               sandboxResult.verdict === 'MALICIOUS' ? 'bg-red-600 text-white' : 
                               sandboxResult.verdict === 'SUSPICIOUS' ? 'bg-orange-500 text-black' : 
                               'bg-green-600 text-white'
                            }`}>
                               {sandboxResult.verdict}
                            </div>
                            <div className="text-gray-400 text-sm font-mono">SCORE: <span className="text-white">{sandboxResult.riskScore}/100</span></div>
                         </div>
                         <div className="font-mono text-[10px] text-red-400 border border-red-500/50 px-2 py-1 rounded">
                            {sandboxResult.isolationAction}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <div className="bg-black/30 p-2 rounded">
                            <h4 className="text-[10px] font-mono text-gray-500 mb-1">COMPORTAMENTOS</h4>
                            <ul className="list-disc list-inside text-xs text-gray-300">
                               {sandboxResult.detectedBehaviors.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                         </div>
                         <p className="text-xs text-gray-300 leading-relaxed border-l-2 border-gray-600 pl-2">
                           {sandboxResult.technicalAnalysis}
                         </p>
                      </div>
                   </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
                    Nenhum relatório gerado.
                  </div>
                )}
              </div>

              {/* Runtime Console */}
              <div className="flex-1 bg-black rounded-xl border border-gray-700 flex flex-col overflow-hidden font-mono min-h-[150px]">
                <div className="bg-gray-900 p-2 border-b border-gray-700 text-xs text-green-500 flex justify-between">
                  <span>TERMINAL DE EXECUÇÃO (READ-ONLY)</span>
                  {isRunning && <span className="animate-pulse">● RUNNING</span>}
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-1 text-xs">
                  {executionLogs.length === 0 && !isRunning ? (
                    <span className="text-gray-600">// Aguardando execução...</span>
                  ) : (
                    executionLogs.map((log, idx) => {
                      let color = 'text-gray-300';
                      if (log.startsWith('[STDERR]')) color = 'text-red-500';
                      if (log.startsWith('[WARN]')) color = 'text-yellow-500';
                      if (log.startsWith('[RETURN]')) color = 'text-omni-accent font-bold';
                      if (log.startsWith('>')) color = 'text-gray-500 italic';
                      
                      return <div key={idx} className={`${color} break-words`}>{log}</div>
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Stacked on Mobile */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 z-10 lg:h-full pb-10 md:pb-0">
        
        {/* Active Monitor */}
        <div className="bg-black/60 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative h-64 lg:h-[50%] shrink-0">
           
           {/* Header */}
           <div className="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400 uppercase">System Monitor</span>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setShowConfig(!showConfig)}
                  className={`text-xs ${showConfig ? 'text-omni-accent' : 'text-gray-500'} hover:text-white transition-colors`}
                  title="Configurar Alertas"
                 >
                    <i className="fas fa-cog"></i>
                 </button>
                 <span className={`w-2 h-2 rounded-full ${alertLevel === 'CRITICAL' ? 'bg-red-500 animate-ping' : alertLevel === 'WARNING' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
              </div>
           </div>
           
           {/* Monitor Settings Overlay (Simplified for mobile) */}
           {showConfig && (
             <div className="absolute top-10 left-0 right-0 bottom-0 bg-black/95 z-20 p-4 animate-fade-in overflow-y-auto">
                <h4 className="text-xs font-mono text-omni-accent mb-4 uppercase tracking-wider border-b border-gray-800 pb-2">
                   Configuração de Gatilhos
                </h4>
                
                <div className="space-y-4">
                   {/* CPU */}
                   <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                         <span>CPU MAX</span>
                         <span className="text-red-500">{alertConfig.cpuCritical}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" 
                        value={alertConfig.cpuCritical} 
                        onChange={(e) => setAlertConfig({...alertConfig, cpuCritical: Number(e.target.value)})}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                   </div>

                   {/* NETWORK */}
                   <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                         <span>NETWORK MAX (MB/s)</span>
                         <span className="text-red-500">{alertConfig.netCritical}</span>
                      </div>
                      <input 
                        type="range" min="10" max="200" 
                        value={alertConfig.netCritical} 
                        onChange={(e) => setAlertConfig({...alertConfig, netCritical: Number(e.target.value)})}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                   </div>

                   {/* DISK */}
                   <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                         <span>DISK I/O MAX (MB/s)</span>
                         <span className="text-red-500">{alertConfig.diskCritical}</span>
                      </div>
                      <input 
                        type="range" min="50" max="500" 
                        value={alertConfig.diskCritical} 
                        onChange={(e) => setAlertConfig({...alertConfig, diskCritical: Number(e.target.value)})}
                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                   </div>

                   <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <span className="text-[10px] text-gray-400">ISOLAMENTO AUTOMÁTICO</span>
                      <button 
                        onClick={() => setAlertConfig({...alertConfig, autoIsolation: !alertConfig.autoIsolation})}
                        className={`w-8 h-4 rounded-full relative transition-colors ${alertConfig.autoIsolation ? 'bg-omni-accent' : 'bg-gray-700'}`}
                      >
                         <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${alertConfig.autoIsolation ? 'left-4.5' : 'left-0.5'}`}></span>
                      </button>
                   </div>
                </div>
                
                <button 
                  onClick={() => setShowConfig(false)}
                  className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 text-xs font-bold rounded text-gray-300"
                >
                   FECHAR CONFIGURAÇÃO
                </button>
             </div>
           )}

           {/* Chart */}
           <div className="flex-1 p-2 relative">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={monitorData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                 <XAxis dataKey="time" hide />
                 <YAxis tick={{fontSize: 9, fill: '#6b7280'}} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', fontSize: '10px' }}
                    itemStyle={{ padding: 0 }}
                 />
                 
                 <Bar dataKey="cpu" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} name="CPU %" />
                 <Bar dataKey="network" stackId="b" fill="#8b5cf6" radius={[0, 0, 0, 0]} name="Net MB/s">
                    {monitorData.map((entry, index) => (
                      <Cell key={`cell-net-${index}`} fill={entry.network >= alertConfig.netCritical ? '#dc2626' : '#8b5cf6'} />
                    ))}
                 </Bar>
                 <Bar dataKey="disk" stackId="c" fill="#10b981" radius={[2, 2, 0, 0]} name="Disk MB/s">
                     {monitorData.map((entry, index) => (
                      <Cell key={`cell-disk-${index}`} fill={entry.disk >= alertConfig.diskCritical ? '#ef4444' : '#10b981'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
           
           {/* Footer Stats & Tools */}
           <div className="p-3 border-t border-gray-800 flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                 <span>STATUS: <span className={alertLevel === 'CRITICAL' ? 'text-red-500 font-bold' : alertLevel === 'WARNING' ? 'text-yellow-500' : 'text-green-500'}>{alertLevel}</span></span>
                 <span>AUTO-LOCK: {alertConfig.autoIsolation ? 'ON' : 'OFF'}</span>
              </div>
              <button
                onClick={() => setStressTest(!stressTest)}
                className={`w-full py-1 text-[10px] font-bold rounded border transition-all ${stressTest ? 'bg-red-900/50 border-red-500 text-red-200 animate-pulse' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
              >
                 {stressTest ? '⚠ PARAR SIMULAÇÃO DE ATAQUE' : 'INICIAR STRESS TEST (SIMULAR CARGA)'}
              </button>
           </div>
        </div>

        {/* Live Security Logs */}
        <div className="flex-1 bg-black/40 border border-gray-800 rounded-xl flex flex-col overflow-hidden min-h-[200px] lg:h-[50%]">
          <div className="p-3 border-b border-gray-800 bg-gray-900">
            <h3 className="font-mono text-xs text-omni-accent tracking-wider">
              <i className="fas fa-list-ul mr-2"></i>SECURITY EVENTS LOG
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1">
             {securityLogs.length === 0 ? (
               <div className="text-gray-600 italic">// Nenhum evento registrado</div>
             ) : (
               securityLogs.map(log => (
                 <div key={log.id} className="flex gap-2 border-b border-gray-800/50 pb-1">
                   <span className="text-gray-500">[{log.time}]</span>
                   <span className={`font-bold ${
                     log.type === 'CRITICAL' ? 'text-red-500' : 
                     log.type === 'WARN' ? 'text-yellow-500' : 
                     log.type === 'DEFENSE' ? 'text-omni-accent' : 'text-blue-400'
                   }`}>
                     {log.type}
                   </span>
                   <span className="text-gray-300 break-all">{log.message}</span>
                 </div>
               ))
             )}
             <div ref={logsEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default CyberDefenseHub;