import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as LibUtil from 'util';
import * as LibCp from "child_process";

import * as program from 'commander';
import * as shell from 'shelljs';
import * as mkdir from 'mkdirp';
import * as camel from 'camelcase';
import * as fetch from 'node-fetch';
import * as AbortController from 'abort-controller';
import * as ssh2 from 'ssh2';

const pkg = require('../package.json');

const mkdirp = LibUtil.promisify(mkdir) as (path: string) => void;

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const KAFKA_BROKERS_ADDRESS = []; // ["ip:port", ...]
const KAFKA_METRICS_ADDRESS = []; // ["ip:port", ...]
let ES_CLUSTER_ENTRANCE = ''; // ip:port
let ES_CLUSTER_NODES = []; // ["ip:port", ...]
let CAS_CLUSTER_ENTRANCE = ''; // ip
const JCOLLECTOR_ADDRESS = []; // ["ip:port", ...]

const MACHINES: Array<Machine> = [
    {
        "name": "client",
        "type": "client",
        "ip": process.env.HOST_IP_CLIENT,
        "services": [
            {"name": "node_client", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_client", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "vegeta", "type": "vegeta", "image": "peterevans/vegeta:6.5.0"}
        ],
    },
    {
        "name": "storage",
        "type": "storage",
        "ip": process.env.HOST_IP_STORAGE,
        "services": [
            {"name": "node_storage", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_storage", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "mysqld", "type": "mysqld", "image": "mysql:5.7.26"},
            {"name": "mysqld_exporter", "type": "mysqld_exporter", "image": "prom/mysqld-exporter:v0.11.0"},
            {"name": "memcached", "type": "memcached", "image": "memcached:1.5.14-alpine"},
            {"name": "memcached_exporter", "type": "memcached_exporter", "image": "prom/memcached-exporter:v0.5.0"}
        ],
    },
    {
        "name": "kafka1",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_1,
        "services": [
            {"name": "node_kafka_1", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_kafka_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "zookeeper", "type": "zookeeper", "image": "wurstmeister/zookeeper:latest"},
            {"name": "kafka_1", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_2", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
        ],
    },
    {
        "name": "kafka2",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_2,
        "services": [
            {"name": "node_kafka_2", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_kafka_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "kafka_3", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_4", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_exporter", "type": "kafka_exporter", "image": "danielqsj/kafka-exporter:v1.2.0"},
        ],
    },
    {
        "name": "es1",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_1,
        "services": [
            {"name": "node_es_1", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_es_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "es_1", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
            {"name": "es_2", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
        ],
    },
    {
        "name": "es2",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_2,
        "services": [
            {"name": "node_es_2", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_es_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "es_3", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
            {"name": "es_4", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
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
            {"name": "node_monitor", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_monitor", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "cassandra", "type": "cassandra", "image": "cassandra:3.11.4"},
            {
                "name": "cassandra_init",
                "type": "cassandra_init",
                "image": "jaegertracing/jaeger-cassandra-schema:1.11.0"
            },
            {"name": "jcollector_1", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0"},
            {"name": "jcollector_2", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0"},
            {"name": "jquery", "type": "jaeger_query", "image": "jaegertracing/jaeger-query:1.11.0"},
            {"name": "prometheus", "type": "prometheus", "image": "prom/prometheus:v2.8.1"},
            {"name": "grafana", "type": "grafana", "image": "grafana/grafana:6.1.2"},
            {"name": "kibana", "type": "kibana", "image": "kibana:7.0.0"},
        ]
    },
    {
        "name": "web",
        "type": "web",
        "ip": process.env.HOST_IP_WEB,
        "services": [
            {"name": "node_web", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_web", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "jagent_web", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0"},
            {"name": "app_web", "type": "app_web", "image": "agreatfool/dist_app_web:0.0.2"},
            {"name": "filebeat_web", "type": "filebeat", "image": "elastic/filebeat:7.0.0"},
            {"name": "fb_exporter_web", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2"},
        ]
    },
    {
        "name": "service",
        "type": "service",
        "ip": process.env.HOST_IP_SERVICE,
        "services": [
            {"name": "node_service", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1"},
            {"name": "cadvisor_service", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "jagent_service", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0"},
            {"name": "app_service", "type": "app_service", "image": "agreatfool/dist_app_service:0.0.2"},
            {"name": "app_consumer", "type": "app_consumer", "image": "agreatfool/dist_app_consumer:0.0.2"},
            {"name": "filebeat_service", "type": "filebeat", "image": "elastic/filebeat:7.0.0"},
            {"name": "fb_exporter_service", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2"},
        ]
    },
];

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* STRUCTURE
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
interface Machine {
    name: string;
    type: string;
    ip: string;
    services: Array<Service>;
}

interface Service {
    name: string;
    type: string;
    image: string;
}

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* COMMAND LINE
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
program.version(pkg.version)
    .description('cluster.sh: dist-system-practice project automation cluster tool')
    .option('--machine', 'init docker env')
    .option('--hardware', 'test host machine hardware')
    .option('--image', 'download docker hub images')
    .option('--deploy', 'execute deploy command')
    .option('--stop', 'stop all deployed services')
    .option('--start', 'start all deployed services')
    .option('--cleanup', 'remove all deployed services')
    .option('--capture', 'capture stress test data')
    .option('--stress', 'stress test')
    .option('--machine-type <string>', '--deploy sub param, specify target machine type of deployment')
    .option('--exclude-service-types <types>', '--deploy sub param, specify exclude service types of deployment, e.g node_exporter,cadvisor,...', (types) => {
        return types.split(',');
    })
    .parse(process.argv);

const ARGS_ACTION_MACHINE = (program as any).machine === undefined ? undefined : true;
const ARGS_ACTION_HARDWARE = (program as any).hardware === undefined ? undefined : true;
const ARGS_ACTION_IMAGE = (program as any).image === undefined ? undefined : true;
const ARGS_ACTION_DEPLOY = (program as any).deploy === undefined ? undefined : true;
const ARGS_ACTION_STOP = (program as any).stop === undefined ? undefined : true;
const ARGS_ACTION_START = (program as any).start === undefined ? undefined : true;
const ARGS_ACTION_CLEANUP = (program as any).cleanup === undefined ? undefined : true;
const ARGS_ACTION_CAPTURE = (program as any).capture === undefined ? undefined : true;
const ARGS_ACTION_STRESS = (program as any).stress === undefined ? undefined : true;

const ARGS_MACHINE_TYPE = (program as any).machineType === undefined ? undefined : (program as any).machineType;
const ARGS_EXCLUDE_SERVICE_TYPES = (program as any).excludeServiceTypes === undefined ? [] : (program as any).excludeServiceTypes;

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* IMPLEMENTATION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class DistClusterTool {

    public async run() {
        console.log('[Cluster Tool] run ...');

        if (ARGS_ACTION_MACHINE) {
            await this.machine();
        } else if (ARGS_ACTION_HARDWARE) {
            await this.hardware();
        } else if (ARGS_ACTION_IMAGE) {
            await this.image();
        } else if (ARGS_ACTION_DEPLOY) {
            await this.deploy();
        } else if (ARGS_ACTION_STOP) {
            await this.stop();
        } else if (ARGS_ACTION_START) {
            await this.start();
        } else if (ARGS_ACTION_CLEANUP) {
            await this.cleanup();
        } else if (ARGS_ACTION_CAPTURE) {
            await this.capture();
        } else if (ARGS_ACTION_STRESS) {
            await this.stress();
        } else {
            console.log('[Cluster Tool] Invalid option: Action option required');
            process.exit(1);
        }
    }

    private async machine() {
        console.log('[Cluster Tool] machine ...');
        await (new DistClusterToolMachine()).run();
    }

    private async hardware() {
        console.log('[Cluster Tool] hardware ...');
        await (new DistClusterToolHardware()).run();
    }

    private async image() {
        console.log('[Cluster Tool] image ...');
        await (new DistClusterToolImage()).run();
    }

    private async deploy() {
        console.log('[Cluster Tool] deploy ...');
        await (new DistClusterToolDeploy()).run();
    }

    private async stop() {
        console.log('[Cluster Tool] stop ...');
        await (new DistClusterToolStop()).run();
    }

    private async start() {
        console.log('[Cluster Tool] start ...');
        await (new DistClusterToolStart()).run();
    }

    private async cleanup() {
        console.log('[Cluster Tool] cleanup ...');
        await (new DistClusterToolCleanup()).run();
    }

    private async capture() {
        console.log('[Cluster Tool] capture ...');
        await (new DistClusterToolCapture()).run();
    }

    private async stress() {
        console.log('[Cluster Tool] stress ...');
        await (new DistClusterToolStress()).run();
    }

}

class DistClusterToolMachine {

    public async run() {
        for (let machine of MACHINES) {
            await Tools.execAsync(
                'docker-machine create -d generic' +
                ` --generic-ip-address=${machine.ip}` +
                ' --generic-ssh-port 22' +
                ' --generic-ssh-key ~/.ssh/id_rsa' +
                ' --generic-ssh-user root' +
                ` ${machine.name}`,
                `machines/${machine.name}`
            );
        }

        await Tools.execAsync('docker-machine ls', 'machines/list');
    }

}

class DistClusterToolHardware {

    public async run() {
        let tasks = [];

        MACHINES.forEach((machine: Machine) => {
            tasks.push(new Promise(async (resolve) => {
                await Tools.execAsync(
                    `docker-machine ssh ${machine.name} "wget -qO- bench.sh | bash"`,
                    `hardwares/${machine.name}/bench`
                );
                await Tools.execAsync(
                    `docker-machine ssh ${machine.name} "(curl -s wget.racing/nench.sh | bash) 2>&1 | tee nench.log"`,
                    `hardwares/${machine.name}/nench`
                );
                resolve();
            }));
        });

        await Promise.all(tasks).catch((err) => {
            console.log(`Error in "testHardwares": ${err.toString()}`)
        });
    }

}

class DistClusterToolImage {

    public async run() {
        await this.prepareImages();
        await this.prepareMysqlData();
        await this.prepareKafkaData();
        await this.prepareElasticserachData();
        await this.preparePrometheusData();
        await this.prepareGrafanaData();
        await this.prepareFilebeatData();
        await this.prepareAppData();
    }

    private async prepareImages() {
        for (let machine of MACHINES) {
            // collect image names
            let images = [];
            machine.services.forEach((service: Service) => {
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
            await Tools.execAsync(
                `docker-machine ssh ${machine.name} "${pullCommands.join(' && ')}"`,
                `images/${machine.name}`
            );
        }
    }

    private async prepareMysqlData() {
        const machine = Tools.getMachinesByType('storage')[0];
        const service = Tools.getServicesByType('mysqld')[0];

        // prepare init sql file
        let inserts = [];
        for (let i = 0; i < Number.parseInt(process.env.MAX_WORK_ID); i++) {
            inserts.push('()');
        }
        const insertSqlFile = `${machine.name}_${service.name}_init.sql`;
        const insertSqlPath = `/tmp/${insertSqlFile}`;
        LibFs.writeFileSync(insertSqlPath, `INSERT INTO ${process.env.MYSQL_DB}.work VALUES ${inserts.join(',')};`);

        await Tools.execAsync([
            `scp -r ${Tools.getProjectDir()}/schema root@${machine.ip}:/tmp/`,
            `scp ${insertSqlPath} root@${machine.ip}:/tmp/`,
        ].join(' && '));
    }

    private async prepareKafkaData() {
        for (let machine of Tools.getMachinesByType('kafka')) {
            await Tools.execAsync([
                `scp ${Tools.getProjectDir()}/vendors/kafka/jmx_prometheus_javaagent-0.9.jar root@${machine.ip}:/tmp/`,
                `scp ${Tools.getProjectDir()}/vendors/kafka/jmx-kafka-2_0_0.yaml root@${machine.ip}:/tmp/`,
            ].join(' && '));
        }
    }

    private async prepareElasticserachData() {
        for (let machine of Tools.getMachinesByType('elasticsearch')) {
            await Tools.execAsync(`scp ${Tools.getConfDir()}/elasticsearch/elasticsearch.yaml root@${machine.ip}:/tmp/`)
        }
    }

    private async preparePrometheusData() {
        const replacedConfPath = '/tmp/prom-master.yaml';
        let promConf = (await LibFs.readFile(`${Tools.getConfDir()}/prometheus/prom-master.yaml`)).toString();
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_CLIENT', process.env.HOST_IP_CLIENT);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_STORAGE', process.env.HOST_IP_STORAGE);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_KAFKA_1', process.env.HOST_IP_KAFKA_1);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_KAFKA_2', process.env.HOST_IP_KAFKA_2);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_ES_1', process.env.HOST_IP_ES_1);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_ES_2', process.env.HOST_IP_ES_2);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_MONITOR', process.env.HOST_IP_MONITOR);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_WEB', process.env.HOST_IP_WEB);
        promConf = Tools.replaceStrAll(promConf, 'HOST_IP_SERVICE', process.env.HOST_IP_SERVICE);
        await LibFs.writeFile(replacedConfPath, promConf);

        const machine = Tools.getMachinesByType('monitor')[0];

        await Tools.execAsync(`scp ${replacedConfPath} root@${machine.ip}:/tmp/`);
    }

    private async prepareGrafanaData() {
        const machine = Tools.getMachinesByType('monitor')[0];

        await Tools.execAsync([
            `scp ${Tools.getConfDir()}/grafana/grafana.ini root@${machine.ip}:/tmp/`,
            `scp -r ${Tools.getProjectDir()}/vendors/prometheus/grafana/provisioning root@${machine.ip}:/tmp/`,
            `scp -r ${Tools.getProjectDir()}/vendors/prometheus/grafana/dashboards root@${machine.ip}:/tmp/`,
        ].join(' && '));
    }

    private async prepareFilebeatData() {
        const machines: Array<Machine> = [];

        machines.push(Tools.getMachinesByType('web')[0]);
        machines.push(Tools.getMachinesByType('service')[0]);

        for (let machine of machines) {
            await Tools.execAsync(`scp ${Tools.getConfDir()}/elasticsearch/filebeat.yaml root@${machine.ip}:/tmp/`);
        }
    }

    private async prepareAppData() {
        const machines: Array<Machine> = [];

        machines.push(Tools.getMachinesByType('web')[0]);
        machines.push(Tools.getMachinesByType('service')[0]);

        for (let machine of machines) {
            await Tools.execAsync(`scp ${Tools.getConfDir()}/app/logger.yaml root@${machine.ip}:/tmp/`);
        }
    }

}

class DistClusterToolDeploy {

    public async run() {
        // validate "--machine-type"
        if (!ARGS_MACHINE_TYPE) {
            console.log('[DistClusterToolDeploy] Machine type have to be specified: --machine-type');
            process.exit(1);
        }
        const machineFiltered = MACHINES.filter((machine: Machine) => {
            if (machine.type === ARGS_MACHINE_TYPE) {
                return true;
            }
        });
        if (machineFiltered.length === 0) {
            console.log(`[DistClusterToolDeploy] Invalid machine type: ${ARGS_MACHINE_TYPE}`);
            process.exit(1);
        }

        // validate "--exclude-service-types"
        ARGS_EXCLUDE_SERVICE_TYPES.forEach((type: string) => {
            let found = false;
            MACHINES.forEach((machine: Machine) => {
                machine.services.forEach((service: Service) => {
                    if (service.type === type) {
                        found = true;
                    }
                });
            });
            if (!found) {
                console.log(`[DistClusterToolDeploy] Invalid exclude service type: ${type}`);
                process.exit(1);
            }
        });

        await this.deployMachines();
    }

    private async deployMachines() {
        for (let machine of MACHINES) {

            if (machine.type !== ARGS_MACHINE_TYPE) {
                continue;
            }

            await this.deployMachine(machine);
        }
    }

    private async deployMachine(machine: Machine) {
        for (let service of machine.services) {
            if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                continue;
            }

            if (ARGS_EXCLUDE_SERVICE_TYPES.indexOf(service.type) !== -1) {
                continue;
            }

            await (this[`deployService${camel(service.type, {pascalCase: true})}`] as Function).apply(this, [machine, service]);
        }
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceNodeExporter(machine: Machine, service: Service) {
        const prepareCommand = 'killall node_exporter;' +
            ' rm -rf ./node_exporter*;' +
            ' wget https://github.com/prometheus/node_exporter/releases/download/v0.18.1/node_exporter-0.18.1.linux-amd64.tar.gz;' +
            ' mkdir -p ./node_exporter;' +
            ' tar xvfz node_exporter-0.18.1.linux-amd64.tar.gz -C ./node_exporter --strip-components=1';
        await Tools.execAsync(`docker-machine ssh ${machine.name} "${prepareCommand}"`);

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "nohup ./node_exporter/node_exporter &> /tmp/node_exporter.log&"`
        );
        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "ps aux|grep node_exporter"`,
            `services/${machine.name}/${service.name}_ps`
        );
        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "cat /tmp/node_exporter.log"`,
            `services/${machine.name}/${service.name}_cat`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceCadvisor(machine: Machine, service: Service) {
        const initCommand = `docker network create ${machine.name} &&` +
            ` docker run -d --name ${service.name}` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "docker network rm ${machine.name}"`
        );
        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceMysqld(machine: Machine, service: Service) {
        // tool
        function waitMysqldInitialized() {
            return new Promise((resolve, reject) => {
                const msgDone = "Version: '5.7.26'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)";

                const child = shell.exec(
                    `docker-machine ssh ${machine.name} "docker logs -f ${service.name}"`,
                    {async: true, timeout: 30000}
                ) as LibCp.ChildProcess;

                function detectEnd(chunk: any) {
                    const msg = chunk.toString();
                    if (msg.indexOf(msgDone) != -1) {
                        child.kill();
                        resolve();
                    } else {
                    }
                }

                child.stdout.on('data', (chunk) => {
                    detectEnd(chunk);
                });
                child.stderr.on('data', (chunk) => {
                    detectEnd(chunk);
                });

                child.on('close', () => resolve());
                child.on('exit', () => resolve());
                child.on('error', (err) => reject(err));
            });
        }

        // prepare init sql file
        const insertSqlFile = `${machine.name}_${service.name}_init.sql`;

        // init mysqld container
        const initCommand = 'docker volume create mysqld_data &&' +
            ` docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ' --ulimit nproc=65535' +
            ' --ulimit nofile=65535:65535' +
            ' --ulimit memlock=-1:-1' +
            ` --network ${machine.name}` +
            ' -p 3306:3306' +
            ` -v /tmp/schema/schema.sql:/docker-entrypoint-initdb.d/schema.sql` +
            ` -v /tmp/${insertSqlFile}:/docker-entrypoint-initdb.d/${machine.name}_${service.name}_init.sql` +
            ' -v mysqld_data:/var/lib/mysql' +
            ` -e MYSQL_DATABASE="${process.env.MYSQL_DB}"` +
            ` -e MYSQL_ROOT_PASSWORD="${process.env.MYSQL_PWD}"` +
            ` ${service.image}` +
            ` --bind-address=0.0.0.0` +
            ` --max-connections=${Number.parseInt(process.env.MYSQL_CONN_NUM) + 100}` +
            ' --max-allowed-packet=33554432'; // 32M

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );

        // waiting for mysql initialized
        await waitMysqldInitialized();
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceMysqldExporter(machine: Machine, service: Service) {
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


        await Tools.execSSH(machine.ip, initCommand);
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceMemcached(machine: Machine, service: Service) {
        const initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 11211:11211' +
            ` ${service.image}` +
            ' -l 0.0.0.0' +
            ' -p 11211' +
            ` -m ${process.env.MEMCACHED_MEM}`;

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceMemcachedExporter(machine: Machine, service: Service) {
        const initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 9150:9150' +
            ` ${service.image}` +
            ' --memcached.address=memcached:11211';

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceZookeeper(machine: Machine, service: Service) {
        const initCommand = 'docker volume create zookeeper_data &&' +
            ' docker volume create zookeeper_conf &&' +
            ` docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 2181:2181' +
            ' -v zookeeper_data:/opt/zookeeper-3.4.13/data' +
            ' -v zookeeper_conf:/opt/zookeeper-3.4.13/conf' +
            ` ${service.image}`;

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceKafka(machine: Machine, service: Service) {
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
            ` -v /tmp/jmx_prometheus_javaagent-0.9.jar:/usr/local/bin/jmx_prometheus_javaagent-0.9.jar` +
            ` -v /tmp/jmx-kafka-2_0_0.yaml:/etc/jmx-exporter/jmx-kafka-2_0_0.yaml` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );

        // wait several seconds here, wait for kafka initialization done
        if (id === services.length) { // only the last node need to do this
            console.log('Wait 30s, then create topic data');
            await new Promise((resolve) => {
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
            await Tools.execAsync(
                topicCommand,
                `services/${machine.name}/kafka_topic`
            );
        }
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceKafkaExporter(machine: Machine, service: Service) {
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

        KAFKA_BROKERS_ADDRESS.forEach((address: string) => {
            initCommand += ` --kafka.server=${address}`;
        });

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceElasticsearch(machine: Machine, service: Service) {
        const id = Number.parseInt(service.name.split('_')[1]); // es_1 => [es, 1] => 1
        const portInternal = `930${id - 1}`; // 9300、9301、9302、...
        const portExternal = `920${id - 1}`; // 9200、9201、9202、...

        const machines = Tools.getMachinesByType(machine.type);
        const services = Tools.getServicesByType(service.type);

        let discoverySeedHosts = [];
        machines.forEach((mch: Machine) => {
            mch.services.forEach((svc: Service) => {
                if (svc.type != service.type) {
                    return;
                }
                const portId = Number.parseInt(svc.name.split('_')[1]) - 1;
                discoverySeedHosts.push(`${mch.ip}:930${portId}`);
                ES_CLUSTER_NODES.push(`${mch.ip}:920${portId}`);
            });
        });
        let initialMasterNodes = [];
        services.forEach((svc: Service) => {
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
            ` -v /tmp/elasticsearch/elasticsearch.yaml:/usr/share/elasticsearch/config/elasticsearch.yml` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );

        let failed = 0;

        async function waitElasticsearchCluster() {
            // @ts-ignore
            const controller = new AbortController();
            const timeout = setTimeout(
                () => {
                    controller.abort();
                },
                50000, // 50s
            );

            try {
                // @ts-ignore
                let response = await fetch(
                    `http://${ES_CLUSTER_ENTRANCE}/_cluster/health?wait_for_status=green&timeout=60s`,
                    {signal: controller.signal}
                );
                let data = await response.json();
                clearTimeout(timeout);
                console.log('Es cluster: ', data);
            } catch (err) {
                console.log(`Failed, wait 15s to retry, times: ${failed++}, msg: ${err.message}`);
                clearTimeout(timeout);
                await new Promise((resolve) => {
                    setTimeout(() => resolve(), 15000); // wait 15s before retry
                });
                return waitElasticsearchCluster(); // again
            }
        }

        // check cluster status, init index when ready
        if (id == services.length) {
            console.log('Start to wait for es cluster ...');
            await waitElasticsearchCluster();
            await Tools.execAsync(
                'curl -H "Content-Type: application/json"' +
                ` -PUT "${ES_CLUSTER_ENTRANCE}/_template/dist?pretty"` +
                ` -d @${Tools.getConfDir()}/elasticsearch/elk-index-template.json`,
                `services/${machine.name}/es_index`
            );
        }
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceEsExporter(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceCassandra(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );

        // wait seconds for cassandra initialized
        console.log('Start to wait for cassandra cluster ...');
        await new Promise((resolve) => {
            setTimeout(() => resolve(), 30000); // 30s
        });
        const sqlCommand = 'docker run --rm --name jaeger-cassandra-schema' +
            ` --network ${machine.name}` +
            ' -e MODE=test' +
            ` -e CQLSH_HOST=${CAS_CLUSTER_ENTRANCE}` +
            ' -e DATACENTER=jaeger_dc' +
            ' -e KEYSPACE=jaeger_keyspace' +
            ` ${Tools.getServicesByType('cassandra_init')[0].image}`;
        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${sqlCommand}"`,
            `services/${machine.name}/cassandra_init`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceJaegerCollector(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceJaegerQuery(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServicePrometheus(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceGrafana(machine: Machine, service: Service) {
        let initCommand = 'docker volume create grafana_data &&' +
            ` docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ` -p 3000:3000` +
            ` -v /tmp/grafana.ini:/etc/grafana/grafana.ini` +
            ` -v /tmp/provisioning:/etc/grafana/provisioning` +
            ` -v /tmp/dashboards:/etc/grafana/dashboards` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceKibana(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceJaegerAgent(machine: Machine, service: Service) {
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceFilebeat(machine: Machine, service: Service) {
        let initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 5066:5066' +
            ` -v /tmp/filebeat.yaml:/usr/share/filebeat/filebeat.yml` +
            ' -v /tmp/logs/app:/tmp/logs/app' +
            ` -e ES_HOSTS=${ES_CLUSTER_NODES.join(',')}` +
            ' -e LOGGING_LEVEL=info' +
            ' -e NUM_OF_OUTPUT_WORKERS=12' +
            ` ${service.image}`;

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceFilebeatExporter(machine: Machine, service: Service) {
        let initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 9479:9479' +
            ` ${service.image}` +
            ' -beat.timeout=10s' +
            ` -beat.uri=http://${machine.ip}:5066` +
            ' -web.listen-address=0.0.0.0:9479' +
            ' -web.telemetry-path=/metrics';

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceAppWeb(machine: Machine, service: Service) {
        let initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 8000:8000' +
            ` -v /tmp/logger.yaml:/app/logger.yaml` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceAppService(machine: Machine, service: Service) {
        const storageIp = Tools.getMachinesByType('storage')[0].ip;

        let initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 8001:8001' +
            ` -v /tmp/app/logger.yaml:/app/logger.yaml` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

    //noinspection JSUnusedLocalSymbols
    private async deployServiceAppConsumer(machine: Machine, service: Service) {
        const storageIp = Tools.getMachinesByType('storage')[0].ip;

        let initCommand = `docker run -d --name ${service.name}` +
            ' --log-driver json-file --log-opt max-size=1G' +
            ` --network ${machine.name}` +
            ' -p 8002:8002' +
            ` -v /tmp/app/logger.yaml:/app/logger.yaml` +
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

        await Tools.execAsync(
            `docker-machine ssh ${machine.name} "${initCommand}"`,
            `services/${machine.name}/${service.name}`
        );
    }

}

class DistClusterToolStop {

    public async run() {
        MACHINES.forEach((machine: Machine) => {
            const commands = [];

            machine.services.forEach((service: Service) => {
                if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                    return;
                }
                commands.push(`docker stop ${service.name}`);
            });

            Tools.execSync(`docker-machine ssh ${machine.name} "${commands.join(' && ')}"`);
        });
    }

}

class DistClusterToolStart {

    public async run() {
        MACHINES.forEach((machine: Machine) => {
            const commands = [];

            machine.services.forEach((service: Service) => {
                if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                    return;
                }
                commands.push(`docker start ${service.name}`);
            });

            Tools.execSync(`docker-machine ssh ${machine.name} "${commands.join(' && ')}"`);
        });
    }

}

class DistClusterToolCleanup {

    public async run() {
        MACHINES.forEach((machine: Machine) => {
            const commands = [];

            machine.services.forEach((service: Service) => {
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
    }

}

class DistClusterToolCapture {

    public async run() {

    }

}

class DistClusterToolStress {

    public async run() {

    }

}

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* TOOLS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class Tools {

    public static getMachinesByType(type: string): Array<Machine> {
        return MACHINES.filter((machine: Machine) => {
            return machine.type == type;
        });
    }

    public static getServicesByType(type: string): Array<Service> {
        let services = [];
        MACHINES.forEach((machine: Machine) => {
            services = services.concat(machine.services as Array<any>);
        });

        return services.filter((service: Service) => {
            return service.type == type;
        });
    }

    public static getBaseDir() {
        return LibPath.join(__dirname, '..'); // dist-system-practice/bash/prod/cluster
    }

    public static getConfDir() {
        return LibPath.join(__dirname, '..', '..', '..', '..', 'conf', 'prod'); // dist-system-practice/conf/prod
    }

    public static getProjectDir() {
        return LibPath.join(__dirname, '..', '..', '..', '..'); // dist-system-practice
    }

    public static async execSSH(ip: string, command: string) {
        console.log(`ExecSSH: ${command}`);

        return new Promise((resolve, reject) => {
            let conn = new ssh2.Client();
            conn.on('ready', function() {
                conn.exec(command, function(err, stream) {
                    if (err) {
                        return reject(err);
                    }

                    stream.on('close', function(code, signal) {
                        console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                        conn.end();
                        resolve();
                    }).on('data', function(data) {
                        console.log('STDOUT: ' + data);
                    }).stderr.on('data', function(data) {
                        console.log('STDERR: ' + data);
                    });
                });
            }).connect({
                host: ip,
                port: 22,
                username: 'root',
                privateKey: LibFs.readFileSync('/home/ubuntu/.ssh/id_rsa')
            });
        });
    }

    public static execSync(command: string, output?: string, options?: shell.ExecOptions): shell.ExecOutputReturnValue {
        if (!options) {
            options = {};
        }

        console.log(`ExecsSync: ${command}`);

        const result = shell.exec(command, options) as shell.ExecOutputReturnValue;

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

    public static async execAsync(command: string, output?: string, options?: shell.ExecOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!options) {
                options = {};
            }

            console.log(`ExecsAsync: ${command}`);

            const child = shell.exec(command, Object.assign(options, {async: true})) as LibCp.ChildProcess;

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
    }

    public static ucFirst(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    public static replaceStrAll(str: string, search: string, replacement: string) {
        return str.replace(new RegExp(search, 'g'), replacement);
    }

}

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* EXECUTION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
new DistClusterTool().run().then(_ => _).catch(_ => console.log(_));

process.on('uncaughtException', (error: Error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error: Error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});