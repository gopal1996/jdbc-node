var JDBC = require('jdbc');

const path = require('path');

// require('dotenv').config();

// const boxV2 = require('./box.model')

var jinst = require('jdbc/lib/jinst');

const { Readable } = require('stream');

const { Parser, AsyncParser, parseAsync,Transform } = require('json2csv');

// var jsontocsv = require('jsontocsv');

var asyncjs = require('async');

var fs = require('fs');

const { createReadStream, createWriteStream } = require('fs');

 

if (!jinst.isJvmCreated()) {

jinst.addOption("-Xrs");

jinst.setupClasspath(['./drivers/ojdbc8.jar']);

}

 

var config = {
  // Required
  url: "jdbc:oracle:thin:@database.cvrthot5jvnq.us-east-1.rds.amazonaws.com:1521:orcl",

  // Optional
  drivername: "oracle.jdbc.OracleDriver",
  minpoolsize: 100,
  maxpoolsize: 10000,

  // Note that if you sepecify the user and password as below, they get
  // converted to properties and submitted to getConnection that way.  That
  // means that if your driver doesn't support the 'user' and 'password'
  // properties this will not work.  You will have to supply the appropriate
  // values in the properties object instead.
  user: "admin",
  password: "awssql12345",
  properties: {}
};

function executeQuery(res, filename, query) {

  var orcldb = new JDBC(config);

 

orcldb.initialize(function(err) {
  if (err) {
    console.log(err);
  }
});

 

orcldb.reserve(function(err, connObj) {
  // The connection returned from the pool is an object with two fields
  // {uuid: <uuid>, conn: <Connection>}
  if (connObj) {
    console.log("Using connection: " + connObj.uuid);
    // Grab the Connection for use.
    var conn = connObj.conn;
  
    // Adjust some connection options.  See connection.js for a full set of
    // supported methods.
    asyncjs.series([
      function(callback) {
        conn.setAutoCommit(false, function(err) {
          if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      }
    ], function(err, results) {
      // Check for errors if need be.
      // results is an array.
    });
  
    // Query the database.
    asyncjs.series([
      function(callback) {
        // Select statement example.
        conn.createStatement(function(err, statement) {
          if (err) {
            callback(err);
          } else {
            // Adjust some statement options before use.  See statement.js for
            // a full listing of supported options.
            statement.setFetchSize(60000, function(err) {
              if (err) {
                callback(err);
              } else {
                statement.executeQuery(query,
                                        function(err, resultset) {
                  if (err) {
                    callback(err)
                  } else {
                    resultset.toObjArray(function(err, results) {
                        callback(null, results);
                    });
                  }
                });
              }
            });
          }
        });
      }
    ], function(err, results) {
      // Results can also be processed here.
      try {
        // let data = new Promise.resolve("completed");
        
        const input = new Readable({ objectMode: true });
        const output = createWriteStream(filename, { encoding: 'utf8' });
        
        input.push(results); // This data might come from an HTTP request, etc.

        input.push(null);

        const opts = {};

        const transformOpts = { objectMode: true };

        const json2csv = new Transform(opts, transformOpts);
        const processor = input.pipe(json2csv).pipe(output);
        console.log("Completed")
        res.send("Completed");
        
      } catch(err) {
        console.log(err);
      }
      // Release the connection back to the pool.
      orcldb.release(connObj, function(err) {
        if (err) {
          console.log(err.message);
        }
      });
    });
  }
});

}
 



module.exports = {
  executeQuery: executeQuery
};