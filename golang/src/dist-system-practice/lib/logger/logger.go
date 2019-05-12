package logger

import (
	"go.uber.org/zap"
	"time"
)

func Get() *zap.Logger {
	return zap.L()
}

func New() {
	config := zap.Config{}
	logger, err := zap.NewProduction()
	if err != nil {
		panic("[Logger] Cannot init zap logger production")
	}
	defer logger.Sync()

	logger.Info("failed to fetch URL",
		zap.String("url", "http://example.com"),
		zap.Int("attempt", 3),
		zap.Duration("backoff", time.Second),
	)
}