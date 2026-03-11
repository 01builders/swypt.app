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
