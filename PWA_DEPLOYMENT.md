# v27 PWA 安装部署说明

版本：frontend-2026-09-03-v27。云函数继续使用 v20，不必更新。

## 上传到现有 GitHub Pages 仓库

解压 `CCM-FRONTEND-2026-09-03-v27.zip`，按原相对位置上传以下文件：

```text
index.html
manifest.webmanifest
sw.js
offline.html
assets/pwa.js
assets/pwa.css
assets/icons/pwa/*.png
```

包中的上下文、说明和 tools 测试脚本可保留，但不是运行必需项。
不要删除仓库既有的 pdfjs/、课程资源或其他运行依赖；本包是前端更新包，不是包含全部历史资源的完整站点备份。
本地既有 index.html 引用了 pdfjs/pdf.mjs 与 pdfjs/pdf.worker.mjs，而本地没有 pdfjs 目录；此问题早于本次 PWA 修改，本包不擅自换用 PDF.js 版本。若线上已有该目录应保留；若线上也缺失需另行补齐。
账号 JSON、COS 材料目录和云函数代码不包含在此包中，避免覆盖或泄露。

所有 manifest、启动和 Service Worker 地址均为相对路径，可用于 GitHub Pages 的仓库子路径。
使用正式 HTTPS 页面安装；直接双击本地 HTML（file://）不能安装。

## 使用与验收

1. 发布完成后，刷新网页，顶部应出现“安装应用 / Install app”。未登录也应显示。
2. Chrome/Edge 等支持安装事件的浏览器，在满足安装条件后显示“立即安装 / Install now”；点击并确认。原生确认窗口的语言由系统/浏览器决定。
3. 若未收到安装事件，弹窗给出中英文浏览器菜单指引，而非显示无法点击的假安装按钮。某些内嵌浏览器不支持原生安装。
4. iPhone/iPad：Safari→分享→添加到主屏幕→添加。操作说明为中英对照。
5. 从安装后的图标打开，应以独立窗口显示，并隐藏安装入口。不依赖长期 localStorage 标记安装状态，避免卸载后入口消失。
6. 断网重新打开主页面，应看到“请连接网络 / Internet connection required”，不显示旧课程。恢复网络点击重新连接。
7. 已经打开的页面仍需联网进行登录、读取材料及保存答题；本次没有实现离线学习或离线提交队列。
8. 更新系统设置后检查学生端刷新仍能获取最新状态；原有材料、字幕、测验与看板逻辑未修改。

## 缓存规则

- Cache Storage 仅存 `offline.html`。
- Service Worker 只接管同源主目录或 index.html 的 GET 页面导航，使用网络 no-store，网络失败才返回离线说明页。
- POST、云函数、COS、视频、字幕、材料目录及其他路径不被该 fetch handler 接管或缓存。
- 缓存名包含仓库路径，升级只删除该项目自己的旧版本缓存。
- 不自动重载正在学习/作答的窗口；联网重新打开或刷新时获取新的页面。
- 未来修改离线页或 Service Worker 时更新 sw.js 的缓存版本号；修改图标后旧安装的图标更新节奏受系统控制，必要时重新安装。

## 已执行检查

```text
node tools/check-inline-scripts.js index.html
node --check assets/pwa.js
node --check sw.js
node tools/test-pwa.cjs
```

自动化测试涵盖 manifest 子目录路径、PNG 尺寸、安装/取消/已安装/iOS/非安全来源/注册失败提示，以及离线回退、敏感接口绕过和缓存隔离。
本地浏览器已检查安装按钮、双语弹窗及布局；停止本地服务器后重新加载，也验证了实际 Service Worker 返回中英文离线说明页。尚未执行正式站点部署或真实设备原生安装。

参考：[安装体验](https://web.dev/articles/customize-install)、[可安装 PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)。
