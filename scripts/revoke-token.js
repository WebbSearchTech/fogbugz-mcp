#!/usr/bin/env node
/**
 * Revokes a FogBugz API token.
 *
 * Dry run by default - it only reports whether the token is live. Pass
 * --yes to actually revoke. Deliberately dependency-free and argument-based
 * rather than an inline `node -e` one-liner, because PowerShell mangles
 * embedded quotes when marshaling arguments to a native executable.
 *
 *   node scripts/revoke-token.js --token <TOKEN>
 *   node scripts/revoke-token.js --token <TOKEN> --yes
 *   node scripts/revoke-token.js --env-file .env [--yes]
 *
 * See docs/API-TOKEN-ROTATION.md. Note that on some FogBugz instances
 * logoff invalidates other tokens belonging to the same user, so expect to
 * re-issue every token you own after running this.
 */

const fs = require('fs');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};

const LIVE = args.includes('--yes');
const envFile = flag('--env-file');
let token = flag('--token');
let url = flag('--url') || process.env.FOGBUGZ_URL;

if (envFile) {
  const text = fs.readFileSync(envFile, 'utf8');
  const pick = (key) => {
    const m = text.match(new RegExp('^' + key + '=(.*)$', 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  };
  token = token || pick('FOGBUGZ_API_KEY');
  url = flag('--url') || pick('FOGBUGZ_URL') || url;
}

if (!token || !url) {
  console.error('Usage: node scripts/revoke-token.js (--token <TOKEN> | --env-file <PATH>) [--url <URL>] [--yes]');
  process.exit(2);
}

const endpoint = url.replace(/\/$/, '') + '/f/api/0/jsonapi';
const call = (cmd) =>
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, token }),
  }).then((r) => r.json());

const errText = (r) => (r.errors || []).map((e) => e.message).join(', ');

(async () => {
  console.log('Endpoint : ' + endpoint);
  console.log('Token    : ' + token.slice(0, 4) + '...' + token.slice(-2));

  const before = await call('logon');
  if (errText(before)) {
    console.log('Status   : already dead (' + errText(before) + ')');
    return;
  }
  console.log('Status   : LIVE');

  if (!LIVE) {
    console.log('\nDRY RUN - nothing changed. Re-run with --yes to revoke.');
    return;
  }

  console.log('\nRevoking...');
  const off = await call('logoff');
  if (errText(off)) {
    console.error('logoff returned: ' + errText(off));
    process.exit(1);
  }

  const after = await call('logon');
  if (errText(after)) {
    console.log('CONFIRMED DEAD: ' + errText(after));
    console.log('\nOther tokens for this user may also have been invalidated.');
    console.log('See docs/API-TOKEN-ROTATION.md before assuming anything still works.');
  } else {
    console.error('WARNING: token still authenticates. Use the admin Session Management page.');
    process.exit(1);
  }
})();
