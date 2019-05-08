Golang Channel Test
===================

## testValueCap
* 测试对象：值
* 测试通道：有容量上限
* 测试目的：测试`值`在进出channel之后的地址变化

运行：

```bash
$ MODE=testValueCap go run channel.go
# testValueCap: init:              (chan int)(0xc0000a6000)
# testValueCap: values before channel: 1 0xc0000b0000, 2 0xc0000b0008
# testValueCap: <- opt done:       (chan int)(0xc0000a6000)
# testValueCap: values after  channel: 1 0xc0000b0020, 2 0xc0000b0028
```

## testPointerCap
* 测试对象：指针
* 测试通道：有容量上限
* 测试目的：测试`指针`在进出channel之后的地址变化

运行：

```bash

```
