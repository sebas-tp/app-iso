
export enum DocumentStatus {
  ACTIVE = 'Activo',
  IN_REVIEW = 'En Revisión',
  OBSOLETE = 'Obsoleto',
  DRAFT = 'Borrador'
}

export interface QMSDocument {
  id: string;
  code: string;
  name: string;
  version: string;
  status: DocumentStatus;
}

export enum RelationshipType {
  GENERATES_RECORD = 'Genera Registro',
  MENTIONS = 'Menciona a',
  REFERENCES = 'Referencia Técnica',
  DEPENDS_ON = 'Dependencia de Proceso'
}

export enum ImpactLevel {
  HIGH = 'Alto',
  MEDIUM = 'Medio',
  LOW = 'Bajo'
}

export interface Dependency {
  id: string;
  source_id: string; // The document being edited
  target_id: string; // The document affected
  relationship_type: RelationshipType;
  impact_level: ImpactLevel;
}

export interface ImpactedDocument extends QMSDocument {
  impactDetail: Dependency;
}
