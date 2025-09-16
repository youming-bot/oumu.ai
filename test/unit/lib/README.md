# 服务层测试覆盖文档

## 1. SubtitleSynchronizer - 16 个测试

### `should initialize with segments and default options`

- 验证使用片段和默认选项初始化同步器

### `should initialize with custom options`

- 验证使用自定义选项初始化同步器

### `should filter out segments without required fields`

- 验证过滤掉缺少必需字段的片段

### `should sort segments by start time`

- 验证按开始时间排序片段

### `should find current subtitle at specific time`

- 验证在特定时间找到当前字幕

### `should return null for current subtitle when between segments`

- 验证在片段间隙时返回空的当前字幕

### `should identify upcoming subtitles`

- 验证识别即将到来的字幕

### `should identify previous subtitles`

- 验证识别之前的字幕

### `should limit upcoming subtitles to maxSubtitles`

- 验证限制即将到来的字幕数量

### `should call update callback when time changes`

- 验证时间变化时调用更新回调

### `should find subtitle at specific time`

- 验证在特定时间找到字幕

### `should return null if no subtitle at time`

- 验证没有字幕时返回null

### `should find nearest subtitle`

- 验证找到最近的字幕

### `should return null for nearest subtitle with empty segments`

- 验证空片段时返回null

### `should get subtitle text at time`

- 验证获取特定时间的字幕文本

### `should return empty string for no subtitle at time`

- 验证没有字幕时返回空字符串

### `should get subtitles in range`

- 验证获取时间范围内的字幕

### `should seek to subtitle by id`

- 验证通过ID定位到字幕

### `should return null when seeking to non-existent subtitle`

- 验证定位不存在字幕时返回null

### `should consider preload time for active subtitles`

- 验证预加载时间对激活字幕的影响

### `should consider postload time for active subtitles`

- 验证后加载时间对激活字幕的影响

### `should clean up resources on destroy`

- 验证销毁时清理资源

## 2. SubtitleRenderer - 8 个测试

### `should render subtitle with normalized text`

- 验证使用规范化文本渲染字幕

### `should fall back to original text if no normalized text`

- 验证没有规范化文本时回退到原文

### `should include translation when requested`

- 验证请求时包含翻译

### `should not include translation when not requested`

- 验证不请求时不包含翻译

### `should handle subtitle without translation`

- 验证处理没有翻译的字幕

### `should return empty string for null subtitle`

- 验证null字幕返回空字符串

### `should create subtitle element with correct attributes`

- 验证创建具有正确属性的字幕元素

### `should create inactive subtitle element`

- 验证创建非激活状态的字幕元素

### `should include translation in element content`

- 验证在元素内容中包含翻译

## 3. ABLoopManager - 8 个测试

### `should set loop correctly`

- 验证正确设置循环

### `should clear loop correctly`

- 验证正确清除循环

### `should detect when to loop back`

- 验证检测何时循环回放

### `should not loop when within range`

- 验证在范围内时不循环

### `should not loop when not active`

- 验证未激活时不循环

### `should not loop when end time is before start time`

- 验证结束时间在开始时间前时不循环

### `should call loop callback when looping`

- 验证循环时调用回调

### `should not call callback when not looping`

- 验证不循环时不调用回调

## 4. Database Operations - 56 个测试

### 文件操作 (12 个测试)

#### `should add file successfully`

- 验证成功添加文件到数据库

#### `should get all files ordered by creation date`

- 验证按创建日期排序获取所有文件

#### `should update file successfully`

- 验证成功更新文件

#### `should delete file and cascade delete transcripts and segments`

- 验证删除文件并级联删除转录和片段

#### `should return undefined for non-existent file`

- 验证不存在的文件返回undefined

### 转录操作 (11 个测试)

#### `should add transcript successfully`

- 验证成功添加转录

#### `should get transcripts by file ID`

- 验证按文件ID获取转录

#### `should update transcript successfully`

- 验证成功更新转录

#### `should delete transcript and cascade delete segments`

- 验证删除转录并级联删除片段

### 片段操作 (11 个测试)

#### `should add multiple segments in bulk`

- 验证批量添加多个片段

#### `should get segments by transcript ID sorted by start time`

- 验证按转录ID获取片段并按开始时间排序

#### `should find segment at specific time`

- 验证在特定时间找到片段

#### `should update segment successfully`

- 验证成功更新片段

#### `should delete segment successfully`

- 验证成功删除片段

### 术语操作 (10 个测试)

#### `should add term successfully`

- 验证成功添加术语

#### `should get all terms ordered by creation date`

- 验证按创建日期排序获取所有术语

#### `should search terms by query`

- 验证按查询搜索术语

#### `should search terms by meaning`

- 验证按含义搜索术语

#### `should get terms by category`

- 验证按类别获取术语

#### `should get terms by tag`

- 验证按标签获取术语

#### `should update term successfully`

- 验证成功更新术语

#### `should delete term successfully`

- 验证成功删除术语

### 复杂操作 (8 个测试)

#### `should get file with transcripts`

- 验证获取文件及其转录

#### `should get transcript with segments`

- 验证获取转录及其片段

#### `should get database statistics`

- 验证获取数据库统计信息

#### `should backup and restore database`

- 验证数据库备份和恢复功能

### 错误处理 (4 个测试)

#### `should handle non-existent file in getFileWithTranscripts`

- 验证处理不存在文件的错误

#### `should handle non-existent transcript in getTranscriptWithSegments`

- 验证处理不存在转录的错误

#### `should handle database operations gracefully`

- 验证优雅处理数据库操作

## 5. File Upload Utilities - 28 个测试

### validateFile() (5 个测试)

#### `should validate valid audio file`

- 验证有效音频文件通过验证

#### `should reject non-audio files`

- 验证非音频文件被拒绝

#### `should reject files larger than 100MB`

- 验证超大文件被拒绝

#### `should reject empty files`

- 验证空文件被拒绝

#### `should return multiple errors for invalid files`

- 验证多重问题文件返回多个错误

### uploadFile() (4 个测试)

#### `should upload valid audio file`

- 验证成功上传有效音频文件

#### `should throw error for invalid file type`

- 验证无效文件类型抛出错误

#### `should throw error for oversized file`

- 验证超大文件抛出错误

#### `should handle database errors during upload`

- 验证上传时数据库错误处理

### getFileBlob() (3 个测试)

#### `should return file blob when file exists`

- 验证文件存在时返回blob数据

#### `should throw error when file not found`

- 验证文件不存在时抛出错误

#### `should rethrow database errors`

- 验证重新抛出数据库错误

### 其他操作 (16 个测试)

- 涵盖文件URL创建、文件列表获取、文件删除、元数据更新、文件信息获取、存储使用统计等功能

## 6. Time Formatting Utilities - 13 个测试

### formatTime (6 个测试)

#### `should format seconds correctly`

- 验证正确格式化秒数

#### `should format minutes correctly`

- 验证正确格式化分钟数

#### `should handle decimal seconds`

- 验证处理小数秒

#### `should pad numbers correctly`

- 验证正确填充数字

### parseTime (7 个测试)

#### `should parse MM:SS format`

- 验证解析MM:SS格式

#### `should parse MM:SS.MS format`

- 验证解析MM:SS.MS格式

#### `should parse HH:MM:SS format`

- 验证解析HH:MM:SS格式

#### `should parse HH:MM:SS.MS format`

- 验证解析HH:MM:SS.MS格式

#### `should parse plain number`

- 验证解析纯数字

#### `should handle invalid formats gracefully`

- 验证优雅处理无效格式

**总计：121 个测试用例，覆盖字幕同步、数据库操作、文件处理、时间格式化等核心服务层功能**