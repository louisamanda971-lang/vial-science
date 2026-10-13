import test from 'node:test';
import assert from 'node:assert/strict';

test('email validation pattern accepts a basic valid address', () => {
  const validEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
  assert.equal(validEmail('reader@example.com'), true);
  assert.equal(validEmail('not-an-email'), false);
  assert.equal(validEmail(''), false);
});

test('marketing consent is an explicit boolean in the API contract', () => {
  const toConsent = value => value === true || value === 'true' || value === 'on';
  assert.equal(toConsent(true), true);
  assert.equal(toConsent(false), false);
  assert.equal(toConsent(undefined), false);
});
