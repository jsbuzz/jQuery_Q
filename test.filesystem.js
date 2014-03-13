
function rand(max) {
    return parseInt(Math.random() * max);
}


fileSystem = {
    'readme.md' : "This is a simple async test",
    'Mendeley'  : "Info about mendeley.com"
};

fileSystem.getFile = function(name) {
    var dfd = new $.Deferred();
    setTimeout(
        function() {
            console.log('+ getting: ' + name);
            if(typeof(fileSystem[name]) !== 'string') {
                dfd.reject('File not found! [' + name + ']');
            } else {
                dfd.resolve(new File(name));
            }
        },
        rand(100)
    );
    return dfd.promise();
};

fileSystem.createFile = function(name, contents) {
    var dfd = new $.Deferred();
    setTimeout(
        function() {
            if(typeof(fileSystem[name]) === 'string') {
                dfd.reject('File already exists!');
            } else {
                fileSystem[name] = contents;
                console.log('+ created: ' + name);
                dfd.resolve(new File(name));
            }
        },
        rand(10)
    );
    return dfd.promise();
};

fileSystem.read = function(file) {
    var dfd = new $.Deferred();
    setTimeout(
        function() {
            if(!(file instanceof File) || typeof(fileSystem[file.name]) !== 'string') {
                dfd.reject('File not found! [' + file.name + ']');
            } else {
                dfd.resolve(fileSystem[file.name]);
            }
        },
        rand(100)
    );
    return dfd.promise();
};

function File(name) {
    this.name = name;

    this.createWriter = function() {return new FileWriter(this)};
}

function FileReader() {
    this.onerror = false;
    this.readAsText = function(file){
        var dfd = new $.Deferred();
        setTimeout(
            function() {
                if(!(file instanceof File) || typeof(fileSystem[file.name]) === 'undefined') {
                    dfd.reject('File not found! [' + file.name + ']');
                } else {
                    dfd.resolve(fileSystem[file.name]);
                }
            },
            rand(100)
        );
        return dfd.promise();
    };
}

function FileWriter(file) {
    this.onerror = false;
    this.file = file;
    this.write = function(txt){
        var dfd = new $.Deferred();
        setTimeout(
            function() {
                fileSystem[this.file.name] = txt;
                dfd.resolve(true);
            },
            rand(100)
        );
        return dfd.promise();
    };
}



function test(interval, result, error) {
    //console.log('test was called with', interval, result, error);
    var dfd = new $.Deferred;

    setTimeout(function() {
        if(error)
            dfd.reject(error);
        else
            dfd.resolve(result);
    }, interval);

    return dfd.promise();
}
