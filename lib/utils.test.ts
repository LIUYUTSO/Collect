import { test } from 'node:test';
import assert from 'node:assert';
import { generateSlug } from './utils.ts';

test('generateSlug returns a string of length 8', () => {
  const slug = generateSlug();
  assert.strictEqual(typeof slug, 'string');
  assert.strictEqual(slug.length, 8);
});

test('generateSlug only contains allowed characters', () => {
  const allowedChars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const slug = generateSlug();
  for (const char of slug) {
    assert.ok(allowedChars.includes(char), `Character ${char} is not in the allowed set`);
  }
});

test('generateSlug produces different results (probabilistic)', () => {
  const slugs = new Set();
  for (let i = 0; i < 100; i++) {
    slugs.add(generateSlug());
  }
  // With 31^8 combinations, 100 samples should definitely be unique
  assert.strictEqual(slugs.size, 100);
});

test('generateSlug character distribution over many iterations', () => {
  const allowedChars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const charCounts: Record<string, number> = {};
  for (const char of allowedChars) {
    charCounts[char] = 0;
  }

  const iterations = 1000;
  for (let i = 0; i < iterations; i++) {
    const slug = generateSlug();
    for (const char of slug) {
      charCounts[char]++;
    }
  }

  // Every character should have been used at least once in 8000 character samples (1000 * 8)
  // Probability of a character NOT being picked in 8000 trials with p=1/31 is (30/31)^8000, which is negligible.
  for (const char of allowedChars) {
    assert.ok(charCounts[char] > 0, `Character ${char} was never generated`);
  }
});
