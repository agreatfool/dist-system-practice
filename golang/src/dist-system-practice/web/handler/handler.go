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

var randomSelectorInitialized = false
var randomSelector = &common.RandomSelector{}
var randomSelectorMap = []common.RandomSelectorItem{
	{Item: "apiSearchWork", Count: 4500},
	{Item: "apiUpdateViewed", Count: 2500},
	{Item: "apiGetAchievement", Count: 2500},
	{Item: "apiPlanWork", Count: 500},
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

	randApi := randApi()
	workId := randWorkId()

	switch randApi {
	case "apiSearchWork":
		res, err = apiSearchWork(workId)
	case "apiUpdateViewed":
		res, err = apiUpdateViewed(workId)
	case "apiGetAchievement":
		res, err = apiGetAchievement(workId)
	case "apiPlanWork":
		res, err = apiPlanWork(workId)
	default:
		err := errors.New(fmt.Sprintf("invalid api generated: %s", randApi))
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

	recorder := common.NewTimeRecorder()
	defer func() {
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiSearchWork.",
			zap.String("api", "apiSearchWork"),
			zap.Uint32("workId", id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	return res, nil
}

func apiUpdateViewed(id uint32) (result, error) {
	var res result

	recorder := common.NewTimeRecorder()
	defer func() {
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiUpdateViewed.",
			zap.String("api", "apiUpdateViewed"),
			zap.Uint32("workId", id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	return res, nil
}

func apiGetAchievement(id uint32) (result, error) {
	var res result

	recorder := common.NewTimeRecorder()
	defer func() {
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiGetAchievement.",
			zap.String("api", "apiGetAchievement"),
			zap.Uint32("workId", id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	return res, nil
}

func apiPlanWork(id uint32) (result, error) {
	var res result

	recorder := common.NewTimeRecorder()
	defer func() {
		recorder.End()
		logger.Get().Info("[WEB.Handler] Api: apiPlanWork.",
			zap.String("api", "apiPlanWork"),
			zap.Uint32("workId", id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	return res, nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Tools
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func randApi() string {
	initRandomSelector()

	if api, err := randomSelector.Random(); err != nil {
		return err.Error()
	} else {
		return api
	}
}

func initRandomSelector() {
	if randomSelectorInitialized {
		return
	}

	// check env
	if count := common.GetEnv("API_SEARCH_WORK_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[0].Count = converted
		}
	}
	if count := common.GetEnv("API_UPDATE_VIEWED_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[1].Count = converted
		}
	}
	if count := common.GetEnv("API_GET_ACHIEVEMENT_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[2].Count = converted
		}
	}
	if count := common.GetEnv("API_PLAN_WORK_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[3].Count = converted
		}
	}

	// initialize selector
	randomSelector.Prepare(randomSelectorMap)

	// set flag
	randomSelectorInitialized = true
}

func randWorkId() uint32 {
	maxWorkId, err := common.StrToInt(common.GetEnv("MAX_WORK_ID", "10000000"))
	if err != nil {
		return 10000000 // return default value when error encountered
	}

	return uint32(common.RandomInt(1, maxWorkId))
}
