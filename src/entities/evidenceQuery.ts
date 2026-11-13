/**
 * Selects evidences that can be issued. Values within an array are OR'd;
 * fields are AND'd. A value is a literal or an expression.
 */
export interface EvidenceQuery {
  evidenceTypes: string[];
  jurisdictions?: string[];
  evidences?: string[];
  authorityTypes?: string[];
  authorityAttributes?: Record<string, string>;
  evidenceAttributes?: Record<string, string>;
  orgs?: string[];
}
