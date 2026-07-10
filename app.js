// 默认初始品物数据
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

// 状态变量
let currentFilter = 'all';
let customItems = [];
let currentBase64Image = '';

// 初始化函数
function init() {
  loadCustomItems();
  renderCards();
  setupEventListeners();
}

// 从本地存储加载自定义品物
function loadCustomItems() {
  const stored = localStorage.getItem('gourmet_mixology_items');
  if (stored) {
    try {
      customItems = JSON.parse(stored);
    } catch (e) {
      console.error('解析本地存储失败，清空本地存储', e);
      customItems = [];
    }
  }
}

// 保存自定义品物到本地存储
function saveCustomItems() {
  localStorage.setItem('gourmet_mixology_items', JSON.stringify(customItems));
}

// 动态渲染品物卡片
function renderCards() {
  // 合并默认数据与自定义数据
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
        <p>暂无此类别的品物，点击右上角开始添加吧！</p>
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

    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="card-badge">${typeLabel}</span>
        <img src="${item.image}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-description">${item.description}</p>
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

  // 2. 模态框打开与关闭
  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // 点击模态框背景关闭
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) {
      closeModal();
    }
  });

  // 3. 图片文件拖拽与选择上传
  itemImageInput.addEventListener('change', handleImageSelect);

  // 拖拽高亮处理
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

  // 4. 表单提交
  addForm.addEventListener('submit', handleFormSubmit);
}

// 开启模态框
function openModal() {
  addModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // 阻止背景滚动
}

// 关闭模态框并重置表单
function closeModal() {
  addModal.classList.remove('active');
  document.body.style.overflow = '';
  addForm.reset();
  resetImageUpload();
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

// 将图片读取并转换为 Base64
function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件');
    return;
  }

  // 限制图片大小为 2MB 以防止 localStorage 超限
  if (file.size > 2 * 1024 * 1024) {
    alert('为了保证页面性能，图片大小请不要超过 2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    currentBase64Image = e.target.result;
    
    // 显示预览图，隐藏图标和文字说明
    imagePreview.src = currentBase64Image;
    imagePreview.style.display = 'block';
    uploadText.style.display = 'none';
    const icon = uploadWrapper.querySelector('.upload-icon');
    if (icon) icon.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// 处理表单提交并添加新项目
function handleFormSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('itemType').value;
  const name = document.getElementById('itemName').value.trim();
  const description = document.getElementById('itemDescription').value.trim();

  if (!currentBase64Image) {
    alert('请上传一张图片');
    return;
  }

  const newItem = {
    id: 'custom-' + Date.now(),
    name,
    type,
    description,
    image: currentBase64Image
  };

  // 添加到自定义列表首位以在渲染时靠前显示
  customItems.unshift(newItem);
  saveCustomItems();
  
  // 重新渲染卡片并关闭模态框
  renderCards();
  closeModal();
}

// 页面加载完成后启动
window.addEventListener('DOMContentLoaded', init);
