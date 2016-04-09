var MongoDB = require('mongodb');
var async = require('async');
var crypto = require('crypto');

MongoDB.MongoClient.connect(process.env.MONGO_URL || 'mongodb://localhost/parallel-test', function(err, db) {
  if (err) throw err;

  var N = 5000;
  var docs = [];
  for (var i = 0; i < N; i++) {
    docs.push({
      someValue: crypto.randomBytes(12).toString('hex'),
      when: new Date()
    });
  }

  db.collection('threads').deleteMany({}, null, function(err, result) {
    if (err) throw err;
    console.log('removed all documents from "threads".');
    db.collection('threads').insertMany(docs, function(err, docs) {
      console.log('inserted many documents into "threads".');
      db.close();
    });
  });
});
