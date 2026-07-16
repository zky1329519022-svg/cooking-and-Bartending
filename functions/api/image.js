// 选项接口支持 CORS 预检
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// 处理 GET 请求：从 KV 中提取图片 Base64 编码，并转换为二进制数据流，配备 Cache-Control 强缓存
export async function onRequestGet(context) {
  const { request, env } = context;
  
  if (!env.ITEMS_KV) {
    return new Response("Database not bound", { status: 500 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response("Missing id parameter", { status: 400 });
  }

  try {
    const rawBase64 = await env.ITEMS_KV.get(`image:${id}`);
    if (!rawBase64) {
      return new Response("Image not found", { status: 404 });
    }

    // 默认类型与默认数据初始化
    let base64Data = rawBase64;
    let contentType = 'image/jpeg';

    // 如果存入的值是 data:image/xxx;base64,前缀格式，提取后面的真实 Base64 字符串与 Content-Type
    if (rawBase64.startsWith('data:')) {
      const parts = rawBase64.split(',');
      const meta = parts[0];
      base64Data = parts[1] || '';
      
      const match = meta.match(/data:([^;]+)/);
      if (match) {
        contentType = match[1];
      }
    }

    // 在 Cloudflare Workers 环境下使用 JS 內置 atob 转换为二进制 Buffer 响应
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': contentType,
        // 允许跨域
        'Access-Control-Allow-Origin': '*',
        // 强缓存，允许浏览器本地长达 1 年强缓存，完全免去重复加载时的网络请求，大大提升国内速度！
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    return new Response(`Retrieving image failed: ${error.message}`, { status: 500 });
  }
}
