// Code generated by protoc-gen-go. DO NOT EDIT.
// source: book.proto

package message

import (
	context "context"
	fmt "fmt"
	proto "github.com/golang/protobuf/proto"
	grpc "google.golang.org/grpc"
	math "math"
)

// Reference imports to suppress errors if they are not otherwise used.
var _ = proto.Marshal
var _ = fmt.Errorf
var _ = math.Inf

// This is a compile-time assertion to ensure that this generated file
// is compatible with the proto package it is being compiled against.
// A compilation error at this line likely means your copy of the
// proto package needs to be updated.
const _ = proto.ProtoPackageIsVersion3 // please upgrade the proto package

type Book struct {
	Isbn                 int64    `protobuf:"varint,1,opt,name=isbn,proto3" json:"isbn,omitempty"`
	Title                string   `protobuf:"bytes,2,opt,name=title,proto3" json:"title,omitempty"`
	Author               string   `protobuf:"bytes,3,opt,name=author,proto3" json:"author,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *Book) Reset()         { *m = Book{} }
func (m *Book) String() string { return proto.CompactTextString(m) }
func (*Book) ProtoMessage()    {}
func (*Book) Descriptor() ([]byte, []int) {
	return fileDescriptor_1e89d0eaa98dc5d8, []int{0}
}

func (m *Book) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_Book.Unmarshal(m, b)
}
func (m *Book) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_Book.Marshal(b, m, deterministic)
}
func (m *Book) XXX_Merge(src proto.Message) {
	xxx_messageInfo_Book.Merge(m, src)
}
func (m *Book) XXX_Size() int {
	return xxx_messageInfo_Book.Size(m)
}
func (m *Book) XXX_DiscardUnknown() {
	xxx_messageInfo_Book.DiscardUnknown(m)
}

var xxx_messageInfo_Book proto.InternalMessageInfo

func (m *Book) GetIsbn() int64 {
	if m != nil {
		return m.Isbn
	}
	return 0
}

func (m *Book) GetTitle() string {
	if m != nil {
		return m.Title
	}
	return ""
}

func (m *Book) GetAuthor() string {
	if m != nil {
		return m.Author
	}
	return ""
}

type GetBookRequest struct {
	Isbn                 int64    `protobuf:"varint,1,opt,name=isbn,proto3" json:"isbn,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetBookRequest) Reset()         { *m = GetBookRequest{} }
func (m *GetBookRequest) String() string { return proto.CompactTextString(m) }
func (*GetBookRequest) ProtoMessage()    {}
func (*GetBookRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_1e89d0eaa98dc5d8, []int{1}
}

func (m *GetBookRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetBookRequest.Unmarshal(m, b)
}
func (m *GetBookRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetBookRequest.Marshal(b, m, deterministic)
}
func (m *GetBookRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetBookRequest.Merge(m, src)
}
func (m *GetBookRequest) XXX_Size() int {
	return xxx_messageInfo_GetBookRequest.Size(m)
}
func (m *GetBookRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_GetBookRequest.DiscardUnknown(m)
}

var xxx_messageInfo_GetBookRequest proto.InternalMessageInfo

func (m *GetBookRequest) GetIsbn() int64 {
	if m != nil {
		return m.Isbn
	}
	return 0
}

type GetBookViaAuthorRequest struct {
	Author               string   `protobuf:"bytes,1,opt,name=author,proto3" json:"author,omitempty"`
	XXX_NoUnkeyedLiteral struct{} `json:"-"`
	XXX_unrecognized     []byte   `json:"-"`
	XXX_sizecache        int32    `json:"-"`
}

func (m *GetBookViaAuthorRequest) Reset()         { *m = GetBookViaAuthorRequest{} }
func (m *GetBookViaAuthorRequest) String() string { return proto.CompactTextString(m) }
func (*GetBookViaAuthorRequest) ProtoMessage()    {}
func (*GetBookViaAuthorRequest) Descriptor() ([]byte, []int) {
	return fileDescriptor_1e89d0eaa98dc5d8, []int{2}
}

func (m *GetBookViaAuthorRequest) XXX_Unmarshal(b []byte) error {
	return xxx_messageInfo_GetBookViaAuthorRequest.Unmarshal(m, b)
}
func (m *GetBookViaAuthorRequest) XXX_Marshal(b []byte, deterministic bool) ([]byte, error) {
	return xxx_messageInfo_GetBookViaAuthorRequest.Marshal(b, m, deterministic)
}
func (m *GetBookViaAuthorRequest) XXX_Merge(src proto.Message) {
	xxx_messageInfo_GetBookViaAuthorRequest.Merge(m, src)
}
func (m *GetBookViaAuthorRequest) XXX_Size() int {
	return xxx_messageInfo_GetBookViaAuthorRequest.Size(m)
}
func (m *GetBookViaAuthorRequest) XXX_DiscardUnknown() {
	xxx_messageInfo_GetBookViaAuthorRequest.DiscardUnknown(m)
}

var xxx_messageInfo_GetBookViaAuthorRequest proto.InternalMessageInfo

func (m *GetBookViaAuthorRequest) GetAuthor() string {
	if m != nil {
		return m.Author
	}
	return ""
}

func init() {
	proto.RegisterType((*Book)(nil), "message.Book")
	proto.RegisterType((*GetBookRequest)(nil), "message.GetBookRequest")
	proto.RegisterType((*GetBookViaAuthorRequest)(nil), "message.GetBookViaAuthorRequest")
}

func init() { proto.RegisterFile("book.proto", fileDescriptor_1e89d0eaa98dc5d8) }

var fileDescriptor_1e89d0eaa98dc5d8 = []byte{
	// 232 bytes of a gzipped FileDescriptorProto
	0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02, 0xff, 0xe2, 0xe2, 0x4a, 0xca, 0xcf, 0xcf,
	0xd6, 0x2b, 0x28, 0xca, 0x2f, 0xc9, 0x17, 0x62, 0xcf, 0x4d, 0x2d, 0x2e, 0x4e, 0x4c, 0x4f, 0x55,
	0xf2, 0xe0, 0x62, 0x71, 0xca, 0xcf, 0xcf, 0x16, 0x12, 0xe2, 0x62, 0xc9, 0x2c, 0x4e, 0xca, 0x93,
	0x60, 0x54, 0x60, 0xd4, 0x60, 0x0e, 0x02, 0xb3, 0x85, 0x44, 0xb8, 0x58, 0x4b, 0x32, 0x4b, 0x72,
	0x52, 0x25, 0x98, 0x14, 0x18, 0x35, 0x38, 0x83, 0x20, 0x1c, 0x21, 0x31, 0x2e, 0xb6, 0xc4, 0xd2,
	0x92, 0x8c, 0xfc, 0x22, 0x09, 0x66, 0xb0, 0x30, 0x94, 0xa7, 0xa4, 0xc2, 0xc5, 0xe7, 0x9e, 0x5a,
	0x02, 0x32, 0x2c, 0x28, 0xb5, 0xb0, 0x34, 0xb5, 0xb8, 0x04, 0x9b, 0x99, 0x4a, 0x86, 0x5c, 0xe2,
	0x50, 0x55, 0x61, 0x99, 0x89, 0x8e, 0x60, 0x9d, 0x30, 0xe5, 0x08, 0x83, 0x19, 0x91, 0x0d, 0x36,
	0x6a, 0x65, 0xe2, 0xe2, 0x06, 0x69, 0x08, 0x4e, 0x2d, 0x2a, 0xcb, 0x4c, 0x4e, 0x15, 0x32, 0xe6,
	0x62, 0x87, 0x1a, 0x21, 0x24, 0xae, 0x07, 0xf5, 0x87, 0x1e, 0xaa, 0xd5, 0x52, 0xbc, 0x70, 0x09,
	0x90, 0xa8, 0x12, 0x83, 0x90, 0x07, 0x97, 0x20, 0x54, 0x49, 0x31, 0xdc, 0x62, 0x21, 0x05, 0x74,
	0xed, 0xe8, 0x6e, 0xc2, 0x30, 0xc7, 0x80, 0x51, 0xc8, 0x96, 0x8b, 0xdf, 0x3d, 0xb5, 0xc4, 0xbd,
	0x28, 0x35, 0xb1, 0x24, 0xb5, 0x98, 0x44, 0x67, 0x68, 0x30, 0x0a, 0x59, 0x70, 0x71, 0xc0, 0x1c,
	0x42, 0x8a, 0x3e, 0x03, 0xc6, 0x24, 0x36, 0x70, 0xd4, 0x19, 0x03, 0x02, 0x00, 0x00, 0xff, 0xff,
	0x26, 0xa0, 0x1c, 0x86, 0xc8, 0x01, 0x00, 0x00,
}

// Reference imports to suppress errors if they are not otherwise used.
var _ context.Context
var _ grpc.ClientConn

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
const _ = grpc.SupportPackageIsVersion4

// BookServiceClient is the client API for BookService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
type BookServiceClient interface {
	GetBook(ctx context.Context, in *GetBookRequest, opts ...grpc.CallOption) (*Book, error)
	GetBooksViaAuthor(ctx context.Context, in *GetBookViaAuthorRequest, opts ...grpc.CallOption) (BookService_GetBooksViaAuthorClient, error)
	GetGreatestBook(ctx context.Context, opts ...grpc.CallOption) (BookService_GetGreatestBookClient, error)
	GetBooks(ctx context.Context, opts ...grpc.CallOption) (BookService_GetBooksClient, error)
}

type bookServiceClient struct {
	cc *grpc.ClientConn
}

func NewBookServiceClient(cc *grpc.ClientConn) BookServiceClient {
	return &bookServiceClient{cc}
}

func (c *bookServiceClient) GetBook(ctx context.Context, in *GetBookRequest, opts ...grpc.CallOption) (*Book, error) {
	out := new(Book)
	err := c.cc.Invoke(ctx, "/message.BookService/GetBook", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *bookServiceClient) GetBooksViaAuthor(ctx context.Context, in *GetBookViaAuthorRequest, opts ...grpc.CallOption) (BookService_GetBooksViaAuthorClient, error) {
	stream, err := c.cc.NewStream(ctx, &_BookService_serviceDesc.Streams[0], "/message.BookService/GetBooksViaAuthor", opts...)
	if err != nil {
		return nil, err
	}
	x := &bookServiceGetBooksViaAuthorClient{stream}
	if err := x.ClientStream.SendMsg(in); err != nil {
		return nil, err
	}
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	return x, nil
}

type BookService_GetBooksViaAuthorClient interface {
	Recv() (*Book, error)
	grpc.ClientStream
}

type bookServiceGetBooksViaAuthorClient struct {
	grpc.ClientStream
}

func (x *bookServiceGetBooksViaAuthorClient) Recv() (*Book, error) {
	m := new(Book)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (c *bookServiceClient) GetGreatestBook(ctx context.Context, opts ...grpc.CallOption) (BookService_GetGreatestBookClient, error) {
	stream, err := c.cc.NewStream(ctx, &_BookService_serviceDesc.Streams[1], "/message.BookService/GetGreatestBook", opts...)
	if err != nil {
		return nil, err
	}
	x := &bookServiceGetGreatestBookClient{stream}
	return x, nil
}

type BookService_GetGreatestBookClient interface {
	Send(*GetBookRequest) error
	CloseAndRecv() (*Book, error)
	grpc.ClientStream
}

type bookServiceGetGreatestBookClient struct {
	grpc.ClientStream
}

func (x *bookServiceGetGreatestBookClient) Send(m *GetBookRequest) error {
	return x.ClientStream.SendMsg(m)
}

func (x *bookServiceGetGreatestBookClient) CloseAndRecv() (*Book, error) {
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	m := new(Book)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (c *bookServiceClient) GetBooks(ctx context.Context, opts ...grpc.CallOption) (BookService_GetBooksClient, error) {
	stream, err := c.cc.NewStream(ctx, &_BookService_serviceDesc.Streams[2], "/message.BookService/GetBooks", opts...)
	if err != nil {
		return nil, err
	}
	x := &bookServiceGetBooksClient{stream}
	return x, nil
}

type BookService_GetBooksClient interface {
	Send(*GetBookRequest) error
	Recv() (*Book, error)
	grpc.ClientStream
}

type bookServiceGetBooksClient struct {
	grpc.ClientStream
}

func (x *bookServiceGetBooksClient) Send(m *GetBookRequest) error {
	return x.ClientStream.SendMsg(m)
}

func (x *bookServiceGetBooksClient) Recv() (*Book, error) {
	m := new(Book)
	if err := x.ClientStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

// BookServiceServer is the server API for BookService service.
type BookServiceServer interface {
	GetBook(context.Context, *GetBookRequest) (*Book, error)
	GetBooksViaAuthor(*GetBookViaAuthorRequest, BookService_GetBooksViaAuthorServer) error
	GetGreatestBook(BookService_GetGreatestBookServer) error
	GetBooks(BookService_GetBooksServer) error
}

func RegisterBookServiceServer(s *grpc.Server, srv BookServiceServer) {
	s.RegisterService(&_BookService_serviceDesc, srv)
}

func _BookService_GetBook_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetBookRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(BookServiceServer).GetBook(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/message.BookService/GetBook",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(BookServiceServer).GetBook(ctx, req.(*GetBookRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _BookService_GetBooksViaAuthor_Handler(srv interface{}, stream grpc.ServerStream) error {
	m := new(GetBookViaAuthorRequest)
	if err := stream.RecvMsg(m); err != nil {
		return err
	}
	return srv.(BookServiceServer).GetBooksViaAuthor(m, &bookServiceGetBooksViaAuthorServer{stream})
}

type BookService_GetBooksViaAuthorServer interface {
	Send(*Book) error
	grpc.ServerStream
}

type bookServiceGetBooksViaAuthorServer struct {
	grpc.ServerStream
}

func (x *bookServiceGetBooksViaAuthorServer) Send(m *Book) error {
	return x.ServerStream.SendMsg(m)
}

func _BookService_GetGreatestBook_Handler(srv interface{}, stream grpc.ServerStream) error {
	return srv.(BookServiceServer).GetGreatestBook(&bookServiceGetGreatestBookServer{stream})
}

type BookService_GetGreatestBookServer interface {
	SendAndClose(*Book) error
	Recv() (*GetBookRequest, error)
	grpc.ServerStream
}

type bookServiceGetGreatestBookServer struct {
	grpc.ServerStream
}

func (x *bookServiceGetGreatestBookServer) SendAndClose(m *Book) error {
	return x.ServerStream.SendMsg(m)
}

func (x *bookServiceGetGreatestBookServer) Recv() (*GetBookRequest, error) {
	m := new(GetBookRequest)
	if err := x.ServerStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

func _BookService_GetBooks_Handler(srv interface{}, stream grpc.ServerStream) error {
	return srv.(BookServiceServer).GetBooks(&bookServiceGetBooksServer{stream})
}

type BookService_GetBooksServer interface {
	Send(*Book) error
	Recv() (*GetBookRequest, error)
	grpc.ServerStream
}

type bookServiceGetBooksServer struct {
	grpc.ServerStream
}

func (x *bookServiceGetBooksServer) Send(m *Book) error {
	return x.ServerStream.SendMsg(m)
}

func (x *bookServiceGetBooksServer) Recv() (*GetBookRequest, error) {
	m := new(GetBookRequest)
	if err := x.ServerStream.RecvMsg(m); err != nil {
		return nil, err
	}
	return m, nil
}

var _BookService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "message.BookService",
	HandlerType: (*BookServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "GetBook",
			Handler:    _BookService_GetBook_Handler,
		},
	},
	Streams: []grpc.StreamDesc{
		{
			StreamName:    "GetBooksViaAuthor",
			Handler:       _BookService_GetBooksViaAuthor_Handler,
			ServerStreams: true,
		},
		{
			StreamName:    "GetGreatestBook",
			Handler:       _BookService_GetGreatestBook_Handler,
			ClientStreams: true,
		},
		{
			StreamName:    "GetBooks",
			Handler:       _BookService_GetBooks_Handler,
			ServerStreams: true,
			ClientStreams: true,
		},
	},
	Metadata: "book.proto",
}