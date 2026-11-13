/** A pass/fail test shown to the applicant as a tick or a cross. Rules judge evidence, never its presence. */
export interface Rule {
  /** Unique within the policy. */
  ruleId: string;
  includeIf?: string;
  /** A 'Must ...' sentence. */
  description?: string;
  /** Display heading to group rules under. */
  group?: string;
  /** Test over bound evidence, facts and the applicant. A true or non-empty result passes. */
  query?: string;
}
