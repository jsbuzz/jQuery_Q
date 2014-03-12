jQuery.Q
========

Simple helper for handling promises in jQuery

    $.when(
        $.Q.someFrom({
            readme  : fileSystem.getFile('readme.md').then($.Q.use(fileSystem.read)),
            licence : fileSystem.getFile('licence.txt').then($.Q.use(fileSystem.read)),
            author  : fileSystem.getFile('author.txt').then($.Q.use(fileSystem.read))
        })
    ).done(function(project) { // some information is present
        console.log('-----------------------------------------');
        console.log('Project is ready to use with $.Q.someFrom');
        console.log('-----------------------------------------');
        console.log('About: ', project.readme || 'no readme');
        console.log('Licence: ', project.licence || 'no licence');
        console.log('Author: ', project.author || 'anonymus');
        console.log(' ');
    }).fail(function(err) { // none of the files exist
        console.log('Essentials missing!', err);
    });
