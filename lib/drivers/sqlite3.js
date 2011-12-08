
var Driver = require('../driver');
var Connection = require('../connection');
var sqlite3 = require('sqlite3').verbose();

var Sqlite3Driver = Driver.extend({
  init: function() {
    this._super();
  },

  connect: function(opts, callback) {
    var filename = opts.filename;
    if(!filename) throw new Error("Sqlite3 driver requires 'filename'");
    var trace = opts.trace;

    var db = new sqlite3.Database(filename);
    if(trace) {
      db.on('trace', function(sql) {
        console.log(sql);
      });
    }
    var connection = new Sqlite3Connection(this, db);
    callback(null, connection);
  }
});

var Sqlite3Connection = Connection.extend({
  init: function(driver, db) {
    this._super(driver);
    this.db = db;
  },

  close: function() {
    this.db.close();
  },

  beginTransaction: function(callback) {
    this.runSql("BEGIN TRANSACTION", callback);
  },

  commitTransaction: function(callback) {
    this.runSql("COMMIT TRANSACTION", callback);
  },

  rollbackTransaction: function(callback) {
    this.runSql("ROLLBACK TRANSACTION", callback);
  },

  runSql2: function(sql, callback) {
    this.db.run(sql, function(err) {
      if(err) { callback(err); return; }
      callback(null, {});
    });
  },

  runSql3: function(sql, values, callback) {
    stmt = this.db.prepare(sql, function(err) {
      if(err) callback(err);
    });
    stmt.run(values, function(err) {
      if(err) { callback(err); return; }
      callback(null, {
        lastId: stmt.lastID,
        changes: stmt.changes
      });
    });
    stmt.finalize();
  },

  runSql: function() {
    var stmt;
    if(arguments.length == 2) { // sql, callback
      this.runSql2(arguments[0], arguments[1]);
    } else if(arguments.length == 3) { // sql, values, callback
      this.runSql3(arguments[0], arguments[1], arguments[2]);
    }
  },

  runSqlAll: function(sql, params, callback) {
    this.db.all(sql, params, callback);
  },

  runSqlEach: function(sql, params, callback, doneCallback) {
    this.db.each(sql, params, callback, doneCallback);
  }
});

module.exports = Sqlite3Driver;