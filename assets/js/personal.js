(() => {
  const blog = document.querySelector('[data-blog]');
  if (!blog) return;
  const search = blog.querySelector('[data-blog-search]');
  const categoryButtons = Array.from(blog.querySelectorAll('[data-blog-category]'));
  let category = '';
  const pageSize = 10;
  let page = 1;
  const rows = Array.from(blog.querySelectorAll('[data-post-row]'));
  const count = blog.querySelector('[data-blog-count]');
  const empty = blog.querySelector('[data-blog-empty]');
  const pagination = blog.querySelector('[data-blog-pagination]');
  const list = blog.querySelector('.personal-post-list');
  list.tabIndex = -1;
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase().trim();
  const entries = rows.map(row => ({ row, text: normalize(row.dataset.search), categories: row.dataset.category.split('|') }));
  function selectCategory(value) {
    category = value;
    categoryButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.blogCategory === value)));
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('category', value);
    else url.searchParams.delete('category');
    window.history.replaceState(window.history.state, '', url);
  }
  function renderPagination(totalPages) {
    pagination.replaceChildren();
    pagination.hidden = totalPages <= 1;
    if (pagination.hidden) return;
    function addButton(label, targetPage, disabled = false) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.blogPage = targetPage;
      button.disabled = disabled;
      button.setAttribute('aria-label', typeof label === 'number' ? `${label}페이지` : `${label} 페이지`);
      if (label === page) button.setAttribute('aria-current', 'page');
      pagination.append(button);
    }
    addButton('이전', page - 1, page === 1);
    for (let number = 1; number <= totalPages; number++) addButton(number, number);
    addButton('다음', page + 1, page === totalPages);
  }
  function render() {
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const matching = entries.filter(({ text, categories }) => terms.every(term => text.includes(term)) && (!category || categories.includes(category)));
    const totalPages = Math.ceil(matching.length / pageSize);
    page = Math.min(page, Math.max(1, totalPages));
    entries.forEach(({ row }) => { row.hidden = true; });
    matching.slice((page - 1) * pageSize, page * pageSize).forEach(({ row }) => {
      row.hidden = false;
    });
    count.textContent = (terms.length || category) ? `${rows.length}개 중 ${matching.length}개 글` : `전체 ${rows.length}개 글`;
    if (totalPages > 1) count.textContent += ` · ${page} / ${totalPages} 페이지`;
    empty.hidden = matching.length > 0;
    renderPagination(totalPages);
  }
  blog.querySelector('[data-blog-tools]').hidden = false;
  search.addEventListener('input', () => {
    page = 1;
    render();
  });
  categoryButtons.forEach(button => button.addEventListener('click', () => {
    selectCategory(button.dataset.blogCategory);
    page = 1;
    render();
  }));
  pagination.addEventListener('click', event => {
    const button = event.target.closest('[data-blog-page]');
    if (!button || button.disabled) return;
    page = Number(button.dataset.blogPage);
    render();
    list.focus({ preventScroll: true });
    list.scrollIntoView({ block: 'start' });
  });
  blog.querySelector('[data-blog-reset]').addEventListener('click', () => {
    search.value = '';
    selectCategory('');
    page = 1;
    render();
    search.focus();
  });
  const requestedCategory = new URL(window.location.href).searchParams.get('category') || '';
  const initialButton = categoryButtons.find(button => normalize(button.dataset.blogCategory) === normalize(requestedCategory));
  selectCategory(initialButton ? initialButton.dataset.blogCategory : '');
  render();
})();
