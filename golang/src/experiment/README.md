experiment
==========

当前文件夹下的所有代码都是为加深对go语言的一些概念的理解而制作的一系列实验性脚本。

## 模块
当前文件夹内所有代码共享一份`go.mod`文件，所有使用到的第三方代码包都包含在该文件中。

## 实验代码清单

* channel：针对go语言的channel进行的针对性测试脚本，细节可以阅读该文件夹下的README文档
* cpu：该脚本包含一个比较消耗CPU的函数，可将这段代码拷贝到其他任何需要对CPU进行测试地方进行使用
* goroutine：对goroutine进行测试的脚本
* grpc：对go语言使用gRPC进行试验的脚本，细节可以阅读该文件夹下的README文档
* kafka：使用`github.com/segmentio/kafka-go`操作kafka的试验代码，细节可以阅读该文件夹下的README文档
* memory：对go语言内存模式及回收机制进行测试的脚本，具体使用及命令行下的参数可以直接查看脚本内的flag配置
* pipeline：对go语言自制pipeline进行routine终止通知的测试代码
* print：一些打印方法的范例代码