<?php

// Получаем базовый url
function getRootUrl() {
    $protocol = ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443)
        ? "https://"
        : "http://";
    $domain = $_SERVER['SERVER_NAME'];
    return $protocol . $domain . '/';
}

// Получаем массив страниц из конфига
function getPages() {
    $jsonString = file_get_contents(__DIR__ . '/data/config.json');
    $config = json_decode($jsonString, true);
    return $config['pages'];
}

// Возвращает для сайтмапа нужные данные
function getSitemapData($dateString) {
    // Ищем разницу дат в днях
    $diffDate = date_diff(date_create(), date_create($dateString));
    $diff = $diffDate->days;

    // Определяем остальные данные
    if ($diff <= 1) {
        $changefreq = 'daily';
        $priority = 1;
    } else if ($diff <= 7) {
        $changefreq = 'weekly';
        $priority = 0.75;
    } else {
        $changefreq = 'monthly';
        $priority = 0.5;
    }
    return array(
        'lastmod' => $dateString,
        'changefreq' => $changefreq,
        'priority' => $priority
    );
}

// Отдаем правильный заголовок
header('Content-type: text/xml');

// Создаем xml-документ
$xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" />');

$pages = getPages();
$rootUrl = getRootUrl();

// Перебираем все страницы сайта
foreach($pages as $key => $page) {
    if (!empty($page['inSitemap'])) {
        $url = $xml->addChild('url');
        $data = getSitemapData($page['updated']);

        $url->addChild('loc', $rootUrl . $key);
        $url->addChild('lastmod', $data['lastmod']);
        $url->addChild('changefreq', $data['changefreq']);
        $url->addChild('priority', $data['priority']);
    }
}

// Создаем dom-элемент
$dom = new DomDocument();
$dom->loadXML($xml->asXML());
$dom->formatOutput = true;

// Выводим отформатированную xml-строку
echo $dom->saveXML();
