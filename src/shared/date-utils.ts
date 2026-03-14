"use strict";

/**
 * 生成 datetime 字符串
 * @returns 格式 YYYY-MM-DD_HH:mm:ss
 */
export const getDatetimeStr = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = [
    now.getHours().toString().padStart(2, "0"),
    now.getMinutes().toString().padStart(2, "0"),
    now.getSeconds().toString().padStart(2, "0"),
  ].join(":");
  return `${dateStr}_${timeStr}`;
};

/**
 * 获取 ISO 周标识
 * @param date 目标日期，默认当前时间
 * @returns 格式 YYYY-WXX
 */
export const getISOWeekLabel = (date = new Date()): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, "0")}`;
};
