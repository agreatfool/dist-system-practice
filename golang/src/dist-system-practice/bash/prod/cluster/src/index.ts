import * as LibFs from 'mz/fs';
import * as LibPath from 'path';

import * as program from 'commander';
import * as shell from 'shelljs';

const pkg = require('../package.json');

program.version(pkg.version)
    .description('image-merge-dir: merge images provided into one or several ones')
    .option('-d, --source_dir <string>', 'source image files dir')
    .parse(process.argv);

class DistClusterTool {

    public async run() {
        console.log('Merge starting ...');

        await this._validate();
        await this._process();
    }

    private async _validate() {

    }

    private async _process() {

    }

}

new DistClusterTool().run().then(_ => _).catch(_ => console.log(_));

process.on('uncaughtException', (error: Error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error: Error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});