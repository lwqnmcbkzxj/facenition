function VerifyEmailInit() {
    var token = getUrlParameter("t");
    request("VERIFY_EMAIL", { params: token }, function (r) {
        var message;
        console.log(r)
        if (!r.success) {
            showAlert(r.msg, 'error');
        } else {
            showAlert(r.msg, 'success');
        }
        loadPage("/login");
    });
}
