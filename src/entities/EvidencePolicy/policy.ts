import type { Channel } from './channel';
import type { ResolvedEvidence } from './resolvedEvidence';
import type { StepType } from './stepType';

export type Sequence = 'firstIssue' | 'reIssue';

/**
 * How a person obtains one evidence from one issuing org, as a list of step
 * types with outcomes.
 *
 * The same structure is used at every stage. An observed policy is what one
 * org publishes about the process; a fragment is the part of it that the rows
 * below in the delegation stack do not already state; a compiled policy is the
 * fragments merged and expanded. Because fragments are partial, every field
 * other than a key is optional, here and in the types a policy is made of.
 *
 * Expressions (includeIf, enableIf, defaultIf, query) are JSONata source text.
 */
export interface Policy {
  sequence?: Sequence;
  /** Every document the policy uses, declared once. Key: name. */
  resolvedEvidences?: ResolvedEvidence[];
  /** Every channel to the issuing org the policy uses, declared once. Key: name. */
  channels?: Channel[];
  /** Top-level step types in display order. Key: stepId. */
  steps?: StepType[];
}
