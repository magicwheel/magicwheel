//# sourceURL=matkot.controls.js

var Controls = function () {
	var controls = {
		game:{},
		
		init: function (_game) {
			game = _game;
			
			function firstStrike() {
				if (game.model.active) {
					if (game.model.waitingForStrike && game.model.myRole == 'left') {
						game.strike();
					}
				}
			}

			$('body').on('click', function (event) {
				firstStrike();
			});

			$('body').keyup(function (e) {
				if (e.keyCode == 32) {
					firstStrike();
				}
			});


			$('body').on('mousewheel', function (event) {
				controls.up(event.deltaY * 10);
			});

		},

		onDraw: function () {
			if (Key.isDown(Key.up)) {
				controls.up(6);
			}
			if (Key.isDown(Key.down)) {
				controls.up(-6);
			}
			if (Key.isDown(Key.left)) {
				controls.up(game.model.myRole == 'left' ? 6 : -6);
			}
			if (Key.isDown(Key.right)) {
				controls.up(game.model.myRole == 'left' ? -6 : 6);
			}
		},

		up: function (delta) {
			if (game.model.active) {
				game.model[game.model.myRole] -= delta;

				game.model[game.model.myRole] < 0 ? game.model[game.model.myRole] = 0 : null;

				game.model[game.model.myRole] > 240 ? game.model[game.model.myRole] = 240 : null;

				var modelSend = {};

				if (game.model.ballMoveX == 0) {
					if (game.model.ballX == 10 && game.model.myRole == "left") {
						if (game.model.ballY < (game.model[game.model.myRole] - 0)) {
							modelSend.ballY = game.model.ballY = game.model[game.model.myRole] - 0;
						}
						if (game.model.ballY > (game.model[game.model.myRole] + 50)) {
							modelSend.ballY = game.model.ballY = game.model[game.model.myRole] + 50;
						}
					}
				}

				modelSend[game.model.myRole] = game.model[game.model.myRole];

				if (Date.now() - game.lastSend > 20) {
					magicwheel.mainRoom.sendAll({
						route: '/matkot/setModel',
						model: modelSend
					});

					game.lastSend = Date.now();
				}
			}

		}
	}


	var Key = {
		_pressed: {},

		left: 37,
		up: 38,
		right: 39,
		down: 40,

		isDown: function (keyCode) {
			return this._pressed[keyCode];
		},

		onKeydown: function (event) {
			this._pressed[event.keyCode] = true;
		},

		onKeyup: function (event) {
			delete this._pressed[event.keyCode];
		}
	};

	window.addEventListener('keyup', function (event) {
		Key.onKeyup(event);
	}, false);

	window.addEventListener('keydown', function (event) {
		Key.onKeydown(event);
	}, false);

	return controls;
}