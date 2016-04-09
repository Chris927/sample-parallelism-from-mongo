var MongoDB = require('mongodb');
var async = require('async');

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

  stream.on('data', function(data) {
    stream.pause();
    console.log('got data', data);
    doPotentiallyAsyncWork(data, function(err) {
      console.log('processed data (simulated with a delay)', data);
      stream.resume();
    });
  });

  stream.on('end', function() {
    console.log('stream end');
    db.close(); // do *not* close the database connection here, if the database `db` is re-used somewhere
  })

});
