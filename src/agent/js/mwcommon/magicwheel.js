var magicwheel = {
    currentApp: '',
	appLoaded: false,
    mainRoom: null,
    routes: {},
    active: false,
    roomCreated: false
}

define(function (require) {
    var q = require('contrib/q'),
        _ = require('underscore'),
        $ = require('jquery'),
        mwtask = require('mwcommon/mwtask'),
        mwconfig = require('mwconfig'),
        Room = require('mwcommon/mwroom'),
        mwstorage = require('mwcommon/mwstorage'),
        magicRoute = require('mwcommon/magic.route'),
        mwapps = require('mwcommon/mwapps'),
        mwfs = require('mwcommon/mwfs'),
        mwutils = require('mwcommon/mwutils'),
        mwtasksRunner = require('mwcommon/mwtasksRunner');

    magicwheel.require = {
        q: q,
        _: _,
        $: $,
        mwfs: mwfs,
		mwstorage: mwstorage,
		mwtask: mwtask
    }

    magicwheel.utils = mwutils;

	magicwheel.consoleController = angular.element(document.getElementById('mwconsole')).scope();
    require('contrib/events');
    require('contrib/jquery.mousewheel');

    magicwheel.__proto__ = EventEmitter.prototype;

    initMagicWheel();

    magicwheel.mainRoom = new Room();
    
    magicwheel.createRoom = function () {
        var deferred = q.defer();
        
        magicwheel.mainRoom.create('magicwheel-main-room').then(function (_room) {
            magicwheel.emit('roomCreated', _room);
            
            magicwheel.roomCreated = true;
            
            deferred.resolve();
        },function(error){
			deferred.reject(error);
		});
        
        return deferred.promise;
    }

    magicwheel.loadApp = function (appName) {
        return mwapps.loadApp(appName);
    }

    magicwheel.dowloadAppCode = function (appName) {
        return mwapps.dowloadAppCode(appName);
    }

    magicwheel.executeRoute = function (route, data, caller, room, taskId) {
        return magicRoute.executeRoute(route, data, caller, room, taskId);
    }

    magicwheel.executeQueuedTask = function (task) {
        return magicwheel.executeRoute(task.route, task.inputObj, 'SELF', null, task._id);
    }

    magicwheel.activate = function () {
        return mwtasksRunner.activate();
    }

	magicwheel.alert = function(headerText, messageText){
		$('#mwalert .header').html(headerText);
		
		$('#mwalert .message').html(messageText);
		
		$('#mwalert').modal('show');
	}
	
	magicwheel.ensureAppLoaded = function(){
		var deferred = q.defer();
		
		magicwheel.appLoaded ? deferred.resolve() :	magicwheel.on('appLoaded', deferred.resolve);
		
		return deferred.promise;
	}

});