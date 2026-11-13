import type { Outcome } from './outcome';

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

export interface Instruction {
  title?: string;
  text?: string;
}

/** A step's reference to one of the policy's channels. */
export interface StepChannel {
  name: string;
  includeIf?: string;
}

/** The definition of one step of a policy. At runtime each task has a step per included step type. */
export interface StepType {
  /** Unique within the policy, nested steps included. */
  stepId: string;
  instruction?: Instruction;
  /** The templates this step draws on at expansion. */
  templates?: StepTemplate[];
  /** Things the applicant physically does during the step. */
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
