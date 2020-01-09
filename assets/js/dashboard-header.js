$(document).ready(function() {
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

   

    $("#logout").click(function(e) {
        e.preventDefault();
        logout();
        window.location.replace("/login");
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
