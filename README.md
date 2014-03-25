jQuery.Q
========

First of all, I'd like to explain why I wrote this library. Yes it is yet another library for handling promises. But at least it is based on jQuery's built in promise API and it is super-lightweight.

As I was using jQuery and its promise system for a project I discovered the lack of handling basic workflows and especially chained tasks. As the project was a chrome extension it was literally handling everything asynchronously. That is why I created the library, to help me write more structured code and increase the readability + helped me centralize error and progress handling as a bonus.


While working with a lot of async calls you can easily end up with a 'when-done' hell instead of a callback hell. Pretty much like this:

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
    	thid.$node.find('.author').html(project.author || '- no author -');
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