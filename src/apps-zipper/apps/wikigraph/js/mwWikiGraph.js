//# sourceURL=mwWikiGraph.js


var q = magicwheel.require.q,
    _ = magicwheel.require._,
    $ = magicwheel.require.$;

function getLinksCall(title, plcontinue) {
    var deferred = q.defer();

    var data = {
        action: 'query',
        prop: 'links',
        titles: title,
        pllimit: 500,
        redirects: '',
        format: 'json'
    }

    if (plcontinue) {
        data.plcontinue = plcontinue;
    }
    $.ajax({
        url: "http://en.wikipedia.org/w/api.php",

        jsonp: "callback",

        dataType: "jsonp",

        data: data,

        // Work with the response
        success: function (response) {
            deferred.resolve(response);
        }
    });

    return deferred.promise;
};

function getAllLinksRecursive(inputObj, plcontinuue, resultLinks, deferred) {
    getLinksCall(inputObj.term, plcontinuue).then(function (data) {

        for (var key in data.query.pages) {
            var links = data.query.pages[key].links;
            var titles = links.map(function (link) {
                if (link.ns == 0) {
                    return link.title;
                }
                return null;
            });
            resultLinks = resultLinks.concat(_.compact(titles));
        }
        if (data['query-continue']) {
            var plcontinue = data['query-continue'].links.plcontinue;
            getAllLinksRecursive(inputObj, plcontinue, links, deferred);
            return;
        }
        deferred.resolve({
            links: resultLinks,
            normalized: data.query.normalized ? data.query.normalized[0].to : inputObj.term
        });
    });
}

function getAllLinks(inputObj) {
    var deferred = q.defer();

    getAllLinksRecursive(inputObj, '', [], deferred);

    return deferred.promise;
}

function routeQlinks(inputObj, caller, room, taskId) {
    console.log('AGENT ROUTE QLINKS');
    return getAllLinks(inputObj);
}

function routeProcess(inputObj, caller, room, taskId) {

    var deferred = q.defer();

    console.log('AGENT ROUTE WIKI PROCESS');
    getAllLinks(inputObj).then(function (result) {
        var countChildTasksFinished = 0;
        var tasksPromises = result.links.map(function (link) {
            var childTaskPromise = magicwheel.executeRoute('/wiki/qlinks', {
                term: link
            }, 'SELF', room);
            childTaskPromise.then(function () {
                countChildTasksFinished++;
                magicwheel.executeRoute('/task/update', {
                    id: taskId,
                    status: 'Fetching associations for term: ' + inputObj.term + ' - ' + countChildTasksFinished + '/' + result.links.length
                }, 'SELF', room);
            })
            return childTaskPromise;
        });
        q.all(tasksPromises).then(function (results) {
            deferred.resolve({
                results: results,
                normalized: result.normalized
            });
        });
    });
    return deferred.promise;
}

var routes = {
    '/wiki/qlinks': {
        controller: routeQlinks,
        queue: true
    },
    '/wiki/process': {
        controller: routeProcess,
        self: true,
        queue: true,
        delay: true
    }
}

$.extend(true, magicwheel.routes, routes);

function appInit() {
//    $('#mwapp')[0].innerHTML = "APP RUNNING WIKI";
}

appInit();