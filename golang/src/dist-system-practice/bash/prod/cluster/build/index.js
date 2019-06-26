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
const KAFKA_BROKERS_ADDRESS = []; // "ip:port", ...
const KAFKA_METRICS_ADDRESS = []; // "ip:port", ...
let ES_CLUSTER_ENTRANCE = '';
let ES_CLUSTER_NODES = '';
const MACHINES = [
    {
        "name": "client",
        "type": "client",
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
                yield this[`deployService${camel(service.type, { pascalCase: true })}`].apply(this, [machine, service]);
            }
        });
    }
    deployServiceNodeExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = `docker network create ${machine.name} &&` +
                ` docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 9100:9100' +
                ' -v /:/host:ro,rslave' +
                ` ${service.image}` +
                ` --path.rootfs /host`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
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
                ` --network ${machine.name}` +
                ' -p 3306:3306' +
                ` -v ${Tools.getProjectDir()}/schema/schema.sql:/docker-entrypoint-initdb.d/schema.sql` +
                ` -v ${insertSqlPath}:/docker-entrypoint-initdb.d/${machine.name}_${service.name}_init.sql` +
                ' -v mysqld_data:/var/lib/mysql' +
                ` -e MYSQL_DATABASE="${process.env.MYSQL_DB}"` +
                ` -e MYSQL_ROOT_PASSWORD="${process.env.MYSQL_PWD}"` +
                ` ${service.image}` +
                ` --max-allowed-packet=33554432`; // 32M
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
            // waiting for mysql initialized
            yield waitMysqldInitialized();
        });
    }
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
    deployServiceZookeeper(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const initCommand = 'docker volume create zookeeper_data &&' +
                'docker volume create zookeeper_conf &&' +
                `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 2181:2181' +
                ' -v zookeeper_data:/opt/zookeeper-3.4.13/data' +
                ' -v zookeeper_conf:/opt/zookeeper-3.4.13/conf' +
                ` ${service.image}`;
            yield Tools.execAsync(`docker-machine ssh ${machine.name} "${initCommand}"`, `services/${machine.name}/${service.name}`);
        });
    }
    deployServiceKafka(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // kafka_1 => [kafka, 1] => 1
            const brokerId = id - 1; // 1-1 => 0
            const portInternal = `9${brokerId}93`; // 9093、9193、9293、...
            const portExternal = `9${brokerId}92`; // 9092、9192、9292、...
            const portMetrics = `7${brokerId}71`; // 7071、7172、7173、...
            KAFKA_BROKERS_ADDRESS.push(`${machine.ip}:${portExternal}`);
            KAFKA_METRICS_ADDRESS.push(`${machine.ip}:${portMetrics}`);
            const machines = Tools.getMachinesByType(machine.type);
            const services = Tools.getServicesByType(service.type);
            const initCommand = `docker volume create kafka_data_${id} &&` +
                `docker volume create kafka_home_${id} &&` +
                `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p ${portInternal}:${portInternal}` +
                ` -p ${portExternal}:${portExternal}` +
                ` -p ${portMetrics}:${portMetrics}` +
                ` -v ${Tools.getProjectDir()}/vendors/kafka/jmx_prometheus_javaagent-0.9.jar:/usr/local/bin/jmx_prometheus_javaagent-0.9.jar` +
                ` -v ${Tools.getProjectDir()}/vendors/kafka/jmx-kafka-2_0_0.yaml:/etc/jmx-exporter/jmx-kafka-2_0_0.yaml` +
                ` -v kafka_data_${id}:/tmp/kafka/data` +
                ` -v kafka_home_${id}:/tmp/kafka/data` +
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
                yield new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 5000); // 5s
                });
            }
        });
    }
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
    deployServiceElasticsearch(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // es_1 => [es, 1] => 1
            const portInternal = `930${id - 1}`; // 9300、9301、9302、...
            const portExternal = `920${id - 1}`; // 9200、9201、9202、...
            const machines = Tools.getMachinesByType(machine.type);
            const services = Tools.getServicesByType(service.type);
            let nodes = [];
            let discoverySeedHosts = [];
            machines.forEach((mch) => {
                mch.services.forEach((svc) => {
                    if (svc.type != service.type) {
                        return;
                    }
                    const portId = Number.parseInt(svc.name.split('_')[1]) - 1;
                    discoverySeedHosts.push(`${mch.ip}:930${portId}`);
                    nodes.push(`${mch.ip}:920${portId}`);
                });
            });
            let initialMasterNodes = [];
            services.forEach((svc) => {
                initialMasterNodes.push(svc.name);
            });
            ES_CLUSTER_ENTRANCE = `${machines[0].ip}:9200`;
            ES_CLUSTER_NODES = nodes.join(',');
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
        return LibPath.join(__dirname, '..', '..', '..', '..', 'conf', 'prod'); // dist-system-practice/conf/prod/cluster
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