jQuery.Q
========

Simple helper for handling promises in jQuery

Promise hell instead of callback hell...
	function _getFileContents(name) {
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

		return dfd;
	}

With jQuery.Q
	function getFileContents(name) {
		return $.Q.pipe(
			$.Q('wait', 40),
    		$.Q(fileSystem.getFile, name), 
    		$.Q.use(fileSystem.read)
		);
	}


