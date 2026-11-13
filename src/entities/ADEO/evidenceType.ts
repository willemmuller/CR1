import type { JsonObject } from '../../util/json';
import type { VersionedRecord } from '../versionedRecord';

/**
 * How many distinct evidences a type has.
 *   EVIDENCE_DELEGATION — one per delegation row that issues it (a licence, a certificate)
 *   ORG                 — one per org, whatever the mandate (a login to the org's portal)
 *   TYPE                — one for the type as a whole; it has no issuer (a document the holder writes)
 */
export type InstanceScope = 'EVIDENCE_DELEGATION' | 'ORG' | 'TYPE';

/**
 * A kind of document, independent of who issues it or where: a passport, a
 * licence to practise, a payment receipt, an appointment confirmation. An
 * Evidence is a concrete document of one or more evidence types.
 */
export interface EvidenceType extends VersionedRecord {
  fullName: string;
  description: string;
  /**
   * True for a document people set out to obtain and go on to use elsewhere.
   * False for one that only exists along the way to another: a receipt, a
   * booking confirmation, an acknowledgement.
   */
  isTerminal: boolean;
  instanceScope: InstanceScope;
  /** True when the holder writes the document rather than an org issuing it: a completed form, a declaration. */
  isHolderAuthored: boolean;
  /** True when the document only exists attached to another: a certified copy, a translation. */
  isAnnex: boolean;
  /** The attributes an evidence of this type can carry, by name. */
  attributes: JsonObject;
}
