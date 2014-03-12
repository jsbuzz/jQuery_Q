(function($) {

    /**
     * Wrapper object and basic caller for promise chaining.
     * The first argument is the function to call, all the others are used as its arguments.
     * 
     * @param {Function} fn 
     * 
     */
    $.Q = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function() {
            return fn.apply(fn, args);
        };
    };

    /**
     * Same as $.Q but the first parameter is the host object of the function.
     * The first argument is the function to call, all the others are used as its arguments.
     * 
     * @param {Object} _this
     * @param {Function} fn 
     * 
     */
    $.Q.bound = function(_this, fn) {
        var args = Array.prototype.slice.call(arguments, 2);
        fn = (typeof(fn)==='function' ? fn : _this[fn]);

        return function(transparency) {
            args.push(transparency);
            return fn.apply(_this, args);
        };
    };


    /**
     * The same as $.Q but it will forward the result of the last chain step as parameter to the function
     * 
     * @param {Function} fn 
     * 
     */
    $.Q.use = function(fn) {
        var args = Array.prototype.slice.call(arguments, 0);
        return fn.bind.apply(fn, args);
    };

    /**
     * Modifier - always resolves. If the given promise resolves it forwards the results, on failure it uses
     * the second parameter as a fallback value.
     * Can be used with a second paramtere or with the extension .or(...)
     *
     *    $.when(
     *       $.Q.anyway(promise, 'failed')
     *    ).done(...)
     *
     *    $.when(
     *       $.Q.anyway(promise).or('failed')
     *    ).done(...)
     * 
     * @param {Promise} promise  the promise to modify
     * @param {Mixed} onError    the value it returns on failure
     * 
     */
    $.Q.anyway = function(promise, onError) {
        if(typeof(promise) === 'function') {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                return $.Q.anyway(promise.apply(this, args), onError);
            }
        }
        var dfd = new $.Deferred;

        $.when(promise)
            .done(function(result) {dfd.resolve(result)})
            .fail(function() {dfd.resolve(onError)})
        ;

        var r = dfd.promise();
        r.or = function(value) {onError = value; return this;}
        return r;
    };

    /**
     * Modifier - Inverts the outcome of the promise.
     * 
     * @param {Promise} promise  the promise to modify
     * 
     */
    $.Q.not = function(promise) {
        if(typeof(promise) === 'function') {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                return $.Q.not(promise.apply(this, args));
            }
        }
        var dfd = new $.Deferred;

        $.when(promise)
            .done(function(result) {dfd.reject(result)})
            .fail(function(result) {dfd.resolve(result)})
        ;
        return dfd.promise();    
    };

    /**
     * Group modifier - resolves with the first result it gets from the given set of promises.
     * It can be called with one array or with multiple arguments
     */
    $.Q.anyOf = function(promises) {
        promises = (promises instanceof Array) ? promises : Array.prototype.slice.call(arguments, 0);
        var dfd = new $.Deferred;

        promises.forEach(function(promise) {
            promise.done(function(result) {
                dfd.resolve(result);
            });
        });

        return dfd.promise();
    };

    /**
     * Group modifier - resolves if at least on of the given promises resolves. The result will be the 
     * set of results from the given promises in the original order. The failed ones will have undefined as result.
     * It can be called with one array or with multiple arguments.
     *
     * Important to note that it will wait until all the promises finish.
     */
    $.Q.someOf = function(promises) {
        promises = (promises instanceof Array) ? promises : Array.prototype.slice.call(arguments, 0);
        var returned = [],
            results = [],
            dfd = new $.Deferred;

        promises.forEach(function(promise, i) {
            returned[i] = false;
            results[i] = undefined;
            promise.done(function(result) {
                returned[i] = true;
                results[i] = result;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        return false;
                    }
                }
                dfd.resolve(results);
            }).fail(function() {
                returned[i] = true;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        return false;
                    }
                }
                if(results.length) {
                    dfd.resolve(results);
                } else {
                    dfd.reject();
                }
            });
        });

        return dfd.promise();
    };

    /**
     * Group modifier - resolves if at least on of the given promises resolves. The result will be a named map of 
     * the results from the given promises. The failed ones won't be in the result set at all.
     *
     * Important to note that it will wait until all the promises finish.
     *
     * @param {Object} names  the promises to listen to
     * 
     */
    $.Q.someFrom = function(names) {
        var promises = [],
            returned = [],
            map = [],
            results = false,
            dfd = new $.Deferred;

        var index = 0;
        for(var name in  names) {
            if(!names.hasOwnProperty(name)) {
                continue;
            }
            promises[index] = names[name];
            map[index] = name;
            returned[index] = false;
            index++;
        }

        promises.forEach(function(promise, i) {
            promise.done(function(result) {
                returned[i] = true;
                if(!results) {
                    results = {};
                }
                results[map[i]] = result;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        return false;
                    }
                }
                dfd.resolve(results);
            }).fail(function() {
                returned[i] = true;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        return false;
                    }
                }
                if(results) {
                    dfd.resolve(results);
                } else {
                    dfd.reject();
                }
            });
        });

        return dfd.promise();
    };

    /**
     * Simple async delay function.
     * 
     * @param {Int} timeout
     * 
     */
    $.Q.wait = function(timeout, transparency) {
        var dfd = new $.Deferred();

        setTimeout(
            function(){
                dfd.resolve(transparency);
            },
            timeout
        );

        return dfd.promise();
    };

})(jQuery);
