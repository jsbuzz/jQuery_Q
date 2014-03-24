'use strict';

describe("$.Q.debug", function() {
    var testResult = false;

    it("success resolves", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.debug.success(1)
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

    it("failure rejects", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.debug.failure(1)
            ).fail(function(result) {
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
});
