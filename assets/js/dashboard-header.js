function DashboardHeaderInit() {
    var burger = $("#dashboard-header .navbar-toggler");
    var body = $(document.body);
    var sidebar = $("#dashboard-header .sidebar");
    burger.click(function(e) {
        e.stopPropagation();
        body.toggleClass("nav-opened");
    });

    var user = $("#dashboard-header .user");
    var drop = $("#dashboard-header .dropmenu");
    user.click(function(e) {
        e.stopPropagation();
        drop.toggleClass("show");
    });

    $("#dashboard-header #logout").click(function(e) {
        e.preventDefault();
        logout();
        loadPage("/login")
    });

    var toggler = $("#dashboard-header .nav-toggler");

    toggler.click(function() {
        body.toggleClass("user-opened");
    });

    body.click(function(e) {
        if (e.target !== sidebar[0]) {
            body.removeClass("nav-opened");
            drop.removeClass("show");
        }
    });
}
