/* ============================================
   ハンバーガーメニュー
============================================ */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const gnav = document.getElementById('gnav');

hamburgerBtn.addEventListener('click', () => {
  const isOpen = gnav.classList.toggle('is-open');
  hamburgerBtn.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
});

document.querySelectorAll('.gnav__item a').forEach(link => {
  link.addEventListener('click', () => {
    gnav.classList.remove('is-open');
    hamburgerBtn.setAttribute('aria-label', 'メニューを開く');
  });
});

/* ============================================
   FV 無限ループスライダー
   構造: [複製:末尾] [0] [1] [2] [3] [4] [複製:先頭]
   displayIndex: 複製込みのインデックス（1〜totalが本体）
============================================ */
(function () {
  const track    = document.getElementById('fvTrack');
  const prevBtn  = document.getElementById('fvPrev');
  const nextBtn  = document.getElementById('fvNext');
  const dotsWrap = document.getElementById('fvDots');
  if (!track) return;

  const origItems = Array.from(track.querySelectorAll('.fv-slider__item'));
  const total = origItems.length;

  // 無限ループ用に先頭・末尾に複製スライドを追加
  const cloneHead = origItems[total - 1].cloneNode(true);
  const cloneTail = origItems[0].cloneNode(true);
  track.insertBefore(cloneHead, origItems[0]);
  track.appendChild(cloneTail);

  // ドットボタンをスライドの数だけ生成
  origItems.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'fv-slider__dot';
    dot.setAttribute('aria-label', `スライド ${i + 1}`);
    dot.addEventListener('click', () => goTo(i + 1)); // +1は複製スライド分のオフセット
    dotsWrap.appendChild(dot);
  });

  const dots  = () => Array.from(dotsWrap.querySelectorAll('.fv-slider__dot'));
  const items = () => Array.from(track.querySelectorAll('.fv-slider__item'));

  let displayIndex = 2; // 最初は2枚目を中央に表示
  let isMoving = false;
  let autoTimer = null;

  // 指定スライドを中央に表示するための移動量を計算
  function getOffset(idx) {
    const itemW  = items()[0].offsetWidth;
    const gap    = 20;
    const viewW  = document.documentElement.clientWidth;
    const center = (viewW - itemW) / 2;
    return center - idx * (itemW + gap);
  }

  // アクティブなスライドとドットを更新
  function updateActive(idx) {
    items().forEach((el, i) => el.classList.toggle('is-active', i === idx));
    const dotIdx = ((idx - 1) + total) % total;
    dots().forEach((d, i) => d.classList.toggle('is-active', i === dotIdx));
  }

  // アニメーションなしで瞬間移動（無限ループの折り返しに使用）
  function jumpTo(idx) {
    track.style.transition = 'none';
    track.style.transform  = `translateX(${getOffset(idx)}px)`;
    track.getBoundingClientRect(); // 強制リフロー
    updateActive(idx);
  }

  // アニメーションありで移動
  function slideTo(idx, onDone) {
    if (isMoving) return;
    isMoving = true;
    track.style.transition = 'transform 0.65s cubic-bezier(.23,1,.32,1)';
    track.style.transform  = `translateX(${getOffset(idx)}px)`;
    updateActive(idx);

    track.addEventListener('transitionend', function handler() {
      track.removeEventListener('transitionend', handler);
      isMoving = false;
      if (onDone) onDone();
    });
  }

  // 次のスライドへ
  function goNext() {
    const next = displayIndex + 1;
    slideTo(next, () => {
      if (next > total) { // 複製末尾に着いたら本体先頭へ瞬間移動
        jumpTo(1);
        displayIndex = 1;
      } else {
        displayIndex = next;
      }
    });
    resetAuto();
  }

  // 前のスライドへ
  function goPrev() {
    const prev = displayIndex - 1;
    slideTo(prev, () => {
      if (prev < 1) { // 複製先頭に着いたら本体末尾へ瞬間移動
        jumpTo(total);
        displayIndex = total;
      } else {
        displayIndex = prev;
      }
    });
    resetAuto();
  }

  // ドットクリックで直接移動
  function goTo(idx) {
    if (isMoving) return;
    slideTo(idx, () => { displayIndex = idx; });
    resetAuto();
  }

  // 自動再生
  function startAuto() { autoTimer = setInterval(goNext, 8000); }
  function resetAuto()  { clearInterval(autoTimer); startAuto(); }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  // スワイプ操作（スマートフォン用）
  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
  });

  // 初期化
  function init() {
    jumpTo(displayIndex);
    updateActive(displayIndex);
    startAuto();
  }

  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }

  window.addEventListener('resize', () => jumpTo(displayIndex));
})();
