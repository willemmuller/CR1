/** A value the applicant types in when choosing an outcome: a reference number, what was missing. */
export interface Detail {
  /** Unique within the policy; shares one namespace with evidences, channels and facts. */
  name: string;
  includeIf?: string;
  title?: string;
  description?: string;
  /** The type the entered value is validated against. */
  schema?: string;
  /** Shown, but does not block. */
  optional?: boolean;
}
