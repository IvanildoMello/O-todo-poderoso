import React, { useEffect, useState } from 'react';
import { getFilesFromDrive, deleteFileFromDrive } from '../services/storageService';
import { StoredFile } from '../types';

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getFilesFromDrive();
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Confirmar exclusão permanente do arquivo?")) {
      await deleteFileFromDrive(id);
      if (selectedFile?.id === id) setSelectedFile(null);
      loadFiles();
    }
  };

  const handleDownload = (file: StoredFile) => {
    const url = URL.createObjectURL(file.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-black/40 overflow-hidden">
      
      {/* File List */}
      <div className={`${selectedFile ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-gray-800`}>
        <div className="p-4 bg-omni-panel/80 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-omni-accent font-mono uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-folder-open"></i> OmniDrive (Local)
          </h2>
          <span className="text-xs text-gray-500 font-mono">{files.length} ARQUIVOS</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-10">
              <i className="fas fa-circle-notch fa-spin text-omni-accent"></i>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-600 p-10 text-sm">
              <i className="fas fa-hdd text-4xl mb-3 opacity-30"></i>
              <p>Diretório vazio.</p>
            </div>
          ) : (
            files.map(file => (
              <div 
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between group transition-all ${selectedFile?.id === file.id ? 'bg-omni-accent/20 border border-omni-accent/50' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${file.type === 'IMAGE' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                    <i className={`fas ${file.type === 'IMAGE' ? 'fa-image' : file.type === 'REPORT' ? 'fa-file-alt' : 'fa-file-code'}`}></i>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-gray-200 truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{new Date(file.createdAt).toLocaleDateString()} • {formatSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, file.id)}
                  className="w-8 h-8 rounded-full hover:bg-red-900/50 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className={`${selectedFile ? 'flex' : 'hidden md:flex'} w-full md:w-[400px] lg:w-[500px] bg-omni-dark flex-col border-l border-gray-800 absolute md:relative inset-0 md:inset-auto z-20`}>
        {selectedFile ? (
          <>
            <div className="p-3 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
              <button onClick={() => setSelectedFile(null)} className="md:hidden text-gray-400">
                <i className="fas fa-arrow-left"></i>
              </button>
              <h3 className="font-bold text-gray-200 truncate text-sm flex-1">{selectedFile.name}</h3>
              <button 
                onClick={() => handleDownload(selectedFile)}
                className="bg-omni-accent text-black text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 hover:bg-cyan-400"
              >
                <i className="fas fa-download"></i> EXPORTAR
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-black/50">
               {selectedFile.type === 'IMAGE' ? (
                 <img 
                   src={URL.createObjectURL(selectedFile.data)} 
                   alt="Preview" 
                   className="max-w-full max-h-full rounded shadow-2xl border border-gray-800" 
                 />
               ) : (
                 <div className="text-gray-400 flex flex-col items-center">
                   <i className="fas fa-file-alt text-6xl mb-4 text-gray-700"></i>
                   <p>Pré-visualização não disponível para este formato.</p>
                 </div>
               )}
            </div>

            <div className="p-4 bg-gray-900 border-t border-gray-800 space-y-2">
               <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                 <span className="text-gray-500">TIPO</span>
                 <span className="text-omni-accent font-mono">{selectedFile.type}</span>
               </div>
               <div className="flex justify-between text-xs border-b border-gray-800 pb-2">
                 <span className="text-gray-500">TAMANHO</span>
                 <span className="text-gray-200 font-mono">{formatSize(selectedFile.size)}</span>
               </div>
               <div className="flex justify-between text-xs">
                 <span className="text-gray-500">DATA</span>
                 <span className="text-gray-200 font-mono">{new Date(selectedFile.createdAt).toLocaleString()}</span>
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 p-6 text-center">
            <i className="fas fa-mouse-pointer text-4xl mb-4 opacity-50"></i>
            <p className="text-sm">Selecione um arquivo para inspecionar.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default FileManager;