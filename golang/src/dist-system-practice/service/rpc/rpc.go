package rpc

import (
	"context"
	"dist-system-practice/lib/dao"
	"dist-system-practice/lib/logger"
	"dist-system-practice/lib/model"
	"dist-system-practice/lib/timerecorder"
	pb "dist-system-practice/message"
	"go.uber.org/zap"
)

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
	recorder := timerecorder.New()
	defer func() {
		recorder.End()
		logger.Get().Info("[Service.Rpc] GetWork.",
			zap.String("rpc", "GetWork"),
			zap.Uint32("workId", workId.Id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	work, err := dao.Get().GetWork(workId.Id)
	if err != nil {
		return nil, err
	}

	return portWork(work), nil
}

func (s *ServerImpl) UpdateViewed(ctx context.Context, workId *pb.WorkId) (*pb.WorkViewed, error) {
	recorder := timerecorder.New()
	defer func() {
		recorder.End()
		logger.Get().Info("[Service.Rpc] UpdateViewed.",
			zap.String("rpc", "UpdateViewed"),
			zap.Uint32("workId", workId.Id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	viewed, err := dao.Get().UpdateViewed(workId.Id)
	if err != nil {
		return nil, err
	}

	return &pb.WorkViewed{Viewed: viewed}, nil
}

func (s *ServerImpl) GetAchievement(ctx context.Context, workId *pb.WorkId) (*pb.WorkAchievement, error) {
	recorder := timerecorder.New()
	defer func() {
		recorder.End()
		logger.Get().Info("[Service.Rpc] GetAchievement.",
			zap.String("rpc", "GetAchievement"),
			zap.Uint32("workId", workId.Id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	work, err := dao.Get().GetWork(workId.Id)
	if err != nil {
		return nil, err
	}

	return &pb.WorkAchievement{Achievement: work.Achievement}, nil
}

func (s *ServerImpl) PlanWork(ctx context.Context, workId *pb.WorkId) (*pb.Work, error) {
	recorder := timerecorder.New()
	defer func() {
		recorder.End()
		logger.Get().Info("[Service.Rpc] PlanWork.",
			zap.String("rpc", "PlanWork"),
			zap.Uint32("workId", workId.Id),
			zap.Float64("consumed", recorder.Elapsed()))
	}()

	// TODO message queue logic here

	work, err := dao.Get().PlanWork(workId.Id)
	if err != nil {
		return nil, err
	}

	return portWork(work), nil
}

// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Message Queue
// -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// TODO

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
