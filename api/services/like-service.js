/**
 * Like Service — 좋아요 토글 통합 모듈
 *
 * config 예시:
 * {
 *   likeTable: 'likes',           // 좋아요 테이블
 *   userColumn: 'user_id',        // 유저 FK 컬럼명
 *   fkColumn: 'post_id',          // 대상 FK 컬럼명
 *   parentTable: 'posts',         // 부모 테이블 (likes_count 갱신용)
 *   countColumn: 'likes_count',   // 부모 테이블의 카운트 컬럼
 * }
 */
const { query, transaction } = require('../config/database');

async function toggleLike(config, parentId, userId, useTransaction) {
    const { likeTable, userColumn, fkColumn, parentTable, countColumn } = config;

    if (useTransaction) {
        // posts.js의 기존 트랜잭션 패턴 유지
        return await transaction(async (client) => {
            const existing = await client.query(
                `SELECT id FROM ${likeTable} WHERE ${userColumn} = $1 AND ${fkColumn} = $2 FOR UPDATE`,
                [userId, parentId]
            );
            let liked;
            if (existing.rows.length > 0) {
                await client.query(
                    `DELETE FROM ${likeTable} WHERE ${userColumn} = $1 AND ${fkColumn} = $2`,
                    [userId, parentId]
                );
                liked = false;
            } else {
                await client.query(
                    `INSERT INTO ${likeTable} (${userColumn}, ${fkColumn}, created_at) VALUES ($1, $2, NOW()) ON CONFLICT (${userColumn}, ${fkColumn}) DO NOTHING`,
                    [userId, parentId]
                );
                liked = true;
            }
            const countResult = await client.query(
                `SELECT COUNT(*) FROM ${likeTable} WHERE ${fkColumn} = $1`,
                [parentId]
            );
            const likes_count = parseInt(countResult.rows[0]?.count || 0, 10);
            if (parentTable && countColumn) {
                await client.query(
                    `UPDATE ${parentTable} SET ${countColumn} = $1, updated_at = NOW() WHERE id = $2`,
                    [likes_count, parentId]
                );
            }
            return { liked, likes_count };
        });
    }

    // 단순 query 방식 (group-board 등)
    let existing;
    try {
        existing = await query(
            `SELECT id FROM ${likeTable} WHERE ${userColumn} = $1 AND ${fkColumn} = $2`,
            [userId, parentId]
        );
    } catch (e) {
        existing = { rows: [] };
    }

    let liked;
    if (existing.rows.length > 0) {
        await query(
            `DELETE FROM ${likeTable} WHERE ${userColumn} = $1 AND ${fkColumn} = $2`,
            [userId, parentId]
        );
        liked = false;
    } else {
        await query(
            `INSERT INTO ${likeTable} (${userColumn}, ${fkColumn}) VALUES ($1, $2)`,
            [userId, parentId]
        );
        liked = true;
    }

    const countResult = await query(
        `SELECT COUNT(*) FROM ${likeTable} WHERE ${fkColumn} = $1`,
        [parentId]
    );
    const likes_count = parseInt(countResult.rows[0].count, 10);

    if (parentTable && countColumn) {
        await query(
            `UPDATE ${parentTable} SET ${countColumn} = $1 WHERE id = $2`,
            [likes_count, parentId]
        );
    }

    return { liked, likes_count };
}

module.exports = { toggleLike };
