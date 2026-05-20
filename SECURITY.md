# Security Notes

## Vulnerability Triage Log

Last reviewed: 2026-05-20

Initial local `npm audit` status before hardening:

- 44 total vulnerabilities
- 2 critical
- 19 high
- 12 moderate
- 11 low

GitHub also reported a broader Dependabot backlog on push:

- 58 total vulnerabilities
- 2 critical
- 32 high

Current local `npm audit` status after hardening and Founding Access implementation:

- 27 total vulnerabilities
- 0 critical
- 0 high
- 18 moderate
- 9 low

| Package | Severity | Direct/Transitive | Reachable | Resolution | Status |
| --- | --- | --- | --- | --- | --- |
| `fast-xml-parser` | Critical | Transitive via `@google-cloud/storage` | Indirect Firebase Admin storage path | Lockfile updated to patched transitive versions through `npm audit fix --package-lock-only` | Resolved |
| `protobufjs` | Critical | Transitive | Indirect Firebase/Admin/Web3 dependency path | Lockfile updated to patched transitive versions through `npm audit fix --package-lock-only` | Resolved |
| `drizzle-orm` | High | Direct | Yes, database query layer | Upgraded to `0.45.2` | Resolved |
| `vite` | High | Direct/dev | Dev server and build tooling | Upgraded to patched `7.3.3` with compatible Vite plugin, Vitest, and Node types | Resolved |
| `effect` | High | Transitive via UploadThing | Possible UploadThing runtime path | Added npm override to `^3.21.2` | Mitigated |
| `esbuild` | Moderate | Direct/dev and transitive via tooling | Dev server and local CLI tooling | Upgraded direct `esbuild` to `0.28.0`; overrode `@esbuild-kit/core-utils` to patched `esbuild` | Mitigated |
| `aws-sdk` | Low | Direct | Yes, dynamic S3 fallback in `server/utils/upload.ts` | Kept temporarily; migration to AWS SDK v3 should be handled as a focused upload-provider ticket | Accepted temporarily |
| `@tootallnate/once` | Low | Transitive via `firebase-admin` -> `@google-cloud/storage` -> `teeny-request` -> `http-proxy-agent` | Low; only reachable through Firebase Admin Google Cloud HTTP proxy behavior | Not force-fixed because npm recommends downgrading `firebase-admin` to `10.3.0`, a breaking and older major version | Accepted temporarily |

## Remaining Low-Severity Risk

The remaining audit findings are low and moderate transitive advisories:

- Firebase Admin transitive chain through `@tootallnate/once`. The current installed `firebase-admin` is newer than the version npm recommends through `audit fix --force`; applying that forced fix would downgrade a core authentication dependency and is not appropriate without a Firebase integration review.
- AWS SDK v2 direct advisory. The code still uses `aws-sdk` as a dynamic S3 fallback in `server/utils/upload.ts`. The recommended fix is a planned migration to modular AWS SDK v3 clients, not a forced downgrade.
- `ws` moderate advisories appear through transitive WalletConnect/Reown/Wagmi/Viem and `react-email` dependency paths. No direct reachable exploit path has been confirmed in current payment/auth routes, and npm's available force fix would introduce breaking package changes. Revisit during the next Web3 dependency upgrade pass.

The Firebase finding should be revisited when Firebase Admin or Google Cloud Storage publishes a dependency path that replaces `http-proxy-agent@5` or `teeny-request`. The AWS finding should be revisited when upload storage is productionized.

## Admin Auditability

Sensitive admin escrow actions now flow through a typed audit abstraction and require an operator reason. The audit log uses a Postgres-backed `audit_log` table when database storage is active, with an in-memory fallback reserved for MemStorage/test paths.

Driver compliance actions use the same audit trail. Approval, rejection, suspension, document re-request, manual review, and automatic document-expiration events record actor, previous state, next state, reason, and metadata before a driver can become dispatch eligible again.

## Verification Requirement

After dependency changes, run:

- `npm.cmd run check`
- `npm.cmd test -- --run`
- `npm.cmd run build`
- `npm.cmd run test:e2e`

Do not proceed to real wallet, escrow, or staging payment testing unless critical and high dependency vulnerabilities remain at zero or are explicitly risk-accepted in this file.
