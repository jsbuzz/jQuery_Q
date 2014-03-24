'use strict';

describe("$.Q.allOf", function() {
    var testResult = false;

    it("can handle paramlist", function() {
        runs(function() {
            testResult = false;

            $.Q.allOf(
                $.Q.debug.success(1),
                $.Q.debug.success(2)
            ).done(function(r1, r2) {
                testResult = r1 + r2;
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
            ).done(function(r1, r2) {
                testResult = r1 + r2;
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
                [
                    $.Q($.Q.debug.success, 1),
                    $.Q.debug.success(2)
                ]
            ).done(function(r1, r2) {
                testResult = r1 + r2;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(3);
        });
    });

});
