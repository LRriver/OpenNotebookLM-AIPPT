# 开发服务器启动说明

## 首次运行
```bash
# 1. 安装依赖
cd OpenNotebookLM-AIPPT/web
# 确保处于OpenNotebookLM-AIPPT/web下
npm install 

# 2. 启动开发服务器（优先使用原生监视）⭐
npm run dev

# 3. 如果遇到 ENOSPC 错误，切换到 polling 模式
npm run dev:polling
```


## 常见问题

### ENOSPC 错误
如果 `npm run dev` 遇到 `ENOSPC: System limit for number of file watchers reached` 错误：

**快速解决（容器内）：**
```bash
# 直接运行，会自动设置环境变量并启用 polling
npm run dev:polling
```

**永久解决（宿主机，推荐）：**
```bash
# 在宿主机（非容器）执行
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
# 然后继续使用 npm run dev
```



