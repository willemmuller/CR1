import type { PolicyPipeline } from './stages';

export class NotImplementedError extends Error {
  constructor(readonly stage: string) {
    super(`Pipeline stage '${stage}' is not implemented yet.`);
    this.name = 'NotImplementedError';
  }
}

/** The pipeline as it stands: every stage is still to be built. */
export function createPipeline(): PolicyPipeline {
  return {
    validator: {
      validate() {
        throw new NotImplementedError('validator');
      },
    },
    expressionChecker: {
      check() {
        throw new NotImplementedError('expressionChecker');
      },
    },
    fragmenter: {
      fragment() {
        throw new NotImplementedError('fragmenter');
      },
    },
    merger: {
      merge() {
        throw new NotImplementedError('merger');
      },
    },
    expander: {
      expand() {
        throw new NotImplementedError('expander');
      },
    },
  };
}
