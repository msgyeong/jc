-- 023_meetings.sql
-- 회의 관리 기능 테이블

-- 회의
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) DEFAULT 'regular', -- regular, board, general_assembly
    meeting_date TIMESTAMP NOT NULL,
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 회의 참석
CREATE TABLE IF NOT EXISTS meeting_attendance (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, attending, absent
    checked_in_at TIMESTAMP,
    UNIQUE(meeting_id, user_id)
);

-- 회의 투표 주제
CREATE TABLE IF NOT EXISTS meeting_votes (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    vote_type VARCHAR(20) DEFAULT 'yesno', -- yesno, multiple_choice
    options JSONB DEFAULT '["찬성","반대","기권"]',
    status VARCHAR(20) DEFAULT 'open', -- open, closed
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

-- 투표 응답
CREATE TABLE IF NOT EXISTS meeting_vote_responses (
    id SERIAL PRIMARY KEY,
    vote_id INTEGER REFERENCES meeting_votes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    selected_option VARCHAR(100) NOT NULL,
    voted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(vote_id, user_id)
);

-- 회의록 (PDF)
CREATE TABLE IF NOT EXISTS meeting_minutes (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
    title VARCHAR(200),
    file_data BYTEA NOT NULL,
    file_name VARCHAR(200),
    file_size INTEGER,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    uploaded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);
