$(document).ready(function() {
    var token = getUrlParameter("t");
    request("VERIFY_EMAIL", { params: token }, function(r) {
        var message;
        if (!r.success) {
            message = alertify.error(r.msg);
        } else {
            message = alertify.success(r.msg);
        }
        message.callback = function() {
            window.location.replace("/login.html");
        };
    });
});
