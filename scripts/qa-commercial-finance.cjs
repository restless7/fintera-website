/* Local, disposable PostgreSQL only. No Clerk session, provider request or real money movement. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createRequire } = Module;

const repo = path.resolve(__dirname, '..');
const localRequire = createRequire(path.join(repo, 'package.json'));
let url;
try { url = new URL(process.env.FNT_COMMERCIAL_TEST_DATABASE_URL || 'invalid:'); } catch { throw new Error('Invalid explicit local QA database URL'); }
assert(['postgres:', 'postgresql:'].includes(url.protocol), 'Explicit FNT_COMMERCIAL_TEST_DATABASE_URL required');
assert.equal(url.hostname, '127.0.0.1', 'Loopback IPv4 only');
assert(url.port && url.port !== '5432', 'Explicit nondefault isolated PostgreSQL port required');
assert.match(url.pathname, /^\/fintera_commercial_qa_[a-z0-9_]+$/, 'Disposable QA database name required');
for (const name of ['FNT_NEXT_DATABASE_URL', 'FNT_NEXT_POSTGRES_PRISMA_URL', 'fintera_DATABASE_URL', 'DATABASE_URL']) process.env[name] = url.href;
process.env.NODE_ENV = 'test';
for (const name of ['CLERK_SECRET_KEY', 'RESEND_API_KEY', 'OPENAI_API_KEY', 'QWEN_API_KEY']) process.env[name] = '';
process.env.COMMERCIAL_DELIVERY_ENABLED = 'false';
const originalFetch = global.fetch;
global.fetch = async () => { throw new Error('QA_EXTERNAL_REQUEST_FORBIDDEN'); };
const { PrismaClient } = localRequire('./prisma/generated/client');
const guard = new PrismaClient({ datasources: { db: { url: url.href } } });
let appPrisma;
const originalResolve = Module._resolveFilename;
const originalTs = require.extensions['.ts'];
const originalTsx = require.extensions['.tsx'];
let hooksInstalled = false;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const results = [];

async function main() {
  // This check precedes all fixture writes and never loads application .env files.
  const identity = await guard.$queryRawUnsafe('SELECT current_database() AS name, host(inet_server_addr()) AS address');
  assert.equal(identity[0].name, url.pathname.slice(1));
  assert.equal(identity[0].address, '127.0.0.1');
  const ledger = await guard.$queryRawUnsafe('SELECT migration_name,checksum,finished_at,rolled_back_at FROM public._prisma_migrations ORDER BY migration_name');
  const migrations = fs.readdirSync(path.join(repo, 'prisma/migrations')).filter(name => fs.existsSync(path.join(repo, 'prisma/migrations', name, 'migration.sql'))).sort();
  assert.equal(ledger.length, migrations.length, 'Run actual migrate deploy against this disposable database first');
  for (let i = 0; i < migrations.length; i++) {
    assert.equal(ledger[i].migration_name, migrations[i]);
    assert.equal(ledger[i].checksum, sha(fs.readFileSync(path.join(repo, 'prisma/migrations', migrations[i], 'migration.sql'))));
    assert(ledger[i].finished_at && !ledger[i].rolled_back_at, 'Incomplete migration');
  }
  const tables = await guard.$queryRawUnsafe("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' AND tablename<>'_prisma_migrations'");
  for (const { tablename } of tables) {
    const count = await guard.$queryRawUnsafe('SELECT count(*)::int AS count FROM public.' + quote(tablename));
    assert.equal(count[0].count, 0, 'STOP: disposable fixture database must contain no existing rows');
  }
  await guard.$disconnect();

  // The declared TypeScript dependency loads repository source; no undeclared bundler or generated test copy.
  const ts = localRequire('typescript');
  const compile = (module, filename) => {
    assert(filename.startsWith(repo + path.sep), 'Only repository TypeScript may use this test loader');
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
    module._compile(output.outputText, filename);
  };
  Module._resolveFilename = function(request, parent, ...options) {
    return originalResolve.call(this, request.startsWith('@/') ? path.join(repo, request.slice(2)) : request, parent, ...options);
  };
  require.extensions['.ts'] = compile;
  require.extensions['.tsx'] = compile;
  hooksInstalled = true;
  const subject = { ...localRequire('./lib/commercial/service.ts'), ...localRequire('./lib/commercial/contracts.ts'), prisma: localRequire('./lib/prisma.ts').default };
  const p = appPrisma = subject.prisma;
  const actor = await p.appUser.create({ data: { clerkUserId: 'synthetic-finance-qa', email: 'synthetic-finance@example.invalid', firstName: 'SYNTHETIC', lastName: 'QA', role: 'SUPER_ADMIN' } });
  const client = await p.client.create({ data: { documentType: 'CC', documentNumber: 'SYNTHETIC-QA', firstName: 'SYNTHETIC', firstLastName: 'QA', email: 'synthetic-customer@example.invalid', phone: '0000000000', residenceCity: 'QA', residenceDepartment: 'QA', residenceAddress: 'QA', preferredContactMethods: [] } });
  const app = await p.crmCreditApplication.create({ data: { fileNumber: 'SYNTHETIC-FINANCE-QA', clientId: client.id, productCategory: 'VIVIENDA_NO_VIS', requestedAmount: 1, termMonths: 180 } });
  const bank = await p.bankApplication.create({ data: { applicationId: app.id, bankId: 'bancolombia', productType: 'VIVIENDA_NO_VIS', stage: 'STAGE_09_DISBURSED' } });
  const base = () => ({ commandId: crypto.randomUUID(), reason: 'Synthetic isolated finance regression' });
  const mutate = (action, data) => subject.mutateCommercial(actor.clerkUserId, subject.commercialMutationSchema.parse({ ...base(), action, ...data }));
  const deny = fn => assert.rejects(fn);
  const at = new Date().toISOString();
  await mutate('recordDisbursement', { applicationId: app.id, bankApplicationId: bank.id, amountCOP: '99999999999999.99', occurredAt: at, reference: 'Synthetic funding', evidenceReference: 'Synthetic proof only', supersedesId: null });
  const terms = { expectedVersion: 0, counterpartyType: 'BANK', counterpartyName: 'Synthetic bank', bankId: 'bancolombia', partnerEmail: null, kind: 'RATE', ratePercent: '2.500000', fixedAmountCOP: null, trigger: 'DISBURSEMENT', validFrom: '2020-01-01T00:00:00Z', validUntil: null, evidenceReference: 'Synthetic agreement' };
  const agreement = await mutate('saveAgreement', terms);
  const recognized = await mutate('createReceivable', { applicationId: app.id, bankApplicationId: bank.id, agreementId: agreement.resourceId, dueAt: null, evidenceReference: 'Synthetic earning' });
  const receivable = () => p.commercialReceivable.findUniqueOrThrow({ where: { id: recognized.resourceId } });
  // Independent integer-cent oracle: rate is 2,500,000 millionths of one percent; HALF_UP at cent.
  const expectedCents = (9999999999999999n * 2500000n + 50000000n) / 100000000n;
  const actual = (await receivable()).amountCOP.toFixed(2);
  assert.equal(actual, (expectedCents / 100n).toString() + '.' + (expectedCents % 100n).toString().padStart(2, '0'));
  results.push('exact_large_decimal_accrual');
  const family = await p.commercialAgreement.findUniqueOrThrow({ where: { id: agreement.resourceId } });
  const v2 = await mutate('saveAgreement', { ...terms, agreementKey: family.agreementKey, expectedVersion: 1, ratePercent: '3.000000' });
  await deny(() => mutate('createReceivable', { applicationId: app.id, bankApplicationId: bank.id, agreementId: v2.resourceId, dueAt: null, evidenceReference: 'Synthetic duplicate' }));
  results.push('agreement_family_duplicate_denied');
  const entry = (kind, amountCOP, revision) => ({ applicationId: app.id, receivableId: recognized.resourceId, expectedRevision: revision, kind, amountCOP, occurredAt: new Date().toISOString(), reference: crypto.randomUUID(), evidenceReference: 'Synthetic entry' });
  const original = await mutate('recordFinanceEntry', entry('COLLECTION', '100.01', 0));
  await deny(() => mutate('recordFinanceEntry', entry('COLLECTION', '1.00', 0)));
  await deny(() => mutate('recordFinanceEntry', entry('COLLECTION', '99999999999999.99', 1)));
  const reverse = (amountCOP, revision) => ({ applicationId: app.id, receivableId: recognized.resourceId, expectedRevision: revision, originalEntryId: original.resourceId, amountCOP, occurredAt: new Date().toISOString(), reference: crypto.randomUUID(), evidenceReference: 'Synthetic reversal, no refund' });
  await mutate('reverseFinanceEntry', reverse('30.01', 1));
  await deny(() => mutate('reverseFinanceEntry', reverse('70.01', 2)));
  assert.equal((await p.commercialFinanceEntry.findUniqueOrThrow({ where: { id: original.resourceId } })).amountCOP.toFixed(2), '100.01');
  results.push('partial_collection_original_linked_reversal_bounds_and_cas');
  const cost = await mutate('recordFinanceEntry', entry('COST', '20.00', 2));
  const reverseCost = { applicationId: app.id, receivableId: recognized.resourceId, expectedRevision: 3, originalEntryId: cost.resourceId, amountCOP: '5.00', occurredAt: new Date().toISOString(), reference: crypto.randomUUID(), evidenceReference: 'Synthetic cost reversal, no refund' };
  await mutate('reverseFinanceEntry', reverseCost);
  await deny(() => mutate('reverseFinanceEntry', { ...reverseCost, expectedRevision: 4, amountCOP: '15.01', reference: crypto.randomUUID() }));
  assert.equal((await p.commercialFinanceEntry.findUniqueOrThrow({ where: { id: cost.resourceId } })).amountCOP.toFixed(2), '20.00');
  const netCost = await p.$queryRaw`SELECT SUM(CASE WHEN kind='COST' THEN amount_cop WHEN kind='COST_REVERSAL' THEN -amount_cop ELSE 0 END)::text AS value FROM commercial_finance_entries WHERE receivable_id=${recognized.resourceId}`;
  assert.equal(netCost[0].value, '15.00');
  results.push('original_linked_partial_cost_reversal_and_net_cost');
  const before = await receivable(), count = await p.commercialFinanceEntry.count();
  await p.$executeRawUnsafe("CREATE FUNCTION qa_fail_commercial_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action LIKE 'COMMERCIAL_%' THEN RAISE EXCEPTION 'SYNTHETIC_QA_AUDIT_FAILURE'; END IF; RETURN NEW; END $$");
  await p.$executeRawUnsafe('CREATE TRIGGER qa_fail_commercial_audit BEFORE INSERT ON access_audit_events FOR EACH ROW EXECUTE FUNCTION qa_fail_commercial_audit()');
  try {
    await deny(() => mutate('recordFinanceEntry', entry('COST', '1.00', before.revision)));
    assert.equal(await p.commercialFinanceEntry.count(), count);
    assert.equal((await receivable()).revision, before.revision);
  } finally {
    await p.$executeRawUnsafe('DROP TRIGGER qa_fail_commercial_audit ON access_audit_events');
    await p.$executeRawUnsafe('DROP FUNCTION qa_fail_commercial_audit()');
  }
  results.push('audit_failure_rolls_back_entry_and_revision');
  console.log(JSON.stringify({ result: 'PASS_LOCAL_COMMERCIAL_FINANCE', checks: results, syntheticOnly: true, actualClerkSession: false, actualMoneyMovement: false }));
}

main().catch(error => { console.error(JSON.stringify({ result: 'STOP_LOCAL_COMMERCIAL_FINANCE', name: error.name, code: error.code || null, completedChecks: results })); process.exitCode = 1; }).finally(async () => {
  await guard.$disconnect();
  if (appPrisma) await appPrisma.$disconnect();
  if (hooksInstalled) {
    Module._resolveFilename = originalResolve;
    if (originalTs) require.extensions['.ts'] = originalTs; else delete require.extensions['.ts'];
    if (originalTsx) require.extensions['.tsx'] = originalTsx; else delete require.extensions['.tsx'];
  }
  global.fetch = originalFetch; // Fixtures intentionally remain in the disposable database for inspection.
});
