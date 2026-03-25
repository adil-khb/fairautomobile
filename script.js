// ---- Reveal on scroll (Toyota-like fade between sections) ----
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("is-visible");
    });
  },
  { threshold: 0.12 }
);
reveals.forEach((el) => io.observe(el));

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
document.querySelectorAll("[data-carousel]").forEach((c) => {
  const track = c.querySelector(".carousel__track");
  c.querySelectorAll(".carousel__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = Number(btn.getAttribute("data-dir") || "1");
      const amount = Math.max(280, Math.round(track.clientWidth * 0.85));
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    });
  });
});

// ---- Tabs filter (inventory) ----
const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".vehicleCard");
tabs.forEach((t) => {
  t.addEventListener("click", () => {
    tabs.forEach((x) => x.classList.remove("is-active"));
    t.classList.add("is-active");

    const key = t.getAttribute("data-tab");
    cards.forEach((card) => {
      const type = (card.getAttribute("data-type") || "").toLowerCase();
      const show = key === "all" ? true : type.includes(key);
      card.style.display = show ? "" : "none";
    });

    // reset scroll
    const track = document.getElementById("invTrack");
    if (track) track.scrollTo({ left: 0, behavior: "smooth" });
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