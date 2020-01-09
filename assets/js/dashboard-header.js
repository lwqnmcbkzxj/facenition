$(document).ready(function() {
    $("#footer").load("/static/dashborad-footer.html");
    $("#header").load("/static/dashboard-header.html", function() {
        var burger = $(".navbar-toggler");
        var body = $(document.body);
        var sidebar = $(".sidebar");
        burger.click(function(e) {
            e.stopPropagation();
            body.toggleClass("nav-opened");
        });

        var user = $(".user");
        var drop = $(".dropmenu");
        user.click(function(e) {
            e.stopPropagation();
            drop.toggleClass("show");
        });

        var url = window.location.pathname.split("/");
        var page = url[url.length - 1];
        page = page.replace(".html", "");
        page = page.charAt(0).toUpperCase() + page.slice(1);
        var navbarItem = $(".navbar-item:contains(" + page + ")");
        navbarItem.addClass("active");

        $("#logout").click(function(e) {
            e.preventDefault();
            logout();
            window.location.href = "/login.html";
        });

        var toggler = $(".nav-toggler");

        toggler.click(function() {
            body.toggleClass("user-opened");
        });

        body.click(function(e) {
            if (e.target !== sidebar[0]) {
                body.removeClass("nav-opened");
                drop.removeClass("show");
            }
        });
    });
});
