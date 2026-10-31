/**
 * LU32 — AI Integration Proof Slice (STARTER)
 * ------------------------------------------------------------
 * The AI SUGGESTS an incident severity. Your code CHECKS the answer.
 * If the answer is bad, a FALLBACK keeps things working.
 * The real severity only changes when a human APPROVES.
 *
 * Run it:  node index.js
 * No install, no API key. The "model" is a fake function below.
 *
 * You only fill in 3 tiny functions. Everything else is done for you.
 */

// ── The data (your "database"). The AI must NOT change `currentSeverity`. ──
const incident = {
  id: 'INC-482',
  title: 'Checkout latency spike after deploy v18.4',
  currentSeverity: 'MEDIUM',
  service: 'payments',
  reporterEmail: 'oncall@acme.example',   // private — do NOT send to the model
  internalToken: 'tok_secret_do_not_send' // private — do NOT send to the model
};
const timeline = [
  'Deploy v18.4 completed for payments',
  'Error rate rising in payments-checkout',
  'Retry queue depth increasing'
];

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// ── A fake "model". Change MODE to try each case. ──
// 'valid'  -> a good answer
// 'badEnum'-> an unknown severity ("URGENT")
// 'failed' -> the model failed (returns null)
const MODE = process.env.MODE || 'valid';
const PROMPT_VERSION = 'severity-suggestion-v1';
function fakeModel() {
  if (MODE === 'failed') return null;
  if (MODE === 'badEnum') return { suggestedSeverity: 'URGENT', reason: 'errors rising' };
  return { suggestedSeverity: 'HIGH', reason: 'errors rising after v18.4' };
}

// ============================================================
// TASK 1 — What is the model allowed to see?
// Return an object with only the safe fields (no secrets).
// ============================================================
function buildContext() {
  return {
    title: incident.title,
    currentSeverity: incident.currentSeverity,
    service: incident.service,
    timeline: [...timeline]
  };
}

// ============================================================
// TASK 2 — Is the answer safe to use?
// Return true only if suggestedSeverity is one of SEVERITIES
// AND there is a non-empty reason.
// ============================================================
function isValid(answer) {
  return answer !== null && typeof answer === 'object' && !Array.isArray(answer)
    && Object.keys(answer).length === 2
    && Object.keys(answer).every(key => ['suggestedSeverity', 'reason'].includes(key))
    && SEVERITIES.includes(answer.suggestedSeverity)
    && typeof answer.reason === 'string' && answer.reason.trim().length > 0;
}

// ============================================================
// TASK 3 — What does the user see when the model fails or is invalid?
// Return a short message so the workflow still makes sense.
// ============================================================
function fallback() {
  return {
    status: 'MANUAL_REVIEW',
    message: 'AI suggestion unavailable. Review the incident and select severity manually; the current severity is unchanged.'
  };
}

// ── Given to you: runs one request start to finish. ──
function run() {
  console.log('Prompt version:', PROMPT_VERSION);
  console.log('Context sent to model:', buildContext());

  const answer = fakeModel();

  if (!answer || !isValid(answer)) {
    console.log('Result:', fallback());
    return;
  }

  console.log('AI suggests:', answer.suggestedSeverity, '(not applied yet)');
  console.log('Real severity is still:', incident.currentSeverity);

  if (process.argv.includes('--approve')) {
    // Explicit approval is the only path that changes the in-memory record.
    incident.currentSeverity = answer.suggestedSeverity;
    console.log('After human approval:', incident.currentSeverity);
  } else {
    console.log('Status: PENDING_APPROVAL. Re-run with --approve after reviewing the suggestion.');
  }
}

if (require.main === module) run();
module.exports = { buildContext, isValid, fallback };
