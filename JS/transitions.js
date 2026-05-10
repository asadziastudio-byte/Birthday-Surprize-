(function () {
  document.addEventListener("click", function (e) {
    let target = e.target;
    while (target && target.tagName !== "A") target = target.parentElement;
    if (!target) return;

    const href = target.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto") || href.startsWith("tel") || target.getAttribute("target") === "_blank") return;

    e.preventDefault();
    document.body.classList.add("fade-out");
    setTimeout(() => { window.location.href = href; }, 400);
  });
})();