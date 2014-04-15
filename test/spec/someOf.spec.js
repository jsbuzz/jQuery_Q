'use strict';

describe("$.Q.someOf", function() {
    var testResult = false;

    it("resolves with all successes", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someOf(
                    $.Q.debug.success(1),
                    $.Q.debug.success(2),
                    $.Q.debug.failure(1)
                )
            ).done(function(results) {
                testResult = results[1] - results[0];
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("has undefined on all errors", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someOf(
                    $.Q.debug.failure(1),
                    $.Q.debug.success(2),
                    $.Q.debug.failure(1)
                )
            ).done(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult.length;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual([undefined, 2, undefined]);
        });
    });

    it("results are in the right order", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someOf(
                    $.Q.wait(3, 1),
                    $.Q.wait(2, 2),
                    $.Q.wait(1, 3)
                )
            ).done(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult.length;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual([1, 2, 3]);
        });
    });

    it("fails if all fail and errors are in the right order", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someOf(
                    $.Q.not($.Q.wait(3, 1)),
                    $.Q.not($.Q.wait(2, 2)),
                    $.Q.not($.Q.wait(1, 3))
                )
            ).fail(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult.length;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual([1, 2, 3]);
        });
    });

    it("throws error if no promises given", function() {
        var errorThrown = false;
        try{
            $.Q.someOf();
        } catch(e) {
            errorThrown = true;
        }

        expect(errorThrown).toBe(true);

    });

    it("fires progress callbacks", function() {
        var progress= [];

        runs(function() {
            testResult = 0;

            $.Q.someOf(
                $.Q.debug.success(1),
                $.Q.wait(1),
                $.Q.wait(2),
                $.Q.wait(3),
                $.Q.wait(4)
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
});
