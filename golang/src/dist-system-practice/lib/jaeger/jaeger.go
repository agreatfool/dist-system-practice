package jaeger

import (
	"fmt"
	"github.com/opentracing/opentracing-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	jaegerlog "github.com/uber/jaeger-client-go/log"
	"github.com/uber/jaeger-lib/metrics"
)

func Get() opentracing.Tracer {
	return opentracing.GlobalTracer()
}

func New() opentracing.Tracer {
	cfg, err := jaegercfg.FromEnv()
	if err != nil {
		panic(fmt.Sprintf("[Jaeger] Could not parse Jaeger env vars: %s", err.Error()))
	}

	jLogger := jaegerlog.StdLogger
	jMetricsFactory := metrics.NullFactory

	tracer, _, err := cfg.NewTracer(
		jaegercfg.Logger(jLogger),
		jaegercfg.Metrics(jMetricsFactory),
	)
	if err != nil {
		panic(fmt.Sprintf("[Jaeger] Could not initialize jaeger tracer: %s", err.Error()))
	}
	opentracing.SetGlobalTracer(tracer)

	return opentracing.GlobalTracer()
}
