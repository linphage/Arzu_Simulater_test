// 统一素材管理文件
// 此文件用于统一管理项目中所有的图片和SVG素材

// 图片资源
export const images = {
  // 玫瑰园相关图片
  nurseryBackground: "/assets/images/nursery-background.png",
  character2000312: "/assets/images/character-2000312.png",
  
  // 背景元素图片
  rectangleMask: "/assets/images/rectangle-mask.png",
  progressBarBackground: "/assets/images/progress-bar-bg.png",
  greenFrameBackground: "/assets/images/green-frame-bg.png",
  
  // 任务卡片相关图片
  deleteIcon: "/assets/images/delete-icon.png",
  taskTypeQinzheng: "/assets/images/task-type-qinzheng.png",
  taskTypeShujie: "/assets/images/task-type-shujie.png",
  taskTypeAiren: "/assets/images/task-type-airen.png",
};

// SVG图标路径
export { default as roseGardenIcons } from "./svg/rose-garden-icons";
export { default as statusBarIcons } from "./svg/status-bar-icons";
export { default as calendarIcons } from "./svg/calendar-icons";

// 素材使用指南：
// 1. 图片使用：import { images } from "../assets"; 然后使用 images.nurseryBackground
// 2. SVG使用：import { roseGardenIcons } from "../assets"; 然后使用 roseGardenIcons.p1234567
// 3. 或者直接使用：import roseGardenIcons from "../assets/svg/rose-garden-icons";

// 素材映射表（用于快速查找和替换）
export const assetMapping = {
  // 原 figma:asset 路径到新路径的映射
  "figma:asset/1dc71bd62c1ce2116211c9f2619109da420fc338.png": images.nurseryBackground,
  "figma:asset/6ccd74f326c6127a1242cc03fb5659aa209f5e54.png": images.character2000312,
  "figma:asset/43b5eee8b9ef3c1f2cc90442f5116678db2da58f.png": images.rectangleMask,
  "figma:asset/6e511b6a9335ffcbd635916ed741841241f7001e.png": images.progressBarBackground,
  "figma:asset/b69b0f9f6604e8cbc961d3915695b4fd7203c7c8.png": images.greenFrameBackground,
  "figma:asset/d5c33ede6d4ed05d8df7e44820a6a441da319dbf.png": images.deleteIcon,
  "figma:asset/a6c466edcfc15b1b3db48bdf6993661a98e84ddd.png": images.taskTypeQinzheng,
  "figma:asset/77dfb21b6ae5b3e017b8309d5b6bc1907545c62e.png": images.taskTypeShujie,
  "figma:asset/b97483069f151bb18d9e3e16d09bdec9a832ba18.png": images.taskTypeAiren,
  
  // 原 imports 路径到新路径的映射
  "../imports/svg-p45xihpjhc": "../assets/svg/rose-garden-icons",
  "../imports/svg-j3e87w7dyb": "../assets/svg/status-bar-icons",
  "../imports/svg-7jh1qw4fhc": "../assets/svg/calendar-icons",
  "../imports/svg-ktaaro5dmo": "../assets/svg/calendar-icons",
  "../imports/svg-y2ssk1vz7b": "../assets/svg/calendar-icons",
};