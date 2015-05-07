//# sourceURL=main.js
var q = magicwheel.require.q;

magicwheel.utils.require(['CryptoJS', 'Cracker']).then(function () {
	var cracker = new Cracker();

	var app = angular.module("md5", []);

	app.config(['$compileProvider',
        function ($compileProvider) {
			$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel|javascript):/);
}]);

	app.controller('md5', ['$scope',
        function ($scope) {
			$scope.encrypted = ['79e1cc2ab502c16e9a6463031840efa6', '9df1c16e82351bd6abc74d230391cd1e', '0812f14f43315611dd0ef462515c9d00'];

			$scope.active = false;

			$scope.reset = function () {
				$scope.tasksTotal = 0;
				$scope.tasksFinished = 0;
				$scope.tasksLocal = 0;
				$scope.tasksRemote = 0;
				$scope.elapsed = 0;
				$scope.started = Date.now();
				$scope.cracked = ['???', '???', '???'];

			}

			$scope.reset();

			$scope.crack = function () {
				$scope.reset();

				$scope.active = true;

				//clear all old tasks
				magicwheel.executeRoute('/task/clear', {}).then(
					function () {
						$scope._insertTasks();
					}
				);
			};

			$scope._insertTasks = function () {
				// map task to small tasks
				for (i = 32; i < 127; i++) {
					var promise = magicwheel.executeRoute('/md5/crack', {
						firstCharInt: i,
						encrypted: $scope.encrypted
					});

					$scope.tasksTotal++;

					// on small task completed by local browser or remote peer 
					promise.then(function (result) {
						$scope.tasksFinished++;

						$scope.tasksFinished == $scope.tasksTotal ? $scope.active = false : null;

						$scope.displayResult(result.result);

						result.caller == 'SELF' ? $scope.tasksLocal++ : $scope.tasksRemote++;

						$scope.$apply();
					});
				}
			}
			$scope.displayResult = function (result) {
				for (enc in result) {
					for (c = 0; c < $scope.encrypted.length; c++) {
						if ($scope.encrypted[c] == enc) {
							$scope.cracked[c] = result[enc];
							$scope.$apply();
						}
					}
				}
			}

			$scope.tick = function () {
				$scope.remoteBrowsers = Object.keys(magicwheel.mainRoom.peer.connections).length;

				if ($scope.active) {
					$scope.elapsed = Math.ceil((Date.now() - $scope.started) / 1000);
				}

				$scope.$apply();
			}

			setInterval($scope.tick, 500);

			$('.showOnReady').show();
        }]);

	angular.bootstrap(document.getElementById("apps"), ["md5"]);
});