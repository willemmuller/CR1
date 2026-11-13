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

### Types

Two of the concepts above have a type, which is the same in every jurisdiction.

| Type | What it is | Linked to |
|---|---|---|
| **AuthorityType** | A kind of mandate: a civil registry, a professional regulator, a utility provider. It lists the evidence types such a mandate can cover. | An `Authority` is one authority type in one jurisdiction (`Authority.authorityType`). |
| **EvidenceType** | A kind of document: a passport, a licence to practise, a payment receipt. | An `Evidence` is a concrete document of one or more evidence types (`Evidence.evidenceTypes`). An `OrgDelegation` names the evidence types its org issues (`OrgDelegation.evidenceTypes`). |

An evidence type also says a few things about every document of its kind:

- **Terminal or not.** A terminal document is one people set out to obtain and go on to use elsewhere. A non-terminal one only exists along the way: a receipt, a booking confirmation.
- **Instance scope.** Whether there is one evidence per delegation row that issues it, one per org, or one for the type as a whole.
- **Holder-authored.** The holder writes it, as with a completed form, and no org issues it.
- **Annex.** It only exists attached to another document, as with a certified copy or a translation.

Evidence types are listed on the authority type and on the delegation, never on the authority itself: what a mandate *can* cover is a property of its type, and what an org *does* issue is a property of its delegation.

### Delegation stacks

A mandate reaches the applicant through a *delegation stack*: an ordered list of delegation rows, from the body that sets the rules (index 1) up to the org the applicant actually deals with (the highest index).

```
Guild licence, Republic of Zedland

  index 1   Guild Standards Board   sets what the assessment tests and what passing means
  index 2   Harbour Guild Hall      runs the assessment: how to book, what it charges
```

A stack can be a single row (one office does everything) or several. Each row describes only its own part of the process, and where two rows disagree the higher index wins: the org the applicant deals with describes what happens in practice.

## What a person holds

Everything above describes what can be issued. **UserEvidence** is the other side: one person's own instance of an `Evidence` (`UserEvidence.evidenceId`), which is where its issuer and jurisdiction come from.

- **Ownership declaration.** A person may hold a document with a copy on file, say they hold it without one, intend to obtain it, be told by a plan that they need it, or have handed it over to an org.
- **Sequence.** Whether it was, or is to be, obtained as a first issue or a re-issue. This is the same value a policy carries (`Policy.sequence`), so a user evidence can be matched to the policy that describes how to get it.
- **Annex chains.** Documents are often not used bare: a certificate is copied, the copy is certified, the certification is legalised, the result is translated. Each of those is a user evidence annexed to the one before. The standalone document is the root of the chain, and every annexed evidence points at the root and at its direct parent.

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
- **Compiled**: the fragments of a stack merged in index order. One compiled policy per stack and evidence.

## Versioning

Every record has a `stableId` that identifies it across time and a `temporalId` (`{stableId}_v{n}`) that identifies one version. A change closes the current version and adds the next; nothing is deleted. Writing a record whose content has not changed writes nothing.

## Layout

```
src/entities      one file per entity: ADEO (the records and their types), EvidencePolicy (the parts of a policy), and UserEvidence
src/repository    one repository per entity over a data context, a unit of work, an in-memory context
src/services      services over the repositories
fixtures/stacks   example delegation stacks
test              tests, with a dataset loader for the fixtures
```

`EvidencePublishService.publish`, which turns the policies observed along a stack into a compiled one, is not implemented yet.

## Running

```
npm install
npm test
npm run typecheck
```

Requires Node 20 or later.

## Licence

MIT. See [LICENSE](LICENSE).
