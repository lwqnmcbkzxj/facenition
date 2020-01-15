function VerifyEmailInit() {
    var token = getUrlParameter("t");
    request("VERIFY_EMAIL", { params: token }, function(r) {
        var message;
        console.log(r)
        if (!r.success) {
            message = showAlert(r.msg, 'error');
            // message = alertify.error(r.msg);
        } else {
            message = showAlert(r.msg, 'success');
            // message = alertify.success(r.msg);
        }
        // message.callback = function() {
            loadPage("/login");
        // };
    });
}
