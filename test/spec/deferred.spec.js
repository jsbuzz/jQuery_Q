'use strict';

describe("$.Q.defer", function() {
    var testResult = false;

    function async(timeout, result, success, error) {
        setTimeout(
            function() {
                if(result > 0) {
                    success(result);
                } else {
                    error(result);
                }
            },
            timeout
        )
    }
    
    function onlySuccess(timeout, success) {
        setTimeout(
            function() {
                success(result);
            },
            timeout
        )
    }

    it("resolves on success", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer(async, 10, 1)
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

    it("fails on error", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer(async, 10, -1)
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

    it("times out", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.defer({
                    fn: onlySuccess,
                    timeout: 10
                }, 1000)
            ).fail(function(result) {
                testResult = -1;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(-1);
        });
    });

});
