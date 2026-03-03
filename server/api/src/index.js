#!/usr/bin/env node
'use strict';

const http = require('http');
const { URL } = require('url');
const { Pool } = require('pg');
require('dotenv').config();

const PORT = Number(process.env.PORT || 4000);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-User-Id',
  });
  res.end(body);
}

function notFound(res) {
  return json(res, 404, { error: 'Not found' });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function parseIntSafe(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function handleListSidequests(req, res, url) {
  const scope = (url.searchParams.get('scope') || 'near').toLowerCase();
  const q = (url.searchParams.get('q') || '').trim();
  const limit = parseIntSafe(url.searchParams.get('limit') || '24', 24);

  const client = await pool.connect();
  try {
    const sql = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.location,
        s.category,
        s.image_urls,
        s.user_id AS host_user_id,
        COALESCE(u.display_name, 'Host') AS host_name,
        CASE WHEN MOD(ABS(HASHTEXT(s.id::text)), 2) = 0 THEN 'near' ELSE 'far' END AS discovery_scope,
        ROUND((1 + MOD(ABS(HASHTEXT(s.id::text)), 220))::numeric / 10.0, 1) AS distance_miles,
        NOW() + MAKE_INTERVAL(hours => MOD(ABS(HASHTEXT((s.id::text || 'start'))), 120)) AS starts_at,
        COALESCE(COUNT(jr.id), 0)::int AS interested_count
      FROM sidequest_activities s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN sidequest_join_requests jr ON jr.sidequest_id = s.id
      WHERE
        ($1::text = 'all' OR (CASE WHEN MOD(ABS(HASHTEXT(s.id::text)), 2) = 0 THEN 'near' ELSE 'far' END) = $1)
        AND (
          $2::text = ''
          OR s.title ILIKE '%' || $2 || '%'
          OR COALESCE(s.location, '') ILIKE '%' || $2 || '%'
          OR COALESCE(s.category, '') ILIKE '%' || $2 || '%'
        )
      GROUP BY s.id, u.display_name
      ORDER BY starts_at ASC
      LIMIT $3;
    `;

    const result = await client.query(sql, [scope === 'near' || scope === 'far' ? scope : 'all', q, limit]);
    return json(res, 200, {
      items: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        category: row.category,
        imageUrls: row.image_urls || [],
        hostUserId: row.host_user_id,
        hostName: row.host_name,
        scope: row.discovery_scope,
        distanceMiles: Number(row.distance_miles),
        startsAt: row.starts_at,
        interestedCount: row.interested_count,
      })),
    });
  } finally {
    client.release();
  }
}

async function handleCreateJoinRequest(req, res, sidequestId) {
  const body = await readBody(req);
  const requesterId = typeof body.requesterId === 'string'
    ? body.requesterId
    : (typeof body.requester_id === 'string' ? body.requester_id : null);
  const requesterName = typeof body.requesterName === 'string' && body.requesterName.trim()
    ? body.requesterName.trim()
    : (typeof body.requester_name === 'string' && body.requester_name.trim() ? body.requester_name.trim() : 'Traveler');
  const message = typeof body.message === 'string'
    ? body.message.trim()
    : (typeof body.request_message === 'string' ? body.request_message.trim() : null);
  const normalizedMessage = message && message.length ? message : null;

  const normalizedRequesterName = requesterName && requesterName.length
    ? requesterName
    : 'Traveler';

  const client = await pool.connect();
  try {
    const sql = `
      INSERT INTO sidequest_join_requests (sidequest_id, requester_id, requester_name, message)
      VALUES ($1::uuid, $2::uuid, $3::text, $4::text)
      ON CONFLICT (sidequest_id, requester_id)
      DO UPDATE SET
        requester_name = EXCLUDED.requester_name,
        message = EXCLUDED.message,
        status = 'pending',
        updated_at = NOW()
      RETURNING id, sidequest_id, requester_id, requester_name, message, status, created_at, updated_at;
    `;

    const result = await client.query(sql, [sidequestId, requesterId, normalizedRequesterName, normalizedMessage]);
    return json(res, 201, { joinRequest: result.rows[0] });
  } finally {
    client.release();
  }
}

async function handleFollowHost(req, res, hostUserId) {
  const body = await readBody(req);
  const followerId = typeof body.followerId === 'string'
    ? body.followerId
    : (typeof body.follower_id === 'string' ? body.follower_id : req.headers['x-user-id']);

  if (!followerId || typeof followerId !== 'string') {
    return json(res, 400, { error: 'followerId is required' });
  }

  const client = await pool.connect();
  try {
    const sql = `
      INSERT INTO host_follows (host_user_id, follower_id)
      VALUES ($1::uuid, $2::uuid)
      ON CONFLICT (host_user_id, follower_id) DO NOTHING;
    `;

    await client.query(sql, [hostUserId, followerId]);
    return json(res, 200, {
      followed: true,
      hostUserId,
      followerId,
    });
  } finally {
    client.release();
  }
}

async function handleCreateSidequest(req, res) {
  const body = await readBody(req);
  const userId = typeof body.userId === 'string'
    ? body.userId
    : (typeof body.user_id === 'string' ? body.user_id : null);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' && body.description.trim()
    ? body.description.trim()
    : 'Personal sidequest';
  const location = typeof body.location === 'string' && body.location.trim()
    ? body.location.trim()
    : null;
  const category = typeof body.category === 'string' && body.category.trim()
    ? body.category.trim().toLowerCase()
    : 'other';
  const imageUrlsRaw = Array.isArray(body.imageUrls)
    ? body.imageUrls
    : (Array.isArray(body.image_urls) ? body.image_urls : []);
  const imageUrls = imageUrlsRaw.filter((x) => typeof x === 'string');

  if (!userId) return json(res, 400, { error: 'userId is required' });
  if (!title) return json(res, 400, { error: 'title is required' });

  const client = await pool.connect();
  try {
    const insert = await client.query(
      `
        INSERT INTO sidequest_activities (user_id, title, description, category, location, image_urls)
        VALUES ($1::uuid, $2::text, $3::text, $4::text, $5::text, $6::text[])
        RETURNING id;
      `,
      [userId, title, description, category, location, imageUrls]
    );

    const sidequestId = insert.rows[0].id;

    const hydrated = await client.query(
      `
        SELECT
          s.id,
          s.title,
          s.description,
          s.location,
          s.category,
          s.image_urls,
          s.user_id AS host_user_id,
          COALESCE(u.display_name, 'Host') AS host_name,
          CASE WHEN MOD(ABS(HASHTEXT(s.id::text)), 2) = 0 THEN 'near' ELSE 'far' END AS scope,
          ROUND((1 + MOD(ABS(HASHTEXT(s.id::text)), 220))::numeric / 10.0, 1) AS distance_miles,
          NOW() + MAKE_INTERVAL(hours => MOD(ABS(HASHTEXT((s.id::text || 'start'))), 120)) AS starts_at,
          COALESCE(COUNT(jr.id), 0)::int AS interested_count
        FROM sidequest_activities s
        LEFT JOIN users u ON u.id = s.user_id
        LEFT JOIN sidequest_join_requests jr ON jr.sidequest_id = s.id
        WHERE s.id = $1::uuid
        GROUP BY s.id, u.display_name;
      `,
      [sidequestId]
    );

    const row = hydrated.rows[0];
    return json(res, 201, {
      sidequest: {
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        category: row.category,
        imageUrls: row.image_urls || [],
        hostUserId: row.host_user_id,
        hostName: row.host_name,
        scope: row.scope,
        distanceMiles: Number(row.distance_miles),
        startsAt: row.starts_at,
        interestedCount: row.interested_count,
      },
    });
  } finally {
    client.release();
  }
}

async function handleFollowerCount(res, hostUserId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT COUNT(*)::int AS follower_count FROM host_follows WHERE host_user_id = $1::uuid',
      [hostUserId]
    );

    return json(res, 200, {
      hostUserId,
      followerCount: result.rows[0].follower_count,
    });
  } finally {
    client.release();
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) return notFound(res);

    if (req.method === 'OPTIONS') {
      return json(res, 200, { ok: true });
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/health') {
      const db = await pool.query('SELECT 1 as ok');
      return json(res, 200, {
        status: 'ok',
        db: db.rows[0].ok === 1 ? 'ok' : 'unknown',
        service: 'sidequest-api',
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/v1/sidequests') {
      return await handleListSidequests(req, res, url);
    }

    if (req.method === 'POST' && url.pathname === '/api/v1/sidequests') {
      return await handleCreateSidequest(req, res);
    }

    const joinRequestMatch = url.pathname.match(/^\/api\/v1\/sidequests\/([0-9a-fA-F-]{36})\/join-requests$/);
    if (req.method === 'POST' && joinRequestMatch) {
      return await handleCreateJoinRequest(req, res, joinRequestMatch[1]);
    }

    const followMatch = url.pathname.match(/^\/api\/v1\/hosts\/([0-9a-fA-F-]{36})\/follow$/);
    if (req.method === 'POST' && followMatch) {
      return await handleFollowHost(req, res, followMatch[1]);
    }

    const followersCountMatch = url.pathname.match(/^\/api\/v1\/hosts\/([0-9a-fA-F-]{36})\/followers\/count$/);
    if (req.method === 'GET' && followersCountMatch) {
      return await handleFollowerCount(res, followersCountMatch[1]);
    }

    return notFound(res);
  } catch (error) {
    console.error(error);
    return json(res, 500, {
      error: error instanceof Error ? error.message : 'Unexpected server error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`sidequest-api listening on http://localhost:${PORT}`);
});
