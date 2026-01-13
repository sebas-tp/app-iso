import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs, query, where, doc, getDoc, writeBatch, addDoc 
} from 'firebase/firestore';
import { QMSDocument, Dependency } from '../types';

// TUS CLAVES REALES
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

// --- LECTURA ---
export const getAllDocuments = async (): Promise<QMSDocument[]> => {
  try {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ID_DOC: data.ID_DOC, // Aquí leerá lo que guardamos
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

export const getDocumentById = async (id: string): Promise<QMSDocument | undefined> => {
  try {
      const docRef = doc(db, 'documents', id);
      const snap = await getDoc(docRef);
      if(snap.exists()) return { id: snap.id, ...snap.data() } as QMSDocument;
      return undefined;
  } catch (e) { return undefined; }
};

export const getImpactedDocuments = async (sourceId: string) => {
  try {
      const q = query(collection(db, 'dependencies'), where("ID_PADRE", "==", sourceId));
      const snap = await getDocs(q);
      
      const results = await Promise.all(snap.docs.map(async (d) => {
        const dep = d.data() as Dependency;
        const docRef = doc(db, 'documents', dep.ID_HIJO);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { doc: { id: docSnap.id, ...docSnap.data() } as QMSDocument, dep } : null;
      }));
      return results.filter(r => r !== null);
  } catch (e) { return []; }
};

// --- CARGA DE DATOS (SEEDING) ---
export const uploadInitialData = async (docs: any[], links: any[]) => {
  const batch = writeBatch(db);
  console.log(`🚀 Iniciando carga: ${docs.length} documentos.`);

  // 1. Cargar Documentos
  docs.forEach((d) => {
    // CORRECCIÓN CRÍTICA: Ahora leemos "ID_COD" que es como viene en tu JSON
    if (!d.ID_COD) return; 
    
    const docRef = doc(db, "documents", String(d.ID_COD)); 
    
    const dataToUpload = {
        ID_DOC: d.ID_COD, // Lo guardamos estandarizado como ID_DOC
        TITULO: d.TITULO || "Sin Título",
        TIPO: d.TIPO || "General",
        VERSION: d.VERSION !== undefined ? String(d.VERSION) : "01",
        ESTADO: d.ESTADO || "VIGENTE"
    };

    batch.set(docRef, dataToUpload);
  });

  await batch.commit();
  console.log("✅ Documentos subidos.");

  // 2. Cargar Vínculos
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
