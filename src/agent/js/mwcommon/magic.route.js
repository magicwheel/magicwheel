define(function (require) {
    var q = require('contrib/q'),
    $ = require('jquery');

    var magicRoute = {

        executeRoute: function (route, data, caller, room, taskId) {
            if (!caller) {
                caller = 'SELF';
            }

            if(!magicwheel.routes[route]){
				var deferred = q.defer();
				deferred.reject('magicwheel route not found: ' + route);
                return deferred.promise;
            }
            
            if (magicwheel.routes[route].self && caller != 'SELF') {
				var deferred = q.defer();
				deferred.reject('a self route called from outside: ' + route);
                return deferred.promise;
            }

            if (!taskId && magicwheel.routes[route].queue) {
                return magicwheel.executeRoute('/task/insert', {
                    inputObj: data,
                    route: route,
                    self: magicwheel.routes[route].self,
                    delay: magicwheel.routes[route].delay,
                    timeout: magicwheel.routes[route].timeout,
                    caller: caller,
                    roomId: room ? room.id : 0
                }, 'SELF', room);
            }

            var routePromise = magicwheel.routes[route].controller(data, caller, room ? room : magicwheel.mainRoom, taskId);

            var eventData = {
                route: route,
                data: data,
                caller: caller,
                room: room,
                taskId: taskId
            }

            if (routePromise && routePromise.then) {
                routePromise.then(function (result) {
                    magicwheel.emit('AFTER' + route, eventData);
                });
            };

            magicwheel.emit(route, eventData);

            return routePromise ? routePromise : null;
        }
    };

    return magicRoute;
});