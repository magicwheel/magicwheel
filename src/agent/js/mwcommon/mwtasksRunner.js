define(function (require) {
	var q = require('contrib/q'),
		$ = require('jquery');

	var mwtasksRunner = {
		pullExecuteFinish: function () {

			var deferred = q.defer();

			magicwheel.executeRoute('/task/pull', {}, 'SELF').then(function (task) {
				if (task) {
					if (task.delay) {
						deferred.resolve(true);
					}
					magicwheel.executeQueuedTask(task).then(function (result) {
						var taskData = {
							id: task._id,
							result: result
						}
						if (task.caller == 'SELF') {
							magicwheel.require.mwtask.counters.executedForSelf++;

							magicwheel.executeRoute('/task/finish', {
								task: taskData
							}, 'SELF');
						} else {
							magicwheel.require.mwtask.counters.executedForOthers++;
							
							magicwheel.mainRoom.send(task.caller, {
								route: '/task/finish',
								task: taskData
							});
						}

						deferred.resolve(true);
					}, function (error) {
						deferred.reject(error);
					});

					if (task.timeout) {
						setTimeout(function () {
							deferred.reject('TIMEOUT');
						}, task.timeout);
					}
				} else {
					deferred.resolve(false);
				}
			}, function (err) {
				console.log('magicwheel.pullExecuteFinish - task pull err:');
				console.log(err);
				deferred.resolve(false);
			});

			return deferred.promise;
		},

		activate: function () {
			magicwheel.ensureAppLoaded().then(function () {
				if (magicwheel.active) {
					return;
				}
				magicwheel.active = true;
				mwtasksRunner.pullExecuteFinish().then(function (result) {
					magicwheel.active = false;
					if (!result) {
						return;
					}
					magicwheel.activate();
				}, function (error) {
					console.error('TASK EXECUTION ERROR:', error);
					magicwheel.active = false;
					magicwheel.activate();
				});
			});
		}

	};

	return mwtasksRunner;
});