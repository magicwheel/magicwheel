define(function (require) {
    var q = require('contrib/q'),
        Nedb = require("contrib/nedb");

    var dbs = {};

    function getOrCreateDb(dbname) {
        return dbs[dbname] ? dbs[dbname] : cretaDb(dbname);
    }

    function cretaDb(dbname) {
        var db = new Nedb();
        dbs[dbname] = db;
        return db;
    }

    var MWDB = {
        init: function(dbname){
            getOrCreateDb(dbname);
        },
        insert: function (dbname, obj) {
            var deferred = q.defer();

            obj.created = Date.now();

            obj.findUpdateMarker = 0;

            getOrCreateDb(dbname).insert(obj, function (err, doc) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(doc);
                }
            });

            return deferred.promise;
        },
        find: function (dbname, selector) {
            var deferred = q.defer();

            if (!dbs[dbname]) {
                deferred.reject('mwdb:find: db ' + dbname + ' does not exist');
            } else {
                dbs[dbname].find(selector, function (err, docs) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve(docs);
                    }
                });
            }

            return deferred.promise;
        },
        update: function (dbname, selector, set) {
            var deferred = q.defer();

            if (!dbs[dbname]) {
                deferred.reject('mwdb:update: db ' + dbname + ' does not exist');
            } else {
                set.updated = Date.now();
                dbs[dbname].update(selector, {
                    $set: set
                }, {
                    multi: true
                }, function (err, numReplaced) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve(numReplaced);
                });
            }
            return deferred.promise;
        },
        remove: function (dbname, selector) {
            var deferred = q.defer();

            if (!dbs[dbname]) {
                deferred.reject('mwdb:remove: db ' + dbname + ' does not exist');
            } else {
                dbs[dbname].remove(selector, {
                    multi: true
                }, function (err, numRemoved) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    deferred.resolve(numRemoved);
                });
            }
            return deferred.promise;
        },
        findUpdate: function (dbname, selector, set) {
            var deferred = q.defer();
            
            var rand = Math.random();

            if (!dbs[dbname]) {
                deferred.reject('mwdb:findUpdate: db ' + dbname + ' does not exist');
            } else {
                set.updated = Date.now();
                set.findUpdateMarker = rand;
                dbs[dbname].update(selector, {
                    $set: set
                }, {
//                    multi: true
                }, function (err, numReplaced) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    if(numReplaced == 0){
                        deferred.resolve(null);
                        return;
                    }
                    MWDB.find(dbname, {findUpdateMarker: rand}).then(function(results){
                        deferred.resolve(results[0]);
                    });
//                    deferred.resolve(numReplaced);
                });
            }
            return deferred.promise;
        }
    };
    
    return MWDB;
});