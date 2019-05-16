package roundrobin

import (
	"errors"
	"sync"
)

type RoundRobin interface {
	Next() interface{}
}

var ErrEmptyItems = errors.New("items empty")

type implementation struct {
	items []interface{}
	mu    *sync.Mutex
	next  int
}

// New a round robin implementation.
//
// Since type of items is "[]interface{}",
// it have to be converted before "New(...)".
//
// e.g
// var length = ...
// itemsInterface := make([]interface{}, length)
// itemsOriginal := make([]int, length)
// for i := range itemsOriginal {
//     itemsInterface[i] = itemsOriginal[i]
// }
// roundRobin, err := New(itemsInterface)
func New(items []interface{}) (RoundRobin, error) {
	if len(items) == 0 {
		return nil, ErrEmptyItems
	}

	return &implementation{
		items: items,
		mu:    new(sync.Mutex),
	}, nil
}

// Get next item.
//
// Since returned is an "interface{}",
// it have to be converted into origin type
// when using.
//
// e.g
// converted, ok := i.Next().(YOUR_TYPE)
func (i *implementation) Next() interface{} {
	if len(i.items) == 1 {
		return i.items[0]
	}

	i.mu.Lock()
	sc := i.items[i.next]
	i.next = (i.next + 1) % len(i.items)
	i.mu.Unlock()

	return sc
}
