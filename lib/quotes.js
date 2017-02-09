const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const mongo = require('mongodb').MongoClient;

// default to a 'localhost' configuration:
var connection_string = '127.0.0.1:27017/starwars';
// if OPENSHIFT env variables are present, use the available connection info:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
    process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
    process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
    process.env.OPENSHIFT_APP_NAME;
}

var $db = null;

// Connect to the db
mongo.connect('mongodb://' + connection_string, function(err, db){
  if(err) { return console.dir(err); }
  console.log('mongo ok');
  $db = db;
});

function getQuote() {
  return new Promise(function(resolve, reject) {
    //var count = $db.collection('quotes').count();
    //console.log('count', count);
    //var rand = function(){return Math.floor( Math.random() * count )};
    //var doc = $db.collection('quotes').find().limit(1).skip(rand());
    //$db.collection('quotes').find().limit(10)
    $db.collection('quotes').aggregate([ { $sample: { size: 1 } } ]).toArray(function(err, docs) {
      if (!err) {
        resolve(docs);
      }
      else {
        reject(err);
      }
    });
  });
}

function route() {
  var router = new express.Router();
  router.use(cors());
  router.use(bodyParser());

  // GET REST endpoint - query params may or may not be populated
  router.get('/', function(req, res) {
    if (!$db) {
      res.status(404).json({msg: 'DB not ready, try later'});
    }

    getQuote()
    .then(function (quote) {
      res.json({success: true, quote: quote});
    })
    .catch(function (err) {
      res.status(500).json({success: false, err: err});
    });
  });

  return router;
}

module.exports = route;
