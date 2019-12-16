<?php
return array(
    "~\/api\/v1\/verify\/([a-zA-Z0-9-]+)~" => "users/verifyUser",
    "~\/api\/v1\/password-reset\/([a-zA-Z0-9-]+)~"=>"users/resetPasswordByToken"
);