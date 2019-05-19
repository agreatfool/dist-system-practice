package random

import (
	"errors"
	"math/rand"
	"time"
)

var seedInitialized = false

// Make random float between min & max
func Float(min float64, max float64) float64 {
	checkRandSeed()
	return min + rand.Float64()*(max-min)
}

// Make random int between min & max
func Int(min int, max int) int {
	checkRandSeed()

	if min == max {
		return min
	}

	return min + rand.Intn(max-min)
}

func checkRandSeed() {
	if !seedInitialized {
		rand.Seed(time.Now().UTC().UnixNano())
		seedInitialized = true
	}
}

type SelectorItem struct {
	Item  string
	Count int
}

type Selector struct {
	ItemMap []*SelectorItem
	total   int
	edges   []int
	items   []string
}

func NewSelector(itemMap []*SelectorItem) *Selector {
	selector := &Selector{}

	selector.ItemMap = itemMap
	selector.edges = make([]int, len(selector.ItemMap))
	selector.items = make([]string, len(selector.ItemMap))

	high := 0

	for i := 0; i < len(selector.ItemMap); i++ {
		// handle total
		selector.total += selector.ItemMap[i].Count

		// handle item
		selector.items[i] = selector.ItemMap[i].Item

		// handle edge
		if i == 0 {
			high = selector.ItemMap[i].Count
		} else {
			high += selector.ItemMap[i].Count
		}
		selector.edges[i] = high
	}

	return selector
}

func (r *Selector) Prepare(itemMap []*SelectorItem) {
	if len(r.edges) > 0 || len(r.items) > 0 {
		return
	}

	r.ItemMap = itemMap
	r.edges = make([]int, len(r.ItemMap))
	r.items = make([]string, len(r.ItemMap))

	high := 0

	for i := 0; i < len(r.ItemMap); i++ {
		// handle total
		r.total += r.ItemMap[i].Count

		// handle item
		r.items[i] = r.ItemMap[i].Item

		// handle edge
		if i == 0 {
			high = r.ItemMap[i].Count
		} else {
			high += r.ItemMap[i].Count
		}
		r.edges[i] = high
	}
}

func (r *Selector) Random() (string, error) {
	if len(r.edges) == 0 || len(r.items) == 0 {
		return "", errors.New("random selector has not been initialized yet")
	}

	low := 1
	randId := Int(1, r.total)
	for i := 0; i < len(r.edges); i++ {
		if low <= randId && randId <= r.edges[i] {
			return r.items[i], nil
		} else {
			low = r.edges[i] + 1
		}
	}

	return "", errors.New("random selector hits empty")
}
