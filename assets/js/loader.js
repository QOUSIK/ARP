document.addEventListener("DOMContentLoaded", () => {
  const loader = document.querySelector(".loader");
  const content = document.querySelector(".content");

  if (!loader || !content) return;

  // Проверяем, был ли уже показан лоадер в этой сессии
  const loaderShown = sessionStorage.getItem("loaderShown");

  if (!loaderShown) {
    // Первый визит — проигрываем лоадер
    setTimeout(() => {
      loader.classList.add("fade-out");
      setTimeout(() => {
        loader.style.display = "none";
        content.style.opacity = "1";
        // Отмечаем, что лоадер уже показывался
        sessionStorage.setItem("loaderShown", "true");
      }, 1500);
    }, 3500);
  } else {
    // Лоадер уже был — сразу показываем контент
    loader.style.display = "none";
    content.style.opacity = "1";
  }
});
