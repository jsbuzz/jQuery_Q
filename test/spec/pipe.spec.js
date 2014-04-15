'use strict';

describe("$.Q.pipe", function() {
    var testResult = false;

    it("pipes down the results", function() {
        runs(function() {
            testResult = false;

            function increaseTest(v) {
                return $.Q.debug.success(1+v);
            }

            $.when(
                $.Q.pipe(
                    $.Q.debug.success(1),
                    $.Q.use(increaseTest),
                    $.Q.use(increaseTest),
                    $.Q.use(increaseTest)
                )
            ).done(function(result) {
                testResult = result;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(4);
        });
    });

    it("first error stops execution", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.pipe(
                    $.Q.debug.success(1),
                    $.Q.use($.Q.debug.failure, 3),
                    $.Q.use('wait', 10000000)
                )
            ).fail(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(3);
        });
    });

    it("fires progress callbacks", function() {
        var progress= [];

        runs(function() {
            testResult = 0;

            $.Q.pipe(
                $.Q.debug.success(1),
                $.Q.use('wait', 1),
                $.Q.use('wait', 1),
                $.Q.use('wait', 1),
                $.Q.use('wait', 1)
            ).progress(function(prg) {
                progress.push(prg.pct);
            }).done(function() {
                testResult = 1;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 100);

        runs(function() {
            expect(progress).toEqual([20, 40, 60, 80, 100]);
        });
    });

    it("progress callback shows all results", function() {
        var progress= [];

        runs(function() {
            testResult = 0;

            $.Q.pipe(
                $.when(
                    $.Q.debug.success('one'),
                    $.Q.debug.success('two')
                ),
                $.Q.use('wait', 10, 'three')
            ).progress(function(prg) {
                progress.push(prg.result);
            }).done(function() {
                testResult = 1;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 100);

        runs(function() {
            expect(progress).toEqual([['one', 'two'], 'three']);
        });
    });

});
