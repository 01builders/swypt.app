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

// ─── Nav solidify on scroll + CTA visibility ───
var nav = document.querySelector('nav');
var navCta = document.getElementById('nav-cta');
var problemSection = document.getElementById('problem');
var navScrolled = false;
var ctaVisible = false;
window.addEventListener('scroll', function() {
  var shouldScroll = window.scrollY > 50;
  if (shouldScroll !== navScrolled) {
    navScrolled = shouldScroll;
    nav.classList.toggle('scrolled', navScrolled);
  }
  if (navCta && problemSection) {
    var showCta = window.scrollY >= problemSection.offsetTop - 80;
    if (showCta !== ctaVisible) {
      ctaVisible = showCta;
      navCta.classList.toggle('visible', ctaVisible);
    }
  }
}, { passive: true });

// ─── Scroll progress bar (mobile) ───
var progressBar = document.querySelector('.scroll-progress-bar');
if (progressBar) {
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }, { passive: true });
}

// ─── Dot nav: highlight active section ───
var dotLinks = document.querySelectorAll('.dot-nav a');
var sections = [];
dotLinks.forEach(function(link) {
  var id = link.getAttribute('data-section');
  var section = document.getElementById(id);
  if (section) sections.push({ el: section, link: link });
});

function updateDotNav() {
  var scrollPos = window.scrollY + window.innerHeight / 3;
  var active = sections[0];
  for (var i = 0; i < sections.length; i++) {
    if (sections[i].el.offsetTop <= scrollPos) {
      active = sections[i];
    }
  }
  dotLinks.forEach(function(link) { link.classList.remove('active'); });
  if (active) active.link.classList.add('active');
}

window.addEventListener('scroll', updateDotNav, { passive: true });
updateDotNav();

// ─── Count-up animation ───
var countEls = document.querySelectorAll('.count-up');
var countObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (!entry.isIntersecting) return;
    var el = entry.target;
    countObs.unobserve(el);

    var target = parseInt(el.getAttribute('data-target'), 10);
    if (!target) return;
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = performance.now();

    function animate(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      el.textContent = prefix + current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  });
}, { threshold: 0.5 });
countEls.forEach(function(el) { countObs.observe(el); });
