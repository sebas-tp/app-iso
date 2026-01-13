import React, { useState, useEffect } from 'react';
import ImpactAnalysis from './components/ImpactAnalysis';
import { getAllDocuments, uploadInitialData } from './services/firebaseService';
import { QMSDocument } from './types';

// IMPORTAMOS TUS DATOS JSON (Los que subiste a la carpeta data)
import docsData from './data/docs.json';
import linksData from './data/links.json';

const App: React.FC = () => {
  const [docs, setDocs] = useState<QMSDocument[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para recargar la lista de documentos desde Firebase
  const refreshDocs = async () => {
    setLoading(true);
    const data = await getAllDocuments();
    // Ordenamos alfabéticamente por código
    data.sort((a, b) => a.ID_DOC.localeCompare(b.ID_DOC));
    setDocs(data);
    setLoading(false);
  };

  // Carga inicial al abrir la app
  useEffect(() => { refreshDocs(); }, []);

  // --- BOTÓN MÁGICO: INYECTAR DATOS ---
  const handleSeed = async () => {
    const confirmar = window.confirm(
      `⚠️ ¿Estás seguro?\n\nSe van a subir:\n- ${docsData.length} Documentos\n- ${linksData.length} Vínculos\n\nA la base de datos de Firebase.`
    );
    
    if (!confirmar) return;

    setLoading(true);
    try {
      // Llamamos a la función del servicio que creamos antes
      await uploadInitialData(docsData, linksData);
      alert("✅ ¡Éxito! Base de datos actualizada correctamente.");
      refreshDocs(); // Recargamos para ver los cambios
    } catch (e) {
      console.error(e);
      alert("❌ Ocurrió un error (Revisa la consola con F12)");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Encabezado */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 max-w-5xl mx-auto gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SGC - ISO 9001</h1>
          <p className="text-gray-500 text-sm">Sistema de Trazabilidad y Gestión de Cambios</p>
        </div>
        
        {/* Botón de Carga de Datos */}
        <button 
          onClick={handleSeed} 
          disabled={loading}
          className="bg-gray-900 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:bg-black hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Procesando..." : "⚙️ Inyectar Excel a Nube"}
        </button>
      </header>

      <main className="max-w-5xl mx-auto">
        {editingId ? (
          // VISTA DE ANÁLISIS DE IMPACTO
          <div className="animate-fade-in-up">
            <ImpactAnalysis 
              docId={editingId} 
              onCancel={() => setEditingId(null)} 
              onConfirm={() => { 
                alert("✅ Revisión de impacto confirmada. Procediendo a crear nueva versión."); 
                setEditingId(null); 
              }} 
            />
          </div>
        ) : (
          // VISTA DE TABLA MAESTRA
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Título</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Versión</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* Mensaje si está vacío */}
                  {docs.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-400">
                        <div className="mb-2 text-4xl">📂</div>
                        <p>La base de datos está vacía.</p>
                        <p className="text-sm mt-2 text-indigo-500">Haz clic en el botón negro de arriba para cargar tus datos.</p>
                      </td>
                    </tr>
                  )}

                  {/* Filas de documentos */}
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-600">{doc.ID_DOC}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{doc.TITULO}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">v{doc.VERSION}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                          doc.ESTADO === 'VIGENTE' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {doc.ESTADO || 'VIGENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setEditingId(doc.ID_DOC)}
                          className="text-indigo-600 font-bold hover:text-indigo-800 text-sm hover:underline transition-all"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="max-w-5xl mx-auto mt-12 text-center text-gray-400 text-xs">
         <p>{docs.length} documentos indexados • Sistema Online</p>
      </footer>
    </div>
  );
};

export default App;
