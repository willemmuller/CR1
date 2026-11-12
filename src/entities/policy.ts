/**
 * The policy language: how a person obtains one evidence from one issuing org,
 * as a list of step types with outcomes.
 *
 * The same structure is used at every stage. An observed policy is what one
 * org publishes about the process; a fragment is the part of it that the rows
 * below in the delegation stack do not already state; a compiled policy is the
 * fragments merged and expanded. Because fragments are partial, every field
 * other than a key is optional.
 *
 * Expressions (includeIf, enableIf, defaultIf, query) are JSONata source text.
 */

export type Sequence = 'firstIssue' | 'reIssue';

export interface Policy {
  sequence?: Sequence;
  /** Every document the policy uses, declared once. Key: name. */
  resolvedEvidences?: ResolvedEvidence[];
  /** Every channel to the issuing org the policy uses, declared once. Key: name. */
  channels?: Channel[];
  /** Top-level step types in display order. Key: stepId. */
  steps?: StepType[];
}

export type StepTemplate =
  | 'documentReadiness'
  | 'makeAppointment'
  | 'attendAppointment'
  | 'submitRequest'
  | 'attendCollection'
  | 'receiveResponse'
  | 'homeCourierPickup'
  | 'homeCourierDelivery';

export type Activity =
  | 'takeTest'
  | 'takeExam'
  | 'takePhoto'
  | 'xray'
  | 'takeBiometrics'
  | 'interview'
  | 'attestation'
  | 'signing';

export interface StepType {
  /** Unique within the policy, nested steps included. */
  stepId: string;
  instruction?: Instruction;
  templates?: StepTemplate[];
  activities?: Activity[];
  /** Which of the policy's channels this step can use, in order of preference. Key: name. */
  channels?: StepChannel[];
  /** Does this step exist for this applicant? */
  includeIf?: string;
  /** Can this step be done yet? */
  enableIf?: string;
  /** Key: outcomeId. */
  outcomes?: Outcome[];
  /** Nested sub-steps, same shape. Key: stepId. */
  steps?: StepType[];
}

export interface Instruction {
  title?: string;
  text?: string;
}

export interface StepChannel {
  name: string;
  includeIf?: string;
}

export type StepState = 'IN_PROGRESS' | 'WAITING' | 'SUCCEEDED' | 'FAILED';

export type TaskState = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Outcome {
  /** Unique within the step type. */
  outcomeId: string;
  stepState?: StepState;
  taskState?: TaskState;
  /** 'true' marks the default outcome; any other expression is raised by the system when it becomes true. */
  defaultIf?: string;
  title?: string;
  description?: string;
  includeIf?: string;
  enableIf?: string;
  /** Key: name. */
  inputEvidences?: EvidenceUse[];
  /** Key: name. */
  inputDetails?: Detail[];
  /** Key: ruleId. */
  inputRules?: Rule[];
  /** Key: name. */
  facts?: Fact[];
  /** Key: name. */
  outputEvidences?: EvidenceUse[];
  /** Key: ruleId. */
  outputRules?: Rule[];
}

export interface ResolvedEvidence {
  /** Unique within the policy; shares one namespace with channels, facts and details. */
  name: string;
  evidenceResolver?: EvidenceResolver;
}

export interface EvidenceResolver {
  description?: string;
  /** Alternatives the user chooses between. Replaced whole on merge. */
  queries?: EvidenceQuery[];
}

/** Values within an array are OR'd; fields are AND'd. A value is a literal or an expression. */
export interface EvidenceQuery {
  evidenceTypes: string[];
  jurisdictions?: string[];
  evidences?: string[];
  authorityTypes?: string[];
  authorityAttributes?: Record<string, string>;
  evidenceAttributes?: Record<string, string>;
  orgs?: string[];
}

export type ChannelType =
  | 'phone'
  | 'email'
  | 'post'
  | 'digital'
  | 'inPerson'
  | 'videoCall'
  | 'messaging'
  | 'kiosk';

export interface Channel {
  name: string;
  channelType?: ChannelType;
  purpose?: string;
  /** Is this channel open to this applicant? */
  includeIf?: string;
}

export type EvidenceDirection = 'present' | 'handover' | 'issued' | 'returned';

export interface EvidenceUse {
  /** The resolved evidence this entry uses. */
  name: string;
  includeIf?: string;
  direction?: EvidenceDirection;
  optional?: boolean;
}

export interface Detail {
  name: string;
  includeIf?: string;
  title?: string;
  description?: string;
  schema?: string;
  optional?: boolean;
}

export interface Rule {
  /** Unique within the policy. */
  ruleId: string;
  includeIf?: string;
  description?: string;
  group?: string;
  /** Pass/fail test over bound evidence, facts and the applicant. */
  query?: string;
}

export type FactType = 'generic' | 'fee' | 'appointment' | 'attendance' | 'representation';

export interface Fact {
  name: string;
  type?: FactType;
  includeIf?: string;
  /** An expression, or a projection whose values are expressions. */
  query?: string | Record<string, string>;
  /** For list-valued facts (fee, attendance, representation). */
  entries?: FactEntry[];
}

export interface FactEntry {
  includeIf?: string;
  query: string;
}
