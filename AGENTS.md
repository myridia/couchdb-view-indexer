# AGENTS.md — couchdb-view-indexer

## What this is
Node.js npm module that automatically indexes all CouchDB views on a database. Fork of mammaldev/couchdb-indexer.

## Stack
- Node.js
- CouchDB HTTP API
- q, q-io (promises)

## Build
```bash
npm install
```

## Run
```js
var i = require('./index.js');
i("http://127.0.0.1:5984/MYDB", 'USER', 'PASS', function (err) { console.log(err); });
```
```bash
node example.js
```

## Structure
- `index.js` — main module (view indexing)
- `example.js` — usage example
- `package.json` — npm metadata/deps

## Conventions
- No comments in code unless asked.
- No credentials in committed files.
- Verify: `node -c index.js`