package rpc

import (
	"context"
	"dist-system-practice/lib/common"
	"dist-system-practice/lib/dao"
	lkafka "dist-system-practice/lib/kafka"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/model"
	"dist-system-practice/lib/timerecorder"
	pb "dist-system-practice/message"
	"fmt"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"time"
)

const timeout = 15

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Structure
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

type ServerImpl struct {
	pb.WorkServiceServer
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Factory
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func New() *ServerImpl {
	return &ServerImpl{}
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Apis
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func (s *ServerImpl) GetWork(ctx context.Context, workId *pb.WorkId) (*pb.Work, error) {
	var work *model.Work
	var err error

	recorder := timerecorder.New()
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		logApi("GetWork", workId.Id, recorder, err)
	}()

	work, err = dao.Get().GetWork(ctx, workId.Id)
	if err != nil {
		return nil, err
	}

	return portWork(work), nil
}

func (s *ServerImpl) UpdateViewed(ctx context.Context, workId *pb.WorkId) (*pb.WorkViewed, error) {
	var viewed uint32
	var err error

	recorder := timerecorder.New()
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		logApi("UpdateViewed", workId.Id, recorder, err)
	}()

	viewed, err = dao.Get().UpdateViewed(ctx, workId.Id)
	if err != nil {
		return nil, err
	}

	return &pb.WorkViewed{Viewed: viewed}, nil
}

func (s *ServerImpl) GetAchievement(ctx context.Context, workId *pb.WorkId) (*pb.WorkAchievement, error) {
	var work *model.Work
	var err error

	recorder := timerecorder.New()
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		logApi("GetAchievement", workId.Id, recorder, err)
	}()

	work, err = dao.Get().GetWork(ctx, workId.Id)
	if err != nil {
		return nil, err
	}

	return &pb.WorkAchievement{Achievement: work.Achievement}, nil
}

func (s *ServerImpl) PlanWork(ctx context.Context, workId *pb.WorkId) (*pb.Work, error) {
	var work *model.Work
	var err error

	recorder := timerecorder.New()
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer func() {
		cancel()
		logApi("PlanWork", workId.Id, recorder, err)
	}()

	err = lkafka.GetWriter().WriteMessages(ctx, kafka.Message{
		Value: []byte(common.IntToStr(int(workId.Id))),
	})
	if err != nil {
		return nil, err
	}

	work, err = dao.Get().PlanWork(ctx, workId.Id)
	if err != nil {
		return nil, err
	}

	return portWork(work), nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Tools
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

func portWork(work *model.Work) *pb.Work {
	return &pb.Work{
		Id:            work.Id,
		Viewed:        work.Viewed,
		AchievedCount: work.AchievedCount,
		Achievement:   work.Achievement,
		IsPlanned:     work.IsPlanned,
		PlannedAt:     int32(work.PlannedAt.Unix()),
		AchievedAt:    int32(work.AchievedAt.Unix()),
		Created:       int32(work.Created.Unix()),
		Updated:       int32(work.Updated.Unix()),
	}
}

func logApi(api string, workId uint32, recorder *timerecorder.TimeRecorder, err error) {
	recorder.End()

	if err != nil {
		logger.Get().Error(fmt.Sprintf("[Service.Rpc] Api: %s: Error.", api), zap.Error(err))
	} else {
		logger.Get().Info(fmt.Sprintf("[Service.Rpc] Api: %s.", api),
			zap.String("api", api),
			zap.Uint32("workId", workId),
			zap.Float64("consumed", recorder.Elapsed()))
	}
}
