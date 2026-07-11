// 辅助函数：计算 SHA-256 哈希
async function hashPassword(password) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

// 导出 POST 方法处理登录/注册
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 检查是否绑定了 KV 数据库
  if (!env.ITEMS_KV) {
    return jsonResponse({ 
      success: false, 
      message: "数据库未绑定！请确保在 Cloudflare Pages 后台绑定了名为 ITEMS_KV 的 KV 命名空间。" 
    }, 500);
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // login 或 register
  
  try {
    const body = await request.json();
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!username || !password) {
      return jsonResponse({ success: false, message: "用户名或密码不能为空" }, 400);
    }

    if (username.length < 3 || password.length < 6) {
      return jsonResponse({ success: false, message: "用户名至少3位，密码至少6位" }, 400);
    }

    // 1. 获取已存在的用户列表
    let users = [];
    const usersData = await env.ITEMS_KV.get('users_list');
    if (usersData) {
      users = JSON.parse(usersData);
    }

    const passwordHash = await hashPassword(password);

    // 2. 注册逻辑
    if (action === 'register') {
      const userExists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
      if (userExists) {
        return jsonResponse({ success: false, message: "该用户名已被注册" }, 400);
      }

      users.push({ username, passwordHash });
      await env.ITEMS_KV.put('users_list', JSON.stringify(users));

      return jsonResponse({ success: true, message: "注册成功，请前往登录" });
    }

    // 3. 登录逻辑
    if (action === 'login') {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (!user || user.passwordHash !== passwordHash) {
        return jsonResponse({ success: false, message: "用户名或密码错误" }, 401);
      }

      // 生成随机 Token 并存入 KV 中，过期时间设为 7 天 (3600 * 24 * 7)
      const token = crypto.randomUUID();
      await env.ITEMS_KV.put(`session:${token}`, username, { expirationTtl: 3600 * 24 * 7 });

      return jsonResponse({
        success: true,
        message: "登录成功",
        token,
        username
      });
    }

    return jsonResponse({ success: false, message: "未知的 action 指令" }, 400);

  } catch (error) {
    return jsonResponse({ success: false, message: `服务器内部错误: ${error.message}` }, 500);
  }
}

// 导出 OPTIONS 方法以支持 CORS 跨域请求预检
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
