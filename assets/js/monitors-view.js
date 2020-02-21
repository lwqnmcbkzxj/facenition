function MonitorsViewInit() {
    var body = $("#view-page");
    var infoCard = $("#view-page .main .card:nth-child(1) ");
    var modal = $("#view-page .modal-dialog");
    var main = $("#view-page .main");

    var loader = "<div class='loader'></div>";
    var id = getCookie("view_token");
    var monitor = null;

    modal.hide();
    main.hide();
    body.append(loader);

    (function () {
        $.when(
            $.ajax(request("GET_MONITOR", { params: id }, function (r) { }, true)),
            $.ajax(request("GET_MONITOR_THUMBNAIL", { params: id }, function (r) { }, true)),
            $.ajax(request("GET_MONITOR_SEGMENTS", { params: id }, function (r) { }, true)),

        ).done(function (r1, r2, r3) {
            if (!r1[0].success) {
                showAlert('Failed to load monitor', 'error');
                return;
            }
            if (!r2[0].success) {
                showAlert('Failed to load thumbnail', 'error');
                return;
            }

            $(".loader").remove();
            main.show();

            monitor = r1[0].data;
            showSegments(monitor.id);

            var img = r2[0].data;
            var isCheckBoxActive = monitor.active ? 'checked' : 'none';
            infoCard.empty();
            infoCard.append(
                "<div class = 'card-body'>" +
                "<div><img src='data:image/jpg;base64," + img + "' alt = 'Preview'/></div>" +
                "<div>" +
                "<h1>" + monitor.name + "</h1>" +
                "<div class = 'slider-container'>" +
                "<label class= 'slider-label' > ENABLED</label >" +
                "<label class='switch'>" +
                "<input data-id='" + monitor.id + "' style='-webkit-appearance:checkbox;' type='checkbox'" + isCheckBoxActive + ">" +
                "<span class='slider round'></span>" +
                "</label>" +
                "</div > " +
                "</div>" +
                "<div><button class='btn add-segment'>Add Segment</button></div>" +
                "</div > "
            );


            if (monitor.active)
                $('#view-page .options-block .live-button')[0].classList.add('active');
            else
                $('#view-page .options-block .live-button')[0].classList.remove('active');

            var toggleMonitorBtn = $('#view-page .switch input');
            toggleMonitorBtn.click(function (e) {
                monitorToggle(e.target.dataset.id);
                $('#view-page .options-block .live-button')[0].classList.toggle('active');
            });
            var addSegmentBtn = $('#view-page .add-segment');
            addSegmentBtn.click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                showModal();
            });
            addOptionsBlock(r3[0].data);
            getChartData(id);
        });
    })();
}

function bindMonitorsView() {
    var body = $(document.body);
    var modal = $("#view-page .modal");
    var close = $('#view-page .modal-close');

    modal.hide();

    modal.click(function (e) {
        e.stopPropagation();
    });

    body.click(function (e) {
        modal.fadeOut();
    });

    close.click(function (e) {
        e.stopPropagation();
        modal.fadeOut();
    });
}

// Get data start
var graphsRefreshInterval;
function getChartData(id) {
    clearInterval(graphsRefreshInterval);
    graphsRefreshInterval = setInterval(function () {
        getChartData(id)
    }, 15000);

    var displayType = $('#view-page .display-dropdown input')[0].value.toLowerCase();
    if (displayType == 'custom')
        getCustomData(id);
    else
        getSegmentsData(id);
}

function getCustomData(id) {
    var period = $('#view-page .period-dropdown .dropdown-input')[0].value.toLowerCase();
    var start = dateToTimestamp($('#view-page #startInput')[0].value, 'start');
    var end = dateToTimestamp($('#view-page #endInput')[0].value, 'end');


    var query = `monitor_id=${id}&start=${start}&end=${end}&period=${period}`;

    var btnBody = $('#view-page .options-block .button-holder');
    var btnMain = $('#view-page .options-block .refresh-btn');
    var loader = "<div class='loader'></div>";

    btnMain.hide();
    btnBody.append(loader);

    $.when(
        $.ajax(request("GET_TRAFFIC_ENTRIES_V2", { query }, function (r) { }, true)),
        $.ajax(request("GET_IMPRESSION_ENTRIES_V2", { query }, function (r) { }, true)),
        $.ajax(request("GET_GENDER_ENTRIES_V2", { query }, function (r) { }, true))

    ).done(function (r1, r2, r3) {
        if (!r1[0].success || !r2[0].success || !r3[0].success) {
            showAlert('Failed to load info', 'error');
            return;
        }

        btnMain.show();
        $('.loader').remove();
        trafficResult = r1[0].data;
        impressionResult = r2[0].data;
        genderResult = r3[0].data;

        var labels = [];
        var trafficData = [];
        var postitveData = [];
        var negativeData = [];
        var maleData = [];
        var femaleData = [];

        var n = Math.ceil((end - start) / 86400000);
        n = getPeriodSegments(n, period);


        var labels = getExactPeriodLabels(period, n);
        for (var i = 0; i < n; i++) {
            trafficData.push(0);
            postitveData.push(0);
            negativeData.push(0);
            maleData.push(0);
            femaleData.push(0);
        }

        if (trafficResult.length !== 0 && impressionResult !== null && genderResult !== null) {
            var periodTime = getPeriodTime(period);
            var pos = 0;
            var startPeriod = +trafficResult[0].period;
            while (startPeriod - start > periodTime) {
                startPeriod -= periodTime;
                pos++;
            }


            for (var i = pos, j = 0; i < n, j < trafficResult.length; i++ , j++) {
                trafficData[i] = +trafficResult[j].count;
            }
            for (var i = pos, j = 0; i < n, j < impressionResult.length; i++ , j++) {
                postitveData[i] = +impressionResult[j].positive;
                negativeData[i] = +impressionResult[j].negative;
            }
            for (var i = pos, j = 0; i < n, j < genderResult.length; i++ , j++) {
                maleData[i] = +genderResult[j].males;
                femaleData[i] = +genderResult[j].females;
            }
        }

        var chartData = { labels, trafficData, postitveData, negativeData, maleData, femaleData }
        renderCustomChart(chartData);

        $('#view-page .chart-selector div').unbind('click');
        $('#view-page .chart-selector div').click(function (e) {
            var selectorBlock = $('#view-page .chart-selector');
            for (selector of selectorBlock[0].children) {
                if (e.target == selector)
                    selector.classList.add('active');
                else
                    selector.classList.remove('active');
            }
            renderCustomChart(chartData);
        });
    });
}

function getSegmentsData(id) {
    var btnBody = $('#view-page .options-block .button-holder');
    var btnMain = $('#view-page .options-block .refresh-btn');
    var loader = "<div class='loader'></div>";
    btnMain.hide();
    btnBody.append(loader);

    var period = $('#view-page .period-dropdown .dropdown-input')[0].value.toLowerCase();
    var sChildren = $('#view-page .segment-dropdown .dropdown-visible .variants')[0].children;

    var segments = [];
    for (var i = 0; i < sChildren.length - 1; i++) {
        segments.push({ start: sChildren[i].dataset.start, end: sChildren[i].dataset.end, name: sChildren[i].textContent });
    }
    segments.reverse();
    var queries = [];
    for (segment of segments) {
        queries.push(`monitor_id=${id}&start=${segment.start}&end=${segment.end}&period=${period}`);
    }

    var chartDataObject = [];
    var maxLength = 0;
    var segmentsStart = segments[0].start;
    var segmentsEnd = segments[0].end;

    for (let segment of segments) {
        if (+segment.start < +segmentsStart)
            segmentsStart = segment.start;
        if (+segment.end > +segmentsEnd)
            segmentsEnd = segment.end;
    }
    var maxLength = getSegmentsLength(+segmentsStart, +segmentsEnd, period);
    
    $.when.apply(
        $, [].concat(
            getRequestsArr('traffic', queries),
            getRequestsArr('impression', queries),
            getRequestsArr('gender', queries)),
    ).done(function () {
        var result = arguments;
        btnMain.show();
        $('.loader').remove();


        for (var i = segments.length - 1; i >= 0; i--) {
            var trafficResult = [];
            var impressionResult = [];
            var genderResult = [];

            var trafficData = [];
            var postitveData = [];
            var negativeData = [];
            var maleData = [];
            var femaleData = [];


            for (var j = 1; j <= 3; j++) {
                var position = (j * segments.length) - (segments.length - i);
                if (result[0].data !== null) {
                    if (j === 1)
                        trafficResult.push(result[position][0].data);
                    else if (j === 2)
                        impressionResult.push(result[position][0].data);
                    else if (j === 3)
                        genderResult.push(result[position][0].data);
                }
            }


            trafficResult = trafficResult[0];
            impressionResult = impressionResult[0];
            genderResult = genderResult[0];
            var segmentStart = +trafficResult[0].period;
            
            if (trafficResult !== null && impressionResult !== null && genderResult !== null) {
                // var n = Math.max(trafficResult.length, impressionResult.length, genderResult.length)
                for (var j = 0; j < maxLength; j++) {
                    trafficData.push(0);
                    postitveData.push(0);
                    negativeData.push(0);
                    maleData.push(0);
                    femaleData.push(0);
                }

                var periodTime = getPeriodTime(period);
                var k = 0;
                while (+trafficResult[0].period - (+segmentsStart + (periodTime* k))  > periodTime)
                    k++;
                for (var j = 0; j < trafficResult.length; k++, j++) {
                    trafficData[k] = +trafficResult[j].count;
                }
                    
                k = 0;
                while (+trafficResult[0].period - (+segmentsStart + (periodTime* k))  > periodTime)
                    k++;
                for (var j = 0; j < impressionResult.length; k++, j++) {
                    postitveData[k] = +impressionResult[j].positive;
                    negativeData[k] = +impressionResult[j].negative;
                }

                k = 0;
                while (+trafficResult[0].period - (+segmentsStart + (periodTime* k))  > periodTime)
                    k++;
                for (var j = 0; j < genderResult.length; k++, j++) {
                    maleData[k] = +genderResult[j].males;
                    femaleData[k] = +genderResult[j].females;
                }
            }
            chartDataObject.push({
                name: segments[i].name.trim(),
                result: { trafficData, postitveData, negativeData, maleData, femaleData },
            });
        }
        
        chartDataObject['labels'] = getSegmentsLabels(+segmentsEnd, period, maxLength);
        renderSegmentsChart(chartDataObject);

        $('#view-page .chart-selector div').unbind('click');
        $('#view-page .chart-selector div').click(function (e) {
            var selectorBlock = $('#view-page .chart-selector');
            for (selector of selectorBlock[0].children) {
                if (e.target == selector)
                    selector.classList.add('active');
                else
                    selector.classList.remove('active');
            }
            renderSegmentsChart(chartDataObject);
        });
    });

}
// Get data end

// Render charts start
function renderCustomChart(chartData) {
    var labels = chartData.labels;
    var trafficData = chartData.trafficData;
    var postitveData = chartData.postitveData;
    var negativeData = chartData.negativeData;
    var maleData = chartData.maleData;
    var femaleData = chartData.femaleData;

    showViewPageStats(chartData);
    var chart = null;
    $("#view-page .main .chart-area").show();

    if ($('#view-page canvas')[0]) {
        $('#view-page canvas')[0].remove();
        $('#view-page .chartjs-size-monitor').remove()
    }
    var body = $('#view-page .card:nth-child(2) .chart-area');
    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#view-page canvas")[0];
    var ctx = canvas.getContext("2d");

    var activePage = $('#view-page .chart-block .chart-selector .active').text();

    var datasets = null;
    var options = null;
    switch (activePage) {
        case 'Pedestrians':
            datasets = [{
                label: 'Pedestrians',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: trafficData
            }];
            break;
        case 'Views':
            datasets = [{
                label: 'Viewed',
                backgroundColor: 'rgba(99, 177, 255,0.2)',
                borderColor: 'rgba(99, 177, 255,1)',
                borderWidth: 1,
                stack: 0,
                hoverBackgroundColor: 'rgba(99, 177, 255,0.4)',
                hoverBorderColor: 'rgba(99, 177, 255,1)',
                data: postitveData
            }, {
                label: 'Not viewed',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                stack: 0,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: negativeData
            }];
            break;
        case 'Gender':
            datasets = [{
                label: 'Male',
                backgroundColor: 'rgba(99, 177, 255,0.2)',
                borderColor: 'rgba(99, 177, 255,1)',
                borderWidth: 1,
                stack: 0,
                hoverBackgroundColor: 'rgba(99, 177, 255,0.4)',
                hoverBorderColor: 'rgba(99, 177, 255,1)',
                data: maleData
            }, {
                label: 'Female',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                stack: 0,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: femaleData
            }];
        default:
            break;
    }

    var options = {
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0
                }
            }]
        }
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets,
        },
        options: options
    });
}
function renderSegmentsChart(chartData) {
    $("#view-page .main .chart-area").show();
    showViewPageStats(chartData);

    if ($('#view-page canvas')[0]) {
        $('#view-page canvas')[0].remove();
        $('#view-page .chartjs-size-monitor').remove()
    }
    var body = $('#view-page .card:nth-child(2) .chart-area');
    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#view-page canvas")[0];
    var ctx = canvas.getContext("2d");

    var activePage = $('#view-page .chart-block .chart-selector .active').text();


    var chart = null;
    var datasets = [];
    var colors = [
        'rgb(57,64,73)', 'rgb(57,64,73, .7)',
        'rgb(44,109,187)', 'rgb(44,109,187, .7)',
        'rgb(100,94,203)', 'rgb(100,94,203, .7)',
        'rgb(143,76,197)', 'rgb(143,76,197, 0.7)',
        'rgb(185,39,178)', 'rgb(185,39,178, .7)',
        'rgb(191,55,116)', 'rgb(191,55,116, .7)',
        'rgb(191,64,57)', 'rgb(191,64,57, .7)'];
    var i = 0;
    var stack = 0;
    for (segment of chartData) {
        switch (activePage) {
            case 'Pedestrians':
                datasets.push({
                    label: segment.name,
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    borderWidth: 1,
                    stack: stack,

                    data: segment.result.trafficData
                })
                break;
            case 'Views':
                datasets.push({
                    label: segment.name + ' - Positive',
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    borderWidth: 1,
                    stack: stack,
                    data: segment.result.postitveData
                },
                    {
                        label: segment.name + ' - Negative',
                        backgroundColor: colors[i + 1],
                        borderColor: colors[i + 1],
                        borderWidth: 1,
                        stack: stack,
                        data: segment.result.negativeData
                    });
                break;
            case 'Gender':
                datasets.push({
                    label: segment.name + ' - Male',
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    borderWidth: 1,
                    stack: stack,
                    data: segment.result.maleData
                }, {
                    label: segment.name + ' - Female',
                    backgroundColor: colors[i + 1],
                    borderColor: colors[i + 1],
                    borderWidth: 1,
                    stack: stack,
                    data: segment.result.femaleData
                });
            default:
                break;
        }
        i += 2;
        stack++;
    }

    var options = {
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0
                }
            }]
        }
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: datasets,
        },
        options: options
    });

}
// Render charts end

function showModal() {
    var modal = $("#view-page .modal");
    var title = $("#view-page .modal .modal-title");
    var content = $("#view-page .modal .modal-body");
    var footer = $("#view-page .modal .modal-footer");

    var stringDate = moment().format('YYYY-MM-DD');

    title.html("Create segment");
    content.html(
        '<form class=""> <div class="position-relative form-group"><label for="segment_name" class="">Name</label><input id="segment_name" name="segment_name" type="text" class="form-control"value=""> </div><div class="position-relative form-group"><label for="segment_start" class="">Start date</label><input id="segment_start" name="segment_start" max="' + stringDate + '" type="date" class="form-control" value="' + stringDate + '"> </div><div class="position-relative form-group"><label for="segment_end" class="">End date</label><input id="segment_end"name="segment_end" min="' + stringDate + '" type="date" class="form-control"value="' + stringDate + '"></div></form>'
    );
    footer.html(
        '<button class="btn-secondary btn-cancel">Cancel</button>' +
        '<button class="btn-primary btn-sumbit" id="update-card">Create segment</button>'
    );

    var segmentName = $("#view-page #segment_name");
    var segmentStart = $("#view-page #segment_start");
    var segmentEnd = $("#view-page #segment_end");
    var id = getCookie("view_token");

    var cancel = $("#view-page .modal .btn-cancel");
    cancel.click(function (e) {
        e.stopPropagation();
        modal.fadeOut();
    });
    var createSegmentBtn = $("#view-page .modal .btn-sumbit");
    createSegmentBtn.click(function (e) {
        e.stopPropagation();
        createSegment(id, segmentName, segmentStart, segmentEnd);
        modal.fadeOut();
    });

    modal.fadeIn();
}

function showViewPageStats(chartData) {
    var displayType = $('#view-page .display-dropdown input')[0].value.toLowerCase();

    var trafficSum = 0;
    var positiveSum = 0;
    var negativeSum = 0;
    var maleSum = 0;
    var femaleSum = 0;

    if (displayType == 'custom') {
        trafficSum += getSum(chartData.trafficData);
        positiveSum += getSum(chartData.postitveData);
        negativeSum += getSum(chartData.negativeData);
        maleSum += getSum(chartData.maleData);
        femaleSum += getSum(chartData.femaleData);
    }
    else {
        for (var i = 0; i < chartData.length; i++) {
            trafficSum += getSum(chartData[i].result.trafficData);
            positiveSum += getSum(chartData[i].result.postitveData);
            negativeSum += getSum(chartData[i].result.negativeData);
            maleSum += getSum(chartData[i].result.maleData);
            femaleSum += getSum(chartData[i].result.femaleData);
        }
    }

    $('#view-page .options-block .stats div:nth-child(1) span')[0].textContent = numberWithCommas(trafficSum);
    $('#view-page .options-block .stats div:nth-child(2) span')[0].textContent = numberWithCommas(positiveSum + negativeSum);
    $('#view-page .options-block .stats div:nth-child(3) span')[0].textContent = numberWithCommas(maleSum) + "/" + numberWithCommas(femaleSum);
}


// Requests start
function monitorToggle(id) {
    $.when(
        $.ajax(request("MONITOR_TOGGLE", { params: id }, function (r) { }, true))
    ).done(function (r1) {
        if (!r1.success) {
            showAlert('Failed to toggle monitor', 'error');
            return;
        } else {
            showAlert('Monitor toggled', 'success');
        }
    });
}

function showSegments(id) {
    var tableBody = $('#view-page .card:nth-child(3) .card-body')
    var table = $('#view-page .card:nth-child(3) #segments-table');
    var loader = "<div class='loader'></div>";

    table.hide();
    tableBody.append(loader);

    var segmentsTable = $('#view-page #segments-table-content');
    $.when(
        $.ajax(request("GET_MONITOR_SEGMENTS", { params: id }, function (r) { }, true)),
    ).done(function (r1) {
        if (!r1.success) {
            showAlert('Failed to monitor segments', 'error')
            return;
        }
        table.show();
        $('.loader').remove()
        var monitorSerments = r1.data;
        segmentsTable.empty();
        if (monitorSerments.length === 0) {
            segmentsTable.append(
                "<tr><td class='td'><i>No segments available! Create one above</i></td> <td></td> <td></td> <td></td> </tr>"
            );
        } else {
            monitorSerments.map(function (segment) {
                segmentsTable.append(
                    "<tr>" +
                    "<td>" + segment.name + "</td>" +
                    "<td>" + timestampToDate(segment.start) + "</td>" +
                    "<td>" + timestampToDate(segment.end) + "</td>" +
                    "<td><button onClick='deleteSegment(" + segment.id + ")' class = 'btn delete-btn' data-id='" + segment.id + "'>Delete</button></td>" +
                    "</tr > "
                );
            })
        }
        addOptionsBlock(monitorSerments);
    });
}

function createSegment(id, segmentName, segmentStart, segmentEnd) {
    $.when(
        $.ajax(request("CREATE_MONITOR_SEGMENT", {
            params: id,
            name: segmentName.val(),
            start: dateToTimestamp(segmentStart.val(), 'start'),
            end: dateToTimestamp(segmentEnd.val(), 'end')
        }, function (r1) { }, true))
    ).done(function (r1) {
        if (!r1.success) {
            showAlert('Failed to create segment', 'error');
            return;
        } else {
            showAlert('Segment created', 'success');
            showSegments(id);
        }
    });
}

function deleteSegment(segment_id) {
    var id = getCookie("view_token");
    $.ajax(request("DELETE_MONITOR_SEGMENT", { params: `${id}/${segment_id}` }, function (r) {
        if (!r.success) {
            showAlert('Failed to delete monitor', 'error')
        } else {
            showAlert('Deleted monitor segment', 'success')
            showSegments(id);
        }
    }, true));
}
// Requests end

// Dropdown start
function addOptionsBlock(segments) {
    var id = getCookie("view_token");
    var displayTypes = ['Custom', 'By segment'];
    var displayVariants = '';
    for (var i = 0; i < displayTypes.length; i++) {
        if (i == 0)
            displayVariants += `<div class="dropdown-list-variant active" data-id="${i}">${displayTypes[i]}</div>`;
        else
            displayVariants += `<div class="dropdown-list-variant" data-id="${i}">${displayTypes[i]}</div>`;

    }

    var periods = ["Hour", "Day", "Week", "Fortnight", "Month", "Year"];
    var periodVariants = ``;
    for (var i = 0; i < periods.length; i++) {
        if (i == 1)
            periodVariants += `<div class="dropdown-list-variant active" data-id="${i}">${periods[i]}</div>`
        else
            periodVariants += `<div class="dropdown-list-variant" data-id="${i}">${periods[i]}</div>`
    }

    var segmentsVariants = '';
    for (var i = 0; i < segments.length; i++) {
        segmentsVariants += `<div class="dropdown-list-variant" data-id="${i}" data-start="${segments[i].start}" data-end="${segments[i].end}">${segments[i].name}</div>`
    }

    var stringDate = moment().format('YYYY-MM-DD');

    var optionsContent = $('#view-page .options-block .options');
    if ($('#view-page .options-block .options form')[0])
        $('#view-page .options-block .options form')[0].remove();

    optionsContent.append(
        '<form class ="">' +
        '<div class= "position-relative form-group active" >' +
        '<label  class="">Display type</label>' +
        '<div class="dropdown display-dropdown"> ' +
        '<div class="dropdown-visible">' +
        '<div class = "variants">' +
        `<input class="dropdown-input" value="${displayTypes[0]}"></input>` +
        '</div > ' +
        '<div class = "selectors">' +
        '<i class = "icon icon-chevron-down selector"></i>' +
        '</div > ' +
        '</div>' +
        '<div class="dropdown-list">	' +
        displayVariants +
        '<div class="no-options active">No options</div >' +
        '</div>' +
        '</div> ' +
        '</div > ' +

        '<div class= "position-relative form-group active" >' +
        '<label class="">Group by time period</label>' +
        '<div class="dropdown period-dropdown"> ' +
        '<div class="dropdown-visible">' +
        '<div class = "variants">' +
        `<input class="dropdown-input" value="${periods[1]}"></input>` +
        '</div > ' +
        '<div class = "selectors">' +
        '<i class = "icon icon-chevron-down selector"></i>' +
        '</div > ' +
        '</div>' +
        '<div class="dropdown-list">	' +
        periodVariants +
        '<div class="no-options active">No options</div >' +
        '</div>' +
        '</div> ' +
        '</div > ' +
        // Date inputs
        '<div class= "position-relative form-group active" > ' +
        '<label for="segment_start" class="">Start date</label>' +
        '<input id="startInput" name="start" max="' + stringDate + '" type="date" class="form-control" value="' + stringDate + '"> ' +
        '</div>' +

        '<div class="position-relative form-group active">' +
        '<label for="segment_end" class="">End date</label>' +
        '<input id="endInput" name="end" min="' + stringDate + '" type="date" class="form-control" value="' + stringDate + '">' +
        '</div>' +

        // Segments input
        '<div class= "position-relative form-group " >' +
        '<label class="">Select segments to compare</label>' +
        '<div class="dropdown segment-dropdown"> ' +
        '<div class="dropdown-visible">' +
        '<div class = "variants">' +
        '<input class="dropdown-input" placeholder="Select..."></input>' +
        '</div > ' +
        '<div class = "selectors">' +
        '<i class = "icon icon-close selector"></i>' +
        '<i class = "icon icon-chevron-down selector"></i>' +
        '</div > ' +
        '</div>' +
        '<div class="dropdown-list">	' +
        segmentsVariants +
        '<div class="no-options active">No options</div >' +
        '</div>' +
        '</div> ' +
        '</div > ' +
        '</form>'
    );

    addInputDropdown($('#view-page .options-block .options .display-dropdown')[0]);
    addInputDropdown($('#view-page .options-block .options .period-dropdown')[0]);
    addSegmentDropdown($('#view-page .options-block .options .segment-dropdown')[0]);

    $('#view-page .refresh-btn').unbind('click');
    $('#view-page .refresh-btn').click(function (e) {
        moveToChart(e);
        getChartData(id);
    });

    $('#view-page #startInput').unbind('change');
    $('#view-page #endInput').unbind('change');

    $('#view-page #startInput').change(function () { getChartData(id); })
    $('#view-page #endInput').change(function () { getChartData(id); })
}

function addInputDropdown(location) {
    $(location).find('.dropdown-visible').click(function (e) {
        $(location).find('.dropdown-list')[0].classList.toggle('active');
        $(location).find('.dropdown-visible')[0].classList.toggle('active');

        if ($(location).find('.dropdown-list')[0].children.length == 1)
            $(location).find('.no-options')[0].classList.add('active');
        else
            $(location).find('.no-options')[0].classList.remove('active');
    });

    $('body').click(function (e) {
        if (e.target.closest(`.dropdown`) !== $(location)[0]) {
            $(location).find('.dropdown-list')[0].classList.remove('active');
            $(location).find('.dropdown-visible')[0].classList.remove('active');
        }
    });


    $(location).find('.dropdown-list-variant').click(function (e) {
        var dropdownList = $(location).find('.dropdown-list')[0];

        for (elem of dropdownList.children) {
            elem.classList.remove('active');
        }
        $(location).find('.dropdown-visible')[0].classList.toggle('active');

        $(this)[0].classList.add('active');
        $(location).find('input')[0].value = $(this)[0].textContent;
        dropdownList.classList.toggle('active');


        if (location.className.includes('display')) {
            if (e.target.textContent == 'By segment') {
                $('#view-page .options .form-group:nth-child(5)')[0].classList.add('active');
                $('#view-page .options .form-group:nth-child(3)')[0].classList.remove('active');
                $('#view-page .options .form-group:nth-child(4)')[0].classList.remove('active');
            }
            else {
                $('#view-page .options .form-group:nth-child(5)')[0].classList.remove('active');
                $('#view-page .options .form-group:nth-child(3)')[0].classList.add('active');
                $('#view-page .options .form-group:nth-child(4)')[0].classList.add('active');
            }
        } else if (location.className.includes('period')) {
            var id = getCookie("view_token");
            getChartData(id);
        }
    });
}

function addSegmentDropdown(location) {
    $(location).find('.dropdown-list')
    $(location).find('.dropdown-visible').click(function (e) {
        if (e.target !== $('.selectedVariant .icon')[0]) {
            $(location).find('.dropdown-list')[0].classList.toggle('active');
            $(location).find('.dropdown-visible')[0].classList.toggle('active');

            var dropdownList = $(location).find('.dropdown-list')[0];
            for (var i = 0; i < dropdownList.children.length - 1; i++) {
                if (dropdownList.children[i].classList[1] != "active") {
                    $(location).find('.no-options')[0].classList.remove('active');
                    break;
                }
                else
                    $(location).find('.no-options')[0].classList.add('active');
            }
        }
    });

    $(location).find('.dropdown-list-variant').click(function (e) {
        var dropdownList = $(location).find('.dropdown-list')[0];
        dropdownList.classList.toggle('active');
        $(this)[0].classList.add('active');

        var variant = $(this)[0];
        var input = $(location).find(' .variants input');
        var value = $(variant)[0].textContent;
        input.before(`<div class = "selectedVariant" data-start=${variant.dataset.start} data-end=${variant.dataset.end} data-id=${variant.dataset.id}>
        <div class = "text">${value}</div>       
        <i class = 'icon icon-delete'></i>
        </div>`);

        $(location).find(' .selectedVariant .icon-delete').click(function () {
            $(location).find(` .dropdown-list-variant[data-id="${this.parentNode.dataset.id}"]`)[0].classList.remove('active');
            this.parentNode.remove()
        });

        $('#view-page .selectors .icon-close').click(function (e) {
            e.stopPropagation();
            var variants = $(location).find('.variants')[0].children;
            for (var i = 0; i < variants.length - 1; i++) {
                $(variants[i]).find('.icon-delete').click();
            }
            input[0].value = '';
        });
    });
}
// Dropdown end
function getSegmentsLabels(end, period, n) {
    var labels = [];

    var formatString = '';
    var additionalFormat = '';

    var cur = moment(end).startOf(period);
    var cur1 = moment(end).startOf(period);


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

function getSegmentsLength(start, end, period) {
    var n = getPeriodSegments(1, period);
    var totalTime = Math.ceil((end - start) / 86400000) / n;
    return Math.ceil(totalTime);
}