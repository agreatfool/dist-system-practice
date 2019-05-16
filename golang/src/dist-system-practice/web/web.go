package main

import (
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/logger"
	"dist-system-practice/web/handler"
	"dist-system-practice/web/rpc"
	"fmt"
	"github.com/gin-contrib/zap"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"time"
)

func main() {
	// ensure env
	// APP_NAME shall be ensured before logger initialized
	if common.GetEnv("APP_NAME", "") == "" {
		if err := os.Setenv("APP_NAME", "WEB"); err != nil {
			panic(fmt.Sprintf("[WEB] Failed to set env APP_NAME: %s", err.Error()))
		}
	}

	// initialize utilities
	logger.New()
	rpc.New()

	// web app
	router := gin.Default()

	// Add a ginzap middleware, which:
	//   - Logs all requests, like a combined access and error log.
	//   - Logs to stdout.
	//   - RFC3339 with UTC time format.
	router.Use(ginzap.Ginzap(logger.Get(), time.RFC3339, true))

	// Logs all panic to error log
	//   - stack means whether output the stack info.
	router.Use(ginzap.RecoveryWithZap(logger.Get(), true))

	router.GET("/", handler.HandleIndex)
	router.GET("/api", handler.HandleApi)
	router.GET("/work", handler.HandleGetWork)
	router.GET("/viewed", handler.HandleUpdateViewed)
	router.GET("/achievement", handler.HandleGetAchievement)
	router.GET("/plan", handler.HandlePlanWork)

	host := common.GetEnv("WEB_HOST", "0.0.0.0")
	port := common.GetEnv("WEB_PORT", "8000")

	s := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", host, port),
		Handler: router,
	}

	err := s.ListenAndServe()
	if err != nil {
		fmt.Println(err)
	}
}
