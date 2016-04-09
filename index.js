var MongoDB = require('mongodb');
var async = require('async');
var parallel = require('concurrent-transform');
var Transform = require('stream').Transform;
var Writable = require('stream').Writable;
var util = require('util');

var numInflight = 0, numProcessed = 0;
function doPotentiallyAsyncWork(doc, callback) {
  console.log('numInflight', ++numInflight, 'numProcessed', numProcessed);
  setTimeout(function() {
    --numInflight;
    ++numProcessed;
    callback(null);
  }, 200);
}

MongoDB.MongoClient.connect(process.env.MONGO_URL || 'mongodb://localhost/parallel-test', function(err, db) {
  if (err) throw err;

  var cursor = db.collection('threads').find({});
  var stream = cursor.stream();
  var nProcessing = 0;

  var transform = new Transform({
    transform: function(chunk, encoding, next) {
      console.log('transform', chunk);
      doPotentiallyAsyncWork(chunk, function(err) {
        console.log('processed data (simulated with a delay)', chunk);
        next();
      });
    },
    flush: function(done) {
      console.log('flush')
      this.push(); // TODO: necessary?
      done();
    },
    objectMode: true
  });

  stream.pipe(parallel(transform, 1000));

  stream.on('data', function(data) {
    // console.log('got data', data);
  });

  stream.on('end', function() {
    console.log('stream end');
    db.close(); // do *not* close the database connection here, if the database `db` is re-used somewhere
  })

});
