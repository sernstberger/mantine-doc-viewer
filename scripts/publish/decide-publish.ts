export type PublishDecision = 'publish' | 'skip-already-published' | 'skip-not-on-registry';

export interface PublishPlan {
  /** The version is new on npm: test it, wait for the `release` approval and publish it */
  publish: boolean;

  /** Create the GitHub release once the version is on npm */
  finish: boolean;

  /** Deploy the docs once the version is on npm; prereleases leave the docs on the stable version */
  docs: boolean;
}

/** Compares the local version with the versions on npm (`null`: the package is not on npm) */
export function decidePublish(
  localVersion: string,
  publishedVersions: string[] | null
): PublishDecision {
  if (publishedVersions === null) {
    return 'skip-not-on-registry';
  }

  if (publishedVersions.includes(localVersion)) {
    return 'skip-already-published';
  }

  return 'publish';
}

/**
 * What a run of the publish workflow does. A push finishes only the version it publishes, so a
 * change to `package/package.json` that keeps the version deploys nothing. A manual run also
 * finishes a version that is already on npm, the one published by `npm run publish:bootstrap`.
 */
export function planRun(
  decision: PublishDecision,
  eventName: string,
  version: string
): PublishPlan {
  const publish = decision === 'publish';
  const finish =
    publish || (decision === 'skip-already-published' && eventName === 'workflow_dispatch');

  return { publish, finish, docs: finish && !version.includes('-') };
}
