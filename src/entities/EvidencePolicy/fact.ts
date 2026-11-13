export type FactType = 'generic' | 'fee' | 'appointment' | 'attendance' | 'representation';

export interface FactEntry {
  includeIf?: string;
  query: string;
}

/** A value derived for an outcome: what is to pay, who must attend, who may act for the applicant. Facts describe; rules judge. */
export interface Fact {
  /** Unique within the policy, except that outcomes of one step type may share a name. */
  name: string;
  type?: FactType;
  includeIf?: string;
  /** An expression, or a projection whose values are expressions. Never a literal value. */
  query?: string | Record<string, string>;
  /** For list-valued facts (fee, attendance, representation): the included entries make up the value. */
  entries?: FactEntry[];
}
