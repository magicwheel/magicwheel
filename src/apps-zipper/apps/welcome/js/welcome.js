//# sourceURL=welcome.js
var q = magicwheel.require.q,
	_ = magicwheel.require._,
	$ = magicwheel.require.$;

/* Drag'n drop stuff */
var drag = document.body;

drag.ondragover = function (e) {
	e.preventDefault()
};

drag.ondrop = function (e) {
	e.preventDefault();

	//    var entry = e.dataTransfer.items[i].webkitGetAsEntry();
	var file = e.dataTransfer.files[0];

	if (!file.name.match(/\.zip/) || e.dataTransfer.files.length > 1) {
		alert('Please drop a single zip file');
		return;
	}

	var appName = "NEW_" + file.name.replace('.zip', '').replace('(','').replace(')','').replace(' ','');

	magicwheel.require.mwfs.blobToStorage(file, 'appZip', appName).then(function (result) {
		//window.location.href = '/app/' + appName;
		magicwheel.loadApp(appName);
	}, function (error) {
		console.log(error);
	});
}