package main

import (
	"fmt"
	"os"
)

type point struct {
	x, y int
}

func main() {
	p := point{1, 2}
	fmt.Printf("%v\n", p) // {1 2}

	fmt.Printf("%+v\n", p) // {x:1 y:2}

	fmt.Printf("%#v\n", p) // main.point{x:1, y:2}

	fmt.Printf("%T\n", p) // main.point

	fmt.Printf("%t\n", true) // true // Formatting booleans is straight-forward

	fmt.Printf("%d\n", 123) // 123

	fmt.Printf("%b\n", 14) // 1110 // This prints a binary representation

	fmt.Printf("%c\n", 33) // ! // This prints the character corresponding to the given integer.

	fmt.Printf("%x\n", 456) // 1c8 // %x provides hex encoding

	fmt.Printf("%f\n", 78.9) // 78.900000 // For basic decimal formatting use %f

	fmt.Printf("%e\n", 123400000.0) // 1.234000e+08 // %e and %E format the float in (slightly different versions of) scientific notation
	fmt.Printf("%E\n", 123400000.0) // 1.234000E+08

	fmt.Printf("%s\n", "\"string\"") // "string"

	fmt.Printf("%q\n", "\"string\"") // "\"string\"" // To double-quote strings as in Go source, use %q

	fmt.Printf("%x\n", "hex this") // 6865782074686973 //  %x renders the string in base-16, with two output characters per byte of input

	fmt.Printf("%p\n", &p) // 0x42135100

	fmt.Printf("|%6d|%6d|%06d|\n", 12, 345, 31) // |    12|   345|000031|

	fmt.Printf("|%6.2f|%6.2f|\n", 1.2, 3.45) // |  1.20|  3.45|

	fmt.Printf("|%-6.2f|%-6.2f|\n", 1.2, 3.45) // |1.20  |3.45  |

	fmt.Printf("|%6s|%6s|\n", "foo", "b") // |   foo|     b|

	fmt.Printf("|%-6s|%-6s|\n", "foo", "b") // |foo   |b     |

	fmt.Println(fmt.Sprintf("a %s", "string")) // a string // Sprintf formats and returns a string without printing it anywhere

	_, _ = fmt.Fprintf(os.Stderr, "an %s\n", "error") // an error // You can format+print to io.Writers other than os.Stdout using Fprintf
}
