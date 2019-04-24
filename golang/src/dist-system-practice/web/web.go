package main

import (
	"dist-system-practice/web/handler"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	router := gin.Default()

	router.GET("/plan", handler.HandlePlanTask)

	s := &http.Server{
		Addr:    ":8000",
		Handler: router,
	}

	err := s.ListenAndServe()
	if err != nil {
		fmt.Println(err)
	}
}
