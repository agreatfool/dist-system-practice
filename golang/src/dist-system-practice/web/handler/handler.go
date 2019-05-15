package handler

import (
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/logger"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"net/http"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var apiMap = map[int]string{
	10: "apiSearchWork",
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Structure
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type result struct {
	Code int
	Data gin.H
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Handlers
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

// WEB入口 HTTP -> DefaultHandle 随机ID 随机业务 ->
// Service gRPC -> 逻辑处理 -> 发送消息到Kafka
// Consumer Kafka consumer -> 从Kafka拉取消息 -> 业务处理

func HandleIndex(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Index",
	})
}

func HandleApi(c *gin.Context) {
	var res result
	var err error

	apiGenerated := randApi()
	workId := randWorkId()

	switch apiGenerated {
	case "apiSearchWork":
		recorder := common.NewTimeRecorder()
		res, err = apiSearchWork(workId)
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiSearchWork.",
			zap.String("api", "apiSearchWork"),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	case "apiUpdateViewed":
		recorder := common.NewTimeRecorder()
		res, err = apiUpdateViewed(workId)
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiUpdateViewed.",
			zap.String("api", "apiUpdateViewed"),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	case "apiGetAchievement":
		recorder := common.NewTimeRecorder()
		res, err = apiGetAchievement(workId)
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiGetAchievement.",
			zap.String("api", "apiGetAchievement"),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	case "apiPlanWork":
		recorder := common.NewTimeRecorder()
		res, err = apiPlanWork(workId)
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiPlanWork.",
			zap.String("api", "apiPlanWork"),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	default:
		err := errors.New(fmt.Sprintf("invalid api generated: %s", apiGenerated))
		logger.Get().Error("[WEB.Handler] HandleApi: Invalid api generated.", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err != nil {
		logger.Get().Error("[WEB.Handler] HandleApi: Error.", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
	} else {
		c.JSON(res.Code, res.Data)
	}
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func apiSearchWork(id uint32) (result, error) {
	var res result
	return res, nil
}

func apiUpdateViewed(id uint32) (result, error) {
	var res result
	return res, nil
}

func apiGetAchievement(id uint32) (result, error) {
	var res result
	return res, nil
}

func apiPlanWork(id uint32) (result, error) {
	var res result
	return res, nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Tools
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func randApi() string {
	return "apiSearchWork"
}

func randWorkId() uint32 {
	maxWorkId, err := common.StrToInt(common.GetEnv("MAX_WORK_ID", "10000000"))
	if err != nil {
		return 10000000 // return default value when error encountered
	}

	return uint32(common.RandomInt(1, maxWorkId))
}
