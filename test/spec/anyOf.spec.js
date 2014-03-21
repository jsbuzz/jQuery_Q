'use strict';

describe("$.Q.anyOf", function() {
    var testResult = false;

    it("resolves with first success", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.anyOf(
                    $.Q.wait(100),
                    $.Q.debug.success(1)
                )
            ).done(function(res) {
                testResult = 1;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("resolves with the exact result of the first success", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.anyOf(
                    $.Q.debug.success(1),
                    $.Q.debug.success(2)
                )
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("resolves with the exact result of the first success + first fails", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.anyOf(
                    $.Q.debug.failure(false),
                    $.Q.debug.success(1),
                    $.Q.debug.success(2)
                )
            ).done(function(res) {
                testResult = res;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("failes if all promises fail", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.anyOf(
                    $.Q.debug.failure(false),
                    $.Q.debug.failure(false)
                )
            ).fail(function(res) {
                testResult = 1;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(1);
        });
    });

    it("throws error if no promises given", function() {
        var errorThrown = false;
        try{
            $.Q.anyOf();
        } catch(e) {
            errorThrown = true;
        }

        expect(errorThrown).toBe(true);

    });

});
