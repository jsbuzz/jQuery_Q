'use strict';

describe("$.Q.someFrom", function() {
    var testResult = false;

    it("resolves with all successes", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someFrom({
                    r1: $.Q.debug.success(1),
                    r2: $.Q.debug.success(2),
                    r3: $.Q.debug.failure(1)
                })
            ).done(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual({r1: 1, r2: 2, r3: undefined});
        });
    });

    it("has undefined on all errors", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someFrom({
                    r1: $.Q.debug.failure(1),
                    r2: $.Q.debug.success(2),
                    r3: $.Q.debug.failure(1)
                })
            ).done(function(results) {
                testResult = results;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual({r1: undefined, r2: 2, r3: undefined});
        });
    });

    it("fails if all fail", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.someFrom({
                    r1: $.Q.not($.Q.wait(3, 1)),
                    r2: $.Q.not($.Q.wait(2, 2)),
                    r3: $.Q.not($.Q.wait(1, 3))
                })
            ).fail(function(errors) {
                testResult = errors;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toEqual({r1: 1, r2: 2, r3: 3});
        });
    });

    it("throws error if no promises given", function() {
        var errorThrown = false;
        try{
            $.Q.someFrom({});
        } catch(e) {
            errorThrown = true;
        }

        expect(errorThrown).toBe(true);

    });

});
