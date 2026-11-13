import type { Detail } from './detail';
import type { EvidenceUse } from './evidenceUse';
import type { Fact } from './fact';
import type { Rule } from './rule';

export type StepState = 'IN_PROGRESS' | 'WAITING' | 'SUCCEEDED' | 'FAILED';

export type TaskState = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/** One thing that can happen at a step. Only an outcome whose stepState is SUCCEEDED is positive. */
export interface Outcome {
  /** Unique within the step type. */
  outcomeId: string;
  /** What recording this outcome does to the step. */
  stepState?: StepState;
  /** What recording this outcome does to the task. */
  taskState?: TaskState;
  /** 'true' marks the default outcome; any other expression is raised by the system when it becomes true. */
  defaultIf?: string;
  title?: string;
  description?: string;
  includeIf?: string;
  enableIf?: string;
  /** What the applicant brings. Key: name. */
  inputEvidences?: EvidenceUse[];
  /** Values the applicant supplies that are not documents. Key: name. */
  inputDetails?: Detail[];
  /** All must pass for the outcome to be available. Key: ruleId. */
  inputRules?: Rule[];
  /** Derived values: fees, attendance, representation. Key: name. */
  facts?: Fact[];
  /** What the applicant comes away with. Key: name. */
  outputEvidences?: EvidenceUse[];
  /** All must pass for a positive outcome to make the step succeed. Key: ruleId. */
  outputRules?: Rule[];
}
