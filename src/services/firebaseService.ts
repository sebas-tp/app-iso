import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs, query, where, doc, getDoc 
} from 'firebase/firestore';
import { QMSDocument, Dependency } from '../types';

// --- PEGA AQUI TUS CLAVES DE FIREBASE ---
// Si no las pones, la app se quedará cargando infinitamente.
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Leer documentos
export const getAllDocuments = async (): Promise<QMSDocument[]> => {
  try {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QMSDocument));
  } catch (e) {
      console.error("Error conectando a Firebase:", e);
      return [];
  }
};

export const getDocumentById = async (id: string): Promise<QMSDocument | undefined> => {
  try {
      // Intenta buscar por ID del documento
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
        // Busca el hijo
        const docRef = doc(db, 'documents', dep.ID_HIJO);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { doc: { id: docSnap.id, ...docSnap.data() } as QMSDocument, dep } : null;
      }));
      return results.filter(r => r !== null);
  } catch (e) { return []; }
};