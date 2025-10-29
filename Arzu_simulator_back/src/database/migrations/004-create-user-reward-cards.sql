-- 创建用户奖励卡记录表
CREATE TABLE IF NOT EXISTS user_reward_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  gift_id INTEGER NOT NULL,
  obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  trigger_time_minutes INTEGER NOT NULL,
  is_viewed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (gift_id) REFERENCES gift_card(gift_id) ON DELETE CASCADE
);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_user_reward_cards_user_id ON user_reward_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reward_cards_is_viewed ON user_reward_cards(is_viewed);
