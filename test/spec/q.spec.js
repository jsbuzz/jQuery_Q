'use strict';

describe("$.Q", function() {
  it("gets a promise, returns with it", function() {
  	var dfd = new $.Deferred(),
  		q = $.Q(dfd);

    expect(q).toEqual(dfd);
  });

  it("gets a function, calls it on request", function() {
  	var dfd = new $.Deferred(),
  		wrapper = function() {
  			return dfd;
  		},
  		q = $.Q(wrapper)();

    expect(q).toEqual(dfd);
  });

  it("gets a string, calls Q method", function() {
  	var dfd = new $.Deferred(),
  		wrapper = function() {
  			return dfd;
  		},
  		q = $.Q('use', wrapper)()();

    expect(q).toEqual(dfd);
    expect( $.Q('use', wrapper)()() ).toEqual( $.Q.use(wrapper)() );
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

    expect($.Q(wrapper, 1)()).toEqual(dfd1);
    expect($.Q(wrapper, 2)()).toEqual(dfd2);
  });

  it("in a pipe, ignores the previous result", function() {
  	var dfd = new $.Deferred().resolve(1),
  		wrapper = function(previousResult) {
  			var d = new $.Deferred();

  			if(previousResult===1) {
  				d.reject();
  			} else {
  				d.resolve(true);
  			}

  			return d.promise();
  		},
  		result = false;

  	$.when(
  		$.Q.pipe(
  			dfd,
  			$.Q(wrapper)
  		)
  	).done(function(res) {
  		result = res;
  	});

    expect(result).toBe(true);
  });
});