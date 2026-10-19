#!/usr/bin/env node
// Evidence presentation contract: reject missing provenance and metric drift.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const html = fs.readFileSync('index.html', 'utf8');
const data = JSON.parse(fs.readFileSync('data/evidence.json', 'utf8'));
assert.equal(data.schema_version, 1);
assert.ok(Array.isArray(data.claims) && data.claims.length > 0);
const sectionStart = html.indexOf('<div class="metrics" aria-label="Quantitative evidence snapshot">');
const sectionEnd = html.indexOf('</div>', sectionStart); // cards are checked individually below
assert.ok(sectionStart >= 0, 'Evidence snapshot missing');
const ids = [...html.matchAll(/data-evidence-id="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, data.claims.length, 'Card count differs from evidence records');
assert.equal(new Set(ids).size, ids.length, 'Duplicate evidence card ID');
for (const c of data.claims) {
  assert.ok(c.id && c.label && c.estimate && c.unit && c.n_unit, 'Required identity or measurement field absent');
  assert.ok(c.provenance && c.status && c.source && c.limitation, 'Required provenance/status/limitation absent');
  assert.ok(c.comparator || (Array.isArray(c.missing) && c.missing.some(v => /comparator|baseline/i.test(v))), 'Comparator must be specified or marked missing: ' + c.id);
  assert.ok(c.uncertainty || (Array.isArray(c.missing) && c.missing.some(v => /interval|uncertainty/i.test(v))), 'Uncertainty must be specified or marked missing: ' + c.id);
  assert.ok(c.n !== null || (Array.isArray(c.missing) && c.missing.some(v => /count|sample|run/i.test(v))), 'Unknown N must be marked missing: ' + c.id);
  assert.ok(/^https:\/\//.test(c.source), 'Source URL required: ' + c.id);
  assert.ok(ids.includes(c.id), 'Unrendered evidence entry: ' + c.id);
  const escaped = c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('<article class="metric" data-evidence-id="' + escaped + '">([\\s\\S]*?)<\\/article>');
  const match = html.match(re);
  assert.ok(match, 'Evidence card missing: ' + c.id);
  assert.ok(match[1].includes(c.estimate), 'Metric estimate drift: ' + c.id);
  assert.ok(match[1].includes(c.source), 'Source link drift: ' + c.id);
}
console.log('Evidence check passed: ' + data.claims.length + ' sourced metrics.');
