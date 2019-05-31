package jaeger

import (
	"fmt"
	"github.com/opentracing/opentracing-go"
	jaegercfg "github.com/uber/jaeger-client-go/config"
)

func Get() opentracing.Tracer {
	return opentracing.GlobalTracer()
}

func New() opentracing.Tracer {
	cfg, err := jaegercfg.FromEnv()
	if err != nil {
		panic(fmt.Sprintf("[Jaeger] Could not parse Jaeger env vars: %s", err.Error()))
	}

	tracer, _, err := cfg.NewTracer()
	if err != nil {
		panic(fmt.Sprintf("[Jaeger] Could not initialize jaeger tracer: %s", err.Error()))
	}
	opentracing.SetGlobalTracer(tracer)

	return opentracing.GlobalTracer()
}
