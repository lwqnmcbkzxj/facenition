$(document).ready(function() {
    var mail = $("input[name='email']");
    $("#reset").click(function(e) {
        request("PASSWORD_RESET", { email: mail.val() }, function(result) {
            if (!result.success) {
                    alertify.error(result.msg);
                return;
            }
            alertify.success(result.msg);
        });
    });
});
