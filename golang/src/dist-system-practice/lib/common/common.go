package common

func Test(a int) int {
	return a * 10
}

func Consume(n int) int { // ok: 37-39, edge: 40
	if n == 0 {
		return 0
	}
	if n == 1 {
		return 1
	}
	return Consume(n - 1) + Consume(n - 2)
}