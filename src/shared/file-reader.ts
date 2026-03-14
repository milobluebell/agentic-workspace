"use strict";

import * as fs from "fs";
import * as path from "path";

/**
 * 读取指定文件的文本内容
 * @param filePath 文件绝对路径或相对路径
 * @returns 文件内容字符串
 */
export const readFileContent = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf-8");
};

/**
 * 检查文件或目录是否存在
 * @param targetPath 目标路径
 * @returns 是否存在
 */
export const pathExists = (targetPath: string): boolean => {
  return fs.existsSync(targetPath);
};

/**
 * 列出目录下的文件（可按扩展名过滤）
 * @param dirPath 目录路径
 * @param extension 可选扩展名过滤，如 ".json"
 * @returns 文件名数组（不含目录路径）
 */
export const listFiles = (dirPath: string, extension?: string): string[] => {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  return extension ? files.filter((f) => f.endsWith(extension)) : files;
};

/**
 * 读取目录下所有指定扩展名的文件内容
 * @param dirPath 目录路径
 * @param extension 扩展名过滤
 * @returns { filename, content } 数组
 */
export const readAllFiles = (
  dirPath: string,
  extension: string
): Array<{ filename: string; content: string }> => {
  const files = listFiles(dirPath, extension);
  return files.sort().map((filename) => ({
    filename,
    content: fs.readFileSync(path.join(dirPath, filename), "utf-8"),
  }));
};
