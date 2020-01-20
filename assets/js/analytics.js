function bindAnalytics() {
    var body = $("#analytics-page");
    var main = $("#analytics-page .main");
    var loader = "<div class='loader'></div>";

    main.hide();
    body.append(loader);


    renderSummatyBlock('traffic');
    setTimeout(() => { renderSummatyBlock('impression'); }, 1000)
    setTimeout(() => { renderSummatyBlock('gender'); }, 2000)

    renderLargeBlock('traffic');
    renderLargeBlock('impression');
    renderLargeBlock('gender');






    main.show();
    $('.loader').remove();



    $('#analytics-page .chart-selectors .selector').click(function (e) {
        if (e.target.closest('.selector').classList[2] != 'active')
            renderSummatyBlock(e.target.closest('.selector').classList[1].split('-')[0]);
    });
}
function AnalyticsInit() { }



function renderSummatyBlock(entriesType) {
    togglePageSelector(entriesType);
    $.when(getMonitors()).then(function (r1) {
        var monitors = r1.data;

        var start = 1578862800000;
        var end = 1579467599999;
        var period = 'day';
        var counter = 0;
        var maxLength = 0;
        var chartDataObject = [];
        for (monitor of monitors) {
            var query = `monitor_id=${monitor.id}&start=${start}&end=${end}&period=${period}`;

            $.when(
                getDataOfMonitor(entriesType, query)
            ).done(function (r) {
                var result = r.data;

                if (result.length > maxLength)
                    maxLength = result.length;

                var trafficData = [];
                var impressionData = [];
                var maleData = [];
                var femaleData = [];

                for (var i = 0; i < maxLength; i++) {
                    trafficData.push(0);
                    impressionData.push(0);
                    maleData.push(0);
                    femaleData.push(0);
                }
                if (entriesType == 'traffic') {
                    for (var i = 0; i < result.length; i++) {
                        trafficData[i] = result[i].count;
                    }
                } else if (entriesType == 'impression') {
                    for (var i = 0; i < result.length; i++) {
                        impressionData[i] = result[i].count;
                    }
                } else if (entriesType == 'gender') {

                    for (var i = 0; i < result.length; i++) {
                        maleData[i] = result[i].males;
                        femaleData[i] = result[i].females;
                    }
                }
                chartDataObject.push({
                    id: monitors[counter].id,
                    name: monitors[counter].name,
                    result: { trafficData, impressionData, maleData, femaleData }
                });

                if (monitors[counter].id == monitors[monitors.length - 1].id) {
                    chartDataObject['labels'] = getLabels(period, maxLength);
                    renderSummaryGend(chartDataObject, entriesType);
                    showAnalyticsSummaryStats(chartDataObject, period);
                }
                counter++;
            });


        }
    });
}


function renderSummaryGend(monitors, entriesType) {
    $("#analytics-page .main .card:nth-child(1) .chart-area").show();

    if ($('#analytics-page .card:nth-child(1) canvas')[0]) {
        $('#analytics-page .card:nth-child(1) canvas')[0].remove();
        $('#analytics-page .card:nth-child(1) .chartjs-size-monitor').remove()
    }
    var body = $('#analytics-page .card:nth-child(1) .chart-area');
    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#analytics-page .card:nth-child(1) canvas")[0];
    var ctx = canvas.getContext("2d");

    var i = 0;
    var type = '';

    var datasets = [];
    var options = null;
    var chart = null;

    var colors = ["#394049", "#656d77", "#2c6dbb", "#4584d1", "#645ecb", "#8884d9", "#b927b2", "#bf3774", "#377b00", "#4ead00"];
    for (monitor of monitors) {
        switch (entriesType) {
            case 'traffic':
                type = 'line',
                    datasets.push({
                        label: monitor.name,
                        backgroundColor: 'transparent',
                        borderColor: colors[i * 2],
                        borderWidth: 1,
                        data: monitor.result.trafficData
                    });
                break;
            case 'impression':
                type = 'line';
                datasets.push({
                    label: monitor.name,
                    borderColor: colors[i * 2],
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    data: monitor.result.impressionData
                });
                break;
            case 'gender':
                type = 'bar';
                datasets.push({
                    label: monitor.name + ' Male',
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    borderWidth: 1,
                    stack: i,
                    barThickness: 60,
                    data: monitor.result.maleData
                }, {
                    label: monitor.name + ' Female',
                    backgroundColor: colors[i + 1],
                    borderColor: colors[i + 1],
                    barThickness: 60,
                    borderWidth: 1,
                    stack: i,
                    data: monitor.result.femaleData
                });
                i++;
            default:
                break;
        }
        i++;
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
        type: type,
        data: {
            labels: monitors.labels,
            datasets: datasets,
        },
        options: options
    });
}



function renderLargeBlock(entriesType) {
    var id = "16f4afce-2c95-4e05-b907-5fc386b8d373";
    $.when(getMonitor(id)).then(function (r1) {
        var monitor = r1.data;
        var period = 'day';
        var maxLength = 0;
        var chartDataObject = [];
        var card = $('#analytics-page .large-' + entriesType + '  .info');
        card.append(
            "<div class = 'card-body'>" +
            "<h4>" + ucFirst(entriesType) + " Comparison Analytics</h4> " +
            "<div>Last " + period + " comparison</div>" +
            "</div > "
        );

        var start1 = 0;
        var end1 = 0;
        var start2 = 0;
        var end2 = 0;
        var cur = moment();
        var oldPeriod = period;
        var newPeriod = '';

        switch (period) {
            case 'day':
                start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');
                end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);

                start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');
                end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                newPeriod = 'hour';
                break;
            case 'week':
                end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');

                end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');
                newPeriod = 'day';
                break;
            case 'month':
                end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');

                end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');
                newPeriod = 'week';
                break;
            case 'year':
                end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');

                end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
                cur.subtract(1, period);
                start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');
                newPeriod = 'month';
                break;
            default:
                break;
        }

        var queries = [
            `monitor_id=${monitor.id}&start=${start1}&end=${end1}&period=${newPeriod}`,
            `monitor_id=${monitor.id}&start=${start2}&end=${end2}&period=${newPeriod}`,
        ];
        for (query of queries) {
            $.when(
                getDataOfMonitor(entriesType, query)
            ).done(function (r) {
                console.log(r)
                var result = r.data;

                if (result.length > maxLength)
                    maxLength = result.length;

                var countData = [];
                var maleData = [];
                var femaleData = [];

                for (var i = 0; i < maxLength; i++) {
                    countData.push(0);
                    maleData.push(0);
                    femaleData.push(0);
                }

                if (entriesType == 'gender') {
                    for (var i = 0; i < result.length; i++) {
                        maleData[i] = result[i].males;
                        femaleData[i] = result[i].females;
                    }
                } else {
                    for (var i = 0; i < result.length; i++) {
                        countData[i] = result[i].count;
                    }
                }


                chartDataObject.push({
                    id: monitor.id,
                    name: monitor.name,
                    result: { countData, maleData, femaleData }
                });

                chartDataObject['labels'] = getLargeChartLabels(newPeriod, maxLength);
                renderLargeBlockChart(chartDataObject, entriesType);
            });
        }
    });
}


function renderLargeBlockChart(monitorsObject, entriesType) {
    $("#analytics-page .large-" + entriesType + " .chart-area").show();

    if ($('#analytics-page .large-' + entriesType + ' canvas')[0]) {
        $('#analytics-page .large-' + entriesType + ' canvas')[0].remove();
        $('#analytics-page .large-' + entriesType + ' .chartjs-size-monitor').remove()
    }

    var body = $('#analytics-page .large-' + entriesType + ' .chart-area');

    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#analytics-page .large-" + entriesType + " canvas")[0];
    var ctx = canvas.getContext("2d");

    var i = 0;
    var j = 0;
    var type = '';

    var datasets = [];
    var options = null;
    var chart = null;

    var colors = ["#1f8ef1", "#14bda8", "#1f8ef1", "#f11f92", "#1f8ef1", "#f11f92",];
    var barBgColors = ["#1f8ef1", "#f11f92", "transparent", "transparent"];
    var chartLabels = ["", " (1 day previous)"]
    var bDash = [[], [15, 4, 4, 4]]
    for (monitor of monitorsObject) {
        switch (entriesType) {
            case 'traffic':
            case 'impression':
                type = 'line',
                    datasets.push({
                        label: ucFirst(entriesType) + chartLabels[i],
                        backgroundColor: 'transparent',
                        borderColor: colors[i],
                        pointBackgroundColor: colors[i],
                        borderWidth: 2,
                        borderDash: bDash[i],
                        data: monitor.result.countData
                    });
                break;
            case 'gender':
                type = 'bar';
                datasets.push({
                    label: 'Male' + chartLabels[j],
                    borderColor: colors[i + 2],
                    backgroundColor: barBgColors[i],
                    borderWidth: 2,
                    stack: i,
                    categoryPercentage: 1.0,
                    barPercentage: 1.0,
                    barThickness: 70,
                    data: monitor.result.maleData
                }, {
                    label: 'Female' + chartLabels[j],
                    categoryPercentage: 1.0,
                    barPercentage: 1.0,
                    borderColor: colors[i + 2 + 1],
                    backgroundColor: barBgColors[i + 1],
                    barThickness: 70,
                    borderWidth: 2,
                    stack: i,
                    data: monitor.result.femaleData
                });
                i++;
            default:
                break;
        }
        i++;
        j++;
    }



    var options = {
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    min: 0
                }
            }],
        }
    }

    chart = new Chart(ctx, {
        type: type,
        data: {
            labels: monitorsObject.labels,
            datasets: datasets,
        },

        options: options
    });
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


function showAnalyticsSummaryStats(dataObject, period) {
    $('#analytics-page .card:nth-child(1) h2')[0].textContent = 'Last ' + period + ' summary';

    var totalSum = getObjectTotalSum(dataObject);
    var period = 'day';
    if (period == 'day')
        period = 'dai';

    for (span of $('#analytics-page .chart-selectors .selector div:nth-child(2) span')) {
        span.textContent = period + 'ly';
    }

    if (totalSum.traffic)
        $('#analytics-page .chart-selectors .traffic-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.traffic) + ' people';
    else if (totalSum.impression)
        $('#analytics-page .chart-selectors .impression-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.impression) + ' people';
    else if (totalSum.male)
        $('#analytics-page .chart-selectors .gender-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.male) + ' M, ' + numberWithCommas(totalSum.female) + ' F';
}


function togglePageSelector(entriesType) {
    var selectorBlock = $('#analytics-page .chart-selectors');

    for (selector of selectorBlock[0].children) {
        if (entriesType == selector.classList[1].split('-')[0])
            selector.classList.add('active');
        else
            selector.classList.remove('active');
    }
}


function getAnalyticsPageLabes() {

}

function getLargeChartLabels(period, n) {
    var labels = [];

    if (period == 'hour') {
        for (var i = 0; i < 24; i++)
            labels.push( i + ' - ' + (i + 1))
    } else if (period == 'day') {
        for (var i = 0; i < 7; i++)
            labels.push('Day ' + (i + 1))
    } else if (period == 'week') {
        for (var i = 0; i < 5; i++)
            labels.push('Week ' + (i + 1))
    }
    else if (period == 'month') {
        for (var i = 0; i < 12; i++)
            labels.push('Month ' + (i + 1))
    }
    return labels;
}