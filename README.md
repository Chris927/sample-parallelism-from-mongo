# Purpose

Demonstrate how to limit parallelism when processing large collections queried
from MongoDB.

## Where to Start?

- Ensure mongo is available locally without authentication, or set environment
  variable `MONGO_URL` when running stuff.
- Node 4.x or higher is required.
- `npm install` to ensure local dependencies are installed.
- Run `node setup-sample-data.js` to setup some test data.
- Run `node index.js` to run the actual code.
- Read (and understand) the code.

## Questions

- Package `concurrent-transform` seems not ideal, as it operates "in batches".
  Is there a better alternative?
