'use strict';

describe("$.Q.wait", function() {
    var testResult = false;

    it("it resolves", function() {
        runs(function() {
            testResult = false;

            $.when(
                $.Q.wait(1)
            ).done(function(results) {
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

    it("you can cancel it with the id", function() {
        runs(function() {
            testResult = false;
            var waiter;

            $.when(
                $.Q.anyOf(
                    waiter = $.Q.wait(10, 11),
                    $.Q.wait(100, 22)
                )
            ).done(function(result) {
                testResult = result;
            });
            clearTimeout(waiter.id);
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 150);

        runs(function() {
            expect(testResult).toBe(22);
        });
    });

    it("it is transparent to pipe", function() {
        runs(function() {
            testResult = false;
            
            $.when(
                $.Q.pipe(
                    $.Q.debug.success(123),
                    $.Q.use($.Q.wait, 10),
                    $.Q.use('wait', 10)
                )
            ).done(function(result) {
                testResult = result;
            });
        });

        waitsFor(function() {
              return testResult;
        }, "The Value should be true", 50);

        runs(function() {
            expect(testResult).toBe(123);
        });
    });

});
