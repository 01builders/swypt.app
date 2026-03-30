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
});

// ─── Dot-nav active state ───
var dotLinks = document.querySelectorAll('.dot-nav a');
var sections = [];
dotLinks.forEach(function(link) {
  var id = link.getAttribute('data-section');
  var sec = document.getElementById(id);
  if (sec) sections.push({ el: sec, link: link });
});
window.addEventListener('scroll', function() {
  var scrollY = window.scrollY + window.innerHeight / 3;
  var current = sections[0];
  sections.forEach(function(s) {
    if (scrollY >= s.el.offsetTop) current = s;
  });
  dotLinks.forEach(function(l) { l.classList.remove('active'); });
  if (current) current.link.classList.add('active');
});

// ─── Count-up animation ───
var countEls = document.querySelectorAll('.count-up');
var countObs = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (!entry.isIntersecting) return;
    countObs.unobserve(entry.target);
    var el = entry.target;
    var target = parseInt(el.getAttribute('data-target'), 10);
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

// ─── Revenue & Valuation Scaling Graph ───
(function() {
  var canvas = document.getElementById('scaling-chart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var slider = document.getElementById('scaling-slider');
  var ttUsers = document.getElementById('tt-users');
  var ttRev = document.getElementById('tt-rev');

  var VOL_PER_TRADER = 8200;
  var FEE = 0.0075;

  // Graph anchors include 0 for proper X-axis; slider anchors start at 1K
  var graphAnchors = [0, 5000, 10000, 25000, 50000, 100000];
  var anchors = [1000, 5000, 10000, 25000, 50000, 100000];

  // Convert slider position (0–1000) to real user count
  function sliderToUsers(sliderVal) {
    var frac = sliderVal / 1000; // 0 to 1
    var idx = frac * (anchors.length - 1); // 0 to 4
    var lo = Math.floor(idx);
    var hi = Math.ceil(idx);
    if (lo === hi) return anchors[lo];
    var t = idx - lo;
    return Math.round(anchors[lo] + t * (anchors[hi] - anchors[lo]));
  }

  // Convert real user count to slider position (for snapping)
  function usersToSlider(users) {
    for (var i = 0; i < anchors.length - 1; i++) {
      if (users <= anchors[i + 1]) {
        var t = (users - anchors[i]) / (anchors[i + 1] - anchors[i]);
        return Math.round((i + t) / (anchors.length - 1) * 1000);
      }
    }
    return 1000;
  }

  // Start at 10,000 users
  slider.value = usersToSlider(10000);
  var currentUsers = 10000;

  // Snap points
  var snapUsers = [1000, 5000, 10000, 25000, 50000, 100000];
  function snapValue(users) {
    for (var i = 0; i < snapUsers.length; i++) {
      if (Math.abs(users - snapUsers[i]) < (users * 0.08)) return snapUsers[i];
    }
    return users;
  }

  function calcRev(users) {
    return users * VOL_PER_TRADER * FEE * 12;
  }

  function formatMoney(val) {
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return '$' + (val / 1e3).toFixed(0) + 'K';
    return '$' + val.toFixed(0);
  }

  function formatUsers(val) {
    if (val === 0) return '0';
    if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'K';
    return val.toString();
  }

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  // Map user count to X position using graph anchors (includes 0)
  function userToFrac(u) {
    if (u <= graphAnchors[0]) return 0;
    if (u >= graphAnchors[graphAnchors.length - 1]) return 1;
    for (var i = 0; i < graphAnchors.length - 1; i++) {
      if (u <= graphAnchors[i + 1]) {
        var t = (u - graphAnchors[i]) / (graphAnchors[i + 1] - graphAnchors[i]);
        return (i + t) / (graphAnchors.length - 1);
      }
    }
    return 1;
  }

  function draw() {
    resizeCanvas();
    var W = canvas.clientWidth;
    var H = canvas.clientHeight;
    var padL = 65, padR = 30, padT = 15, padB = 40;
    var chartW = W - padL - padR;
    var chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    var maxY = 80000000; // $80M fixed ceiling

    function userToX(u) { return padL + userToFrac(u) * chartW; }
    function valToY(v) { return padT + chartH - (v / maxY) * chartH; }

    // Grid lines — fixed Y-axis values
    var yTicks = [0, 10e6, 20e6, 40e6, 60e6, 80e6];
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (var i = 0; i < yTicks.length; i++) {
      var gy = valToY(yTicks[i]);
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + chartW, gy);
      ctx.stroke();

      ctx.fillStyle = '#8B9FFF';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(yTicks[i]), padL - 10, gy + 4);
    }

    // X-axis labels — evenly spaced anchors
    var xLabels = [0, 5000, 10000, 25000, 50000, 100000];
    ctx.fillStyle = '#8B9FFF';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (var j = 0; j < xLabels.length; j++) {
      var lx = userToX(xLabels[j]);
      ctx.fillText(formatUsers(xLabels[j]), lx, H - 8);
    }

    // Draw lines using graph anchors (starts from 0)
    var steps = 200;
    var minGraph = 0;
    var maxGraph = graphAnchors[graphAnchors.length - 1];

    // Revenue fill gradient (stronger green glow)
    ctx.beginPath();
    for (var sf = 0; sf <= steps; sf++) {
      var uf = minGraph + (sf / steps) * (maxGraph - minGraph);
      var rf = calcRev(uf);
      if (sf === 0) ctx.moveTo(userToX(uf), valToY(rf)); else ctx.lineTo(userToX(uf), valToY(rf));
    }
    ctx.lineTo(userToX(maxGraph), padT + chartH);
    ctx.lineTo(userToX(minGraph), padT + chartH);
    ctx.closePath();
    var gRev = ctx.createLinearGradient(padL, 0, padL + chartW, 0);
    gRev.addColorStop(0, 'rgba(74,222,128,0.03)');
    gRev.addColorStop(0.5, 'rgba(74,222,128,0.12)');
    gRev.addColorStop(1, 'rgba(74,222,128,0.25)');
    ctx.fillStyle = gRev;
    ctx.fill();

    // Revenue line (green, solid — brighter toward right)
    for (var seg = 0; seg < steps; seg++) {
      var uA = minGraph + (seg / steps) * (maxGraph - minGraph);
      var uB = minGraph + ((seg + 1) / steps) * (maxGraph - minGraph);
      var rA = calcRev(uA);
      var rB = calcRev(uB);
      var progress = seg / steps;
      var alpha = 0.6 + progress * 0.4;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(74,222,128,' + alpha + ')';
      ctx.lineWidth = 2 + progress * 1.5;
      ctx.setLineDash([]);
      ctx.moveTo(userToX(uA), valToY(rA));
      ctx.lineTo(userToX(uB), valToY(rB));
      ctx.stroke();
    }

    // Revenue line glow (soft bloom toward right)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var sg = 0; sg < steps; sg++) {
      var ugA = minGraph + (sg / steps) * (maxGraph - minGraph);
      var ugB = minGraph + ((sg + 1) / steps) * (maxGraph - minGraph);
      var rgA = calcRev(ugA);
      var rgB = calcRev(ugB);
      var gp = sg / steps;
      if (gp < 0.3) continue;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(74,222,128,' + ((gp - 0.3) * 0.15) + ')';
      ctx.lineWidth = 8 + gp * 6;
      ctx.moveTo(userToX(ugA), valToY(rgA));
      ctx.lineTo(userToX(ugB), valToY(rgB));
      ctx.stroke();
    }
    ctx.restore();

    // Vertical guide line at current user position
    var cx = userToX(currentUsers);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cx, padT);
    ctx.lineTo(cx, padT + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Revenue dot at intersection
    var revAtCurrent = calcRev(currentUsers);
    var dotRevY = valToY(revAtCurrent);

    // Revenue dot (with glow)
    ctx.beginPath();
    ctx.arc(cx, dotRevY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(74,222,128,0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, dotRevY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#4ADE80';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, dotRevY, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(74,222,128,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Active point label (e.g. "$7.4M ARR at 10K traders")
    var labelText = formatMoney(revAtCurrent) + ' ARR at ' + formatUsers(currentUsers) + ' traders';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#4ADE80';
    ctx.textAlign = (cx > padL + chartW * 0.35) ? 'right' : 'left';
    var labelOffsetX = (cx > padL + chartW * 0.35) ? -14 : 14;
    ctx.fillText(labelText, cx + labelOffsetX, dotRevY - 12);

    // Update tooltip
    ttUsers.textContent = currentUsers.toLocaleString() + ' traders';
    ttRev.textContent = formatMoney(revAtCurrent);
  }

  // Slider fill
  function updateSliderFill() {
    var pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = 'linear-gradient(to right, rgba(139,159,255,0.5) 0%, rgba(139,159,255,0.5) ' + pct + '%, rgba(255,255,255,0.1) ' + pct + '%, rgba(255,255,255,0.1) 100%)';
  }

  // Slider events
  slider.addEventListener('input', function() {
    var rawUsers = sliderToUsers(parseInt(this.value, 10));
    currentUsers = snapValue(rawUsers);
    // Sync slider position back if snapped
    var snappedSlider = usersToSlider(currentUsers);
    if (Math.abs(parseInt(this.value, 10) - snappedSlider) > 5) {
      this.value = snappedSlider;
    }
    updateSliderFill();
    draw();
  });

  // Clickable tick labels
  document.querySelectorAll('.scaling-slider-ticks span').forEach(function(tick) {
    tick.addEventListener('click', function() {
      var users = parseInt(this.getAttribute('data-users'), 10);
      currentUsers = users;
      slider.value = usersToSlider(users);
      updateSliderFill();
      draw();
    });
  });

  // Position tick labels to match slider thumb positions
  function positionTicks() {
    var ticks = document.querySelectorAll('.scaling-slider-ticks span');
    var numTicks = ticks.length;
    var thumbW = 22;
    for (var i = 0; i < numTicks; i++) {
      var frac = i / (numTicks - 1);
      // Browser thumb center = frac * 100% + (0.5 - frac) * thumbW
      var offset = (0.5 - frac) * thumbW;
      ticks[i].style.left = 'calc(' + (frac * 100) + '% + ' + offset + 'px)';
    }
  }

  // Resize handling
  window.addEventListener('resize', function() { draw(); positionTicks(); });

  // Redraw when section becomes visible (fade-up may hide it initially)
  var scalingSection = canvas.closest('.pitch-section');
  if (scalingSection) {
    var visObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          draw();
          positionTicks();
        }
      });
    }, { threshold: 0.05 });
    visObs.observe(scalingSection);
  }

  // Initial draw
  updateSliderFill();
  draw();
  positionTicks();
})();
