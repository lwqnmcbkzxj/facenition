var config = {};

var ui = {};

var headerType = { type: "login" };

// Загрузка контента по странице
function loadPage(p) {
    var page = p;
    if (p.charAt(0) === "/") {
        page = p.substr(1);
    }
    var url = "/static/" + page + ".html",
        pageTitle = config.pages[page].title;
    var h = config.pages[page].header;

    $.get(url, function(html) {
        document.title = pageTitle + " | " + config.siteTitle;
        ui.$content.html(html);
    });

    if (h !== headerType.type) {
        headerType.type = h;
        if (h) {
            $.get("/static/dashboard-header.html", function(html) {
                ui.$header.html(html);
                setActiveNav();
            });
            $.get("/static/dashboard-footer.html", function(html) {
                ui.$footer.html(html);
            });
        } else {
            $.get("/static/header.html", function(html) {
                ui.$header.html(html);
            });
            $.get("/static/footer.html", function(html) {
                ui.$footer.html(html);
            });
        }
    }
    if (h) {
        setActiveNav();
    }

    function setActiveNav() {
        var url = page.split("/");
        var u = url[url.length - 1];
        u = u.replace(".html", "");
        u = u.charAt(0).toUpperCase() + u.slice(1);
        $(".navbar-item").map(function(i, e) {
            $(e).removeClass("active");
        });
        var navbarItem = $(".navbar-item:contains(" + u + ")");
        navbarItem.addClass("active");
    }

    history.pushState({ page: p }, "", p);
}

// Клик по ссылке

// Кнопки Назад/Вперед
function popState(e) {
    var page = (e.state && e.state.page) || config.mainPage;
    loadPage(page);
}

// Привязка событий
function bindHandlers() {
    ui.$body.on("click", 'a[data-link="ajax"]', navigate);
    window.onpopstate = popState;
}

// Старт приложения: привязка событий
function start() {
    bindHandlers();
}

// Инициализация приложения: загрузка конфига и старт
function init() {
    $.getJSON("/data/config.json", function(data) {
        config = data;
        start();
        loadPage(window.location.pathname);
    });
}

function navigate(e) {
    e.stopPropagation();
    e.preventDefault();
    var page = $(e.target).attr("href");
    loadPage(e.currentTarget.pathname);
}

// Запуск приложения
$(document).ready(function() {
    init();
    ui = {
        $body: $(document.body),
        $content: $("#c"),
        $header: $("#header"),
        $footer: $("#footer")
    };
});
