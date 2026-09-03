# CCM PWA 安装图标

基于用户确认的第三版圆形科技地球图标，进行尺寸导出和平台适配；没有重新设计主图。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| icon-192.png | 192×192 | 普通 PWA 图标，圆形外透明，紧凑留白 |
| icon-512.png | 512×512 | 高清普通 PWA 图标，圆形外透明 |
| icon-maskable-192.png | 192×192 | 自适应裁切，不透明深蓝底 |
| icon-maskable-512.png | 512×512 | 高清自适应裁切，不透明深蓝底 |
| apple-touch-icon.png | 180×180 | Apple 主屏幕图标，不透明深蓝底 |
| favicon-32.png | 32×32 | 浏览器标签图标，PNG 格式 |

自适应版把完整圆形主体放在画布中心直径 78% 的区域内，为平台要求的直径 80% 圆形安全区保留余量。不能用无边距普通图标同时声明 `maskable`。自适应版的最终外形由操作系统决定，不保证所有设备都显示圆形。

参考：https://web.dev/articles/maskable-icon

## 接入说明

`manifest-icons.fragment.json` 仅是 icons 字段片段，不是可独立安装的完整应用清单。
将 icons 字段合并到项目根目录的正式 manifest 中；其中路径以该根目录 manifest 为基准。不要直接把此片段挂到页面当完整 manifest 使用。

可在根目录页面 head 中加入以下引用：

```html
<link rel="apple-touch-icon" sizes="180x180" href="./assets/icons/pwa/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="./assets/icons/pwa/favicon-32.png">
```

图标已在 v27 接入根目录 index.html 与 manifest.webmanifest。安装逻辑位于 assets/pwa.js；完整部署与验收说明见根目录 PWA_DEPLOYMENT.md。

## 重新导出

在项目目录运行 `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-pwa-icons.ps1`。
生成过程使用本地图形库缩放、圆形裁切及背景合成，不发送图片到外部服务。
