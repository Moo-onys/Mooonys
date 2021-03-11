const child_process = require('child_process');

class Children {
    constructor(path, callback) {
        this.path = path;
        this.callback = callback;
        this.invoked = false;

        this.cp = child_process.fork(this.path);

        this.cp.on('error', (err) => {
            if (this.invoked) return;
            this.invoked = true;

            this.callback(err);
        });

        this.cp.on('exit', (status) => {
            if (this.invoked) return;
            this.invoked = true;

            const err = status === 0 ? null : new Error(`exit status ${status}`);
            this.callback(err);
        });
    }
    __del__ = async () => {
        this.cp.kill(1);
    }
}

let child = new Children('./Mooonys.js', async (err) => {
    if (err) {
        if (typeof err === 'interface') throw err;
    }

    console.log('The child process has been stopped.');
});

setTimeout(async () => {
    await child.__del__();
    await child_process.execSync('rm -r env; mkdir env');
    await child_process.execSync('cd env && git clone https://github.com/Mooonys/Mooonys.git');
    await child_process.execSync('cd env/Mooonys && npm install');

    child = new Children('./env/Mooonys/Mooonys.js', async (err) => {
        if (err) {
            if (typeof err === 'interface') throw err;
        }

        console.log('The child process has been stopped.');
    });
}, 5000);