import type { EvidenceQuery } from './evidenceQuery';

export interface EvidenceResolver {
  /** The requirement as the issuing org would phrase it. */
  description?: string;
  /** Alternatives the user chooses between. Replaced whole on merge. */
  queries?: EvidenceQuery[];
}

/** A document a policy uses, with how to find it. Bound once per task and read by name from every step. */
export interface ResolvedEvidence {
  /** Unique within the policy; shares one namespace with channels, facts and details. */
  name: string;
  evidenceResolver?: EvidenceResolver;
}
