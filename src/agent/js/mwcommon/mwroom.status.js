define(function (require) {
    var q = require('contrib/q')
    $ = require('jquery');


    function peersStatus(data, caller, room) {
        var deferred = q.defer();

        var ids = [];

        for (k in peer.connections) {
            if (peer.connections[k].length == 0) {
                delete(peer.connections[k]);
            } else {
                if (peer.connections[k][0].open) {
                    ids.push(room.peer.connections[k][0].peer);
                }
            }
        }

        deferred.resolve(ids);

        return deferred.promise;
    }

    function pingStatus(data, caller, room) {
        var deferred = q.defer();

        deferred.resolve(true);

        return deferred.promise;
    }

    var routes = {
        '/status/peers': {
            controller: peersStatus
        },
        '/status/ping': {
            controller: pingStatus
        }
    }

    $.extend(true, magicwheel.routes, routes);

    return {
        routes: routes
    }
});