import type { JsonObject } from '../../util/json';
import type { VersionedRecord } from '../versionedRecord';

/** A document that can be issued. */
export interface Evidence extends VersionedRecord {
  name: string;
  /** The kinds of document this is. Each is the stableId of an EvidenceType. */
  evidenceTypes: string[];
  /** The document's fields. Orgs vary the process, not the document, so this passes into the compiled policy unchanged. */
  schemaFragment: JsonObject;
}
