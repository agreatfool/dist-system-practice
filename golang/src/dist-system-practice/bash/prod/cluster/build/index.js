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
const fetch = require("node-fetch");
const AbortController = require("abort-controller");
const pkg = require('../package.json');
const mkdirp = LibUtil.promisify(mkdir);
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const KAFKA_BROKERS_ADDRESS = []; // ["ip:port", ...]
const KAFKA_METRICS_ADDRESS = []; // ["ip:port", ...]
let ES_CLUSTER_ENTRANCE = ''; // ip:port
let ES_CLUSTER_NODES = []; // ["ip:port", ...]
let CAS_CLUSTER_ENTRANCE = ''; // ip
const JCOLLECTOR_ADDRESS = []; // ["ip:port", ...]
const MACHINES = [
    {
        "name": "client",
        "type": "client",
        "ip": process.env.HOST_IP_CLIENT,
        "services": [
            { "name": "node_client", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
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
            {
                "name": "cassandra_init",
                "type": "cassandra_init",
                "image": "jaegertracing/jaeger-cassandra-schema:1.11.0"
            },
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
            { "name": "app_web", "type": "app_web", "image": "agreatfool/dist_app_web:0.0.1" },
            { "name": "filebeat_web", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
            { "name": "fb_exporter_web", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2" },
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
            { "name": "app_service", "type": "app_service", "image": "agreatfool/dist_app_service:0.0.1" },
            { "name": "app_consumer", "type": "app_consumer", "image": "agreatfool/dist_app_consumer:0.0.1" },
            { "name": "filebeat_service", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
            { "name": "fb_exporter_service", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2" },
        ]
    },
];
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* COMMAND LINE
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
program.version(pkg.version)
    .description('cluster.sh: dist-system-practice project automation cluster tool')
    .option('-m, --machine', 'init docker env')
    .option('-w, --hardware', 'test host machine hardware')
    .option('-d, --deploy', 'execute deploy command')
    .option('-t, --stop', 'stop all deployed services')
    .option('-r, --start', 'start all deployed services')
    .option('-n, --cleanup', 'remove all deployed services')
    .option('-c, --capture', 'capture stress test data')
    .option('-s, --stress', 'stress test')
    .parse(process.argv);
const ARGS_MACHINE = program.machine === undefined ? undefined : true;
const ARGS_HARDWARE = program.hardware === undefined ? undefined : true;
const ARGS_DEPLOY = program.deploy === undefined ? undefined : true;
const ARGS_STOP = program.stop === undefined ? undefined : true;
const ARGS_START = program.start === undefined ? undefined : true;
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
            if (ARGS_MACHINE) {
                yield this.machine();
            }
            else if (ARGS_HARDWARE) {
                yield this.hardware();
            }
            else if (ARGS_DEPLOY) {
                yield this.deploy();
            }
            else if (ARGS_STOP) {
                yield this.stop();
            }
            else if (ARGS_START) {
                yield this.start();
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
    machine() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] machine ...');
            yield (new DistClusterToolMachine()).run();
        });
    }
    hardware() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] hardware ...');
            yield (new DistClusterToolHardware()).run();
        });
    }
    deploy() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] deploy ...');
            yield (new DistClusterToolDeploy()).run();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] stop ...');
            yield (new DistClusterToolStop()).run();
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] start ...');
            yield (new DistClusterToolStart()).run();
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
class DistClusterToolBase {
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
}
class DistClusterToolMachine extends DistClusterToolBase {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initMachines();
        });
    }
}
class DistClusterToolHardware {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            MACHINES.forEach((machine) => {
                tasks.push(new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    yield Tools.execAsync(`docker-machine ssh ${machine.name} "wget -qO- bench.sh | bash"`, `hardwares/${machine.name}/bench`);
                    yield Tools.execAsync(`docker-machine ssh ${machine.name} "(curl -s wget.racing/nench.sh | bash) 2>&1 | tee nench.log"`, `hardwares/${machine.name}/nench`);
                    resolve();
                })));
            });
            yield Promise.all(tasks).catch((err) => {
                console.log(`Error in "testHardwares": ${err.toString()}`);
            });
        });
    }
}
class DistClusterToolDeploy extends DistClusterToolBase {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initMachines();
            yield this.prepareImages();
            yield this.deployMachines();
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
                // display command
                pullCommands.push('docker images');
                // execution
                tasks.push(Tools.execAsync(`docker-machine ssh "${pullCommands.join(' && ')}"`, `images/${machine.name}`));
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
                if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                    continue;
                }
                yield this[`deployService${camel(service.type, { pascalCase: true })}`].apply(this, [machine, service]);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceNodeExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = 'wget https://github.com/prometheus/node_exporter/releases/download/v0.18.1/node_exporter-0.18.1.linux-amd64.tar.gz &&' +
                ' mkdir -p node_exporter &&' +
                ' tar xvfz node_exporter-0.18.1.linux-amd64.tar.gz -C node_exporter --strip-components=1';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}_init`);
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "nohup ./node_exporter/node_exporter > /tmp/node_exporter.log&"`);
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "ps aux|grep node_exporter"`, `services/${machine.name}/${service.name}_ps`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceCadvisor(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 8080:8080' +
                ' -v /:/rootfs:ro' +
                ' -v /var/run:/var/run:rw' +
                ' -v /sys:/sys:ro' +
                ' -v /var/lib/docker/:/var/lib/docker:ro' +
                ` ${service.image}` +
                ` --listen_ip=0.0.0.0` +
                ` --port=8080`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceMysqld(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            // tool
            function waitMysqldInitialized() {
                return new Promise((resolve, reject) => {
                    const msgDone = "Version: '5.7.26'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)";
                    const child = shell.exec(`docker-machine ssh ${machine.name} "docker logs -f ${service.name}"`, { async: true });
                    function detectEnd(chunk, proc) {
                        const msg = chunk.toString();
                        if (msg.indexOf(msgDone) != -1) {
                            proc.kill('SIGINT');
                        }
                    }
                    child.stdout.on('data', (chunk) => {
                        detectEnd(chunk, child);
                    });
                    child.stderr.on('data', (chunk) => {
                        detectEnd(chunk, child);
                    });
                    child.on('close', () => resolve());
                    child.on('error', (err) => reject(err));
                });
            }
            // prepare init sql file
            let inserts = [];
            for (let i = 0; i < Number.parseInt(process.env.MAX_WORK_ID); i++) {
                inserts.push('()');
            }
            const insertSqlFile = `${machine.name}_${service.name}_init.sql`;
            const insertSqlPath = `/tmp/${insertSqlFile}`;
            LibFs.writeFileSync(insertSqlPath, `INSERT INTO ${process.env.MYSQL_DB}.work VALUES ${inserts.join(',')};`);
            // init mysqld container
            const initCommand = 'docker volume create mysqld_data &&' +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ' --ulimit nproc=65535' +
                ' --ulimit nofile=65535:65535' +
                ' --ulimit memlock=-1:-1' +
                ` --network ${machine.name}` +
                ' -p 3306:3306' +
                ` -v ${Tools.getProjectDir()}/schema/schema.sql:/docker-entrypoint-initdb.d/schema.sql` +
                ` -v ${insertSqlPath}:/docker-entrypoint-initdb.d/${machine.name}_${service.name}_init.sql` +
                ' -v mysqld_data:/var/lib/mysql' +
                ` -e MYSQL_DATABASE="${process.env.MYSQL_DB}"` +
                ` -e MYSQL_ROOT_PASSWORD="${process.env.MYSQL_PWD}"` +
                ` ${service.image}` +
                ` --bind-address=0.0.0.0` +
                ` --max-connections=${Number.parseInt(process.env.MYSQL_CONN_NUM) + 100}` +
                ' --max-allowed-packet=33554432'; // 32M
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
            // waiting for mysql initialized
            yield waitMysqldInitialized();
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceMysqldExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9104:9104' +
                ` -e DATA_SOURCE_NAME="${process.env.MYSQL_USER}:${process.env.MYSQL_PWD}@tcp(mysqld:3306)/${process.env.MYSQL_DB}?charset=utf8mb4&collation=utf8mb4_general_ci&parseTime=true&loc=Local"` +
                ` ${service.image}` +
                ' --collect.binlog_size' +
                ' --collect.info_schema.processlist' +
                ' --collect.info_schema.innodb_cmp' +
                ' --collect.info_schema.innodb_cmpmem' +
                ' --collect.engine_innodb_status' +
                ' --collect.info_schema.innodb_metrics' +
                ' --collect.info_schema.innodb_tablespaces' +
                ' --collect.perf_schema.eventsstatements' +
                ' --collect.perf_schema.eventswaits' +
                ' --collect.perf_schema.file_events' +
                ' --collect.perf_schema.file_instances' +
                ' --collect.perf_schema.indexiowaits' +
                ' --collect.perf_schema.tablelocks' +
                ' --collect.perf_schema.tableiowaits';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceMemcached(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 11211:11211' +
                ` ${service.image}` +
                ' -l 0.0.0.0' +
                ' -p 11211' +
                ` -m ${process.env.MEMCACHED_MEM}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceMemcachedExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9150:9150' +
                ` ${service.image}` +
                ' --memcached.address=memcached:11211';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceZookeeper(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = 'docker volume create zookeeper_data &&' +
                ' docker volume create zookeeper_conf &&' +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 2181:2181' +
                ' -v zookeeper_data:/opt/zookeeper-3.4.13/data' +
                ' -v zookeeper_conf:/opt/zookeeper-3.4.13/conf' +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceKafka(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // kafka_1 => [kafka, 1] => 1
            const brokerId = id - 1; // 1-1 => 0
            const portInternal = `9${brokerId}93`; // 9093、9193、9293、...
            const portExternal = `9${brokerId}92`; // 9092、9192、9292、...
            const portMetrics = `7${brokerId}71`; // 7071、7171、7271、...
            KAFKA_BROKERS_ADDRESS.push(`${machine.ip}:${portExternal}`);
            KAFKA_METRICS_ADDRESS.push(`${machine.ip}:${portMetrics}`);
            const machines = Tools.getMachinesByType(machine.type);
            const services = Tools.getServicesByType(service.type);
            const initCommand = `docker volume create kafka_data_${id} &&` +
                ` docker volume create kafka_home_${id} &&` +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ' --ulimit nproc=65535' +
                ' --ulimit nofile=65535:65535' +
                ' --ulimit memlock=-1:-1' +
                ` --network ${machine.name}` +
                ` -p ${portInternal}:${portInternal}` +
                ` -p ${portExternal}:${portExternal}` +
                ` -p ${portMetrics}:${portMetrics}` +
                ` -v ${Tools.getProjectDir()}/vendors/kafka/jmx_prometheus_javaagent-0.9.jar:/usr/local/bin/jmx_prometheus_javaagent-0.9.jar` +
                ` -v ${Tools.getProjectDir()}/vendors/kafka/jmx-kafka-2_0_0.yaml:/etc/jmx-exporter/jmx-kafka-2_0_0.yaml` +
                ` -v kafka_data_${id}:/tmp/kafka/data` +
                ` -v kafka_home_${id}:/kafka` +
                ` -e KAFKA_LISTENERS="INSIDE://0.0.0.0:${portInternal},OUTSIDE://0.0.0.0:${portExternal}"` +
                ` -e KAFKA_ADVERTISED_LISTENERS="INSIDE://${machine.ip}:${portInternal},OUTSIDE://${machine.ip}:${portExternal}"` +
                ` -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP="INSIDE:PLAINTEXT,OUTSIDE:PLAINTEXT"` +
                ` -e KAFKA_INTER_BROKER_LISTENER_NAME="INSIDE"` +
                ` -e KAFKA_BROKER_ID=${brokerId}` +
                ` -e KAFKA_ZOOKEEPER_CONNECT="${machines[0].ip}:2181"` +
                ` -e JMX_PORT=9991` +
                ` -e KAFKA_OPTS="-javaagent:/usr/local/bin/jmx_prometheus_javaagent-0.9.jar=7071:/etc/jmx-exporter/jmx-kafka-2_0_0.yaml"` +
                ` -e KAFKA_HEAP_OPTS="-Xms${process.env.KAFKA_JVM_MEM} -Xmx${process.env.KAFKA_JVM_MEM}"` +
                ` -e KAFKA_LOG_DIRS="/tmp/kafka/data"` +
                ` -e KAFKA_TRANSACTION_STATE_LOG_MIN_ISR=1` +
                ` -e KAFKA_MIN_INSYNC_REPLICAS=1` +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
            // wait several seconds here, wait for kafka initialization done
            if (id === services.length) { // only the last node need to do this
                console.log('Wait 30s, then create topic data');
                yield new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 30000); // 30s
                });
                // create topic
                const topicCommand = `${Tools.getProjectDir()}/vendors/kafka/kafka/bin/kafka-topics.sh` +
                    ' --create' +
                    ` --bootstrap-server ${machines[0].ip}:9092` +
                    ` --replication-factor 1` +
                    ` --partitions ${process.env.KAFKA_PARTITIONS}` +
                    ` --topic ${process.env.KAFKA_TOPIC} &&` +
                    ` ${Tools.getProjectDir()}/vendors/kafka/kafka/bin/kafka-topics.sh` +
                    ' --describe' +
                    ` --zookeeper ${machines[0].ip}:2181` +
                    ` --topic ${process.env.KAFKA_TOPIC}`;
                yield Tools.execAsync(`docker-machine ssh ${machine.name} "${topicCommand}"`, `services/${machine.name}/kafka_topic`);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceKafkaExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9308:9308' +
                ` ${service.image}` +
                ' --web.listen-address=0.0.0.0:9308' +
                ' --web.telemetry-path=/metrics' +
                ' --log.level=info' +
                ' --topic.filter=.*' +
                ' --group.filter=.*';
            KAFKA_BROKERS_ADDRESS.forEach((address) => {
                initCommand += ` --kafka.server=${address}`;
            });
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceElasticsearch(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // es_1 => [es, 1] => 1
            const portInternal = `930${id - 1}`; // 9300、9301、9302、...
            const portExternal = `920${id - 1}`; // 9200、9201、9202、...
            const machines = Tools.getMachinesByType(machine.type);
            const services = Tools.getServicesByType(service.type);
            let discoverySeedHosts = [];
            machines.forEach((mch) => {
                mch.services.forEach((svc) => {
                    if (svc.type != service.type) {
                        return;
                    }
                    const portId = Number.parseInt(svc.name.split('_')[1]) - 1;
                    discoverySeedHosts.push(`${mch.ip}:930${portId}`);
                    ES_CLUSTER_NODES.push(`${mch.ip}:920${portId}`);
                });
            });
            let initialMasterNodes = [];
            services.forEach((svc) => {
                initialMasterNodes.push(svc.name);
            });
            ES_CLUSTER_ENTRANCE = `${machines[0].ip}:9200`;
            let initCommand = `docker volume create es_data_${id} &&` +
                ` docker volume create es_logs_${id} &&` +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ' --ulimit nproc=65535' +
                ' --ulimit nofile=65535:65535' +
                ' --ulimit memlock=-1:-1' +
                ` --network ${machine.name}` +
                ` -p ${portInternal}:${portInternal}` +
                ` -p ${portExternal}:${portExternal}` +
                ` -v es_data_${id}:/usr/share/elasticsearch/data` +
                ` -v es_logs_${id}:/usr/share/elasticsearch/logs` +
                ` -v ${Tools.getConfDir()}/elasticsearch/elasticsearch.yaml:/usr/share/elasticsearch/config/elasticsearch.yml` +
                ` -e node.name="${service.name}"` +
                ` -e network.host="0.0.0.0"` +
                ` -e http.port=${portExternal}` +
                ` -e network.publish_host="${machine.ip}"` +
                ` -e transport.tcp.port=${portInternal}` +
                ` -e node.master=true` +
                ` -e node.data=true` +
                ` -e ES_JAVA_OPTS="-Xms${process.env.ES_JVM_MEM} -Xmx${process.env.ES_JVM_MEM}"` +
                ` -e discovery.seed_hosts=${discoverySeedHosts.join(',')}` +
                ` -e cluster.initial_master_nodes=${initialMasterNodes.join(',')}` +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
            let failed = 0;
            function waitElasticsearchCluster() {
                return __awaiter(this, void 0, void 0, function* () {
                    // @ts-ignore
                    const controller = new AbortController();
                    const timeout = setTimeout(() => {
                        controller.abort();
                    }, 50000);
                    try {
                        // @ts-ignore
                        let response = yield fetch(`http://${ES_CLUSTER_ENTRANCE}/_cluster/health?wait_for_status=green&timeout=60s`, { signal: controller.signal });
                        let data = yield response.json();
                        clearTimeout(timeout);
                        console.log('Es cluster: ', data);
                    }
                    catch (err) {
                        console.log(`Failed, wait 15s to retry, times: ${failed++}, msg: ${err.message}`);
                        clearTimeout(timeout);
                        yield new Promise((resolve) => {
                            setTimeout(() => resolve(), 15000); // wait 15s before retry
                        });
                        return waitElasticsearchCluster(); // again
                    }
                });
            }
            // check cluster status, init index when ready
            if (id == services.length) {
                console.log('Start to wait for es cluster ...');
                yield waitElasticsearchCluster();
                yield Tools.execAsync('curl -H "Content-Type: application/json"' +
                    ` -PUT "${ES_CLUSTER_ENTRANCE}/_template/dist?pretty"` +
                    ` -d @${Tools.getConfDir()}/elasticsearch/elk-index-template.json`, `services/${machine.name}/es_index`);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceEsExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9114:9114' +
                ` ${service.image}` +
                ' --web.listen-address=0.0.0.0:9114' +
                ' --web.telemetry-path=/metrics' +
                ` --es.uri=http://${ES_CLUSTER_ENTRANCE}` +
                ' --es.all' +
                ' --es.cluster_settings' +
                ' --es.shards' +
                ' --es.indices' +
                ' --es.indices_settings' +
                ' --es.snapshots' +
                ' --log.level=info' +
                ' --log.format=json' +
                ' --log.output=stdout';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceCassandra(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            CAS_CLUSTER_ENTRANCE = machine.ip;
            let initCommand = 'docker volume create cas_data &&' +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ' --ulimit nproc=65535' +
                ' --ulimit nofile=65535:65535' +
                ' --ulimit memlock=-1:-1' +
                ` --network ${machine.name}` +
                ' -p 7199:7199' + // JMX
                ' -p 9042:9042' + // Cassandra client port.
                ' -p 9160:9160' + // Cassandra client port (Thrift).
                ' -p 7000:7000' + // Cassandra inter-node cluster communication.
                ` -e CASSANDRA_BROADCAST_ADDRESS=${machine.ip}` +
                ` -e CASSANDRA_LISTEN_ADDRESS=${service.name}` +
                ` -e MAX_HEAP_SIZE=${process.env.CAS_HEAP_SIZE}` +
                ` -e HEAP_NEWSIZE=${process.env.CAS_HEAP_NEWSIZE}` +
                ` -e CASSANDRA_RPC_ADDRESS=0.0.0.0` +
                ' -e CASSANDRA_START_RPC=true' +
                ' -e CASSANDRA_CLUSTER_NAME=cassandra_cluster' +
                ` -e CASSANDRA_SEEDS=${machine.ip}` +
                ` -e JAVA_OPTS="-Dfile.encoding=UTF-8 -Xms${process.env.CAS_JVM_MEM} -Xmx${process.env.CAS_JVM_MEM}"` +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
            // wait seconds for cassandra initialized
            console.log('Start to wait for cassandra cluster ...');
            yield new Promise((resolve) => {
                setTimeout(() => resolve(), 30000); // 30s
            });
            const sqlCommand = 'docker run --rm --name jaeger-cassandra-schema' +
                ` --network ${machine.name}` +
                ' -e MODE=test' +
                ` -e CQLSH_HOST=${CAS_CLUSTER_ENTRANCE}` +
                ' -e DATACENTER=jaeger_dc' +
                ' -e KEYSPACE=jaeger_keyspace' +
                ` ${Tools.getServicesByType('cassandra_init')[0].image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${sqlCommand}"`, `services/${machine.name}/cassandra_init`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceJaegerCollector(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // jcollector_1 => [jcollector, 1] => 1
            const portGrpc = 14250 + (id - 1); // 14250、14251、14252、...
            const portHttp = 14268 + (id - 1); // 14268、14269、14270、...
            JCOLLECTOR_ADDRESS.push(`${machine.ip}:${portGrpc}`);
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p ${portGrpc}:14250` + // grpc
                ` -p ${portHttp}:14268` + // http (prometheus)
                ' -e SPAN_STORAGE_TYPE=cassandra' +
                ` ${service.image}` +
                ` --collector.grpc-port=14250` +
                ` --collector.http-port=14268` +
                ` --cassandra.servers=${CAS_CLUSTER_ENTRANCE}` +
                ' --cassandra.keyspace=jaeger_keyspace' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceJaegerQuery(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p 16686:16686` +
                ' -e SPAN_STORAGE_TYPE=cassandra' +
                ` ${service.image}` +
                ' --query.port=16686' +
                ` --cassandra.servers=${CAS_CLUSTER_ENTRANCE}` +
                ' --cassandra.keyspace=jaeger_keyspace' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServicePrometheus(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const replacedConfPath = '/tmp/prom-master.yaml';
            let promConf = (yield LibFs.readFile(`${Tools.getConfDir()}/prometheus/prom-master.yaml`)).toString();
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_CLIENT', process.env.HOST_IP_CLIENT);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_STORAGE', process.env.HOST_IP_STORAGE);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_KAFKA_1', process.env.HOST_IP_KAFKA_1);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_KAFKA_2', process.env.HOST_IP_KAFKA_2);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_ES_1', process.env.HOST_IP_ES_1);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_ES_2', process.env.HOST_IP_ES_2);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_MONITOR', process.env.HOST_IP_MONITOR);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_WEB', process.env.HOST_IP_WEB);
            promConf = Tools.replaceStrAll(promConf, 'HOST_IP_SERVICE', process.env.HOST_IP_SERVICE);
            yield LibFs.writeFile(replacedConfPath, promConf);
            let initCommand = 'docker volume create prometheus_vol &&' +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p 9090:9090` +
                ' -v /tmp/prom-master.yaml:/etc/prometheus/prometheus.yml' +
                ' -v prometheus_vol:/prometheus' +
                ` ${service.image}` +
                ' --web.listen-address=0.0.0.0:9090' +
                ' --config.file=/etc/prometheus/prometheus.yml' +
                ' --log.format=json' +
                ' --log.level=info';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceGrafana(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = 'docker volume create grafana_data &&' +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p 3000:3000` +
                ` -v ${Tools.getConfDir()}/grafana/grafana.ini:/etc/grafana/grafana.ini` +
                ` -v ${Tools.getProjectDir()}/vendors/prometheus/grafana/provisioning:/etc/grafana/provisioning` +
                ` -v ${Tools.getProjectDir()}/vendors/prometheus/grafana/dashboards:/etc/grafana/dashboards` +
                ' -v grafana_data:/var/lib/grafana' +
                ' -e GF_SERVER_HTTP_ADDR=0.0.0.0' +
                ' -e GF_SERVER_HTTP_PORT=3000' +
                ` -e GF_SECURITY_ADMIN_USER=${process.env.GRAFANA_USER}` +
                ` -e GF_SECURITY_ADMIN_PASSWORD=${process.env.GRAFANA_PWD}` +
                ' -e GF_DEFAULT_APP_MODE=production' +
                ' -e GF_LOGGING_MODE="console file"' +
                ' -e GF_LOGGING_LEVEL=info' +
                ' -e GF_PATHS_CONFIG=/etc/grafana/grafana.ini' +
                ' -e GF_PATHS_DATA=/var/lib/grafana' +
                ' -e GF_PATHS_HOME=/usr/share/grafana' +
                ' -e GF_PATHS_LOGS=/var/log/grafana' +
                ' -e GF_PATHS_PLUGINS=/var/lib/grafana/plugins' +
                ' -e GF_PATHS_PROVISIONING=/etc/grafana/provisioning' +
                ' -e GF_INSTALL_PLUGINS=grafana-piechart-panel' +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceKibana(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p 5601:5601` +
                ' -e SERVER_PORT=5601' +
                ' -e SERVER_HOST=0.0.0.0' +
                ' -e SERVER_NAME=es_cluster' +
                ` -e ELASTICSEARCH_HOSTS=["http://${ES_CLUSTER_ENTRANCE}"]` +
                ' -e KIBANA_INDEX=.kibana' +
                ' -e DIBANA_DEFAULTAPPID=home' +
                ' -e ELASTICSEARCH_PINGTIMEOUT=1500' +
                ' -e ELASTICSEARCH_REQUESTTIMEOUT=10000' +
                ' -e ELASTICSEARCH_LOGQUERIES=false' +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceJaegerAgent(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p 6832:6832` + // binary
                ` -p 6831:6831` + // compact
                ` -p 5778:5778` + // http (prometheus)
                ` ${service.image}` +
                ` --reporter.grpc.host-port=${JCOLLECTOR_ADDRESS.join(',')}` +
                ' --reporter.type=grpc' +
                ' --processor.jaeger-binary.server-host-port=0.0.0.0:6832' +
                ' --processor.jaeger-compact.server-host-port=0.0.0.0:6831' +
                ' --http-server.host-port=0.0.0.0:5778' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceFilebeat(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 5066:5066' +
                ` -v ${Tools.getConfDir()}/elasticsearch/filebeat.yaml:/usr/share/filebeat/filebeat.yml` +
                ' -v /tmp/logs/app:/tmp/logs/app' +
                ` -e ES_HOSTS=${ES_CLUSTER_NODES.join(',')}` +
                ' -e LOGGING_LEVEL=info' +
                ' -e NUM_OF_OUTPUT_WORKERS=12' +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceFilebeatExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9479:9479' +
                ` ${service.image}` +
                ' -beat.timeout=10s' +
                ` -beat.uri=http://${machine.ip}:5066` +
                ' -web.listen-address=0.0.0.0:9479' +
                ' -web.telemetry-path=/metrics';
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceAppWeb(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 8000:8000' +
                ` -v ${Tools.getConfDir()}/app/logger.yaml:/app/logger.yaml` +
                ' -v -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.web"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ' -e WEB_HOST="0.0.0.0"' +
                ' -e WEB_PORT="8000"' +
                ` -e MAX_WORK_ID="${process.env.MAX_WORK_ID}"` +
                ` -e RPC_SERVERS="[\"${Tools.getMachinesByType('service')[0].ip}:16241\"]"` +
                ' -e JAEGER_SERVICE_NAME="app.web"' +
                ` -e JAEGER_AGENT_HOST="${machine.ip}"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceAppService(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const storageIp = Tools.getMachinesByType('storage')[0].ip;
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 8001:8001' +
                ` -v ${Tools.getConfDir()}/app/logger.yaml:/app/logger.yaml` +
                ' -v -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.service"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ` -e CACHE_SERVERS="[\"${storageIp}:11211\"]"` +
                ` -e DB_HOST="${storageIp}"` +
                ' -e DB_PORT="3306"' +
                ` -e DB_USER="${process.env.MYSQL_USER}"` +
                ` -e DB_PWD="${process.env.MYSQL_PWD}"` +
                ` -e DB_NAME="${process.env.MYSQL_DB}"` +
                ' -e DB_CHARSET="utf8mb4"' +
                ' -e DB_COLLATION="utf8mb4_general_ci"' +
                ` -e DB_MAX_OPEN_CONN="${process.env.MYSQL_CONN_NUM}"` +
                ` -e DB_MAX_IDLE_CONN="${process.env.MYSQL_CONN_NUM}"` +
                ' -e DB_CONN_MAX_LIFE_TIME="300"' +
                ' -e SERVICE_HOST="0.0.0.0"' +
                ' -e SERVICE_PORT="16241' +
                ' -e WEB_HOST="0.0.0.0"' +
                ' -e WEB_PORT="8001"' +
                ` -e KAFKA_BROKERS="[\"${KAFKA_BROKERS_ADDRESS.join('","')}\"]"` +
                ' -e KAFKA_WRITE_ASYNC="false"' +
                ' -e JAEGER_SERVICE_NAME="app.service"' +
                ` -e JAEGER_AGENT_HOST="${machine.ip}"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceAppConsumer(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const storageIp = Tools.getMachinesByType('storage')[0].ip;
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 8002:8002' +
                ` -v ${Tools.getConfDir()}/app/logger.yaml:/app/logger.yaml` +
                ' -v -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.consumer"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ` -e CACHE_SERVERS="[\"${storageIp}:11211\"]"` +
                ` -e DB_HOST="${storageIp}"` +
                ' -e DB_PORT="3306"' +
                ` -e DB_USER="${process.env.MYSQL_USER}"` +
                ` -e DB_PWD="${process.env.MYSQL_PWD}"` +
                ` -e DB_NAME="${process.env.MYSQL_DB}"` +
                ' -e DB_CHARSET="utf8mb4"' +
                ' -e DB_COLLATION="utf8mb4_general_ci"' +
                ` -e DB_MAX_OPEN_CONN="${process.env.MYSQL_CONN_NUM}"` +
                ` -e DB_MAX_IDLE_CONN="${process.env.MYSQL_CONN_NUM}"` +
                ' -e DB_CONN_MAX_LIFE_TIME="300"' +
                ' -e WEB_HOST="0.0.0.0"' +
                ' -e WEB_PORT="8002"' +
                ` -e CONSUMER_ROUTINES="${process.env.KAFKA_PARTITIONS}"` +
                ` -e CONSUMER_FACTOR="${process.env.CONSUMER_FACTOR}"` +
                ` -e KAFKA_BROKERS="[\"${KAFKA_BROKERS_ADDRESS.join('","')}\"]"` +
                ' -e JAEGER_SERVICE_NAME="app.consumer"' +
                ` -e JAEGER_AGENT_HOST="${machine.ip}"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
}
class DistClusterToolStop {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            MACHINES.forEach((machine) => {
                const commands = [];
                machine.services.forEach((service) => {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        return;
                    }
                    commands.push(`docker stop ${service.name}`);
                });
                Tools.execSync(`docker-machine ssh ${machine.name} "${commands.join(' && ')}"`);
            });
        });
    }
}
class DistClusterToolStart {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            MACHINES.forEach((machine) => {
                const commands = [];
                machine.services.forEach((service) => {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        return;
                    }
                    commands.push(`docker start ${service.name}`);
                });
                Tools.execSync(`docker-machine ssh ${machine.name} "${commands.join(' && ')}"`);
            });
        });
    }
}
class DistClusterToolCleanup {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            MACHINES.forEach((machine) => {
                const commands = [];
                machine.services.forEach((service) => {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        return;
                    }
                    commands.push(`docker stop ${service.name}`);
                    commands.push(`docker rm ${service.name}`);
                });
                commands.push('docker volume rm $(docker volume ls -f "dangling=true" -q)');
                commands.push(`docker network rm ${machine.name}`);
                Tools.execSync(`docker-machine ssh ${machine.name} "${commands.join(' && ')}"`);
            });
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
    static getMachinesByType(type) {
        return MACHINES.filter((machine) => {
            return machine.type == type;
        });
    }
    static getServicesByType(type) {
        let services = [];
        MACHINES.forEach((machine) => {
            services = services.concat(machine.services);
        });
        return services.filter((service) => {
            return service.type == type;
        });
    }
    static getBaseDir() {
        return LibPath.join(__dirname, '..'); // dist-system-practice/bash/prod/cluster
    }
    static getConfDir() {
        return LibPath.join(__dirname, '..', '..', '..', '..', 'conf', 'prod'); // dist-system-practice/conf/prod
    }
    static getProjectDir() {
        return LibPath.join(__dirname, '..', '..', '..', '..'); // dist-system-practice
    }
    static execSync(command, output, options) {
        if (!options) {
            options = {};
        }
        console.log(`ExecsSync: ${command}`);
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
                console.log(`ExecsAsync: ${command}`);
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
    static replaceStrAll(str, search, replacement) {
        return str.replace(new RegExp(search, 'g'), replacement);
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