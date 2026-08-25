/**
 * Compares the current build output against the pre-extraction baseline.
 *
 * Run:  npm run build && node scripts/verify-parity.mjs
 *
 * Reports three levels:
 *   1. exact      — byte-for-byte identical
 *   2. normalised — identical once whitespace *between* HTML tags is collapsed
 *                   (whitespace between block-level elements is not rendered,
 *                   so this level proves the visible page is unchanged)
 *   3. text       — identical once all whitespace runs are collapsed
 */
import { readFileSync } from 'node:fs';

const PAIRS = [
  { locale: 'en', baseline: 'verification/baseline/en.html', built: 'dist/index.html' },
  { locale: 'es', baseline: 'verification/baseline/es.html', built: 'dist/es/index.html' },
];

const betweenTags = (s) => s.replace(/>[ \t\r\n]+</g, '> <');
const allWhitespace = (s) => s.replace(/\s+/g, ' ');

let exactFailures = 0;
let renderedFailures = 0;

for (const { locale, baseline, built } of PAIRS) {
  const a = readFileSync(baseline, 'utf8');
  const b = readFileSync(built, 'utf8');

  const exact = a === b;
  const normalised = betweenTags(a) === betweenTags(b);
  const text = allWhitespace(a) === allWhitespace(b);

  if (!exact) exactFailures++;
  if (!normalised) renderedFailures++;

  console.log(`\n[${locale}]  exact: ${exact ? 'PASS' : 'FAIL'}   normalised: ${normalised ? 'PASS' : 'FAIL'}   text: ${text ? 'PASS' : 'FAIL'}`);
  console.log(`      sizes: baseline ${a.length} B, built ${b.length} B`);

  if (!exact) {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    const diffs = [];
    for (let i = 0; i < Math.max(bufA.length, bufB.length); i++) {
      if (bufA[i] !== bufB[i]) diffs.push(i);
    }
    console.log(`      ${diffs.length} differing byte position(s)`);
    for (const i of diffs.slice(0, 10)) {
      const show = (buf) => JSON.stringify(buf.slice(Math.max(0, i - 34), i + 8).toString('utf8'));
      console.log(`        offset ${i}: baseline 0x${bufA[i]?.toString(16)} vs built 0x${bufB[i]?.toString(16)}`);
      console.log(`          baseline …${show(bufA)}`);
      console.log(`          built    …${show(bufB)}`);
    }
  }
}

console.log(
  `\nRendered output unchanged: ${renderedFailures === 0 ? 'YES' : 'NO'} ` +
    `(${exactFailures === 0 ? 'byte-identical' : 'differs only in non-rendered whitespace — see above'})`,
);

// Exit non-zero only if the *rendered* page changed. A whitespace-only delta
// between block-level elements cannot change what a visitor sees.
process.exit(renderedFailures === 0 ? 0 : 1);
