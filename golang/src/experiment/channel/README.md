Golang Channel Test
===================

## testValue
* 测试对象：值
* 测试目的：测试`值`在进出channel之后的地址变化
* 测试结果：进出之后的地址改变，代表进出channel的是`拷贝`

运行：

```bash
$ ACT=testValue go run channel.go

# testValue: init:         (chan int)(0xc000094000)
# testValue: before channel: 1 0xc0000a0000, 2 0xc0000a0008
# testValue: <- opt done:  (chan int)(0xc000094000)
# testValue: after  channel: 1 0xc0000140c8, 2 0xc0000140d0
```

## testPointer
* 测试对象：指针
* 测试目的：测试`指针`在进出channel之后的地址变化
* 测试结论：进出channel之后，指针保持`原地址`

运行：

```bash
$ ACT=testPointer go run channel.go

# testPointer: init:               (chan *main.point)(0xc0000900c0)
# testPointer: before channel: &main.point{x:1, y:1} 0xc00009c000, &main.point{x:2, y:2} 0xc00009c010
# testPointer: <- opt done:        (chan *main.point)(0xc0000900c0)
# testPointer: after  channel: &main.point{x:1, y:1} 0xc00009c000, &main.point{x:2, y:2} 0xc00009c010
```

## testSlice
* 测试对象：切片
* 测试目的：测试`切片`在进出channel之后的地址变化
* 测试结论：进出channel之后，`切片`保持`原地址`；注意，这里的切片用的是值，而不是指针

运行：

```bash
$ ACT=testSlice go run channel.go

# testSlice: init:         (chan []string)(0xc0000980c0)
# testSlice: before channel: []string{"", ""} 0xc0000a6000, []string{"", ""} 0xc0000a6020
# testSlice: <- opt done:  (chan []string)(0xc0000980c0)
# testSlice: after  channel: []string{"", ""} 0xc0000a6000, []string{"", ""} 0xc0000a6020
```

## testWriteExceedHang
* 测试对象：channel超写导致死锁
* 测试目的：测试容量满了之后向channel写入数据的结果
* 测试结论：channel满之后，写入行为会进入等待，routine会sleep，然后如果当前所有routine都进入sleep，即deadlock

运行：

```bash
$ ACT=testWriteExceedHang go run channel.go

# testWriteExceedHang: deadlock coming
# fatal error: all goroutines are asleep - deadlock!
# 
# goroutine 1 [chan send]:
# main.testWriteExceedHang()
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:86 +0xd0
# main.main()
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:108 +0x15b
# exit status 2
```

## testWriteExceedCheck
* 测试对象：channel容量
* 测试目的：测试检查通道容量方法
* 测试结论：select可以兜底，使用cap和len也可以检查

运行：

```bash
$ ACT=testWriteExceedCheck go run channel.go 

# 2019/05/XX XX:11:26 testWriteExceedCheck: cap: channel is full
# 2019/05/XX XX:11:26 testWriteExceedCheck: select: channel is full
```

## testReadExceedHang
* 测试对象：channel超读导致死锁
* 测试目的：测试容量满了之后向channel读取数据的结果
* 测试结论：channel满之后，读取行为会进入等待，routine会sleep，然后如果当前所有routine都进入sleep，即deadlock

运行：

```bash
$ ACT=testReadExceedHang go run channel.go

# testReadExceedHang: read[0] from channel: 1
# testReadExceedHang: read[1] from channel: 2
# fatal error: all goroutines are asleep - deadlock!
# 
# goroutine 1 [chan receive]:
# main.testReadExceed()
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:117 +0xae
# main.main()
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:136 +0x1ff
# exit status 2
```

## testReadExceedCheck
* 测试对象：channel容量
* 测试目的：测试检查通道容量方法
* 测试结论：select可以兜底，使用len也可以检查

运行：

```bash
$ ACT=testReadExceedCheck go run channel.go 

# 2019/05/XX XX:01:36 testReadExceedCheck: len: channel is empty
# 2019/05/XX XX:01:36 testReadExceedCheck: select: channel is empty
```

## testWriteExceedHangNoCap
* 测试对象：无buffer channel超写导致死锁
* 测试目的：测试向无buffer channel写入数据的结果
* 测试结论：因为channel无buffer，写入必须要有消费，否则会进入等待，routine会sleep，然后如果当前所有routine都进入sleep，即deadlock

运行：

```bash
$ ACT=testWriteExceedHangNoCap go run channel.go 

# testWriteExceedHangNoCap: deadlock coming
# fatal error: all goroutines are asleep - deadlock!
# 
# goroutine 1 [chan send]:
# main.testWriteExceedHangNoCap(...)
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:143
# main.main()
#         /.../dist-system-practice/golang/src/experiment/channel/channel.go:165 +0x31e
# exit status 2
```