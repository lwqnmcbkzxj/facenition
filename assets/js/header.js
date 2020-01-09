alertify.set("notifier", "position", "top-right");
$(document).ready(function() {
    $("#footer").load("/static/footer.html");
    $("#header").load("/static/header.html", function() {
        var element = $(".nav__items");
        if (isLoggedIn()) {
            element.append(
                "<a href='/dashboard' class='button button-nav'>Dashboard</a>" +
                    "<div class='user'>" +
                        "<i class='far fa-user'></i>" +
                        "<ul class='dropmenu'>" +
                            "<li class='drop__items'>" +
                                "<a class='link-user' href='/dashboard/settings.html'>Account settings</a>" +
                                "<a class='link-user' href='#' id='logout'>Log out</a>" +
                            "</li>" +
                        "</ul>" +
                    "</div>"
            );
        } else {
            element.append(
                '<a href="/register.html" class="button button-nav">Register</a>' +
                    '<a href="/login.html" class="button button-nav">Login</a>'
            );
        }
        var overlay = $(".b-overlay");
        var b_menu = $(".b-menu");
        $(".burger").click(function() {
            overlay.addClass("active");
            b_menu.addClass("active");
        });

        overlay.add($(".b-menu-close")).click(function() {
            overlay.removeClass("active");
            b_menu.removeClass("active");
        });

        var user = $(".user");
        var drop = $(".dropmenu");
        user.click(function(e) {
            e.stopPropagation();
            drop.toggleClass("show");
        });

        $(document.body).click(function(e) {
            drop.removeClass("show");
        });

        $("#logout").click(function(e) {
            e.preventDefault();
            logout();
            window.location.href = "/login.html";
        });
    });
});
