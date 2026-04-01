(() => {
  // ==========================================
  // X Post Scroller - content.js (v5)
  // ==========================================

  const POST_SELECTOR = 'article[data-testid="tweet"]';
  const MORE_BTN_SELECTOR = '[data-testid="caret"]';
  const HEADER_HEIGHT = 60;
  const BTN_SIZE = 40;
  const BTN_GAP = 12; // ボタン間の隙間

  let currentPost = null; // インデックスではなく要素を直接保持
  let btnNext = null;
  let btnPrev = null;
  let rafId = null;

  // ==== ボタン作成 ====
  function createButtons() {
    if (document.getElementById('xscroller-next')) return;

    btnNext = document.createElement('button');
    btnNext.id = 'xscroller-next';
    btnNext.className = 'xscroller-btn';
    btnNext.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btnNext.title = '次の投稿へ (Ctrl+↓)';

    btnPrev = document.createElement('button');
    btnPrev.id = 'xscroller-prev';
    btnPrev.className = 'xscroller-btn';
    btnPrev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,15 12,9 18,15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btnPrev.title = '前の投稿へ (Ctrl+↑)';

    document.body.appendChild(btnPrev);
    document.body.appendChild(btnNext);

    btnNext.addEventListener('click', () => navigate('next'));
    btnPrev.addEventListener('click', () => navigate('prev'));
  }

  function getPosts() {
    return Array.from(document.querySelectorAll(POST_SELECTOR));
  }

  // ==== currentPostがまだDOMに存在するか確認 ====
  function isAttached(el) {
    return el && document.body.contains(el);
  }

  // ==== 画面上部に最も近い投稿を「現在」として取得 ====
  function detectCurrentPost() {
    const posts = getPosts();
    for (const post of posts) {
      const rect = post.getBoundingClientRect();
      if (rect.top >= HEADER_HEIGHT - 5) {
        return post;
      }
    }
    return posts[posts.length - 1] || null;
  }

  // ==== 前/次の投稿へ移動 ====
  function navigate(direction) {
    // currentPostがDOMから消えていたら再検出
    if (!isAttached(currentPost)) {
      currentPost = detectCurrentPost();
    }

    const posts = getPosts();
    const idx = posts.indexOf(currentPost);
    if (idx === -1) {
      currentPost = detectCurrentPost();
      return;
    }

    const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= posts.length) return;

    currentPost = posts[nextIdx];

    const targetY = window.scrollY + currentPost.getBoundingClientRect().top - HEADER_HEIGHT;
    window.scrollTo({ top: targetY, behavior: 'smooth' });

    scheduleButtonUpdate();
  }

  // ==== 「...」ボタンのアンカー位置を取得 ====
  function getAnchorRect(post) {
    const moreBtn = post.querySelector(MORE_BTN_SELECTOR);
    if (moreBtn) return moreBtn.getBoundingClientRect();
    const r = post.getBoundingClientRect();
    return { right: r.right - 8, top: r.top + 12, bottom: r.top + 44 };
  }

  // ==== ボタン位置を更新（requestAnimationFrameで1フレームに1回だけ） ====
  function scheduleButtonUpdate() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(updateButtonPosition);
  }

  function updateButtonPosition() {
    rafId = null;
    if (!btnNext || !btnPrev) return;

    // currentPostがDOMから消えていたら再検出
    if (!isAttached(currentPost)) {
      currentPost = detectCurrentPost();
    }
    if (!currentPost) return;

    const posts = getPosts();
    const idx = posts.indexOf(currentPost);
    const anchor = getAnchorRect(currentPost);
    const postRect = currentPost.getBoundingClientRect();

    const btnX = anchor.right + 10;
    const anchorCenterY = (anchor.top + anchor.bottom) / 2;

    // ↑ボタンと↓ボタンをBTN_GAP分離して配置
    btnPrev.style.left = btnX + 'px';
    btnPrev.style.top  = (anchorCenterY - BTN_SIZE - BTN_GAP / 2) + 'px';

    btnNext.style.left = btnX + 'px';
    btnNext.style.top  = (anchorCenterY + BTN_GAP / 2) + 'px';

    const inView = postRect.top < window.innerHeight && postRect.bottom > HEADER_HEIGHT;
    btnPrev.style.opacity = (!inView || idx <= 0) ? '0.3' : '1';
    btnNext.style.opacity = (!inView || idx >= posts.length - 1) ? '0.3' : '1';
  }

  // ==== スクロール：rAFで間引く ====
  window.addEventListener('scroll', scheduleButtonUpdate, { passive: true });

  // ==== キーボードショートカット ====
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'ArrowDown') { e.preventDefault(); navigate('next'); }
    if (e.ctrlKey && e.key === 'ArrowUp')   { e.preventDefault(); navigate('prev'); }
  });

  // ==== MutationObserver：デバウンスで暴走防止 ====
  let mutationTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      createButtons();
      scheduleButtonUpdate();
    }, 200);
  });

  // ==== 初期化 ====
  function init() {
    createButtons();
    currentPost = detectCurrentPost();
    updateButtonPosition();

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
