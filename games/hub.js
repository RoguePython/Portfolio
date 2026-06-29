/** Load portfolio section background the same way as the main site. */
(function () {
  const section = document.querySelector(".Portfolio");
  if (!section) return;

  const img = new Image();
  img.src = "../assets/images/html1.png";
  img.onload = function () {
    section.classList.add("bg-loaded");
  };
})();
