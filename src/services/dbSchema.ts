
/**
 * FIRESTORE DATA STRUCTURE PROPOSAL
 * 
 * Collection: 'documents'
 * {
 *   id: string (auto-gen),
 *   code: "PR-CAL-01",
 *   name: "Procedimiento de Control de Calidad",
 *   version: "1.0",
 *   status: "ACTIVE"
 * }
 * 
 * Collection: 'dependencies'
 * {
 *   id: string (auto-gen),
 *   source_id: "doc_uuid_1",
 *   target_id: "doc_uuid_2",
 *   relationship_type: "GENERATES_RECORD",
 *   impact_level: "HIGH"
 * }
 * 
 * WHY A SEPARATE COLLECTION?
 * 1. Scalability: Documents can have dozens of links. Storing them in arrays inside 'documents' 
 *    leads to document size limits (1MB) and slower fetches when you only need metadata.
 * 2. Bi-directional Queries: A separate collection allows querying for:
 *    - Downstream impact: "What docs are affected if I change X?" (where source_id == X)
 *    - Upstream traceability: "Why does this form exist?" (where target_id == X)
 * 3. Atomic Updates: You can update relationship metadata without locking the main document.
 */
export const schemaNotes = "Firestore separate collection architecture for ISO 9001 Traceability.";
