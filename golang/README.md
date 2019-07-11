golang
======

当前文件夹为一个自定义的`$GOPATH`，所有实际源码内容都存放在当前目录下的子目录`src`中。在本项目中，一般推荐使用`../bash/gohere.sh`，将bash的$GOPATH设置为当前文件夹，然后再进行`go get -u ...`等操作。

而src下的源码分为两部分：

```
golang/src/-
           | dist-system-practice # 实际的项目代码
           | experiment           # 一些实验性的go脚本，用来厘清go语言的一些概念
```