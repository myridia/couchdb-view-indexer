//var i = require('couchdb-view-indexer');
var i = require('./index.js');
i("http://127.0.0.1:5984/MYDB",'USER','PASS', function (err) {
  console.log(err);
});



