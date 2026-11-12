import { describe, expect, it } from 'vitest';
import { NotImplementedError, createPipeline } from '../src';

describe('createPipeline', () => {
  it('names the stage that is still to be built', () => {
    const pipeline = createPipeline();

    expect(() => pipeline.validator.validate({})).toThrowError(new NotImplementedError('validator'));
    expect(() => pipeline.expressionChecker.check({})).toThrowError(new NotImplementedError('expressionChecker'));
    expect(() => pipeline.fragmenter.fragment({}, {})).toThrowError(new NotImplementedError('fragmenter'));
    expect(() => pipeline.merger.merge({}, {})).toThrowError(new NotImplementedError('merger'));
    expect(() => pipeline.expander.expand({}, [])).toThrowError(new NotImplementedError('expander'));
  });
});
