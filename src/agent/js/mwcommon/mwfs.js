define(function (require) {
	var mwstorage = require('mwcommon/mwstorage'),
		q = require('contrib/q');

	var mapping = {
		"pdf": "application/pdf",
		"zip": "application/zip",
		"rar": "application/rar",
		"json": "application/json",
		"mid": "audio/mid",
		"mp3": "audio/mpeg",
		"bmp": "image/bmp",
		"gif": "image/gif",
		"png": "image/png",
		"jpg": "image/jpeg",
		"jpeg": "image/jpeg",
		"svg": "image/svg+xml",
		"xml": "text/xml",
		"css": "text/css",
		"js": "application/javascript"
	}

	magicwheel.blobUrlByUrl = function (url) {
		if (magicwheel.appZipBlobs[url]) {
			return URL.createObjectURL(magicwheel.appZipBlobs[url]);
		}
		return url;
	}

	var MWFS = {
		//returns dataUri promise
		urlToStorage: function (url, key, appName) {
			var deferred = q.defer();

			var fileReader = new FileReader();

			function downloadFile(url, success, failure) {
				var xhr = new XMLHttpRequest();
				xhr.open('GET', url, true);
				xhr.responseType = "blob";
				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {
						xhr.status == 200 ? success(xhr.response) : failure(xhr.status);
					}
				};
				xhr.send(null);
			};

			downloadFile(url, function (blob) {
				MWFS.blobToStorage(blob, key, appName, deferred);
			}, function (status) {
                deferred.reject(status);
            });

			return deferred.promise;
		},

		blobToStorage: function (blob, key, appName, deferred) {
			var deferred = deferred ? deferred : q.defer();

			var fileReader = new FileReader();

			fileReader.onload = function (evt) {
				var dataUri = evt.target.result;

				mwstorage.set(key, dataUri, appName);

				deferred.resolve(dataUri);
			};

			fileReader.readAsDataURL(blob);

			return deferred.promise;
		},

		storageToZipBlobs: function (key, appName) {
			var deferred = q.defer(),
				dataUri = mwstorage.get(key, appName),
				blob = MWFS.dataURItoBlob(dataUri),
				reader = new zip.BlobReader(blob);

			zip.createReader(reader, function (zipReader) {
				zipReader.getEntries(function (entries) {
					var promises = [],
						blobs = {};

					for (var i = 0; i < entries.length; i++) {
						var entry = entries[i];

						if (entry.compressedSize == 0) {
							continue;
						}

						var promise = MWFS.zipEntryToBlob(entry, blobs);

						promises.push(promise);
					}

					q.all(promises).then(function () {
						deferred.resolve(magicwheel.appZipBlobs = MWFS._normalizeBlobs(blobs));
					});
				});
			}, onerror);

			return deferred.promise;
		},

		_normalizeBlobs: function (blobs) {
			var prefix = '';

			for (key in blobs) {
				if (key.indexOf('/index.html') != -1) {
					prefix = key.substring(0, key.indexOf('/index.html'));
				}
			}

			if (prefix != '') {
				var blobsNormalized = {};

				for (key in blobs) {
					var newKey = key.substring(prefix.length + 1);

					if (newKey) {
						blobsNormalized[newKey] = blobs[key];
					}
				}

				return blobsNormalized;
			}

			return blobs;
		},

		//returns blob promise
		zipEntryToBlob: function (entry, blobs) {
			var deferred = q.defer();

			var extension = entry.filename.substring(entry.filename.lastIndexOf(".") + 1),
				mime = mapping[extension] || 'text/plain',
				writer = new zip.BlobWriter(mime);

			entry.getData(writer, function (blob) {
				blobs[entry.filename] = blob;
				deferred.resolve(blob);
			});

			return deferred.promise;
		},

		blobToText: function (blob) {
			var deferred = q.defer(),
				fileRead = new FileReader();

			fileRead.onload = function () {
				deferred.resolve(fileRead.result);
			}

			fileRead.readAsText(blob);

			return deferred.promise;
		},

		dataURItoBlob: function (dataURI) {
			if (typeof dataURI !== 'string') {
				throw new Error('Invalid argument: dataURI must be a string');
			}

			dataURI = dataURI.split(',');

			var type = dataURI[0].split(':')[1].split(';')[0],
				byteString = atob(dataURI[1]),
				byteStringLength = byteString.length,
				arrayBuffer = new ArrayBuffer(byteStringLength),
				intArray = new Uint8Array(arrayBuffer);

			for (var i = 0; i < byteStringLength; i++) {
				intArray[i] = byteString.charCodeAt(i);
			}

			return new Blob([intArray], {
				type: type
			});
		},

		dataURItoDataURL: function (dataURI) {
			return URL.createObjectURL(MWFS.dataURItoBlob(dataURI));
		}

	};

	return MWFS;
});