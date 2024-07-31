# Couchdb View Indexer

![logo](https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/CouchDB.svg/290px-CouchDB.svg.png)

## License
GNU General Public License v3.0 -

## What is Couchdb View Indexer?
Index all couchdb views

Source forked from  https://github.com/mammaldev/couchdb-indexer



### Usage

```javascript
//var i = require('couchdb-view-indexer');
var i = require('./index.js');
i("http://127.0.0.1:5984/MYDB",'USER','PASS', function (err) {
  console.log(err);
});

```



