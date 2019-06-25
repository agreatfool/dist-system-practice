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
const LibFs = require("mz/fs");
const LibPath = require("path");
const LibUtil = require("util");
const program = require("commander");
const shell = require("shelljs");
const mkdir = require("mkdirp");
const camel = require("camelcase");
const pkg = require('../package.json');
const mkdirp = LibUtil.promisify(mkdir);
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const MACHINE_TYPE_CLIENT = 'client';
const MACHINES = [
    {
        "name": "client",
        "type": MACHINE_TYPE_CLIENT,
        "ip": process.env.HOST_IP_CLIENT,
        "services": [
            { "name": "node_client", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_client", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "vegeta", "type": "vegeta", "image": "peterevans/vegeta:6.5.0" }
        ],
    },
    {
        "name": "storage",
        "type": "storage",
        "ip": process.env.HOST_IP_STORAGE,
        "services": [
            { "name": "node_storage", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_storage", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "mysqld", "type": "mysqld", "image": "mysql:5.7.26" },
            { "name": "mysqld_exporter", "type": "mysqld_exporter", "image": "prom/mysqld-exporter:v0.11.0" },
            { "name": "memcached", "type": "memcached", "image": "memcached:1.5.14-alpine" },
            { "name": "memcached_exporter", "type": "memcached_exporter", "image": "prom/memcached-exporter:v0.5.0" }
        ],
    },
    {
        "name": "kafka_1",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_1,
        "services": [
            { "name": "node_kafka_1", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_kafka_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "zookeeper", "type": "zookeeper", "image": "wurstmeister/zookeeper:latest" },
            { "name": "kafka_1", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_2", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
        ],
    },
    {
        "name": "kafka_2",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_2,
        "services": [
            { "name": "node_kafka_2", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_kafka_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "kafka_3", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_4", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_exporter", "type": "kafka_exporter", "image": "danielqsj/kafka-exporter:v1.2.0" },
        ],
    },
    {
        "name": "es_1",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_1,
        "services": [
            { "name": "node_es_1", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_es_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "es_1", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
            { "name": "es_2", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
        ],
    },
    {
        "name": "es_2",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_2,
        "services": [
            { "name": "node_es_2", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_es_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "es_3", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
            { "name": "es_4", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
            {
                "name": "es_exporter",
                "type": "es_exporter",
                "image": "justwatch/elasticsearch_exporter:1.1.0rc1"
            },
        ],
    },
    {
        "name": "monitor",
        "type": "monitor",
        "ip": process.env.HOST_IP_MONITOR,
        "services": [
            { "name": "node_monitor", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_monitor", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "cassandra", "type": "cassandra", "image": "cassandra:3.11.4" },
            { "name": "jcollector_1", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0" },
            { "name": "jcollector_2", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0" },
            { "name": "jquery", "type": "jaeger_query", "image": "jaegertracing/jaeger-query:1.11.0" },
            { "name": "prometheus", "type": "prometheus", "image": "prom/prometheus:v2.8.1" },
            { "name": "grafana", "type": "grafana", "image": "grafana/grafana:6.1.2" },
            { "name": "kibana", "type": "kibana", "image": "kibana:7.0.0" },
        ]
    },
    {
        "name": "web",
        "type": "web",
        "ip": process.env.HOST_IP_WEB,
        "services": [
            { "name": "node_web", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_web", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "jagent_web", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0" },
            { "name": "dist_app_web", "type": "dist_app_web", "image": "agreatfool/dist_app_web:0.0.1" },
            { "name": "filebeat_web", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
        ]
    },
    {
        "name": "service",
        "type": "service",
        "ip": process.env.HOST_IP_SERVICE,
        "services": [
            { "name": "node_service", "type": "node_exporter", "image": "prom/node-exporter:0.18.1" },
            { "name": "cadvisor_service", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "jagent_service", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0" },
            { "name": "dist_app_service", "type": "dist_app_service", "image": "agreatfool/dist_app_service:0.0.1" },
            { "name": "dist_app_consumer", "type": "dist_app_consumer", "image": "agreatfool/dist_app_consumer:0.0.1" },
            { "name": "filebeat_service", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
        ]
    },
];
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* COMMAND LINE
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
program.version(pkg.version)
    .description('cluster.sh: dist-system-practice project automation cluster tool')
    .option('-d, --deploy', 'execute deploy command')
    .option('-u, --shutdown', 'shutdown all deployed services')
    .option('-r, --restart', 'restart all deployed services')
    .option('-n, --cleanup', 'remove all deployed services')
    .option('-c, --capture', 'capture stress test data')
    .option('-s, --stress', 'stress test')
    .parse(process.argv);
const ARGS_DEPLOY = program.deploy === undefined ? undefined : true;
const ARGS_SHUTDOWN = program.shutdown === undefined ? undefined : true;
const ARGS_RESTART = program.restart === undefined ? undefined : true;
const ARGS_CLEANUP = program.cleanup === undefined ? undefined : true;
const ARGS_CAPTURE = program.capture === undefined ? undefined : true;
const ARGS_STRESS = program.stress === undefined ? undefined : true;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* IMPLEMENTATION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class DistClusterTool {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] run ...');
            if (ARGS_DEPLOY) {
                yield this.deploy();
            }
            else if (ARGS_SHUTDOWN) {
                yield this.shutdown();
            }
            else if (ARGS_RESTART) {
                yield this.restart();
            }
            else if (ARGS_CLEANUP) {
                yield this.cleanup();
            }
            else if (ARGS_CAPTURE) {
                yield this.capture();
            }
            else if (ARGS_STRESS) {
                yield this.stress();
            }
            else {
                console.log('[Cluster Tool] Invalid option: Action option required');
                process.exit(1);
            }
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] deploy ...');
            yield (new DistClusterToolDeploy()).run();
        });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] shutdown ...');
            yield (new DistClusterToolShutdown()).run();
        });
    }
    restart() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] restart ...');
            yield (new DistClusterToolRestart()).run();
        });
    }
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] cleanup ...');
            yield (new DistClusterToolCleanup()).run();
        });
    }
    capture() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] capture ...');
            yield (new DistClusterToolCapture()).run();
        });
    }
    stress() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] stress ...');
            yield (new DistClusterToolStress()).run();
        });
    }
}
class DistClusterToolDeploy {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initMachines();
            yield this.prepareImages();
            yield this.deployMachines();
        });
    }
    initMachines() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            MACHINES.forEach((machine) => {
                if (Tools.execSync(`docker-machine ls | grep ${machine.name}`).stdout) {
                    console.log(`Machine ${machine.name} already exists, skip it ...`);
                    return;
                }
                tasks.push(Tools.execAsync('docker-machine create -d generic' +
                    ` --generic-ip-address=${machine.ip}` +
                    ' --generic-ssh-port 22' +
                    ' --generic-ssh-key ~/.ssh/id_rsa' +
                    ' --generic-ssh-user root' +
                    ` ${machine.name}`, `machines/${machine.name}`));
            });
            yield Promise.all(tasks).catch((err) => {
                console.log(`Error in "initMachines": ${err.toString()}`);
            });
            yield Tools.execAsync('docker-machine ls', 'machines/list');
        });
    }
    prepareImages() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            MACHINES.forEach((machine) => {
                // collect image names
                let images = [];
                machine.services.forEach((service) => {
                    if (images.indexOf(service.image) !== -1) {
                        return;
                    }
                    images.push(service.image);
                });
                // generate pull image commands
                let pullCommands = [];
                images.forEach((image) => {
                    pullCommands.push(`docker pull ${image}`);
                });
                // do nothing with 0 pull commands
                if (pullCommands.length == 0) {
                    return;
                }
                // execution
                tasks.push(Tools.execAsync(`docker-machine ssh \"${pullCommands.join(' && ')}\"`, `images/${machine.name}`));
            });
            yield Promise.all(tasks).catch((err) => {
                console.log(`Error in "prepareImages": ${err.toString()}`);
            });
        });
    }
    deployMachines() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            MACHINES.forEach((machine) => {
                tasks.push(this.deployMachine(machine));
            });
            yield Promise.all(tasks).catch((err) => {
                console.log(`Error in "deployMachines": ${err.toString()}`);
            });
        });
    }
    deployMachine(machine) {
        return __awaiter(this, void 0, void 0, function* () {
            // deploy all services one by one
            for (let service of machine.services) {
                if (service.type === 'vegeta') {
                    continue; // skip stress tool
                }
                yield this[`deployService${camel(service.type, { pascalCase: true })}`].apply(this, [service]);
            }
        });
    }
    deployServiceMysqld(service) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO
        });
    }
}
class DistClusterToolShutdown {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
class DistClusterToolRestart {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
class DistClusterToolCleanup {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
class DistClusterToolCapture {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
class DistClusterToolStress {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* TOOLS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class Tools {
    static getMachineNames() {
        return MACHINES.map((machine) => {
            return machine.name;
        });
    }
    static getBaseDir() {
        return LibPath.join(__dirname, '..');
    }
    static execSync(command, output, options) {
        if (!options) {
            options = {};
        }
        const result = shell.exec(command, options);
        if (output) {
            const targetOutput = LibPath.join(Tools.getBaseDir(), 'output', output + '.txt');
            mkdir.sync(LibPath.dirname(targetOutput)); // ensure dir
            LibFs.writeFileSync(targetOutput, ''); // ensure file & empty file
            if (result.stdout) {
                LibFs.appendFileSync(targetOutput, result.stdout);
            }
            if (result.stderr) {
                LibFs.appendFileSync(targetOutput, result.stderr);
            }
        }
        return result;
    }
    static execAsync(command, output, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!options) {
                    options = {};
                }
                const child = shell.exec(command, Object.assign(options, { async: true }));
                if (output) {
                    const targetOutput = LibPath.join(Tools.getBaseDir(), 'output', output + '.txt');
                    mkdir.sync(LibPath.dirname(targetOutput)); // ensure dir
                    LibFs.writeFileSync(targetOutput, ''); // ensure file & empty file
                    const outputStream = LibFs.createWriteStream(targetOutput);
                    child.stdout.pipe(outputStream);
                    child.stderr.pipe(outputStream);
                }
                child.on('close', () => resolve());
                child.on('error', (err) => reject(err));
            });
        });
    }
    static ucFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* EXECUTION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
new DistClusterTool().run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map