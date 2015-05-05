var q = require('q'),
    archiver = require('archiver'),
    _ = require('lodash-node'),
    fs = require('fs');

var exports = {
    handle: function (req, res, dirname) {
        var pathname = req._parsedUrl.pathname,
            appName = pathname.replace(/\/zip\//g, '').replace('.zip', ''),
            appPath = 'src/apps-zipper/apps/' + appName,
            zipPath = 'src/apps-zipper/apps/' + appName + '.zip';

        fs.exists(appPath, function (exists) {
            if (exists) {
                fs.exists(zipPath, function (exists) {

                    if (exists && undefined == req.query.refresh) {
                        console.log(zipPath);
                        res.sendfile(zipPath);
                    } else {
                        var output = fs.createWriteStream(zipPath),
                            archive = archiver('zip');

                        output.on('close', function () {
                            if (archive._entries.length == 0) {
                                res.status(404).end();
                                return;
                            }
                            res.sendfile(zipPath);
                        });

                        archive.on('error', function (err) {
                            throw err
                        });

                        archive.pipe(output);

                        archive.bulk([
                            {
                                expand: true,
                                cwd: 'src/apps-zipper/apps/' + appName,
                                src: ['**/*']
                    }
                    ]).finalize();
                    }
                });
            } else {
                res.status(404).end();
            }
        });
    },

    appsList: function (req, res, dirname) {
        //todo: get description from inner text file
        //        fs.readdir('src/apps-zipper/apps', function(err, dirs){
        //            dirs = dirs.map(function(name){
        //                if(name.indexOf('.zip') == -1){
        //                    return ({name: name});
        //                }
        //            });
        //            
        //            res.json(_.compact(dirs));
        //        });
        res.setHeader("Cache-Control", "max-age=31556926");

        res.json([{
            name: 'matkot',
            description: 'An example for a multiplayer 3D game'
        }, {
            name: 'md5crack',
            description: 'An example for sharing CPU'
        }, {
            name: 'welcome',
            description: 'The application currently running'
        }]);
    }
};

module.exports = exports;