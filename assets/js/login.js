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
                alertify.error("Something went wrong...");
            }
        }
    });
    $("#login").click(function() {
        try {
            login(email.val(), pass.val());
        } catch (error) {
            console.error(error);
            alertify.error("Something went wrong...");
        }
    });
}
