# policy-publish

Publishes compiled evidence policies.

An *evidence* is a document that some authority has a mandate to issue. The mandate reaches the applicant through a *delegation stack*: an ordered list of orgs, from the body that sets the rules (index 1) up to the org the applicant actually deals with. Each row of the stack publishes part of the process, and nobody publishes all of it. A regulator says what an assessment tests and what passing means; the hall that runs it says how to book and what it charges.

A *policy* describes that process as steps with outcomes. Publishing turns the policy observed at each row into one compiled policy for the stack:

1. **Check** every row's observed policy: its structure, then its expressions.
2. **Fragment** each row, lowest index first: keep what the row states that the rows below it do not.
3. **Merge** each fragment over the rows below it. A higher row takes precedence; nothing below is removed.
4. **Expand** the merged policy with templates for the standard parts of a process.
5. **Store** the fragments, the compiled policy and a log of the run.

## Layout

```
src/entities      the policy language and the stored records
src/repository    versioned storage over a data context; in-memory context; dataset loader
src/pipeline      the contract of each stage
src/services      EvidencePublishService
fixtures/stacks   example delegation stacks (fictional)
test              tests
```

## Status

The entities, the repository and `EvidencePublishService.publish` are in place and tested. The five pipeline stages (`validator`, `expressionChecker`, `fragmenter`, `merger`, `expander`) are defined as interfaces in `src/pipeline/stages.ts` and are **not implemented yet**: `createPipeline()` returns stages that throw `NotImplementedError`. The service tests run against stand-in stages in `test/support/fakePipeline.ts`.

## Storage

Every record has a `stableId` and is versioned. A change closes the current version (`to` is set) and adds the next (`{stableId}_v{n}`); nothing is deleted. Writing a record whose content has not changed writes nothing, so publishing the same input twice produces no new versions apart from the run's log.

A publish is all or nothing. If any row fails a check, only the log is stored.

## Running

```
npm install
npm test
npm run typecheck
```

Requires Node 20 or later.

## Licence

MIT. See [LICENSE](LICENSE).
