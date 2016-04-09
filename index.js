var MongoDB = require('mongodb');
var parallel = require('concurrent-transform');
var Transform = require('stream').Transform;

var numInflight = 0, numProcessed = 0;
function doPotentiallyAsyncWork(doc, callback) {
  ++numInflight;
  setTimeout(function() {
    console.log('numInflight', numInflight--, 'numProcessed', ++numProcessed);
    callback(null); // as usual, if an error occurred, call the callback with anything truthy
  }, 200);
}

MongoDB.MongoClient.connect(process.env.MONGO_URL || 'mongodb://localhost/parallel-test', function(err, db) {

  if (err) throw err;

  var cursor = db.collection('threads').find({}); // use whatever query expression is needed (instead of `{}`)

  // we need the stream interface of MongoDB
  // (http://mongodb.github.io/node-mongodb-native/2.1/api/Cursor.html#stream)
  var stream = cursor.stream();

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
      console.log('flush')
      this.push(); // TODO: necessary?
      done();
    },
    objectMode: true
  });

  stream.pipe(parallel(transform, 100));

  stream.on('end', function() {
    console.log('stream end');
    db.close(); // do *not* close the database connection here, if the database `db` is re-used somewhere
  });

  transform.on('error', function() {
    console.log('an error occurred');
  })

});
