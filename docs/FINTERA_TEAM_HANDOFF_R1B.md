# Fintera R1B — Team Handoff

**WIP for team review. Production readiness is not certified.**

The owner authorized a Fintera-only commit and push so the team can inspect the latest work. Deployment remains outside this authorization. The accepted [R1 report](FINTERA_ADMIN_EXPERIENCE_UNIFICATION_R1.md) is historical local qualification; [R1B](FINTERA_ADMIN_EXPERIENCE_UNIFICATION_R1B.md) addresses its identity-boundary and lint limitations. This handoff is an operating note, not a new roadmap or a completed acceptance certificate.

## What is ready to review

- Five existing admin routes share the R1 shell, navigation, role-aware controls, queue return context and in-memory case drafts.
- R1B replaces caller-supplied test identity with canonical employee resolution, permission checks and case/resource ownership checks. Verified webhook handling stays on the real signing boundary.
- The package has an ESLint 9 flat config and a real full-source `npm run lint` command. Local execution passes with six disclosed React Hook Form compiler compatibility warnings. Strict `npm run lint:admin` passes without errors or warnings. No lint rule was disabled to obtain those results.
- Initial-fetch, request cancellation, stale-case rendering and persistence-status fixes preserve the existing workflows. Successful form submission now also cancels a queued autosave before clearing storage, preventing the cleared draft from being recreated. Financial formulas, schema and bank states are not redesigned.

QA has observed 38 focused security-handler groups passing, including real isolated bank commits with exact BigInt string transport. The genuine Clerk sign-in frontend loads without browser errors; no authenticated employee session or five-role operational acceptance has been completed. An initial local Next build passed, but it predates the last form-timer correction and dependency declaration. It does not qualify the exact final published tree. All 15 focused affected-behavior groups now pass after the timer correction, including the 650ms success-path check. Exact-final-source build qualification is not claimed here; genuine five-role acceptance remains pending. Do not interpret these bullets as a successful clean-clone build or a genuine employee acceptance run.

## Toolchain and a fresh checkout

The current workspace resolves ESLint 9.39.2, eslint-config-next 16.1.6, Next 16.1.6, React 18.3.1, TypeScript 5.9.3 and Prisma 5.22.0. The original package declaration was Next `^15.5.4`; it has now been corrected to exact `16.1.6`, matching the already installed and exercised framework and proxy behavior. The already installed webhook verifier is also declared directly as exact `svix:1.92.2`, repairing its previously undeclared runtime import. Neither correction installed or upgraded a package or changed the existing dependency tree. Lint tooling still uses `latest` declarations and this standalone source has no newly fabricated lockfile.

Use the repository's actual workspace/dependency context when reviewing the branch. Before treating a fresh installation as repeatable, reconcile the remaining dependency ranges/latest tooling and a reviewed lockfile with the maintainer. A local build from the existing installed tree does not establish clean-clone reproducibility. Do not copy a production `.env` or private execution evidence into the repository.

The application needs an approved local PostgreSQL database and the intended Clerk **TEST** instance. Obtain development configuration through the team's normal secret channel; keys, cookies, tokens and private logs are deliberately absent here. Review the existing schema and migrations before applying database setup. Generate the existing isolated client with `npm run db:generate` once the environment is prepared. Existing migration/DDL files may be included as versioned source; their presence is not evidence that R1B applied them or that any target database has been migrated.

Useful commands from the package directory, using the approved installed dependencies:

```sh
npm run lint
npm run lint:admin
npx --no-install tsc --noEmit
npm run build
npm run dev
```

The standard dev script uses port 3004. Current Node 24 development diagnostics have also used `NODE_OPTIONS=--no-experimental-strip-types` to avoid the local Tailwind TypeScript-loader conflict; this is an environment-specific diagnostic, not a dependency upgrade or a guarantee for another machine.

Regression scripts under `scripts/verify-*.ts` create and mutate fixtures. Run them only against an isolated disposable test database, with the required local storage/scanner adapters and explicit fixture prerequisites. Their printed historical assertion totals are not all independent tests. Genuine runtime APIs must never regain the removed test-header impersonation path to make a test pass.

## Five TEST accounts — not prepared or accepted yet

The owner requested preparation of TEST accounts for these existing roles. Their preparation and operational acceptance are still pending:

| Role | Account readiness | Genuine operational acceptance |
| --- | --- | --- |
| Commercial director | Not prepared/verified | Not run |
| Commercial advisor | Not prepared/verified | Not run |
| Document analyst | Not prepared/verified | Not run |
| Supervisor | Not prepared/verified | Not run |
| Auditor | Not prepared/verified | Not run |

After legitimate TEST identities and their approved PostgreSQL employee mappings exist, verify the role's expected allow/deny outcomes on `/admin/crm`, `/admin/crm/applications`, `/admin/crm/applications/[id]`, `/admin/crm/applications/[id]/documents` and `/admin/crm/bi`. Validate sidebar navigation, permitted document review/bank changes, the actual persisted result and return to the filtered queue. An unauthorized route should deny access. A controlled identity fixture is not a real Clerk session; a sign-in page render is not completion of these journeys.

No account identifier, session cookie, password, provider key or synthetic ACK is published by this handoff. Account preparation is separate from acceptance and does not imply either one has already succeeded.

## Remaining limits

Six public-form React Hook Form `watch()` compatibility warnings remain visible; no broad form migration was performed merely to remove a nonblocking diagnostic. R1B is not a production/security certification, and five-role acceptance is pending. Private execution receipts stay with the maintainer; the portable source and this report do not contain them. The prepared review branch is `feat/fintera-admin-ux-r1b`. Its actual commit/push result and any final build receipt must be read from the publication and verification records; branch preparation alone does not prove publication.
