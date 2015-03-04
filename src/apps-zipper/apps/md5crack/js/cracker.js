//# sourceURL=cracker.js
var Cracker = function () {
	var q = magicwheel.require.q;

	var cracker = {
		crack: function (inputObj) {
			var deferred = q.defer();

			cracker.crackAsync(inputObj.firstCharInt, inputObj.encrypted, deferred);

			return deferred.promise;
		},

		crackAsync: function (firstCharInt, encrypted, deferred) {
			
			if(Math.random() > .9){
				console.log('XXXXXXXXX');
				return;
			}
				console.log('OK');
			
			var result = {};

			for (i = 32; i < 127; i++) {
				for (j = 32; j < 127; j++) {
					var maybe = String.fromCharCode(firstCharInt, i, j);
					var hash = CryptoJS.MD5(maybe);
					var md5 = hash.toString(CryptoJS.enc.Base64);

					for (c = 0; c < encrypted.length; c++) {
						if (md5 == encrypted[c]) {
							result[md5] = maybe;
						}
					}
				}
			}

			deferred.resolve(result);
		}
	}

	var routes = {
		'/md5/crack': {
			controller: cracker.crack,
			queue: true,
			timeout: 3000
		}
	}

	$.extend(true, magicwheel.routes, routes);

	return cracker;

}