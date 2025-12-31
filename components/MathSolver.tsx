import React, { useState } from 'react';
import { generateMathSolution } from '../services/geminiService';
import MathDisplay from './MathDisplay';

const MathSolver: React.FC = () => {
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSolve = async () => {
    if (!problem.trim()) return;
    setLoading(true);
    setSolution(null);
    try {
      const result = await generateMathSolution(problem);
      setSolution(result);
    } catch (e) {
      setSolution("Erro de cálculo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-4 md:gap-6 overflow-y-auto">
      <div className="bg-omni-panel/50 p-4 md:p-6 rounded-xl border border-omni-accent/20 shrink-0">
         <h2 className="text-lg md:text-xl text-omni-accent mb-4 font-mono uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-square-root-variable"></i> Math Core
        </h2>
         <div className="flex flex-col gap-4">
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Insira um problema complexo (ex: Derive a equação da relatividade geral...)"
            className="w-full bg-omni-dark text-white p-3 rounded-lg border border-gray-700 focus:border-omni-accent focus:outline-none h-24 md:h-32 resize-none text-sm"
          />
          <div className="flex justify-end">
             <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 md:py-2 rounded-lg transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-calculator"></i>}
              {loading ? 'Calculando...' : 'Calcular Solução'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-omni-panel/30 rounded-xl border border-gray-800 p-4 md:p-6 overflow-y-auto min-h-[300px]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <i className="fas fa-brain fa-spin text-4xl mb-4 text-emerald-500"></i>
            <p className="text-sm">Aplicando raciocínio profundo...</p>
          </div>
        ) : solution ? (
          <div className="prose prose-invert max-w-none text-sm md:text-base">
             <MathDisplay content={solution} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600">
            <p className="text-sm italic">O quadro negro está vazio.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathSolver;