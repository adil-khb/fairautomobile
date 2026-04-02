// ---- Reveal on scroll (Toyota-like fade between sections) ----
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

// ---- Year in footer ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Mobile drawer ----
const menuBtn = document.getElementById("menuBtn");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");

function openDrawer() {
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
}
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
}
menuBtn?.addEventListener("click", openDrawer);
drawerClose?.addEventListener("click", closeDrawer);
drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});
drawer?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDrawer));

// ---- Simple carousel controls ----
const carousels = Array.from(document.querySelectorAll("[data-carousel]"));

function getVisibleCards(track) {
  return Array.from(track.querySelectorAll(".vehicleCard")).filter((card) => !card.hidden);
}

function getCarouselStep(track) {
  const visibleCards = getVisibleCards(track);
  const firstVisibleCard = visibleCards[0];

  if (!firstVisibleCard) {
    return track.clientWidth;
  }

  const styles = window.getComputedStyle(track);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
  return Math.round(firstVisibleCard.getBoundingClientRect().width + gap);
}

function updateCarouselButtons(carousel, track) {
  const buttons = carousel.querySelectorAll(".carousel__btn");
  const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
  const atStart = track.scrollLeft <= 8;
  const atEnd = track.scrollLeft >= maxScrollLeft - 8;
  const hasOverflow = maxScrollLeft > 8;

  buttons.forEach((button) => {
    const dir = Number(button.getAttribute("data-dir") || "1");
    button.disabled = !hasOverflow || (dir < 0 ? atStart : atEnd);
  });
}

function getClosestCardOffset(track, direction) {
  const visibleCards = getVisibleCards(track);

  if (!visibleCards.length) {
    return track.scrollLeft;
  }

  const trackRect = track.getBoundingClientRect();
  const currentLeft = track.scrollLeft;
  const cardPositions = visibleCards.map((card) => {
    const rect = card.getBoundingClientRect();
    const left = Math.round(currentLeft + (rect.left - trackRect.left));
    return {
      left,
      distance: left - currentLeft,
    };
  });

  const candidateCards = cardPositions.filter((card) => (direction > 0 ? card.distance > 12 : card.distance < -12));

  if (!candidateCards.length) {
    return direction > 0
      ? Math.max(0, track.scrollWidth - track.clientWidth)
      : 0;
  }

  const nextCard = direction > 0
    ? candidateCards.reduce((closest, card) => (card.distance < closest.distance ? card : closest))
    : candidateCards.reduce((closest, card) => (card.distance > closest.distance ? card : closest));

  return nextCard.left;
}

function scrollTrackTo(track, left, behavior = prefersReducedMotion ? "auto" : "smooth") {
  const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
  const clampedLeft = Math.max(0, Math.min(left, maxScrollLeft));

  if (behavior === "auto") {
    track.scrollLeft = clampedLeft;
    return;
  }

  track.scrollTo({ left: clampedLeft, behavior });

  window.setTimeout(() => {
    if (Math.abs(track.scrollLeft - clampedLeft) > 4) {
      track.scrollLeft = clampedLeft;
    }
  }, 420);
}

function syncCarouselState(carousel, track) {
  window.requestAnimationFrame(() => updateCarouselButtons(carousel, track));
}

carousels.forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");

  if (!track) return;

  const syncButtons = () => syncCarouselState(carousel, track);
  let dragStartX = 0;
  let dragStartScroll = 0;
  let isDragging = false;

  carousel.querySelectorAll(".carousel__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-dir") || "1");
      const targetLeft = getClosestCardOffset(track, dir);
      const fallbackAmount = getCarouselStep(track);
      const nextLeft = Math.abs(targetLeft - track.scrollLeft) > 8
        ? targetLeft
        : track.scrollLeft + (dir * fallbackAmount);

      scrollTrackTo(track, nextLeft);
    });
  });

  track.addEventListener("scroll", syncButtons, { passive: true });
  window.addEventListener("resize", syncButtons);
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(syncButtons);
    resizeObserver.observe(track);
  }

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    isDragging = true;
    dragStartX = event.clientX;
    dragStartScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const delta = event.clientX - dragStartX;
    track.scrollLeft = dragStartScroll - delta;
  });

  const stopDragging = (event) => {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
    syncButtons();
  };

  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);
  track.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      stopDragging(event);
    }
  });

  syncButtons();
});

// ---- Tabs filter (inventory) ----
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll("#invTrack .vehicleCard");

function applyInventoryFilter(tab) {
  if (!tab) return;

  tabs.forEach((item) => {
    item.classList.remove("is-active");
    item.setAttribute("aria-selected", "false");
    item.tabIndex = -1;
  });

  tab.classList.add("is-active");
  tab.setAttribute("aria-selected", "true");
  tab.tabIndex = 0;

  const key = (tab.getAttribute("data-tab") || "all").toLowerCase();
  cards.forEach((card) => {
    const tokens = (card.getAttribute("data-type") || "")
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const show = key === "all" || tokens.includes(key);
    card.hidden = !show;
  });

  const track = document.getElementById("invTrack");
  if (!track) return;

  scrollTrackTo(track, 0, "auto");
  const carousel = track.closest("[data-carousel]");
  if (!carousel) return;

  syncCarouselState(carousel, track);
  window.requestAnimationFrame(() => syncCarouselState(carousel, track));
}

tabs.forEach((tab, index) => {
  tab.tabIndex = index === 0 ? 0 : -1;
  tab.addEventListener("click", () => applyInventoryFilter(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const tabList = Array.from(tabs);
    const currentIndex = tabList.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabList.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabList.length - 1;

    tabList[nextIndex].focus();
    applyInventoryFilter(tabList[nextIndex]);
  });
});

// ---- Prefill interest from buttons ----
const interest = document.getElementById("interest");
const vehicleField = document.getElementById("vehicleField");
document.querySelectorAll("[data-prefill]").forEach((el) => {
  el.addEventListener("click", () => {
    const val = el.getAttribute("data-prefill") || "General enquiry";
    if (interest) interest.value = val;
    if (vehicleField && vehicleField.value.trim() === "") vehicleField.value = val;
  });
});

// ---- Form -> WhatsApp + Email ----
const form = document.getElementById("quoteForm");
const emailBtn = document.getElementById("emailBtn");

function buildMessage(fd) {
  const msg =
`Fair Automobile enquiry
------------------------
Interest: ${fd.get("interest") || "General"}
Name: ${fd.get("name") || ""}
Phone: ${fd.get("phone") || ""}
Looking for: ${fd.get("vehicle") || ""}
Notes: ${fd.get("notes") || ""}

Sent from: Landing Page`;
  return msg;
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const message = encodeURIComponent(buildMessage(fd));
  const url = `https://wa.me/23052577027?text=${message}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

emailBtn?.addEventListener("click", () => {
  const fd = new FormData(form);
  const subject = encodeURIComponent(`Fair Automobile Enquiry — ${fd.get("interest") || "General"}`);
  const body = encodeURIComponent(buildMessage(fd));
  window.location.href = `mailto:sales@fairauto.net?subject=${subject}&body=${body}`;
});
