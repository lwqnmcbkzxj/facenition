var pagesMap = {};
var urlIdMap = {};
var $pages;
var $headers;
var $footers;
var $header;
var $footer;
var $dashboardHeader;
var $dashboardFooter;

function loadPage(pageName) {
    var pName = pageName.substr(1); //remove first /
    if (includes(pName, "?")) {
        pName = pName.split("?")[0];
    }
    $pages.hide();
    $headers.hide();
    $footers.hide();
    if (includes(pageName, "dashboard")) {
        $dashboardHeader.show();
        $dashboardFooter.show();
        DashboardHeaderInit();
    } else {
        $header.show();
        $footer.show();
        HeaderInit();
    }
    var currentPage = $("#" + urlIdMap[pName]);
    currentPage.show();
    pagesMap[pName]();
    history.pushState({ page: pageName }, "", pageName);
}

function popState(e) {
    var page = (e.state && e.state.page) || config.mainPage;
    loadPage(page);
}

function bindHandlers() {
    $(document.body).on("click", 'a[data-link="ajax"]', navigate);
    window.onpopstate = popState;
}

function start() {
    bindHandlers();
}

function init() {
    $header = $("#header");
    $footer = $("#footer");
    $dashboardHeader = $("#dashboard-header");
    $dashboardFooter = $("#dashboard-footer");
    $pages = $("div[data-page=true]");
    $headers = $("div[data-header=true]");
    $footers = $("div[data-footer=true]");
    pagesMap = {
        login: LoginInit,
        register: RegisterInit,
        "forgot-password": ForgotPasswordInit,
        "verify-email": VerifyEmailInit,
        "password-reset": PasswordResetInit,
        "dashboard/monitors": MonitorsInit,
        "dashboard/settings": SettingsInit
    };

    urlIdMap = {
        login: "login-page",
        register: "register-page",
        "forgot-password": "forgot-password-page",
        "verify-email": "verify-email-page",
        "password-reset": "password-reset-page",
        "dashboard/monitors": "monitors-page",
        "dashboard/settings": "settings-page"
    };
    
    loadPage(window.location.pathname + window.location.search);
    start();
}

function navigate(e) {
    e.stopPropagation();
    e.preventDefault();
    loadPage(e.currentTarget.pathname);
}

$(document).ready(function() {
    init();
});
