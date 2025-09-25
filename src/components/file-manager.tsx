"use client";

// 重构后的FileManager现在使用模块化的组件
// 为了保持向后兼容性，这里保留原有的接口，但委托给新的实现
import React from "react";
import type { FileManagerProps } from "./file-management";
import { FileManager as NewFileManager } from "./file-management";

const FileManager = React.memo<FileManagerProps>((props) => {
  return <NewFileManager {...props} />;
});

FileManager.displayName = "FileManager";

export default FileManager;
