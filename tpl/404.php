<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://use.fontawesome.com/releases/v5.0.6/css/all.css" rel="stylesheet" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title><?php echo 'Страница не существует | ' . $siteTitle ?></title>
    <link rel="stylesheet" href="/assets/css/general.css" />
    <link rel="stylesheet" href="/assets/css/landing.css" />
    <script type="text/javascript" src="/assets/js/jquery.min.js"></script>
    <script type="text/javascript" src="/assets/js/service.js"></script>
    <script type="text/javascript" src="/assets/js/main.js"></script>
</head>
<body>
    <div class="content">
        <div id="header"><?php echo file_get_contents(__DIR__ . './../static/header.html') ?></div>
        <div id="c" class="notfound">
<img src="/assets/img/not_found.svg" >
</div>
        <div id="footer"><?php echo file_get_contents(__DIR__ . './../static/footer.html') ?></div>
    </div>
</body>
</html>