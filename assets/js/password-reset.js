$(document).ready(function() {
    var token = getUrlParameter("t");
    var pass = $("input[name='password']");
    var confirm = $("input[name='confirm']");
    var reset = $("#reset");
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
                                loadPage("login");
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
});
