var MongoDB = require('mongodb');
var async = require('async');
var parallel = require('concurrent-transform');
var Transform = require('stream').Transform;
var Writable = require('stream').Writable;
var util = require('util');

function doPotentiallyAsyncWork(doc, callback) {
  setTimeout(function() {
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
      var self = this;
      doPotentiallyAsyncWork(chunk, function(err) {
        console.log('processed data (simulated with a delay)', chunk);
        self.push(chunk);
        next();
      });
    },
    flush: function(done) {
      console.log('flush')
      this.push('done');
      this.push();
      done();
    },
    objectMode: true
  });

  stream.pipe(transform).pipe(new Writable({
    write: function(chunk, encoding, next) {
      console.log('chunk', chunk);
      next();
    },
    objectMode: true
  }));

  stream.on('data', function(data) {
    console.log('got data', data);
  });

  stream.on('end', function() {
    console.log('stream end');
    db.close(); // do *not* close the database connection here, if the database `db` is re-used somewhere
  })

});
