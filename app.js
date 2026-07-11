// ==========================================
// 1. 静态初始预设数据
// ==========================================

// 自制（手作风味）预设数据
const INITIAL_CREATION_ITEMS = [
  {
    id: 'default-creation-1',
    name: '松露香煎 M9 和牛',
    type: 'cooking',
    description: '精选顶级 M9 级和牛，搭配新鲜黑松露切片。高温热锅两面快速煎香，锁住饱满肉汁，佐以红酒牛肉汁，入口即化，奶香浓郁。',
    image: 'images/gourmet_dish.jpg'
  },
  {
    id: 'default-creation-2',
    name: '暮色极光 (Twilight Aurora)',
    type: 'bartending',
    description: '以金酒为基酒，注入手工酿制的蝶豆花糖浆与新鲜柠檬汁。杯口缀以迷迭香与干柠檬片，干冰烟雾缓缓升腾，营造出北欧极光般的渐变炫彩。',
    image: 'images/cocktail_drink.jpg'
  }
];

// 品尝（探店寻味）预设数据
const INITIAL_TASTING_ITEMS = [
  {
    id: 'default-tasting-1',
    name: '法式酥皮惠灵顿牛排',
    type: 'cooking',
    description: '精选安格斯牛柳，包裹细腻的松露蘑菇酱和帕尔玛火腿。外层金黄酥皮网格烤制得恰到好处，切开后牛肉呈现粉嫩的五分熟，肉汁丰盈，酥脆与鲜嫩交织。',
    image: 'images/tasting_steak.jpg'
  }
];

// ==========================================
// 2. DOM 元素选择
// ==========================================

// 视口容器
const homeView = document.getElementById('homeView');
const listView = document.getElementById('listView');

// 首页入口
const enterCreationsBtn = document.getElementById('enterCreationsBtn');
const enterTastingsBtn = document.getElementById('enterTastingsBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// 列表视口头部元素
const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');
const subPageTitle = document.getElementById('subPageTitle');
const subPageDesc = document.getElementById('subPageDesc');
const addModalTitle = document.getElementById('addModalTitle');

// 品物网格与控制器
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

// 登录注册相关（子页面版）
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

// 登录注册相关（首页版）
const openAuthModalBtnHome = document.getElementById('openAuthModalBtnHome');
const userInfoWrapperHome = document.getElementById('userInfoWrapperHome');
const usernameDisplayHome = document.getElementById('usernameDisplayHome');
const logoutBtnHome = document.getElementById('logoutBtnHome');

// ==========================================
// 3. 状态变量
// ==========================================
let currentCategory = 'creations'; // creations = 手作风味, tastings = 探店寻味
let currentFilter = 'all';        // all, cooking, bartending
let customItems = [];             // 存储拉取下来的云端自定义数据
let currentBase64Image = '';
let authAction = 'login';         // login 或 register

// ==========================================
// 4. 初始化与状态同步
// ==========================================
function init() {
  checkLoginState();
  setupEventListeners();
}

// 检查并更新全页面登录状态 UI
function checkLoginState() {
  const token = localStorage.getItem('gourmet_auth_token');
  const username = localStorage.getItem('gourmet_username');

  // 子页面状态更新
  if (token && username) {
    openAuthModalBtn.style.display = 'none';
    userInfoWrapper.style.display = 'flex';
    usernameDisplay.textContent = username;
    openModalBtn.style.display = 'flex'; // 显示添加按钮
    
    // 首页状态更新
    openAuthModalBtnHome.style.display = 'none';
    userInfoWrapperHome.style.display = 'flex';
    usernameDisplayHome.textContent = username;
  } else {
    openAuthModalBtn.style.display = 'block';
    userInfoWrapper.style.display = 'none';
    usernameDisplay.textContent = '';
    openModalBtn.style.display = 'none'; // 隐藏添加按钮

    // 首页状态更新
    openAuthModalBtnHome.style.display = 'block';
    userInfoWrapperHome.style.display = 'none';
    usernameDisplayHome.textContent = '';
  }
}

// ==========================================
// 5. 虚拟路由视口切换逻辑
// ==========================================
function switchView(viewName, category = 'creations') {
  if (viewName === 'home') {
    listView.classList.remove('active');
    homeView.classList.add('active');
    // 返回首页重置过滤状态
    currentFilter = 'all';
    filterBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-filter') === 'all') btn.classList.add('active');
    });
  } else if (viewName === 'list') {
    currentCategory = category;
    
    // 动态调整子页面头部文案与标题
    if (category === 'creations') {
      breadcrumbCurrent.textContent = '手作风味';
      subPageTitle.textContent = '手作风味';
      subPageDesc.textContent = '记录我亲手烹煮的食物与调配的酒汁';
      addModalTitle.textContent = '添加新风味 (Creations)';
    } else {
      breadcrumbCurrent.textContent = '探店寻味';
      subPageTitle.textContent = '探店寻味';
      subPageDesc.textContent = '记录我在外界品尝到的精美菜肴与醇香酒浆';
      addModalTitle.textContent = '添加品尝记录 (Tastings)';
    }

    homeView.classList.remove('active');
    listView.classList.add('active');

    // 拉取相应类别的数据
    fetchCloudItems(category);
  }
}

// ==========================================
// 6. 云端 API 读写逻辑
// ==========================================

// 从 Cloudflare KV 中读取列表
async function fetchCloudItems(category) {
  cardsGrid.innerHTML = `
    <div class="empty-state">
      <p>正在从云端加载精美风味...</p>
    </div>
  `;
  
  try {
    const res = await fetch(`/api/items?category=${category}`);
    if (!res.ok) throw new Error('网络异常');
    
    const data = await res.json();
    if (data.success) {
      customItems = data.items || [];
      renderCards();
    }
  } catch (error) {
    console.error('拉取数据失败:', error);
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <p style="color:var(--accent-tasting);">云端数据拉取失败，请检查网络或刷新重试</p>
      </div>
    `;
  }
}

// 动态渲染品物卡片
function renderCards() {
  // 根据所处大分类挑选预设数据
  const presetItems = currentCategory === 'tastings' ? INITIAL_TASTING_ITEMS : INITIAL_CREATION_ITEMS;
  const allItems = [...presetItems, ...customItems];
  
  // 美食/调酒分类过滤
  const filteredItems = allItems.filter(item => {
    if (currentFilter === 'all') return true;
    return item.type === currentFilter;
  });

  cardsGrid.innerHTML = '';

  if (filteredItems.length === 0) {
    cardsGrid.innerHTML = `
      <div class="empty-state">
        <p>暂无此类别的品物，管理员登录后即可添加新内容！</p>
      </div>
    `;
    return;
  }

  // 渲染卡片
  filteredItems.forEach(item => {
    const card = document.createElement('div');
    card.className = `item-card ${item.type}`;
    card.setAttribute('data-id', item.id);

    const typeLabel = item.type === 'cooking' ? '美食' : '调酒';
    const creatorText = item.createdBy ? `<small style="display:block;margin-top:6px;font-size:0.75rem;color:var(--text-muted);">记录人: ${item.createdBy}</small>` : '';

    // 判断该卡片是否为自定义内容，且管理员已登录，才显示删除按钮
    const isCustom = item.id.startsWith('custom-');
    const token = localStorage.getItem('gourmet_auth_token');
    const deleteBtnHtml = (token && isCustom) ? `
      <button class="card-delete-btn" data-id="${item.id}" title="删除此品物">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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

// ==========================================
// 7. 监听事件绑定
// ==========================================
function setupEventListeners() {
  // 1. 首页入口跳转与返回
  enterCreationsBtn.addEventListener('click', () => switchView('list', 'creations'));
  enterTastingsBtn.addEventListener('click', () => switchView('list', 'tastings'));
  backToHomeBtn.addEventListener('click', () => switchView('home'));

  // 2. 子页面分类选项卡切换
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter');
      renderCards();
    });
  });

  // 3. 添加品物模态框控制
  openModalBtn.addEventListener('click', openAddModal);
  closeModalBtn.addEventListener('click', closeAddModal);
  cancelBtn.addEventListener('click', closeAddModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddModal();
  });

  // 4. 登录注册模态框控制（子页面版 & 首页版）
  openAuthModalBtn.addEventListener('click', openAuthModal);
  openAuthModalBtnHome.addEventListener('click', openAuthModal);
  closeAuthModalBtn.addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  // 5. 登录/注册模式切换
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

  // 6. 退出登录（子页面版 & 首页版）
  logoutBtn.addEventListener('click', handleLogout);
  logoutBtnHome.addEventListener('click', handleLogout);

  // 7. 图片文件选择与拖拽
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

  // 8. 表单提交与网格点击代理
  authForm.addEventListener('submit', handleAuthSubmit);
  addForm.addEventListener('submit', handleAddFormSubmit);
  cardsGrid.addEventListener('click', handleGridClick);
}

// ==========================================
// 8. 辅助交互函数
// ==========================================

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

function handleLogout() {
  localStorage.removeItem('gourmet_auth_token');
  localStorage.removeItem('gourmet_username');
  checkLoginState();
  alert('您已退出登录');
}

function resetImageUpload() {
  currentBase64Image = '';
  imagePreview.style.display = 'none';
  imagePreview.src = '';
  uploadText.style.display = 'block';
  const icon = uploadWrapper.querySelector('.upload-icon');
  if (icon) icon.style.display = 'block';
}

function handleImageSelect(e) {
  if (e.target.files && e.target.files[0]) {
    handleImageFile(e.target.files[0]);
  }
}

// 智能 Canvas 压缩
function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件');
    return;
  }

  uploadText.textContent = '正在优化图片大小...';

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

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

      currentBase64Image = canvas.toDataURL('image/jpeg', 0.85);

      imagePreview.src = currentBase64Image;
      imagePreview.style.display = 'block';
      uploadText.style.display = 'none';
      uploadText.textContent = '点击或拖拽上传图片';
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

// 登录注册提交
async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;

  try {
    const res = await fetch(`/api/auth?action=${authAction}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (!res.ok || !data.success) {
      alert(data.message || '操作失败');
      return;
    }

    if (authAction === 'register') {
      alert(data.message || '注册成功！已切换到登录界面。');
      authAction = 'login';
      authModalTitle.textContent = '管理员登录';
      authSubmitBtn.textContent = '立即登录';
      authSwitchBtn.textContent = '切换到注册';
      document.getElementById('authPassword').value = '';
    } else {
      localStorage.setItem('gourmet_auth_token', data.token);
      localStorage.setItem('gourmet_username', data.username);
      checkLoginState();
      closeAuthModal();
      alert('登录成功！已解锁数据管理功能。');
      
      // 若处于列表视口中，刷新该分类列表
      if (listView.classList.contains('active')) {
        fetchCloudItems(currentCategory);
      }
    }
  } catch (error) {
    alert(`网络请求错误: ${error.message}`);
  }
}

// 添加数据提交（含当前分类 category 变量）
async function handleAddFormSubmit(e) {
  e.preventDefault();

  const token = localStorage.getItem('gourmet_auth_token');
  if (!token) {
    alert('登录已失效，请重新登录');
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
        image: currentBase64Image,
        category: currentCategory // 注入自制或品尝的所属分类
      })
    });

    const data = await res.json();

    if (res.status === 401) {
      alert('登录已失效，请重新登录');
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

    alert('发布成功！内容已同步至云端。');
    customItems.unshift(data.item);
    renderCards();
    closeAddModal();

  } catch (error) {
    alert(`发布失败，网络异常: ${error.message}`);
  }
}

// 删除品物品交互（带 category 参数）
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
    // 请求里加入 category 参数，以删除对应 KV 键值里的数据
    const res = await fetch(`/api/items?id=${itemId}&category=${currentCategory}`, {
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

    alert('品物已从云端永久删除。');
    customItems = customItems.filter(item => item.id !== itemId);
    renderCards();

  } catch (error) {
    alert(`删除失败，网络异常: ${error.message}`);
  }
}

// 页面加载完成后启动
window.addEventListener('DOMContentLoaded', init);
