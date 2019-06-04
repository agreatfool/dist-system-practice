package handler

import (
	"context"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/jaeger"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/random"
	"dist-system-practice/lib/timerecorder"
	"dist-system-practice/web/rpc"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/opentracing/opentracing-go"
	"go.uber.org/zap"
	"net/http"
)

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Global
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

var randomSelectorInitialized = false
var randomSelectorMap = []*random.SelectorItem{
	{Item: "apiGetWork", Count: 4500},
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

	var span opentracing.Span
	var ctx = context.Background()

	recorder := timerecorder.New()
	randApi := randApi()
	workId := randWorkId()

	defer func() {
		logApi(randApi, workId, recorder, err)
		respond(c, res, err)
		jaeger.FinishWebSpan(span, res.Code, err)
	}()

	switch randApi {
	case "apiGetWork":
		ctx, span = jaeger.NewWebSpan(ctx, c, fmt.Sprintf("Web.HandleApi.%s", randApi))
		res, err = apiGetWork(ctx, workId)
	case "apiUpdateViewed":
		ctx, span = jaeger.NewWebSpan(ctx, c, fmt.Sprintf("Web.HandleApi.%s", randApi))
		res, err = apiUpdateViewed(ctx, workId)
	case "apiGetAchievement":
		ctx, span = jaeger.NewWebSpan(ctx, c, fmt.Sprintf("Web.HandleApi.%s", randApi))
		res, err = apiGetAchievement(ctx, workId)
	case "apiPlanWork":
		ctx, span = jaeger.NewWebSpan(ctx, c, fmt.Sprintf("Web.HandleApi.%s", randApi))
		res, err = apiPlanWork(ctx, workId)
	default:
		err = errors.New(fmt.Sprintf("invalid api generated: %s", randApi))
		return
	}
}

func HandleGetWork(c *gin.Context) {
	var res result
	var err error

	recorder := timerecorder.New()
	workId := randWorkId()
	ctx, span := jaeger.NewWebSpan(context.Background(), c, "Web.HandleGetWork")
	defer func() {
		logApi("apiGetWork", workId, recorder, err)
		respond(c, res, err)
		jaeger.FinishWebSpan(span, res.Code, err)
	}()

	res, err = apiGetWork(ctx, workId)
}

func HandleUpdateViewed(c *gin.Context) {
	var res result
	var err error

	recorder := timerecorder.New()
	workId := randWorkId()
	ctx, span := jaeger.NewWebSpan(context.Background(), c, "Web.HandleUpdateViewed")
	defer func() {
		logApi("apiUpdateViewed", workId, recorder, err)
		respond(c, res, err)
		jaeger.FinishWebSpan(span, res.Code, err)
	}()

	res, err = apiUpdateViewed(ctx, randWorkId())
}

func HandleGetAchievement(c *gin.Context) {
	var res result
	var err error

	recorder := timerecorder.New()
	workId := randWorkId()
	ctx, span := jaeger.NewWebSpan(context.Background(), c, "Web.HandleGetAchievement")
	defer func() {
		logApi("apiGetAchievement", workId, recorder, err)
		respond(c, res, err)
		jaeger.FinishWebSpan(span, res.Code, err)
	}()

	res, err = apiGetAchievement(ctx, randWorkId())
}

func HandlePlanWork(c *gin.Context) {
	var res result
	var err error

	recorder := timerecorder.New()
	workId := randWorkId()
	ctx, span := jaeger.NewWebSpan(context.Background(), c, "Web.HandlePlanWork")
	defer func() {
		logApi("apiPlanWork", workId, recorder, err)
		respond(c, res, err)
		jaeger.FinishWebSpan(span, res.Code, err)
	}()

	res, err = apiPlanWork(ctx, randWorkId())
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func apiGetWork(ctx context.Context, id uint32) (result, error) {
	var res result

	work, err := rpc.Get().GetWork(ctx, id)
	if err != nil {
		return res, err
	}

	res.Code = http.StatusOK
	res.Data = gin.H{"work": work}

	return res, nil
}

func apiUpdateViewed(ctx context.Context, id uint32) (result, error) {
	var res result

	viewed, err := rpc.Get().UpdateViewed(ctx, id)
	if err != nil {
		return res, err
	}

	res.Code = http.StatusOK
	res.Data = gin.H{"viewed": viewed.Viewed}

	return res, nil
}

func apiGetAchievement(ctx context.Context, id uint32) (result, error) {
	var res result

	achievement, err := rpc.Get().GetAchievement(ctx, id)
	if err != nil {
		return res, err
	}

	res.Code = http.StatusOK
	res.Data = gin.H{"achievement": achievement.Achievement}

	return res, nil
}

func apiPlanWork(ctx context.Context, id uint32) (result, error) {
	var res result

	work, err := rpc.Get().PlanWork(ctx, id)
	if err != nil {
		return res, err
	}

	res.Code = http.StatusOK
	res.Data = gin.H{"work": work}

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
	if count := common.GetEnv("API_GET_WORK_PERCENTAGE_COUNT", ""); count != "" {
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
	def := uint32(10000000)
	maxWorkId, err := common.StrToInt(common.GetEnv("MAX_WORK_ID", fmt.Sprintf("%d", def)))
	if err != nil {
		return def // return default value when error encountered
	}

	return uint32(random.Int(1, maxWorkId))
}

func respond(c *gin.Context, res result, err error) {
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
	} else {
		c.JSON(res.Code, res.Data)
	}
}

func logApi(api string, workId uint32, recorder *timerecorder.TimeRecorder, err error) {
	recorder.End()

	if err != nil {
		logger.Get().Error(fmt.Sprintf("[Web.Handler] Api: %s: Error.", api), zap.Error(err))
	} else {
		logger.Get().Info(fmt.Sprintf("[Web.Handler] Api: %s.", api),
			zap.String("api", api),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	}
}
