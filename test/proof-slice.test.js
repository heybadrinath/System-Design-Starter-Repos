const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { buildContext, isValid, fallback } = require('../index');

test('model context is an allowlisted copy without private fields', () => {
  const context = buildContext();
  assert.deepEqual(Object.keys(context), ['title', 'currentSeverity', 'service', 'timeline']);
  assert.equal(JSON.stringify(context).includes('oncall@'), false);
  assert.equal(JSON.stringify(context).includes('tok_secret'), false);
  context.timeline.push('untrusted change');
  assert.equal(buildContext().timeline.includes('untrusted change'), false);
});

test('runtime validator accepts valid output and rejects malformed or widened output', () => {
  assert.equal(isValid({ suggestedSeverity: 'HIGH', reason: 'Error rate increased' }), true);
  for (const output of [null, [], 'HIGH', {},
    { suggestedSeverity: 'URGENT', reason: 'Errors' },
    { suggestedSeverity: 'HIGH', reason: ' ' },
    { suggestedSeverity: 'HIGH', reason: 7 },
    { suggestedSeverity: 'HIGH', reason: 'Errors', autoApprove: true }]) {
    assert.equal(isValid(output), false);
  }
});

test('fallback is actionable and preserves the existing record', () => {
  assert.equal(fallback().status, 'MANUAL_REVIEW');
  assert.match(fallback().message, /unchanged/);
});

function execute(mode, args = []) {
  return execFileSync(process.execPath, [path.join(__dirname, '..', 'index.js'), ...args], {
    env: { ...process.env, MODE: mode }, encoding: 'utf8'
  });
}

test('valid suggestion stays pending until explicit approval', () => {
  const pending = execute('valid');
  assert.match(pending, /Real severity is still: MEDIUM/);
  assert.match(pending, /PENDING_APPROVAL/);
  assert.doesNotMatch(pending, /After human approval/);
  assert.match(execute('valid', ['--approve']), /After human approval: HIGH/);
});

test('invalid and failed model outputs take the manual path even with approval', () => {
  for (const mode of ['badEnum', 'failed']) {
    const output = execute(mode, ['--approve']);
    assert.match(output, /MANUAL_REVIEW/);
    assert.doesNotMatch(output, /After human approval/);
    assert.doesNotMatch(output, /tok_secret|oncall@/);
  }
});
