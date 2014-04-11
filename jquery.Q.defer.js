(function($) {

    'use strict';


    /**
    * Promise converters
    *  - $.Q.defer
    *  - $.Q.deferObject
    */
    $.Q = $.Q || {};

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
    $.Q.deferObject = function(target, successNames, errorNames, progressTarget) {
        var dfd = new $.Deferred(),
            progressNames = 'onprogress onloadend',
            empties = function(str) { return str; };

        if(typeof progressTarget === undefined) {
            progressTarget = target;
        } else if(typeof progressTarget === 'string') {
            progressTarget = target[progressTarget];
        }

        successNames = successNames || 'onload';
        errorNames = errorNames || 'onerror onabort';

        // attach success callbacks
        successNames.split(/[\s]+/).filter(empties).forEach(function(cb) {
            target[cb] = function(result) {
                dfd.resolve(result);
            };
        });

        // attach error callbacks
        errorNames.split(/[\s]+/).filter(empties).forEach(function(cb) {
            target[cb] = function(err) {
                dfd.reject(err);
            };
        });

        // attach progress callbacks
        progressNames.split(/[\s]+/).filter(empties).forEach(function(cb) {
            progressTarget[cb] = function(prg) {
                dfd.notify(prg);
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

        promise.get = function(property) {
            return target[property];
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
