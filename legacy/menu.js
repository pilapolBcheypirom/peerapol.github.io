(function(){
  function init(){
    const host = document.getElementById('sectionMenu');
    if (!host) return;

    // parts
    const nav    = host.querySelector('.subnav');
    const list   = host.querySelector('.subnav__list');
    let   toggle = host.querySelector('.subnav__toggle');
    let   scrim  = host.querySelector('.subnav__scrim');
    const links  = [...host.querySelectorAll('.subnav__link')];
    const rootEl = document.documentElement;
    const mq     = window.matchMedia('(max-width: 768px)');

    // ป้องกันกรณีไม่มีปุ่ม/สคริม → สร้างให้
    if (!toggle){
      toggle = document.createElement('button');
      toggle.className = 'subnav__toggle';
      toggle.setAttribute('aria-controls','subnavList');
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Toggle section menu');
      toggle.innerHTML = '<span class="subnav__toggle-bars" aria-hidden="true"></span>';
      nav.prepend(toggle);
    }
    if (!scrim){
      scrim = document.createElement('span');
      scrim.className = 'subnav__scrim';
      scrim.setAttribute('aria-hidden','true');
      nav.append(scrim);
    }

    /* ---------- คำนวณ offset จาก header sticky (และ admin bar ถ้ามี) ---------- */
    const getStickyHeight = (sel) => {
      if (!sel) return 0;
      const el = document.querySelector(sel);
      if (!el) return 0;
      const pos = getComputedStyle(el).position;
      if (pos !== 'fixed' && pos !== 'sticky') return 0;
      return Math.ceil(el.getBoundingClientRect().height);
    };
    const applyOffset = () => {
      const headerSel = host.getAttribute('data-offset-target') || '';
      const adminSel  = host.getAttribute('data-adminbar') || '';
      const top       = getStickyHeight(headerSel) + getStickyHeight(adminSel);
      host.style.setProperty('--menu-top', top + 'px');
      rebuildObserver(); // rootMargin เปลี่ยนต้อง rebuild
    };

    /* ---------- เปิด/ปิด (มือถือ) ---------- */
    const setOpen = (on) => {
      nav.setAttribute('aria-expanded', on ? 'true' : 'false');
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
      rootEl.classList.toggle('menu-open', on);
      document.body.classList.toggle('menu-open', on);
    };
    const isOpen = () => nav.getAttribute('aria-expanded') === 'true';

    toggle.addEventListener('click', () => { if (mq.matches) setOpen(!isOpen()); });
    scrim.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    mq.addEventListener?.('change', (ev) => { if (!ev.matches) setOpen(false); });

    /* ---------- Smooth scroll (เลื่อนไปยัง section + ชดเชย header) ---------- */
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smoothTo = (hash) => {
      const t = hash && document.querySelector(hash);
      if (!t) return;
      const topOffset = parseInt(getComputedStyle(host).getPropertyValue('--menu-top')) || 0;
      const y = Math.max(0, t.getBoundingClientRect().top + window.scrollY - (topOffset + 8));
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    };

    // คลิกลิงก์ → ปิดเมนู (ถ้ามือถือ) + อัปเดต hash + เลื่อน
    list.addEventListener('click', (e) => {
      const a = e.target.closest('a.subnav__link');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;

      e.preventDefault();
      // active ทันทีเพื่อฟีดแบ็ก
      setActiveLink(a);

      if (mq.matches && isOpen()) setOpen(false);
      history.pushState(null, '', href);

      // รอเฟรมให้เมนูเริ่มปิดก่อนค่อยเลื่อน (ลื่นกว่า)
      requestAnimationFrame(() => setTimeout(() => smoothTo(href), 10));
    });

    // เปลี่ยน hash (กด back/forward) → เลื่อน
    addEventListener('popstate', () => { if (location.hash) smoothTo(location.hash); });

    /* ---------- Scroll Spy (อัปเดต active ตามตำแหน่ง) ---------- */
    const idMap = new Map();
    links.forEach(a => {
      const id = (a.getAttribute('href') || '').replace(/^#/,'');
      if (id) idMap.set(id, a);
    });

    const clearActive = () => { links.forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); }); };
    const setActiveLink = (link) => { clearActive(); link.classList.add('is-active'); link.setAttribute('aria-current','true'); };

    let spy = null;
    const buildRootMargin = () => {
      const topOffset = parseInt(getComputedStyle(host).getPropertyValue('--menu-top')) || 0;
      return `-${topOffset + 24}px 0px -60% 0px`; // เว้นบนตาม header + 24px
    };
    const rebuildObserver = () => {
      if (spy) spy.disconnect();
      if (!('IntersectionObserver' in window)) return; // degrade gracefully

      spy = new IntersectionObserver((entries) => {
        entries.forEach(ent => {
          const link = idMap.get(ent.target.id);
          if (!link) return;
          if (ent.isIntersecting) setActiveLink(link);
        });
      }, { root: null, threshold: 0.4, rootMargin: buildRootMargin() });

      idMap.forEach((_l, id) => {
        const sec = document.getElementById(id);
        if (sec) spy.observe(sec);
      });
    };

    // เริ่มทำงาน
    applyOffset();
    rebuildObserver();

    // ถ้ามี hash ตอนโหลด → เลื่อนไปตำแหน่งทันที (หลังคำนวณ offset เสร็จ)
    if (location.hash) setTimeout(() => smoothTo(location.hash), 0);

    // ติดตาม header sticky เปลี่ยนขนาด
    const headerSel = host.getAttribute('data-offset-target') || '';
    const stickyEl = headerSel ? document.querySelector(headerSel) : null;
    if (stickyEl && 'ResizeObserver' in window) {
      new ResizeObserver(applyOffset).observe(stickyEl);
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }


const mq = window.matchMedia('(max-width: 768px)');
mq.addEventListener?.('change', (ev) => { if (!ev.matches) setOpen(false); });



})();
(() => {
  const host   = document.getElementById('sectionMenu');
  if (!host) return;

  // header ที่เป็น sticky (ตั้งใน data-offset-target="#siteHeader")
  const headerSel = host.getAttribute('data-offset-target') || '#siteHeader';
  const header    = document.querySelector(headerSel);
  const toggle    = host.querySelector('.subnav__toggle');
  if (!toggle || !header) return;

  const BTN = 44; // ขนาดปุ่ม (px)

  const place = () => {
    const r = header.getBoundingClientRect();
    // ให้ปุ่มอยู่กึ่งกลางแนวตั้งของ header (กันลอยขึ้นไปชิดขอบ)
    const y = Math.max(8, r.top + (r.height - BTN) / 2);
    // ใส่เป็น custom property เพื่อให้ CSS ใช้ !important ชนะทุกกฎ
    document.documentElement.style.setProperty('--toggle-y', y + 'px');
  };

  // เรียกตอนโหลด, เลื่อน, ย่อ/ขยาย, และเมื่อ header เปลี่ยนสูง
  place();
  addEventListener('scroll', place, { passive: true });
  addEventListener('resize', place);
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(header);
})();