-- ============================================================
-- LINE 旅遊規劃小工具 - Supabase Schema
-- ============================================================

-- 啟用必要擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 群組資料表 (groups)
-- ============================================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_group_id VARCHAR(255) UNIQUE NOT NULL,  -- LINE 群組 ID
    name VARCHAR(255),                            -- 群組名稱
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 群組成員
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,                        -- Supabase Auth User ID
    line_user_id VARCHAR(255) NOT NULL,          -- LINE User ID
    display_name VARCHAR(255),                    -- LINE 顯示名稱
    role VARCHAR(50) DEFAULT 'member',           -- 'admin' | 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, line_user_id)
);

-- ============================================================
-- 2. 行程資料表 (itineraries)
-- ============================================================
CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,                  -- 行程標題
    description TEXT,                             -- 行程描述
    start_date DATE,                              -- 開始日期
    end_date DATE,                                -- 結束日期
    location VARCHAR(255),                        -- 地點
    created_by UUID NOT NULL,                     -- 建立者 User ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行程項目 (每天的詳細行程)
CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INT NOT NULL,                     -- 第幾天
    time TIME,                                    -- 時間
    title VARCHAR(255) NOT NULL,                  -- 項目標題
    description TEXT,                             -- 項目描述
    location VARCHAR(255),                        -- 地點
    order_index INT DEFAULT 0,                   -- 排序
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 支出資料表 (expenses)
-- ============================================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,                  -- 支出項目
    amount DECIMAL(12, 2) NOT NULL,               -- 金額
    currency VARCHAR(10) DEFAULT 'TWD',           -- 貨幣
    category VARCHAR(50),                         -- 類別 (交通/住宿/餐飲/門票/其他)
    paid_by UUID NOT NULL,                        -- 付款人 User ID
    date DATE DEFAULT CURRENT_DATE,               -- 消費日期
    notes TEXT,                                    -- 備註
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 支出分攤 (expense_sharers)
CREATE TABLE expense_sharers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,                        -- 分攤者 User ID
    share_amount DECIMAL(12, 2) NOT NULL,        -- 分攤金額
    is_settled BOOLEAN DEFAULT FALSE,            -- 是否已結清
    settled_at TIMESTAMPTZ,
    UNIQUE(expense_id, user_id)
);

-- ============================================================
-- 4. 使用者資料表 (users) - 擴充 Supabase Auth
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. 索引優化
-- ============================================================
CREATE INDEX idx_itineraries_group ON itineraries(group_id);
CREATE INDEX idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expense_sharers_expense ON expense_sharers(expense_id);
CREATE INDEX idx_expense_sharers_user ON expense_sharers(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

-- ============================================================
-- 6. RLS (Row Level Security) 政策
-- ============================================================

-- 啟用 RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_sharers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- Groups RLS
-- --------------------------------------------
-- 群組成員可以讀取群組資訊
CREATE POLICY "group_members_can_read_groups" ON groups
    FOR SELECT USING (
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以更新群組資訊
CREATE POLICY "group_members_can_update_groups" ON groups
    FOR UPDATE USING (
        id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 公開建立群組 (由 webhook 觸發)
CREATE POLICY "anyone_can_insert_groups" ON groups
    FOR INSERT WITH CHECK (true);

-- --------------------------------------------
-- Group Members RLS
-- --------------------------------------------
-- 成員可以讀取群組成員
CREATE POLICY "members_can_read_group_members" ON group_members
    FOR SELECT USING (group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ));

-- 成員可以加入群組
CREATE POLICY "anyone_can_insert_group_members" ON group_members
    FOR INSERT WITH CHECK (true);

-- --------------------------------------------
-- Itineraries RLS
-- --------------------------------------------
-- 群組成員可以讀取行程
CREATE POLICY "members_can_read_itineraries" ON itineraries
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以新增行程
CREATE POLICY "members_can_insert_itineraries" ON itineraries
    FOR INSERT WITH CHECK (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以更新行程
CREATE POLICY "members_can_update_itineraries" ON itineraries
    FOR UPDATE USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以刪除行程
CREATE POLICY "members_can_delete_itineraries" ON itineraries
    FOR DELETE USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- --------------------------------------------
-- Itinerary Items RLS
-- --------------------------------------------
CREATE POLICY "members_can_crud_itinerary_items" ON itinerary_items
    FOR ALL USING (
        itinerary_id IN (
            SELECT id FROM itineraries WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- --------------------------------------------
-- Expenses RLS
-- --------------------------------------------
-- 群組成員可以讀取支出
CREATE POLICY "members_can_read_expenses" ON expenses
    FOR SELECT USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以新增支出
CREATE POLICY "members_can_insert_expenses" ON expenses
    FOR INSERT WITH CHECK (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以更新支出
CREATE POLICY "members_can_update_expenses" ON expenses
    FOR UPDATE USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- 群組成員可以刪除支出
CREATE POLICY "members_can_delete_expenses" ON expenses
    FOR DELETE USING (
        group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
    );

-- --------------------------------------------
-- Expense Sharers RLS
-- --------------------------------------------
CREATE POLICY "members_can_crud_expense_sharers" ON expense_sharers
    FOR ALL USING (
        expense_id IN (
            SELECT id FROM expenses WHERE group_id IN (
                SELECT group_id FROM group_members WHERE user_id = auth.uid()
            )
        )
    );

-- --------------------------------------------
-- Profiles RLS
-- --------------------------------------------
-- 使用者可以讀取自己的 profile
CREATE POLICY "users_can_read_own_profile" ON profiles
    FOR SELECT USING (id = auth.uid());

-- 使用者可以更新自己的 profile
CREATE POLICY "users_can_update_own_profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- 允許插入 (由 trigger 自動處理)
CREATE POLICY "users_can_insert_own_profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- 7. Realtime 訂閱設定
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE itineraries;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_items;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_sharers;

-- ============================================================
-- 8. 實用函數
-- ============================================================

-- 計算最終分帳結果
CREATE OR REPLACE FUNCTION calculate_settlements(p_group_id UUID)
RETURNS TABLE (
    from_user_id UUID,
    to_user_id UUID,
    amount DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH balances AS (
        -- 計算每個人的淨餘額 (應付 - 應收)
        SELECT 
            es.user_id,
            COALESCE(SUM(
                CASE 
                    WHEN e.paid_by = es.user_id THEN es.share_amount
                    ELSE -es.share_amount
                END
            ), 0) AS balance
        FROM expenses e
        JOIN expense_sharers es ON e.id = es.expense_id
        WHERE e.group_id = p_group_id
        GROUP BY es.user_id
    ),
    debtors AS (
        SELECT user_id, balance FROM balances WHERE balance < 0
        ORDER BY balance
    ),
    creditors AS (
        SELECT user_id, balance FROM balances WHERE balance > 0
        ORDER BY balance DESC
    ),
    settlement AS (
        SELECT 
            d.user_id AS from_user_id,
            c.user_id AS to_user_id,
            LEAST(-d.balance, c.balance) AS amount
        FROM debtors d
        CROSS JOIN LATERAL (
            SELECT user_id, balance FROM creditors
            WHERE balance > 0
            ORDER BY balance DESC
            LIMIT 1
        ) c
    )
    SELECT 
        s.from_user_id,
        s.to_user_id,
        s.amount
    FROM settlement s
    WHERE s.amount > 0.01;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. 自動更新時間戳 Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_itineraries_updated_at
    BEFORE UPDATE ON itineraries FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_itinerary_items_updated_at
    BEFORE UPDATE ON itinerary_items FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. 建立預設群組 (測試用)
-- ============================================================
-- INSERT INTO groups (line_group_id, name) 
-- VALUES ('C1234567890', '測試旅遊群組');
