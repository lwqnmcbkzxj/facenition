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

    modal.click(function (e) {
        e.stopPropagation();
    });

    reset.click(function (e) {
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
        cancel.click(function (e) {
            e.stopPropagation();
            modal.fadeOut();
        });

        reset.click(function (e) {
            e.stopPropagation();
            var email = $("#settings-page #email");
            $.when(               
                $.ajax(request('PASSWORD_RESET', { email: email.val() }, function (r1) { }, true)),
            ).done(function (r1) {               
                if (!r1.success) {
                    showAlert(r1.msg, 'error');
                    return;
                } else {
                    showAlert(r1.msg, 'success');
                    modal.fadeOut();
                }
            });          

        });
        modal.fadeIn();
    });

    updateCard.click(function (e) {
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

        var firstName = $("#settings-page #f-name");
        var lastName = $("#settings-page #l-name");
        var cnum = $("#settings-page #c-number");
        var cvc = $("#settings-page #cvc");
        var cexp = $("#settings-page #c-exp");
        
        checkFormat(cnum, 'validate_credit_card_number');
      
        
        cnum.on("input", function () {
            var isvalid = checkFormat(cnum, 'validate_credit_card_number');
            if (cnum.val().length === 19) {
                if (!isvalid) {
                    cnum.css({ color: "red" });
                }
                else {
                    cnum.css({ color: "#222a42" });
                }
            }
        });

        var cancel = $("#settings-page .modal .btn-cancel");
        cancel.click(function (e) {
            e.stopPropagation();
            modal.fadeOut();
        });
        

        var submitUpdate = $("#settings-page .modal .btn-sumbit");
        submitUpdate.click(function (e) {
            e.stopPropagation();            
            if (firstName.val() == '' || lastName.val() == '' || cnum.val() == '' || cvc.val() == '' || cexp.val() == '') {
                showAlert('Empty fields', 'error');
                return 0;
            }
            var id = '???';
            
               
               $.when(               
                    $.ajax(request("UPDATE_CARD", { tokenId: id, }, function (r1) { }, true)),
                ).done(function (r1) {               
                    if (!r1.success) {
                        showAlert('Failed to update card', 'error');
                        return;
                    } else {
                        showAlert('Card updated', 'success');
                    }
                });           
           
           

            modal.fadeOut();
        });
       



        modal.fadeIn();
    });

    body.click(function (e) {
        modal.fadeOut();
    });

    close.click(function (e) {
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
    request("GET_CARD", {}, function (r) {
        if (!r.success) {
            showAlert(r.msg, 'error');            
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