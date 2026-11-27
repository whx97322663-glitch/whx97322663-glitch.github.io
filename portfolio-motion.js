const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const runningAnimations = new Map();

function enter(element, delay = 0) {
  if (motionPreference.matches || !element.animate) return;
  runningAnimations.get(element)?.cancel();
  const animation = element.animate(
    [{ opacity: .55, transform: "translateY(9px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 320, delay, easing: "cubic-bezier(.2,.75,.3,1)", fill: "backwards" }
  );
  runningAnimations.set(element, animation);
  function forgetAnimation() {
    if (runningAnimations.get(element) === animation) runningAnimations.delete(element);
  }
  animation.onfinish = forgetAnimation;
  animation.oncancel = forgetAnimation;
}

if ("IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      reveal.unobserve(entry.target);
      enter(entry.target);
    }
  }, { threshold: .15 });

  document.querySelectorAll(".profile-copy, .case-plate, .editorial-heading, .practice-spreads .project-card")
    .forEach(element => reveal.observe(element));
}

const projectGrid = document.querySelector("#project-grid");
projectGrid?.addEventListener("portfolio:filtered", () => {
  let delay = 0;
  for (const card of projectGrid.querySelectorAll("[data-project]:not([hidden])")) {
    const rect = card.getBoundingClientRect();
    if (rect.top >= innerHeight || rect.bottom <= 0) continue;
    enter(card, delay);
    delay = Math.min(100, delay + 35);
  }
});

for (const link of document.querySelectorAll(".practice-card .project-link")) {
  const cover = link.querySelector(".card-image");

  function resetTilt() {
    link.classList.remove("is-tracking");
    for (const property of ["--practice-x", "--practice-y", "--light-x", "--light-y"]) {
      link.style.removeProperty(property);
    }
  }

  link.addEventListener("pointermove", event => {
    if (!finePointer.matches || motionPreference.matches || event.pointerType !== "mouse") return;
    // The link stays flat, keeping its hit area stable as the cover tilts.
    const rect = link.getBoundingClientRect();
    const x = (event.clientX - rect.left - cover.offsetLeft) / cover.offsetWidth;
    const y = (event.clientY - rect.top - cover.offsetTop) / cover.offsetHeight;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      resetTilt();
      return;
    }
    link.style.setProperty("--practice-x", `${(1 - 2 * y) * 5}deg`);
    link.style.setProperty("--practice-y", `${(2 * x - 1) * 5}deg`);
    link.style.setProperty("--light-x", `${x * 100}%`);
    link.style.setProperty("--light-y", `${y * 100}%`);
    link.classList.add("is-tracking");
  }, { passive: true });
  link.addEventListener("pointerleave", resetTilt);
  motionPreference.addEventListener("change", resetTilt);
}

motionPreference.addEventListener("change", () => {
  if (!motionPreference.matches) return;
  for (const animation of runningAnimations.values()) animation.cancel();
  runningAnimations.clear();
});
