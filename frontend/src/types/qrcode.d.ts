// qrcode 缺少官方类型声明，这里给出极简声明（仅用到的 toDataURL）
declare module 'qrcode' {
  const QRCode: {
    toDataURL: (text: string, options?: { margin?: number; width?: number }) => Promise<string>
  }
  export default QRCode
}
