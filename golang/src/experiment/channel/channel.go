package main

import (
	"fmt"
	"os"
)

type point struct {
	x, y int
}

func testValueCap() {
	cint := make(chan int, 2)
	fmt.Printf("testValueCap: init:\t\t %#v\n", cint)

	int1 := 1
	int2 := 2

	fmt.Printf("testValueCap: values before channel: %d %p, %d %p\n",
		int1, &int1, int2, &int2)

	cint <- int1
	cint <- int2

	fmt.Printf("testValueCap: <- opt done:\t %#v\n", cint)

	intO1 := <-cint
	intO2 := <-cint

	fmt.Printf("testValueCap: values after  channel: %d %p, %d %p\n",
		intO1, &intO1, intO2, &intO2)
}

func testPointerCap() {

}

func main() {
	mode := os.Getenv("MODE")

	switch mode {
	case "testValueCap":
		testValueCap()
	case "testPointerCap":
		testPointerCap()
	default:
		fmt.Println("No env MODE specified, do nothing")
	}
}
