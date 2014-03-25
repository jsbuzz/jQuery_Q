'use strict';

describe("$.Q.apply", function() {

    it("gets a function, calls it on the result object", function() {
        var testObj = {
            dfd : new $.Deferred(),
            test : function() {
                return this.dfd;
            }
        };
  		
        expect($.Q.apply(testObj.test)(testObj)).toBe(testObj.dfd);
    });

    it("gets a string, calls it on the result object as method", function() {
        var testObj = {
            dfd : new $.Deferred(),
            test : function() {
                return this.dfd;
            }
        };
        
        expect($.Q.apply('test')(testObj)).toBe(testObj.dfd);
    });

    it("passes extra arguments", function() {
        var testObj = {
            dfd : new $.Deferred(),
            test : function(prop) {
                return this[prop];
            }
        };
        
        expect($.Q.apply('test', 'dfd')(testObj)).toBe(testObj.dfd);
    });

});