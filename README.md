# ADEO

A model of how official documents get issued, and of what a person has to do to obtain one.

This repository is a slice of a larger system. It holds the core of that system's directory model (who can issue what), the language its issuance policies are written in, and versioned storage for both. All example data is fictional.

## The model

ADEO stands for **Authority, Delegation, Evidence, Org**. The idea in one line: an *authority* is *delegated* to *orgs* to issue *evidence*.

| Concept | What it is |
|---|---|
| **Authority** | A mandate, in one jurisdiction, to issue certain kinds of evidence. It comes from a law or regulation, not from an organisation chart. |
| **Org** | A named body, public or private. |
| **OrgDelegation** | An authority's mandate reaching an org. One row of a delegation stack. |
| **Evidence** | A document that can be issued: a licence, a certificate, a receipt. It has a schema, the fields the document carries. |
| **EvidenceDelegation** | What one delegation row says about issuing one evidence. |

Authorities and orgs are kept apart on purpose. One mandate is often carried out by many orgs, one org often carries several mandates, and the body that sets the rules is frequently not the one the applicant deals with. Modelling the mandate separately lets the same structure describe a single national office, a regulator with hundreds of approved providers, and everything between.

### Delegation stacks

A mandate reaches the applicant through a *delegation stack*: an ordered list of delegation rows, from the body that sets the rules (index 1) up to the org the applicant actually deals with (the highest index).

```
Guild licence, Republic of Zedland

  index 1   Guild Standards Board   sets what the assessment tests and what passing means
  index 2   Harbour Guild Hall      runs the assessment: how to book, what it charges
```

A stack can be a single row (one office does everything) or several. Each row describes only its own part of the process, and where two rows disagree the higher index wins: the org the applicant deals with describes what happens in practice.

## Policies

A *policy* describes how a person obtains one evidence from one org, as a list of steps.

- A **step type** is something the applicant does: prepare documents, book, attend, wait for a response.
- Each step has **outcomes**: what can happen there. One is the default; others are alternatives or things going wrong (missed, turned away, refused).
- An outcome names the **evidence** the applicant brings and comes away with, the **rules** that judge it (still valid, in the right name), and **facts** derived for it (what is to pay, who must attend).
- **Channels** say how a step can be done: in person, by post, online.

Conditions and rules are written as [JSONata](https://jsonata.org) expressions over the applicant's documents and situation.

A policy never names an office, an address, a phone number or a fee amount. It only says how to find them, so the directory can change without touching a policy.

### Observed, fragment, compiled

The same policy structure is used in three forms:

- **Observed**: the process as one org's own pages present it. Partial by nature, since nobody publishes the whole process.
- **Fragment**: the part of a row's observed policy that the rows below it do not already state. Fragments are what is stored and reused.
- **Compiled**: the fragments of a stack merged in index order and filled in with templates for the standard parts of any process. One compiled policy per stack and evidence.

## Versioning

Every record has a `stableId` that identifies it across time and a `temporalId` (`{stableId}_v{n}`) that identifies one version. A change closes the current version and adds the next; nothing is deleted. Writing a record whose content has not changed writes nothing.

## Layout

```
src/entities      one file per entity: the ADEO records and the parts of a policy
src/repository    versioned storage over a data context, an in-memory context, a dataset loader
src/pipeline      contracts for the stages that turn observed policies into a compiled one
src/services      services over the repository
fixtures/stacks   example delegation stacks
test              tests
```

The pipeline stages are contracts only; they are not implemented yet.

## Running

```
npm install
npm test
npm run typecheck
```

Requires Node 20 or later.

## Licence

MIT. See [LICENSE](LICENSE).
