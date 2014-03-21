'use strict';

describe("$.Q.not", function() {
    var testResult = false;

    it("resolves on failure", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.not($.Q.debug.failure(true))
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

    it("rejects on success", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.not($.Q.debug.success(true))
            ).fail(function(res) {
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

    it("transparent to pipe", function() {
        runs(function() {
            testResult = false;

            var starter = new $.Deferred().resolve(12);

            $.when(
                $.Q.pipe(
                    starter,
                    $.Q.not(function(result) {
                        return new $.Deferred().reject(result);
                    })
                )
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 100);

        runs(function() {
            expect(testResult).toBe(12);
        });

    });

});
