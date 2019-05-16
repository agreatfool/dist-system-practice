package timerecorder

import "time"

type TimeRecorder struct {
	startPoint time.Time
	endPoint   time.Time
}

func New() *TimeRecorder {
	recorder := TimeRecorder{}
	recorder.startPoint = time.Now()
	recorder.endPoint = time.Now() // for security, just in case someone not calling End()

	return &recorder
}

func (t *TimeRecorder) Start() *TimeRecorder {
	t.startPoint = time.Now()
	return t
}

func (t *TimeRecorder) End() *TimeRecorder {
	t.endPoint = time.Now()
	return t
}

// Time elapsed from t.startPoint
// Returned is microsecond (Nanoseconds() / 1000)
//
// ps Picosecond
// ns Nanosecond
// μs Microsecond
// ms Millisecond
// s  Second
func (t *TimeRecorder) Elapsed() float64 {
	return float64(t.endPoint.Sub(t.startPoint).Nanoseconds()) / float64(1000) // ns nanosecond -> μs microsecond
}
