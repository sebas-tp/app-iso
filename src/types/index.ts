export interface QMSDocument {
  id: string;        
  ID_DOC: string;    // Tu columna Código
  TITULO: string;    // Tu columna Nombre
  VERSION: string;   
  TIPO: string;      
  ESTADO?: string;   
}

export interface Dependency {
  id?: string;
  ID_PADRE: string;  
  ID_HIJO: string;   
  MOTIVO: string;    
}