function LoginInit() {
    var email = $('input[name="email"]');
    var pass = $('input[name="password"]');
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
