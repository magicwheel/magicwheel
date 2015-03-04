define(function (require) {
    var db = require('mwcommon/mwdb');

    function askHelpIfNeeded() {
        //todo fetch single
        db.find('tasks', {
            started: 0,
            self: false
        }).then(function (tasks) {
            if (tasks.length) {
                magicwheel.mainRoom.sendAll({
                    route: '/task/help',
                    caller: magicwheel.mainRoom.peer.id
                });
            }
        }, function (err) {
            console.log('askHelpIfNeeded err:');
            console.log(err);
        });
    }

    function foreverAskHelp() {
        setInterval(askHelpIfNeeded, 1000);
    }

    foreverAskHelp();
});