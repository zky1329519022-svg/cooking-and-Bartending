// 统一返回 JSON 格式
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// 验证用户登录状态并返回用户名
async function validateUser(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  return await env.ITEMS_KV.get(`session:${token}`);
}

// 根据分类名称获取对应的 KV 键名
function getKvKey(category) {
  return category === 'tastings' ? 'tasting_items_list' : 'gourmet_items_list';
}

// 处理 GET 请求：根据分类获取数据列表 (creations = 自制, tastings = 品尝)
export async function onRequestGet(context) {
  const { request, env } = context;
  
  if (!env.ITEMS_KV) {
    return jsonResponse({ success: false, message: "数据库未绑定！" }, 500);
  }

  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'creations';
  const kvKey = getKvKey(category);

  try {
    const listData = await env.ITEMS_KV.get(kvKey);
    const items = listData ? JSON.parse(listData) : [];
    return jsonResponse({ success: true, items });
  } catch (error) {
    return jsonResponse({ success: false, message: `获取数据失败: ${error.message}` }, 500);
  }
}

// 处理 POST 请求：提交添加新项目（需要登录鉴权，支持分类）
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.ITEMS_KV) {
    return jsonResponse({ success: false, message: "数据库未绑定！" }, 500);
  }

  try {
    // 1. 鉴权验证
    const username = await validateUser(request, env);
    if (!username) {
      return jsonResponse({ success: false, message: "未登录或登录状态已失效，请重新登录" }, 401);
    }

    // 2. 读取上传的内容
    const body = await request.json();
    const { name, type, description, image, category } = body;

    if (!name || !type || !description || !image) {
      return jsonResponse({ success: false, message: "品物信息不完整" }, 400);
    }

    const itemCategory = category || 'creations';
    const kvKey = getKvKey(itemCategory);

    // 3. 构建新对象，把图片数据独立拆分存储，防止大体积 JSON 导致国内网络超时阻断
    const itemId = `custom-${Date.now()}`;
    await env.ITEMS_KV.put(`image:${itemId}`, image);

    const newItem = {
      id: itemId,
      name: name.trim(),
      type,
      description: description.trim(),
      image: "kv", // 占位符，图片走独立分发路由以支持浏览器强缓存，从根本解决国内不连 VPN 慢的问题
      createdBy: username,
      createdAt: new Date().toISOString()
    };

    // 4. 读取云端列表并合并写入
    let items = [];
    const listData = await env.ITEMS_KV.get(kvKey);
    if (listData) {
      items = JSON.parse(listData);
    }

    // 新添加的内容放在前面
    items.unshift(newItem);
    await env.ITEMS_KV.put(kvKey, JSON.stringify(items));

    return jsonResponse({ success: true, item: newItem });

  } catch (error) {
    return jsonResponse({ success: false, message: `添加数据失败: ${error.message}` }, 500);
  }
}

// 处理 DELETE 请求：删除指定的自定义品物（需要登录鉴权，支持分类）
export async function onRequestDelete(context) {
  const { request, env } = context;

  if (!env.ITEMS_KV) {
    return jsonResponse({ success: false, message: "数据库未绑定！" }, 500);
  }

  try {
    // 1. 鉴权验证
    const username = await validateUser(request, env);
    if (!username) {
      return jsonResponse({ success: false, message: "未登录或登录状态已失效，请重新登录" }, 401);
    }

    // 2. 解析待删除品物 ID 与 分类
    const url = new URL(request.url);
    const itemId = url.searchParams.get('id');
    const category = url.searchParams.get('category') || 'creations';

    if (!itemId) {
      return jsonResponse({ success: false, message: "缺少待删除的品物 ID" }, 400);
    }

    const kvKey = getKvKey(category);

    // 3. 读取云端列表并过滤
    let items = [];
    const listData = await env.ITEMS_KV.get(kvKey);
    if (listData) {
      items = JSON.parse(listData);
    }

    const initialLength = items.length;
    items = items.filter(item => item.id !== itemId);

    if (items.length === initialLength) {
      return jsonResponse({ success: false, message: "未找到该品物或该品物不支持删除" }, 404);
    }

    // 4. 写回云端 KV，并同步删除已剥离的图片大文件
    await env.ITEMS_KV.put(kvKey, JSON.stringify(items));
    try {
      await env.ITEMS_KV.delete(`image:${itemId}`);
    } catch (err) {
      console.warn(`Associated image: ${itemId} cleanup failed: ${err.message}`);
    }

    return jsonResponse({ success: true, message: "品物已成功从云端删除" });

  } catch (error) {
    return jsonResponse({ success: false, message: `删除数据失败: ${error.message}` }, 500);
  }
}

// 选项接口支持
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
