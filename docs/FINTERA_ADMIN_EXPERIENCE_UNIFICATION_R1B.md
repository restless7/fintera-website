# Fintera Security & Real-Session Acceptance R1B

Workstream: `FNT-ADMIN-UX-R1B` · 2026-10-29 · **WIP — LOCAL FIXES IN REVIEW; FIVE TEST ACCOUNTS / REAL ACCEPTANCE PENDING**

## Document Architecture Check and scope

This single subordinate report extends the accepted [R1 implementation record](FINTERA_ADMIN_EXPERIENCE_UNIFICATION_R1.md) without rewriting it or creating another roadmap. The existing package `docs/` directory is the established Fintera report destination; root `AGENTS.md`, the R1 Document Architecture Check and the package/source contracts remain authoritative for the local task. Ownership remains Fintera CRM, its canonical authorization and existing document/bank services. No database schema, bank stage, financial calculation, Outbox contract, new role or session identity is introduced.

The user authorized a bounded local follow-up: remove supplied test-identity substitution, stabilize actual lint and validate the existing five routes through genuine Clerk sessions for Director, Advisor, Analyst, Supervisor and Auditor. UI redesign and new functionality are outside scope. The owner subsequently authorized a Fintera-only commit and push for team sharing; the architect owns that operation. Production publication remains blocked. This limited Git authorization supersedes the earlier remote-Git restriction only for the requested Fintera code share. Controlled fixtures can qualify local boundaries but cannot substitute for real-session acceptance.

Frontend architect owns the security helper/handlers and related scope intersections. Product designer owns package lint configuration/script and the existing BI/document initial-fetch effects and queue request-time calculation, plus this report/local ledger. QA owns independent checks and real-session evidence. An explicit local atomic ledger is retained by the maintainer, outside the published repository. Mission Control, vector-memory and exact token/cost telemetry are unavailable; numeric metrics remain `null`, not zero. The REAL task stays pending while the five requested TEST accounts are prepared and until genuine acceptance is observed. Account preparation is not completion of acceptance.

## Baseline

R1 is retained as a local GO with disclosed limits, on its source-bound final candidate. This follow-up starts from the same dirty nested package rather than a clean Git commit. A selected seven-target lint baseline (including absent-file entries) is preserved in `lint/baseline-pins.json` and `lint/baseline-source/` under the R1B evidence directory, before lint edits. QA separately captured a broader baseline.

Actual installed versions: ESLint 9.39.2, eslint-config-next 16.1.6, Next 16.1.6, React 18.3.1 and TypeScript 5.9.3. At baseline the package declared `next:^15.5.4`, latest lint tooling and obsolete `lint:next lint`, while the installed framework was 16.1.6. The owner later approved correcting the Next declaration to exact `16.1.6`, matching that already installed runtime and proxy behavior. The actual installed webhook verifier is also now declared directly as exact `svix:1.92.2`, repairing the previously undeclared runtime dependency. No installation, SDK upgrade, dependency-tree upgrade or new lockfile accompanied either correction. Remaining ranges/latest tooling and absent standalone lock qualification are disclosed in the team handoff.

The fresh direct admin baseline with installed Next core-web-vitals reports 3 errors / 1 warning: synchronous initial effect updates in BI/documents, missing document fetch callback dependency, and `Date.now` evaluated directly in the server queue component. The source/log is retained in `lint/baseline-admin.log`. No lint rule has been disabled or downgraded.

## Lint implementation and observed commands

The canonical package `npm run lint` now executes `eslint .` with `eslint.config.mjs` importing the installed Next core-web-vitals flat config. `lint:admin` is a separate strict command over all administrative components, auth helpers and CRM APIs, plus the queue request-clock helper. The full command was not narrowed to manufacture a pass. No rule is disabled or downgraded, no installed dependency was upgraded, and legacy `.eslintrc.json` is preserved but inactive under ESLint 9 flat-config resolution. Generated Prisma clients and local storage/backups/coverage are excluded as generated/data artifacts, alongside Next's built-in output ignores.

Before these source fixes, the real full-package run inspected 178 files and reported 14 errors / 9 warnings across 16 files (`lint/baseline-all.json`). The administrative 3 errors / 1 warning were only part of that baseline. Root authorized the minimal surrounding UI/hook hygiene needed for the whole canonical command to pass, without redesign or domain changes.

Observed final local command: `npm run lint` **PASS, 0 errors / 6 warnings**, retained in `lint/all-after-submit-fix.log`. `npm run lint:admin` **PASS, 0 errors / 0 warnings**, retained in `lint/admin-after.log`. The six remaining warnings are unchanged React Hook Form `watch()` compiler/memoization compatibility diagnostics, not disabled checks; they do not fail the full command. Their source APIs were not migrated merely to remove warnings. Initial failed lint attempts remain retained.

Administrative fetch effects now subscribe to asynchronous GET responses and cancel stale requests with AbortController; loading/error updates belong to response callbacks or explicit user events. Document defaults use stable callbacks and functional updates, preserving employee/case-keyed drafts and original pending-request settlement. Queue follow-up retains the same rolling 24-hour cutoff, now from a request-cached server clock rather than an impure render-time `Date.now` call. No financial calculation changes.

The additional eight-file baseline was copied before edits. Six JSX quotes render identically after escaping; two portal fetch effects now have cancellation and case-keyed stale-response protection; the persistence hook exposes an observable one-time restoration status instead of reading a mutable ref in the consumer render. Its TTL, field precedence and debounce interval remain unchanged. Focused QA then reproduced a preexisting success-path defect: a pending autosave could recreate a just-cleared draft. The minimal correction cancels that timer before removing storage; this corrects successful submission retention, not financial logic. CTA particles already had deterministic positions, so their redundant mounted-state update was removed. The footer reuses existing Next Image with `unoptimized`, eager loading, the same local URL and 16px dimensions, without adding optimization/network behavior.

The lint candidate's 14 changed files are independently pinned in `lint/candidate-source-pins.json`; broader security and final combined source/build verification belong to the architect/QA records. A local lint pass does not certify genuine Clerk acceptance.

## Implementation and acceptance evidence

Independent local checks now report 38 security-handler groups and 15 affected-behavior groups PASS. The latter include restoration precedence/TTL/debounce/reset/unmount, portal stale-response/denial/error/abort/message cases, BI loading/error states, document pending refresh and the 650ms successful-submission draft-clear regression. These local checks do not certify genuine Clerk sessions. Genuine Clerk operational acceptance is not yet complete. No fixture is described as a live employee session or real business ACK.


## Security candidate — focused independent checks passing

The architect inventories eight existing runtime routes and one canonical authorization helper in `security/security-inventory.json` and `security/candidate-source-pins.json`. The R1 BI guard remains canonical. Caller-supplied test identity is removed rather than conditionally re-enabled in production or test mode; isolated tests inject controlled identities outside runtime. Authorization intersects employee permissions, existing portfolio ABAC and URL/body resource relationships. No database schema, financial/bank domain service or SDK change is part of this candidate.

| Existing operation | Candidate authority contract |
| --- | --- |
| `/api/admin/crm/dashboard GET` | crm:application:read |
| `/api/admin/crm/applications GET` | crm:application:read |
| `/api/admin/crm/applications POST` | crm:application:create |
| `/api/admin/crm/applications/[id] GET` | crm:application:read + case ABAC |
| `/api/admin/crm/applications/[id] PATCH` | crm:application:update + case ABAC; changed status requires transition, reassignment requires lead:assign |
| `/api/admin/crm/applications/[id]/activities POST` | crm:application:update + case ABAC |
| `/api/admin/crm/applications/[id]/bank-cases POST/PATCH` | crm:bank-case:manage + case ABAC; supplied bank belongs URL case |
| `/api/admin/crm/applications/[id]/documents GET` | crm:document:read + case ABAC |
| `/api/admin/crm/applications/[id]/documents POST MATERIALIZE/CREATE_UPLOAD_INTENT/CONFIRM_UPLOAD/ATTACH` | crm:document:upload + case ABAC + resource relationships |
| `/api/admin/crm/applications/[id]/documents POST REVIEW` | crm:document:review + case ABAC + resource relationships |
| `/api/admin/crm/applications/[id]/documents/[versionId]/download GET` | crm:document:read + case ABAC; existing case/version + CLEAN checks retained |
| `/api/webhooks/clerk POST` | configured signing secret + existing real Svix verification all environments |

The webhook boundary is part of the same identity trust chain: configured signing secret and actual existing Svix verification are required in every environment. Existing verified synchronization behavior is preserved. No role, identity, session or production account was created to qualify it. QA has now observed 38 focused handler groups PASS, including actual isolated bank commits and exact BigInt string response transport. The genuine Clerk sign-in frontend is ready without browser errors, but this is not an authenticated session. An initial local build passed, but it predates the final timer correction and dependency declaration; it is superseded for exact-final-source qualification. All 15 affected-behavior groups now pass after the correction. Exact-final-source build qualification and genuine five-role acceptance are not claimed complete. The five-role acceptance matrix below is unchanged.

## Genuine role/session acceptance

| Requested role | Current acceptance status |
| --- | --- |
| Director | PENDING — no genuine accepted journey observed |
| Advisor | PENDING — no genuine accepted journey observed |
| Document analyst | PENDING — no genuine accepted journey observed |
| Supervisor | PENDING — no genuine accepted journey observed |
| Auditor | PENDING — no genuine accepted journey observed |

Target routes remain `/admin/crm`, `/admin/crm/applications`, `/admin/crm/applications/[id]`, `/admin/crm/applications/[id]/documents` and `/admin/crm/bi`, subject to each actual role's permission. A real denial is part of the expected result for an unauthorized route; it is not replaced by synthetic access. Sidebar operations, document decisions, bank transitions and list return context require genuine authenticated evidence, existing authorized records and PostgreSQL outcomes before this acceptance can close.


## Team sharing authorization

The owner explicitly requested a commit and push of the current Fintera work for the team, without waiting for production readiness or all five real-session journeys. The architect owns release-branch preparation, the staged source manifest and the actual commit/push. Their publication record will supply the real branch and SHA only after those operations occur. Deployment is not authorized by that request.

The portable [team handoff](FINTERA_TEAM_HANDOFF_R1B.md) records the corrected framework declaration and remaining toolchain reproducibility limits, local commands, known warnings and the five accounts still not prepared/accepted. It includes no private execution receipts, credentials or authentication material. R1 remains unchanged as the historical record. This R1B report remains WIP until its actual verification and acceptance conditions are reconciled; sharing the source does not close them.


Existing migration/DDL files shared in Git are versioned engineering source, not a claim that R1B executed migrations or changed a live schema. No hosted database migration is asserted.
