package handler

import (
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/random"
	"dist-system-practice/lib/timerecorder"
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
var randomSelectorMap = []*random.SelectorItem{
	{Item: "apiSearchWork", Count: 4500},
	{Item: "apiUpdateViewed", Count: 2500},
	{Item: "apiGetAchievement", Count: 2500},
	{Item: "apiPlanWork", Count: 500},
}
var randomSelector = random.NewSelector(randomSelectorMap)

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

	recorder := timerecorder.New()
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

	recorder := timerecorder.New()
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

	recorder := timerecorder.New()
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

	recorder := timerecorder.New()
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
	resetSelectorWithEnv()

	if api, err := randomSelector.Random(); err != nil {
		return err.Error()
	} else {
		return api
	}
}

func resetSelectorWithEnv() {
	if randomSelectorInitialized {
		return
	}

	changed := false

	// check env
	if count := common.GetEnv("API_SEARCH_WORK_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[0].Count = converted
		}
		changed = true
	}
	if count := common.GetEnv("API_UPDATE_VIEWED_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[1].Count = converted
		}
		changed = true
	}
	if count := common.GetEnv("API_GET_ACHIEVEMENT_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[2].Count = converted
		}
		changed = true
	}
	if count := common.GetEnv("API_PLAN_WORK_PERCENTAGE_COUNT", ""); count != "" {
		converted, err := common.StrToInt(count)
		if err == nil { // only set count value when no error
			randomSelectorMap[3].Count = converted
		}
		changed = true
	}

	if changed {
		randomSelector = random.NewSelector(randomSelectorMap)
	}

	// set flag
	randomSelectorInitialized = true
}

func randWorkId() uint32 {
	maxWorkId, err := common.StrToInt(common.GetEnv("MAX_WORK_ID", "10000000"))
	if err != nil {
		return 10000000 // return default value when error encountered
	}

	return uint32(random.Int(1, maxWorkId))
}
