import { describe, expect, it } from 'vitest';
import { canonicalJson, cloneJson, jsonEquals } from '../src';

describe('canonicalJson', () => {
  it('ignores object key order at every depth', () => {
    const left = { b: 1, a: { d: [1, { y: 1, x: 2 }], c: null } };
    const right = { a: { c: null, d: [1, { x: 2, y: 1 }] }, b: 1 };
    expect(canonicalJson(left)).toBe(canonicalJson(right));
  });

  it('keeps array order', () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it('treats an undefined property as absent', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });
});

describe('jsonEquals', () => {
  it('tells null from absent', () => {
    expect(jsonEquals({ a: null }, {})).toBe(false);
  });

  it('tells a number from its text', () => {
    expect(jsonEquals({ a: 1 }, { a: '1' })).toBe(false);
  });
});

describe('cloneJson', () => {
  it('returns a copy that shares nothing with the original', () => {
    const original = { steps: [{ stepId: 'a' }] };
    const copy = cloneJson(original);
    copy.steps[0]!.stepId = 'changed';
    expect(original.steps[0]!.stepId).toBe('a');
  });
});
