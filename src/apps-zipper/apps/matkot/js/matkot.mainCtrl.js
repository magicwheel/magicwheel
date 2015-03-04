//# sourceURL=matkot.mainCtrl.js

var app = angular.module("matkot", []);

app.controller('matkot', ['$scope',
 	function ($scope) {
		$scope.state = 'LOBBY'; //'LOBBY','GAME'
		$scope.remoteUsersByName = {};
		$scope.remoteUsersByPeerId = {};
		$scope.view3D = true;
		$scope.myName = '';

		$scope.setName = function (name) {
			$scope.myName = magicwheel.require.mwstorage.setMemory('name', name);
		}

		$scope.setGame = function (game) {
			$scope.game = game;

			game.on('updateUI', function () {
				$scope.$apply();
			});
		}

		$scope.startGame = function (peerId, initiatedByMe) {
			$scope.hisName = $scope.remoteUsersByPeerId[peerId].name;

			$scope.state = 'GAME';

			$scope.game.gameStart($scope.hisName, initiatedByMe);

			$scope.remoteUsersByName = {};

			$scope.remoteUsersByPeerId = {};
		}

		$scope.getRemoteUsers = function () {
			if ($scope.state != 'LOBBY') {
				$scope.$apply();
				return;
			}

			var answers = magicwheel.mainRoom.askAll({
				route: '/storage/get',
				key: 'name'
			});

			answers.map(function (answer) {
				answer.then(function (result) {
					var name = result.answer;

					var user = {
						name: name,
						peerId: result.caller,
						date: Date.now()
					};

					$scope.remoteUsersByName[name] = user;
					$scope.remoteUsersByPeerId[result.caller] = user;
				});
			});

			for (key in $scope.remoteUsersByName) {
				if ($scope.remoteUsersByName[key].date < Date.now() - 3000) {
					delete($scope.remoteUsersByName[key]);
				}
			}

			$scope.$apply();
		}

		$scope.availablePlayers = function () {
			for (key in $scope.remoteUsersByName) {
				return true;
			}
			return false;
		}

		$scope.invite = function (user) {
			magicwheel.mainRoom.ask(user.peerId, {
				route: '/matkot/invite'
			}).then(function (answer) {
				magicwheel.mainRoom.goPrivate([user.peerId]);

				$scope.startGame(user.peerId, true);
			});
		}

		$scope.gameQuit = function () {
			var hiscore = $scope.game.gameEnd();

			if (hiscore > $scope.bestScore) {
				$scope.setHighestScore({
					score: hiscore,
					description: hiscore + ' by ' + $scope.myName + ' & ' + $scope.hisName
				});
			}

			$scope.game.reset();

			$scope.state = 'LOBBY';

			magicwheel.mainRoom.goPublic(true);
		}

		$scope.switchView = function () {
			$scope.view3D = !$scope.view3D;
		}

		$scope.setHighestScore = function (highestScore) {
			magicwheel.require.mwstorage.set('highestScore', highestScore);

			$scope.bestScoreDescription = highestScore.description;
			$scope.bestScore = highestScore.score;
		}

		$scope.initializeHighestScore = function () {
			var highestScore = magicwheel.require.mwstorage.get('highestScore');

			if (!highestScore) {
				highestScore = {
					score: 0,
					description: 'Nothing yet...'
				};
			}

			$scope.setHighestScore(highestScore);
		}

		$scope.getHighestScore = function () {
			if ($scope.state != 'LOBBY') return;

			var answers = magicwheel.mainRoom.askAll({
				route: '/storage/get',
				key: 'highestScore'
			});

			answers.map(function (answer) {
				answer.then(function (result) {
					var highestScore = result.answer;

					if (highestScore.score > $scope.bestScore) {
						$scope.setHighestScore(highestScore);
					}
				});
			});

			$scope.$apply();
		}

		$scope.initializeHighestScore();

		setInterval($scope.getRemoteUsers, 1000);
		setInterval($scope.getHighestScore, 1000);
}]);

angular.bootstrap(document.getElementById("matkot"), ["matkot"]);