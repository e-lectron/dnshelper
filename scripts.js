let allCategories = [];
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  handleGesture();
});

function handleGesture() {
  if (touchEndX - touchStartX > 50) { // свайп вправо
    goBack();
  }
}

function goBack() {
  const container = document.getElementById('categories');
  container.style.display = 'block'; // показываем категории
  document.getElementById('products-list').innerHTML = ''; // скрываем товары
  // можно добавить логику возврата к предыдущему уровню категории
}

async function loadCategories(parentId = null) {
  try {
    const res = await fetch('http://192.168.0.36:3000/categories');
    allCategories = await res.json();

    let categories = parentId === null ? allCategories : findChildren(allCategories, parentId);
    renderCategories(categories, parentId);
  } catch (err) {
    document.getElementById('categories').innerHTML = 'Ошибка загрузки категорий';
  }
}

function findChildren(data, parentId) {
  let stack = [...data];
  while (stack.length) {
    const node = stack.pop();
    if (node.id === parentId) return node.children || [];
    stack.push(...(node.children || []));
  }
  return [];
}

function renderCategories(categories, parentId) {
  const container = document.getElementById('categories');
  container.innerHTML = '';

  if (parentId !== null) {
    const backBtn = document.createElement('div');
    backBtn.textContent = '← Назад';
    backBtn.className = 'back-btn';
    backBtn.onclick = () => {
      const parent = findParent(allCategories, parentId);
      loadCategories(parent ? parent.id : null);
    };
    container.appendChild(backBtn);
  }

  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.textContent = cat.name;

    if (cat.children && cat.children.length > 0) {
      div.onclick = () => {
        loadCategories(cat.id);
        // скрываем товары до выбора конечной подкатегории
        document.getElementById('products-list').innerHTML = '';
      };
    } else {
      div.onclick = () => {
        // скрываем категории и показываем только товары
        container.style.display = 'none';
        loadProducts(cat.id);
      };
    }

    container.appendChild(div);
  });
}

function findParent(data, childId) {
  let stack = [...data];
  while (stack.length) {
    const node = stack.pop();
    if (node.children && node.children.find(c => c.id === childId)) return node;
    stack.push(...(node.children || []));
  }
  return null;
}

// Загружаем товары из БД
async function loadProducts(categoryId) {
  try {
    const res = await fetch(`http://192.168.0.36:3000/products?category_id=${categoryId}`);
    const products = await res.json();

    const container = document.getElementById('products-list');
    container.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const img = document.createElement('img');
      img.src = p.image || 'images/default.png';
      img.alt = p.name;
      img.className = 'product-image';

      const info = document.createElement('div');
      info.className = 'product-info';
      info.innerHTML = `
        <div class="product-name">${p.name}</div>
        <div class="product-price">${p.price}</div>
        <div class="product-sku">Артикул: <strong>${p.sku}</strong></div>
      `;

      const actions = document.createElement('div');
      actions.className = 'product-actions';
	  actions.innerHTML = `
	    <button class="compare-btn"><img src="icons/compare.svg" alt="Сравнить"></button>
	    <button class="note-btn"><img src="icons/note.svg" alt="Заметка"></button>
	  `;

      card.append(img, info, actions);
      container.appendChild(card);
    });

  } catch (err) {
    document.getElementById('products-list').innerHTML = 'Ошибка загрузки товаров';
  }
}

// Инициализация
loadCategories();
