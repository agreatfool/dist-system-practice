package roundrobin

import (
	"errors"
	"sync"
)

type Item interface{}

type RoundRobin interface {
	Next() *Item
}

var ErrEmptyItems = errors.New("items empty")

type implementation struct {
	items []*Item
	mu    *sync.Mutex
	next  int
}

func New(items []*Item) (RoundRobin, error) {
	if len(items) == 0 {
		return nil, ErrEmptyItems
	}

	return &implementation{
		items: items,
		mu:    new(sync.Mutex),
	}, nil
}

func (i *implementation) Next() *Item {
	i.mu.Lock()
	sc := i.items[i.next]
	i.next = (i.next + 1) % len(i.items)
	i.mu.Unlock()

	return sc
}
