'use strict';

describe("$.Q.defer", function() {
    var testResult = false;

    function TestObject(name) {
        this.name = name;


        this.succeed = function(param) {
            setTimeout(
                function() {
                    this.name = param;
                    this.onload && this.onload();
                }.bind(this),
                1
            );
        };

        this.custom = function(eventName) {
            setTimeout(
                function() {
                    this[eventName] && this[eventName]();
                }.bind(this),
                1
            );
        };

        this.fail = function(param) {
            setTimeout(
                function() {
                    this.onerror && this.onerror();
                }.bind(this),
                1
            );
        };
    }

    it("resolves on onload", function() {
        runs(function() {
            testResult = false;

            var deferred = $.Q.deferObject(new TestObject());

            $.when(
                deferred.do({succeed: ['done']})
            ).done(function() {
                testResult = deferred.target.name;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe('done');
        });
    });

    it("fails on onerror", function() {
        runs(function() {
            testResult = false;

            var deferred = $.Q.deferObject(new TestObject());

            $.when(
                deferred.do({fail: []})
            ).fail(function() {
                testResult = true;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(true);
        });
    });

    it("resolves on custom successEvent", function() {
        runs(function() {
            testResult = false;

            var deferred = $.Q.deferObject(new TestObject(), "onwhatever");

            $.when(
                deferred.do({custom: ['onwhatever']})
            ).done(function() {
                testResult = 1;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("fails on custom errorEvent", function() {
        runs(function() {
            testResult = false;

            var deferred = $.Q.deferObject(new TestObject(), "onwhatever", "onthatwentwrong");

            $.when(
                deferred.do({custom: ['onthatwentwrong']})
            ).fail(function() {
                testResult = 1;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("can set properties", function() {
        runs(function() {
            testResult = 1;

            var deferred = $.Q.deferObject(new TestObject(), "onwhatever", "onthatwentwrong");

            deferred.set({name: "lulu"});

            testResult = deferred.target.name;
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe('lulu');
        });
    });
});
