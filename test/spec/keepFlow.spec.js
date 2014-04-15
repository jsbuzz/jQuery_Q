'use strict';

describe("KeepFlow", function() {
    var testResult = false;

    it("allOf distributes results in a pipe", function() {
        runs(function() {
            testResult = 0;

            function test(res) {
                return $.Q.debug.success(res);
            }

            $.Q.pipe(
                $.Q.debug.success('keepThis'),
                $.Q.use('allOf',
                    $.Q.use($.Q.debug.success),
                    $.Q.use($.Q.debug.success)
                )
            ).done(function(results) {
                testResult = results;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual(['keepThis', 'keepThis']);
        });
    });

    it("anyOf distributes results in a pipe", function() {
        runs(function() {
            testResult = 0;

            function test(res) {
                return $.Q.debug.success(res);
            }

            $.Q.pipe(
                $.Q.debug.success('keepThis'),
                $.Q.use('anyOf',
                    $.Q.use($.Q.debug.success),
                    $.Q.use($.Q.debug.success)
                )
            ).done(function(result) {
                testResult = result;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual('keepThis');
        });
    });
    it("someOf distributes results in a pipe", function() {
        runs(function() {
            testResult = 0;

            function test(res) {
                return $.Q.debug.success(res);
            }

            $.Q.pipe(
                $.Q.debug.success('keepThis'),
                $.Q.use('someOf',
                    $.Q.use($.Q.debug.success),
                    $.Q.use($.Q.debug.success)
                )
            ).done(function(results) {
                testResult = results;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual(['keepThis', 'keepThis']);
        });
    });

    it("someFrom distributes results in a pipe", function() {
        runs(function() {
            testResult = 0;

            function test(res) {
                return $.Q.debug.success(res);
            }

            $.Q.pipe(
                $.Q.debug.success('keepThis'),
                $.Q.use('someFrom',{
                    'a' : $.Q.use($.Q.debug.success),
                    'b' : $.Q.use($.Q.debug.success)
                })
            ).done(function(results) {
                testResult = results;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual({a : 'keepThis', b : 'keepThis'});
        });
    });
});
