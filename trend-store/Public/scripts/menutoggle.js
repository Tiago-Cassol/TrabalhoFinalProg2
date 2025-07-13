$(document).ready(function () {
  const $menu = $("#MenuItems");

  $menu.css("max-height", "0px");

  $(".menu-icon").on("click", function () {
    const currentHeight = $menu.css("max-height");

    if (currentHeight === "0px") {
      $menu.css("max-height", "200px");
    } else {
      $menu.css("max-height", "0px");
    }
  });
});