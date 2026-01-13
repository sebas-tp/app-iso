import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  writeBatch, // <--- NECESARIO PARA CARGA MASIVA
  addDoc      // <--- NECESARIO PARA VÍNCULOS
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

// --- FUNCIONES DE LECTURA ---

// 1. Obtener todos los documentos
export const getAllDocuments = async (): Promise<QMSDocument[]> => {
  try {
      const snapshot = await getDocs(collection(db, 'documents'));
      return snapshot.docs.map(doc => {
        const data = doc.data();
        // Mapeamos los datos para asegurar que coincidan con la interfaz
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

// 2. Buscar documento por ID
export const getDocumentById = async (id: string): Promise<QMSDocument | undefined> => {
  try {
      const docRef = doc(db, 'documents', id);
      const snap = await getDoc(docRef);
      if(snap.exists()) {
          const data = snap.data();
          return { id: snap.id, ...data } as QMSDocument;
      }
      return undefined;
  } catch (e) { return undefined; }
};

// 3. Buscar documentos impactados (Hijos)
export const getImpactedDocuments = async (sourceId: string) => {
  try {
      // Busca en dependencias donde el PADRE sea el documento actual
      const q = query(collection(db, 'dependencies'), where("ID_PADRE", "==", sourceId));
      const snap = await getDocs(q);
      
      const results = await Promise.all(snap.docs.map(async (d) => {
        const dep = d.data() as Dependency;
        // Busca los detalles del documento HIJO
        const docRef = doc(db, 'documents', dep.ID_HIJO);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const docData = docSnap.data();
            return { 
                doc: { id: docSnap.id, ...docData } as QMSDocument, 
                dep 
            };
        }
        return null;
      }));
      return results.filter(r => r !== null);
  } catch (e) { return []; }
};

// --- FUNCIÓN NUEVA: CARGA DE DATOS (SEEDING) ---
export const uploadInitialData = async (docs: any[], links: any[]) => {
  const batch = writeBatch(db);
  
  console.log(`🚀 Iniciando carga: ${docs.length} documentos y ${links.length} vínculos.`);

  // 1. Cargar Documentos
  docs.forEach((d) => {
    if (!d.ID_DOC) return;
    
    // Usamos el código (ej: PG-001) como ID del documento en Firebase
    const docRef = doc(db, "documents", String(d.ID_DOC)); 
    
    const dataToUpload = {
        ID_DOC: d.ID_DOC,
        TITULO: d.TITULO || "Sin Título",
        TIPO: d.TIPO || "General",
        VERSION: d.VERSION ? String(d.VERSION) : "01",
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
