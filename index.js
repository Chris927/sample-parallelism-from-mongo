var MongoDB = require('mongodb');
var parallel = require('concurrent-transform');
var Transform = require('stream').Transform;

var numInflight = 0, numProcessed = 0;
function doPotentiallyAsyncWork(doc, callback) {
  ++numInflight; // unnecessary, just doing this to get stats on the console
  setTimeout(function() { // simulating some (potentially async) processing
    console.log('numInflight', numInflight--, 'numProcessed', ++numProcessed); // equally unnecessary
    callback(null); // as usual, if an error occurred, call the callback with anything truthy
  }, 200);
}

MongoDB.MongoClient.connect(process.env.MONGO_URL || 'mongodb://localhost/parallel-test', function(err, db) {

  if (err) throw err;

  var cursor = db.collection('myDocuments').find({}); // use whatever query expression is needed (instead of `{}`)

  // we need the stream interface of MongoDB
  // (http://mongodb.github.io/node-mongodb-native/2.1/api/Cursor.html#stream)
  var stream = cursor.stream();

  // the transformer, implementing part of Node's stream API, which will be
  // called for each document of the query result
  var transform = new Transform({
    // `transform` will be called for each document. Here, any async processing can happen,
    // but it's essential to call `next()` once everything is done.
    transform: function(data, encoding, next) {
      doPotentiallyAsyncWork(data, function(err) {
        console.log('processed data (simulated with a delay)', data);
        next(err);
      });
    },
    flush: function(done) {
      console.log('flush'); // we know we are done now
      done();
    },
    objectMode: true // necessary, see https://nodejs.org/api/stream.html#stream_api_for_stream_implementors
  });

  // pipe the stream (of documents) into the transformer. We use `parallel()`
  // to ensure we handle up to N result documents in parallel (but not more).
  var N = 100;
  stream.pipe(parallel(transform, N));

  stream.on('end', function() {
    console.log('stream end');
    db.close(); // do *not* close the database connection here, if the database `db` is re-used somewhere
  });

  transform.on('error', function() {
    console.log('an error occurred');
  })

});
