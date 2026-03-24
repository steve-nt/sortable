# Testing Utilities

This folder encapsulates testing for all tracks, ensuring that no slop slips in and no regressions occur when developers merge components. 

## Included Tests

* `track_a.test.js`: Contains robust validations for Data Fetching & State using real Live Data (`all.json`). Employs Node's native `'node:test'` runner. Asserts missing weight sequestering logic & strict parsing.

## How to run tests

To run the unified testing suite, use the `node --test` framework directly on this folder from the project root:

```bash
# Run all tests natively
node --test tests/

# Run a specific track test directly
node --test tests/track_a.test.js
```
