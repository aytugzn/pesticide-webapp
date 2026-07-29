# Firebase Deployment Operations

This document is the review checklist for repository-managed Firestore rules
and safe index inventory handling. It does not authorize or perform a production
deployment.

## Client access model

- The Firebase browser SDK is used only for Authentication.
- `getDb()` currently has no consumer.
- Public site data is read on the server from the published snapshot.
- Admin reads and writes use the Firebase Admin SDK.
- Firebase Authentication does not require browser Firestore access.

For that reason, `firestore.rules` is deny-all for browser reads and writes.
Firebase Admin SDK operations bypass Security Rules.

## Index inventory

Production composite indexes and field overrides have not been inventoried.
For that reason, this repository does not currently manage or deploy an index
file. An empty index file must not be treated as production state: deploying one
could propose removal of live indexes or overrides.

Export the live inventory first, merge it with requirements proven by real
queries, and review the resulting file before enabling index deployment.

## Read-only checks before deployment

1. Confirm the target project ID matches both `FIREBASE_PROJECT_ID` and
   `NEXT_PUBLIC_FIRESTORE_PROJECT_ID`.
2. Export or copy the current live rules for review.
3. List live composite indexes and field exemptions.
4. Confirm no external browser/mobile client depends on Firestore access.
5. Review the diff between live configuration and these repository files.

## Manual deployment

After the read-only checks, deploy rules only and explicitly name the target
project:

```bash
firebase deploy --only firestore:rules --project <firebase-project-id>
```

Never infer the production project from a local default, and do not deploy from
an unreviewed Preview environment. Do not use `--force`.

## Future index deployment

Do not deploy `firestore:indexes` until the live production inventory has been
exported, reviewed, and merged into a repository file. When that prerequisite is
met:

1. Compare every composite index and field override with the live project.
2. Run a preview/dry-run capability if supported by the installed CLI version.
3. Review every Firebase CLI deletion warning; abort if any removal is not
   explicitly approved.
4. Deploy indexes separately from rules and never use `--force`.

The absence of a repository index file currently means "not managed here", not
"production has no indexes".
