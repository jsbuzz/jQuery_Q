'use strict';

describe("$.Q.allOf", function() {
    var testResult = false;

    it("fails on first failure", function() {
        runs(function() {
            testResult = 0;

            $.Q.allOf(
                $.Q.debug.success(1),
                $.Q.wait(200),
                $.Q.debug.failure(1),
                $.Q.debug.failure(2)
            ).fail(function(error) {
                testResult = error;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual(1);
        });
    });

    it("resolves if all succeed", function() {
        runs(function() {
            testResult = 0;

            $.Q.allOf(
                $.Q.debug.success(1),
                $.Q.debug.success(2),
                $.Q.wait(1, 3)
            ).done(function(results) {
                testResult = results;
            })
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 10);

        runs(function() {
            expect(testResult).toEqual([1,2,3]);
        });
    });
    it("can handle paramlist", function() {
        runs(function() {
            testResult = false;

            $.Q.allOf(
                $.Q.debug.success(1),
                $.Q.debug.success(2)
            ).done(function(results) {
                testResult = results[0] + results[1];
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(3);
        });
    });

    it("can handle array", function() {
        runs(function() {
            testResult = false;

            $.Q.allOf(
                [
                    $.Q.debug.success(1),
                    $.Q.debug.success(2)
                ]
            ).done(function(results) {
                testResult = results[0] + results[1];
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(3);
        });
    });

    it("can handle functions", function() {
        runs(function() {
            testResult = false;

            $.Q.allOf(
                    $.Q($.Q.debug.success, 1),
                    $.Q.debug.success(2)
            ).done(function(results) {
                testResult = results[0] + results[1];
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

            $.Q.allOf(
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

    it("throws error if called with no params", function() {
        runs(function() {
            testResult = 0;

            try{
                $.Q.allOf();
            } catch(e){
                testResult = e.message;
            }
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 100);

        runs(function() {
            expect(testResult).toEqual('$.Q.allOf called with no parameters');
        });
    });
});
