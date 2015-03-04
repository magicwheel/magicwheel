var zipper = require('./lib/zipper.js');

var exports = {
    initZipper: function (app) {
        app.get('/zip/*', function (req, res, dirname) {
            zipper.handle(req, res, __dirname);
        });
        app.get('/apps_list', function (req, res, dirname) {
            zipper.appsList(req, res, __dirname);
        });
    }
};

module.exports = exports;