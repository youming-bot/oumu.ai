// 简单的转录功能测试脚本
const fs = require('fs');
const path = require('path');

// 测试音频处理和转录流程
async function testTranscription() {
  console.log('🧪 开始测试转录功能...');

  try {
    // 1. 测试音频文件是否存在
    const testAudioPath = path.join(__dirname, 'public', 'test-audio.wav');
    if (fs.existsSync(testAudioPath)) {
      console.log('✅ 测试音频文件存在');
    } else {
      console.log('⚠️ 测试音频文件不存在，跳过音频测试');
    }

    // 2. 测试环境变量
    const groqApiKey = process.env.GROQ_API_KEY;
    console.log('🔑 GROQ_API_KEY:', groqApiKey ? '已设置' : '未设置');

    // 3. 测试 API 端点
    console.log('🌐 测试 API 端点...');

    // 4. 模拟一个简单的转录请求
    const testData = {
      fileData: {
        name: 'test-audio.wav',
        size: 1024,
        type: 'audio/wav',
        duration: 10,
        arrayBuffer: { data: [1, 2, 3, 4, 5] }
      },
      language: 'ja',
      chunkSeconds: 45,
      overlap: 0.2,
      chunks: [
        {
          arrayBuffer: { data: [1, 2, 3, 4, 5] },
          startTime: 0,
          endTime: 10,
          duration: 10,
          index: 0
        }
      ]
    };

    console.log('📦 测试数据准备完成');
    console.log('📊 测试数据摘要:', {
      fileName: testData.fileData.name,
      fileSize: testData.fileData.size,
      language: testData.language,
      chunkCount: testData.chunks.length
    });

    // 5. 测试 fetch 功能
    console.log('🌐 测试 fetch 功能...');
    try {
      const response = await fetch('http://localhost:3000/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      console.log('📡 API 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API 错误响应:', errorData);
      } else {
        const result = await response.json();
        console.log('✅ API 响应成功:', result);
      }
    } catch (fetchError) {
      console.error('❌ Fetch 错误:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testTranscription();
