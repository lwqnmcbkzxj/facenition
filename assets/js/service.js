var api_routes = {
    LOGIN: {
        path: "/login",
        method: "POST",
        secure: false
    },
    REGISTER: {
        path: "/register",
        method: "POST",
        secure: false
    },
    PASSWORD_RESET: {
        path: "/password-reset",
        method: "POST",
        secure: false
    },
    PASSWORD_RESET_TOKEN: {
        path: "/password-reset",
        method: "POST",
        secure: false,
        params: true
    },
    GET_MONITORS: {
        path: "/monitors",
        secure: true,
        method: "GET"
    },
    GET_MONITOR: {
        path: "/monitors",
        secure: true,
        method: "GET",
        params: true
    },
    CREATE_MONITOR: {
        path: "/monitors",
        secure: true,
        method: "POST"
    },
    GET_MONITOR_THUMBNAIL: {
        path: "/monitors/thumbnail",
        params: true,
        secure: true,
        method: "GET"
    },
    SET_MONITOR_THUMBNAIL: {
        path: "/monitors/thumbnail",
        params: true,
        secure: true,
        method: "POST"
    },
    INSERT_TRAFFIC_ENTRY: {
        path: "/traffic",
        method: "POST",
        query: true,
        secure: true
    },
    GET_TRAFFIC_ENTRIES: {
        path: "/traffic",
        method: "GET",
        query: true,
        secure: true
    },
    GET_TRAFFIC_ENTRIES_V2: {
        path: "/traffic",
        version: "v2",
        method: "GET",
        query: true,
        secure: true
    },
    GET_IMPRESSION_ENTRIES_V2: {
        path: "/impression",
        version: "v2",
        method: "GET",
        query: true,
        secure: true
    },
    GET_GENDER_ENTRIES_V2: {
        path: "/gender",
        version: "v2",
        method: "GET",
        query: true,
        secure: true
    },
    GET_TRAFFIC_BY_DAYS: {
        path: "/traffic/days",
        secure: true,
        query: true,
        method: "GET"
    },
    GET_TRAFFIC_ENTRIES_ALL: {
        path: "/traffic/all",
        secure: true,
        query: true,
        method: "GET"
    },
    GET_IMPRESSION_ENTRIES_ALL: {
        path: "/impression/all",
        secure: true,
        query: true,
        method: "GET"
    },
    GET_GENDER_ENTRIES_ALL: {
        path: "/gender/all",
        secure: true,
        query: true,
        method: "GET"
    },
    GET_GENDER_ENTRIES_ALL_V2: {
        version: "v2",
        path: "/gender/all",
        secure: true,
        query: true,
        method: "GET"
    },
    GET_TRAFFIC_TOTAL: {
        method: "GET",
        path: "/traffic/total",
        query: true,
        secure: true
    },
    GET_IMPRESSIONS_TOTAL: {
        method: "GET",
        path: "/impression/total",
        query: true,
        secure: true
    },
    GET_GENDERS_TOTAL: {
        method: "GET",
        path: "/gender/total",
        query: true,
        secure: true
    },
    BULK_INSERT_TRAFFIC: {
        path: "/traffic/bulk",
        secure: true,
        method: "POST"
    },
    GET_UPCOMING_INVOICE: {
        path: "/account/invoice",
        secure: true,
        method: "GET"
    },
    ACTIVATE_MONITOR: {
        path: "/account/usage/start",
        query: true,
        method: "POST",
        secure: true
    },
    UPDATE_MONITOR: {
        path: "/account/usage/update",
        query: true,
        secure: true,
        method: "PUT"
    },
    UPDATE_PLAN: {
        path: "/account/subscription",
        method: "PUT",
        secure: true
    },
    CANCEL_SUBSCRIPTION: {
        path: "/account/subscription",
        method: "DELETE",
        secure: true
    },
    GET_PLAN: {
        path: "/account/subscription",
        method: "GET",
        secure: true
    },
    GET_GENDER_ENTRIES: {
        path: "/gender",
        method: "GET",
        query: true,
        secure: true
    },
    GET_IMPRESSION_ENTRIES: {
        path: "/impression",
        method: "GET",
        query: true,
        secure: true
    },
    GET_MONITOR_DAILY_COUNTS: {
        path: "/monitors/daily",
        method: "GET",
        params: true,
        secure: true
    },
    UPDATE_CARD: {
        path: "/account/card",
        method: "POST",
        secure: true
    },
    GET_CARD: {
        path: "/account/card",
        method: "GET",
        secure: true
    },
    VERIFY_EMAIL: {
        path: "/verify",
        method: "GET",
        params: true
    },
    CREATE_MONITOR_SEGMENT: {
        path: "/monitors/segments",
        params: true,
        method: "POST",
        secure: true
    },
    GET_MONITOR_SEGMENTS: {
        path: "/monitors/segments",
        params: true,
        secure: true,
        method: "GET"
    },
    DELETE_MONITOR_SEGMENT: {
        path: "/monitors/segments",
        params: true,
        secure: true,
        method: "DELETE"
    },
    MONITOR_TOGGLE: {
        path: "/monitors/toggle",
        params: true,
        secure: true,
        method: "GET"
    }
};

// var API = "http://facenition.dig-studio.ru/api/";
var API = "https://app.facenition.com/api/";

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function logout() {
    setCookie("auth_token", "", 0);
}

function isLoggedIn() {
    return getCookie("auth_token");
}

function request(key, body, cb, o) {
    var r = api_routes[key];
    if (!r) {
        console.log(
            "Invalid URL key",
            key,
            "must be one of",
            Object.keys(api_routes)
        );
        return;
    }
    var headers = {};
    if (r.secure) {
        var token = getCookie("auth_token");
        if (!token) {
            loadPage("/login");
            // window.location.href = "/login";
            return;
        }
        headers["Authorization"] = "Bearer " + token;
    }
    var version = r.version ? r.version : "v1";
    var url = API + version + r.path;
    if (r.query) {
        if (!body.query) return cb("No query specified");
        url += "?" + body.query;
        delete body.query;
    }
    if (r.params) {
        if (!body.params) return cb("No params specified");
        url += "/" + body.params;
        delete body.params;
    }
    headers["Content-Type"] = "application/json";
    var payload = {
        method: r.method,
        headers: headers
    };
    if (r.method !== "GET") payload.body = JSON.stringify(body);
    var options = {
        url: url,
        type: r.method,
        data: payload.body,
        statusCode: {
            401: function () {
                loadPage("/login");
                // window.location.href = "/login";
                return;
            }
        },
        headers: headers,
        success: cb,
        error: function (e) {
            cb(e.responseJSON);
        }
    };
    if (o) {
        return options;
    }
    $.ajax(options);
}

function login(email, password) {
    request("LOGIN", { password: password, email: email }, function (result) {
        if (!result.success) {
            showAlert(result.msg, 'error');
            return;
        }
        var week = new Date();
        week.setDate(week.getDate() + 7);
        setCookie("auth_token", result.token, week);
        setCookie("mail", email.toLowerCase(), week);
        // window.location.replace("/dashboard/monitors");
        loadPage("/dashboard/monitors")
    });
}

function validateEmail(email) {
    if (!/.+@.+\..+/.test(email)) {
        return "Invalid email address!";
    }

    return true;
}

function validatePassword(password) {
    if (!/(?=.{8,})/.test(password))
        return "Password must be at least 8 characters long";
    if (!/(?=.*[0-9])/.test(password))
        return "Password must contain at least one number";
    if (!/(?=.*[a-z])/.test(password))
        return "Password needs to contain at least 1 lowercase letter";
    if (!/(?=.*[A-Z])/.test(password))
        return "Password needs to contain at least 1 uppercase letter";

    return true;
}

function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split("&"),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split("=");

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined
                ? true
                : decodeURIComponent(sParameterName[1]);
        }
    }
}

function includes(container, value) {
    var returnValue = false;
    var pos = container.indexOf(value);
    if (pos >= 0) {
        returnValue = true;
    }
    return returnValue;
}

var chart1_2_options = {
    maintainAspectRatio: false,
    legend: {
        display: false
    },
    tooltips: {
        backgroundColor: "#f5f5f5",
        titleFontColor: "#333",
        bodyFontColor: "#666",
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest"
    },
    responsive: true,
    scales: {
        yAxes: [
            {
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: "rgba(29,140,248,0.0)",
                    zeroLineColor: "transparent"
                },
                ticks: {
                    suggestedMin: 60,
                    suggestedMax: 125,
                    padding: 20,
                    fontColor: "#9a9a9a"
                }
            }
        ],
        xAxes: [
            {
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: "rgba(29,140,248,0.1)",
                    zeroLineColor: "transparent"
                },
                ticks: {
                    padding: 20,
                    fontColor: "#9a9a9a"
                }
            }
        ]
    }
};

// chartExample1 and chartExample2 options
var chart1_2_options = {
    maintainAspectRatio: false,
    legend: {
        display: false
    },
    tooltips: {
        backgroundColor: "#f5f5f5",
        titleFontColor: "#333",
        bodyFontColor: "#666",
        bodySpacing: 4,
        xPadding: 12,
        mode: "nearest",
        intersect: 0,
        position: "nearest"
    },
    responsive: true,
    scales: {
        yAxes: [
            {
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: "rgba(29,140,248,0.0)",
                    zeroLineColor: "transparent"
                },
                ticks: {
                    suggestedMin: 60,
                    suggestedMax: 125,
                    padding: 20,
                    fontColor: "#9a9a9a"
                }
            }
        ],
        xAxes: [
            {
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: "rgba(29,140,248,0.1)",
                    zeroLineColor: "transparent"
                },
                ticks: {
                    padding: 20,
                    fontColor: "#9a9a9a"
                }
            }
        ]
    }
};

// #########################################
// // // used inside src/views/Dashboard.jsx
// #########################################
var chartExample1 = {
    data1: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
        gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
        gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

        return {
            labels: [
                "JAN",
                "FEB",
                "MAR",
                "APR",
                "MAY",
                "JUN",
                "JUL",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC"
            ],
            datasets: [
                {
                    label: "My First dataset",
                    fill: true,
                    backgroundColor: gradientStroke,
                    borderColor: "#1f8ef1",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    pointBackgroundColor: "#1f8ef1",
                    pointBorderColor: "rgba(255,255,255,0)",
                    pointHoverBackgroundColor: "#1f8ef1",
                    pointBorderWidth: 20,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 15,
                    pointRadius: 4,
                    data: [100, 70, 90, 70, 85, 60, 75, 60, 90, 80, 110, 100]
                }
            ]
        };
    },
    data2: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
        gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
        gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

        return {
            labels: [
                "JAN",
                "FEB",
                "MAR",
                "APR",
                "MAY",
                "JUN",
                "JUL",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC"
            ],
            datasets: [
                {
                    label: "My First dataset",
                    fill: true,
                    backgroundColor: gradientStroke,
                    borderColor: "#1f8ef1",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    pointBackgroundColor: "#1f8ef1",
                    pointBorderColor: "rgba(255,255,255,0)",
                    pointHoverBackgroundColor: "#1f8ef1",
                    pointBorderWidth: 20,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 15,
                    pointRadius: 4,
                    data: [80, 120, 105, 110, 95, 105, 90, 100, 80, 95, 70, 120]
                }
            ]
        };
    },
    data3: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
        gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
        gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

        return {
            labels: [
                "JAN",
                "FEB",
                "MAR",
                "APR",
                "MAY",
                "JUN",
                "JUL",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC"
            ],
            datasets: [
                {
                    label: "My First dataset",
                    fill: true,
                    backgroundColor: gradientStroke,
                    borderColor: "#1f8ef1",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    pointBackgroundColor: "#1f8ef1",
                    pointBorderColor: "rgba(255,255,255,0)",
                    pointHoverBackgroundColor: "#1f8ef1",
                    pointBorderWidth: 20,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 15,
                    pointRadius: 4,
                    data: [60, 80, 65, 130, 80, 105, 90, 130, 70, 115, 60, 130]
                }
            ]
        };
    },
    options: chart1_2_options
};

// #########################################
// // // used inside src/views/Dashboard.jsx
// #########################################
var chartExample2 = {
    data: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(29,140,248,0.2)");
        gradientStroke.addColorStop(0.4, "rgba(29,140,248,0.0)");
        gradientStroke.addColorStop(0, "rgba(29,140,248,0)"); //blue colors

        return {
            labels: ["JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
            datasets: [
                {
                    label: "Data",
                    fill: true,
                    backgroundColor: gradientStroke,
                    borderColor: "#1f8ef1",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    pointBackgroundColor: "#1f8ef1",
                    pointBorderColor: "rgba(255,255,255,0)",
                    pointHoverBackgroundColor: "#1f8ef1",
                    pointBorderWidth: 20,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 15,
                    pointRadius: 4,
                    data: [80, 100, 70, 80, 120, 80]
                }
            ]
        };
    },
    options: chart1_2_options
};

// #########################################
// // // used inside src/views/Dashboard.jsx
// #########################################
var chartExample3 = {
    data: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(72,72,176,0.1)");
        gradientStroke.addColorStop(0.4, "rgba(72,72,176,0.0)");
        gradientStroke.addColorStop(0, "rgba(119,52,169,0)"); //purple colors

        return {
            labels: ["USA", "GER", "AUS", "UK", "RO", "BR"],
            datasets: [
                {
                    label: "Countries",
                    fill: true,
                    backgroundColor: gradientStroke,
                    hoverBackgroundColor: gradientStroke,
                    borderColor: "#d048b6",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    data: [53, 20, 10, 80, 100, 45]
                }
            ]
        };
    },
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        tooltips: {
            backgroundColor: "#f5f5f5",
            titleFontColor: "#333",
            bodyFontColor: "#666",
            bodySpacing: 4,
            xPadding: 12,
            mode: "nearest",
            intersect: 0,
            position: "nearest"
        },
        responsive: true,
        scales: {
            yAxes: [
                {
                    gridLines: {
                        drawBorder: false,
                        color: "rgba(225,78,202,0.1)",
                        zeroLineColor: "transparent"
                    },
                    ticks: {
                        suggestedMin: 60,
                        suggestedMax: 120,
                        padding: 20,
                        fontColor: "#9e9e9e"
                    }
                }
            ],
            xAxes: [
                {
                    gridLines: {
                        drawBorder: false,
                        color: "rgba(225,78,202,0.1)",
                        zeroLineColor: "transparent"
                    },
                    ticks: {
                        padding: 20,
                        fontColor: "#9e9e9e"
                    }
                }
            ]
        }
    }
};

// #########################################
// // // used inside src/views/Dashboard.jsx
// #########################################
var chartExample4 = {
    data: function (canvas) {
        var ctx = canvas.getContext("2d");

        var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);

        gradientStroke.addColorStop(1, "rgba(66,134,121,0.15)");
        gradientStroke.addColorStop(0.4, "rgba(66,134,121,0.0)"); //green colors
        gradientStroke.addColorStop(0, "rgba(66,134,121,0)"); //green colors

        return {
            labels: ["JUL", "AUG", "SEP", "OCT", "NOV"],
            datasets: [
                {
                    label: "My First dataset",
                    fill: true,
                    backgroundColor: gradientStroke,
                    borderColor: "#00d6b4",
                    borderWidth: 2,
                    borderDash: [],
                    borderDashOffset: 0.0,
                    pointBackgroundColor: "#00d6b4",
                    pointBorderColor: "rgba(255,255,255,0)",
                    pointHoverBackgroundColor: "#00d6b4",
                    pointBorderWidth: 20,
                    pointHoverRadius: 4,
                    pointHoverBorderWidth: 15,
                    pointRadius: 4,
                    data: [90, 27, 60, 12, 80]
                }
            ]
        };
    },
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },

        tooltips: {
            backgroundColor: "#f5f5f5",
            titleFontColor: "#333",
            bodyFontColor: "#666",
            bodySpacing: 4,
            xPadding: 12,
            mode: "nearest",
            intersect: 0,
            position: "nearest"
        },
        responsive: true,
        scales: {
            yAxes: [
                {
                    barPercentage: 1.6,
                    gridLines: {
                        drawBorder: false,
                        color: "rgba(29,140,248,0.0)",
                        zeroLineColor: "transparent"
                    },
                    ticks: {
                        suggestedMin: 50,
                        suggestedMax: 125,
                        padding: 20,
                        fontColor: "#9e9e9e"
                    }
                }
            ],

            xAxes: [
                {
                    barPercentage: 1.6,
                    gridLines: {
                        drawBorder: false,
                        color: "rgba(0,242,195,0.1)",
                        zeroLineColor: "transparent"
                    },
                    ticks: {
                        padding: 20,
                        fontColor: "#9e9e9e"
                    }
                }
            ]
        }
    }
};


function showAlert(text, type) {
	var alertBlock = document.querySelector('.alert-block');
	var alert = document.createElement('div');

	alert.classList.add('visible');
	alert.classList.add('message');
	$(alert).animate({'right': '300px'}, 300);

	alert.textContent = text;
	switch (type) {
		case 'success':
		alert.classList.add('success');
		break;
		case 'error':
		alert.classList.add('error');
		break;
		case 'warning':
		alert.classList.add('warning');
		break;
		default:			
		break;
	}
	alertBlock.append(alert);
	setTimeout(function() {
		$(alert).animate({'right': '-320px'}, 600);
		setTimeout(function() {
			alert.classList.remove('visible');
			alert.classList.remove('message');		
			alert.remove()
		}, 1000);
		
	}, 5000);

	alert.addEventListener('click', () => {
		$(alert).animate({'right': '-320px'}, 600);
		setTimeout(function() {
			alert.classList.remove('visible');
			alert.classList.remove('message');		
			alert.remove()
		}, 1000);
	});
}


function checkFormat(input, type) {
    var value = input.val().replace(/\s/g, ''); //Deleting spaces

    switch (type) {
        case 'validate_credit_card_number':
            var regExp = /(\d{4}([-]|)\d{4}([-]|)\d{4}([-]|)\d{4})/g;
            if (regExp.test(value)) {
               
                input.css({ color: "#222a42" });
                return true;
            } else {
                input.css({ color: "red" });

                return false;
            }            
    
        default:
            break;
    } 
    return true;
}

function getSum(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function getObjectTotalSum(dataObject) {
    var totalSum = {
        traffic: 0,
        impression: 0,
        male: 0,
        female: 0,
    }

    for (elem of dataObject) {
        totalSum.traffic += getSum(elem.trafficData);
        totalSum.impression += getSum(elem.impressionData);
        totalSum.male += getSum(elem.maleData);
        totalSum.female += getSum(elem.femaleData);
    }
    return totalSum;
}

function numberWithCommas(number) {
    numberStr = number.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(numberStr))
    	numberStr = numberStr.replace(pattern, "$1,$2");
    return numberStr;
}

function ucFirst(str) {
    if (!str) return str;  
    return str[0].toUpperCase() + str.slice(1);
}


function getDayStartTimestamp(timestamp) {
    var date = new Date(timestamp);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date.getTime();
}

function getDayEndTimestamp(timestamp) {
    var date = new Date(timestamp);
    date.setHours(23);
    date.setMinutes(59);
    date.setSeconds(59);
    date.setMilliseconds(999);
    return date.getTime();
}


function dateToTimestamp(date, phase) {
    var fullDate = (new Date(date));
    if (phase === 'start') {
        fullDate = getDayStartTimestamp(fullDate.getTime())
    }
    else if (phase === 'end') {
        fullDate = getDayEndTimestamp(fullDate.getTime())
    } else {        
        return fullDate.getTime();
    }

    return fullDate;
}

function dateForInput(date) {
    var stringDate = date.getFullYear();
    stringDate += '-' + (('0' + (date.getMonth() + 1)).slice(-2));
    stringDate += '-' + date.getDate();
    return stringDate;
}


function getExactPeriodLabels(period, n) {
    var labels = [];

    var formatString = '';
    var additionalFormat = '';
   
    var cur = moment().startOf(period);
    var cur1 = moment().startOf(period);  
    

    switch (period) {
        case 'hour':
            formatString = 'ddd h a';
            additionalFormat = 'h a';
            break;
        case 'day':
            formatString = 'ddd DD/MM';
            break;
        case 'week':
            cur = moment().startOf('isoWeek');
            cur1 = moment().startOf('isoWeek');
            formatString = 'DD/MM';
            additionalFormat = 'DD/MM';
            break;
        case 'fortnight':
            //Moment.js not includes function for fortnight(2 weeks)
            cur = moment().startOf('isoWeek');
            cur1 = moment().startOf('isoWeek');

            cur1.add(2, 'week');
            formatString = 'DD/MM';
            additionalFormat = 'DD/MM';
            break;
        case 'month':
            formatString = 'MM/Y';
            additionalFormat = '';
            break;
        case 'year':
            formatString = 'Y';
            break;

        default:
            formatString = 'ddd DD/MM';
            break;
    }
    cur1.add(1, period);
    while (n > 0) {
        var date = cur.format(formatString);
        if (period == 'hour' || period == 'week') {
            var additionalDate = cur1.format(additionalFormat);
            labels.push(date + ' - ' + additionalDate);
            cur1.subtract(1, period);
        }
        else if (period == 'fortnight') {
            var additionalDate = cur1.format(additionalFormat);
            labels.push(date + ' - ' + additionalDate);
            cur1.subtract(2, 'week');
            cur.subtract(2, 'week');
        }
        else {
            labels.push(date);
        }

        cur.subtract(1, period);
        n--;
    }
    return labels.reverse();
}

function timestampToDate(ts) {
    var d = new Date();
    d.setTime(ts);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}


function getMonitor(id) {
    return $.ajax(request("GET_MONITOR", { params: id }, function (r) {
        if (!r.success) {
            showAlert('Failed to load monitors', 'error');
            return;
        }
    }, true));
}

function getMonitors() {
    return $.ajax(request("GET_MONITORS", {}, function (r) {
        if (!r.success) {
            showAlert('Failed to load monitors', 'error');
            return;
        }
    }, true));
}

function getDataOfMonitor(entriesType, query) {
    return $.when(
        $.ajax(request("GET_" + entriesType.toUpperCase() + "_ENTRIES_V2", { query }, function (r) { }, true)),
    ).done(function (r) {
        if (!r.success) {
            showAlert('Failed to load info', 'error');
            return;
        }
    });
}


function getSegments(id) {
    return $.ajax(request("GET_MONITOR_SEGMENTS", { params: id }, function (r) {
        if (!r.success) {
            showAlert('Failed to load segments', 'error');
            return;
        }
    }, true));
}