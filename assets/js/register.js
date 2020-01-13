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
                        alertify.error(result.msg);

                        return;
                    } else {
                        alertify.success("Please check your email");
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
