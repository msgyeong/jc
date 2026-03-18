-- 025: 회원 그룹 + 초성 검색 지원
-- 2026-03-18

-- ======================================
-- 1. 초성(chosung) 추출 함수
-- ======================================
CREATE OR REPLACE FUNCTION extract_chosung(input TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    ch INT;
    idx INT;
    i INT;
    chosung_list TEXT[] := ARRAY[
        'ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ',
        'ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'
    ];
BEGIN
    IF input IS NULL THEN RETURN NULL; END IF;
    FOR i IN 1..char_length(input) LOOP
        ch := ascii(substr(input, i, 1));
        IF ch >= 44032 AND ch <= 55203 THEN
            -- 한글 완성형 범위: 초성 인덱스 = (code - 0xAC00) / (21 * 28)
            idx := (ch - 44032) / 588;
            result := result || chosung_list[idx + 1];
        ELSE
            -- 비한글 문자는 그대로 통과
            result := result || substr(input, i, 1);
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ======================================
-- 2. users 테이블에 초성 컬럼 추가
-- ======================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS name_chosung VARCHAR(50);

-- 기존 데이터 backfill
UPDATE users SET name_chosung = extract_chosung(name) WHERE name IS NOT NULL AND name_chosung IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_users_name_chosung ON users(name_chosung) WHERE name_chosung IS NOT NULL;

-- ======================================
-- 3. 자동 갱신 트리거
-- ======================================
CREATE OR REPLACE FUNCTION update_name_chosung()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.name IS NOT NULL THEN
        NEW.name_chosung := extract_chosung(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_name_chosung ON users;
CREATE TRIGGER trg_users_name_chosung
    BEFORE INSERT OR UPDATE OF name ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_name_chosung();

-- ======================================
-- 4. 회원 그룹 테이블
-- ======================================
CREATE TABLE IF NOT EXISTS member_groups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_groups_user ON member_groups(user_id);

-- ======================================
-- 5. 그룹 멤버 매핑 테이블
-- ======================================
CREATE TABLE IF NOT EXISTS member_group_items (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
    target_member_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, target_member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_group_items_group ON member_group_items(group_id);
