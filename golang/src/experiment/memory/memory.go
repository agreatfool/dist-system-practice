package main

import (
	"flag"
	"fmt"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"time"
)

var spanClassSizes = [...]int{0, 8, 16, 32, 48, 64, 80, 96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 288, 320, 352, 384, 416, 448, 480, 512, 576, 640, 704, 768, 896, 1024, 1152, 1280, 1408, 1536, 1792, 2048, 2304, 2688, 3072, 3200, 3456, 4096, 4864, 5376, 6144, 6528, 6784, 6912, 8192, 9472, 9728, 10240, 10880, 12288, 13568, 14336, 16384, 18432, 19072, 20480, 21760, 24576, 27264, 28672, 32768}

var argsMode string
var argsSpanClass int
var argsInterval int
var argsGoCount int
var argsLeakSize int
var argsLeakEdge int
var argsMemStats bool

func main() {
	flag.StringVar(&argsMode, "mode", "FIXED_SPAN", "Leak mode: FIXED_SPAN | RANDOM_SPAN | LARGE_OBJ")
	flag.IntVar(&argsSpanClass, "class", 66, "Leak span class id, only valid in FIXED_SPAN mode")
	flag.IntVar(&argsInterval, "interval", 500, "Leak interval, tick interval")
	flag.IntVar(&argsGoCount, "goroutine", 50, "Goroutine count, concurrency level")
	flag.IntVar(&argsLeakSize, "size", 2*1024*1024, "Leak size / bytes, default 2 MB, how large leak objects to create in one goroutine timer tick")
	flag.IntVar(&argsLeakEdge, "edge", 2*1024*1024*1024, "Leak edge / bytes, default 2 GB, leak edge of all goroutine, it's shared")
	flag.BoolVar(&argsMemStats, "stats", false, "Report MemStats, log in stderr with human readable format")

	flag.Parse()

	// report mem stats
	if argsMemStats {
		reportMemStats()
	}

	switch argsMode {
	case "FIXED_SPAN":
		modeFixedSpan()
	case "RANDOM_SPAN":
		modeRandomSpan()
	case "LARGE_OBJ":
		modeLargeObject()
	default:
		fmt.Println("Invalid leak mode")
		os.Exit(2)
	}

	err := http.ListenAndServe("127.0.0.1:8080", nil)
	if err != nil {
		fmt.Println("Error:", err)
	}

	//select {} // block forever
}

func modeFixedSpan() {
	edgeCount := int(argsLeakEdge / argsLeakSize) // calc possible total groups of leak objects
	pool := make([][][]byte, 0, edgeCount)

	// check span class
	var spanClass int
	if argsSpanClass > 66 || argsSpanClass <= 0 {
		spanClass = 66
	} else {
		spanClass = argsSpanClass
	}

	// get span size from span class list
	spanSize := spanClassSizes[spanClass]
	objCount := int(argsLeakSize / spanSize) // calc leak object count in one timer tick

	for i := 0; i < argsGoCount; i++ {
		interval := int((1 + rand.Float64()) * float64(argsInterval)) // interval with some offset
		ticker := time.NewTicker(time.Duration(interval) * time.Millisecond)

		go func() {
			for range ticker.C {
				slice := make([][]byte, 0, objCount)

				for j := 0; j < objCount; j++ {
					slice = append(slice, make([]byte, spanSize))
				}

				pool = append(pool, slice)
			}
		}()
	}

	// check & reset pool, since it has exceeded the edge
	ticker := time.NewTicker(500 * time.Millisecond)
	go func() {
		for range ticker.C {
			if len(pool) >= edgeCount {
				pool = make([][][]byte, 0, edgeCount)
			}
		}
	}()
}

func modeRandomSpan() {
	edgeCount := int(argsLeakEdge / argsLeakSize) // calc possible total groups of leak objects
	pool := make([][][]byte, 0, edgeCount)

	for i := 0; i < argsGoCount; i++ {
		interval := int((1 + rand.Float64()) * float64(argsInterval)) // interval with some offset
		ticker := time.NewTicker(time.Duration(interval) * time.Millisecond)

		// determine span class
		spanClass := rand.Intn(67)
		if spanClass == 0 {
			spanClass = 66
		}

		spanSize := spanClassSizes[spanClass]
		objCount := int(argsLeakSize / spanSize) // calc leak object count in one timer tick

		go func() {
			for range ticker.C {
				slice := make([][]byte, 0, objCount)

				for j := 0; j < objCount; j++ {
					slice = append(slice, make([]byte, spanSize))
				}

				pool = append(pool, slice)
			}
		}()
	}

	// check & reset pool, since it has exceeded the edge
	ticker := time.NewTicker(500 * time.Millisecond)
	go func() {
		for range ticker.C {
			if len(pool) >= edgeCount {
				pool = make([][][]byte, 0, edgeCount)
			}
		}
	}()
}

func modeLargeObject() {
	edgeCount := int(argsLeakEdge / argsLeakSize) // calc possible total groups of leak objects
	pool := make([][][]byte, 0, edgeCount)

	var randLargeObjectSize = func() int {
		min1m := 1 * 1024 * 1024
		max2m := 2 * 1024 * 1024

		return rand.Intn(max2m-min1m) + min1m
	}

	for i := 0; i < argsGoCount; i++ {
		interval := int((1 + rand.Float64()) * float64(argsInterval)) // interval with some offset
		ticker := time.NewTicker(time.Duration(interval) * time.Millisecond)

		objSize := randLargeObjectSize()
		objCount := int(argsLeakSize / objSize) // calc leak object count in one timer tick

		go func() {
			for range ticker.C {
				slice := make([][]byte, 0, objCount)

				for j := 0; j < objCount; j++ {
					slice = append(slice, make([]byte, objSize))
				}

				pool = append(pool, slice)
			}
		}()
	}

	// check & reset pool, since it has exceeded the edge
	ticker := time.NewTicker(500 * time.Millisecond)
	go func() {
		for range ticker.C {
			if len(pool) >= edgeCount {
				pool = make([][][]byte, 0, edgeCount)
			}
		}
	}()
}

func reportMemStats() {
	var byte2MB uint64 = 1024 * 1024
	ticker := time.NewTicker(100 * time.Millisecond)

	var olds runtime.MemStats
	var news runtime.MemStats

	go func() {
		for range ticker.C {
			runtime.ReadMemStats(&news)
			fmt.Println(
				"Alloc MB", news.Alloc/byte2MB,
				", Growth MB", (news.TotalAlloc-olds.TotalAlloc)/byte2MB,
				", LiveObj", news.Mallocs-news.Frees,
				", NextGC MB", news.NextGC/byte2MB,
				", Pause nanoseconds", news.PauseTotalNs-olds.PauseTotalNs, // nano?
				", NumGC", news.NumGC-olds.NumGC,
			)
			olds = news
		}
	}()
}
