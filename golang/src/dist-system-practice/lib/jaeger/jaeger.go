package jaeger

import (
	"context"
	"dist-system-practice/lib/database"
	"fmt"
	"github.com/bradfitz/gomemcache/memcache"
	"github.com/gin-contrib/location"
	"github.com/gin-gonic/gin"
	"github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/ext"
	"github.com/opentracing/opentracing-go/log"
	jaegercfg "github.com/uber/jaeger-client-go/config"
	jaegerlog "github.com/uber/jaeger-client-go/log"
	"github.com/uber/jaeger-lib/metrics"
	"google.golang.org/grpc/metadata"
	"io"
	"net/http"
	"strings"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func NewWebSpan(ctx context.Context, c *gin.Context, optName string) (context.Context, opentracing.Span) {
	span := Get().StartSpan(optName)

	ext.Component.Set(span, "gin")
	ext.SpanKindRPCClient.Set(span)
	ext.HTTPUrl.Set(span, location.Get(c).String())
	ext.HTTPMethod.Set(span, "GET")

	return opentracing.ContextWithSpan(ctx, span), span
}

func FinishWebSpan(span opentracing.Span, code int, err error) {
	if err != nil {
		ext.Error.Set(span, true)
		ext.HTTPStatusCode.Set(span, http.StatusInternalServerError)
		span.LogFields(
			log.String("event", "error"),
			log.String("message", err.Error()),
		)
	} else {
		ext.HTTPStatusCode.Set(span, uint16(code))
	}

	span.Finish()
}

func NewRpcClientSpanFromContext(ctx context.Context, optName string) (context.Context, opentracing.Span) {
	var parentSpanCtx opentracing.SpanContext
	if parent := opentracing.SpanFromContext(ctx); parent != nil {
		parentSpanCtx = parent.Context()
	}
	opts := []opentracing.StartSpanOption{
		opentracing.ChildOf(parentSpanCtx),
		ext.SpanKindRPCClient,
		opentracing.Tag{Key: string(ext.Component), Value: "gRPC"},
	}
	if tagx := ctx.Value(clientSpanTagKey{}); tagx != nil {
		if opt, ok := tagx.(opentracing.StartSpanOption); ok {
			opts = append(opts, opt)
		}
	}
	span := Get().StartSpan(optName, opts...)

	md, ok := metadata.FromOutgoingContext(ctx)
	if !ok {
		md = metadata.New(nil)
	} else {
		md = md.Copy()
	}
	mdWriter := metadataReaderWriter{md}

	if err := Get().Inject(span.Context(), opentracing.HTTPHeaders, mdWriter); err != nil {
		jaegerlog.StdLogger.Infof("grpc_opentracing: failed serializing trace information: %v", err)
	}
	ctxWithMetadata := metadata.NewOutgoingContext(ctx, md)

	return opentracing.ContextWithSpan(ctxWithMetadata, span), span
}

func FinishRpcClientSpan(span opentracing.Span, err error) {
	if err != nil && err != io.EOF {
		ext.Error.Set(span, true)
		span.LogFields(
			log.String("event", "error"),
			log.String("message", err.Error()),
		)
	}
	span.Finish()
}

func NewDbSpanFromContext(ctx context.Context, optName string) (context.Context, opentracing.Span) {
	var parentSpanCtx opentracing.SpanContext
	if parent := opentracing.SpanFromContext(ctx); parent != nil {
		parentSpanCtx = parent.Context()
	}
	opts := []opentracing.StartSpanOption{
		opentracing.ChildOf(parentSpanCtx),
		ext.SpanKindRPCClient,
		opentracing.Tag{Key: string(ext.Component), Value: "MySQL"},
		opentracing.Tag{Key: string(ext.DBInstance), Value: database.Address()},
		opentracing.Tag{Key: string(ext.DBType), Value: "MySQL"},
	}
	span := Get().StartSpan(optName, opts...)

	return opentracing.ContextWithSpan(ctx, span), span
}

func FinishDbSpan(span opentracing.Span, err error) {
	if err != nil && err != io.EOF && err != memcache.ErrCacheMiss {
		ext.Error.Set(span, true)
		span.LogFields(
			log.String("event", "error"),
			log.String("message", err.Error()),
		)
	}
	span.Finish()
}

func NewConsumerSpan(ctx context.Context, optName string) (context.Context, opentracing.Span) {
	opts := []opentracing.StartSpanOption{
		ext.SpanKindConsumer,
		opentracing.Tag{Key: string(ext.Component), Value: "Kafka Consumer"},
	}
	span := Get().StartSpan(optName, opts...)

	return opentracing.ContextWithSpan(ctx, span), span
}

func FinishConsumerSpan(span opentracing.Span, err error) {
	if err != nil && err != memcache.ErrCacheMiss {
		ext.Error.Set(span, true)
		span.LogFields(
			log.String("event", "error"),
			log.String("message", err.Error()),
		)
	}
	span.Finish()
}

func NewKafkaSpan(ctx context.Context, optName string) (context.Context, opentracing.Span) {
	var parentSpanCtx opentracing.SpanContext
	if parent := opentracing.SpanFromContext(ctx); parent != nil {
		parentSpanCtx = parent.Context()
	}
	opts := []opentracing.StartSpanOption{
		opentracing.ChildOf(parentSpanCtx),
		ext.SpanKindProducer,
		opentracing.Tag{Key: string(ext.Component), Value: "Kafka Producer"},
	}
	span := Get().StartSpan(optName, opts...)

	return opentracing.ContextWithSpan(ctx, span), span
}

func FinishKafkaSpan(span opentracing.Span, err error) {
	if err != nil {
		ext.Error.Set(span, true)
		span.LogFields(
			log.String("event", "error"),
			log.String("message", err.Error()),
		)
	}
	span.Finish()
}

func NewCalcSpan(ctx context.Context, optName string) (context.Context, opentracing.Span) {
	var parentSpanCtx opentracing.SpanContext
	if parent := opentracing.SpanFromContext(ctx); parent != nil {
		parentSpanCtx = parent.Context()
	}
	opts := []opentracing.StartSpanOption{
		opentracing.ChildOf(parentSpanCtx),
		opentracing.Tag{Key: string(ext.Component), Value: "Fibonacci"},
	}
	span := Get().StartSpan(optName, opts...)

	return opentracing.ContextWithSpan(ctx, span), span
}

func FinishCalcSpan(span opentracing.Span) {
	span.Finish()
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Tools
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type clientSpanTagKey struct{}

type metadataReaderWriter struct {
	metadata.MD
}

func (w metadataReaderWriter) Set(key, val string) {
	// The GRPC HPACK implementation rejects any uppercase keys here.
	//
	// As such, since the HTTP_HEADERS format is case-insensitive anyway, we
	// blindly lowercase the key (which is guaranteed to work in the
	// Inject/Extract sense per the OpenTracing spec).
	key = strings.ToLower(key)
	w.MD[key] = append(w.MD[key], val)
}

func (w metadataReaderWriter) ForeachKey(handler func(key, val string) error) error {
	for k, vals := range w.MD {
		for _, v := range vals {
			if err := handler(k, v); err != nil {
				return err
			}
		}
	}

	return nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Factory
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

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
