(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var cfg = window.TIMBERSTEAD || {};

  document.querySelectorAll("[data-store]").forEach(function (slot) {
    var url = (cfg.appStoreUrl || "").trim();
    var link = slot.querySelector("[data-store-link]");
    var soon = slot.querySelector("[data-store-soon]");
    if (!link || !soon) return;
    if (/^https:\/\//i.test(url)) {
      link.href = url;
      link.hidden = false;
      soon.hidden = true;
    }
  });

  var header = document.querySelector(".top");
  if (header) {
    var onScrollHead = function () {
      header.classList.toggle("is-stuck", window.scrollY > 6);
    };
    onScrollHead();
    window.addEventListener("scroll", onScrollHead, { passive: true });
  }

  if (!reduced) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) {
      revealObs.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }

  var layers = document.querySelectorAll("[data-depth]");
  if (!reduced && layers.length) {
    var mx = 0;
    var pending = 0;
    var apply = function () {
      pending = 0;
      var y = window.scrollY || 0;
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var depth = parseFloat(el.getAttribute("data-depth")) || 0;
        var tx = fine ? mx * depth * 22 : 0;
        var ty = y * depth * 0.06;
        el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)";
      }
    };
    var schedule = function () {
      if (!pending) pending = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    if (fine) {
      var heroBox = document.querySelector(".hero");
      window.addEventListener("pointermove", function (event) {
        if (!heroBox) return;
        var rect = heroBox.getBoundingClientRect();
        if (!rect.width) return;
        mx = ((event.clientX - rect.left) / rect.width) - 0.5;
        schedule();
      }, { passive: true });
    }
  }

  var hero = document.querySelector(".hero");
  if (hero && !reduced && "IntersectionObserver" in window) {
    var quietObs = new IntersectionObserver(function (entries) {
      hero.classList.toggle("is-quiet", !entries[0].isIntersecting);
    });
    quietObs.observe(hero);
  }

  var winterSlot = document.querySelector("[data-winter]");
  if (winterSlot && !reduced) {
    var loadWinter = function () {
      winterSlot.innerHTML = '<source srcset="img/hero/winter.avif" type="image/avif"><source srcset="img/hero/winter.webp" type="image/webp"><img src="img/hero/winter.jpg" alt="" width="1206" height="1100" decoding="async">';
      winterSlot.hidden = false;
    };
    window.addEventListener("load", function () { setTimeout(loadWinter, 600); });
  }

  var canvas = document.getElementById("motes");
  if (canvas && !reduced && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var parent = canvas.parentElement;
    var flakes = [];
    var sparks = [];
    var running = true;
    var dpr = 1;

    var seed = function (count, bag, kind) {
      bag.length = 0;
      for (var i = 0; i < count; i++) {
        bag.push({
          x: Math.random(),
          y: Math.random(),
          r: kind === "snow" ? 0.6 + Math.random() * 1.8 : 0.8 + Math.random() * 1.6,
          s: kind === "snow" ? 0.12 + Math.random() * 0.28 : 0.18 + Math.random() * 0.4,
          w: Math.random() * Math.PI * 2,
          a: 0.25 + Math.random() * 0.6
        });
      }
    };

    var resize = function () {
      var rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.round(rect.width));
      var h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      var area = w * h;
      var count = Math.max(18, Math.min(70, Math.round(area / 9000)));
      seed(count, flakes, "snow");
      seed(Math.round(count * 0.55), sparks, "ember");
    };

    var winterAmount = function (t) {
      var p = (t % 18000) / 18000;
      if (p < 0.32) return 0;
      if (p < 0.5) return (p - 0.32) / 0.18;
      if (p < 0.82) return 1;
      return 1 - ((p - 0.82) / 0.18);
    };

    var drawKind = function (bag, now, snow) {
      var w = canvas.width;
      var h = canvas.height;
      for (var i = 0; i < bag.length; i++) {
        var p = bag[i];
        var drift = Math.sin(now / 700 + p.w) * (snow ? 8 : 4) * dpr;
        var x = p.x * w + drift;
        var y = ((p.y + (now / 1000) * p.s * (snow ? 1 : -1)) % 1) * h;
        if (y < 0) y += h;
        ctx.beginPath();
        ctx.arc(x, y, p.r * dpr, 0, Math.PI * 2);
        if (snow) {
          ctx.fillStyle = "rgba(255,255,255," + p.a + ")";
        } else {
          ctx.fillStyle = "rgba(255," + (150 + (i % 5) * 16) + ",60," + p.a + ")";
        }
        ctx.fill();
      }
    };

    var frame = function (now) {
      if (!running) return;
      var visible = !hero.classList.contains("is-quiet") && !document.hidden;
      if (visible && canvas.width) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var winter = winterAmount(now);
        if (winter < 0.98) {
          ctx.globalAlpha = 1 - winter;
          drawKind(sparks, now, false);
        }
        if (winter > 0.02) {
          ctx.globalAlpha = winter;
          drawKind(flakes, now, true);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  var tablist = document.querySelector("[data-seasons]");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var selectTab = function (index) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    };
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(i); });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (i + 1) % tabs.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        tabs[next].focus();
        selectTab(next);
      });
    });
  }

  var track = document.querySelector("[data-gal-track]");
  if (track) {
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-gal-dot]"));
    var prev = document.querySelector("[data-gal='prev']");
    var next = document.querySelector("[data-gal='next']");
    var live = document.getElementById("gal-live");
    var count = document.querySelector("[data-gal-count]");
    var interacted = false;
    var last = -1;

    var current = function () {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = 0;
      var bestDist = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var center = slides[i].offsetLeft + slides[i].offsetWidth / 2;
        var dist = Math.abs(center - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    };

    var go = function (index) {
      var slide = slides[index];
      if (!slide) return;
      var left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
      track.scrollTo({ left: left, behavior: reduced ? "auto" : "smooth" });
    };

    var paint = function () {
      var i = current();
      dots.forEach(function (dot, j) {
        if (j === i) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
      if (count) count.textContent = String(i + 1);
      if (interacted && live && i !== last) {
        last = i;
        live.textContent = "Screenshot " + (i + 1) + " of " + slides.length + ", " + (slides[i].getAttribute("data-title") || "");
      }
    };

    var scrollTick = 0;
    track.addEventListener("scroll", function () {
      if (scrollTick) return;
      scrollTick = requestAnimationFrame(function () {
        scrollTick = 0;
        paint();
      });
    }, { passive: true });

    if (prev) prev.addEventListener("click", function () { interacted = true; go(Math.max(0, current() - 1)); });
    if (next) next.addEventListener("click", function () { interacted = true; go(Math.min(slides.length - 1, current() + 1)); });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { interacted = true; go(i); });
    });

    track.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "Home" && event.key !== "End") return;
      event.preventDefault();
      interacted = true;
      if (event.key === "Home") go(0);
      else if (event.key === "End") go(slides.length - 1);
      else if (event.key === "ArrowRight") go(Math.min(slides.length - 1, current() + 1));
      else go(Math.max(0, current() - 1));
    });

    paint();
  }
})();
