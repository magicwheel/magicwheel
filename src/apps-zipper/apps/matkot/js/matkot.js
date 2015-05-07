//# sourceURL=matkot.js

var q = magicwheel.require.q,
	_ = magicwheel.require._,
	$ = magicwheel.require.$;

magicwheel.utils.require(['Game', 'View2d', 'View3d', 'Controls']).then(function () {
	var scope = angular.element(document.getElementById("matkot")).scope(),
		controls = new Controls(),
		game = new Game(controls),
		view = new View3d(game, controls),
		view2 = new View2d(game, controls);

	scope.setGame(game);

	function showHighestScore() {
		if (!localStorage['app.tennis.highestScore']) {
			localStorage['app.tennis.highestScore'] = JSON.stringify({
				score: 0,
				description: 'Nothing yet...'
			});
		}

		var answers = magicwheel.mainRoom.askAll({
			route: '/storage/get',
			key: 'app.tennis.highestScore'
		});
		answers.map(function (answer) {
			answer.then(function (result) {
				var hscoreObj = JSON.parse(result.answer);

				if (hscoreObj.score > JSON.parse(localStorage['app.tennis.highestScore']).score) {
					localStorage['app.tennis.highestScore'] = result.answer;

					$('#bScoreInner').html(hscoreObj.description);
				}
			});
		});

		var hscore = JSON.parse(localStorage['app.tennis.highestScore']);

		$('#bScoreInner').html(hscore.description);

		setTimeout(showHighestScore, 5000);
	}

	// a magicwheel route called by a remote peer to initialize a game session
	function routeInvite(inputObj, caller, room, taskId) {
		var deferred = q.defer();
		
		// disconnect from all peers other then the partner
		magicwheel.mainRoom.goPrivate([caller]);

		deferred.resolve({
			interested: true
		});

		scope.startGame(caller, false);

		return deferred.promise;
	}

	function registerRoutes() {
		var routes = {
			'/matkot/setModel': {
				controller: game.routeSetModel
			},
			'/matkot/invite': {
				controller: routeInvite
			}
		}

		$.extend(true, magicwheel.routes, routes);
	}

	registerRoutes();
});