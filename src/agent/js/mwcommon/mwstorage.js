define(function (require) {
	var q = require('contrib/q')
	$ = require('jquery');

	var memoryStorage = {};
	var quotaAlertPresented = false;

	function keyFromKeyAndAppName(key, appName) {
		appName = appName ? appName : magicwheel.currentApp;

		return appName + '.' + key;
	}

	var STORAGE = {
		get: function (key, appName) {
			var stringified = STORAGE._get(key, appName);

			return stringified ? JSON.parse(stringified) : undefined;
		},
		_get: function (key, appName) {
			key = keyFromKeyAndAppName(key, appName);

			return memoryStorage[key] ? memoryStorage[key] : localStorage[key];
		},
		set: function (key, value, appName) {
			STORAGE._set(key, JSON.stringify(value), appName);

			return value;
		},
		setMemory: function(key, value, appName) {
			key = keyFromKeyAndAppName(key, appName);
			
			memoryStorage[key] = JSON.stringify(value);
			
			return value;
		},
		_set: function (key, value, appName) {
			key = keyFromKeyAndAppName(key, appName);

			try {
				localStorage[key] = value;
			} catch (e) {
				if (e.name == 'QuotaExceededError' || e.name == 'NS_ERROR_DOM_QUOTA_REACHED') {
					memoryStorage[key] = value;

					if (!quotaAlertPresented) {
						magicwheel.alert('Local Storage Full', 'Local storage is full. Memory is used. You may remove applications from the local storage on the welcome screen');

						quotaAlertPresented = true;
					}
				} else {
					throw e;
				}
			}
		},
		delete: function (key, appName) {
			key = keyFromKeyAndAppName(key, appName);

			delete(memoryStorage[key]);

			delete(localStorage[key]);
		},
		clearMemory: function(){
			memoryStorage = {};
		}
	};

	function getStorage(data, caller, room) {

		var deferred = q.defer();

		var result = STORAGE.get(data.key, data.appName);

		if (result) {
			deferred.resolve(result);
		} else {
			//do nothing
		}

		return deferred.promise;
	}

	var routes = {
		'/storage/get': {
			controller: getStorage
		}
	}

	$.extend(true, magicwheel.routes, routes);

	return STORAGE;
});