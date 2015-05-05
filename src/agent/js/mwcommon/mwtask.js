define(function (require) {
	var q = require('contrib/q'),
		db = require('mwcommon/mwdb'),
		$ = require('jquery'),
		tasksDeffereds = {},
		waitingList = {};

	require('mwcommon/mwtask.help');

	db.init('tasks');

	function taskList(data, caller, room) {
		console.log('AGENT ROUTE TASK/LIST');

		db.find('tasks', {}).then(function (tasks) {
			console.log('tasks:');
			console.log(tasks);
		}, function (err) {
			console.log('err:');
			console.log(err);
		});
	}

	function taskClear(data, caller, room) {
		console.log('AGENT ROUTE TASK/CLEAR');
		
		var deferred = q.defer();

		db.remove('tasks', {}).then(function (tasks) {
			console.log('All tasks cleared');
			deferred.resolve();
		}, function (err) {
			console.log('err:');
			console.log(err);
			deferred.reject(err);
		});
		
		return deferred.promise;
	}

	function taskPull(data, caller, room) {
		console.log('AGENT ROUTE TASK/PULL');
		var deferred = q.defer();

		var selector = {
			started: 0
		};

		if (caller != 'SELF') {
			selector.self = false;
		}

		db.findUpdate('tasks', selector, {
			started: Date.now(),
			puller: caller
		}).then(function (task) {
			if (!task && caller == 'SELF') {
				_taskPullRemote(deferred);
			} else {
				deferred.resolve(task);
				if (task.timeout) {
					setTimeout(function () {
						db.findUpdate('tasks', {
							_id: task._id,
							finished: 0
						}, {
							started: 0,
							puller: 'TIMEDOUT'
						}).then(function(result){
							if(result){
							console.log('************** TASK TIMED OUT AND REINSERTED:', result);
							}
						});
					}, task.timeout);
				}
			}
		}, function (err) {
			console.log(err);
			deferred.reject(err);
		});

		return deferred.promise;
	}

	function _taskPullRemote(deferred) {
		console.log('TASK PULL REMOTE');
		var found = false;
		for (peerid in waitingList) {
			found = true;
			console.log(peerid);
			var room = waitingList[peerid];
			room.ask(peerid, {
				route: '/task/pull',
				caller: room.peer.id
			}).then(function (task) {
				if (!task.answer) {
					delete(waitingList[peerid]);
					_taskPullRemote(deferred);
				} else {
					task = task.answer;
					task.caller = peerid;
					deferred.resolve(task);
				}
			});
			return;
		}
		if (!found) {
			deferred.resolve(null);
		}
	}

	function taskInsert(data, caller, room, timeout) {
		console.log('AGENT ROUTE TASK/INSERT');
		var deferred = q.defer();

		if (!data.self) {
			data.self = false;
		}

		if (!data.delay) {
			data.delay = false;
		}

		if (timeout) {
			data.timeout = timeout;
		}

		data.started = 0;
		data.finished = 0;

		db.insert('tasks', data).then(function (task) {
			console.log('task inserted id: ' + task._id);
			tasksDeffereds[task._id] = deferred;

			magicwheel.activate();
		});

		return deferred.promise;
	}

	function taskFinish(data, caller, room) {
		console.log('AGENT ROUTE TASK/FINISH');

		db.update('tasks', {
			_id: data.task.id
		}, {
			finished: Date.now(),
			result: data.task.result
		}).then(function (task) {
			if (tasksDeffereds[data.task.id]) {
				data.task.caller = caller;
				tasksDeffereds[data.task.id].resolve(data.task);
			} else {
				//                console.log('not found');
			}
		});

	}

	function taskUpdate(data, caller, room) {
		console.log('AGENT ROUTE TASK/UPDATE');

		db.update('tasks', {
			_id: data.id
		}, {
			status: data.status
		}).then(function (task) {});
	}

	function taskHelp(data, caller, room) {
		waitingList[caller] = room;

		magicwheel.activate();
	}

	var routes = {
		'/task/insert': {
			controller: taskInsert,
			self: true
		},
		'/task/list': {
			controller: taskList,
			self: true
		},
		'/task/clear': {
			controller: taskClear,
			self: true
		},
		'/task/pull': {
			controller: taskPull
		},
		'/task/finish': {
			controller: taskFinish
		},
		'/task/update': {
			controller: taskUpdate
		},
		'/task/help': {
			controller: taskHelp
		}
	}

	$.extend(true, magicwheel.routes, routes);

	return {
		routes: routes
	}
});