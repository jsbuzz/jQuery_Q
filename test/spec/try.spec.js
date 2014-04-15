'use strict';

describe("$.Q.try", function() {
    var testResult = false;

    it("resolves on success", function() {
        runs(function() {
            testResult = false;
            $.when(
                $.Q.try($.Q.debug.success(true), false)
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(true);
        });
    });

    it("resolves on fail (with two params)", function() {
        runs(function() {
            testResult = false;
            $.when(
                $.Q.try($.Q.debug.failure(false), true)
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(true);
        });
    });

    it("resolves on failure (with one param + .or() )", function() {
        runs(function() {
            testResult = false;
            $.when(
                $.Q.try(
                    $.Q.not($.Q.wait(50))
                ).or(true)
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 60);

        runs(function() {
            expect(testResult).toBe(true);
        });

    });
});
