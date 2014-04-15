'use strict';

describe("$.Q.bound", function() {

  it("gets a function, calls it on request", function() {
  	var dfd = new $.Deferred(),
  		wrapper = function() {
  			return dfd;
  		},
  		q = $.Q.bound($.Q, wrapper)();

    expect(q).toEqual(dfd);
  });

  it("uses arguments on the target function", function() {
  	var dfd1 = new $.Deferred(),
  		dfd2 = new $.Deferred(),
  		wrapper = function(a) {
  			if(a===1) {
  				return dfd1;
  			}
  			return dfd2;
  		};

    expect($.Q.bound($.Q, wrapper, 1)()).toEqual(dfd1);
    expect($.Q.bound($.Q, wrapper, 2)()).toEqual(dfd2);
  });

  it("in a pipe uses the previous result", function() {
  	var dfd = new $.Deferred().resolve(1),
  		wrapper = function(previousResult) {
  			var d = new $.Deferred();

  			if(previousResult===1) {
  				d.resolve(true);
  			} else {
  				d.reject();
  			}

  			return d.promise();
  		},
  		result = false;

  	$.when(
  		$.Q.pipe(
  			dfd,
  			$.Q.bound($.Q, wrapper)
  		)
  	).done(function(res) {
  		result = res;
  	});

    expect(result).toBe(true);
  });

  it("binds called function to the given object", function() {
    var obj = {
            dfd : new $.Deferred(),
            wrapper : function() {
                return this.dfd;
            },
        },
        q = $.Q.bound(obj, obj.wrapper)();

    expect(q).toEqual(obj.dfd);
  });

  it("can call functions by name", function() {
    var obj = {
            dfd : new $.Deferred(),
            wrapper : function() {
                return this.dfd;
            },
        },
        q = $.Q.bound(obj, 'wrapper')();

    expect(q).toEqual(obj.dfd);
  });
});