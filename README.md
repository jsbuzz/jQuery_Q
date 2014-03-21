jQuery.Q
========

Simple helper for handling promises in jQuery - giving you powerful and useful tools and controls over workflows.

Working with a lot of async libraries and tools you can easily end up with a when-done hell instead of a callback hell. Pretty much like this:

	function getFileContents(name) {
		var dfd = new $.Deferred;

		setTimeout(function() {
			$.when(
				fileSystem.getFile(name)
			).done(function(file) {
				$.when(
					fileSystem.read(file)
				).done(function(contents) {
					dfd.resolve(contents);
				}).fail(function(error) {
					dfd.reject(error)
				})
			}).fail(function(error) {
				dfd.reject(error)
			})
		}, 40);

		return dfd.promise();
	}

With jQuery.Q you have simple workflows like *$.Q.pipe*, *$.Q.anyOf*, *$.Q.someOf*

	function getFileContents(name) {
		return $.Q.pipe(
			$.Q('wait', 40),
    		$.Q(fileSystem.getFile, name), 
    		$.Q.use(fileSystem.read)
		);
	}


    $.when(
        $.Q.someFrom({
            readme  : getFileContents('readme.md'),
            licence : getFileContents('licence.txt'),
            author  : getFileContents('author.txt')
        })
    ).done(function(project) {
    	thid.$node.find('.author').html(projecdt.author);
    	...
    });



and basic manipulations and abstractions over the promises like *$.Q.not(dfd)*, *$.Q.try(dfd).or(fallbackValue)*

	$.when(
    	getFileContents('readme.md'),
    	getFileContents('author.txt'),
		$.Q.try(getFileContents('licence.txt')).or('no licence')
 	).done(function(readme, author, licence) {
 		...
 	})