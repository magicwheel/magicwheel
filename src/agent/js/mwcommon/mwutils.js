define(function (require) {
	var q = require('contrib/q');
	
	var utils = {
		require: function (varNames, deferred) {

			if (!deferred) {
				deferred = magicwheel.require.q.defer();
			}

			var ready = true;

			varNames.map(function (name) {
				if (!window[name]) {
					ready = false;
				}
			});

			if (ready) {
				deferred.resolve();
			} else {
				setTimeout(function () {
					magicwheel.utils.require(varNames, deferred)
				}, 1000);
			}

			return deferred.promise;
		},
		
		loadCSS: function (href) {
			var cssLink = $("<link magicwheel rel='stylesheet' type='text/css' href='" + href + "'>");
			$("head").append(cssLink);
		},

		loadJS: function (src) {
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
	}

	return utils;
});