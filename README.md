jQuery.Q
========

Simple helper for handling promises in jQuery

	$.when(
	    $.Q.pipe(
	    	$.Q.wait(500),
	    	$.Q($.Q.anyOf, // if file doesn't exist, create it
	    		$.Q($.Q.pipe,
	            	$.Q.not($.Q(fileSystem.getFile, 'readme.md')),
	            	$.Q(fileSystem.createFile, 'readme.md', 'This is a simple test')
	            ),// otherwise get it
	        	$.Q(fileSystem.getFile, 'readme.md')
	        ),
	    	$.Q.use($.Q.wait, 500), // testing transparency of $.Q.wait
	        $.Q.use(fileSystem.read)
	    ).progress(function(prg) {console.log('pipe', parseInt(prg.pct) + '%')})
	).done(function(pipe) {
		console.log('done:', pipe);
	}).fail(function(err) {
		console.log('failed:', err);
	});

