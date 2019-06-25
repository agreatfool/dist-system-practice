import * as LibFs from 'mz/fs';
import * as LibPath from 'path';

import * as program from 'commander';
import * as shell from 'shelljs';

const pkg = require('../package.json');

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
const MACHINES: Machines = [
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
interface Machines {
    [index: number]: Machine;
}

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
    .description('image-merge-dir: merge images provided into one or several ones')
    .option('-d, --source_dir <string>', 'source image files dir')
    .parse(process.argv);

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* IMPLEMENTATION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
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