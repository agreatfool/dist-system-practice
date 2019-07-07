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
const ssh2 = require("ssh2");
const pkg = require('../package.json');
const mkdirp = LibUtil.promisify(mkdir);
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* CONSTANTS
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
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
            { "name": "node_storage", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_storage", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "mysqld", "type": "mysqld", "image": "mysql:5.7.26" },
            { "name": "mysqld_exporter", "type": "mysqld_exporter", "image": "prom/mysqld-exporter:v0.11.0" },
            { "name": "memcached", "type": "memcached", "image": "memcached:1.5.14-alpine" },
            { "name": "memcached_exporter", "type": "memcached_exporter", "image": "prom/memcached-exporter:v0.5.0" }
        ],
    },
    {
        "name": "kafka1",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_1,
        "services": [
            { "name": "node_kafka_1", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_kafka_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "zookeeper", "type": "zookeeper", "image": "wurstmeister/zookeeper:latest" },
            { "name": "kafka_1", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_2", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
        ],
    },
    {
        "name": "kafka2",
        "type": "kafka",
        "ip": process.env.HOST_IP_KAFKA_2,
        "services": [
            { "name": "node_kafka_2", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_kafka_2", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "kafka_3", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_4", "type": "kafka", "image": "wurstmeister/kafka:2.12-2.2.0" },
            { "name": "kafka_exporter", "type": "kafka_exporter", "image": "danielqsj/kafka-exporter:v1.2.0" },
        ],
    },
    {
        "name": "es1",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_1,
        "services": [
            { "name": "node_es_1", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_es_1", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "es_1", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
            { "name": "es_2", "type": "elasticsearch", "image": "elasticsearch:7.0.0" },
        ],
    },
    {
        "name": "es2",
        "type": "elasticsearch",
        "ip": process.env.HOST_IP_ES_2,
        "services": [
            { "name": "node_es_2", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
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
            { "name": "node_monitor", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
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
        "name": "service",
        "type": "service",
        "ip": process.env.HOST_IP_SERVICE,
        "services": [
            { "name": "node_service", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_service", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "jagent_service", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0" },
            { "name": "app_service", "type": "app_service", "image": "agreatfool/dist_app_service:0.0.2" },
            { "name": "app_consumer", "type": "app_consumer", "image": "agreatfool/dist_app_consumer:0.0.2" },
            { "name": "filebeat_service", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
            { "name": "fb_exporter_service", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2" },
        ]
    },
    {
        "name": "web",
        "type": "web",
        "ip": process.env.HOST_IP_WEB,
        "services": [
            { "name": "node_web", "type": "node_exporter", "image": "prom/node-exporter:v0.18.1" },
            { "name": "cadvisor_web", "type": "cadvisor", "image": "google/cadvisor:v0.33.0" },
            { "name": "jagent_web", "type": "jaeger_agent", "image": "jaegertracing/jaeger-agent:1.11.0" },
            { "name": "app_web", "type": "app_web", "image": "agreatfool/dist_app_web:0.0.2" },
            { "name": "filebeat_web", "type": "filebeat", "image": "elastic/filebeat:7.0.0" },
            { "name": "fb_exporter_web", "type": "filebeat_exporter", "image": "agreatfool/beat-exporter:v0.1.2" },
        ]
    },
];
const REPORT_CONFIG = [
    {
        "type": "node_exporter",
        "uid": "9CWBz0bik",
        "node": "nodes",
        "params": {
            "var-interval": "5s",
            "var-env": "All",
            "var-name": "All",
            "var-node": "Function",
            "var-maxmount": "",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 15, "display": "系统运行时间", "file": "system_up_time" },
            { "id": 14, "display": "CPU 核数", "file": "cpu_core_count" },
            { "id": 75, "display": "内存总量", "file": "memory_total" },
            { "id": 167, "display": "CPU使用率（5m）", "file": "cpu_usage_5m" },
            { "id": 20, "display": "CPU iowait（5m）", "file": "cpu_iowait_5m" },
            { "id": 172, "display": "内存使用率", "file": "memory_usage" },
            { "id": 16, "display": "当前打开的文件描述符", "file": "open_files" },
            { "id": 166, "display": "根分区使用率", "file": "disk_usage" },
            { "id": 13, "display": "系统平均负载", "file": "load_average" },
            { "id": 171, "display": "磁盘总空间", "file": "disk_total" },
            { "id": 164, "display": "各分区可用空间", "file": "disk_usage_total" },
            { "id": 7, "display": "CPU使用率、磁盘每秒的I/O操作耗费时间（%）", "file": "disk_cpu_time" },
            { "id": 156, "display": "内存信息", "file": "memory_info" },
            { "id": 161, "display": "磁盘读写速率（IOPS）", "file": "disk_iops" },
            { "id": 168, "display": "磁盘读写容量大小", "file": "disk_io_amount" },
            { "id": 160, "display": "磁盘IO读写时间", "file": "disk_io_time" },
            { "id": 157, "display": "网络流量", "file": "network_traffic" },
            { "id": 158, "display": "TCP 连接情况", "file": "tcp_count" },
        ],
    },
    {
        "type": "cadvisor",
        "uid": "PV1XyHnWz",
        "node": "docker-and-system-monitoring",
        "params": {
            "refresh": "30s",
            "var-containergroup": "All",
            "var-interval": "30s",
            "var-server": "Function",
            "var-name": "All",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 8, "display": "Received Network Traffic per Container", "file": "received_network_traffic" },
            { "id": 9, "display": "Sent Network Traffic per Container", "file": "sent_network_traffic" },
            { "id": 1, "display": "CPU Usage per Container", "file": "cpu_usage" },
            { "id": 10, "display": "Memory Usage per Container", "file": "memory_usage" },
            { "id": 34, "display": "Memory Swap per Container", "file": "memory_swap" },
        ]
    },
    {
        "type": "memcached",
        "uid": "NgzwcO7Zz",
        "node": "prometheus-memcached",
        "params": {
            "var-node": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 1, "display": "% Hit ratio", "file": "hit_ratio" },
            { "id": 4, "display": "Connections", "file": "connections" },
            { "id": 3, "display": "Get / Set ratio", "file": "get_set_ratio" },
            { "id": 2, "display": "Commands", "file": "commands" },
            { "id": 8, "display": "evicts / reclaims", "file": "evicts_reclaims" },
            { "id": 6, "display": "Read / written bytes", "file": "read_written_bytes" },
            { "id": 7, "display": "Total memory usage", "file": "memory_usage" },
            { "id": 5, "display": "Items in cache", "file": "items_count" },
        ]
    },
    {
        "type": "mysqld",
        "uid": "MQWgroiiz",
        "node": "mysql-overview",
        "params": {
            "var-interval": "1m",
            "var-host": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 92, "display": "MySQL Connections", "file": "connections" },
            { "id": 47, "display": "MySQL Aborted Connections", "file": "aborted_connections" },
            { "id": 10, "display": "MySQL Client Thread Activity", "file": "client_thread_activity" },
            { "id": 11, "display": "MySQL Thread Cache", "file": "thread_cache" },
            { "id": 53, "display": "MySQL Questions", "file": "questions" },
            { "id": 48, "display": "MySQL Slow Queries", "file": "slow_queries" },
            { "id": 32, "display": "MySQL Table Locks", "file": "table_locks" },
            { "id": 9, "display": "MySQL Network Traffic", "file": "network_traffic" },
            { "id": 381, "display": "MySQL Network Usage Hourly", "file": "network_usage_hourly" },
            { "id": 50, "display": "MySQL Internal Memory Overview", "file": "internal_memory" },
            { "id": 14, "display": "Top Command Counters", "file": "command_counters" },
            { "id": 39, "display": "Top Command Counters Hourly", "file": "command_counters_hourly" },
            { "id": 46, "display": "MySQL Query Cache Memory", "file": "query_cache_memory" },
            { "id": 45, "display": "MySQL Query Cache Activity", "file": "query_cache_activity" },
            { "id": 43, "display": "MySQL File Openings", "file": "file_openings" },
            { "id": 41, "display": "MySQL Open Files", "file": "open_files" },
        ]
    },
    {
        "type": "prometheus",
        "uid": "54e7hO7Wk",
        "node": "prometheus-2-0-overview",
        "params": {
            "var-job": "prometheus",
            "var-instance": "prometheus",
            "var-interval": "1h",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 3, "display": "Series Count", "file": "series_count" },
            { "id": 33, "display": "Failures and Errors", "file": "errors" },
            { "id": 4, "display": "Appended Samples per Second", "file": "appended_samples" },
            { "id": 29, "display": "Scrape Duration", "file": "scrape_duration" },
            { "id": 15, "display": "Prometheus Engine Query Duration Seconds", "file": "query_duration" },
        ]
    },
    {
        "type": "kafka",
        "uid": "chanjarster-jvm-dashboard",
        "node": "kafka-jmx-dashboard",
        "params": {
            "var-datasource": "Prometheus",
            "var-job": "kafka",
            "var-instance": "Function",
            "var-mempool": "All",
            "var-memarea": "All",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 38, "display": "Open file descriptors", "file": "open_file_descriptors" },
            { "id": 29, "display": "CPU load", "file": "cpu_load" },
            { "id": 8, "display": "Memory area [heap]", "file": "memory_area_heap" },
            { "id": 45, "display": "Memory area [nonheap]", "file": "memory_area_nonheap" },
            { "id": 6, "display": "GC count increase", "file": "gc_count_increase" },
            { "id": 5, "display": "GC time", "file": "gc_time" },
            { "id": 3, "display": "Threads used", "file": "threads_used" },
            { "id": 44, "display": "Physical memory", "file": "physical_memory" },
        ]
    },
    {
        "type": "kafka_exporter",
        "uid": "jwPKIsniz",
        "node": "kafka-exporter-overview",
        "params": {
            "var-job": "kafka-exporter",
            "var-instance": "Function",
            "var-topic": "All",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 14, "display": "Message in per second", "file": "message_in_sec" },
            { "id": 12, "display": "Lag by Consumer Group", "file": "lag_consumer_group" },
            { "id": 16, "display": "Message in per minute", "file": "message_in_min" },
            { "id": 18, "display": "Message consume per minute", "file": "consume_count_min" },
        ]
    },
    {
        "type": "jaeger_agent",
        "uid": "Z8ieXpnWk",
        "node": "jaeger-agent",
        "params": {
            "var-node": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 6, "display": "Reporter batches submitted", "file": "batches_submitted" },
            { "id": 8, "display": "Reporter batches failures", "file": "batches_failures" },
            { "id": 10, "display": "Reporter spans submitted", "file": "spans_submitted" },
            { "id": 12, "display": "Reporter spans failures", "file": "spans_failures" },
            { "id": 24, "display": "Queue size", "file": "queue_size" },
            { "id": 26, "display": "Read errors", "file": "read_errors" },
            { "id": 20, "display": "Packets processed", "file": "packets_processed" },
            { "id": 22, "display": "Packets dropped", "file": "packets_dropped" },
        ]
    },
    {
        "type": "jaeger_collector",
        "uid": "Z8ieXpnWk",
        "node": "jaeger-collector",
        "params": {
            "var-node": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 20, "display": "Traces received", "file": "traces_received" },
            { "id": 22, "display": "Traces rejected", "file": "traces_rejected" },
            { "id": 18, "display": "Spans received", "file": "spans_received" },
            { "id": 4, "display": "Spans dropped", "file": "spans_dropped" },
            { "id": 24, "display": "Spans rejected", "file": "spans_rejected" },
            { "id": 2, "display": "Queue length", "file": "queue_length" },
            { "id": 10, "display": "Span queue latency", "file": "span_queue_latency" },
            { "id": 26, "display": "Save latency", "file": "save_latency" },
            { "id": 16, "display": "Cassandra attempts", "file": "cassandra_attempts" },
            { "id": 12, "display": "Cassandra errors", "file": "cassandra_errors" },
        ]
    },
    {
        "type": "filebeat",
        "uid": "oF_Qr14Zz",
        "node": "filebeat",
        "params": {
            "var-node": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 2, "display": "Harvester", "file": "harvester" },
            { "id": 8, "display": "IO errors", "file": "io_errors" },
            { "id": 4, "display": "Filebeat events", "file": "filebeat_events" },
            { "id": 6, "display": "Output events", "file": "output_events" },
            { "id": 10, "display": "Pipeline events", "file": "pipeline_events" },
            { "id": 12, "display": "Pipeline queue", "file": "pipeline_queue" },
        ]
    },
    {
        "type": "elasticsearch",
        "uid": "FNysokSWk",
        "node": "elasticsearch",
        "params": {
            "var-interval": "5m",
            "var-cluster": "es_cluster",
            "var-name": "Function",
            "var-instance": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 16, "display": "Pending tasks", "file": "pending_tasks" },
            { "id": 30, "display": "Load average", "file": "load_average" },
            { "id": 88, "display": "CPU usage", "file": "cpu usage" },
            { "id": 31, "display": "JVM memory usage", "file": "jvm_memory_usage" },
            { "id": 7, "display": "GC count", "file": "gc_count" },
            { "id": 27, "display": "GC time", "file": "gc_time" },
            { "id": 77, "display": "Total translog operations", "file": "total_translog_operations" },
            { "id": 78, "display": "Total translog size in bytes", "file": "total_translog_size_in_bytes" },
            { "id": 79, "display": "Tripped for breakers", "file": "tripped_for_breakers" },
            { "id": 80, "display": "Estimated size in bytes of breaker", "file": "estimated_size_in_bytes_of_breaker" },
            { "id": 32, "display": "Disk usage", "file": "disk_usage" },
            { "id": 47, "display": "Network usage", "file": "network_usage" },
            { "id": 1, "display": "Documents count on node", "file": "documents_count_on_node" },
            { "id": 24, "display": "Documents indexed rate", "file": "documents_indexed_rate" },
            { "id": 26, "display": "Documents merged rate", "file": "documents_merged_rate" },
            { "id": 52, "display": "Documents merged bytes", "file": "documents_merged_bytes" },
            { "id": 33, "display": "Query time", "file": "query_time" },
            { "id": 5, "display": "Indexing time", "file": "indexing_time" },
            { "id": 3, "display": "Merging time", "file": "merging_time" },
            { "id": 48, "display": "Total Operations rate", "file": "total_Operations_rate" },
            { "id": 49, "display": "Total Operations time", "file": "total_Operations_time" },
        ]
    },
    {
        "type": "go_app",
        "uid": "ypFZFgvmz",
        "node": "go-processes",
        "params": {
            "var-job": "go-apps",
            "var-interval": "1m",
            "var-node": "Function",
            "width": "1000",
            "height": "500",
            "tz": "Asia/Shanghai",
        },
        "panels": [
            { "id": 1, "display": "Heap memory", "file": "heap_memory" },
            { "id": 4, "display": "Heap memory trends", "file": "heap_memory_trends" },
            { "id": 2, "display": "Heap objects", "file": "heap_objects" },
            { "id": 5, "display": "Heap system alloc", "file": "heap_system_alloc" },
            { "id": 3, "display": "GC rate", "file": "gc_rate" },
            { "id": 6, "display": "Next gc target", "file": "next_gc_target" },
            { "id": 8, "display": "GC duration quantiles", "file": "gc_duration" },
            { "id": 7, "display": "Goroutines count", "file": "goroutines_count" },
            { "id": 10, "display": "Threads count", "file": "threads_count" },
        ]
    }
];
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
    .option('--report', 'capture stress test data and file report')
    .option('--stress', 'stress test')
    .option('--docker-ps', 'docker ps -a, remotely')
    .option('--machine-type <string>', '--sub param, specify target machine type of action, using "all" to specify all machines')
    .option('--exclude-service-types <types>', '--sub param, specify exclude service types of action, e.g node_exporter,cadvisor,...', (types) => {
    return types.split(',');
})
    .parse(process.argv);
const ARGS_ACTION_MACHINE = program.machine === undefined ? undefined : true;
const ARGS_ACTION_HARDWARE = program.hardware === undefined ? undefined : true;
const ARGS_ACTION_IMAGE = program.image === undefined ? undefined : true;
const ARGS_ACTION_DEPLOY = program.deploy === undefined ? undefined : true;
const ARGS_ACTION_STOP = program.stop === undefined ? undefined : true;
const ARGS_ACTION_START = program.start === undefined ? undefined : true;
const ARGS_ACTION_CLEANUP = program.cleanup === undefined ? undefined : true;
const ARGS_ACTION_REPORT = program.report === undefined ? undefined : true;
const ARGS_ACTION_STRESS = program.stress === undefined ? undefined : true;
const ARGS_ACTION_DOCKER_PS = program.dockerPs === undefined ? undefined : true;
const ARGS_MACHINE_TYPE = program.machineType === undefined ? undefined : program.machineType;
const ARGS_EXCLUDE_SERVICE_TYPES = program.excludeServiceTypes === undefined ? [] : program.excludeServiceTypes;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
//-* IMPLEMENTATION
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
class DistClusterTool {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] run ...');
            // validate "--machine-type"
            if (!ARGS_MACHINE_TYPE) {
                console.log('[Cluster Tool] Machine type have to be specified: --machine-type');
                process.exit(1);
            }
            const machineFiltered = MACHINES.filter((machine) => {
                if (machine.type === ARGS_MACHINE_TYPE) {
                    return true;
                }
            });
            if (ARGS_MACHINE_TYPE !== 'all' && machineFiltered.length === 0) {
                console.log(`[Cluster Tool] Invalid machine type: ${ARGS_MACHINE_TYPE}`);
                process.exit(1);
            }
            // validate "--exclude-service-types"
            ARGS_EXCLUDE_SERVICE_TYPES.forEach((type) => {
                let found = false;
                MACHINES.forEach((machine) => {
                    machine.services.forEach((service) => {
                        if (service.type === type) {
                            found = true;
                        }
                    });
                });
                if (!found) {
                    console.log(`[Cluster Tool] Invalid exclude service type: ${type}`);
                    process.exit(1);
                }
            });
            if (ARGS_ACTION_MACHINE) {
                yield this.machine();
            }
            else if (ARGS_ACTION_HARDWARE) {
                yield this.hardware();
            }
            else if (ARGS_ACTION_IMAGE) {
                yield this.image();
            }
            else if (ARGS_ACTION_DEPLOY) {
                yield this.deploy();
            }
            else if (ARGS_ACTION_STOP) {
                yield this.stop();
            }
            else if (ARGS_ACTION_START) {
                yield this.start();
            }
            else if (ARGS_ACTION_CLEANUP) {
                yield this.cleanup();
            }
            else if (ARGS_ACTION_REPORT) {
                yield this.report();
            }
            else if (ARGS_ACTION_STRESS) {
                yield this.stress();
            }
            else if (ARGS_ACTION_DOCKER_PS) {
                yield this.dockerPs();
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
    image() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] image ...');
            yield (new DistClusterToolImage()).run();
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
    report() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] report ...');
            yield (new DistClusterToolReport()).run();
        });
    }
    stress() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] stress ...');
            yield (new DistClusterToolStress()).run();
        });
    }
    dockerPs() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Cluster Tool] dockerPs ...');
            yield (new DistClusterToolDockerPs()).run();
        });
    }
}
class DistClusterToolMachine {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                yield Tools.execAsync('docker-machine create -d generic' +
                    ` --generic-ip-address=${machine.ip}` +
                    ' --generic-ssh-port 22' +
                    ' --generic-ssh-key ~/.ssh/id_rsa' +
                    ' --generic-ssh-user root' +
                    ` ${machine.name}`, `machines/${machine.name}`);
            }
            yield Tools.execAsync('docker-machine ls', 'machines/list');
        });
    }
}
class DistClusterToolHardware {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let tasks = [];
            MACHINES.forEach((machine) => {
                tasks.push(new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    yield Tools.execSSH(machine.ip, 'wget -qO- bench.sh | bash', `hardwares/${machine.name}/bench`);
                    yield Tools.execSSH(machine.ip, '(curl -s wget.racing/nench.sh | bash) 2>&1 | tee nench.log', `hardwares/${machine.name}/nench`);
                    resolve();
                })));
            });
            yield Promise.all(tasks).catch((err) => {
                console.log(`Error in "testHardwares": ${err.toString()}`);
            });
        });
    }
}
class DistClusterToolImage {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.prepareImages();
            yield this.prepareMysqlData();
            yield this.prepareKafkaData();
            yield this.prepareElasticserachData();
            yield this.preparePrometheusData();
            yield this.prepareGrafanaData();
            yield this.prepareFilebeatData();
            yield this.prepareAppData();
        });
    }
    prepareImages() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                // collect image names
                let images = [];
                machine.services.forEach((service) => {
                    if (images.indexOf(service.image) !== -1) {
                        return;
                    }
                    images.push(service.image);
                });
                // generate pull image commands
                let commands = [];
                images.forEach((image) => {
                    commands.push(`docker pull ${image}`);
                });
                // do nothing with 0 pull commands
                if (commands.length == 0) {
                    return;
                }
                // display command
                commands.push('docker images');
                // setup env
                commands.push('sudo sysctl -w vm.max_map_count=262144');
                // execution
                yield Tools.execSSH(machine.ip, commands.join(' && '), `images/${machine.name}`);
            }
        });
    }
    prepareMysqlData() {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield Tools.execAsync([
                `scp -r ${Tools.getProjectDir()}/schema root@${machine.ip}:/tmp/`,
                `scp ${insertSqlPath} root@${machine.ip}:/tmp/`,
            ].join(' && '));
        });
    }
    prepareKafkaData() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of Tools.getMachinesByType('kafka')) {
                yield Tools.execAsync([
                    `scp ${Tools.getProjectDir()}/vendors/kafka/jmx_prometheus_javaagent-0.9.jar root@${machine.ip}:/tmp/`,
                    `scp ${Tools.getProjectDir()}/vendors/kafka/jmx-kafka-2_0_0.yaml root@${machine.ip}:/tmp/`,
                ].join(' && '));
            }
        });
    }
    prepareElasticserachData() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of Tools.getMachinesByType('elasticsearch')) {
                yield Tools.execAsync(`scp ${Tools.getConfDir()}/elasticsearch/elasticsearch.yaml root@${machine.ip}:/tmp/`);
            }
        });
    }
    preparePrometheusData() {
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
            const machine = Tools.getMachinesByType('monitor')[0];
            yield Tools.execAsync(`scp ${replacedConfPath} root@${machine.ip}:/tmp/`);
        });
    }
    prepareGrafanaData() {
        return __awaiter(this, void 0, void 0, function* () {
            const machine = Tools.getMachinesByType('monitor')[0];
            yield Tools.execAsync([
                `scp ${Tools.getConfDir()}/grafana/grafana.ini root@${machine.ip}:/tmp/`,
                `scp -r ${Tools.getProjectDir()}/vendors/prometheus/grafana/provisioning root@${machine.ip}:/tmp/`,
                `scp -r ${Tools.getProjectDir()}/vendors/prometheus/grafana/dashboards root@${machine.ip}:/tmp/`,
            ].join(' && '));
        });
    }
    prepareFilebeatData() {
        return __awaiter(this, void 0, void 0, function* () {
            const machines = [];
            machines.push(Tools.getMachinesByType('web')[0]);
            machines.push(Tools.getMachinesByType('service')[0]);
            for (let machine of machines) {
                yield Tools.execAsync(`scp ${Tools.getConfDir()}/elasticsearch/filebeat.yaml root@${machine.ip}:/tmp/`);
            }
        });
    }
    prepareAppData() {
        return __awaiter(this, void 0, void 0, function* () {
            const machines = [];
            machines.push(Tools.getMachinesByType('web')[0]);
            machines.push(Tools.getMachinesByType('service')[0]);
            for (let machine of machines) {
                yield Tools.execAsync(`scp ${Tools.getConfDir()}/app/logger.yaml root@${machine.ip}:/tmp/`);
            }
        });
    }
}
class DistClusterToolDeploy {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.deployMachines();
        });
    }
    deployMachines() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                if (ARGS_MACHINE_TYPE !== 'all' && machine.type !== ARGS_MACHINE_TYPE) {
                    continue;
                }
                yield this.deployMachine(machine);
            }
        });
    }
    deployMachine(machine) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let service of machine.services) {
                if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                    continue;
                }
                if (ARGS_EXCLUDE_SERVICE_TYPES.indexOf(service.type) !== -1) {
                    continue;
                }
                yield this[`deployService${camel(service.type, { pascalCase: true })}`].apply(this, [machine, service]);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceNodeExporter(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const prepareCommand = 'killall node_exporter;' +
                ' rm -rf ./node_exporter*;' +
                ' wget https://github.com/prometheus/node_exporter/releases/download/v0.18.1/node_exporter-0.18.1.linux-amd64.tar.gz;' +
                ' mkdir -p ./node_exporter;' +
                ' tar xvfz node_exporter-0.18.1.linux-amd64.tar.gz -C ./node_exporter --strip-components=1';
            yield Tools.execSSH(machine.ip, prepareCommand, `services/${machine.name}/${service.name}`);
            yield Tools.execSSH(machine.ip, 'nohup ./node_exporter/node_exporter &> /tmp/node_exporter.log&');
            yield Tools.execSSH(machine.ip, 'ps aux|grep node_exporter', `services/${machine.name}/${service.name}_ps`);
            yield Tools.execSSH(machine.ip, 'cat /tmp/node_exporter.log', `services/${machine.name}/${service.name}_cat`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceCadvisor(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield Tools.execSSH(machine.ip, `docker network rm ${machine.name}`);
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceMysqld(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            // tool
            function waitMysqldInitialized() {
                return new Promise((resolve, reject) => {
                    const msgDone = "Version: '5.7.26'  socket: '/var/run/mysqld/mysqld.sock'  port: 3306  MySQL Community Server (GPL)";
                    const child = shell.exec(`docker-machine ssh ${machine.name} "docker logs -f ${service.name}"`, { async: true, timeout: 30000 });
                    function detectEnd(chunk) {
                        const msg = chunk.toString();
                        if (msg.indexOf(msgDone) != -1) {
                            child.kill();
                            resolve();
                        }
                        else {
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ` -p ${portMetrics}:7071` +
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                yield Tools.execAsync(topicCommand, `services/${machine.name}/kafka_topic`);
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
            Tools.getKafkaBrokersAddresses().forEach((address) => {
                initCommand += ` --kafka.server=${address}`;
            });
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                });
            });
            let initialMasterNodes = [];
            services.forEach((svc) => {
                initialMasterNodes.push(svc.name);
            });
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
                ` -v /tmp/elasticsearch.yaml:/usr/share/elasticsearch/config/elasticsearch.yml` +
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                        let response = yield fetch(`http://${Tools.getEsClusterEntrance()}/_cluster/health?wait_for_status=green&timeout=60s`, { signal: controller.signal });
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
                    ` -PUT "${Tools.getEsClusterEntrance()}/_template/dist?pretty"` +
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
                ` --es.uri=http://${Tools.getEsClusterEntrance()}` +
                ' --es.all' +
                ' --es.cluster_settings' +
                ' --es.shards' +
                ' --es.indices' +
                ' --es.indices_settings' +
                ' --es.snapshots' +
                ' --log.level=info' +
                ' --log.format=json' +
                ' --log.output=stdout';
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceCassandra(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
            // wait seconds for cassandra initialized
            console.log('Wait 30s, then create cassandra schema');
            yield new Promise((resolve) => {
                setTimeout(() => resolve(), 30000); // 30s
            });
            const sqlCommand = 'docker run --rm --name jaeger-cassandra-schema' +
                ` --network ${machine.name}` +
                ' -e MODE=test' +
                ` -e CQLSH_HOST=${Tools.getCassandraClusterEntrance()}` +
                ' -e DATACENTER=jaeger_dc' +
                ' -e KEYSPACE=jaeger_keyspace' +
                ` ${Tools.getServicesByType('cassandra_init')[0].image}`;
            yield Tools.execSSH(machine.ip, sqlCommand, `services/${machine.name}/cassandra_init`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceJaegerCollector(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // jcollector_1 => [jcollector, 1] => 1
            const portGrpc = 14250 + (id - 1); // 14250、14251、14252、...
            const portHttp = 14268 + (id - 1); // 14268、14269、14270、...
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ` -p ${portGrpc}:14250` + // grpc
                ` -p ${portHttp}:14268` + // http (prometheus)
                ' -e SPAN_STORAGE_TYPE=cassandra' +
                ` ${service.image}` +
                ` --collector.grpc-port=14250` +
                ` --collector.http-port=14268` +
                ` --cassandra.servers=${Tools.getCassandraClusterEntrance()}` +
                ' --cassandra.keyspace=jaeger_keyspace' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ` --cassandra.servers=${Tools.getCassandraClusterEntrance()}` +
                ' --cassandra.keyspace=jaeger_keyspace' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServicePrometheus(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ` -e ELASTICSEARCH_HOSTS="[\\"http://${Tools.getEsClusterEntrance()}\\"]"` +
                ' -e KIBANA_INDEX=.kibana' +
                ' -e DIBANA_DEFAULTAPPID=home' +
                ' -e ELASTICSEARCH_PINGTIMEOUT=1500' +
                ' -e ELASTICSEARCH_REQUESTTIMEOUT=10000' +
                ' -e ELASTICSEARCH_LOGQUERIES=false' +
                ` ${service.image}`;
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ` --reporter.grpc.host-port=${Tools.getJaegerCollectorsAddresses().join(',')}` +
                ' --reporter.type=grpc' +
                ' --processor.jaeger-binary.server-host-port=0.0.0.0:6832' +
                ' --processor.jaeger-compact.server-host-port=0.0.0.0:6831' +
                ' --http-server.host-port=0.0.0.0:5778' +
                ' --metrics-backend=prometheus' +
                ' --metrics-http-route=/metrics' +
                ' --log-level=info';
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceFilebeat(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 5066:5066' +
                ` -v /tmp/filebeat.yaml:/usr/share/filebeat/filebeat.yml` +
                ' -v /tmp/logs/app:/tmp/logs/app' +
                ` -e ES_HOSTS=${Tools.getEsClusterNodes().join(',')}` +
                ' -e LOGGING_LEVEL=info' +
                ' -e NUM_OF_OUTPUT_WORKERS=12' +
                ` -e NUM_OF_SHARDS=6` +
                ` -e NUM_OF_REPLICAS=1` +
                ` ${service.image}`;
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
    //noinspection JSUnusedLocalSymbols
    deployServiceAppWeb(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            let initCommand = `docker run -d --name ${service.name}` +
                ' --log-driver json-file --log-opt max-size=1G' +
                ` --network ${machine.name}` +
                ' -p 8000:8000' +
                ` -v /tmp/logger.yaml:/app/logger.yaml` +
                ' -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.web"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ' -e WEB_HOST="0.0.0.0"' +
                ' -e WEB_PORT="8000"' +
                ` -e MAX_WORK_ID="${process.env.MAX_WORK_ID}"` +
                ` -e RPC_SERVERS="[\\"${Tools.getMachinesByType('service')[0].ip}:16241\\"]"` +
                ' -e JAEGER_SERVICE_NAME="app.web"' +
                ` -e JAEGER_AGENT_HOST="jagent_web"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ' -p 16241:16241' +
                ` -v /tmp/logger.yaml:/app/logger.yaml` +
                ' -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.service"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ` -e CACHE_SERVERS="[\\"${storageIp}:11211\\"]"` +
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
                ' -e SERVICE_PORT="16241"' +
                ' -e WEB_HOST="0.0.0.0"' +
                ' -e WEB_PORT="8001"' +
                ` -e KAFKA_BROKERS="[\\"${Tools.getKafkaBrokersAddresses().join('\\",\\"')}\\"]"` +
                ' -e KAFKA_WRITE_ASYNC="false"' +
                ' -e JAEGER_SERVICE_NAME="app.service"' +
                ` -e JAEGER_AGENT_HOST="jagent_service"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
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
                ` -v /tmp/logger.yaml:/app/logger.yaml` +
                ' -v /tmp/logs:/app/logs' +
                ' -e APP_NAME="app.consumer"' +
                ' -e LOGGER_CONF_PATH="/app/logger.yaml"' +
                ` -e CACHE_SERVERS="[\\"${storageIp}:11211\\"]"` +
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
                ` -e KAFKA_BROKERS="[\\"${Tools.getKafkaBrokersAddresses().join('\\",\\"')}\\"]"` +
                ' -e JAEGER_SERVICE_NAME="app.consumer"' +
                ` -e JAEGER_AGENT_HOST="jagent_service"` +
                ' -e JAEGER_AGENT_PORT="6831"' +
                ' -e JAEGER_REPORTER_LOG_SPANS="true"' +
                ' -e JAEGER_REPORTER_FLUSH_INTERVAL="1s"' +
                ' -e JAEGER_SAMPLER_TYPE="probabilistic"' +
                ' -e JAEGER_SAMPLER_PARAM="0.01"' + // 1%
                ` ${service.image}`;
            yield Tools.execSSH(machine.ip, initCommand, `services/${machine.name}/${service.name}`);
        });
    }
}
class DistClusterToolStop {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                if (ARGS_MACHINE_TYPE !== 'all' && machine.type !== ARGS_MACHINE_TYPE) {
                    continue;
                }
                const commands = [];
                for (let service of machine.services) {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        continue;
                    }
                    if (ARGS_EXCLUDE_SERVICE_TYPES.indexOf(service.type) !== -1) {
                        continue;
                    }
                    commands.push(`docker stop ${service.name}`);
                }
                yield Tools.execSSH(machine.ip, commands.join('; '));
            }
        });
    }
}
class DistClusterToolStart {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                if (ARGS_MACHINE_TYPE !== 'all' && machine.type !== ARGS_MACHINE_TYPE) {
                    continue;
                }
                const commands = [];
                for (let service of machine.services) {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        continue;
                    }
                    if (ARGS_EXCLUDE_SERVICE_TYPES.indexOf(service.type) !== -1) {
                        continue;
                    }
                    commands.push(`docker start ${service.name}`);
                }
                yield Tools.execSSH(machine.ip, commands.join('; '));
            }
        });
    }
}
class DistClusterToolCleanup {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                if (ARGS_MACHINE_TYPE !== 'all' && machine.type !== ARGS_MACHINE_TYPE) {
                    continue;
                }
                const commands = [];
                for (let service of machine.services) {
                    if (service.type === 'vegeta' || service.type === 'cassandra_init') {
                        continue;
                    }
                    if (ARGS_EXCLUDE_SERVICE_TYPES.indexOf(service.type) !== -1) {
                        continue;
                    }
                    commands.push(`docker stop ${service.name}`);
                    commands.push(`docker rm ${service.name}`);
                }
                commands.push('docker volume rm $(docker volume ls -f "dangling=true" -q)');
                commands.push(`docker network rm ${machine.name}`);
                yield Tools.execSSH(machine.ip, commands.join('; '));
            }
        });
    }
}
class DistClusterToolReport {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.captureData();
            yield this.fileReport();
        });
    }
    captureData() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                yield this.captureMachine(machine);
            }
        });
    }
    captureMachine(machine) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let service of machine.services) {
                yield this.captureService(machine, service);
            }
        });
    }
    captureService(machine, service) {
        return __awaiter(this, void 0, void 0, function* () {
            const configs = Tools.getReportConfigByType(service.type);
            if (!configs || configs.length === 0) {
                return; // specified service type not found, means no need to capture for this service
            }
            for (let config of configs) {
                yield this[`captureService${camel(config.type, { pascalCase: true })}`].apply(this, [machine, service, config]);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceNodeExporter(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:9100`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceCadvisor(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-server": machine.ip
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceMemcached(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:9150`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceMysqld(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-host": `${machine.ip}:9104`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServicePrometheus(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, config.params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceKafka(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // kafka_1 => [kafka, 1] => 1
            const brokerId = id - 1; // 1-1 => 0
            const portMetrics = `7${brokerId}71`; // 7071、7171、7271、...
            const params = Object.assign(config.params, {
                "orgId": 1, "var-instance": `${machine.ip}:${portMetrics}`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceKafkaExporter(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-instance": `${machine.ip}:9308`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceJaegerAgent(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:5778`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceJaegerCollector(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number.parseInt(service.name.split('_')[1]); // jcollector_1 => [jcollector, 1] => 1
            const portHttp = 14268 + (id - 1); // 14268、14269、14270、...
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:${portHttp}`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceFilebeat(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:9479`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceElasticsearch(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = Object.assign(config.params, {
                "orgId": 1, "var-name": service.name,
                "var-instance": `${Tools.getMachinesByType('elasticsearch')[1].ip}:9114` // elasticsearch exporter machine
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    //noinspection JSUnusedLocalSymbols
    captureServiceGoApp(machine, service, config) {
        return __awaiter(this, void 0, void 0, function* () {
            let port = null;
            if (service.type.indexOf('web') !== -1) {
                port = 8000;
            }
            else if (service.type.indexOf('service') !== -1) {
                port = 8001;
            }
            else if (service.type.indexOf('consumer') !== -1) {
                port = 8002;
            }
            const params = Object.assign(config.params, {
                "orgId": 1, "var-node": `${machine.ip}:${port}`
            });
            for (let panel of config.panels) {
                yield Tools.captureGrafanaData(machine, service, config, panel, params);
            }
        });
    }
    fileReport() {
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
class DistClusterToolDockerPs {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            for (let machine of MACHINES) {
                if (ARGS_MACHINE_TYPE !== 'all' && machine.type !== ARGS_MACHINE_TYPE) {
                    continue;
                }
                yield Tools.execAsync(`docker-machine ssh ${machine.name} "docker ps -a"`);
            }
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
    static getReportConfigByType(type) {
        if (type === 'app_web' || type === 'app_service' || type === 'app_consumer') {
            type = 'go_app';
        }
        return REPORT_CONFIG.filter((config) => {
            return config.type === type;
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
    static getKafkaBrokersAddresses() {
        const addresses = [];
        Tools.getMachinesByType('kafka').forEach((machine) => {
            machine.services.forEach((service) => {
                if (service.type != 'kafka') {
                    return;
                }
                const id = Number.parseInt(service.name.split('_')[1]); // kafka_1 => [kafka, 1] => 1
                const brokerId = id - 1; // 1-1 => 0
                const portExternal = `9${brokerId}92`; // 9092、9192、9292、...
                addresses.push(`${machine.ip}:${portExternal}`);
            });
        });
        return addresses;
    }
    static getEsClusterEntrance() {
        return `${Tools.getMachinesByType('elasticsearch')[0].ip}:9200`;
    }
    static getEsClusterNodes() {
        const nodes = [];
        Tools.getMachinesByType('elasticsearch').forEach((machine) => {
            machine.services.forEach((service) => {
                if (service.type != 'elasticsearch') {
                    return;
                }
                const portId = Number.parseInt(service.name.split('_')[1]) - 1;
                nodes.push(`${machine.ip}:920${portId}`);
            });
        });
        return nodes;
    }
    static getCassandraClusterEntrance() {
        return Tools.getMachinesByType('monitor')[0].ip;
    }
    static getJaegerCollectorsAddresses() {
        const addresses = [];
        Tools.getMachinesByType('monitor').forEach((machine) => {
            machine.services.forEach((service) => {
                if (service.type != 'jaeger_collector') {
                    return;
                }
                const id = Number.parseInt(service.name.split('_')[1]); // jcollector_1 => [jcollector, 1] => 1
                const portGrpc = 14250 + (id - 1); // 14250、14251、14252、...
                addresses.push(`${machine.ip}:${portGrpc}`);
            });
        });
        return addresses;
    }
    static getGrafanaAddress() {
        return `${Tools.getMachinesByType('monitor')[0].ip}:3000`;
    }
    static execSSH(ip, command, output) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`ExecSSH: ${command}`);
            return new Promise((resolve, reject) => {
                const conn = new ssh2.Client();
                conn.on('ready', function () {
                    conn.exec(command, function (err, stream) {
                        if (err) {
                            return reject(err);
                        }
                        let stdout = '';
                        let stderr = '';
                        stream.on('close', function (code, signal) {
                            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                            conn.end();
                            if (output) {
                                const targetOutput = LibPath.join(Tools.getBaseDir(), 'output', output + '.txt');
                                Tools.ensureFilePath(targetOutput);
                                LibFs.appendFileSync(targetOutput, `IP:\n${ip}\nCOMMAND:\n${command}\n\n`);
                                if (stdout) {
                                    LibFs.appendFileSync(targetOutput, stdout);
                                }
                                if (stderr) {
                                    LibFs.appendFileSync(targetOutput, stderr);
                                }
                            }
                            resolve();
                        }).on('data', function (data) {
                            console.log('STDOUT: ' + data.toString().trim());
                            stdout += data.toString().trim() + "\n";
                        }).stderr.on('data', function (data) {
                            console.log('STDERR: ' + data.toString().trim());
                            stderr += data.toString().trim() + "\n";
                        });
                    });
                }).connect({
                    host: ip,
                    port: 22,
                    username: 'root',
                    privateKey: LibFs.readFileSync('/home/ubuntu/.ssh/id_rsa')
                });
            });
        });
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
                    Tools.ensureFilePath(targetOutput);
                    const outputStream = LibFs.createWriteStream(targetOutput);
                    child.stdout.pipe(outputStream);
                    child.stderr.pipe(outputStream);
                }
                child.on('close', () => resolve());
                child.on('error', (err) => reject(err));
            });
        });
    }
    static captureGrafanaData(machine, service, config, panel, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = `${Tools.getBaseDir()}/data/${machine.name}/${service.name}/${panel.file}.png`;
            Tools.ensureFilePath(file);
            const targetUrl = `http://${Tools.getGrafanaAddress()}/render/d-solo/${config.uid}/${config.node}?${Tools.serializeQueryString(params)}`;
            yield Tools.execAsync(`curl -H "Authorization: Bearer ${process.env.GRAFANA_API}" ${targetUrl} > ${file}`);
        });
    }
    static serializeQueryString(params) {
        const tmp = [];
        for (let key in params) {
            if (!params.hasOwnProperty(key)) {
                continue;
            }
            tmp.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
        }
        return tmp.join('&');
    }
    static ensureFilePath(path) {
        mkdir.sync(LibPath.dirname(path)); // ensure dir
        LibFs.writeFileSync(path, ''); // ensure file & empty file
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