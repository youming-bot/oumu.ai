# API 测试覆盖文档

## 1. /api/transcribe 路由 - 19 个测试

### `should successfully transcribe audio file`

- 验证完整的音频转录流程，包括文件检索、音频处理、Groq转录和数据库存储

### `should validate request data`

- 验证请求数据的输入验证，包括必需字段和数据类型检查

### `should return 404 if file not found`

- 验证文件不存在时返回404错误

### `should return 409 if file already has completed transcription`

- 验证文件已有完成的转录时返回冲突错误

### `should handle transcription errors`

- 验证转录过程中的错误处理和状态更新

### `should use default parameters when not provided`

- 验证使用默认参数（语言、分片时长、重叠时间）

### `should handle progress callback during transcription`

- 验证转录过程中的进度回调处理

### `should return transcripts with segments for valid fileId`

- 验证GET请求返回文件的转录和片段数据

### `should return 400 if fileId parameter is missing`

- 验证GET请求缺少fileId参数时的错误处理

### `should return 400 if fileId is not a number`

- 验证GET请求fileId不是数字时的错误处理

### `should handle transcripts without ids`

- 验证处理没有ID的转录记录时的错误

### `should delete transcript successfully`

- 验证DELETE请求成功删除转录

### `should return 400 if transcriptId parameter is missing`

- 验证DELETE请求缺少transcriptId参数时的错误

### `should return 400 if transcriptId is not a number`

- 验证DELETE请求transcriptId不是数字时的错误

### `should return 404 if transcript not found`

- 验证DELETE请求转录不存在时返回404

### `should handle database transaction errors`

- 验证数据库事务错误的处理

### `should handle malformed JSON in POST request`

- 验证POST请求格式错误的JSON处理

### `should handle database connection errors`

- 验证数据库连接错误的处理

## 2. /api/postprocess 路由 - 21 个测试

### `should successfully post-process transcript segments`

- 验证完整的后处理流程，包括OpenRouter调用和数据库更新

### `should validate request data`

- 验证后处理请求的数据验证

### `should return 404 if transcript not found`

- 验证转录不存在时返回404错误

### `should return 400 if transcript not completed`

- 验证转录未完成时返回400错误

### `should return 404 if no segments found`

- 验证没有找到片段时返回404错误

### `should work without terminology when enableTerminology is false`

- 验证禁用术语处理时的功能

### `should continue without terminology if loading fails`

- 验证术语加载失败时继续处理

### `should use default values when optional parameters not provided`

- 验证使用默认参数值

### `should handle segment matching during update`

- 验证多个片段的匹配和更新

### `should return post-processing status for transcript`

- 验证GET请求返回后处理状态

### `should return false for hasPostProcessing when no segments processed`

- 验证无后处理片段时返回false

### `should return 400 if transcriptId parameter is missing`

- 验证GET请求缺少transcriptId参数的错误

### `should return 400 if transcriptId is not a number`

- 验证GET请求transcriptId不是数字的错误

### `should update segment successfully`

- 验证PATCH请求成功更新片段

### `should validate update data`

- 验证PATCH请求的数据验证

### `should return 400 if segmentId parameter is missing`

- 验证PATCH请求缺少segmentId参数的错误

### `should return 400 if segmentId is not a number`

- 验证PATCH请求segmentId不是数字的错误

### `should return 404 if segment not found`

- 验证PATCH请求片段不存在时返回404

### `should handle partial updates`

- 验证部分字段更新功能

### `should handle malformed JSON in POST request`

- 验证POST请求格式错误的JSON处理

### `should handle OpenRouter client errors`

- 验证OpenRouter客户端错误处理

**总计：40 个测试用例，覆盖 2 个API路由的所有HTTP方法**