package main

import "fmt"

func testValueCap() {
	cint := make(chan int, 5)

	fmt.Printf("%#v\n", cint)
}

func main() {
	testValueCap()
}