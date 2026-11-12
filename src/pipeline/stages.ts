import type { Policy, PolicyTemplate } from '../entities';

/** A finding about a policy. An error stops the publish; a warning is only logged. */
export interface Diagnostic {
  level: 'error' | 'warning';
  /** Stable identifier of the rule that produced the finding. */
  code: string;
  message: string;
  /** JSON pointer to the place in the policy the finding is about. */
  pointer?: string;
}

/** Checks the structure of a policy: required fields, allowed values, unique keys, references that resolve. */
export interface PolicyValidator {
  validate(policy: Policy): Diagnostic[];
}

/** Checks the expressions inside a policy: that they parse, and that they keep to the rules of the language. */
export interface ExpressionChecker {
  check(policy: Policy): Diagnostic[];
}

/**
 * Reduces one row's observed policy to its fragment: what that row states that
 * the merge of the rows below it does not already state.
 */
export interface PolicyFragmenter {
  fragment(observed: Policy, lower: Policy): Policy;
}

/** Lays a fragment over the merge of the rows below it. The fragment takes precedence; nothing below is removed. */
export interface PolicyMerger {
  merge(lower: Policy, fragment: Policy): Policy;
}

/** Fills in the standard parts of a merged policy from templates. Expanding an expanded policy changes nothing. */
export interface PolicyExpander {
  expand(merged: Policy, templates: PolicyTemplate[]): Policy;
}

/** The stages a publish runs, in the order it runs them. */
export interface PolicyPipeline {
  validator: PolicyValidator;
  expressionChecker: ExpressionChecker;
  fragmenter: PolicyFragmenter;
  merger: PolicyMerger;
  expander: PolicyExpander;
}
