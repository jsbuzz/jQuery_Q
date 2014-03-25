(function($) {

    'use strict';

    function isDeferred(obj) {
        return (typeof obj.done + typeof obj.fail + typeof obj.state).match(/(function){3}/);
    }

    /**
    * chaining wrappers
    *  - $.Q
    *  - $.Q.use
    *  - $.Q.bound
    *  - $.Q.apply
    *  - $.Q.bound
    */

    /**
     * Wrapper method for promise chaining.
     * The first argument is the function to call, all the others are used as its arguments.
     * $.Q is not transparent to a pipe chain, so the result of the last operation will be lost.
     * If you want to chain operations use $.Q.use or $.Q.bound instead.
     * The parameter can have three types:
     *  - function: $.Q returns with a wrapper function
     *  - string: $.Q will accept a string as a method of $.Q itself (e.g. use, bound, wait, pipe etc.)
     *  - deferred: passes thru as deferred
     * 
     * Example:
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q(getFlight, id, options), // get flight object
     *      $.Q.use(getFlightDetails) // get the details of the flight object
     *  ).done(function(details) {...})
     *
     * @param {mixed} fn
     * 
     */
    $.Q = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);

        if(typeof(fn) === 'string') {
            fn = $.Q[fn];
        } else if(isDeferred(fn)) {
            return fn;
        }

        return function() {
            return fn.apply(fn, args);
        };
    };

    /**
     * The same as $.Q but it will use the result of the last operation
     * 
     * @param {Function} fn 
     * 
     */
    $.Q.use = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1),
            keepFlow = false;

        if(typeof(fn) === 'string') {
            fn = $.Q[fn];
            keepFlow = true;
        } else if(isDeferred(fn)) {
            return fn;
        }

        return function(_transparent_) {
            if(typeof _transparent_ !== 'undefined') {
                args.push(keepFlow ? new $.Q._result(_transparent_) : _transparent_);
            }
            return fn.apply(fn, args);
        };
    };

    /**
     * Similar to $.Q, but it let's you bind the given function to a specified object. It is also
     * transparent to a pipe workflow so it will pass the result of the provous action to the function.
     *
     * The fn parameter can have two types:
     *  - function: returns with a wrapper function to call the bound version of the function
     *  - string: $.Q.bound will interpret it as a method of the host object 
     * 
     * Example:
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q.bound(Flights, Flights.get, id, options), // calls Flights.get(id, options)
     *      $.Q.bound(Flight, 'details') // calls Flight.details(<result>)
     *  ).done(function(details) {...})
     * 
     * @param {Object} _this
     * @param {mixed} fn 
     * 
     */
    $.Q.bound = function(_this, fn) {
        var args = Array.prototype.slice.call(arguments, 2);
        fn = (typeof(fn)==='function' ? fn : _this[fn]);

        return function(_transparent_) {
            args.push(_transparent_);
            return fn.apply(_this, args);
        };
    };

    /**
     * Similar to $.Q.bound, but it is using the result of the previous call as the host object
     * 
     * Example:
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q.bound(Flights, 'get', id, options), // calls Flights.get, returns with a Flight Object
     *      $.Q.apply('details', options) // calls <result>.details(options)
     *  ).done(function(details) {...})
     * 
     * @param {Object} _this
     * @param {mixed} fn 
     * 
     */
    $.Q.apply = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);

        return function(resultObject) {
            fn = (typeof(fn)==='function' ? fn : resultObject[fn]);
            return fn.apply(resultObject, args);
        };
    };

    /**
    * Result modifiers
    *  - $.Q.not
    *  - $.Q.try + or
    */

    /**
     * Modifier - always resolves. If the given promise resolves it forwards the results, 
     * on failure it uses the second parameter as a fallback value.
     * Can be used with a second parameter or with the extension .or(...)
     *
     *    $.when(
     *       $.Q.try(promise, 'failed')
     *    ).done(...)
     *
     *    $.when(
     *       $.Q.try(promise).or('failed')
     *    ).done(...)
     * 
     * @param {Promise} promise  the promise to modify
     * @param {Mixed} onError    the value it returns on failure
     * 
     */
    $.Q.try = function(promise, onError) {
        if(typeof(promise) === 'function') {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
                return $.Q.try(promise.apply(this, args), onError);
            };
        }
        var dfd = new $.Deferred();

        // added setTimeout wrapper to move the execution outside of the scope of the $.when(...)
        // this way the .or(..) extension can be attached to already rejected promises too
        setTimeout(function() {
            $.when(promise)
                .done(function(result) {dfd.resolve(result);})
                .fail(function() {dfd.resolve(onError);})
            ;
        },1);

        var r = dfd.promise();
        r.or = function(value) {onError = value; return this;};

        return r;
    };

    /**
     * Modifier - Inverts the outcome of the promise.
     * 
     * @param {Promise} promise  the promise to modify
     * 
     */
    $.Q.not = function(promise) {
        var args = Array.prototype.slice.call(arguments, 1);

        if(typeof(promise) === 'function') {
            return function() {
                args = args.concat(Array.prototype.slice.call(arguments));
                return $.Q.not(promise.apply(this, args));
            };
        }
        var dfd = new $.Deferred();

        $.when(promise)
            .done(function(result) {dfd.reject(result);})
            .fail(function(result) {dfd.resolve(result);})
        ;
        return dfd.promise();
    };


    /**
    * Workflows
    *  - $.Q.anyOf
    *  - $.Q.someOf
    *  - $.Q.someFrom
    *  - $.Q.allOf
    *  - $.Q.pipe
    */

    /**
     * Group modifier - resolves with the first result it gets from the given set of promises.
     * It can be called with one array or with multiple arguments
     */
    $.Q.anyOf = function(promises) {
        promises = (promises instanceof Array) ? promises : Array.prototype.slice.call(arguments, 0);
        var keepFlow;

        if(promises.length && promises[promises.length - 1] instanceof $.Q._result) {
            keepFlow = promises.pop().result;
        }

        var dfd = new $.Deferred(),
            errors = [];

        if(!promises.length) {
            throw new Error('$.Q.anyOf called with no parameters');
        }

        promises.forEach(function(promise) {
            if(typeof(promise) === 'function') {
                promise = promise(keepFlow);
            }
            promise.done(function(result) {
                dfd.resolve(result);
            }).fail(function(error) {
                errors.push(error);
                if(errors.length === promises.length) {
                    dfd.reject(errors);
                }
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
        var keepFlow;

        if(promises.length && promises[promises.length - 1] instanceof $.Q._result) {
            keepFlow = promises.pop().result;
        }

        var results = new Array(promises.length),
            progress = 0,
            dfd = new $.Deferred(),
            errors = new Array(promises.length),
            errorCount = 0;

        if(!promises.length) {
            throw new Error('$.Q.someOf called with no parameters');
        }

        var allAreDone = function() {
            // notify about the percentage
            dfd.notify({
                pct: 100 * (++progress) / promises.length,
                msg : '',
                results: results
            });

            return progress >= promises.length;
        };

        promises.forEach(function(promise, i) {
            if(typeof(promise) === 'function') {
                promise = promise(keepFlow);
            }
            promise.done(function(result) {
                results[i] = result;
                if(allAreDone()) {
                    dfd.resolve(results);
                }
            }).fail(function(error) {
                errorCount++;
                errors[i] = error;

                if(allAreDone()) {
                    if(errorCount < results.length) {
                        dfd.resolve(results);
                    } else {
                        dfd.reject(errors);
                    }
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
    $.Q.someFrom = function(names, keepFlow) {
        var promises = [],
            map = [],
            i = 0,
            dfd = new $.Deferred(),
            mapper = function(results) {
                var resultObj = {};
                map.forEach(function(name, i) {
                    resultObj[name] = results[i];
                });
                return resultObj;
            };

        for(var name in names) {
            map[i] = name;
            promises[i] = names[name];
            i++;
        }

        if(keepFlow instanceof $.Q._result) {
            promises.push(keepFlow);
        }

        $.when($.Q.someOf(promises))
            .done(function(results) { dfd.resolve(mapper(results)); })
            .fail(function(results) { dfd.reject(mapper(results)); })
            .progress(function(prg) { dfd.notify(prg); });

        return dfd.promise();
    };

    /**
     * allOf - The same as $.when, but it can accept an array as well and it will try to call
     * functions to get the promises
     */
    $.Q.allOf = function(tasks) {
        tasks = (tasks instanceof Array) ? tasks : Array.prototype.slice.call(arguments, 0);
        var keepFlow;

        if(tasks.length && tasks[tasks.length - 1] instanceof $.Q._result) {
            keepFlow = tasks.pop().result;
        }
        tasks.forEach(function(task, i) {
            if(typeof task === 'function') {
                tasks[i] = task(keepFlow);
            }
        });
        return $.when.apply($, tasks);
    };


    /**
     * Pipe
     */
    $.Q.pipe = function() {
        var steps = Array.prototype.slice.call(arguments, 0),
            progress = 0,
            dfd = new $.Deferred();

        var asPromise = function(step, r) {return (typeof(step) === 'function' ? step(r) : step);},
            abort = function(err) {dfd.reject(err);},
            channel = function() {
                var result = Array.prototype.slice.call(arguments);
                if(result.length === 1) {
                    result = result[0];
                }
                ++progress;

                // send the progress to the deferred
                dfd.notify({
                    pct    : parseInt(100 * progress / steps.length),
                    msg    : progress + '/' + steps.length,
                    done   : progress,
                    total  : steps.length,
                    result : result
                });

                // if we are done
                if(progress >= steps.length) {
                    dfd.resolve(result);
                    return true;
                }

                // otherwise let's call the next step
                $.when(
                    asPromise(steps[progress], result)
                ).done(channel).fail(abort);
            };

        // call the first step
        $.when(
            asPromise(steps[0])
        ).done(channel).fail(abort);

        return dfd.promise();
    };

    /**
    * Debug functions and helpers
    *  - $.Q.wait
    *  - $.Q.debug.success
    *  - $.Q.debug.failure
    *  - $.Q.debug.pending
    */

    /**
     * Simple async delay function.
     * 
     * @param {Int} timeout
     * 
     */
    $.Q.wait = function(timeout, _transparent_) {
        var dfd = new $.Deferred(),
            promise = dfd.promise();

        if(_transparent_ instanceof $.Q._result) {
            _transparent_ = _transparent_.result;
        }

        promise.id = setTimeout(
            function(){
                dfd.resolve(_transparent_);
            },
            timeout
        );

        return promise;
    };

    /**
     * Debug/test helpers
     * 
     */
    $.Q.debug = {
        success : function(result) {
            return new $.Deferred().resolve(result);
        },
        failure : function(error) {
            return new $.Deferred().reject(error);
        },
        pending : function() {
            return new $.Deferred().promise();
        }
    };

    /**
     * $.Q._result is a helper to handle result distribution in parallel workflows in a pipe
     * 
     */
    $.Q._result = function(result) {
        this.result = result;
    };

    /**
    * Promise converters
    *  - $.Q.defer
    *  - $.Q.deferObject
    */

    /**
     * defer - creates a deferred version of an async function with the given parameters
     * 
     */
    $.Q.defer = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1),
            dfd = new $.Deferred(),
            options = {
                handlesError: undefined,
                fn: fn,
                timeout: 500,
                scope: fn
            };

        if(typeof(fn) === 'object') {
            $.extend(options, fn);
        }

        // push in extra arguments if needed
        if(options.fn.length > args.length) {
            var remaining = options.fn.length - args.length,
                needed = options.handlesError === undefined || options.handlesError  ? 2 : 1;

            while(remaining > needed) {
                args.push(undefined);
                remaining--;
            }
        }

        // add success callback
        if(options.fn.length > args.length) {
            args.push(function(result) {
                dfd.resolve(result);
            });
        } else {
            throw new Error('No success callback for method?');
        }
        
        // add error callback
        if(options.fn.length > args.length) {
            args.push(function(err) {
                dfd.reject(err);
            });
        } else if(options.handlesError) {
            throw new Error('No error callback for method?');
        } else if(options.timeout) {
            setTimeout(function() {dfd.reject('timeout');}, options.timeout);
        }

        try {
            options.fn.apply(options.scope, args);
        } catch(error) {
            dfd.reject(error);
        }

        return dfd.promise();
    };

    /**
     * deferObject - creates a deferred version of a typical async object like FileReader or Image
     * You can access the target object through do/set methods or as the .target propery directly
     *
     * @param {Object} target
     * @param {String} successNames  List of success events divided by spaces
     * @param {String} errorNames    List of error events divided by spaces
     */
    $.Q.deferObject = function(target, successNames, errorNames) {
        var dfd = new $.Deferred(),
            progressNames = 'onprogress';

        successNames = successNames || 'onload onloadend';
        errorNames = errorNames || 'onerror onabort';

        // attach success callbacks
        successNames.split(/[\s]+/).forEach(function(cb) {
            target[cb] = function(result) {
                dfd.resolve(result);
            };
        });

        // attach error callbacks
        errorNames.split(/[\s]+/).forEach(function(cb) {
            target[cb] = function(err) {
                dfd.reject(err);
            };
        });

        // attach progress callbacks
        progressNames.split(/[\s]+/).forEach(function(cb) {
            target[cb] = function(prg) {
                dfd.progress(prg);
            };
        });

        var promise = dfd.promise();
        promise.target = target;
        promise.do = function(toDo) {
            try {
                for(var method in toDo) {
                    if(!toDo.hasOwnProperty(method)) {
                        continue;
                    }
                    target[method].apply(target, toDo[method]);
                }
            } catch(error) {
                dfd.reject(error);
            }
            return promise;
        };

        promise.set = function(properties) {
            try {
                for(var prop in properties) {
                    if(!properties.hasOwnProperty(prop)) {
                        continue;
                    }
                    target[prop] = properties[prop];
                }
            } catch(error) {
                dfd.reject(error);
            }
            return promise;
        };

        return promise;
    };
})(jQuery);
