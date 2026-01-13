import React, { useState, useEffect } from 'react';
import ImpactAnalysis from './components/ImpactAnalysis';
import { getAllDocuments } from './services/firebaseService';
import { QMSDocument } from './types';

const App: React.FC = () => {
  const [docs, setDocs] = useState<QMSDocument[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Carga inicial de documentos
  const refreshDocs = async () => {
    setLoading(true);
    const data = await getAllDocuments();
    setDocs(data);
    setLoading(false);
  };

  useEffect(() => { refreshDocs(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SGC - Trazabilidad</h1>
          <p className="text-gray-500">Gestión de Cambios ISO 9001</p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
            Estado: {loading ? "Conectando..." : "Online"}
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        {editingId ? (
          <ImpactAnalysis 
            docId={editingId} 
            onCancel={() => setEditingId(null)} 
            onConfirm={() => { alert("Cambio autorizado"); setEditingId(null); }} 
          />
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="p-4 font-bold text-gray-600">Código</th>
                  <th className="p-4 font-bold text-gray-600">Título</th>
                  <th className="p-4 font-bold text-gray-600">Versión</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.length === 0 && !loading && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">
                            La base de datos está vacía. <br/>
                            <span className="text-sm">Esto es normal si aún no subiste el Excel.</span>
                        </td>
                    </tr>
                )}
                {docs.map(doc => (
                  <tr key={doc.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-indigo-600 font-bold">{doc.ID_DOC}</td>
                    <td className="p-4">{doc.TITULO}</td>
                    <td className="p-4 text-gray-500">v{doc.VERSION}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setEditingId(doc.ID_DOC)} 
                              className="text-indigo-600 hover:underline font-medium">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;