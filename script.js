// ─── TICKER DATA ───
var TICKER_DATA = [
  { type:'price', symbol:'BTC', price:'$104,231', change:'+2.4%', up:true, icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'ETH', price:'$3,891', change:'+1.1%', up:true, icon:'assets/logos/eth.svg' },
  { type:'predict', question:'BTC > $150K?', odds:'72% YES', icon:'assets/logos/btc.svg' },
  { type:'price', symbol:'SOL', price:'$241', change:'+5.7%', up:true, icon:'assets/logos/sol.svg' },
  { type:'predict', question:'Next US president?', odds:'52% GOP', emoji:'\uD83C\uDDFA\uD83C\uDDF8' },
  { type:'price', symbol:'DOGE', price:'$0.41', change:'-0.8%', up:false, icon:'assets/logos/doge.svg' },
  { type:'price', symbol:'ARB', price:'$1.82', change:'+3.1%', up:true, icon:'assets/logos/arb.svg' },
  { type:'predict', question:'ETH ETF approved?', odds:'89% YES', icon:'assets/logos/eth.svg' },
  { type:'price', symbol:'AVAX', price:'$48.20', change:'+2.9%', up:true, icon:'assets/logos/avax.svg' }
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
  // Fix container width to widest word so text before it never shifts
  var container = document.querySelector('.hero-rotate-words');
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

// ─── SCANNER CARD STREAM ───
(function() {
  var track = document.getElementById('scannerTrack');
  var stream = document.getElementById('scannerStream');
  if (!track || !stream) return;

  // Card screen templates (reuse phone carousel patterns)
  var CARD_SCREENS = [
    // Swipe Trading Red
    '<div class="phone-screen" style="background:linear-gradient(180deg,#8B2040 0%,#C0354D 50%,#8B2040 100%);padding:0">' +
      '<div style="display:flex;justify-content:center;padding-top:28px;gap:4px"><div style="background:#5B7BF9;padding:4px 12px;border-radius:8px 0 0 8px;font-size:0.55rem;font-weight:700">📊</div><div style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:0 8px 8px 0;font-size:0.55rem">♥</div></div>' +
      '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:16px"><div style="background:#1a1e2e;border-radius:16px;width:90%;height:75%;padding:12px;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:0.7rem;font-weight:700">$0.102</span></div><span style="font-size:0.5rem;color:#4ADE80">2.99%</span><div style="flex:1;display:flex;align-items:center"><svg viewBox="0 0 100 40" width="100%" height="60%"><path d="M0,35 Q10,30 20,28 T40,20 T60,15 T80,25 T100,10" fill="none" stroke="#5B7BF9" stroke-width="1.5"/></svg></div><div style="display:flex;gap:6px;font-size:0.4rem;color:rgba(255,255,255,0.5)"><span style="background:#5B7BF9;padding:2px 6px;border-radius:4px;color:#fff">1D</span><span>1W</span><span>1M</span><span>MAX</span></div></div></div>' +
      '<div style="padding:0 12px 12px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:6px"><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↓ Short</div><div style="background:rgba(255,255,255,0.1);padding:8px;border-radius:10px;font-size:0.55rem">✕</div><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↑ Long</div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4)"><span>Account</span><span style="color:#5B7BF9">Swype</span><span>Search</span><span>Score</span></div></div>',
    // Swipe Trading Green
    '<div class="phone-screen" style="background:linear-gradient(180deg,#1B7A4A 0%,#2D9E5F 50%,#1B7A4A 100%);padding:0">' +
      '<div style="display:flex;justify-content:center;padding-top:28px;gap:4px"><div style="background:#5B7BF9;padding:4px 12px;border-radius:8px 0 0 8px;font-size:0.55rem;font-weight:700">📊</div><div style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:0 8px 8px 0;font-size:0.55rem">♥</div></div>' +
      '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:16px"><div style="background:#1a1e2e;border-radius:16px;width:90%;height:75%;padding:12px;display:flex;flex-direction:column"><div style="display:flex;justify-content:space-between"><div><div style="font-size:0.55rem;font-weight:700">Berachain</div><div style="font-size:0.45rem;color:#5B7BF9">BERA</div></div></div><div style="flex:1;display:flex;align-items:center"><svg viewBox="0 0 100 40" width="100%" height="60%"><path d="M0,30 Q15,28 25,32 T50,25 T75,20 T100,35" fill="none" stroke="#5B7BF9" stroke-width="1.5"/></svg></div><div style="display:flex;gap:6px;font-size:0.4rem;color:rgba(255,255,255,0.5)"><span>4H</span><span style="background:#5B7BF9;padding:2px 6px;border-radius:4px;color:#fff">1D</span><span>1W</span><span>1M</span></div></div></div>' +
      '<div style="padding:0 12px 12px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:6px"><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↓ Short</div><div style="background:rgba(255,255,255,0.1);padding:8px;border-radius:10px;font-size:0.55rem">✕</div><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↑ Long</div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4)"><span>Account</span><span style="color:#5B7BF9">Swype</span><span>Search</span><span>Score</span></div></div>',
    // SOL Detail
    '<div class="phone-screen" style="background:#0f1219;padding:0">' +
      '<div style="display:flex;justify-content:center;padding-top:28px;gap:4px"><div style="background:#5B7BF9;padding:4px 12px;border-radius:8px 0 0 8px;font-size:0.55rem;font-weight:700">📊</div><div style="background:rgba(255,255,255,0.15);padding:4px 12px;border-radius:0 8px 8px 0;font-size:0.55rem">♥</div></div>' +
      '<div style="flex:1;padding:12px"><div style="background:#1a1e2e;border-radius:16px;width:100%;height:100%;padding:12px;display:flex;flex-direction:column;border:1px solid rgba(255,255,255,0.06)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="display:flex;align-items:center;gap:6px"><div style="width:22px;height:22px;border-radius:50%;overflow:hidden"><img src="assets/logos/sol.svg" alt="SOL" style="width:100%;height:100%;object-fit:cover"></div><div><div style="font-size:0.6rem;font-weight:700">Solana</div><div style="font-size:0.45rem;color:#5B7BF9">SOL</div></div></div><div style="text-align:right"><div style="font-size:0.65rem;font-weight:700">$124.30</div><div style="font-size:0.45rem;color:#F87171">-2.26%</div></div></div><div style="flex:1;display:flex;align-items:center"><svg viewBox="0 0 100 40" width="100%" height="70%"><path d="M0,15 Q8,10 15,20 T30,12 T45,18 T55,8 T70,15 T85,30 T100,20" fill="none" stroke="#5B7BF9" stroke-width="1.5"/><circle cx="100" cy="20" r="2" fill="#5B7BF9"/></svg></div><div style="display:flex;gap:6px;font-size:0.4rem;color:rgba(255,255,255,0.5)"><span>4H</span><span style="background:#5B7BF9;padding:2px 6px;border-radius:4px;color:#fff">1D</span><span>1W</span><span>1M</span><span>MAX</span></div></div></div>' +
      '<div style="padding:0 12px 12px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;gap:6px"><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↓ Short</div><div style="background:rgba(255,255,255,0.1);padding:8px;border-radius:10px;font-size:0.55rem">✕</div><div style="flex:1;background:#5B7BF9;padding:8px;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700">↑ Long</div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4)"><span>Account</span><span style="color:#5B7BF9">Swype</span><span>Search</span><span>Score</span></div></div>',
    // Portfolio
    '<div class="phone-screen" style="background:#0f1219;padding:28px 10px 0">' +
      '<div style="text-align:center;font-size:0.75rem;font-weight:700;margin-bottom:4px">Portfolio</div>' +
      '<div style="text-align:center;font-size:1.1rem;font-weight:800;margin-bottom:2px">$4,230.50</div>' +
      '<div style="text-align:center;font-size:0.45rem;color:#4ADE80;margin-bottom:12px">+$142.30 (3.48%)</div>' +
      '<div style="background:#1a1e2e;border-radius:12px;padding:10px;margin-bottom:8px;height:80px;display:flex;align-items:center"><svg viewBox="0 0 100 30" width="100%" height="100%"><path d="M0,20 Q10,18 20,15 T40,12 T60,8 T80,10 T100,5" fill="none" stroke="#4ADE80" stroke-width="1.5"/></svg></div>' +
      '<div style="display:flex;flex-direction:column;gap:2px;flex:1"><div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px;background:#1a1e2e;border-radius:8px;margin-bottom:2px"><div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:18px;border-radius:50%;overflow:hidden"><img src="assets/logos/btc.svg" alt="BTC" style="width:100%;height:100%;object-fit:cover"></div><div style="font-size:0.48rem;font-weight:600">BTC</div></div><div style="text-align:right"><div style="font-size:0.48rem;font-weight:600">$2,450.00</div><div style="font-size:0.35rem;color:#4ADE80">+2.1%</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px;background:#1a1e2e;border-radius:8px;margin-bottom:2px"><div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:18px;border-radius:50%;overflow:hidden"><img src="assets/logos/eth.svg" alt="ETH" style="width:100%;height:100%;object-fit:cover"></div><div style="font-size:0.48rem;font-weight:600">ETH</div></div><div style="text-align:right"><div style="font-size:0.48rem;font-weight:600">$1,200.50</div><div style="font-size:0.35rem;color:#4ADE80">+4.2%</div></div></div><div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px;background:#1a1e2e;border-radius:8px"><div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:18px;border-radius:50%;overflow:hidden"><img src="assets/logos/sol.svg" alt="SOL" style="width:100%;height:100%;object-fit:cover"></div><div style="font-size:0.48rem;font-weight:600">SOL</div></div><div style="text-align:right"><div style="font-size:0.48rem;font-weight:600">$580.00</div><div style="font-size:0.35rem;color:#F87171">-1.3%</div></div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4);margin-top:auto"><span style="color:#5B7BF9">Account</span><span>Swype</span><span>Search</span><span>Score</span></div></div>',
    // Order Confirmation
    '<div class="phone-screen" style="background:#0f1219;padding:28px 10px 0;align-items:center">' +
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">' +
      '<div style="width:48px;height:48px;border-radius:50%;background:rgba(74,222,128,0.15);display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-size:1.2rem">✓</div>' +
      '<div style="font-size:0.75rem;font-weight:800;margin-bottom:4px">Trade Executed!</div>' +
      '<div style="font-size:0.45rem;color:rgba(255,255,255,0.5);margin-bottom:16px">Your order has been filled</div>' +
      '<div style="background:#1a1e2e;border-radius:12px;padding:12px;width:100%;text-align:left"><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.45rem"><span style="color:rgba(255,255,255,0.4)">Pair</span><span style="font-weight:600">BTC/USD</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.45rem;border-top:1px solid rgba(255,255,255,0.05)"><span style="color:rgba(255,255,255,0.4)">Side</span><span style="font-weight:600;color:#4ADE80">Long</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.45rem;border-top:1px solid rgba(255,255,255,0.05)"><span style="color:rgba(255,255,255,0.4)">Size</span><span style="font-weight:600">$500.00</span></div><div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.45rem;border-top:1px solid rgba(255,255,255,0.05)"><span style="color:rgba(255,255,255,0.4)">Leverage</span><span style="font-weight:600">10x</span></div></div>' +
      '<div style="background:#5B7BF9;padding:10px 0;border-radius:10px;text-align:center;font-size:0.55rem;font-weight:700;width:100%;margin-top:12px">View Position</div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4);width:100%"><span>Account</span><span style="color:#5B7BF9">Swype</span><span>Search</span><span>Score</span></div></div>',
    // Prediction Market 1
    '<div class="phone-screen" style="background:#0f1219;padding:28px 10px 0">' +
      '<div style="text-align:center;font-size:0.65rem;font-weight:700;margin-bottom:10px">Predictions</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;flex:1">' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">Will BTC hit $100k?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Mar 31, 2025</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">72¢</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">28¢</div></div></div></div>' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">ETH flips SOL in TVL?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Jun 30, 2025</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">45¢</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">55¢</div></div></div></div>' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">Fed cuts rates in Q2?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Jun 30, 2025</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">61¢</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">39¢</div></div></div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4);margin-top:8px"><span>Account</span><span>Swype</span><span>Search</span><span style="color:#5B7BF9">Score</span></div></div>',
    // Prediction Market 2
    '<div class="phone-screen" style="background:#0f1219;padding:28px 10px 0">' +
      '<div style="text-align:center;font-size:0.65rem;font-weight:700;margin-bottom:10px">Predictions</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;flex:1">' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">Trump wins 2028?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Nov 3, 2028</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">N/A</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">N/A</div></div></div></div>' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">SOL flips ETH by EOY?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Dec 31, 2025</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">18¢</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">82¢</div></div></div></div>' +
      '<div style="background:#1a1e2e;border-radius:10px;padding:10px"><div style="font-size:0.48rem;font-weight:600;margin-bottom:4px">Apple launches crypto?</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4);margin-bottom:8px">Closes Dec 31, 2025</div><div style="display:flex;gap:4px"><div style="flex:1;background:rgba(74,222,128,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#4ADE80">Yes</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">8¢</div></div><div style="flex:1;background:rgba(248,113,113,0.15);padding:6px;border-radius:6px;text-align:center"><div style="font-size:0.5rem;font-weight:700;color:#F87171">No</div><div style="font-size:0.38rem;color:rgba(255,255,255,0.4)">92¢</div></div></div></div></div>' +
      '<div style="display:flex;justify-content:space-around;padding:8px 0;border-top:1px solid rgba(255,255,255,0.1);font-size:0.4rem;color:rgba(255,255,255,0.4);margin-top:8px"><span>Account</span><span>Swype</span><span>Search</span><span style="color:#5B7BF9">Score</span></div></div>'
  ];

  // Generate crypto-themed ASCII code
  function generateCode(w, h) {
    var lines = [
      'const swap = async (pair, amt) => {',
      '  const tx = await dex.createOrder({',
      '    market: pair,',
      '    size: amt * leverage,',
      '    side: "long",',
      '  });',
      '  await wallet.sign(tx.hash);',
      '  return tx.confirm();',
      '};',
      '',
      'fn predict(market_id: u64) -> Result {',
      '  let odds = oracle.fetch(market_id)?;',
      '  let position = Position::new(',
      '    market_id,',
      '    odds.yes_price,',
      '    amount,',
      '  );',
      '  vault.deposit(&position)?;',
      '  Ok(position.id)',
      '}',
      '',
      'class Portfolio {',
      '  constructor(wallet) {',
      '    this.balance = wallet.balance;',
      '    this.positions = [];',
      '  }',
      '  async rebalance() {',
      '    const prices = await feed.latest();',
      '    this.positions.forEach(p => {',
      '      p.pnl = calcPnL(p, prices);',
      '    });',
      '  }',
      '}',
      '',
      'pub fn settle_market(',
      '  ctx: Context,',
      '  outcome: bool,',
      ') -> Result<()> {',
      '  let market = &mut ctx.market;',
      '  market.resolved = true;',
      '  market.outcome = outcome;',
      '  emit!(MarketSettled {',
      '    id: market.id,',
      '    outcome,',
      '  });',
      '  Ok(())',
      '}',
    ];
    var cols = Math.ceil(w / 6);
    var rows = Math.ceil(h / 12);
    var result = '';
    for (var i = 0; i < rows; i++) {
      var line = lines[i % lines.length];
      if (line.length < cols) line += new Array(cols - line.length + 1).join(' ');
      result += line.substring(0, cols) + '\n';
    }
    return result;
  }

  // Build cards
  var CARD_COUNT = 15;
  function buildCards() {
    var html = '';
    for (var i = 0; i < CARD_COUNT; i++) {
      var screenIdx = i % CARD_SCREENS.length;
      html += '<div class="scanner-card-wrapper">' +
        '<div class="scanner-card-normal"><div class="phone-frame" style="width:100%;height:100%"><div class="phone-frame-notch"></div>' +
        CARD_SCREENS[screenIdx] +
        '</div></div>' +
        '<div class="scanner-card-ascii"><div class="ascii-content">' +
        generateCode(220, 440) +
        '</div></div></div>';
    }
    track.innerHTML = html + html; // duplicate for infinite loop
  }
  buildCards();

  // Animation state
  var position = 0;
  var velocity = 60; // px/s
  var direction = -1; // scroll left
  var lastTime = 0;
  var isDragging = false;
  var dragStartX = 0;
  var dragLastX = 0;
  var dragVelocity = 0;
  var momentum = 0;
  var sectionRect = null;

  function getScannerCenter() {
    if (!sectionRect) sectionRect = stream.getBoundingClientRect();
    return sectionRect.left + sectionRect.width / 2;
  }

  function updateClipping() {
    var center = getScannerCenter();
    var cards = track.querySelectorAll('.scanner-card-wrapper');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var rect = card.getBoundingClientRect();
      var cardLeft = rect.left;
      var cardRight = rect.right;

      // scanPct = how far scanner has swept from LEFT edge of card (0-100)
      // Card moves left → scanner enters from LEFT, exits RIGHT
      var scanPct;
      if (cardRight <= center) {
        scanPct = 100; // fully scanned
      } else if (cardLeft >= center) {
        scanPct = 0; // not yet scanned
      } else {
        scanPct = ((center - cardLeft) / rect.width) * 100;
        scanPct = Math.max(0, Math.min(100, scanPct));
      }
      // Single CSS var drives both layers:
      // normal: inset(0 0 0 scanPct) — hides left (scanned) portion
      // ascii:  inset(0 (100-scanPct) 0 0) — shows left (scanned) portion
      card.style.setProperty('--scan-pct', scanPct + '%');
    }
  }

  // Wrap position for infinite scrolling
  var halfTrackWidth = 0;
  function measureTrack() {
    halfTrackWidth = track.scrollWidth / 2;
  }

  function animate(time) {
    if (!lastTime) lastTime = time;
    var dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt > 0.1) dt = 0.1; // cap delta

    sectionRect = stream.getBoundingClientRect();

    if (!isDragging) {
      // Apply momentum decay
      if (Math.abs(momentum) > 0.5) {
        position += momentum * dt;
        momentum *= 0.95;
      } else {
        momentum = 0;
        position += velocity * direction * dt;
      }
    }

    // Wrap for infinite loop
    if (halfTrackWidth > 0) {
      if (position < -halfTrackWidth) position += halfTrackWidth;
      if (position > 0) position -= halfTrackWidth;
    }

    track.style.transform = 'translateX(' + position + 'px)';
    updateClipping();
    requestAnimationFrame(animate);
  }

  // Drag support
  function onDragStart(x) {
    isDragging = true;
    dragStartX = x;
    dragLastX = x;
    dragVelocity = 0;
    momentum = 0;
    track.classList.add('grabbing');
  }
  function onDragMove(x) {
    if (!isDragging) return;
    var dx = x - dragLastX;
    position += dx;
    dragVelocity = dx;
    dragLastX = x;
  }
  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    momentum = dragVelocity * 60; // Convert per-frame to per-second
    track.classList.remove('grabbing');
  }

  // Mouse events
  stream.addEventListener('mousedown', function(e) { e.preventDefault(); onDragStart(e.clientX); });
  window.addEventListener('mousemove', function(e) { onDragMove(e.clientX); });
  window.addEventListener('mouseup', onDragEnd);

  // Touch events
  stream.addEventListener('touchstart', function(e) { onDragStart(e.touches[0].clientX); }, {passive:true});
  window.addEventListener('touchmove', function(e) { onDragMove(e.touches[0].clientX); }, {passive:true});
  window.addEventListener('touchend', onDragEnd, {passive:true});

  // Init
  measureTrack();
  window.addEventListener('resize', function() { measureTrack(); sectionRect = null; });
  requestAnimationFrame(animate);

  // ─── PARTICLE SYSTEM (Three.js) ───
  var particleCanvas = document.getElementById('particleCanvas');
  if (particleCanvas && typeof THREE !== 'undefined') {
    var pScene = new THREE.Scene();
    var pWidth = particleCanvas.clientWidth || 800;
    var pHeight = particleCanvas.clientHeight || 300;
    var pCamera = new THREE.OrthographicCamera(-pWidth/2, pWidth/2, pHeight/2, -pHeight/2, 0.1, 1000);
    pCamera.position.z = 100;
    var pRenderer = new THREE.WebGLRenderer({ canvas: particleCanvas, alpha: true, antialias: false });
    pRenderer.setSize(pWidth, pHeight);
    pRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    var PARTICLE_COUNT = 400;
    var pPositions = new Float32Array(PARTICLE_COUNT * 3);
    var pVelocities = new Float32Array(PARTICLE_COUNT * 2);
    var pAlphas = new Float32Array(PARTICLE_COUNT);
    var pPhases = new Float32Array(PARTICLE_COUNT);

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      pPositions[i*3] = (Math.random() - 0.5) * pWidth;
      pPositions[i*3+1] = (Math.random() - 0.5) * pHeight;
      pPositions[i*3+2] = 0;
      pVelocities[i*2] = 20 + Math.random() * 40; // rightward
      pVelocities[i*2+1] = (Math.random() - 0.5) * 10;
      pAlphas[i] = Math.random();
      pPhases[i] = Math.random() * Math.PI * 2;
    }

    var pGeometry = new THREE.BufferGeometry();
    pGeometry.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    var pMaterial = new THREE.PointsMaterial({
      color: 0x8B5CF6,
      size: 2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    var pPoints = new THREE.Points(pGeometry, pMaterial);
    pScene.add(pPoints);

    var pTime = 0;
    function animateParticles() {
      requestAnimationFrame(animateParticles);
      pTime += 0.016;
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        pPositions[i*3] += pVelocities[i*2] * 0.016;
        pPositions[i*3+1] += pVelocities[i*2+1] * 0.016;
        // Twinkle
        pAlphas[i] = 0.3 + 0.7 * Math.abs(Math.sin(pTime * 2 + pPhases[i]));
        // Wrap
        if (pPositions[i*3] > pWidth / 2) {
          pPositions[i*3] = -pWidth / 2;
          pPositions[i*3+1] = (Math.random() - 0.5) * pHeight;
        }
      }
      pGeometry.attributes.position.needsUpdate = true;
      pMaterial.opacity = 0.3 + 0.3 * Math.abs(Math.sin(pTime * 0.5));
      pRenderer.render(pScene, pCamera);
    }
    animateParticles();

    window.addEventListener('resize', function() {
      pWidth = particleCanvas.clientWidth || 800;
      pHeight = particleCanvas.clientHeight || 300;
      pCamera.left = -pWidth/2; pCamera.right = pWidth/2;
      pCamera.top = pHeight/2; pCamera.bottom = -pHeight/2;
      pCamera.updateProjectionMatrix();
      pRenderer.setSize(pWidth, pHeight);
    });
  }

  // ─── SCANNER GLOW (Canvas 2D) ───
  var glowCanvas = document.getElementById('scannerCanvas');
  if (glowCanvas) {
    var gCtx = glowCanvas.getContext('2d');
    var gWidth, gHeight;
    var glowParticles = [];
    var GLOW_PARTICLE_COUNT = 200;

    function initGlow() {
      gWidth = glowCanvas.clientWidth || 800;
      gHeight = glowCanvas.clientHeight || 350;
      glowCanvas.width = gWidth * (Math.min(window.devicePixelRatio, 2));
      glowCanvas.height = gHeight * (Math.min(window.devicePixelRatio, 2));
      gCtx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));

      glowParticles = [];
      for (var i = 0; i < GLOW_PARTICLE_COUNT; i++) {
        glowParticles.push({
          x: gWidth / 2 + (Math.random() - 0.5) * 20,
          y: Math.random() * gHeight,
          vx: (Math.random() - 0.3) * 2,
          vy: (Math.random() - 0.5) * 1,
          size: 1 + Math.random() * 2,
          alpha: Math.random() * 0.5,
          life: Math.random()
        });
      }
    }
    initGlow();

    var gTime = 0;
    function animateGlow() {
      requestAnimationFrame(animateGlow);
      gCtx.clearRect(0, 0, gWidth, gHeight);
      gTime += 0.016;

      // Central glow bar
      var cx = gWidth / 2;
      var grad = gCtx.createRadialGradient(cx, gHeight/2, 0, cx, gHeight/2, 60);
      grad.addColorStop(0, 'rgba(139,92,246,0.25)');
      grad.addColorStop(0.5, 'rgba(139,92,246,0.08)');
      grad.addColorStop(1, 'rgba(139,92,246,0)');
      gCtx.fillStyle = grad;
      gCtx.fillRect(cx - 60, 0, 120, gHeight);

      // Particles
      for (var i = 0; i < glowParticles.length; i++) {
        var p = glowParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.005;

        if (p.life <= 0 || p.x < 0 || p.x > gWidth || p.y < 0 || p.y > gHeight) {
          p.x = cx + (Math.random() - 0.5) * 10;
          p.y = Math.random() * gHeight;
          p.vx = (Math.random() - 0.3) * 2;
          p.vy = (Math.random() - 0.5) * 1;
          p.life = 0.5 + Math.random() * 0.5;
          p.alpha = Math.random() * 0.5;
        }

        var flicker = 0.5 + 0.5 * Math.sin(gTime * 4 + i);
        gCtx.beginPath();
        gCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        gCtx.fillStyle = 'rgba(139,92,246,' + (p.alpha * p.life * flicker) + ')';
        gCtx.fill();
      }
    }
    animateGlow();

    window.addEventListener('resize', initGlow);
  }
})();
