import React, { useState } from 'react';
import { generateStructuralReport } from '../services/geminiService';
import { ReportData } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

const ReportDashboard: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setReport(null);
    try {
      const data = await generateStructuralReport(topic);
      setReport(data);
    } catch (e) {
      console.error(e);
      alert("Falha na geração do relatório.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="bg-omni-panel/50 p-6 rounded-xl border border-omni-accent/20 shrink-0">
        <h2 className="text-xl text-omni-accent mb-4 font-mono uppercase tracking-widest">
          <i className="fas fa-chart-line mr-2"></i> Analítico & Relatórios Estruturados
        </h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema do relatório (ex: Economia de Marte em 2050)..."
            className="flex-1 bg-omni-dark text-white p-3 rounded-lg border border-gray-700 focus:border-omni-accent focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-omni-accent hover:bg-cyan-600 text-omni-dark font-bold px-8 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? <i className="fas fa-cog fa-spin"></i> : 'Gerar Dados'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center text-omni-accent animate-pulse">
          <div className="text-center">
            <i className="fas fa-database text-4xl mb-4"></i>
            <p>Compilando dados globais...</p>
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-omni-panel to-transparent p-6 rounded-xl border-l-4 border-omni-secondary">
            <h1 className="text-3xl font-bold text-white mb-2">{report.title}</h1>
            <p className="text-gray-300 italic">{report.summary}</p>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-omni-panel/40 p-4 rounded-xl border border-gray-800 h-80">
              <h3 className="text-sm font-mono text-gray-400 mb-4 uppercase">Distribuição Quantitativa</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} 
                    itemStyle={{ color: '#06b6d4' }}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-omni-panel/40 p-4 rounded-xl border border-gray-800 h-80">
               <h3 className="text-sm font-mono text-gray-400 mb-4 uppercase">Tendência de Fluxo</h3>
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false}/>
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false}/>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-omni-dark p-6 rounded-xl border border-omni-accent/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <h3 className="text-omni-accent font-bold mb-2 uppercase tracking-wide">
              <i className="fas fa-lightbulb mr-2"></i> Insight Estratégico
            </h3>
            <p className="text-lg text-gray-200 leading-relaxed font-light">{report.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDashboard;