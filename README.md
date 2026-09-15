# 教务智慧排课正式版原型

本目录是可以直接部署到 GitHub Pages 的纯静态版本，不需要安装依赖或运行构建命令。

## 部署方法

1. 在 GitHub 新建一个仓库。
2. 将本目录中的全部文件上传到仓库根目录，包括 `.github` 文件夹。
3. 打开仓库的 **Settings → Pages**。
4. 将 **Build and deployment → Source** 设置为 **GitHub Actions**。
5. 将文件提交或推送到 `main` 分支。
6. 在仓库的 **Actions** 页面等待 `Deploy official prototype to GitHub Pages` 执行完成。
7. 返回 **Settings → Pages** 获取公开访问地址。

也可以在仓库的 **Actions** 页面手动运行该部署流程。

## 目录说明

- `index.html`：原型入口。
- `launch.js`、`launch.css`：正式版排课流程与样式。
- `scenario.js`、`scenario.css`：复杂排课场景数据与样式。
- `formal-schedule.js`、`formal-schedule.css`：正式排课页面交互与样式。
- `ai-dialog-avatar.png`：AI 对话头像。
- `schedule-export-preview.png`：排课方案导出预览。
- `output/pdf/schedule-plan.pdf`：原型中的排课方案 PDF。
- `.github/workflows/pages.yml`：GitHub Pages 自动部署流程。
- `.nojekyll`：要求 GitHub Pages 按静态文件原样发布。

## 注意事项

- 原型为纯前端演示，不包含服务端接口和数据库。
- 页面使用 Google Fonts 和 Material Symbols，访问这些在线字体资源需要网络连接。
- 更新原型后，重新提交到 `main` 分支即可自动发布新版本。
