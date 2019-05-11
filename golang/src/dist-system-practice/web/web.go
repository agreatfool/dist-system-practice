package main

import (
	"dist-system-practice/web/handler"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
)

// WEB入口 HTTP -> DefaultHandle 随机ID 随机业务 ->
// Service gRPC -> 逻辑处理 -> 发送消息到Kafka
// Consumer Kafka consumer -> 从Kafka拉取消息 -> 业务处理

func handleEntrance(c *gin.Context) {
	// 制作随机ID
	// 选择随机业务

	// 业务：
	// 查询数据：设置一个百分比为404的情况，故意出错
	// 更新简单字段：数字类型自增
	// 查询计算值：该字段大部分情况下应该为默认值XXX，可以被查到，少部分为空，为空则触发更新操作
	// 更新计算值：向消息队列里放入任务，等待处理

	handler.HandlePlanTask(c)
}

func main() {
	router := gin.Default()

	router.GET("/plan", handleEntrance)

	s := &http.Server{
		Addr:    ":8000",
		Handler: router,
	}

	err := s.ListenAndServe()
	if err != nil {
		fmt.Println(err)
	}
}
