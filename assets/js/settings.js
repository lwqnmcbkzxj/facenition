function bindSettings() {
    var body = $(document.body);
    var reset = $("#settings-page #reset-pwd");
    var updateCard = $("#settings-page #upd-card");
    var modal = $("#settings-page .modal");
    var title = $("#settings-page .modal .modal-title");
    var content = $("#settings-page .modal .modal-body");
    var footer = $("#settings-page .modal .modal-footer");
    var close = $("#settings-page .modal .modal-close");
    modal.hide();

    modal.click(function(e) {
        e.stopPropagation();
    });

    reset.click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        title.html("Reset Password");
        content.html(
            "Are you sure you wish to submit a password reset request? This will notify you via email with a reset token."
        );
        footer.html(
            '<button class="btn-secondary btn-cancel">Cancel</button>' +
                '<button class="btn-primary btn-sumbit" id="reset-pass">Reset Password</button>'
        );

        var cancel = $("#settings-page .modal .btn-cancel");
        var reset = $("#settings-page .modal #reset-pass");
        cancel.click(function(e) {
            e.stopPropagation();
            modal.fadeOut();
        });

        reset.click(function(e) {
            e.stopPropagation();
        });
        modal.fadeIn();
    });

    updateCard.click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        title.html("Change / Add Card");
        content.html(
            '<div class="modal-section modal-section-1"> <div class="modal-item-1"> <label for="f-name"> First name <span>*</span> </label> <input id="f-name" type="text" class="form-control" placeholder="Enter your first name" /> </div> <div class="modal-item-2"> <label for="l-name"> Last name <span>*</span> </label> <input id="l-name" type="text" class="form-control" placeholder="Enter your last name" /> </div> </div> <div class="modal-section modal-section-2"> <label for="c-number"> Card number <span>*</span> </label> <input id="c-number" inputmode="numeric" autocorrect="false" autocomplete="cc-number" type="text" class="form-control" placeholder="1234 1234 1234 1234" /> </div> <div class="modal-section modal-section-3"> <div class="modal-item-1"> <label for="cvc"> Card CVC <span>*</span> </label> <input id="cvc" type="text" class="form-control" placeholder="CVC" inputmode="numeric" autocomplete="cc-csc" /> </div> <div class="modal-item-2"> <label for="c-exp"> Card Expiry <span>*</span> </label> <input id="c-exp" type="text" class="form-control" placeholder="MM / YY" autocomplete="cc-exp" spellcheck="false" /> </div> </div>'
        );
        footer.html(
            '<button class="btn-secondary btn-cancel">Cancel</button>' +
                '<button class="btn-primary btn-sumbit" id="update-card">Update</button>'
        );

        var cnum = $("#settings-page #c-number");
        var cvc = $("#settings-page #cvc");
        var cexp = $("#settings-page #c-exp");
        cvc.formance("format_credit_card_cvc");
        cnum.formance("format_credit_card_number");
        cexp.formance("format_credit_card_expiry");
        cnum.on("input", function() {
            var isvalid = cnum.formance("validate_credit_card_number");
            if (cnum.val().length === 19) {
                if (!isvalid) {
                    cnum.css({ color: "red" });
                }
            } else {
                cnum.css({ color: "#222a42" });
            }
        });

        var cancel = $("#settings-page .modal .btn-cancel");
        cancel.click(function(e) {
            e.stopPropagation();
            modal.fadeOut();
        });
        modal.fadeIn();
    });

    body.click(function(e) {
        modal.fadeOut();
    });

    close.click(function(e) {
        e.stopPropagation();
        modal.fadeOut();
    });
}

function SettingsInit() {
    var modal = $("#settings-page .modal");
    modal.hide();
    var mail = $("#settings-page #billing-email");
    var email = $("#settings-page #email");
    var cardInput = $("#settings-page #billing-card-details");
    cardInput.val("No card set");
    mail.val("");
    email.val("");
    mail.val(getCookie("mail"));
    email.val(getCookie("mail"));
    request("GET_CARD", {}, function(r) {
        if (!r.success) {
            alertify.error(r.msg);
            return;
        }
        var card = r.data;
        cardInput.val(
            card.brand +
                " **** " +
                card.last4 +
                " exp. " +
                card.exp_month +
                "/" +
                card.exp_year
        );
    });
}
