<?php
function showLogo() {
    $name = dirname(__FILE__).'/primary-logo.png';
    $fp = fopen($name, 'rb');
    header("Content-Type: image/png");
    header("Content-Length: " . filesize($name));
    fpassthru($fp);
}