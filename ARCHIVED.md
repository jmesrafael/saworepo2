# This repository is retired

**As of 2026-08-03**, this repo is no longer the active source for SAWO's product
images, PDFs, or product/room data. Everything it held has been migrated to
Cloudflare R2 (bucket `sawo-media`), served through `saworepo1`'s Pages Function at
`/media/*`. See `saworepo1/sawo-main/docs/go-live/R2-MIGRATION-PLAN.md` for the full
migration record, and `Administrator/Local/data/r2-manifest.jsonl` in that repo for
the object-by-object migration manifest.

The Render backend that kept this repo in sync with Supabase (`syncApi.js`, the
`/api/sync` family of endpoints) has also been retired — nothing writes to this repo
anymore.

**Why this repo still exists rather than being deleted:** it is the only backup of
77 files that existed only here and never made it into Supabase before the R2
migration (now safely copied into R2 too, but this repo is kept as a secondary
backup until R2 has its own backup story). Treat this repo as read-only history from
this point forward.
