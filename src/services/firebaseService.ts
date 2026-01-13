import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  writeBatch, 
  addDoc 
} from 'firebase/firestore';
import { QMSDocument, Dependency } from '../types';

// --- TUS CLAVES REALES DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDy9gII_my1BAuQqplnlzZJ9QTcr6ZP_Z0",
  authDomain: "app-iso-f1d23.firebaseapp.com",
  projectId: "app-iso-f1d23",
  storageBucket: "app-iso-f1d23.firebasestorage.app",
  messagingSenderId: "466988752550",
  appId: "1:466988752550:web:ddd2a6dcf148f54fe71e67",
  measurementId: "G-XS9R26PJMX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 1. LECTURA DE DOCUMENTOS (TABLA MAESTRA) ---
export const getAllDocuments = async (): Promise<QMSDocument[]> => {
  try {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ID_DOC: data.ID_DOC,
            TITULO: data.TITULO,
            VERSION: data.VERSION,
            TIPO: data.TIPO,
            ESTADO: data.ESTADO || 'VIGENTE'
        } as QMSDocument;
      });
  } catch (e) {
      console.error("Error conectando a Firebase:", e);
      return [];
  }
};

// --- 2. BUSCAR UN SOLO DOCUMENTO ---
export const getDocumentById = async (id: string): Promise<QMSDocument | undefined> => {
  try {
      const docRef = doc(db, 'documents', id);
      const snap = await getDoc(docRef);
      if(snap.exists()) return { id: snap.id, ...snap.data() } as QMSDocument;
      return undefined;
  } catch (e) { return undefined; }
};

// --- 3. TRAZABILIDAD BIDIRECCIONAL (CEREBRO NUEVO) ---
// Busca tanto hacía abajo (Hijos) como hacia arriba (Padres)
export const getImpactedDocuments = async (currentDocId: string) => {
  try {
      const dependenciesRef = collection(db, 'dependencies');
      
      // A. BÚSQUEDA AGUAS ABAJO (Downstream)
      // "¿Qué documentos dependen de mí?" (Yo soy el PADRE)
      const qDown = query(dependenciesRef, where("ID_PADRE", "==", currentDocId));
      const snapDown = await getDocs(qDown);
      
      // B. BÚSQUEDA AGUAS ARRIBA (Upstream)
      // "¿De quién dependo yo?" (Yo soy el HIJO)
      const qUp = query(dependenciesRef, where("ID_HIJO", "==", currentDocId));
      const snapUp = await getDocs(qUp);

      const results = [];

      // Procesar HIJOS (Documentos que yo impacto -> SALEN EN ROJO/AMBAR)
      for (const d of snapDown.docs) {
        const dep = d.data() as Dependency;
        // Buscamos los datos del HIJO
        const docRef = doc(db, 'documents', dep.ID_HIJO);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            results.push({
                doc: { id: docSnap.id, ...docSnap.data() } as QMSDocument,
                dep: dep,
                relation: 'HIJO' // Etiqueta para saber la dirección
            });
        }
      }

      // Procesar PADRES (Documentos que me mandan -> SALEN EN AZUL)
      for (const d of snapUp.docs) {
        const dep = d.data() as Dependency;
        // Buscamos los datos del PADRE
        const docRef = doc(db, 'documents', dep.ID_PADRE);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            results.push({
                doc: { id: docSnap.id, ...docSnap.data() } as QMSDocument,
                dep: dep,
                relation: 'PADRE' // Etiqueta para saber la dirección
            });
        }
      }

      return results;
  } catch (e) { 
      console.error(e); 
      return []; 
  }
};

// --- 4. CARGA DE DATOS (SEEDING) ---
export const uploadInitialData = async (docs: any[], links: any[]) => {
  const batch = writeBatch(db);
  console.log(`🚀 Iniciando carga: ${docs.length} documentos.`);

  // Cargar Documentos
  docs.forEach((d) => {
    // SOPORTE PARA TU JSON: Leemos "ID_COD" (tu excel) pero guardamos como "ID_DOC"
    if (!d.ID_COD) return; 
    
    const docRef = doc(db, "documents", String(d.ID_COD)); 
    
    const dataToUpload = {
        ID_DOC: d.ID_COD, // Estandarizamos el nombre
        TITULO: d.TITULO || "Sin Título",
        TIPO: d.TIPO || "General",
        VERSION: d.VERSION !== undefined ? String(d.VERSION) : "01",
        ESTADO: d.ESTADO || "VIGENTE"
    };

    batch.set(docRef, dataToUpload);
  });

  await batch.commit();
  console.log("✅ Documentos subidos.");

  // Cargar Vínculos
  const linkPromises = links.map(async (link) => {
    if (!link.ID_PADRE || !link.ID_HIJO) return;
    await addDoc(collection(db, "dependencies"), {
        ID_PADRE: link.ID_PADRE,
        ID_HIJO: link.ID_HIJO,
        MOTIVO: link.MOTIVO || "Referencia"
    });
  });

  await Promise.all(linkPromises);
  console.log("✅ Vínculos subidos.");
};
