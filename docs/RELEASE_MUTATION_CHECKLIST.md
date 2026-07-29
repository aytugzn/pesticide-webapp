# Release Mutation Checklist

## Mutation policy preflight

> **Mandatory release blocker:** Repository code and automated tests cannot
> verify dashboard environment scopes. Before any push or deployment, manually
> open the Vercel Production/Preview environment settings and the GitHub Actions
> repository variables, then confirm every scope and value listed below. Do not
> continue the release until this dashboard verification is complete.

Complete these checks before releasing code that uses the fail-closed mutation
policy:

1. Define `DMR_ALLOW_MUTATIONS=true` in the Vercel **Production** scope before
   deploying the application.
2. Do not define `DMR_ALLOW_MUTATIONS` in the Vercel **Preview** scope. Preview
   mutations remain blocked even if the value is accidentally set; the Preview
   public site may operate read-only.
3. Define `DMR_ALLOW_MUTATIONS=true` as a GitHub Actions repository variable for
   the combination worker.
4. Use the same explicit opt-in for local mutation testing; omit it for
   read-only local work.
5. After the Production deployment, confirm the admin read-only pages load, the
   policy banner is absent, and one controlled mutation succeeds.

The mutation policy does not directly block authentication or admin read-only
loaders. This is not a guarantee that admin login works in Preview. Preview
admin access additionally requires separate non-production Firebase client and
Admin configuration, `ADMIN_EMAIL`, Upstash Redis, and `RATE_LIMIT_SECRET`. This
project does not provision that Preview admin infrastructure by default, so
Preview admin login should not be expected without it. Never expose Production
Firebase, Redis, or other credentials to Preview.

The Preview public site may operate read-only. Preview mutations are always
blocked. In other runtimes without the explicit opt-in, contact submissions,
admin writes, publishing, uploads, Telegram side effects, and the combination
worker are blocked before their provider mutations begin.

Never add an automatic Production fallback in code. Complete the mandatory
dashboard verification, set the environment, and only then push or deploy.
