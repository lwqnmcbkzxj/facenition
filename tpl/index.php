<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title><?php echo $pageTitle . ' | ' . $siteTitle ?></title>
    <link href="https://use.fontawesome.com/releases/v5.0.6/css/all.css" rel="stylesheet" />
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/alertifyjs@1.13.1/build/css/alertify.min.css" />
    <script src="//cdn.jsdelivr.net/npm/alertifyjs@1.13.1/build/alertify.min.js"></script>
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="stylesheet" href="/assets/css/general.css">
    <link rel="stylesheet"
        href=<?php echo ($header == true) ? "/assets/css/dashboard.css" : "/assets/css/landing.css"?>>
    <script type="text/javascript" src="/assets/js/chart.bundle.min.js"></script>
    <script type="text/javascript" src="/assets/js/jquery.min.js"></script>
    <script type="text/javascript" src="/assets/js/service.js"></script>
    <script type="text/javascript" src="/assets/js/main.js"></script>
</head>

<body>
    <div class="content">
        <div id="header"><?php echo $headerContent ?></div>
        <div id="c"><?php echo $content ?></div>
        <div id="footer"><?php echo $footerContent ?></div>
    </div>
</body>

</html>