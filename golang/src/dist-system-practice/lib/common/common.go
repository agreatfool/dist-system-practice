package common

import (
	"math/rand"
	"os"
	"path"
)

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
	return min + rand.Float64()*(max-min)
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
