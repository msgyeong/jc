/**
 * Comment Service — 댓글 CRUD 통합 모듈
 *
 * posts, schedules, clubs, group-board 4곳의 댓글 로직을 하나로 통합.
 * 각 도메인은 config 객체로 차이점을 선언하고, 이 서비스를 호출만 한다.
 *
 * config 예시:
 * {
 *   commentTable: 'comments',              // 댓글 테이블명
 *   fkColumn: 'post_id',                   // 부모 FK 컬럼명 (post_id | schedule_id)
 *   parentTable: 'posts',                  // 부모 테이블명 (존재 확인용)
 *   parentIdColumn: 'id',                  // 부모 테이블 PK (기본 'id')
 *   updateCommentCount: true,              // 부모 테이블 comments_count 갱신 여부
 *   commentLikeTable: 'comment_likes',     // 댓글 좋아요 테이블 (null이면 미지원)
 *   push: {                                // 푸시 알림 설정 (null이면 미발송)
 *     getAuthorQuery: 'SELECT author_id FROM posts WHERE id = $1',
 *     authorIdColumn: 'author_id',
 *     urlTemplate: '/#posts/{id}',
 *     dataKey: 'post_id'
 *   }
 * }
 */
const { query } = require('../config/database');
const { sendPushToUser } = require('../utils/pushSender');

// ─── LIST ───

async function listComments(config, parentId, userId) {
    const { commentTable, fkColumn, commentLikeTable } = config;

    let sql;
    let params;

    if (commentLikeTable) {
        sql = `SELECT c.id, c.author_id, c.content, c.parent_id, c.is_deleted, c.created_at,
                      u.name as author_name, u.profile_image as author_image, u.position as author_position,
                      COALESCE((SELECT COUNT(*) FROM ${commentLikeTable} cl WHERE cl.comment_id = c.id), 0)::int as likes_count,
                      EXISTS(SELECT 1 FROM ${commentLikeTable} cl WHERE cl.comment_id = c.id AND cl.user_id = $2) as liked
               FROM ${commentTable} c
               LEFT JOIN users u ON c.author_id = u.id
               WHERE c.${fkColumn} = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
               ORDER BY c.created_at ASC`;
        params = [parentId, userId];
    } else {
        sql = `SELECT c.id, c.author_id, c.content, c.parent_id, c.is_deleted, c.created_at,
                      u.name as author_name, u.profile_image as author_image, u.position as author_position
               FROM ${commentTable} c
               LEFT JOIN users u ON c.author_id = u.id
               WHERE c.${fkColumn} = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
               ORDER BY c.created_at ASC`;
        params = [parentId];
    }

    let result;
    try {
        result = await query(sql, params);
    } catch (e) {
        // comment_likes 테이블이 아직 없는 경우 폴백
        result = await query(
            `SELECT c.id, c.author_id, c.content, c.parent_id, c.created_at,
                    u.name as author_name, u.profile_image as author_image, u.position as author_position
             FROM ${commentTable} c
             LEFT JOIN users u ON c.author_id = u.id
             WHERE c.${fkColumn} = $1 AND (c.is_deleted = false OR c.is_deleted IS NULL)
             ORDER BY c.created_at ASC`,
            [parentId]
        );
    }

    // 대댓글 구조화
    const topLevel = [];
    const replyMap = {};

    for (const row of result.rows) {
        row.author = {
            id: row.author_id,
            name: row.author_name,
            position: row.author_position,
            profile_image: row.author_image
        };
        row.replies = [];
        if (!row.parent_id) {
            topLevel.push(row);
            replyMap[row.id] = row;
        }
    }

    for (const row of result.rows) {
        if (row.parent_id && replyMap[row.parent_id]) {
            replyMap[row.parent_id].replies.push(row);
        }
    }

    return {
        items: topLevel,
        total: result.rows.length,
        flat: result.rows
    };
}

// ─── CREATE ───

async function createComment(config, parentId, userId, content, parentCommentId) {
    const { commentTable, fkColumn, parentTable, updateCommentCount, push } = config;

    if (!content || !String(content).trim()) {
        return { error: true, status: 400, message: '댓글 내용을 입력해주세요.' };
    }

    const trimmed = String(content).trim();

    // 부모 존재 확인
    if (parentTable) {
        const parentResult = await query(
            `SELECT id FROM ${parentTable} WHERE id = $1`,
            [parentId]
        );
        if (parentResult.rows.length === 0) {
            return { error: true, status: 404, message: '대상을 찾을 수 없습니다.' };
        }
    }

    // 대대댓글 방지
    if (parentCommentId) {
        const parentComment = await query(
            `SELECT id, parent_id FROM ${commentTable} WHERE id = $1 AND ${fkColumn} = $2`,
            [parentCommentId, parentId]
        );
        if (parentComment.rows.length === 0) {
            return { error: true, status: 404, message: '부모 댓글을 찾을 수 없습니다.' };
        }
        if (parentComment.rows[0].parent_id) {
            return { error: true, status: 400, message: '대댓글에는 답글을 달 수 없습니다.' };
        }
    }

    // INSERT
    const result = await query(
        `INSERT INTO ${commentTable} (author_id, ${fkColumn}, content, parent_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, content, created_at`,
        [userId, parentId, trimmed, parentCommentId || null]
    );

    // 작성자 정보
    const userResult = await query(
        'SELECT name, position, profile_image FROM users WHERE id = $1',
        [userId]
    );

    const comment = result.rows[0];
    comment.author = {
        id: userId,
        name: userResult.rows[0]?.name,
        position: userResult.rows[0]?.position
    };
    comment.parent_id = parentCommentId || null;

    // comments_count 갱신
    let comments_count = null;
    if (updateCommentCount) {
        const countResult = await query(
            `SELECT COUNT(*) FROM ${commentTable} WHERE ${fkColumn} = $1 AND (is_deleted = false OR is_deleted IS NULL)`,
            [parentId]
        );
        comments_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query(
            `UPDATE ${parentTable} SET comments_count = $1, updated_at = NOW() WHERE id = $2`,
            [comments_count, parentId]
        );
    }

    // 푸시 알림
    if (push) {
        try {
            const authorResult = await query(push.getAuthorQuery, [parentId]);
            if (authorResult.rows.length > 0) {
                const targetId = authorResult.rows[0][push.authorIdColumn];
                if (targetId && targetId !== userId) {
                    const commenterName = userResult.rows[0]?.name || '회원';
                    const url = push.urlTemplate.replace('{id}', parentId);
                    const dataObj = { url };
                    dataObj[push.dataKey] = parseInt(parentId);
                    sendPushToUser(targetId, {
                        title: '\uD83D\uDCAC \uC0C8 \uB313\uAE00',
                        body: `${commenterName}님이 댓글을 남겼습니다: ${trimmed.substring(0, 50)}`,
                        data: dataObj,
                        type: 'N-05'
                    }).catch(e => console.error('[Push] N-05 발송 에러:', e.message));
                }
            }
        } catch (e) { console.error('[silent-catch] push:', e.message); }
    }

    return { error: false, comment, comments_count };
}

// ─── DELETE ───

async function deleteComment(config, commentId, parentId, userId, userRole) {
    const { commentTable, fkColumn, parentTable, updateCommentCount } = config;

    const commentResult = await query(
        `SELECT author_id FROM ${commentTable} WHERE id = $1 AND ${fkColumn} = $2`,
        [commentId, parentId]
    );
    if (commentResult.rows.length === 0) {
        return { error: true, status: 404, message: '댓글을 찾을 수 없습니다.' };
    }

    const isAuthor = Number(commentResult.rows[0].author_id) === Number(userId);
    const isAdmin = userRole && ['super_admin', 'admin'].includes(userRole);
    if (!isAuthor && !isAdmin) {
        return { error: true, status: 403, message: '댓글 삭제 권한이 없습니다.' };
    }

    await query(
        `UPDATE ${commentTable} SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
        [commentId]
    );

    // comments_count 갱신
    let comments_count = null;
    if (updateCommentCount) {
        const countResult = await query(
            `SELECT COUNT(*) FROM ${commentTable} WHERE ${fkColumn} = $1 AND (is_deleted = false OR is_deleted IS NULL)`,
            [parentId]
        );
        comments_count = parseInt(countResult.rows[0]?.count || 0, 10);
        await query(
            `UPDATE ${parentTable} SET comments_count = $1, updated_at = NOW() WHERE id = $2`,
            [comments_count, parentId]
        );
    }

    return { error: false, comments_count };
}

// ─── COMMENT LIKE TOGGLE ───

async function toggleCommentLike(config, commentId, userId) {
    const { commentLikeTable } = config;

    if (!commentLikeTable) {
        return { error: true, status: 400, message: '댓글 좋아요를 지원하지 않습니다.' };
    }

    // 테이블 자동 생성 (최초 1회)
    if (commentLikeTable === 'comment_likes') {
        await query(`CREATE TABLE IF NOT EXISTS comment_likes (
            id SERIAL PRIMARY KEY,
            comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(comment_id, user_id)
        )`).catch(() => {});
    }

    const existing = await query(
        `SELECT id FROM ${commentLikeTable} WHERE comment_id = $1 AND user_id = $2`,
        [commentId, userId]
    );

    let liked;
    if (existing.rows.length > 0) {
        await query(
            `DELETE FROM ${commentLikeTable} WHERE comment_id = $1 AND user_id = $2`,
            [commentId, userId]
        );
        liked = false;
    } else {
        await query(
            `INSERT INTO ${commentLikeTable} (comment_id, user_id) VALUES ($1, $2)`,
            [commentId, userId]
        );
        liked = true;
    }

    const countResult = await query(
        `SELECT COUNT(*) FROM ${commentLikeTable} WHERE comment_id = $1`,
        [commentId]
    );
    const likes_count = parseInt(countResult.rows[0].count, 10);

    return { error: false, liked, likes_count };
}

module.exports = {
    listComments,
    createComment,
    deleteComment,
    toggleCommentLike
};
