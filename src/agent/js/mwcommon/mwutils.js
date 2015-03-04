define(function (require) {
    var utils = {
        require: function (varNames, deferred) {

            if (!deferred) {
                deferred = magicwheel.require.q.defer();
            }

            var ready = true;
            
            varNames.map(function(name){
                if(! window[name]){
                    ready = false;
                }
            });
            
            if (ready) {
                deferred.resolve();
            } else {
                setTimeout(function () {
                    magicwheel.utils.require(varNames, deferred)
                }, 1000);
            }

            return deferred.promise;
        }
    }
    
    return utils;
});