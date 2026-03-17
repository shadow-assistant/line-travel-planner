-- ============================================================
-- Puzzle Trip 拼圖遊 - Supabase Schema (升級版)
-- ============================================================

-- 啟用必要擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 0. 使用者資料表 (users) - 擴充 Supabase Auth
-- ============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255),
    display_name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 1. 群組資料表 (groups) - 支援個人和群組
-- ============================================================
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_group_id VARCHAR(255) UNIQUE,  -- LINE 群組 ID (可為空=個人使用)
    name VARCHAR(255),                   -- 群組名稱
    is_personal BOOLEAN DEFAULT FALSE,  -- 是否為個人模式
    created_by UUID REFERENCES profiles(id),  -- 建立者
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 群組成員
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255),          -- LINE User ID
    role VARCHAR(50) DEFAULT 'member',  -- 'admin' | 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- ============================================================
-- 2. 行程資料表 (itineraries)
-- ============================================================
CREATE TABLE public.itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,         -- 行程標題
    description TEXT,                    -- 行程描述
    start_date DATE,                     -- 開始日期
    end_date DATE,                       -- 結束日期
    location VARCHAR(255),               -- 主要地點
    status VARCHAR(50) DEFAULT 'planning',  -- 'planning' | 'ongoing' | 'completed'
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 行程項目 (每天的詳細行程)
CREATE TABLE public.itinerary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INT NOT NULL,            -- 第幾天
    time TIME,                          -- 時間
    title VARCHAR(255) NOT NULL,        -- 項目標題
    description TEXT,                   -- 項目描述
    location VARCHAR(255),               -- 地點
    latitude DECIMAL(10, 8),            -- 緯度
    longitude DECIMAL(11, 8),           -- 經度
    place_id VARCHAR(255),              -- Google Places ID
    order_index INT DEFAULT 0,          -- 排序
    duration_minutes INT,               -- 預估停留時間
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 許願池 & 景點資料表 (wishlists)
-- ============================================================
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,        -- 景點名稱
    description TEXT,                   -- 描述
    location VARCHAR(255),               -- 地址
    latitude DECIMAL(10, 8),            -- 緯度
    longitude DECIMAL(11, 8),           -- 經度
    place_id VARCHAR(255),              -- Google Places ID
    photo_url TEXT,                     -- 景點照片
    rating DECIMAL(2, 1),               -- 評分
    website VARCHAR(500),                -- 官網
    phone VARCHAR(50),                  -- 電話
    category VARCHAR(50),                -- 類別 (景點/餐廳/住宿...)
    added_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 許願池投票
CREATE TABLE public.wishlist_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) DEFAULT 'like',  -- 'like' | 'must_go' | 'skip'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wishlist_id, user_id, vote_type)
);

-- ============================================================
-- 4. 支出資料表 (expenses)
-- ============================================================
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    itinerary_id UUID REFERENCES itineraries(id),  -- 關聯行程
    title VARCHAR(255) NOT NULL,         -- 支出項目
    amount DECIMAL(12, 2) NOT NULL,      -- 金額
    currency VARCHAR(10) DEFAULT 'TWD',  -- 貨幣
    exchange_rate DECIMAL(10, 4) DEFAULT 1,  -- 匯率
    amount_twd DECIMAL(12, 2),           -- 台幣金額
    category VARCHAR(50),                 -- 類別
    paid_by UUID REFERENCES profiles(id), -- 付款人
    date DATE DEFAULT CURRENT_DATE,       -- 消費日期
    notes TEXT,                           -- 備註
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 支出分攤 (expense_sharers)
CREATE TABLE public.expense_sharers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    share_amount DECIMAL(12, 2) NOT NULL,  -- 分攤金額
    share_type VARCHAR(20) DEFAULT 'equal',  -- 'equal' | 'percentage' | 'custom'
    is_settled BOOLEAN DEFAULT FALSE,     -- 是否已結清
    settled_at TIMESTAMPTZ,
    UNIQUE(expense_id, user_id)
);

-- ============================================================
-- 5. 索引優化
-- ============================================================
CREATE INDEX idx_groups_line_id ON groups(line_group_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_itineraries_group ON itineraries(group_id);
CREATE INDEX idx_itinerary_items_itinerary ON itinerary_items(itinerary_id);
CREATE INDEX idx_wishlists_group ON wishlists(group_id);
CREATE INDEX idx_wishlist_votes_wishlist ON wishlist_votes(wishlist_id);
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expense_sharers_expense ON expense_sharers(expense_id);
CREATE INDEX idx_expense_sharers_user ON expense_sharers(user_id);

-- ============================================================
-- 6. RLS (Row Level Security) 政策
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_sharers ENABLE ROW LEVEL SECURITY;

-- Profiles: 使用者只能讀寫自己的
CREATE POLICY "users_can_read_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_can_update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_can_insert_own_profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Groups: 成員可讀寫
CREATE POLICY "members_can_read_groups" ON groups FOR SELECT USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_can_insert_groups" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "members_can_update_groups" ON groups FOR UPDATE USING (
    id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Group Members
CREATE POLICY "members_can_read_group_members" ON group_members FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_can_insert_group_members" ON group_members FOR INSERT WITH CHECK (true);

-- Itineraries
CREATE POLICY "members_can_read_itineraries" ON itineraries FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_can_crud_itineraries" ON itineraries FOR ALL USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Itinerary Items
CREATE POLICY "members_can_crud_itinerary_items" ON itinerary_items FOR ALL USING (
    itinerary_id IN (
        SELECT id FROM itineraries WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
);

-- Wishlists
CREATE POLICY "members_can_read_wishlists" ON wishlists FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_can_crud_wishlists" ON wishlists FOR ALL USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Wishlist Votes
CREATE POLICY "members_can_crud_wishlist_votes" ON wishlist_votes FOR ALL USING (
    wishlist_id IN (
        SELECT id FROM wishlists WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
);

-- Expenses
CREATE POLICY "members_can_read_expenses" ON expenses FOR SELECT USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "members_can_crud_expenses" ON expenses FOR ALL USING (
    group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Expense Sharers
CREATE POLICY "members_can_crud_expense_sharers" ON expense_sharers FOR ALL USING (
    expense_id IN (
        SELECT id FROM expenses WHERE group_id IN (
            SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
);

-- ============================================================
-- 7. Realtime 訂閱設定
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE itineraries;
ALTER PUBLICATION supabase_realtime ADD TABLE itinerary_items;
ALTER PUBLICATION supabase_realtime ADD TABLE wishlists;
ALTER PUBLICATION supabase_realtime ADD TABLE wishlist_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_sharers;

-- ============================================================
-- 8. 計算函數
-- ============================================================

-- 計算最終分帳結果 (最優還款路徑)
CREATE OR REPLACE FUNCTION calculate_settlements(p_group_id UUID)
RETURNS TABLE (
    from_user_id UUID,
    to_user_id UUID,
    amount DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH balances AS (
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
        SELECT user_id, balance FROM balances WHERE balance < -0.01
        ORDER BY balance
    ),
    creditors AS (
        SELECT user_id, balance FROM balances WHERE balance > 0.01
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
            WHERE balance > 0.01
            ORDER BY balance DESC
            LIMIT 1
        ) c
    )
    SELECT s.from_user_id, s.to_user_id, s.amount
    FROM settlement s
    WHERE s.amount > 0.01;
END;
$$ LANGUAGE plpgsql;

-- 計算總花費
CREATE OR REPLACE FUNCTION calculate_total_expenses(p_group_id UUID)
RETURNS DECIMAL(12, 2) AS $$
DECLARE
    total DECIMAL(12, 2);
BEGIN
    SELECT COALESCE(SUM(amount_twd), 0) INTO total
    FROM expenses
    WHERE group_id = p_group_id;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. Trigger: 自動更新時間戳
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON itineraries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_itinerary_items_updated_at BEFORE UPDATE ON itinerary_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
