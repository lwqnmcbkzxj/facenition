function HeaderInit() {
    var element = $("#header .nav__items");
    element.empty();
    if (isLoggedIn()) {
        element.append(
            "<a href='/dashboard/monitors' data-link='ajax' class='button button-nav'>Dashboard</a>" +
                "<div class='user'>" +
                "<i class='far fa-user'></i>" +
                "<ul class='dropmenu'>" +
                "<li class='drop__items'>" +
                "<a class='link-user' href='#' data-link='ajax' id='acc_set'>Account settings</a>" +
                "<a class='link-user' href='#' id='logout'>Log out</a>" +
                "</li>" +
                "</ul>" +
                "</div>"
        );
        var user = $("#header .user");
        var drop = $("#header .dropmenu");
        user.click(function(e) {
            e.stopPropagation();
            drop.toggleClass("show");
        });

        $(document.body).click(function(e) {
            drop.removeClass("show");
        });

        $("#header #acc_set").click(function(e) {
            e.preventDefault();
            loadPage("/dashboard/settings");
        })
        $("#header #logout").click(function(e) {
            e.preventDefault();
            logout();
            loadPage("/login");
        });
    } else {
        element.append(
            '<a href="register" data-link="ajax" class="button button-nav">Register</a>' +
                '<a href="login" data-link="ajax" class="button button-nav">Login</a>'
        );
    }
}
console.log("object")
function bindHeader() {
    var overlay = $("#header .b-overlay");
    var b_menu = $("#header .b-menu");
    $("#header .burger").click(function() {
        overlay.addClass("active");
        b_menu.addClass("active");
    });

    overlay.add($("#header .b-menu-close")).click(function() {
        overlay.removeClass("active");
        b_menu.removeClass("active");
    });
}
