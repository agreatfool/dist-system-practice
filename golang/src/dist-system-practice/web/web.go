package main

import (
	"dist-system-practice/lib/cache"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/dao"
	"dist-system-practice/lib/database"
	"dist-system-practice/lib/logger"
	"dist-system-practice/web/handler"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
)

func main() {
	// initialize utilities
	cache.New()
	logger.New()
	db := database.New()
	dao.New()

	defer db.Close()

	// ensure env
	if common.GetEnv("APP_NAME", "") == "" {
		if err := os.Setenv("APP_NAME", "WEB"); err != nil {
			panic(fmt.Sprintf("[WEB] Failed to set env APP_NAME: %s", err.Error()))
		}
	}

	// web app
	router := gin.Default()

	router.GET("/", handler.HandleIndex)
	router.GET("/api", handler.HandleApi)

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
