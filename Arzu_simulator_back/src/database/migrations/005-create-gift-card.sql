-- 创建礼品卡管理表
CREATE TABLE IF NOT EXISTS gift_card (
  gift_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(50) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始礼品卡数据
INSERT INTO gift_card (title, description) VALUES
  ('专注奖励', '阿尔图，你的专注让我感到欣慰。\n继续保持这种状态，你一定能够完成所有的任务。'),
  ('坚持奖励', '你的坚持不懈令我刮目相看。\n每一分钟的专注都是在为成功铺路。'),
  ('效率奖励', '你的工作效率越来越高了。\n我能感受到你在成长，这让我很高兴。'),
  ('毅力奖励', '面对困难时，你选择了坚持。\n这种毅力正是成功者的品质。'),
  ('进步奖励', '我看到了你的进步，你的努力没有白费。\n让我们一起走向更好的未来。');

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_gift_card_created_at ON gift_card(created_at);
