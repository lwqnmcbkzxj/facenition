function PasswordResetInit() {
    var token = getUrlParameter("t");
    var inputs = $("#register-page input");
    inputs.map(function(i, e) {
        $(e).val("");
    });
    var pass = $("#password-reset-page input[name='password']");
    var confirm = $("#password-reset-page input[name='confirm']");
    var reset = $("#password-reset-page #reset");
    reset.unbind("click");
    reset.click(function(e) {
        if (pass.val() === confirm.val()) {
            var isVaild = validatePassword(pass.val());
            if (isVaild === true) {
                request(
                    "PASSWORD_RESET_TOKEN",
                    {
                        params: token,
                        password: pass.val()
                    },
                    function(r) {
                        if (!r.success) {
                            alertify.error(r.msg);
                            return;
                        } else {
                            alertify.success(r.msg).callback = function() {
                                loadPage("/login");
                            };
                        }
                    }
                );
            } else {
                alertify.error(isVaild);
            }
        } else {
            alertify.error("Passwords don't match");
        }
    });
}
