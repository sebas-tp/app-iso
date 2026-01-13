import React, { useState, useEffect } from 'react';
import { getImpactedDocuments, getDocumentById } from '../services/firebaseService';
import { QMSDocument } from '../types';

interface Props { docId: string; onCancel: () => void; onConfirm: () => void; }

const ImpactAnalysis: React.FC<Props> = ({ docId, onCancel, onConfirm }) => {
  const [loading, setLoading] = useState(true);
  const [sourceDoc, setSourceDoc] = useState<QMSDocument | null>(null);
  const [list, setList] = useState<any[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const d = await getDocumentById(docId);
      const l = await getImpactedDocuments(docId);
      setSourceDoc(d || null);
      setList(l);
      setLoading(false);
    };
    load();
  }, [docId]);

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));
  const allChecked = list.length > 0 ? list.every(i => checked[i.doc.ID_DOC]) : true;

  if (loading) return <div className="p-10 text-center">Calculando impacto...</div>;

  return (
    <div className="bg-white rounded shadow-lg border p-6 max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4 text-amber-700">
        ⚠️ Análisis de Impacto: {sourceDoc?.ID_DOC}
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Estás editando <strong>{sourceDoc?.TITULO}</strong>. Debes revisar estos documentos vinculados:
      </p>

      {list.length === 0 ? <p className="text-gray-400 italic">No hay dependencias detectadas.</p> : (
        <ul className="border rounded divide-y mb-6">
          {list.map(({ doc, dep }) => (
            <li key={doc.ID_DOC} className="p-3 flex items-start hover:bg-gray-50">
              <input type="checkbox" className="mt-1 mr-3" 
                     checked={!!checked[doc.ID_DOC]} onChange={() => toggle(doc.ID_DOC)} />
              <div>
                <div className="font-bold flex items-center gap-2">
                  {doc.ID_DOC} 
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 rounded">{dep.MOTIVO}</span>
                </div>
                <div className="text-sm">{doc.TITULO} (v{doc.VERSION})</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">Cancelar</button>
        <button onClick={onConfirm} disabled={!allChecked} 
                className={`px-4 py-2 rounded text-white font-bold ${allChecked ? 'bg-indigo-600' : 'bg-gray-300'}`}>
          Confirmar y Editar
        </button>
      </div>
    </div>
  );
};
export default ImpactAnalysis;