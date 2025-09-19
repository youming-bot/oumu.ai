#!/usr/bin/env node

/**
 * Groq API 连接测试脚本
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 开始调试 Groq API 连接...\n');

// 检查环境变量
console.log('1. 检查环境变量...');
const groqApiKey = process.env.GROQ_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (groqApiKey) {
  console.log('✅ GROQ_API_KEY 已设置');
  console.log(`   密钥长度: ${groqApiKey.length} 字符`);
  console.log(`   密钥前缀: ${groqApiKey.substring(0, 10)}...`);
} else {
  console.log('❌ GROQ_API_KEY 未设置');
}

if (openRouterApiKey) {
  console.log('✅ OPENROUTER_API_KEY 已设置');
  console.log(`   密钥长度: ${openRouterApiKey.length} 字符`);
  console.log(`   密钥前缀: ${openRouterApiKey.substring(0, 10)}...`);
} else {
  console.log('❌ OPENROUTER_API_KEY 未设置');
}

// 测试 Groq API 连接
console.log('\n2. 测试 Groq API 连接...');

async function testGroqAPI() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Groq API 连接成功');
      console.log(`   可用模型数量: ${data.data.length}`);

      // 检查是否有 whisper 模型
      const whisperModels = data.data.filter(model => model.id.includes('whisper'));
      if (whisperModels.length > 0) {
        console.log('✅ 找到 Whisper 模型:');
        whisperModels.forEach(model => {
          console.log(`   - ${model.id}`);
        });
      } else {
        console.log('⚠️  未找到 Whisper 模型');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Groq API 连接失败');
      console.log(`   状态码: ${response.status}`);
      console.log(`   错误信息: ${errorText}`);
    }
  } catch (error) {
    console.log('❌ Groq API 请求失败');
    console.log(`   错误: ${error.message}`);
  }
}

// 检查音频处理功能
console.log('\n3. 检查音频处理相关文件...');

const fs = require('fs');
const path = require('path');

const audioFiles = [
  'src/lib/audio-processor.ts',
  'src/lib/groq-client.ts',
  'src/app/api/transcribe/route.ts'
];

audioFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file} 存在`);
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

// 检查开发服务器状态
console.log('\n4. 检查开发服务器状态...');

const { exec } = require('child_process');
exec('ps aux | grep "next dev"', (error, stdout, stderr) => {
  if (stdout.includes('next dev')) {
    console.log('✅ 开发服务器正在运行');
  } else {
    console.log('⚠️  开发服务器可能未运行');
  }
});

// 运行测试
console.log('\n5. 运行 API 连接测试...');
testGroqAPI().then(() => {
  console.log('\n📊 调试总结:');
  console.log('如果所有检查都通过，问题可能在于:');
  console.log('1. 音频文件格式不支持');
  console.log('2. 音频文件处理错误');
  console.log('3. 前端错误处理被静默');
  console.log('4. 浏览器控制台有错误信息');

  console.log('\n建议的调试步骤:');
  console.log('1. 检查浏览器控制台错误');
  console.log('2. 尝试上传小文件进行测试');
  console.log('3. 检查网络请求面板');
  console.log('4. 查看服务器端日志');

  // 清理
  fs.unlinkSync(__filename);
}).catch(error => {
  console.log('❌ 测试过程中出现错误:', error.message);
});
