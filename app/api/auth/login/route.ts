import type { NextRequest } from 'next/server';
import { Rcon } from 'rcon-client';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
};

export async function OPTIONS() {
    return new Response(null, { headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
    try {
        if (typeof process.env.ADMIN_PASSWORD !== 'string') {
            return new Response(JSON.stringify({ success: false, error: '服务器配置不正确。', data: null }), { status: 500, headers: CORS_HEADERS });
        }

        let data;
        try {
            data = await request.json();
        } catch (error) {
            return new Response(JSON.stringify({ success: false, error: '请求体不是有效的JSON格式。', data: null }), { status: 400, headers: CORS_HEADERS });
        }
        if (!data.password || typeof data.password !== 'string') {
            return new Response(JSON.stringify({ success: false, error: '缺少密码。', data: null }), { status: 401, headers: CORS_HEADERS });
        }
        if (data.password !== process.env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ success: false, error: '密码错误。', data: null }), { status: 403, headers: CORS_HEADERS });
        }

        const rconHost = typeof data.rconHost === 'string' && data.rconHost ? data.rconHost : process.env.RCON_HOST;
        const rconPort = typeof data.rconPort === 'string' && data.rconPort ? data.rconPort : process.env.RCON_PORT;
        const rconPassword = typeof data.rconPassword === 'string' && data.rconPassword ? data.rconPassword : process.env.RCON_PASSWORD;
        if (!rconHost || !rconPort || !rconPassword) {
            return new Response(JSON.stringify({ success: false, error: 'RCON配置不完整。', data: null }), { status: 400, headers: CORS_HEADERS });
        }
        try {
            const rcon = await Rcon.connect({ host: rconHost, port: Number(rconPort), password: rconPassword });
            await rcon.end();
        } catch (err) {
            return new Response(JSON.stringify({ success: false, error: 'RCON连接失败，请检查配置和密码。', data: null }), { status: 403, headers: CORS_HEADERS });
        }

        return new Response(JSON.stringify({ success: true, error: null, data: { message: '认证成功，RCON可用。' } }), { status: 200, headers: CORS_HEADERS });
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: '服务器内部错误。', data: null }), { status: 500, headers: CORS_HEADERS }
        );
    }
}
