// 统一返回 JSON 格式
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 导出 POST 方法处理管理员验证登录
export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!env.ITEMS_KV) {
    return jsonResponse({ 
      success: false, 
      message: "数据库未绑定！请确保在 Cloudflare Pages 后台绑定了名为 ITEMS_KV 的 KV 命名空间。" 
    }, 500);
  }

  try {
    const body = await request.json();
    const key = body.key || '';

    if (!key) {
      return jsonResponse({ success: false, message: "管理密钥不能为空" }, 400);
    }

    // 单一密钥比对
    if (key !== 'qwe123456') {
      return jsonResponse({ success: false, message: "密钥错误，验证失败" }, 401);
    }

    // 验证成功，生成随机 Token 并存入 KV 中作为管理员会话，有效期为 7 天
    const token = crypto.randomUUID();
    await env.ITEMS_KV.put(`session:${token}`, "管理员", { expirationTtl: 3600 * 24 * 7 });

    return jsonResponse({
      success: true,
      message: "验证登录成功",
      token,
      username: "管理员"
    });

  } catch (error) {
    return jsonResponse({ success: false, message: `服务器内部错误: ${error.message}` }, 500);
  }
}

// 导出 OPTIONS 方法以支持 CORS 预检
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
