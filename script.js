// ─── TICKER DATA ───
var TICKER_DATA = [
  { type:'price', symbol:'BTC', price:'$81,264', change:'+3.1%', up:true, icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'ETH', price:'$2,298', change:'+2.7%', up:true, icon:'assets/logos/eth.svg' },
  { type:'price', symbol:'SOL', price:'$92.95', change:'+2.5%', up:true, icon:'assets/logos/sol.svg' },
  { type:'predict', question:'BTC > $150K by EOY?', odds:'72% YES', icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'BNB', price:'$679.80', change:'+2.4%', up:true, icon:'assets/logos/bnb.svg' },
  { type:'price', symbol:'XRP', price:'$1.47', change:'+3.9%', up:true, icon:'assets/logos/xrp.svg' },
  { type:'price', symbol:'ADA', price:'$0.27', change:'+2.7%', up:true, icon:'assets/logos/ada.svg' },
  { type:'predict', question:'Trump wins 2028?', odds:'52% YES', emoji:'\uD83C\uDDFA\uD83C\uDDF8' },
  { type:'price', symbol:'DOGE', price:'$0.114', change:'+2.9%', up:true, icon:'assets/logos/doge.svg' },
  { type:'price', symbol:'LINK', price:'$10.62', change:'+4.7%', up:true, icon:'assets/logos/link.svg' },
  { type:'price', symbol:'SUI', price:'$1.22', change:'+1.2%', up:true, icon:'assets/logos/sui.svg' },
  { type:'predict', question:'Fed cuts rates June?', odds:'61% YES', emoji:'\uD83C\uDFE6' },
  { type:'price', symbol:'AVAX', price:'$10.04', change:'+3.6%', up:true, icon:'assets/logos/avax.svg' },
  { type:'price', symbol:'TON', price:'$2.13', change:'+1.3%', up:true, icon:'assets/logos/ton.svg' },
  { type:'price', symbol:'DOT', price:'$1.37', change:'+3.7%', up:true, icon:'assets/logos/dot.svg' },
  { type:'predict', question:'SOL flips ETH?', odds:'34% YES', icon:'assets/logos/sol.svg' },
  { type:'price', symbol:'TRX', price:'$0.354', change:'+1.2%', up:true, icon:'assets/logos/trx.svg' },
  { type:'price', symbol:'ARB', price:'$0.134', change:'+1.5%', up:true, icon:'assets/logos/arb.svg' },
  { type:'price', symbol:'SHIB', price:'$0.00000636', change:'+1.6%', up:true, icon:'assets/logos/shib.svg' },
  { type:'predict', question:'Champions League winner?', odds:'38% Real Madrid', emoji:'\u26BD' },
  { type:'price', symbol:'UNI', price:'$3.75', change:'+4.1%', up:true, icon:'assets/logos/uni.svg' },
  { type:'price', symbol:'NEAR', price:'$1.61', change:'+3.8%', up:true, icon:'assets/logos/near.svg' },
  { type:'price', symbol:'PEPE', price:'$0.00000412', change:'+2.3%', up:true, icon:'assets/logos/pepe.svg' },
  { type:'predict', question:'Spot SOL ETF this year?', odds:'67% YES', icon:'assets/logos/sol.svg' },
  { type:'price', symbol:'ATOM', price:'$2.06', change:'+0.1%', up:true, icon:'assets/logos/atom.svg' },
  { type:'price', symbol:'XMR', price:'$401.78', change:'-0.2%', up:false, icon:'assets/logos/xmr.svg' },
  { type:'price', symbol:'ZEC', price:'$547.91', change:'+2.3%', up:true, icon:'assets/logos/zec.svg' },
  { type:'predict', question:'ETH > $10K?', odds:'48% YES', icon:'assets/logos/eth.svg' },
  { type:'price', symbol:'JUP', price:'$0.227', change:'+3.0%', up:true, icon:'assets/logos/jup.svg' },
  { type:'price', symbol:'PENGU', price:'$0.00923', change:'+3.5%', up:true, icon:'assets/logos/pengu.png' },
  { type:'price', symbol:'PUMP', price:'$0.0021', change:'+7.4%', up:true, icon:'assets/logos/pump.svg' },
  { type:'predict', question:'US recession 2026?', odds:'29% YES', emoji:'\uD83D\uDCC9' },
  { type:'price', symbol:'WLFI', price:'$0.106', change:'+2.8%', up:true, icon:'assets/logos/wlfi.png' }
];

function renderTickerHTML(data) {
  var items = data.map(function(d) {
    if (d.type === 'price') {
      var cls = d.up ? 'green' : 'red';
      var arrow = d.up ? '\u2191' : '\u2193';
      return '<span class="ticker-item">' +
        '<span class="ticker-logo"><img src="' + d.icon + '" alt="' + d.symbol + '"></span>' +
        d.symbol + ' ' + d.price + ' <span class="' + cls + '">' + arrow + d.change.replace(/[+-]/, '') + '</span>' +
        '</span>';
    }
    var iconHTML = d.icon
      ? '<span class="ticker-logo"><img src="' + d.icon + '" alt=""></span>'
      : '<span class="ticker-predict-emoji">' + (d.emoji || '') + '</span>';
    return '<span class="ticker-item ticker-predict">' +
      iconHTML +
      '<span class="ticker-predict-q">' + d.question + '</span>' +
      '<span class="ticker-predict-odds">' + d.odds + '</span>' +
      '</span>';
  }).join('');
  return items + items;
}

var tickerHTML = renderTickerHTML(TICKER_DATA);
document.querySelectorAll('.ticker-track').forEach(function(track) {
  track.innerHTML = tickerHTML;
});

// ─── Fade-up animations ───
var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
document.querySelectorAll('.fade-up').forEach(function(el) { obs.observe(el); });

// ─── Nav solidify on scroll + sticky bar visibility ───
var nav = document.querySelector('nav');
var stickyBar = document.querySelector('.sticky-bar');
var heroEl = document.querySelector('.hero');
var heroBottom = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : 0;
function updateHeroBottom() {
  if (heroEl) heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
}
window.addEventListener('load', updateHeroBottom);
window.addEventListener('resize', updateHeroBottom);
var navScrolled = false;
window.addEventListener('scroll', function() {
  var shouldScroll = window.scrollY > 50;
  if (shouldScroll !== navScrolled) {
    navScrolled = shouldScroll;
    nav.classList.toggle('scrolled', navScrolled);
  }
  if (stickyBar && heroEl) {
    stickyBar.classList.toggle('visible', window.scrollY > heroBottom - 100);
  }
}, { passive: true });


// ——— Rotating hero words ———
var rotateWords = document.querySelectorAll('.hero-rotate-word');
if (rotateWords.length) {
  var container = document.querySelector('.hero-rotate-words');
  var heroRotateMedia = window.matchMedia('(max-width: 768px)');
  var currentWord = 0;
  var heroMeasureQueued = false;

  rotateWords[currentWord].classList.add('active');

  function queueHeroMeasure() {
    if (heroMeasureQueued) return;
    heroMeasureQueued = true;
    requestAnimationFrame(function() {
      heroMeasureQueued = false;
      measureAndSetWidth();
    });
  }

  function measureAndSetWidth() {
    if (heroRotateMedia.matches || rotateWords.length < 2) {
      container.style.width = 'auto';
      return;
    }
    var maxW = 0;
    rotateWords.forEach(function(w) {
      var wasActive = w.classList.contains('active');
      var prevPosition = w.style.position;
      var prevVisibility = w.style.visibility;
      w.style.position = 'absolute';
      w.style.visibility = 'hidden';
      w.classList.add('active');
      maxW = Math.max(maxW, w.offsetWidth);
      if (!wasActive) w.classList.remove('active');
      w.style.position = prevPosition;
      w.style.visibility = prevVisibility;
    });
    if (maxW > 0) container.style.width = maxW + 'px';
    else container.style.width = 'auto';
  }

  // Measure after the first active word exists, then re-measure once assets are ready.
  queueHeroMeasure();
  var brandLogos = document.querySelectorAll('.hero-brand-logo');
  if (brandLogos.length) {
    brandLogos.forEach(function(img) {
      if (img.complete) queueHeroMeasure();
      img.addEventListener('load', queueHeroMeasure);
      img.addEventListener('error', queueHeroMeasure);
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueHeroMeasure);
  }
  window.addEventListener('load', queueHeroMeasure);
  window.addEventListener('resize', queueHeroMeasure);
  if (heroRotateMedia.addEventListener) heroRotateMedia.addEventListener('change', queueHeroMeasure);
  else heroRotateMedia.addListener(queueHeroMeasure);

  if (rotateWords.length > 1) setInterval(function() {
    var prev = rotateWords[currentWord];
    currentWord = (currentWord + 1) % rotateWords.length;
    var next = rotateWords[currentWord];
    // Start incoming word below, hidden
    next.style.transition = 'none';
    next.style.transform = 'translateY(100%)';
    next.offsetHeight; // force reflow
    next.style.transition = '';
    // Animate both simultaneously — outgoing up, incoming to center
    prev.classList.remove('active');
    prev.style.transform = 'translateY(-100%)';
    next.classList.add('active');
    next.style.transform = 'translateY(0)';
  }, 3000);
}

// ─── Position hero ticker flush below nav ───
var heroTicker = document.querySelector('.ticker-reverse');
if (heroTicker) {
  var positionTicker = function() { heroTicker.style.top = nav.offsetHeight + 'px'; };
  positionTicker();
  window.addEventListener('resize', positionTicker);
}

// ─── Phone carousel: desktop-only infinite preview ───
var phoneTrack = document.querySelector('.phone-carousel-track');
var phoneCarousel = document.querySelector('.phone-carousel');
if (phoneTrack && phoneCarousel) {
  var original = phoneTrack.innerHTML;
  var phoneCarouselMedia = window.matchMedia('(max-width: 768px)');
  var halfWidth = 0;
  var ticking = false;
  var scrollTimer;
  var desktopCarouselInitialized = false;

  function initScroll() {
    halfWidth = phoneTrack.scrollWidth / 3;
    phoneCarousel.scrollLeft = halfWidth;
  }

  function handleCarouselScroll() {
    if (!desktopCarouselInitialized) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      var sl = phoneCarousel.scrollLeft;
      if (sl <= 10) {
        phoneCarousel.scrollLeft = sl + halfWidth;
      } else if (sl >= halfWidth * 2 - phoneCarousel.offsetWidth - 10) {
        phoneCarousel.scrollLeft = sl - halfWidth;
      }
      ticking = false;
    });

    phoneCarousel.classList.add('user-scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function() {
      phoneCarousel.classList.remove('user-scrolling');
    }, 2000);
  }

  function handleCarouselWheel(e) {
    if (!desktopCarouselInitialized) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    phoneCarousel.scrollLeft += e.deltaY;
  }

  function teardownDesktopCarousel() {
    if (!desktopCarouselInitialized) return;
    phoneCarousel.removeEventListener('scroll', handleCarouselScroll);
    phoneCarousel.removeEventListener('wheel', handleCarouselWheel);
    phoneTrack.innerHTML = original;
    phoneCarousel.scrollLeft = 0;
    phoneCarousel.classList.remove('user-scrolling');
    clearTimeout(scrollTimer);
    halfWidth = 0;
    ticking = false;
    desktopCarouselInitialized = false;
  }

  function initDesktopCarousel() {
    if (desktopCarouselInitialized || phoneCarouselMedia.matches) return;
    phoneTrack.innerHTML = original + original + original;
    desktopCarouselInitialized = true;
    initScroll();
    phoneCarousel.addEventListener('scroll', handleCarouselScroll, { passive: true });
    phoneCarousel.addEventListener('wheel', handleCarouselWheel, { passive: false });
  }

  function syncPhoneCarouselMode() {
    if (phoneCarouselMedia.matches) teardownDesktopCarousel();
    else {
      teardownDesktopCarousel();
      initDesktopCarousel();
    }
  }

  syncPhoneCarouselMode();
  window.addEventListener('resize', function() {
    if (!phoneCarouselMedia.matches && desktopCarouselInitialized) initScroll();
  });
  if (phoneCarouselMedia.addEventListener) phoneCarouselMedia.addEventListener('change', syncPhoneCarouselMode);
  else phoneCarouselMedia.addListener(syncPhoneCarouselMode);
}

// ─── FALLING ICONS (Matter.js Physics) ───
(function() {
  var container = document.getElementById('fallingIconsContainer');
  var iconsWrap = document.getElementById('fallingIcons');
  if (!container || !iconsWrap || typeof Matter === 'undefined') return;

  var Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Runner = Matter.Runner;

  var engine = Engine.create({ gravity: { x: 0, y: 1.5 } });
  var world = engine.world;
  var runner = Runner.create();

  var iconEls = iconsWrap.querySelectorAll('.falling-icon');
  var iconBodies = [];
  var walls = [];
  var started = false;
  var ICON_RADIUS = 28;

  function getIconRadius() {
    var el = iconEls[0];
    return el ? el.offsetWidth / 2 : 28;
  }

  function createWalls() {
    // Remove old walls
    walls.forEach(function(w) { World.remove(world, w); });
    walls = [];

    var w = iconsWrap.offsetWidth;
    var h = iconsWrap.offsetHeight;
    var thickness = 60;

    // bottom, left, right walls
    var bottom = Bodies.rectangle(w / 2, h + thickness / 2, w + 100, thickness, { isStatic: true, friction: 0.3, restitution: 0.1 });
    var left = Bodies.rectangle(-thickness / 2, h / 2, thickness, h * 2, { isStatic: true, friction: 0.1 });
    var right = Bodies.rectangle(w + thickness / 2, h / 2, thickness, h * 2, { isStatic: true, friction: 0.1 });

    walls = [bottom, left, right];
    World.add(world, walls);
  }

  function spawnIcons() {
    var w = iconsWrap.offsetWidth;
    var r = getIconRadius();
    ICON_RADIUS = r;

    iconEls.forEach(function(el, i) {
      setTimeout(function() {
        var x = r + Math.random() * (w - r * 2);
        var y = -r * 2 - Math.random() * 200;

        var body = Bodies.circle(x, y, r, {
          restitution: 0.3,
          friction: 0.1,
          frictionAir: 0.01,
          density: 0.002
        });
        // Give a slight random spin
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

        iconBodies.push({ body: body, el: el });
        World.add(world, body);
      }, i * 120);
    });
  }

  function syncDOM() {
    for (var i = 0; i < iconBodies.length; i++) {
      var item = iconBodies[i];
      var pos = item.body.position;
      var angle = item.body.angle;
      item.el.style.transform = 'translate(' + (pos.x - ICON_RADIUS) + 'px,' + (pos.y - ICON_RADIUS) + 'px) rotate(' + angle + 'rad)';
    }
    requestAnimationFrame(syncDOM);
  }

  function startSimulation() {
    if (started) return;
    started = true;
    createWalls();
    spawnIcons();
    Runner.run(runner, engine);
    syncDOM();
  }

  // Trigger on scroll into view
  var ioFalling = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        startSimulation();
        ioFalling.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  ioFalling.observe(container);

  // Handle resize
  window.addEventListener('resize', function() {
    if (!started) return;
    // Rebuild walls for new dimensions
    createWalls();
  });

})();

// ─── SWIPE CARD DEMO ───
(function() {
  var stack = document.getElementById('swipeStack');
  var phone = document.getElementById('swipePhone');
  if (!stack || !phone) return;

  var PREDICTIONS = [
    { q:'Will BTC hit $150K by July 2026?', yes:72, cat:'Crypto', icon:'assets/logos/btc.svg', vol:'$2.4M' },
    { q:'Trump wins 2028?', yes:52, cat:'Politics', emoji:'\uD83C\uDDFA\uD83C\uDDF8', vol:'$8.1M' },
    { q:'Fed cuts rates June?', yes:61, cat:'Economics', emoji:'\uD83C\uDFE6', vol:'$1.7M' },
    { q:'SOL flips ETH?', yes:34, cat:'Crypto', icon:'assets/logos/sol.svg', vol:'$950K' },
    { q:'Spot SOL ETF this year?', yes:67, cat:'Crypto', icon:'assets/logos/sol.svg', vol:'$3.2M' }
  ];

  var STACK_DEPTH = 3;
  var currentIdx = 0;
  var dragging = false;
  var animating = false;
  var startX = 0, startY = 0, dragX = 0;
  var dirLocked = false;
  var isHorizontal = false;
  var topCard = null;
  var phoneBg = phone;
  var BG_NEUTRAL = [10, 15, 35];
  var BG_GREEN = [73, 229, 154];
  var BG_RED = [255, 69, 94];

  function lerpColor(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function createCardEl(predIdx, stackPos) {
    var p = PREDICTIONS[predIdx % PREDICTIONS.length];
    var card = document.createElement('div');
    card.className = 'swipe-card';
    var scale = 1 - stackPos * 0.04;
    var offsetY = stackPos * 12;
    card.style.transform = 'scale(' + scale + ') translateY(' + offsetY + 'px)';
    card.style.zIndex = STACK_DEPTH - stackPos;
    if (stackPos > 0) card.style.pointerEvents = 'none';

    var noVal = 100 - p.yes;
    card.innerHTML =
      '<div class="swipe-card-cat">' + p.cat + '</div>' +
      '<div class="swipe-card-question">' + p.q + '</div>' +
      '<div class="swipe-card-odds">' +
        '<div class="swipe-card-odds-btn swipe-card-yes">Yes<br>' + p.yes + '%</div>' +
        '<div class="swipe-card-odds-btn swipe-card-no">No<br>' + noVal + '%</div>' +
      '</div>' +
      '<div class="swipe-card-volume">' + p.vol + ' volume</div>';
    return card;
  }

  function renderStack() {
    stack.innerHTML = '';
    for (var i = STACK_DEPTH - 1; i >= 0; i--) {
      var card = createCardEl(currentIdx + i, i);
      stack.appendChild(card);
    }
    topCard = stack.lastElementChild;
    attachDragListeners(topCard);
  }

  function applyDragTransform(el, dx) {
    var rotation = dx / 35;
    el.style.transform = 'translateX(' + dx + 'px) rotate(' + rotation + 'deg)';
    el.style.transition = 'none';
  }

  function updatePhoneBg(dx) {
    var t = Math.min(Math.abs(dx) / 120, 1);
    var target = dx > 0 ? BG_GREEN : BG_RED;
    phoneBg.style.background = lerpColor(BG_NEUTRAL, target, t);
  }

  function resetPhoneBg() {
    phoneBg.style.transition = 'background 0.3s ease';
    phoneBg.style.background = '#0A0F23';
    setTimeout(function() { phoneBg.style.transition = ''; }, 300);
  }

  function flyCardOut(dir) {
    if (animating) return;
    animating = true;
    var card = topCard;
    var flyX = dir * 400;
    card.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
    card.style.transform = 'translateX(' + flyX + 'px) rotate(' + (dir * 15) + 'deg)';

    setTimeout(function() {
      currentIdx = (currentIdx + 1) % PREDICTIONS.length;
      renderStack();
      resetPhoneBg();
      animating = false;
    }, 400);
  }

  function snapBack(el) {
    el.style.transition = 'transform 0.35s cubic-bezier(.4,0,.2,1)';
    el.style.transform = 'scale(1) translateY(0)';
    resetPhoneBg();
    setTimeout(function() { el.style.transition = ''; }, 350);
  }

  function attachDragListeners(cardEl) {
    if (!cardEl) return;

    cardEl.addEventListener('pointerdown', function(e) {
      if (animating) return;
      dragging = true;
      dirLocked = false;
      isHorizontal = false;
      startX = e.clientX;
      startY = e.clientY;
      dragX = 0;
      cardEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    cardEl.addEventListener('pointermove', function(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      if (!dirLocked && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dirLocked = true;
        isHorizontal = Math.abs(dx) >= Math.abs(dy);
      }
      if (!isHorizontal) return;

      dragX = dx;
      applyDragTransform(cardEl, dragX);
      updatePhoneBg(dragX);
      e.preventDefault();
    });

    cardEl.addEventListener('pointerup', function(e) {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dragX) >= 80) {
        flyCardOut(dragX > 0 ? 1 : -1);
      } else {
        snapBack(cardEl);
      }
    });

    cardEl.addEventListener('pointercancel', function() {
      if (!dragging) return;
      dragging = false;
      snapBack(cardEl);
    });
  }

  // Programmatic swipe for auto-play and buttons
  function animateSwipe(dir, duration, cb) {
    if (animating) return;
    animating = true;
    var card = topCard;
    var target = dir * 160;
    var start = null;

    function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeInOutQuad(progress);
      var dx = target * eased;
      applyDragTransform(card, dx);
      updatePhoneBg(dx);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Fly out
        card.style.transition = 'transform 0.35s cubic-bezier(.4,0,.2,1)';
        card.style.transform = 'translateX(' + (dir * 400) + 'px) rotate(' + (dir * 15) + 'deg)';
        setTimeout(function() {
          currentIdx = (currentIdx + 1) % PREDICTIONS.length;
          renderStack();
          resetPhoneBg();
          animating = false;
          if (cb) cb();
        }, 350);
      }
    }
    requestAnimationFrame(step);
  }

  // Auto-play on scroll into view
  function autoPlay() {
    setTimeout(function() {
      animateSwipe(1, 800, function() {
        setTimeout(function() {
          animateSwipe(-1, 800, function() {
            // Done — manual interaction now enabled
          });
        }, 800);
      });
    }, 600);
  }

  var ioSwipe = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        autoPlay();
        ioSwipe.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  ioSwipe.observe(phone);

  // Button clicks
  var btnNo = document.getElementById('swipeBtnNo');
  var btnYes = document.getElementById('swipeBtnYes');
  if (btnNo) btnNo.addEventListener('click', function() { animateSwipe(-1, 500); });
  if (btnYes) btnYes.addEventListener('click', function() { animateSwipe(1, 500); });

  // Initial render
  renderStack();
})();

// ─── WAITLIST FORM ───
(function() {
  var form = document.getElementById('waitlist-form');
  if (!form) return;

  var emailInput = document.getElementById('waitlist-email');
  var btn = document.getElementById('waitlist-btn');
  var status = document.getElementById('waitlist-status');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = emailInput.value.trim();
    if (!email || email.indexOf('@') === -1) {
      status.textContent = 'Please enter a valid email address';
      status.className = 'waitlist-status error';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Joining...';
    status.textContent = '';
    status.className = 'waitlist-status';

    fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    }).then(function(response) {
      if (response.ok) {
        status.textContent = 'You\'re on the list!';
        status.className = 'waitlist-status success';
        emailInput.value = '';
      } else {
        status.textContent = 'Something went wrong. Please try again.';
        status.className = 'waitlist-status error';
      }
    }).catch(function() {
      status.textContent = 'Something went wrong. Please try again.';
      status.className = 'waitlist-status error';
    }).finally(function() {
      btn.disabled = false;
      btn.textContent = 'Get early access';
    });
  });
})();

// ─── TAB NAVIGATION ───
document.querySelectorAll('.app-tab-bar').forEach(function(bar) {
  bar.addEventListener('click', function(e) {
    var tab = e.target.closest('.app-tab');
    if (!tab || !tab.dataset.screen) return;
    var phone = bar.closest('.phone');
    bar.querySelectorAll('.app-tab').forEach(function(t) { t.classList.toggle('app-tab-active', t === tab); });
    phone.querySelectorAll('.app-screen').forEach(function(s) {
      s.classList.toggle('app-screen-active', s.classList.contains('app-screen-' + tab.dataset.screen));
    });
  });
});

// ─── SEARCH FILTER ───
document.querySelectorAll('.app-search-input input').forEach(function(input) {
  input.addEventListener('input', function() {
    var val = input.value.toLowerCase();
    var list = input.closest('.app-screen-search').querySelector('.app-search-list');
    if (!list) return;
    list.querySelectorAll('.app-search-row').forEach(function(row) {
      var ticker = (row.dataset.ticker || '').toLowerCase();
      var name = (row.dataset.name || '').toLowerCase();
      row.style.display = (!val || ticker.indexOf(val) !== -1 || name.indexOf(val) !== -1) ? '' : 'none';
    });
  });
});
