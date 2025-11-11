-- 移除 memories 表的 importance 字段
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 删除依赖于 importance 列的视图（如果存在）
DROP VIEW IF EXISTS memory_stats CASCADE;

-- 2. 删除与 importance 相关的索引（如果存在）
DROP INDEX IF EXISTS idx_memories_importance;

-- 3. 删除 importance 列
ALTER TABLE memories DROP COLUMN IF EXISTS importance;

-- 4. 验证修改（可选）
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'memories';
