import React, { useState, useEffect } from 'react';
import ImpactAnalysis from './components/ImpactAnalysis';
import { getAllDocuments, uploadInitialData } from './services/firebaseService';
import { QMSDocument } from './types';

// Datos para el botón de carga (Seed)
import docsData from './data/docs.json';
import linksData from './data/links.json';

const App: React.FC = () => {
  const [docs, setDocs] = useState<QMSDocument[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 1. NUEVO ESTADO PARA EL BUSCADOR
  const [searchTerm, setSearchTerm] = useState("");

  const refreshDocs = async () => {
    setLoading(true);
    const data = await getAllDocuments();
    // Ordenamos por código (A-Z)
    data.sort((a, b) => a.ID_DOC.localeCompare(b.ID_DOC));
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { refreshDocs(); }, []);

  const handleSeed = async () => {
    if(!confirm("⚠️ ¿Recargar base de datos desde Excel?")) return;
    setLoading(true);
    try {
      await uploadInitialData(docsData, linksData);
      alert("✅ Datos actualizados");
      refreshDocs();
    } catch (e) { alert("Error: " + e); }
    setLoading(false);
  };

  // 2. LÓGICA DE FILTRADO (MAGIA AQUÍ)
  // Filtramos la lista original 'docs' basándonos en lo que escribas
  const filteredDocs = docs.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      doc.ID_DOC.toLowerCase().includes(term) || // Busca por Código
      doc.TITULO.toLowerCase().includes(term)    // O busca por Título
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-5xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SGC - ISO 9001</h1>
          <p className="text-gray-500 text-sm">Sistema de Gestión de Calidad</p>
        </div>
        <button 
          onClick={handleSeed} 
          className="bg-gray-800 text-white px-3 py-1 text-[10px] font-bold uppercase rounded hover:bg-black opacity-50 hover:opacity-100 transition-opacity"
        >
          ⚙️ Recargar Excel
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        {editingId ? (
          <div className="animate-fade-in-up">
            <ImpactAnalysis 
              docId={editingId} 
              onCancel={() => setEditingId(null)} 
              onConfirm={() => { setEditingId(null); }} 
            />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 3. BARRA DE BÚSQUEDA UI */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar documento por código (PG-001) o título..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* TABLA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Código</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Título</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Rev</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {/* Usamos filteredDocs en lugar de docs */}
                    {filteredDocs.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          No se encontraron documentos que coincidan con "{searchTerm}"
                        </td>
                      </tr>
                    )}

                    {filteredDocs.map(doc => (
                      <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-600">{doc.ID_DOC}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{doc.TITULO}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{doc.VERSION}</td>
                        <td className="px-6 py-4 text-xs text-gray-400 uppercase">{doc.TIPO}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setEditingId(doc.ID_DOC)}
                            className="text-indigo-600 font-bold hover:text-indigo-800 text-sm hover:underline"
                          >
                            Analizar Impacto
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="text-right text-xs text-gray-400">
              Mostrando {filteredDocs.length} de {docs.length} documentos
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
