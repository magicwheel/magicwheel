define(function (require) {
    var q = require('contrib/q'),
        $ = require('jquery'),
        mwconfig = require('mwconfig'),
        RoomForever = require('mwcommon/mwroom.forever');

    require('mwcommon/mwroom.status');
    require('contrib/peer');
    require('contrib/jquery.cookie');
    require('contrib/events');

    var Room = function () {
        var room = {
            id: '',
            peer: null,
            status: 'IDLE', //IDLE,CREATING,CREATED
            mode: 'PUBLIC', //PUBLIC, PRIVATE(disconnected from peer server)
            creatingDate: null, //time when tried to connect
            askDeferreds: {},
            createDeferred: null,
            pendingConnections: {},
			latencies: {},

            _createPeer: function (id) {
                var deferred = q.defer();

                if (room.peer) {
                    room.peer.destroy();
                    delete(room.peer);
                }

                peer = new Peer(id, {
                    host: mwconfig.peerjsHost ? mwconfig.peerjsHost : window.location.hostname,
                    port: mwconfig.peerjsPort,
                    path: '/peerjs'
                });

                peer.on('open', function (id) {
                    room.status = 'CREATED';
                    deferred.resolve(peer);
                });
                peer.on('error', function (err) {
                    deferred.reject('Signaling server error - ' + err.message);
                });

                // Await connections from others
                peer.on('connection', MASTER_connect);

                // Handle a connection object.
                function MASTER_connect(c) {
                    console.log('peer connected to slave', c);

                    registerConnectionEvents(c);
                }

                return deferred.promise;
            },

            // returns room
            create: function (id) {
                console.log('@room.create - current status: ' + room.status);

                if (room.status == 'CREATING' && (Date.now() - room.creatingDate < 3000)) {
                    return room.createDeferred;
                }

                room.status = 'CREATING';

                room.creatingDate = Date.now();

                var deferred = q.defer();

                if (room.peer) {
                    room.peer.destroy();
                }

                room.createDeferred = deferred;

                room.id = id;

                var slaveId = magicwheel.currentApp + '-' + $.cookie('magicWheelClientIP') + '-' + Math.random().toString(36).substr(2);

                slaveId = slaveId.replace(/\./g, 'x');

                room._createPeer(slaveId).then(function (_peer) {
                    room.peer = _peer;

                    deferred.resolve(room);
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },

            connect: function (id) {
                if (id == peer.id) {
                    return;
                }

                var pending = room.pendingConnections[id];

                if (pending && pending.date > Date.now() - 5000) {
                    console.log('****** skipping ' + id);
                    return pending.promise;
                }

                console.log('***** CONNECT ' + id);

                var deferred = q.defer();

                room.pendingConnections[id] = {
                    date: Date.now(),
                    promise: deferred.promise
                }

                if (peer.connections[id] && !peer.connections[id][0].open) {
                    delete(peer.connections[id]);
                }

                if (!peer.connections[id]) {
                    var dataConnection = SLAVE_peerConnect(id);
                    deferred.resolve(dataConnection);
                } else {
                    room.isPeerConnected(id).then(function (connected) {
                        if (connected) {
                            deferred.resolve(peer.connections[id][0]);
                        } else {
                            console.log('****** RECONNECT ******* ' + id);

                            delete(peer.connections[id]);

                            return room.connect(id);
                        }
                    });
                }

                return deferred.promise;
            },

            sendAll: function (data) {
                for (k in peer.connections) {
                    room.send(k, data);
                }
            },

            send: function (id, data) {
                if (peer != null && peer.connections[id]) {

                    peer.connections[id].map(function (c, index) {
                        var i = index;
                        if (c.open) {
                            c.send(data);
                        } else {
                            //                            console.log('removing closed connection');
                            //                            c.close();
                            //                            peer.connections[id].splice(index);
                            //                            room.send(id, data);
                        }
                    });
                }
            },

            ask: function (id, data) {
                var askId = Math.random();

                data.askId = askId;

                var askDeferred = q.defer();

                room.askDeferreds[askId] = askDeferred;

                setTimeout(function () {
                    delete(room.askDeferreds[askId]);
                }, 10000);

                room.send(id, data);

                return askDeferred.promise;
            },

            askAll: function (data) {
                var result = [];

                for (k in peer.connections) {
                    result.push(room.ask(k, data));
                }

                return result;
            },

            answer: function (askId, result, caller) {
                room.send(caller, {
                    answerId: askId,
                    result: result
                });
            },

            isPeerConnected: function (id, deferred) {
                if (!deferred) {
                    deferred = q.defer();
                }

                var answered = false;

				var time = Date.now();
				
                room.ask(id, {
                    route: '/status/ping'
                }).then(function () {
                    answered = true;
					
					room.latencies[id] = Math.ceil((Date.now() - time) / 2) + 'ms';
                    
					deferred.resolve(true);
                });

                setTimeout(function () {
                    if (!answered) {
						room.latencies[id] = '-';
                        //                delete(room.peer.connections[id]);
                        deferred.resolve(false);
                    }
                }, 3000);

                return deferred.promise;
            },

            goPrivate: function (ids) {
                room.mode = 'PRIVATE';

                room.peer.disconnect();

                for (k in peer.connections) {
                    if (!ids || ids.indexOf(k) == -1) {
                        peer.connections[k].map(function (dataConnection) {
                            dataConnection.close();
                        });
                    }
                }
            },

            goPublic: function (disconnectAll) {
                disconnectAll ? room.goPrivate() : null; 

                room.mode = 'PUBLIC'; //forever.run will do the rest...
            }

        }

        setInterval(RoomForever(room).run, 1000);

        room.__proto__ = EventEmitter.prototype;

        return room;

        function SLAVE_peerConnect(id) {
            var c = peer.connect(id, {
                label: 'magicwheel',
                //                serialization: 'json',
                reliable: false,
                metadata: {
                    message: 'SLAVE CALLING'
                }
            });
            c.on('open', function () {
                console.log('peer connected to master', c);

                room.createDeferred.resolve(room);
            });

            registerConnectionEvents(c);
        }

        function execute(route, data, caller, room) {
            if (data.answerId) {
                room.askDeferreds[data.answerId].resolve({
                    answer: data.result,
                    caller: caller
                });
                return;
            }

            var promise = magicwheel.executeRoute(route, data, caller, room);

            if (data.askId) {
                if (promise.then) {
                    promise.then(function (result) {
                        room.answer(data.askId, result, caller);
                    });
                }
            }

        }

        function registerConnectionEvents(c) {
            c.on('data', function (data) {
                execute(data.route, data, c.peer, room); //.then(
            });

            c.on('close', function () {
                console.log('peer disconnected', c);

                room.emit('peer-disconnected', c);

                delete room.peer.connections[c.peer];
            });

            c.on('error', function (err) {
                console.log('peer connection error', err);
            });
        }

    }

    return Room;
});