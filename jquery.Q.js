(function($) {

    'use strict';

    /**
    * Chaining wrappers
    * <ul>
    * <li> $.Q </li>
    * <li> $.Q.use </li>
    * <li> $.Q.bound </li>
    * <li> $.Q.apply </li>
    * <li> $.Q.bound </li>
    * </ul>
    *
    * @namespace Chaining
    */
    $.Q = true;

    /**
     * Wrapper method for promise chaining.
     * The first argument is the function to call, all the others are used as its arguments.
     * $.Q is not transparent to a pipe chain, so the result of the last operation will be lost.
     * If you want to chain operations use $.Q.use or $.Q.bound instead.
     * The parameter can have three types: <ul>
     * <li> function: $.Q returns with a wrapper function </li>
     * <li> string: $.Q will accept a string as a method of $.Q itself (e.g. use, bound, wait, pipe etc.) </li>
     * <li> deferred: passes thru as deferred </li>
     * </ul>
     * 
     * @example
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q(getFlight, id, options), // get flight object
     *      $.Q.use(getFlightDetails) // get the details of the flight object
     *  ).done(function(details) {...})
     *
     * @memberof Chaining
     * @param {(string|function|promise)} fn    The function to wrap
     * @returns {function}
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
     * @example
        function getFileContents(name) {
            return $.Q.pipe(
                $.Q(fileSystem.getFile, name), 
                $.Q.use(fileSystem.read), // this will receive the file object
                $.Q.use(parseContents)    // this will receive the contents and parse it
            );
        }
     * @memberof Chaining
     * @param {(string|function|promise)} fn 
     * @returns {function}
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
     * @example
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q.bound(Flights, Flights.get, id, options), // calls Flights.get(id, options)
     *      $.Q.bound(Flight, 'details') // calls Flight.details(<result>)
     *  ).done(function(details) {...})
     * 
     * @memberof Chaining
     * @param {Object} _this  The host object of the method
     * @param {(string|function)} method  the method to call on the host object
     * @returns {function}
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
     * @example
     *  $.Q.pipe(
     *      $.Q('wait', timeout), // provide a short time to hit cancel
     *      $.Q.bound(Flights, 'get', id, options), // calls Flights.get, returns with a Flight Object
     *      $.Q.apply('details', options) // calls <result>.details(options)
     *  ).done(function(details) {...})
     * 
     * @memberof Chaining
     * @param {(string|function)} fn  the method or name of the method to call on the result object
     * @returns {function}
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
    *
    * @namespace Modifiers
    */
    $.Q.try = true;

    /**
     * Always resolves. If the given promise resolves it forwards the results, 
     * on failure it uses the second parameter as a fallback value.
     * Can be used with a second parameter or with the extension .or(...)
     *
     * @example
     *    $.when(
     *       $.Q.try(promise, 'failed')
     *    ).done(...)
     *
     *    $.when(
     *       $.Q.try(promise).or('failed')
     *    ).done(...)
     * 
     * @memberof Modifiers
     * @param {Promise} promise  the promise to modify
     * @param {Mixed} onError    the value it returns on failure
     * @returns {promise}
     */
    $.Q.try = function(promise, onError) {
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
     * Inverts the outcome of the promise.
     * 
     * @example
     * $.when(
     *       $.Q.someFrom({
     *           readme  : $.Q.not(fileSystem.getFile('readme.md')),
     *           licence : $.Q.not(fileSystem.getFile('licence.txt')),
     *           author  : $.Q.not(fileSystem.getFile('author.txt'))
     *       }).progress(function(prg) {console.log('checking missing files', parseInt(prg.pct) + '%')})
     *   ).done(function(missing) {
     *       if(missing.readme) {
     *           fileSystem.createFile('readme.md', 'This is a simple test');
     *       }
     *       if(missing.licence) {
     *           fileSystem.createFile('licence.txt', 'GPL 2.0');
     *       }
     *       if(missing.author) {
     *           fileSystem.createFile('author.txt', 'MySelf');
     *       }
     *   });
     *
     * @memberof Modifiers
     * @param {Promise} promise  the promise to modify
     * @returns {promise}
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
    * <ul>
    *   <li> $.Q.anyOf </li>
    *   <li> $.Q.someOf </li>
    *   <li> $.Q.someFrom </li>
    *   <li> $.Q.allOf </li>
    *   <li> $.Q.pipe </li>
    * </ul>
    *
    * @namespace Workflows
    */
    $.Q.anyOf = true;

    /**
     * Resolves with the first result it gets from the given set of promises.
     * It can be called with an array of promises or with multiple arguments
     *
     * @example
     *  $.anyOf(
     *      this.fileSystem.getFile(tmpName), // get the file
     *      $.Q.pipe(                         // or create it if doesn't exist
     *          $.Q.not(this.fileSystem.getFile(tmpName)),
     *          this.fileSystem.createFile(tmpName)
     *      )
     *  ).done(function(tmpFile) { ...
     *
     * @memberof Workflows
     * @returns {promise}
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
     * Resolves if at least one of the given promises resolves. The result will be the 
     * set of results from the given promises in the original order. The failed ones will have 
     * <i>undefined</i> as result.
     * <p>It can be called with an array of promises or with multiple arguments.</p>
     *
     * <p><i>Important to note that it will wait until all the promises finish.</i></p>
     * 
     * @example
     *  filenames = ['readme.md', 'author.txt',..., 'licence.txt'];
     *
     *  $.Q.someOf(
     *      filenames.map(function(fname) { return $.Q.not(fileSystem.exists(fname)); })
     *  ).done(function(results) {
     *      results.forEach(function(missing, i) {
     *          if(missing) {
     *              fileSystem.createFile(filenames[i]);
     *          }
     *      });
     *  }).fail(function(errors) {
     *      console.log('all exist', errors);
     *  }).progress(function(prg) {
     *      console.log(prg.pct.toPrecision(3) + '% complete');
     *  });
     *
     * @param {object} promises  named map of promises (or functions returning promises)
     * @memberof Workflows
     * @returns {promise}
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
     * Resolves if at least one of the given promises resolves. The result will be a named map of 
     * the results from the given promises. The failed ones will get a result <i>undefined</i>.
     *
     * <p><i>Important to note that it will wait until all the promises finish.</i></p>
     *
     * @example
     *  $.Q.someFrom({
     *          readme  : $.Q.not(fileSystem.exists('readme.md')),
     *          licence : $.Q.not(fileSystem.exists('licence.txt')),
     *          author  : $.Q.not(fileSystem.exists('author.txt'))
     *  }).done(function(missing) {
     *      if(missing.readme) {
     *          fileSystem.createFile('readme.md', 'This is a simple test');
     *      }
     *      if(missing.licence) {
     *          fileSystem.createFile('licence.txt', 'GPL 2.0');
     *      }
     *      if(missing.author) {
     *          fileSystem.createFile('author.txt', 'MySelf');
     *      }
     *  }).progress(function(prg) {
     *      console.log(prg.pct.toPrecision(3) + '% complete');
     *  });
     *
     * @memberof Workflows
     * @returns {promise} 
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
     * The same as $.when, but it can accept an array of promises as well and has a default progress watcher.
     * It only resolves if all the given promises resolve. 
     * Jumps to fail as soon as the first promise fails.
     *
     * @memberof Workflows
     * @returns {promise}
     */
    $.Q.allOf = function(promises) {
        promises = (promises instanceof Array) ? promises : Array.prototype.slice.call(arguments, 0);
        var keepFlow;

        if(promises.length && promises[promises.length - 1] instanceof $.Q._result) {
            keepFlow = promises.pop().result;
        }

        var results = new Array(promises.length),
            progress = 0,
            dfd = new $.Deferred();

        if(!promises.length) {
            throw new Error('$.Q.allOf called with no parameters');
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
                dfd.reject(error);
            });
        });

        return dfd.promise();
    };


    /**
     * Pipe
     *
     * @memberof Workflows
     * @returns {promise}
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
    *  - $.Q._result
    *  - isDeferred()
    */

    /**
     * Simple async delay function.
     * 
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
     * helper to determine if an object is a deferred
     * 
     */
    function isDeferred(obj) {
        return (typeof obj.done + typeof obj.fail + typeof obj.state).match(/(function){3}/);
    }

})(jQuery);
