// ─── TICKER DATA ───
var TICKER_DATA = [
  { type:'price', symbol:'BTC', price:'$104,231', change:'+2.4%', up:true, icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'ETH', price:'$3,891', change:'+1.1%', up:true, icon:'assets/logos/eth.svg' },
  { type:'price', symbol:'SOL', price:'$241', change:'+5.7%', up:true, icon:'assets/logos/sol.svg' },
  { type:'predict', question:'BTC > $150K by EOY?', odds:'72% YES', icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'BNB', price:'$712', change:'+1.8%', up:true, icon:'assets/logos/bnb.svg' },
  { type:'price', symbol:'XRP', price:'$2.48', change:'+0.6%', up:true, icon:'assets/logos/xrp.svg' },
  { type:'price', symbol:'ADA', price:'$1.12', change:'+3.4%', up:true, icon:'assets/logos/ada.svg' },
  { type:'predict', question:'Trump wins 2028?', odds:'52% YES', emoji:'\uD83C\uDDFA\uD83C\uDDF8' },
  { type:'price', symbol:'DOGE', price:'$0.41', change:'-0.8%', up:false, icon:'assets/logos/doge.svg' },
  { type:'price', symbol:'LINK', price:'$28.50', change:'+4.2%', up:true, icon:'assets/logos/link.svg' },
  { type:'price', symbol:'SUI', price:'$4.18', change:'+6.1%', up:true, icon:'assets/logos/sui.svg' },
  { type:'predict', question:'Fed cuts rates June?', odds:'61% YES', emoji:'\uD83C\uDFE6' },
  { type:'price', symbol:'AVAX', price:'$48.20', change:'+2.9%', up:true, icon:'assets/logos/avax.svg' },
  { type:'price', symbol:'TON', price:'$6.85', change:'+1.5%', up:true, icon:'assets/logos/ton.svg' },
  { type:'price', symbol:'DOT', price:'$9.42', change:'-1.2%', up:false, icon:'assets/logos/dot.svg' },
  { type:'predict', question:'SOL flips ETH?', odds:'34% YES', icon:'assets/logos/sol.svg' },
  { type:'price', symbol:'TRX', price:'$0.28', change:'+0.9%', up:true, icon:'assets/logos/trx.svg' },
  { type:'price', symbol:'ARB', price:'$1.82', change:'+3.1%', up:true, icon:'assets/logos/arb.svg' },
  { type:'price', symbol:'SHIB', price:'$0.000027', change:'+4.5%', up:true, icon:'assets/logos/shib.svg' },
  { type:'predict', question:'Champions League winner?', odds:'38% Real Madrid', emoji:'\u26BD' },
  { type:'price', symbol:'UNI', price:'$13.40', change:'+2.2%', up:true, icon:'assets/logos/uni.svg' },
  { type:'price', symbol:'NEAR', price:'$7.20', change:'+3.8%', up:true, icon:'assets/logos/near.svg' },
  { type:'price', symbol:'PEPE', price:'$0.000021', change:'+8.3%', up:true, icon:'assets/logos/pepe.svg' },
  { type:'predict', question:'Spot SOL ETF this year?', odds:'67% YES', icon:'assets/logos/sol.svg' },
  { type:'price', symbol:'ATOM', price:'$11.50', change:'+1.9%', up:true, icon:'assets/logos/atom.svg' },
  { type:'price', symbol:'XMR', price:'$287', change:'+2.1%', up:true, icon:'assets/logos/xmr.svg' },
  { type:'price', symbol:'ZEC', price:'$48.70', change:'-0.5%', up:false, icon:'assets/logos/zec.svg' },
  { type:'predict', question:'ETH > $10K?', odds:'48% YES', icon:'assets/logos/eth.svg' },
  { type:'price', symbol:'JUP', price:'$1.35', change:'+5.2%', up:true, icon:'assets/logos/jup.svg' },
  { type:'price', symbol:'PENGU', price:'$0.018', change:'+12.4%', up:true, icon:'assets/logos/pengu.png' },
  { type:'price', symbol:'PUMP', price:'$0.42', change:'+7.1%', up:true, icon:'assets/logos/pump.svg' },
  { type:'predict', question:'US recession 2026?', odds:'29% YES', emoji:'\uD83D\uDCC9' },
  { type:'price', symbol:'WLFI', price:'$0.038', change:'+1.4%', up:true, icon:'assets/logos/wlfi.png' }
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

  function measureAndSetWidth() {
    var maxW = 0;
    rotateWords.forEach(function(w) {
      w.style.position = 'absolute';
      w.style.visibility = 'hidden';
      w.classList.add('active');
      maxW = Math.max(maxW, w.offsetWidth);
      w.classList.remove('active');
      w.style.position = '';
      w.style.visibility = '';
    });
    container.style.width = maxW + 'px';
  }

  // Measure immediately, then re-measure after images load
  measureAndSetWidth();
  var brandLogos = document.querySelectorAll('.hero-brand-logo');
  if (brandLogos.length) {
    var loaded = 0;
    brandLogos.forEach(function(img) {
      if (img.complete) { loaded++; }
      else { img.addEventListener('load', function() { loaded++; if (loaded === brandLogos.length) measureAndSetWidth(); }); }
    });
    if (loaded === brandLogos.length) measureAndSetWidth();
  }

  var currentWord = 0;
  rotateWords[0].classList.add('active');
  setInterval(function() {
    rotateWords[currentWord].classList.remove('active');
    rotateWords[currentWord].style.transform = 'translateY(-100%)';
    currentWord = (currentWord + 1) % rotateWords.length;
    rotateWords[currentWord].style.transform = 'translateY(100%)';
    // force reflow so the translateY(100%) applies before animating to 0
    rotateWords[currentWord].offsetHeight;
    rotateWords[currentWord].classList.add('active');
    rotateWords[currentWord].style.transform = 'translateY(0)';
  }, 3000);
}

// ─── Position hero ticker flush below nav ───
var heroTicker = document.querySelector('.ticker-reverse');
if (heroTicker) {
  var positionTicker = function() { heroTicker.style.top = nav.offsetHeight + 'px'; };
  positionTicker();
  window.addEventListener('resize', positionTicker);
}

// ─── Phone carousel: auto-scroll + infinite two-finger swipe ───
var phoneTrack = document.querySelector('.phone-carousel-track');
var phoneCarousel = document.querySelector('.phone-carousel');
if (phoneTrack && phoneCarousel) {
  var original = phoneTrack.innerHTML;
  phoneTrack.innerHTML = original + original + original;

  var halfWidth = 0;
  var initScroll = function() {
    halfWidth = phoneTrack.scrollWidth / 3;
    phoneCarousel.scrollLeft = halfWidth;
  };
  initScroll();

  var ticking = false;
  var scrollTimer;
  phoneCarousel.addEventListener('scroll', function() {
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
  }, {passive:true});

  phoneCarousel.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    phoneCarousel.scrollLeft += e.deltaY;
  }, {passive:false});
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

// ─── COMPARE TABLE ROW SYNC + SWIPE HINT ───
(function(){
  var scrollEl = document.querySelector('.compare-scroll');
  var hint = document.getElementById('compareSwipeHint');
  if (!scrollEl) return;

  // Swipe hint
  if (hint) {
    scrollEl.addEventListener('scroll', function() {
      if (scrollEl.scrollLeft > 10) {
        hint.classList.add('hidden');
      } else {
        hint.classList.remove('hidden');
      }
    });
  }

  // Sync row heights between fixed and scroll sides
  function syncRowHeights() {
    var fixedHeader = document.querySelector('.compare-fixed-header');
    var firstCol = document.querySelector('.compare-col');
    if (!fixedHeader || !firstCol) return;

    // Sync header height
    var colHeader = firstCol.querySelector('.compare-col-header');
    if (colHeader) {
      fixedHeader.style.height = '';
      colHeader.style.height = '';
      var h = Math.max(fixedHeader.offsetHeight, colHeader.offsetHeight);
      fixedHeader.style.height = h + 'px';
      colHeader.style.height = h + 'px';
      // Apply to all col headers
      document.querySelectorAll('.compare-col-header').forEach(function(el) {
        el.style.height = h + 'px';
      });
    }

    // Sync body rows
    var fixedRows = document.querySelectorAll('.compare-fixed-row');
    var cols = document.querySelectorAll('.compare-col');
    fixedRows.forEach(function(row, i) {
      row.style.height = '';
      cols.forEach(function(col) {
        var cells = col.querySelectorAll('.compare-col-cell');
        if (cells[i]) cells[i].style.height = '';
      });

      var maxH = row.offsetHeight;
      cols.forEach(function(col) {
        var cells = col.querySelectorAll('.compare-col-cell');
        if (cells[i]) maxH = Math.max(maxH, cells[i].offsetHeight);
      });

      row.style.height = maxH + 'px';
      cols.forEach(function(col) {
        var cells = col.querySelectorAll('.compare-col-cell');
        if (cells[i]) cells[i].style.height = maxH + 'px';
      });
    });
  }

  // Defer sync to ensure CSS media queries have applied display:flex
  requestAnimationFrame(function() {
    requestAnimationFrame(syncRowHeights);
  });
  window.addEventListener('resize', syncRowHeights);
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
