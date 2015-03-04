var app = angular.module("console", []);

app.config(['$locationProvider',
	function ($locationProvider) {
		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
	}]);

app.controller('console', ['$scope', '$http', '$location',
        function ($scope, $http, $location) {

		$scope.magicwheel = magicwheel;

		$scope.isDebugMode = function () {
			return $location.search().debug != undefined ? true : false;
		}

		$scope.bindAndApply = function () {
			$scope.magicwheel = magicwheel;
		
			$scope.$apply();
		}
		}]);

angular.bootstrap(document.getElementById("mwconsole"), ["console"]);