import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = await readFile('src/lib/dictionary.ts', 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const dictionary = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
let requests = 0;
globalThis.fetch = async url => {
  requests++;
  try { return new Response(await readFile(`public${url}`), { status: 200 }); }
  catch { return new Response('', { status: 404 }); }
};
for (const word of ['כותבים', 'וכותבים', 'שכותבים', 'וכתבתי', 'בבית', 'וּכְתַבְתִּי']) {
  const matches = await dictionary.findPublishedDictionaryMatches(word);
  assert.ok(matches.length, `No match: ${word}`);
  if (word.includes('כתב') || word.includes('כותב')) assert.ok(matches.some(match => match.entry.word === 'לכתוב' && match.form), `Missing conjugation: ${word}`);
  console.log(`${word}: ${matches[0].entry.word}, ${matches[0].form?.form_id || 'lemma'}`);
}
for (const [word, lemma] of [['טיילו', 'לטייל'], ['מתכוון', 'להתכוון'], ['התייחס', 'להתייחס'], ['דיווחים', 'דיווח']]) {
  const matches = await dictionary.findPublishedDictionaryMatches(word);
  assert.ok(matches.some(match => match.entry.word === lemma && match.matchType === 'spelling'), `Missing spelling variant: ${word}`);
}
assert.equal((await dictionary.findPublishedDictionaryMatches('xyz')).length, 0);
const entries = (await Promise.all((await readdir('public/data/dictionary/v1/entries')).map(async file => Object.values(JSON.parse(await readFile(`public/data/dictionary/v1/entries/${file}`, 'utf8')))))).flat();
assert.ok(entries.length > 9000);
console.log(`Verified ${entries.length} dictionary entries; ${requests} mocked static-file requests.`);
const stories = JSON.parse(await readFile('src/data/news.json', 'utf8'));
const words = [...new Set(stories.flatMap(story => Object.values(story.sentences).flatMap(sentences => sentences.flatMap(sentence => sentence.he.match(/[\p{Script=Hebrew}\p{M}]+/gu) || []))))];
let found = 0;
const missing = [];
for (const word of words) {
  if ((await dictionary.findPublishedDictionaryMatches(word)).length) found++;
  else missing.push(word);
}
console.log(`Current news coverage: ${found}/${words.length} unique Hebrew tokens (${Math.round(found / words.length * 100)}%).`);
console.log(`Unmatched (includes names): ${missing.join(', ')}`);
