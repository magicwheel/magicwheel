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
		
		$scope.peersAvailable = function(){
			if(!magicwheel || !magicwheel.mainRoom || !magicwheel.mainRoom.peer || !magicwheel.mainRoom.peer.connections){
				return false;
			}
			for (k in magicwheel.mainRoom.peer.connections){
				return true;
			}
			return false;
		}
		}]);

angular.bootstrap(document.getElementById("mwconsole"), ["console"]);