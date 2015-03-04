//# sourceURL=controller.js

var app = angular.module("welcome", []);

app.config(['$compileProvider',
        function ($compileProvider) {
		$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel|javascript):/);
}]);

app.controller('welcome', ['$scope', '$http',
        function ($scope, $http) {

		$('.showOnReady').show();

		$scope.localApps = [];

		$scope.loadLocalApps = function () {
			var apps = [];

			for (var key in localStorage) {
				if (key.indexOf('.appZip') != -1) {
					var appName = key.replace('.appZip', '');

					apps.push({
						name: appName,
						size: Math.ceil(localStorage[key].length / 1000) + 'kb'
					});
				}
			}

			$scope.localApps = apps;

			return $scope;
		}

		$scope.remoteApps = [];

		$scope.loadRemoteApps = function () {
			if ($("[data-toggle='tooltip']").tooltip) {
				$("[data-toggle='tooltip']").tooltip({
					html: true
				});
			}

			if (magicwheel.mainRoom.peer) {
				var remoteAppsCount = {}

				magicwheel.mainRoom.peer.listAllPeers(function (peers) {
					peers.map(function (id) {
						var appName = id.substring(0, id.indexOf('-'));

						if (id != magicwheel.mainRoom.peer.id) {
							remoteAppsCount[appName] = remoteAppsCount[appName] ? remoteAppsCount[appName] + 1 : 1;
						}
					});

					var apps = [];

					for (key in remoteAppsCount) {
						apps.push({
							name: key,
							count: remoteAppsCount[key]
						});
					}

					$scope.remoteApps = apps;

					$scope.$apply();
				});
			}
		}

		$scope.serverApps = [];

		$scope.loadServerApps = function () {
			$http({
				url: '/apps_list'
			}).success(function (data) {
				$scope.serverApps = data;
			});
		}

		$scope.tooltips = {
			localStorage: "Once an application is executed, its code is saved to the browser's local storage<br /> <br /> Get the code as a zip file<br>Edit it <br>Drag your newely created zip to the screen<br>It is now published to remote browsers",
			remote: "When you brawse the URL of a remote application, it is copied from a remote browser to the local storage and then executed",
			server: "To have your application available on the server, add it to the magicwheel source code on github"
		}

		$scope.removeApp = function (appName) {
			delete(localStorage[appName + '.appZip']);

			$scope.loadLocalApps();
		}

		$scope.loadLocalApps();

		$scope.loadServerApps();

		setInterval($scope.loadRemoteApps, 1000);
        }]);

angular.bootstrap(document.getElementById("apps"), ["welcome"]);