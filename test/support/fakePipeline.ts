import type { Diagnostic, Policy, PolicyPipeline, PolicyTemplate, StepType } from '../../src';
import { cloneJson, jsonEquals } from '../../src';

export interface StageCall {
  stage: 'validate' | 'check' | 'fragment' | 'merge' | 'expand';
  /** The arguments the stage was given, copied at the time of the call. */
  args: unknown[];
}

export interface FakePipelineOptions {
  validate?: (policy: Policy) => Diagnostic[];
  check?: (policy: Policy) => Diagnostic[];
}

/**
 * Stand-in stages for testing the publish service. They are deliberately
 * crude: whole top-level steps are compared, replaced and appended by stepId,
 * and nothing else in a policy is looked at. They exist to make the service's
 * own behaviour observable, not to model what the real stages do.
 */
export class FakePipeline implements PolicyPipeline {
  readonly calls: StageCall[] = [];

  constructor(private readonly options: FakePipelineOptions = {}) {}

  readonly validator = {
    validate: (policy: Policy): Diagnostic[] => {
      this.record('validate', [policy]);
      return this.options.validate?.(policy) ?? [];
    },
  };

  readonly expressionChecker = {
    check: (policy: Policy): Diagnostic[] => {
      this.record('check', [policy]);
      return this.options.check?.(policy) ?? [];
    },
  };

  readonly fragmenter = {
    fragment: (observed: Policy, lower: Policy): Policy => {
      this.record('fragment', [observed, lower]);
      const below = lower.steps ?? [];
      const steps = (observed.steps ?? []).filter(
        (step) => !below.some((other) => other.stepId === step.stepId && jsonEquals(other, step)),
      );
      return { steps: cloneJson(steps) };
    },
  };

  readonly merger = {
    merge: (lower: Policy, fragment: Policy): Policy => {
      this.record('merge', [lower, fragment]);
      const steps: StepType[] = cloneJson(lower.steps ?? []);
      for (const step of fragment.steps ?? []) {
        const index = steps.findIndex((other) => other.stepId === step.stepId);
        if (index < 0) {
          steps.push(cloneJson(step));
        } else {
          steps[index] = cloneJson(step);
        }
      }
      return { steps };
    },
  };

  readonly expander = {
    expand: (merged: Policy, templates: PolicyTemplate[]): Policy => {
      this.record('expand', [merged, templates]);
      const steps: StepType[] = cloneJson(merged.steps ?? []);
      for (const template of templates) {
        const stepId = `expandedFrom:${template.name}`;
        if (!steps.some((step) => step.stepId === stepId)) {
          steps.push({ stepId });
        }
      }
      return { steps };
    },
  };

  stages(): string[] {
    return this.calls.map((call) => call.stage);
  }

  callsTo(stage: StageCall['stage']): StageCall[] {
    return this.calls.filter((call) => call.stage === stage);
  }

  private record(stage: StageCall['stage'], args: unknown[]): void {
    this.calls.push({ stage, args: cloneJson(args) });
  }
}
