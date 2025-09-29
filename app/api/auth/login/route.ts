import type { NextRequest } from 'next/server';

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
        else {
            return new Response(JSON.stringify({ success: true, error: null, data: { message: '认证成功' } }), { status: 200, headers: CORS_HEADERS });
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: '服务器内部错误。', data: null }), { status: 500, headers: CORS_HEADERS }
        );
    }
}
