function LoginInit() {
    var email = $('#login-page input[name="email"]');
    var pass = $('#login-page input[name="password"]');
    email.val("");
    pass.val("");
}

function bindLogin() {
    var email = $('#login-page input[name="email"]');
    var pass = $('#login-page input[name="password"]');
    email.add(pass).on("keypress", function(e) {
        if (e.which == 13) {
            try {
                login(email.val(), pass.val());
            } catch (error) {
                console.error(error);
                showAlert('Something went wrong...', 'error');
            }
        }
    });
    $("#login").click(function() {
        try {
            login(email.val(), pass.val());
        } catch (error) {
            console.error(error);
            showAlert('Something went wrong...', 'error');
        }
    });
}

function ForgotPasswordInit() {
    var mail = $("#forgot-password-page input[name='email']");
    mail.val("");
}

function bindForgotPassword() {
    var mail = $("#forgot-password-page input[name='email']");
    $("#forgot-password-page #reset").click(function(e) {
        request("PASSWORD_RESET", { email: mail.val() }, function(result) {
            if (!result.success) {               
                showAlert(result.msg, 'error');
                return;
            } else 
                showAlert(result.msg, 'success');            
        });
    });
}

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
                    function (r) {
                        if (!r.success) {
                            showAlert(r, 'error');                            
                            return;
                        } else {
                            showAlert(r.msg, 'success');
                            loadPage("/login");                           
                        }
                    }
                );
            } else {
                showAlert(isVaild, 'error')                
            }
        } else {
            showAlert("Passwords don't match",'error')
        }
    });
}

function RegisterInit() {
    var inputs = $('#register-page input');
    inputs.map(function(i, e) {
        $(e).val("")
    })
}
function bindRegister() {
    var email = $('#register-page input[name="email"]');
    var emailValid = email.next("#register-page .content-error");
    var pass = $('#register-page input[name="password"]');
    var passValid = pass.next("#register-page .content-error");
    var confirm = $('#register-page input[name="confirm"]');
    var confirmValid = confirm.next("#register-page .content-error");

    email.on("input", function(e) {
        var valid = validateEmail(email.val());
        if (valid !== true) {
            emailValid.text(valid);
        } else {
            emailValid.text("");
        }
    });

    pass.on("input", function(e) {
        var valid = validatePassword(pass.val());
        if (valid !== true) {
            passValid.text(valid);
        } else {
            passValid.text("");
        }
    });

    confirm.on("input", function(e) {
        if (confirm.val() !== pass.val()) {
            confirmValid.text("Passwords do not match!");
        } else {
            confirmValid.text("");
        }
    });

    email.add(pass).on("keypress", function(e) {
        if (e.which == 13) {
            registrate();
        }
    });

    $("#register-page #register").click(function() {
        var e = email.val();
        var p = pass.val();
        var c = confirm.val();
        if (isValid(e, p, c)) {
            request(
                "REGISTER",
                { email: e, password: p, plan: "FREELANCER" },
                function(result) {
                    loadPage("/login")
                    if (!result.success) {
                        console.log(result)
                        showAlert(result.msg, 'error');
                        return;
                    } else {
                        showAlert('Please check your email', 'success');
                    }
                }
            );
        }
    });

    function isValid(email, pass, confirm) {
        var isValid =
            validateEmail(email) === true &&
            validatePassword(pass) === true &&
            confirm === pass;
        return isValid;
    }
}

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