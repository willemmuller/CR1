/**
 * How a document moves at a step.
 * As an input: present (shown, the holder keeps it) or handover (it leaves the holder).
 * As an output: issued (a new document) or returned (a handed-over document given back).
 */
export type EvidenceDirection = 'present' | 'handover' | 'issued' | 'returned';

/** One use of a resolved evidence by an outcome. */
export interface EvidenceUse {
  /** The resolved evidence this entry uses. */
  name: string;
  includeIf?: string;
  direction?: EvidenceDirection;
  /** Shown, but does not block. */
  optional?: boolean;
}
