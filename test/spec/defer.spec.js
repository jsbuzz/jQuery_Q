'use strict';

describe("$.Q.defer", function() {
    var testResult = false;

    function asyncWithError(timeout, result, success, error) {
        setTimeout(
            function() {
                if(result > 0)
                {
                    success(result);
                } else if(result < 0) {
                    error(result);
                }
            },
            timeout
        );
    }

    function asyncWithoutError(timeout, result, success) {
        setTimeout(
            function() {
                if(result > 0)
                {
                    success(result);
                }
            },
            timeout
        );
    }

    it("resolves on success on a fn with error callback", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer(asyncWithError, 1, 1)
            ).done(function(result) {
                testResult = result;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("resolves on success on a fn without error callback", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer(asyncWithoutError, 1, 1)
            ).done(function(result) {
                testResult = result;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("fails on error on a fn with error callback", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer(asyncWithError, 1, -1)
            ).fail(function(result) {
                testResult = result;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(-1);
        });
    });

    it("fails on timeout on a fn without error callback", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer({
                    fn: asyncWithoutError,
                    timeout: 10
                }, 1000, 0)
            ).fail(function(error) {
                testResult = error;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe('timeout');
        });
    });

    it("throws error on too many params", function() {
        runs(function() {
            testResult = false;

            try{
                $.when(
                    $.Q.defer(asyncWithError, 1, -1, 2, 3)
                ).fail(function(result) {
                    testResult = result;
                });
            } catch(e) {
                testResult = true;
            }
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(true);
        });
    });

    it("throws error on 'no error callback' if needed", function() {
        runs(function() {
            testResult = false;

            try{
                $.when(
                    $.Q.defer({
                        fn: asyncWithError,
                        timeout: 10,
                        handlesError: true
                    }, 1000, 0, 1)
                ).fail(function(result) {
                    testResult = result;
                });
            } catch(e) {
                testResult = true;
            }
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(true);
        });
    });});
