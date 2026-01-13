import React, { useState, useEffect } from 'react';
import { getImpactedDocuments, getDocumentById } from '../services/firebaseService';
import { QMSDocument } from '../types';

interface Props { 
  docId: string; 
  onCancel: () => void; 
  onConfirm: () => void; 
}

const ImpactAnalysis: React.FC<Props> = ({ docId, onCancel, onConfirm }) => {
  const [loading, setLoading] = useState(true);
  const [sourceDoc, setSourceDoc] = useState<QMSDocument | null>(null);
  
  // Lista mixta que puede contener { doc, dep, relation: 'HIJO' | 'PADRE' }
  const [list, setList] = useState<any[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const d = await getDocumentById(docId);
      const l = await getImpactedDocuments(docId);
      setSourceDoc(d || null);
      setList(l);
      
      // Opcional: Pre-marcar los que no requieren revisión obligatoria si quisieras
      setLoading(false);
    };
    load();
  }, [docId]);

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }));
  
  // LÓGICA CLAVE: Solo obligamos a marcar check si es un HIJO (Impacto real)
  // Los PADRES son informativos (Contexto), no bloquean el botón.
  const allChecked = list
    .filter(item => item.relation === 'HIJO')
    .every(item => checked[item.doc.ID_DOC]);

  if (loading) return (
    <div className="p-12 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 animate-pulse">Calculando trazabilidad completa...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-4xl mx-auto mt-6 overflow-hidden animate-fade-in-up">
      
      {/* Encabezado Oscuro Profesional */}
      <div className="bg-gray-900 p-6 text-white flex justify-between items-start">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-600 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Analizando</span>
                <h2 className="text-2xl font-bold">{sourceDoc?.ID_DOC}</h2>
            </div>
            <p className="text-gray-400 text-lg">{sourceDoc?.TITULO}</p>
        </div>
        <div className="text-right hidden sm:block">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Versión Actual</span>
            <p className="text-xl font-mono font-bold text-indigo-400">v{sourceDoc?.VERSION}</p>
        </div>
      </div>

      <div className="p-6 bg-gray-50 min-h-[300px]">
        {list.length === 0 ? (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <p className="font-medium text-gray-600">Documento Aislado</p>
            <p className="text-sm mt-1">No se detectaron vínculos hacia arriba ni hacia abajo.</p>
          </div>
        ) : (
          <div className="space-y-4">
             <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-4">Mapa de Relaciones Detectadas</p>
            
            {list.map(({ doc, dep, relation }) => {
              const isChild = relation === 'HIJO'; // TRUE si es impacto hacia abajo
              
              return (
                <li key={doc.ID_DOC} 
                    className={`list-none p-4 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-start gap-4 bg-white ${
                        isChild 
                        ? 'border-l-8 border-l-amber-500 border-t-gray-100 border-r-gray-100 border-b-gray-100' // Estilo Hijo
                        : 'border-l-8 border-l-blue-500 border-t-gray-100 border-r-gray-100 border-b-gray-100'   // Estilo Padre
                    }`}>
                  
                  {/* Checkbox (Solo visible para HIJOS) */}
                  <div className="pt-1">
                    {isChild ? (
                        <input 
                            type="checkbox" 
                            className="h-6 w-6 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                            checked={!!checked[doc.ID_DOC]} 
                            onChange={() => toggle(doc.ID_DOC)} 
                            title="Marcar como revisado"
                        />
                    ) : (
                        <div className="h-6 w-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                          {/* BADGE DE TIPO DE RELACIÓN */}
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2 inline-block ${
                              isChild ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                              {isChild ? '⚠️ IMPACTO DESCENDENTE' : 'ℹ️ ORIGEN (PADRE)'}
                          </span>
                          
                          <div className="flex items-baseline gap-2">
                             <h4 className="font-bold text-gray-900 text-lg">{doc.ID_DOC}</h4>
                             <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1 rounded">v{doc.VERSION}</span>
                          </div>
                          <p className="text-gray-600 text-sm font-medium">{doc.TITULO}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      <span>Motivo del vínculo: <strong className="text-gray-600">{dep.MOTIVO}</strong></span>
                    </div>
                  </div>
                </li>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer de Acciones */}
      <div className="bg-white px-6 py-5 flex justify-between items-center border-t border-gray-200">
        <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-800 font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        
        <button onClick={onConfirm} disabled={!allChecked} 
                className={`flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg text-white font-bold transition-all transform ${
                    allChecked 
                    ? 'bg-gray-900 hover:bg-black hover:-translate-y-1 hover:shadow-xl' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}>
          {allChecked ? (
            <>
                <span>Confirmar Revisión</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </>
          ) : (
            <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Revisión Pendiente</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default ImpactAnalysis;
