import * as LibFs from 'mz/fs';
import * as LibPath from 'path';
import * as LibUtil from 'util';
import * as LibCp from "child_process";

import * as program from 'commander';
import * as shell from 'shelljs';
import * as mkdir from 'mkdirp';

const pkg = require('../package.json');

const mkdirp = LibUtil.promisify(mkdir) as (path: string) => void;

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const MACHINES: Array<Machine> = [
    {
        "name": "client",
        "ip": process.env.HOST_IP_CLIENT,
        "services": [],
    },
    {
        "name": "storage",
        "ip": process.env.HOST_IP_STORAGE,
        "services": [
            {"name": "node_storage", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_storage", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "mysqld", "type": "mysqld", "image": "mysql:5.7.26"},
            {"name": "mysqld_exporter", "type": "mysqld_exporter", "image": "prom/mysqld-exporter:v0.11.0"},
            {"name": "memcached", "type": "memcached", "image": "memcached:1.5.14-alpine"},
            {"name": "memcached_exporter", "type": "memcached_exporter", "image": "prom/memcached-exporter:v0.5.0"}
        ],
    },
    {
        "name": "kafka",
        "ip": process.env.HOST_IP_KAFKA_1,
        "services": [
            {"name": "node_kafka_1", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_kafka_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "zookeeper", "type": "zookeeper", "image": "wurstmeister/zookeeper:latest"},
            {"name": "kafka_1", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_2", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
        ],
    },
    {
        "name": "kafka",
        "ip": process.env.HOST_IP_KAFKA_2,
        "services": [
            {"name": "node_kafka_2", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_kafka_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "kafka_3", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_4", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0"},
            {"name": "kafka_exporter", "type": "kafka-exporter", "image": "danielqsj/kafka-exporter:v1.2.0"},
        ],
    },
    {
        "name": "elasticsearch",
        "ip": process.env.HOST_IP_ES_1,
        "services": [
            {"name": "node_es_1", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_es_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "es_1", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
            {"name": "es_2", "type": "elasticsearch", "image": "elasticsearch:7.0.0"},
        ],
    },
    {
        "name": "elasticsearch",
        "ip": process.env.HOST_IP_ES_2,
        "services": [
            {"name": "node_es_2", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
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
        "ip": process.env.HOST_IP_MONITOR,
        "services": [
            {"name": "node_monitor", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_monitor", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "cassandra", "type": "cassandra", "image": "cassandra:3.11.4"},
            {"name": "jquery", "type": "jaeger_query", "image": "jaegertracing/jaeger-query:1.11.0"},
            {"name": "jcollector_1", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0"},
            {"name": "jcollector_2", "type": "jaeger_collector", "image": "jaegertracing/jaeger-collector:1.11.0"},
            {"name": "prometheus", "type": "prometheus", "image": "prom/prometheus:v2.8.1"},
            {"name": "grafana", "type": "grafana", "image": "grafana/grafana:6.1.2"},
            {"name": "kibana", "type": "kibana", "image": "kibana:7.0.0"},
        ]
    },
    {
        "name": "web",
        "ip": process.env.HOST_IP_WEB,
        "services": [
            {"name": "node_web", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_web", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "dist_app_web", "type": "dist_app_web", "image": "agreatfool/dist_app_web:0.0.1"},
            {"name": "filebeat_web", "type": "filebeat", "image": "elastic/filebeat:7.0.0"},
            {"name": "jagent_web", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0"},
        ]
    },
    {
        "name": "service",
        "ip": process.env.HOST_IP_SERVICE,
        "services": [
            {"name": "node_service", "type": "node_exporter", "image": "prom/node-exporter:0.18.1"},
            {"name": "cadvisor_service", "type": "cadvisor", "image": "google/cadvisor:v0.33.0"},
            {"name": "dist_app_service", "type": "dist_app_service", "image": "agreatfool/dist_app_service:0.0.1"},
            {"name": "dist_app_consumer", "type": "dist_app_consumer", "image": "agreatfool/dist_app_consumer:0.0.1"},
            {"name": "filebeat_service", "type": "filebeat", "image": "elastic/filebeat:7.0.0"},
            {"name": "jagent_service", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0"},
        ]
    },
];

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* STRUCTURE
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
interface Machine {
    name: string;
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
    .option('-d, --deploy', 'execute deploy command')
    .option('-c, --capture', 'capture stress test data')
    .option('-s, --stress', 'stress test')
    .parse(process.argv);

const ARGS_DEPLOY = (program as any).deploy === undefined ? undefined : true;
const ARGS_CAPTURE = (program as any).capture === undefined ? undefined : true;
const ARGS_STRESS = (program as any).stress === undefined ? undefined : true;

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* IMPLEMENTATION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class DistClusterTool {

    public async run() {
        console.log('[Cluster Tool] run ...');

        if (ARGS_DEPLOY) {
            await this.deploy();
        } else if (ARGS_CAPTURE) {
            await this.capture();
        } else if (ARGS_STRESS) {
            await this.stress();
        } else {
            console.log('[Cluster Tool] Invalid option: Action option required');
            process.exit(1);
        }
    }

    private async deploy() {
        console.log('[Cluster Tool] deploy ...');
        await (new DistClusterToolDeploy()).run();
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

class DistClusterToolDeploy {

    public async run() {
        await this.initMachines();
        await this.prepareImages();
    }

    private async initMachines() {
        let tasks = [];

        MACHINES.forEach((machine: Machine) => {
            tasks.push(Tools.execAsync(
                'docker-machine create -d generic' +
                    ` --generic-ip-address=${machine.ip}` +
                    ' --generic-ssh-port 22' +
                    ' --generic-ssh-key ~/.ssh/id_rsa' +
                    ' --generic-ssh-user root' +
                    ` ${machine.name}`,
                `machines/${machine.name}`
            ));
        });

        await Promise.all(tasks).catch((err) => {
            console.log(`Error in "initMachines": ${err.toString()}`)
        });
        await Tools.execAsync('docker-machine ls', 'machines/list.txt');
    }

    private async prepareImages() {
        let tasks = [];

        MACHINES.forEach((machine: Machine) => {
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

            // execution
            tasks.push(Tools.execAsync(
                `docker-machine ssh \"${pullCommands.join(' && ')}\"`,
                `images/${machine.name}`
            ));
        });

        await Promise.all(tasks).catch((err) => {
            console.log(`Error in "prepareImages": ${err.toString()}`)
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
    public static getMachineNames() {
        return MACHINES.map((machine: Machine) => {
            return machine.name;
        });
    }

    public static getBaseDir() {
        return LibPath.join(__dirname, '..');
    }

    public static execSync(command: string, output: string, options?: shell.ExecOptions): number {
        if (!options) {
            options = {};
        }

        const result = shell.exec(command, options) as shell.ExecOutputReturnValue;

        if (result.stdout) {
            console.log(result.stdout);
        }
        if (result.stderr) {
            console.log(result.stderr)
        }

        return result.code;
    }

    public static async execAsync(command: string, output: string, options?: shell.ExecOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!options) {
                options = {};
            }

            const targetOutput = LibPath.join(Tools.getBaseDir(), 'output', output + '.txt');
            mkdir.sync(LibPath.dirname(targetOutput)); // ensure dir
            LibFs.writeFileSync(targetOutput, ''); // ensure file & empty file

            const outputStream = LibFs.createWriteStream(targetOutput);

            const child = shell.exec(command, Object.assign(options, {async: true})) as LibCp.ChildProcess;

            child.stdout.pipe(outputStream);
            child.stderr.pipe(outputStream);

            child.on('close', () => resolve());
            child.on('error', (err) => reject(err));
        });
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