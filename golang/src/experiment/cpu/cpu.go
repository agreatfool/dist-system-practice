package main

import (
	"fmt"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"time"
)

func consume(n int) int {
	if n == 0 {
		return 0
	}
	if n == 1 {
		return 1
	}
	return consume(n-1) + consume(n-2)
}

func main() {
	runtime.GOMAXPROCS(8)

	concurrent()

	err := http.ListenAndServe("127.0.0.1:8080", nil)
	if err != nil {
		fmt.Println("Error:", err)
	}
}

func concurrent() {
	for i := 0; i < 50; i++ {
		interval := int((1 + rand.Float64()) * float64(20)) // interval with some offset
		ticker := time.NewTicker(time.Duration(interval) * time.Millisecond)

		go func() {
			for range ticker.C {
				consume(rand.Intn(33))
			}
		}()
	}
}
