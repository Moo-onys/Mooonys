const child_process = require('child_process');

class Script {
    constructor(path, callback) {
        var invoked = false;

        var process = child_process.fork(path);

        process.on('error', function (err) {
            if (invoked) return;
            invoked = true;
            callback(err);
        });

        process.on('exit', function (code) {
            if (invoked) return;
            invoked = true;
            var err = code === 0 ? null : new Error('exit code ' + code);
            callback(err);
        });
    }
}

// Now we can run a script and invoke a callback when complete, e.g.
new Script('./Mooonys.js', function (err) {
    if (err) throw err;
    console.log('finished running some-script.js');
});
