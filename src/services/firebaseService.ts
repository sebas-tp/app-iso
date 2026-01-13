import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, getDocs, query, where, doc, getDoc 
} from 'firebase/firestore';
import { QMSDocument, Dependency } from '../types';

// --- PEGA AQUI TUS CLAVES DE FIREBASE ---
// Si no las pones, la app se quedará cargando infinitamente.
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
