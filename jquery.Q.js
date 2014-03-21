(function($) {

    'use strict';

    function isDeferred(obj) {
        return (typeof obj.done + typeof obj.fail + typeof obj.state).match(/(function){3}/);
    }

    /**
     * Wrapper object and basic caller for promise chaining.
     * The first argument is the function to call, all the others are used as its arguments.
     * 
     * @param {Function} fn 
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
     * Same as $.Q but the first parameter is the host object of the function.
     * 
     * @param {Object} _this
     * @param {Function} fn 
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
     * The same as $.Q but it will use the result of the last operation
     * 
     * @param {Function} fn 
     * 
     */
    $.Q.use = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);

        if(typeof(fn) === 'string') {
            fn = $.Q[fn];
        } else if(isDeferred(fn)) {
            return fn;
        }

        return fn.bind.apply(fn, [fn].concat(args));
    };

    /**
     * Modifier - always resolves. If the given promise resolves it forwards the results, 
     * on failure it uses the second parameter as a fallback value.
     * Can be used with a second paramtere or with the extension .or(...)
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
        if(typeof(promise) === 'function') {
            return function() {
                var args = Array.prototype.slice.call(arguments, 0);
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
     * Group modifier - resolves with the first result it gets from the given set of promises.
     * It can be called with one array or with multiple arguments
     */
    $.Q.anyOf = function(promises) {
        promises = (promises instanceof Array) ? promises : Array.prototype.slice.call(arguments, 0);
        var dfd = new $.Deferred(),
            errors = [];

        if(!promises.length) {
            throw new Error('$.Q.anyOf called with no parameters');
        }

        promises.forEach(function(promise) {
            if(typeof(promise) === 'function') {
                promise = promise();
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
        var returned = [],
            results = new Array(promises.length),
            progress = 0,
            dfd = new $.Deferred(),
            errors = new Array(promises.length),
            errorCount =0;

        if(!promises.length) {
            throw new Error('$.Q.someOf called with no parameters');
        }

        promises.forEach(function(promise, i) {
            if(typeof(promise) === 'function') {
                promise = promise();
            }
            returned[i] = false;
            promise.done(function(result) {
                returned[i] = true;
                results[i] = result;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        dfd.notify({
                            pct: 100 * (++progress) / promises.length,
                            msg : '',
                            results: results
                        });
                        return false;
                    }
                }
                dfd.resolve(results);
            }).fail(function(error) {
                returned[i] = true;
                errorCount++;
                errors[i] = error;
                for(var j=0; j < returned.length; j++) {
                    if(!returned[j]) {
                        dfd.notify({
                            pct: 100 * (++progress) / promises.length,
                            msg : '',
                            results: results
                        });
                        return false;
                    }
                }
                if(errorCount < results.length) {
                    dfd.resolve(results);
                } else {
                    dfd.reject(errors);
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
            map = [],
            i = 0,
            dfd = new $.Deferred();

        for(var name in names) {
            map[i] = name;
            promises[i] = names[name];
            i++;
        }

        $.when(
            $.Q.someOf(promises)
        ).done(function(results) {
            var resultObj = {};
            map.forEach(function(name, i) {
                resultObj[name] = results[i];
            });

            dfd.resolve(resultObj);
        }).fail(function(results) {
            var resultObj = {};
            map.forEach(function(name, i) {
                resultObj[name] = results[i];
            });

            dfd.reject(resultObj);
        });

        return dfd.promise();
    };

    /**
     * Simple async delay function.
     * 
     * @param {Int} timeout
     * 
     */
    $.Q.wait = function(timeout, _transparent_) {
        var dfd = new $.Deferred(),
            promise = dfd.promise();

        promise.id = setTimeout(
            function(){
                dfd.resolve(_transparent_);
            },
            timeout
        );

        return promise;
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
            channel = function(result) {
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

        // arguments should be fulfilled
        if(options.fn.length > args.length) {
            throw new Error('Invalid argument list');
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
     */
    $.Q.deferObject = function(target, successNames, errorNames) {
        var dfd = new $.Deferred(),
            progressNames = 'onprogress';

        successNames = successNames || 'onload onloadend';
        errorNames = errorNames || 'onerror onabort';

        // attach success callbacks
        successNames.split(' ').forEach(function(cb) {
            target[cb] = function(result) {
                dfd.resolve(result);
            };
        });

        // attach error callbacks
        errorNames.split(' ').forEach(function(cb) {
            target[cb] = function(err) {
                dfd.reject(err);
            };
        });

        // attach progress callbacks
        progressNames.split(' ').forEach(function(cb) {
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

    /**
     * parallel - just a workaround to use $.when with an array of promises
     * 
     */
    $.Q.parallel = function(tasks) {
        tasks = (tasks instanceof Array) ? tasks : Array.prototype.slice.call(arguments, 0);
        return $.when.apply($, tasks);
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
        }
    };

})(jQuery);
