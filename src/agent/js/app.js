requirejs.config({
    shim: {
        'contrib/bootstrap.min' : ['jquery']
    }
});



define(function (require) {
    require('mwcommon/magicwheel');
    require('contrib/zip/zip');
    require('mwcommon/mwconsole');
	require('jquery');
	require('contrib/bootstrap.min');

    zip.workerScriptsPath = "/js/contrib/zip/";

    var q = require('contrib/q'),
        mwconfig = require('mwconfig');

    var appNameRequested = 'welcome';

    if (window.location.pathname.substring(0, 5) == '/app/') {
        appNameRequested = window.location.pathname.substring(5);
        if (appNameRequested.indexOf('/') != -1) {
            appNameRequested = appNameRequested.substring(0, appNameRequested.indexOf('/'));
        }
    }
    $('#mwapp').html('<br><br><br><br><br><br><br><br><br><br>LOADING APPLICATION: ' + appNameRequested);

    magicwheel.loadApp(appNameRequested).then(function (appRoom) {
        console.log('App loaded.');
		magicwheel.appLoaded = true;
        magicwheel.emit('appLoaded');
    }, function (error) {
       $('#mwapp').html('<br><br><br><br><br><br><br><br><br><br>ERROR: ' + error);
    });
});