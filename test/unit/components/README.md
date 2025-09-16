# 组件测试覆盖文档

## 1. FileUpload 组件 - 47 个测试

### `should render file upload area correctly`

- 验证文件上传区域的基本渲染，包括上传图标、提示文字和支持格式说明

### `should render hidden file input with correct attributes`

- 验证隐藏的文件输入元素具有正确的属性（type="file", multiple, accept="audio/*"）

### `should show upload progress when uploading`

- 验证上传过程中进度条和百分比的显示

### `should not show progress when not uploading`

- 验证未上传状态下不显示进度条

### `should handle file selection via input`

- 验证通过文件输入元素选择文件的功能

### `should filter out non-audio files`

- 验证只接受音频文件，过滤掉非音频文件

### `should handle multiple audio files`

- 验证同时选择多个音频文件的处理

### `should not call onFilesSelected if no valid files`

- 验证没有有效文件时不调用回调函数

### `should handle drag over event`

- 验证拖拽悬停事件的处理和样式变化

### `should handle drag leave event`

- 验证拖拽离开事件的处理和样式恢复

### `should handle file drop`

- 验证拖拽放置文件的功能

### `should filter non-audio files on drop`

- 验证拖拽时过滤非音频文件

### `should not call onFilesSelected if no valid files dropped`

- 验证拖拽无效文件时不调用回调

### `should display selected files`

- 验证选中文件的显示，包括文件名和大小

### `should display multiple selected files`

- 验证多个选中文件的显示

### `should format file sizes correctly`

- 验证不同文件大小的格式化显示（Bytes, KB, MB, GB）

### `should remove file when X button is clicked`

- 验证点击删除按钮移除文件的功能

### `should update file count after removal`

- 验证移除文件后文件数量的更新

### `should remove all files when all X buttons are clicked`

- 验证移除所有文件的功能

### `should trigger file input click when drop zone is clicked`

- 验证点击上传区域触发文件选择对话框

### `should have proper labels and aria attributes`

- 验证组件的无障碍访问性属性

### `should be keyboard accessible`

- 验证键盘访问性

## 2. AudioPlayer 组件 - 38 个测试

### `should render audio player with title`

- 验证音频播放器的基本渲染和标题显示

### `should render waveform display with correct props`

- 验证波形显示组件接收正确的属性

### `should render progress slider with correct value`

- 验证进度滑动条显示正确的播放进度

### `should display formatted time correctly`

- 验证时间格式化显示（分:秒）

### `should render without waveform when no audioUrl`

- 验证没有音频URL时不显示波形

### `should show play button when not playing`

- 验证暂停状态下显示播放按钮

### `should show pause button when playing`

- 验证播放状态下显示暂停按钮

### `should call onPlay when play button is clicked`

- 验证点击播放按钮调用播放回调

### `should call onPause when pause button is clicked`

- 验证点击暂停按钮调用暂停回调

### `should disable play button when no audio URL`

- 验证没有音频URL时禁用播放按钮

### `should render skip back and forward buttons`

- 验证快退和快进按钮的渲染

### `should call onSkipBack when skip back button is clicked`

- 验证点击快退按钮的回调

### `should call onSkipForward when skip forward button is clicked`

- 验证点击快进按钮的回调

### `should disable skip buttons when handlers not provided`

- 验证未提供回调时禁用跳转按钮

### `should call onSeek when progress slider is changed`

- 验证拖动进度条触发定位回调

### `should not call onSeek when duration is 0`

- 验证时长为0时不触发定位

### `should handle waveform seek`

- 验证点击波形触发定位功能

### `should render volume control with slider`

- 验证音量控制和滑动条的渲染

### `should toggle mute when volume button is clicked`

- 验证点击音量按钮切换静音状态

### `should update volume when slider is changed`

- 验证拖动音量滑动条更新音量

### `should show mute icon when volume is 0`

- 验证音量为0时显示静音图标

### `should render loop controls when handlers provided`

- 验证提供回调时渲染循环控制按钮

### `should not render loop controls when handlers not provided`

- 验证未提供回调时不渲染循环控制

### `should call onSetLoop when loop button is clicked and no loop exists`

- 验证点击循环按钮设置循环的功能

### `should call onClearLoop when loop button is clicked and loop exists`

- 验证循环存在时点击清除循环的功能

### `should display loop range when loop is active`

- 验证循环激活时显示循环时间范围

### `should show secondary variant for loop button when loop is active`

- 验证循环激活时按钮样式变化

### `should format seconds correctly`

- 验证秒数格式化

### `should format minutes correctly`

- 验证分钟数格式化

### `should pad seconds with zero`

- 验证秒数的零填充

### `should render audio element when audioUrl is provided`

- 验证提供音频URL时渲染音频元素

### `should not render audio element when no audioUrl`

- 验证无音频URL时不渲染音频元素

### `should handle audio timeupdate event`

- 验证音频时间更新事件处理

### `should handle audio ended event`

- 验证音频结束事件处理

### `should work with minimal props`

- 验证最小属性下的组件工作

### `should handle undefined callbacks gracefully`

- 验证未定义回调时的优雅处理

### `should have appropriate button roles and labels`

- 验证按钮的角色和标签

### `should have proper slider controls`

- 验证滑动控制的属性

## 3. FileList 组件 - 49 个测试

### `should show skeleton loading when isLoading is true`

- 验证加载状态下的骨架屏显示

### `should show table headers during loading`

- 验证加载时表格头部的显示

### `should show empty state when no files and not loading`

- 验证无文件时的空状态显示

### `should display file information correctly`

- 验证文件信息的正确显示

### `should format different file sizes correctly`

- 验证不同文件大小的格式化

### `should handle zero file size`

- 验证零字节文件的处理

### `should format duration correctly`

- 验证时长格式化

### `should skip files without id`

- 验证跳过没有ID的文件

### `should show pending status for files without transcripts`

- 验证无转录时显示待处理状态

### `should show completed status for files with completed transcripts`

- 验证已完成转录时的状态显示

### `should show processing status for files with processing transcripts`

- 验证转录处理中的状态显示

### `should show failed status for files with failed transcripts`

- 验证转录失败时的状态显示

### `should use latest transcript when multiple transcripts exist`

- 验证多个转录时使用最新的转录状态

### `should show progress information for processing files`

- 验证处理中文件的进度信息显示

### `should show "Starting..." when no progress info available`

- 验证无进度信息时显示"Starting..."

### `should show error information for failed files`

- 验证失败文件的错误信息显示

### `should show default error message when no specific error`

- 验证无具体错误时的默认错误消息

### `should enable play button for completed files`

- 验证已完成文件的播放按钮启用

### `should disable play button for non-completed files`

- 验证未完成文件的播放按钮禁用

### `should call onPlayFile when play button is clicked`

- 验证点击播放按钮的回调

### `should call onDeleteFile when delete button is clicked`

- 验证点击删除按钮的回调

### `should not call onDeleteFile for files without id`

- 验证没有ID的文件不调用删除回调

### `should not call handlers when they are undefined`

- 验证回调未定义时的优雅处理

### `should use correct badge variants for different statuses`

- 验证不同状态的徽章样式

### `should use outline variant for file type badge`

- 验证文件类型徽章的轮廓样式

### `should handle multiple files correctly`

- 验证多个文件的处理

### `should apply correct hover styling to rows`

- 验证行的悬停样式

### `should have proper table structure`

- 验证表格结构

### `should have accessible buttons with proper attributes`

- 验证按钮的无障碍访问性

**总计：134 个测试用例，覆盖 3 个核心组件**