import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const result = await generateImage(prompt);
      if (result) {
        setImageUrl(result);
      } else {
        setError("Não foi possível gerar a imagem. Tente um prompt diferente.");
      }
    } catch (err) {
      setError("Erro ao conectar com o módulo visual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 md:gap-6 p-4 md:p-6 overflow-y-auto">
      <div className="bg-omni-panel/50 p-4 md:p-6 rounded-xl border border-omni-accent/20 shrink-0">
        <h2 className="text-lg md:text-xl text-omni-accent mb-4 font-mono uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-eye"></i> Visual Studio
        </h2>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva uma cena de outro mundo..."
            className="flex-1 bg-omni-dark text-white p-3 rounded-lg border border-gray-700 focus:border-omni-accent focus:outline-none text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-omni-secondary hover:bg-violet-700 text-white font-bold py-3 md:py-0 px-8 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Materializar'}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-black/40 rounded-xl border-2 border-dashed border-gray-800 flex items-center justify-center overflow-hidden relative group min-h-[300px]">
        {imageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
             <img src={imageUrl} alt="Generated" className="max-h-full max-w-full object-contain shadow-2xl" />
             <a 
               href={imageUrl} 
               download={`omni-gen-${Date.now()}.png`}
               className="absolute bottom-4 right-4 bg-omni-accent text-omni-dark px-4 py-2 rounded shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity font-bold text-sm"
             >
               <i className="fas fa-download mr-2"></i> Salvar
             </a>
          </div>
        ) : (
          <div className="text-gray-600 flex flex-col items-center p-4 text-center">
            {loading ? (
              <>
                 <i className="fas fa-circle-notch fa-spin text-3xl md:text-4xl mb-4 text-omni-secondary"></i>
                 <p className="text-sm">Renderizando realidade...</p>
              </>
            ) : error ? (
              <>
                <i className="fas fa-exclamation-triangle text-3xl md:text-4xl mb-4 text-red-500"></i>
                <p className="text-red-400 text-sm">{error}</p>
              </>
            ) : (
              <>
                <i className="fas fa-image text-3xl md:text-4xl mb-4 opacity-50"></i>
                <p className="text-sm">Aguardando input visual</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;