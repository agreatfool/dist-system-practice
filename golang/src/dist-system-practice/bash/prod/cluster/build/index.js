"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const pkg = require('../package.json');
const MYSQL = 'mysql';
program.version(pkg.version)
    .description('image-merge-dir: merge images provided into one or several ones')
    .option('-d, --source_dir <string>', 'source image files dir')
    .parse(process.argv);
class DistClusterTool {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Merge starting ...');
            yield this._validate();
            yield this._process();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
new DistClusterTool().run().then(_ => _).catch(_ => console.log(_));
console.log(process.env);
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map