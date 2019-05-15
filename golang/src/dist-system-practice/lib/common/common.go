package common

import (
	"math/rand"
	"os"
	"path"
	"strconv"
	"time"
)

var seedInitialized = false

// Get env via os.Getenv, return fallback if specified one is empty.
func GetEnv(key, fallback string) string {
	value := os.Getenv(key)

	if len(value) == 0 {
		return fallback
	}

	return value
}

// Ensure a file exists, if not create an empty one.
func FileEnsure(filepath string) error {
	// exist when file exists
	if FileExists(filepath) {
		return nil
	}

	// make sure dir exists
	dirErr := os.MkdirAll(path.Dir(filepath), os.ModePerm)
	if dirErr != nil {
		return dirErr
	}

	// make sure file exists
	file, fileErr := os.OpenFile(filepath, os.O_RDONLY|os.O_CREATE, 0666)
	if fileErr != nil {
		return fileErr
	}
	defer file.Close()

	return nil
}

// Check whether file exists.
func FileExists(filepath string) bool {
	info, err := os.Stat(filepath)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

// Make random float between min & max
func RandomFloat(min float64, max float64) float64 {
	checkRandSeed()
	return min + rand.Float64()*(max-min)
}

// Make random int between min & max
func RandomInt(min int, max int) int {
	checkRandSeed()
	return min + rand.Intn(max-min)
}

func StrToInt(str string) (int, error) {
	i, err := strconv.Atoi(str)
	if err != nil {
		return 0, err
	}
	return i, nil
}

func StrToInt64(str string) (int64, error) {
	i, err := strconv.ParseInt(str, 10, 64)
	if err != nil {
		return 0, err
	}
	return i, nil
}

func IntToStr(i int) string {
	return strconv.Itoa(i)
}

func Int64ToStr(i int64) string {
	return strconv.FormatInt(i, 10)
}

type TimeRecorder struct {
	startPoint time.Time
	endPoint   time.Time
}

func NewTimeRecorder() *TimeRecorder {
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

// Time elapsed from t.StartPoint
// Returned is microsecond (Nanoseconds() / 1000000)
//
// ps Picosecond
// ns Nanosecond
// μs Microsecond
// ms Millisecond
// s  Second
func (t *TimeRecorder) Elapsed() float64 {
	return float64(t.endPoint.Sub(t.startPoint).Nanoseconds()) / float64(1000) // ns nanosecond -> μs microsecond
}

func Consume(n int) int { // ok: 37-39, edge: 40
	if n == 0 {
		return 0
	}
	if n == 1 {
		return 1
	}
	return Consume(n-1) + Consume(n-2)
}

func checkRandSeed() {
	if !seedInitialized {
		rand.Seed(time.Now().UTC().UnixNano())
		seedInitialized = true
	}
}
