const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressImage(inputPath, outputPath, quality = 80) {
  try {
    await sharp(inputPath)
      .png({ quality })
      .toFile(outputPath);

    const beforeSize = fs.statSync(inputPath).size;
    const afterSize = fs.statSync(outputPath).size;
    const reduction = ((beforeSize - afterSize) / beforeSize * 100).toFixed(2);

    console.log(`压缩完成:`);
    console.log(`原始大小: ${(beforeSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`压缩后: ${(afterSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`减少: ${reduction}%`);

    // 备份原文件
    fs.copyFileSync(inputPath, inputPath + '.backup');
    // 替换原文件
    fs.copyFileSync(outputPath, inputPath);
    // 删除临时文件
    fs.unlinkSync(outputPath);

    console.log('已替换原文件并创建备份');
  } catch (error) {
    console.error('压缩失败:', error);
  }
}

const imagePath = path.join(__dirname, '../public/icon.png');
compressImage(imagePath, imagePath + '.tmp');