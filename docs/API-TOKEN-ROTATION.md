# Rotating a FogBugz API Token

FogBugz API tokens are **per-user**. Every case opened, edited, or assigned
through this server is attributed to the person who owns the token it is
running with. A leaked token lets someone act as that person, so treat it
like a password.

Tokens have no expiry ([FogBugz docs][article]) - they stay valid until
explicitly revoked.

## Where a token can be configured

Depending on how you run the server, the token may live in several places.
Check all of them - it is easy to rotate one and forget another:

| Location | Used by |
|---|---|
| `.env` in the repo root | `npm run dev`, `npm run backup`, the backup scripts |
| `fogbugz-backup-tools/.env` | the standalone backup tools / scheduled task |
| `~/.claude.json` -> `mcpServers.fogbugz.env` | Claude Code |
| `%APPDATA%\Claude\claude_desktop_config.json` -> `mcpServers.fogbugz.env` | Claude Desktop (manual config) |
| Claude Desktop extension settings | the `.mcpb` bundle (prompted at install, stored in the OS keychain) |

The `.mcpb` bundle itself must **never** contain a token. Its
`release/manifest.json` uses `user_config` so each installer supplies their
own - see the `fogbugz_api_key` entry there.

## Creating a new token

In the FogBugz web UI: **avatar menu -> User Options -> API Tokens**.

Do not use `cmd=logon` with an email and password to mint tokens from a
script. FogBugz recommends against it, it fails outright when two-factor
authentication is enabled, and it means storing a password where a
revocable token would do.

## Revoking the old token

> **Important: `logoff` can invalidate more than the token you pass.**
> On at least some FogBugz instances, calling `logoff` with one of your
> tokens invalidates *other* active tokens for the same user as well.
> Assume revoking one of your tokens may log out all of them, and plan to
> re-issue every token you own in one pass rather than one at a time.

Because of that, the safest order is:

1. Revoke first, accepting a short outage.
2. Generate one new token in the web UI.
3. Paste it into every location in the table above that you actually use.
4. Verify (see below).

Three ways to revoke, in order of preference:

- **Admin -> Session Management** in the web UI. Revokes by selection, so
  you do not need the token value, and you can see what else you are
  killing.
- **`scripts/revoke-token.js`** (below) if you still have the value.
- **Changing your FogBugz password**, which invalidates every token you
  own. The blunt option, useful if you think a token has spread.

### Using the revoke script

```
node scripts/revoke-token.js --token <TOKEN>        # dry run: reports live/dead
node scripts/revoke-token.js --token <TOKEN> --yes  # actually revoke
node scripts/revoke-token.js --env-file .env --yes  # read the token from an env file
```

It is a plain script with no dependencies and no shell quoting, so it
behaves the same in PowerShell, Git Bash, and cmd. (An inline
`node -e "..."` one-liner does **not** - PowerShell mangles embedded quotes
when passing arguments to a native executable.)

## Verifying

```
node scripts/revoke-token.js --token <OLD_TOKEN>
```

A revoked token reports `Error 3: Not logged in`. A live one reports
`LIVE`. After pasting the new token, restart Claude Code and Claude Desktop
so their servers pick it up - a running MCP server holds the value it
launched with.

Do not forget the scheduled backup task, if you have one installed; it
reads `fogbugz-backup-tools/.env` and will fail silently on its next run
if that file still holds a dead token.

[article]: https://support.fogbugz.com/article/55717-get-an-api-token-using-fogbugz-api-commands
