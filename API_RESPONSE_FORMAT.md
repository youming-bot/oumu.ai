# Groq Transcription API Response Format

## 概述

API现在返回完整的Groq verbose_json格式数据，包含精确的时间戳和详细的元数据。

## 响应格式

```json
{
  "success": true,
  "data": {
    "text": "完整的转录文本",
    "language": "检测到的语言代码",
    "segments": [
      {
        "id": 1,
        "text": "_segment文本_",
        "startTime": 开始时间,
        "endTime": 结束时间,
        "seek": 搜索位置,
        "tokens": [token数组],
        "temperature": 温度值,
        "avg_logprob": 平均对数概率,
        "compression_ratio": 压缩比,
        "no_speech_prob": 无语音概率
      }
    ],
    "chunks": [
      {
        "chunkIndex": 块索引,
        "text": "块的转录文本",
        "segments": [原始segments数组],
        "language": "检测到的语言"
      }
    ]
  }
}
```

## 关键改进

### 1. 完整的Groq数据
- 返回所有Groq提供的元数据
- 包含tokens、temperature、logprob等信息
- 精确到毫秒的时间戳

### 2. 智能时间偏移
- 自动处理多个音频块的时间偏移
- 基于实际音频长度计算偏移量
- 避免时间重叠或间隙

### 3. 内容过滤
- 过滤掉静音或默认转录结果
- 只返回有实际语音内容的segments
- 提高转录结果的准确性

## 测试建议

### 真实音频文件测试

使用包含实际语音内容的音频文件进行测试：

1. **上传真实音频** - MP3、WAV、M4A等格式
2. **多段语音** - 包含不同的句子或段落
3. **不同语言** - 测试语言检测功能
4. **较长音频** - 测试多块处理能力

### 预期结果

对于真实音频文件，API应该返回：

- ✅ 不同的转录文本（不是重复的相同内容）
- ✅ 连续的时间戳（从0开始递增）
- ✅ 准确的语言检测
- ✅ 详细的segments信息

## 示例

**好的结果（真实音频）**：
```json
{
  "text": "こんにちは。今日は良い天気ですね。公園を散歩しましょう。",
  "segments": [
    {"id": 1, "text": "こんにちは。", "startTime": 0, "endTime": 1.5},
    {"id": 2, "text": "今日は良い天気ですね。", "startTime": 1.5, "endTime": 4.2},
    {"id": 3, "text": "公園を散歩しましょう。", "startTime": 4.2, "endTime": 7.8}
  ]
}
```

**测试结果（空音频）**：
```json
{
  "text": "ご視聴ありがとうございました",
  "segments": [
    {"id": 1, "text": "ご視聴ありがとうございました", "startTime": 0, "endTime": 29.98}
  ]
}
```

## 故障排除

如果仍然看到重复的转录结果：

1. **检查音频文件** - 确保包含实际语音内容
2. **检查音频格式** - 确保音频文件格式正确
3. **检查音频质量** - 确保音频清晰可听
4. **检查文件大小** - 确保文件在合理范围内

## 技术细节

- 使用Groq Whisper-large-v3-turbo模型
- 支持verbose_json响应格式
- 自动处理音频分块和合并
- 智能过滤静音内容