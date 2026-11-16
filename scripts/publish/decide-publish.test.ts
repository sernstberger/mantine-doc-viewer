import { decidePublish, planRun } from './decide-publish';

describe('decidePublish', () => {
  it('skips when the package is not on the registry', () => {
    expect(decidePublish('0.1.0', null)).toBe('skip-not-on-registry');
  });

  it('skips when the exact version is already published', () => {
    expect(decidePublish('0.2.0', ['0.1.0', '0.2.0'])).toBe('skip-already-published');
  });

  it('publishes when the version is new', () => {
    expect(decidePublish('0.2.0', ['0.1.0'])).toBe('publish');
  });
});

describe('planRun', () => {
  it('publishes and finishes a new version on push and on a manual run', () => {
    const plan = { publish: true, finish: true, docs: true };
    expect(planRun('publish', 'push', '0.2.0')).toEqual(plan);
    expect(planRun('publish', 'workflow_dispatch', '0.2.0')).toEqual(plan);
  });

  it('finishes a version already on npm only on a manual run', () => {
    expect(planRun('skip-already-published', 'workflow_dispatch', '0.1.0')).toEqual({
      publish: false,
      finish: true,
      docs: true,
    });
    expect(planRun('skip-already-published', 'push', '0.1.0')).toEqual({
      publish: false,
      finish: false,
      docs: false,
    });
  });

  it('does nothing before the first publish', () => {
    const plan = { publish: false, finish: false, docs: false };
    expect(planRun('skip-not-on-registry', 'push', '0.1.0')).toEqual(plan);
    expect(planRun('skip-not-on-registry', 'workflow_dispatch', '0.1.0')).toEqual(plan);
  });

  it('leaves the docs alone for a prerelease', () => {
    expect(planRun('publish', 'push', '0.2.0-alpha.0')).toEqual({
      publish: true,
      finish: true,
      docs: false,
    });
  });
});
