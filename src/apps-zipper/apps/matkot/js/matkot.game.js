//# sourceURL=matkot.game.js

var MAX_SLOWNESS = 6,
	TIMEOUT = 3000;


var Game = function (controls) {

	var game = {

		model: {},

		lastSend: Date.now(),

		strikeTime: null,

		strikeMyTime: null,

		horizontalHit: false,

		reset: function () {
			game.model = {
				active: false,
				disconnected: false,
				waitingForStrike: false,
				hisName: '',
				slowness: MAX_SLOWNESS,
				score: -1,
				hiScore: 0,
				left: 120,
				right: 120,
				ballX: 10,
				ballY: 145,
				baller: 'left',
				ballMoveX: 0,
				ballMoveY: 0,
				myRole: 'right', //left,right
				strike: {
					time: 0,
					x: 0,
					y: 0
				}
			}
		},

		routeSetModel: function (inputObj, caller, room, taskId) {
			if (game.model.active) {
				if (inputObj.model.strike && inputObj.model.strike.time && inputObj.model.strike.time != game.strikeTime) {
					game.model.waitingForStrike = false;
					game.strikeTime = inputObj.model.strike.time;
					game.strikeMyTime = Date.now();
				}
				$.extend(game.model, inputObj.model);

				game.horizontalHit = false;

				game.emit('updateUI');
			}
		},

		init: function () {
			controls.init(game);

			magicwheel.on('tick', function () {
				game.moveBall();
			});

			magicwheel.mainRoom.on('peer-disconnected', function (e) {
				game.model.active ? game.onPeerDisconnected() : null;
			});
		},

		gameStart: function (hisName, initiatedByMe) {
			game.model.active = true;

			game.model.hisName = hisName;

			game.model.disconnected = false;

			game.model.myRole = initiatedByMe ? 'right' : 'left';

			game.model.waitingForStrike = true;

			//			magicwheel.on('tick', function () {
			//				game.moveBall();
			//			});

			game.emit('started');
		},

		gameEnd: function () {
			game.model.active = false;

			game.emit('ended');

			return game.model.hiScore;
		},

		onPeerDisconnected: function () {
			game.model.active = false;

			game.model.disconnected = true;

			game.model.waitingForStrike = false;
		},

		strike: function () {
			if (!game.model.active) {
				return;
			}

			game.model.waitingForStrike = false;

			game.strikeMyTime = Date.now();

			var cacheLastStrike = game.strikeMyTime;

			setTimeout(function () {
				if (game.strikeMyTime == cacheLastStrike && game.model.active) {
					game.onPeerDisconnected();
				}
			}, TIMEOUT);

			var modelSend = {};

			modelSend.strike = game.model.strike = {
				time: game.strikeMyTime,
				x: game.model.ballX,
				y: game.model.ballY
			}

			modelSend.slowness = game.model.slowness = game.model.slowness * .92;
			if (modelSend.slowness < 1.3) modelSend.slowness = game.model.slowness = 1.3;

			modelSend.baller = game.model.baller = game.model.myRole;

			modelSend.ballMoveX = game.model.ballMoveX = (game.model.myRole == 'left' ? 1 : -1);

			var shift = (game.model[game.model.myRole] + 30) - (game.model.ballY + 5);

			if (game.horizontalHit) {
				game.model.ballMoveY = 0 - game.model.ballMoveY;
			}

			game.horizontalHit = false;

			if (shift > -30 && shift < 30) {
				// hit
				game.model.ballMoveY = shift / -70;
				modelSend.score = game.model.score = game.model.score + 1;
				game.model.score > game.model.hiScore ? modelSend.hiScore = game.model.hiScore = game.model.score : null;
			} else {
				modelSend.slowness = game.model.slowness = MAX_SLOWNESS;
				modelSend.score = game.model.score = 0;
			}

			game.model.ballMoveY += (Math.random() - .5) / 5;

			modelSend.ballMoveY = game.model.ballMoveY;

			magicwheel.mainRoom.sendAll({
				route: '/matkot/setModel',
				model: modelSend
			});

			game.emit('updateUI');
		},

		moveBall: function () {
			if (game.model.active) {
				if (game.model.ballMoveX != 0) {

					var timePassed = Date.now() - game.strikeMyTime;
					game.model.ballX = game.model.strike.x + (game.model.ballMoveX * (timePassed / game.model.slowness));
					game.model.ballY = game.model.strike.y + (game.model.ballMoveY * (timePassed / game.model.slowness));

					while (game.model.ballY < 0 || game.model.ballY > 290) {
						game.horizontalHit = true;

						if (game.model.ballY < 0) {
							game.model.ballY = 0 - game.model.ballY;
						}
						if (game.model.ballY > 290) {
							game.model.ballY = 290 - (game.model.ballY - 290);
						}
					}

					if (game.model.baller != game.model.myRole) {
						if (game.model.myRole == 'left' && game.model.ballX < 10 || game.model.myRole == 'right' && game.model.ballX > 380) {
							game.strike();
						}
					}
				}
			}
		}
	}

	game.__proto__ = EventEmitter.prototype;

	game.init();

	game.reset();

	return game;
}