var Agent = require('http').Agent;
var URL   = require('url');
var util  = require('util');
var Q     = require('q');
var http  = require('q-io/http');


module.exports = Qouch;
Qouch.QouchRequestError = QouchRequestError;
Qouch.QouchBulkError = QouchBulkError;

function Qouch(url,httpAgent,auth) {
  this.url = url;
  this.serverURL = url.match(/^.*\/(?=[^/]+\/?$)/)[ 0 ];
  this.httpAgent = httpAgent || http.globalAgent;
  this.auth = auth;
}

Qouch.prototype.allDocs = function ( params ) {
  params = params || {};
  params.include_docs = true;

  return this.request('GET', '_all_docs' + genQueryString(params))
  .then(function(body) {
    return body.rows.map(function(row) { return row.doc; });
  });
};

Qouch.prototype.designDocs = function () {
  return this.allDocs({
    startkey: '_design/',
    endkey: '_design0'
  });
};

Qouch.prototype.view = function(design, view, params) {
  var method;
  var body;

  if (params) {
    if (params.keys)
    {
      method = 'POST';
      body = { keys: params.keys };
      delete params.keys;
    } 
    else if (params.rootKey)
    {
      params.startkey = params.rootKey;
      params.endkey = params.rootKey.concat({});
      delete params.rootKey;
    }
  }

  if (!method) method = 'GET';
  var path = util.format('_design/%s/_view/%s%s', design, view, genQueryString(params));
  return this.request(method, path, body)
  .then(function(body) {
    return body.rows;
  });
};

Qouch.prototype.viewDocs = function(design, view, params) {
  if (!params) params = {};
  params.reduce = false;
  params.include_docs = true;

  return this.view(design, view, params)
  .then(function(rows) {
    return rows.map(function(row) {
      return row.doc;
    });
  });
};

Qouch.prototype.request = function(method, path, body) {
  var opts = {
    method: method,
    url: path ? util.format('%s/%s', this.url, path) : this.url,
    headers: {
      'content-type': 'application/json',
      'accepts': 'application/json',
      'Authorization': 'Basic '+ this.auth
    },
    agent: this.httpAgent
  };
  if (body) opts.body = [ JSON.stringify(body) ];

  return http.request(opts)
  .then(function(res) {
    return Q.post(res.body, 'read', [])
    .then(function(buffer) {
      if ( isNaN(res.status) || res.status >= 400 ) {
        var msg = util.format('HTTP request failed with code %s  %s', res.status, buffer && buffer.toString().trim() )
        throw new QouchRequestError(msg, res && res.status, opts, res);
      }
      return JSON.parse(buffer.toString());
    });
  });
};

function QouchRequestError ( message, statusCode, requestOptions, response) {
  this.message = message;
  this.httpStatusCode = statusCode;
  this.requestOptions = requestOptions;
  this.response = response;
}
QouchRequestError.prototype = new Error();
QouchRequestError.prototype.constructor = QouchRequestError;

function QouchBulkError ( dbURL, itemErrors, requestBody ) {
  this.message = 'Bulk Errors';
  this.dbURL = dbURL;
  this.itemErrors = itemErrors;
  this.requestBody = requestBody;
}
QouchBulkError.prototype = new Error();
QouchBulkError.prototype.constructor = QouchBulkError;

function genQueryString ( params ) {
  var keys = params ? Object.keys(params) : [];
  return keys.reduce(function ( qs, key, i ) {
    return qs + ( i ? '&' : '?' ) + key + '=' + encodeURIComponent(JSON.stringify(params[ key ]));
  }, '');
}





exports = module.exports = function (db,user,pass,callback) {
  if(typeof user === 'string'  && typeof pass === 'string' )
  {
    var base64 = Buffer.from(user + ":" + pass).toString('base64');
  }
  else
  {
    var base64 = 'none';
  }
  let infinity = Math.min();
  let couchdb = typeof db === 'string' ? new Qouch(db, new Agent({ maxSockets: infinity }),base64) : db;
  let cb = typeof callback === 'function' ? callback : (void 0);
  return get_views(couchdb).then(call_views.bind(null, couchdb)).then(function success () {
    cb && cb();
  })
  .fail(function (err) {
    if(cb)
    {
      return cb(err);
    }
    throw err;
  });
};


function get_views (db) {
  return db.designDocs().then(function (designDocs) {
    return designDocs.reduce(function (arr,doc) {
      let _name = doc._id.match(/^_design\/(.*)/)[ 1 ];
      let _view = doc.views && Object.keys(doc.views)[ 0 ];
        arr.push({
          _design: _name,
          _view  : _view
        });
      return arr;
    }, []);

  });
}


function call_views ( db,tasks) {
  var deferred = Q.defer();
  var databaseName = db.url.match(/\/([^/]+)\/?$/)[ 1 ];
  for(let i in tasks)
  {
    if(tasks[i]['_design'] && tasks[i]['_view'])
    {
      console.log('view request : ' + db['url'] + '/' +tasks[i]['_design'] + '/' + tasks[i]['_view']); 
      db.view(tasks[i]['_design'],tasks[i]['_view'], { limit: 1, reduce: false });
    }
  }
  return deferred.promise;
}
