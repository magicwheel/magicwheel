define(function (require) {
	var q = require('contrib/q'),
		mwfs = require('mwcommon/mwfs'),
		mwstorage = require('mwcommon/mwstorage'),
		$ = require('jquery');

	var magicApps = {
		loadApp: function (appName) {
			var deferred = q.defer();

			magicwheel.currentApp = appName;

			magicwheel.createRoom().then(function () {
				if (window.location.search.indexOf('refresh') != -1 ||
					window.location.search.indexOf('server') != -1) {
					mwstorage.delete('appZip');
				}
				magicApps._loadAppInner(appName, deferred);
			}, function (error) {
				deferred.reject(error);
			});

			return deferred.promise;
		},

		dowloadAppCode: function (appName) {
			if (!appName) {
				appName = magicwheel.currentApp;
			}

			var dataURI = mwstorage.get('appZip', appName);

			var pom = document.createElement('a');
			pom.setAttribute('href', mwfs.dataURItoDataURL(dataURI));
			pom.setAttribute('download', appName + '.zip');
			document.body.appendChild(pom);
			pom.click();
		},

		_loadAppInner: function (appName, deferred) {
			console.log('loadAppInner');

			if (mwstorage.get('appZip', appName)) {
				magicApps._loadAppFromStorage(appName, deferred);
			} else {
				console.log('Trying to get app from server');

				mwfs.urlToStorage('/zip/' + appName + '.zip' + window.location.search, 'appZip', appName).then(function (dataUri) {
					console.log('App retrieved from server');
					magicApps._loadAppFromStorage(appName, deferred);
				}, function (status) {
					magicApps._loadAppFromRoom(appName).then(function () {
						magicApps._loadAppFromStorage(appName, deferred);
					});
				});
			}
		},

		_loadAppFromStorage: function (appName, deferred) {
			console.log('Loading app from storage');
			mwfs.storageToZipBlobs('appZip', appName).then(function () {
				var innerPath = window.location.pathname.substring(6 + appName.length);

				if (!innerPath) {
					innerPath = 'index.html';
				}

				magicApps._loadHtml(innerPath, deferred);
			});
		},

		appRecieved: false,

		_loadAppFromRoom: function (appName, deferred) {
			if (!deferred) {
				deferred = q.defer();
			}

			console.log('Loading app from room');

			var answers = magicwheel.mainRoom.askAll({
				route: '/storage/get',
				key: 'appZip',
				appName: appName
			});
			answers.map(function (answer) {
				answer.then(function (result) {
					if (magicApps.appRecieved) {
						return;
					}
					magicApps.appRecieved = true;

					//!!!
					mwstorage.set('appZip', result.answer, appName);

					deferred.resolve();
				});
			});

			setTimeout(function () {
				if (!magicApps.appRecieved) {
					magicApps._loadAppFromRoom(appName, deferred);
				}
			}, 1000);

			return deferred.promise;
		},

		_loadHtml: function (path, deferred) {
			if (!deferred) {
				deferred = q.defer();
			}

			if (path.substring(0, 4) == 'http') {
				var win = window.open(path, '_blank').focus();
				return;
			}

			var historyState = '/app/' + magicwheel.currentApp;

			if (path.indexOf('.html') == -1) {
				path += '.html';
			}

			if (path != 'index.html') {
				historyState += ('/' + path.replace('.html', ''));
			}

			window.history.replaceState({}, '', historyState + window.location.search);

			mwstorage.clearMemory();

			magicwheel.page = {};

			magicwheel.currentPath = path;

			magicwheel.emit('loadHtml', path);

			if (!magicwheel.appZipBlobs[path]) {
				deferred.reject("File not found in zip: " + path);
				return;
			}

			mwfs.blobToText(magicwheel.appZipBlobs[path]).then(function (text) {
				$('link[magicwheel]').remove();

				$('script[magicwheel]').remove();

				text = text.replace(/ src=/g, ' magicwheel-src=');

				text = text.replace(/ href=/g, ' magicwheel-href=');

				text = text.replace(/ mwhref=/g, ' href=');

				$('#mwapp').html(text);

				$('#mwapp img').each(function () {
					var blobURL = magicwheel.blobUrlByUrl($(this).attr('magicwheel-src'));
					$(this).attr('src', blobURL);
				});

				$('#mwapp link').each(function () {
					$(this).remove();

					var blobURL = magicwheel.blobUrlByUrl($(this).attr('magicwheel-href'));

					magicApps._loadCSS(blobURL);
				});

				$('#mwapp a').each(function () {
					var path = $(this).attr('magicwheel-href');

					if (path) {
						$(this).click(function () {
							magicApps._loadHtml(path);
						});
					}
				});

				var promises = [];
				
				$('#mwapp script').each(function () {
					try {
						$(this).remove();

						var blobURL = magicwheel.blobUrlByUrl($(this).attr('magicwheel-src'));

						promises.push(magicApps._loadJS(blobURL));
					} catch (e) {
						console.error(e);
					}
				});

				q.all(promises).then(function(){
					deferred.resolve(magicwheel.mainRoom);
				});
			});

		},

		_loadCSS: function (href) {
			var cssLink = $("<link magicwheel rel='stylesheet' type='text/css' href='" + href + "'>");
			$("head").append(cssLink);
		},

		_loadJS: function (src) {
			var deferred = q.defer();
			
			jQuery.ajaxSetup({
				cache: true
			});

			var r = false;
			var s = document.createElement('script');
			s.type = 'text/javascript';
			s.src = src;
			s.onload = s.onreadystatechange = function () {
				//console.log( this.readyState ); //uncomment this line to see which ready states are called.
				if (!r && (!this.readyState || this.readyState == 'complete')) {
					r = true;
					deferred.resolve();
				}
			};
			
			var t = document.getElementsByTagName('script')[0];
			
			t.parentNode.insertBefore(s, t);
			
			return deferred.promise;
		}
	};

	return magicApps;
});