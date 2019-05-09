package main

import (
	"fmt"
	"log"
	"os"
)

type point struct {
	x, y int
}

func testValue() {
	channel := make(chan int, 2)
	fmt.Printf("testValue: init:\t %#v\n", channel)

	int1 := 1
	int2 := 2

	fmt.Printf("testValue: before channel: %d %p, %d %p\n",
		int1, &int1, int2, &int2)

	channel <- int1
	channel <- int2

	fmt.Printf("testValue: <- opt done:\t %#v\n", channel)

	intO1 := <-channel
	intO2 := <-channel

	fmt.Printf("testValue: after  channel: %d %p, %d %p\n",
		intO1, &intO1, intO2, &intO2)
}

func testPointer() {
	channel := make(chan *point, 2)
	fmt.Printf("testPointer: init:\t\t %#v\n", channel)

	p1 := &point{1, 1}
	p2 := &point{2, 2}

	fmt.Printf("testPointer: before channel: %#v %p, %#v %p\n",
		p1, p1, p2, p2)

	channel <- p1
	channel <- p2

	fmt.Printf("testPointer: <- opt done:\t %#v\n", channel)

	pO1 := <-channel
	pO2 := <-channel

	fmt.Printf("testPointer: after  channel: %#v %p, %#v %p\n",
		pO1, pO1, pO2, pO2)
}

func testSlice() {
	channel := make(chan []string, 2)
	fmt.Printf("testSlice: init:\t %#v\n", channel)

	s1 := make([]string, 2)
	s2 := make([]string, 2)

	fmt.Printf("testSlice: before channel: %#v %p, %#v %p\n",
		s1, s1, s2, s2)

	channel <- s1
	channel <- s2

	fmt.Printf("testSlice: <- opt done:\t %#v\n", channel)

	sO1 := <-channel
	sO2 := <-channel

	fmt.Printf("testSlice: after  channel: %#v %p, %#v %p\n",
		sO1, sO1, sO2, sO2)
}

func testWriteExceedHang() {
	channel := make(chan int, 2)

	channel <- 1
	channel <- 2

	fmt.Printf("testWriteExceedHang: deadlock coming\n")

	channel <- 3
}

func testWriteExceedCheck() {
	channel := make(chan int, 2)

	channel <- 1
	channel <- 2

	if len(channel) == cap(channel) {
		log.Println("testWriteExceedCheck: cap: channel is full")
	} else {
		log.Println("testWriteExceedCheck: cap: channel is still writable")
	}

	select {
	case channel <- 3:
		log.Println("testWriteExceedCheck: select: channel is still writable")
	default:
		log.Println("testWriteExceedCheck: select: channel is full")
	}
}

func testReadExceedHang() {
	channel := make(chan int, 2)

	channel <- 1
	channel <- 2

	for i := 0; i < 3; i++ {
		fmt.Printf("testReadExceedHang: read[%d] from channel: %#v\n", i, <-channel)
	}
}

func testReadExceedCheck() {
	channel := make(chan int, 2)

	if len(channel) == 0 {
		log.Println("testReadExceedCheck: len: channel is empty")
	} else {
		log.Println("testReadExceedCheck: len: channel is still readable")
	}

	select {
	case i := <-channel:
		fmt.Printf("testReadExceedCheck: select: channel read: %d\n", i)
	default:
		log.Println("testReadExceedCheck: select: channel is empty")
	}
}

func testWriteExceedHangNoCap() {
	channel := make(chan int)

	fmt.Printf("testWriteExceedHangNoCap: deadlock coming\n")

	channel <- 1
}

func main() {
	act := os.Getenv("ACT")

	switch act {
	case "testValue":
		testValue()
	case "testPointer":
		testPointer()
	case "testSlice":
		testSlice()
	case "testWriteExceedHang":
		testWriteExceedHang()
	case "testWriteExceedCheck":
		testWriteExceedCheck()
	case "testReadExceedHang":
		testReadExceedHang()
	case "testReadExceedCheck":
		testReadExceedCheck()
	case "testWriteExceedHangNoCap":
		testWriteExceedHangNoCap()
	default:
		fmt.Println("No env ACT specified, do nothing")
	}
}
