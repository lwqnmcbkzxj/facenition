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
        // DashboardHeaderInit();
    } else {
        $header.show();
        HeaderInit();
    }
    if (pName == '') {
        pageName = 'login';
        pName = 'login';
    }
    var currentPage = $("#" + urlIdMap[pName]);
    currentPage.show();
    pagesMap[pName]();

    if (includes(pageName, "dashboard")) {
        $dashboardFooter.show();
    } else {
        $footer.show();
    }
    history.pushState({ page: pageName }, "", pageName);
}

function popState(e) {
    var page = (e.state && e.state.page) || config.mainPage;
    loadPage(page);
}

function bindLinks() {
    $(document.body).on("click", 'a[data-link="ajax"]', navigate);
    window.onpopstate = popState;
}

function bindActions() {
    bindHeader();
    bindLogin();
    bindRegister();
    bindSettings();
    bindForgotPassword();
    bindDashboardHeader();
    bindMonitorsView();
    bindAnalytics();
}

function start() {
    bindLinks();
    bindActions();
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
        "dashboard/settings": SettingsInit,
        "dashboard/analytics": AnalytsicsInit,
        "dashboard/monitors/view": MonitorsViewInit
    };

    urlIdMap = {
        login: "login-page",
        register: "register-page",
        "forgot-password": "forgot-password-page",
        "verify-email": "verify-email-page",
        "password-reset": "password-reset-page",
        "dashboard/monitors": "monitors-page",
        "dashboard/settings": "settings-page",
        "dashboard/analytics": "analytics-page",
        "dashboard/monitors/view": "view-page"
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
