# Test Suite

The project uses Node's built-in test runner (`node:test`) with no external test framework dependency.

## Included Tests

- `track_a.test.js`
	- Uses live API data to verify normalization, filtering, sorting, pagination, and state notifications.

- `audit_reference.test.js`
	- Uses deterministic fixture data to verify audit-style acceptance behaviors:
		- interactive-like search expectations
		- field-specific searches
		- supported operators
		- separate powerstats columns in main table
		- no static asc/desc labels in headers (active column only)
		- missing values sorted last
		- required table columns in `index.html`

## Commands

```bash
# Run all tests
npm test

# Run all test files directly with Node
node --test tests/*.test.js

# Run one file
node --test tests/audit_reference.test.js
```
