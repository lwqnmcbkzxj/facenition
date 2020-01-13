function ForgotPasswordInit() {
    var mail = $("#forgot-password-page input[name='email']");
    mail.val("");
}

function bindForgotPassword() {
    var mail = $("#forgot-password-page input[name='email']");
    $("#forgot-password-page #reset").click(function(e) {
        request("PASSWORD_RESET", { email: mail.val() }, function(result) {
            if (!result.success) {
                alertify.error(result.msg);
                return;
            }
            alertify.success(result.msg);
        });
    });
}
