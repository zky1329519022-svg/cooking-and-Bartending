// 默认初始品物数据（只读的静态预设）
const INITIAL_ITEMS = [
  {
    id: 'default-1',
    name: '松露香煎 M9 和牛',
    type: 'cooking',
    description: '精选顶级 M9 级和牛，搭配新鲜黑松露切片。高温热锅两面快速煎香，锁住饱满肉汁，佐以红酒牛肉汁，入口即化，奶香浓郁。',
    image: 'images/gourmet_dish.jpg'
  },
  {
    id: 'default-2',
    name: '暮色极光 (Twilight Aurora)',
    type: 'bartending',
    description: '以金酒为基酒，注入手工酿制的蝶豆花糖浆与新鲜柠檬汁。杯口缀以迷迭香与干柠檬片，干冰烟雾缓缓升腾，营造出北欧极光般的渐变炫彩。',
    image: 'images/cocktail_drink.jpg'
  }
];

// DOM 元素选择
const cardsGrid = document.getElementById('cardsGrid');
const filterBtns = document.querySelectorAll('.tab-btn');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const itemImageInput = document.getElementById('itemImage');
const uploadWrapper = document.getElementById('uploadWrapper');
const uploadText = document.getElementById('uploadText');
const imagePreview = document.getElementById('imagePreview');

// 登录注册 DOM 元素选择
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const authModal = document.getElementById('authModal');
const authForm = document.getElementById('authForm');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authModalTitle = document.getElementById('authModalTitle');
const userInfoWrapper = document.getElementById('userInfoWrapper');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// 状态变量
let currentFilter = 'all';
let customItems = []; // 存云端自定义数据
let currentBase64Image = '';
let authAction = 'login'; // login 或 register

// 初始化函数
function init() {
  checkLoginState();
  fetchCloudItems();
  setupEventListeners();
}

// 检查并更新登录状态 UI
function checkLoginState() {
  const token = localStorage.getItem('gourmet_auth_token');
  const username = localStorage.getItem('gourmet_username');

  if (token && username) {
    // 登录状态
    openAuthModalBtn.style.display = 'none';
    userInfoWrapper.style.display = 'flex';
    usernameDisplay.textContent = username;
    openModalBtn.style.display = 'flex'; // 显示添加按钮
  } else {
    // 未登录状态
    openAuthModalBtn.style.display = 'block';
    userInfoWrapper.style.display = 'none';
    usernameDisplay.textContent = '';
    openModalBtn.style.display = 'none'; // 隐藏添加按钮
  }
}

// 从 Cloudflare KV 异步拉取云端自定义品物
async function fetchCloudItems() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('拉取数据失败');
    
    const data = await res.json();
    if (data.success) {
      customItems = data.items || [];
      renderCards();
    }
  } catch (error) {
    console.error('拉取云端数据发生错误:', error);
  }
}

// 动态渲染品物卡片
function renderCards() {
  // 合并默认数据与云端自定义数据
  const allItems = [...INITIAL_ITEMS, ...customItems];
  
  // 过滤数据
  const filteredItems = allItems.filter(item => {
    if (currentFilter === 'all') return true;
    return item.type === currentFilter;
  });

  // 清空网格
  cardsGrid.innerHTML = '';

  if (filteredItems.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <p>暂无此类别的品物，管理员登录后即可添加新内容！</p>
      </div>
    `;
    return;
  }

  // 检查是否登录以决定是否渲染删除按钮
  const token = localStorage.getItem('gourmet_auth_token');

  // 渲染卡片
  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = `item-card ${item.type}`;
    card.setAttribute('data-id', item.id);

    const typeLabel = item.type === 'cooking' ? '美食' : '调酒';
    const creatorText = item.createdBy ? `<small style="display:block;margin-top:6px;font-size:0.75rem;color:var(--text-muted);">发布者: ${item.createdBy}</small>` : '';

    // 自定义卡片且已登录，渲染删除按钮
    const isCustom = item.id.startsWith('custom-');
    const deleteBtnHtml = (token && isCustom) ? `
      <button class="card-delete-btn" data-id="${item.id}" title="删除此品物">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    ` : '';

    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="card-badge">${typeLabel}</span>
        <img src="${item.image}" alt="${item.name}" loading="lazy">
        ${deleteBtnHtml}
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-description">${item.description}</p>
        ${creatorText}
      </div>
    `;

    cardsGrid.appendChild(card);
  });
}

// 监听事件绑定
function setupEventListeners() {
  // 1. 过滤选项卡切换
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderCards();
    });
  });

  // 2. 添加品物模态框控制
  openModalBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeAddModal);
  cancelBtn.addEventListener('click', closeAddModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddModal();
  });

  // 3. 登录注册模态框控制
  openAuthModalBtn.addEventListener('click', openAuthModal);
  closeAuthModalBtn.addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  // 4. 登录/注册模式切换
  authSwitchBtn.addEventListener('click', () => {
    if (authAction === 'login') {
      authAction = 'register';
      authModalTitle.textContent = '创建管理员账号';
      authSubmitBtn.textContent = '立即注册';
      authSwitchBtn.textContent = '切换到登录';
    } else {
      authAction = 'login';
      authModalTitle.textContent = '管理员登录';
      authSubmitBtn.textContent = '立即登录';
      authSwitchBtn.textContent = '切换到注册';
    }
  });

  // 5. 退出登录
  logoutBtn.addEventListener('click', handleLogout);

  // 6. 图片文件选择与拖拽
  itemImageInput.addEventListener('change', handleImageSelect);
  
  uploadWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadWrapper.style.borderColor = 'rgba(255, 255, 255, 0.4)';
    uploadWrapper.style.background = 'rgba(255, 255, 255, 0.04)';
  });

  uploadWrapper.addEventListener('dragleave', () => {
    uploadWrapper.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    uploadWrapper.style.background = 'transparent';
  });

  uploadWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadWrapper.style.borderColor = 'rgba(255, 255, 255, 0.12)';
    uploadWrapper.style.background = 'transparent';
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      itemImageInput.files = e.dataTransfer.files;
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  // 7. 表单提交与网格点击代理
  authForm.addEventListener('submit', handleAuthSubmit);
  addForm.addEventListener('submit', handleAddFormSubmit);
  cardsGrid.addEventListener('click', handleGridClick);
}

// 模态框打开/关闭辅助
function openAddModal() {
  addModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAddModal() {
  addModal.classList.remove('active');
  document.body.style.overflow = '';
  addForm.reset();
  resetImageUpload();
}

function openAuthModal() {
  authAction = 'login';
  authModalTitle.textContent = '管理员登录';
  authSubmitBtn.textContent = '立即登录';
  authSwitchBtn.textContent = '切换到注册';
  authModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  authModal.classList.remove('active');
  document.body.style.overflow = '';
  authForm.reset();
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('gourmet_auth_token');
  localStorage.removeItem('gourmet_username');
  checkLoginState();
  alert('您已退出登录');
}

// 重置图片上传预览
function resetImageUpload() {
  currentBase64Image = '';
  imagePreview.style.display = 'none';
  imagePreview.src = '';
  uploadText.style.display = 'block';
  const icon = uploadWrapper.querySelector('.upload-icon');
  if (icon) icon.style.display = 'block';
}

// 处理图片选择
function handleImageSelect(e) {
  if (e.target.files && e.target.files[0]) {
    handleImageFile(e.target.files[0]);
  }
}

// 将图片读取并在前端进行高质量 Canvas 等比压缩，解除上传大小上限限制
function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件');
    return;
  }

  // 显示临时优化提示
  uploadText.textContent = '正在优化图片大小...';

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // 极致优化的最大边长限制（1600px，在视网膜屏幕及手机上展示依然完美高清）
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 前端质量压缩，使用 0.85 (85% JPEG 质量)，可在无损视觉的前提下，将 10MB 的图降至 300KB
      currentBase64Image = canvas.toDataURL('image/jpeg', 0.85);

      // 显示预览图，恢复文字及图标的隐藏
      imagePreview.src = currentBase64Image;
      imagePreview.style.display = 'block';
      uploadText.style.display = 'none';
      uploadText.textContent = '点击或拖拽上传图片'; // 还原文字
      const icon = uploadWrapper.querySelector('.upload-icon');
      if (icon) icon.style.display = 'none';
    };
    img.onerror = function() {
      alert('加载图片失败，请重试');
      resetImageUpload();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 处理登录与注册的提交
async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  try {
    const res = await fetch(`/api/auth?action=${authAction}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (!res.ok || !data.success) {
      alert(data.message || '操作失败');
      return;
    }

    if (authAction === 'register') {
      alert(data.message || '注册成功！已切换到登录界面，请输入刚才注册的账户密码。');
      authAction = 'login';
      authModalTitle.textContent = '管理员登录';
      authSubmitBtn.textContent = '立即登录';
      authSwitchBtn.textContent = '切换到注册';
      document.getElementById('authPassword').value = '';
    } else {
      // 登录成功
      localStorage.setItem('gourmet_auth_token', data.token);
      localStorage.setItem('gourmet_username', data.username);
      checkLoginState();
      closeAuthModal();
      alert('登录成功！您现在可以添加和发布美食调酒了。');
      // 登录后重新拉取最新列表
      fetchCloudItems();
    }

  } catch (error) {
    alert(`网络请求发生错误: ${error.message}`);
  }
}

// 处理添加卡片提交（发送到云端 KV）
async function handleAddFormSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem('gourmet_auth_token');
  if (!token) {
    alert('登录已失效，请重新登录后再试');
    checkLoginState();
    closeAddModal();
    return;
  }

  const type = document.getElementById('itemType').value;
  const name = document.getElementById('itemName').value.trim();
  const description = document.getElementById('itemDescription').value.trim();

  if (!currentBase64Image) {
    alert('请上传一张图片');
    return;
  }

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name,
        type,
        description,
        image: currentBase64Image
      })
    });

    const data = await res.json();

    if (res.status === 401) {
      alert('登录状态已失效，请重新登录');
      localStorage.removeItem('gourmet_auth_token');
      localStorage.removeItem('gourmet_username');
      checkLoginState();
      closeAddModal();
      return;
    }

    if (!res.ok || !data.success) {
      alert(data.message || '发布失败');
      return;
    }

    alert('发布成功！内容已实时同步至云端。');
    
    // 把新项目塞进当前列表首位并渲染
    customItems.unshift(data.item);
    renderCards();
    closeAddModal();

  } catch (error) {
    alert(`发布数据失败，网络异常: ${error.message}`);
  }
}

// 处理网格中的点击事件（主要用于删除卡片）
async function handleGridClick(e) {
  const deleteBtn = e.target.closest('.card-delete-btn');
  if (!deleteBtn) return;

  const itemId = deleteBtn.getAttribute('data-id');
  if (!itemId) return;

  if (!confirm('确定要永久删除这道品物吗？该操作无法恢复。')) {
    return;
  }

  const token = localStorage.getItem('gourmet_auth_token');
  if (!token) {
    alert('登录已失效，请重新登录');
    checkLoginState();
    return;
  }

  try {
    const res = await fetch(`/api/items?id=${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.status === 401) {
      alert('登录已失效，请重新登录');
      localStorage.removeItem('gourmet_auth_token');
      localStorage.removeItem('gourmet_username');
      checkLoginState();
      return;
    }

    if (!res.ok || !data.success) {
      alert(data.message || '删除失败');
      return;
    }

    alert('品物删除成功！');
    
    // 前端过滤该品物并重新渲染
    customItems = customItems.filter(item => item.id !== itemId);
    renderCards();

  } catch (error) {
    alert(`删除请求失败，网络异常: ${error.message}`);
  }
}

// 页面加载完成后启动
window.addEventListener('DOMContentLoaded', init);
