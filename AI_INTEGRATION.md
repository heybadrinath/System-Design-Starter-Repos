# AI integration proof slice

This completes the root starter for System Design 3.11. It uses the supplied fake model and in-memory incident, so no install, provider account or API key is required. It does not call a live LLM or write to a production database.

## Run

Requires Node.js 18 or newer.

```sh
node index.js
MODE=badEnum node index.js
MODE=failed node index.js
node index.js --approve
node --test test/proof-slice.test.js
```

The default run shows a valid HIGH suggestion while the incident stays MEDIUM. The separate `--approve` argument simulates an explicit human approval. Invalid and failed outputs always take the manual-review path, including when that flag is present.

## Boundaries

`buildContext()` allowlists the title, current severity, service and a copied timeline. Reporter email and the internal token remain outside model context. `isValid()` runs at runtime: it checks the exact two-field contract, the severity enum and a non-blank text reason. Unknown keys are rejected. `fallback()` explains that a person must review the incident and that its severity has not changed.

The model proposes; it does not own the record. Validation permits a suggestion to be displayed, not automatically committed. Prompt version `severity-suggestion-v1` is logged with the run. The incident snapshot and timeline are the context sources.

## Data-model link and limitation

The real incident's `currentSeverity` is distinct from the proposal's `suggestedSeverity`. A persistent implementation would store the proposal with incident ID, prompt version, reviewer and approval time separately from the incident record.

This demonstration validates shape but does not prove that a well-formed reason is true. Production use also needs grounded-evidence checks, authenticated reviewer authorization, freshness/version checks before commit, provider timeouts and an audit trail. The CLI approval flag demonstrates the boundary; it is not production authentication.
