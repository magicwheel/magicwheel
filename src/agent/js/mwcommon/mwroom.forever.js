define(function (require) {
	var q = require('contrib/q'),
		$ = require('jquery'),
		mwconfig = require('mwconfig');

	var RoomForever = function (_room) {

		var roomForever = {
			room: _room,

			run: function () {

				var room = roomForever.room;

				if (!room.peer) {
					return;
				}

				if (room.mode == 'PUBLIC') {

					if (room.peer.disconnected) {
						room.peer.reconnect();
					}

					if (!Object.keys(room.peer.connections).length) {
						room.peer.listAllPeers(function (peers) {
							peers.map(function (id) {
								if (id.indexOf(magicwheel.currentApp + '-') == 0) {
									room.connect(id);
								}
							});
						});
					}

					var answers = room.askAll({
						route: '/status/peers'
					});

					answers.map(function (answer) {
						answer.then(function (result) {
							result.answer.map(function (id) {
								if (id != room.peer.id && !room.peer.connections[id]) {
									room.connect(id);
								}
							});
						});
					});
				}
				
				for (id in room.peer.connections) {
					room.isPeerConnected(id).then(function (connected) {
//						console.log('+++++++isPeerConnected ID', id);
//						console.log('+++++++isPeerConnected RESULT', connected);
						if (!connected) {
							room.connect(id);
						}
					});
				};

				magicwheel.emit ? magicwheel.emit('forever') : true;
			}

		}
		return roomForever;
	}

	return RoomForever;
});