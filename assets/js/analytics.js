function bindAnalytics() {
    $.when(getMonitors()).done(function (r) {
        var monitorsNames = [];
        monitorsIds = []
        for (monitor of r.data) {
            monitorsNames.push(monitor.name);
            monitorsIds.push(monitor.id);
        }
        var periods = ['Year', 'Month', 'Week', 'Day'];

        addDropdown($('#analytics-page .card:first-child .info .dropdowns'), 'period', periods);
        addDropdowns($('#analytics-page .card:nth-child(2) .info .dropdowns'), { periods, monitorsNames, monitorsIds });
        addDropdowns($('#analytics-page .card:nth-child(3) .info .dropdowns'), { periods, monitorsNames, monitorsIds });
        addDropdowns($('#analytics-page .card:nth-child(4) .info .dropdowns'), { periods, monitorsNames, monitorsIds });
        addDropdowns($('#analytics-page .card:nth-child(5) .info .dropdowns'), { periods, monitorsNames, monitorsIds });



        var activeSelector = $('#analytics-page .chart-selectors .selector.active')[0];
        var selectors = $('#analytics-page .chart-selectors')[0].children;     

        for (var i = 0; i < selectors.length; i++) {
            if (selectors[i] != activeSelector) {                           
                renderSummaryBlock(selectors[i].classList[1].split('-')[0]);               
            }           
        }
        setTimeout(() => {
            renderSummaryBlock(activeSelector.classList[1].split('-')[0]);            
        }, 1000);     
        


        renderSmallBlocks();
        

        renderLargeBlock('traffic');
        renderLargeBlock('impression');
        renderLargeBlock('gender');

    });


    $('#analytics-page .chart-selectors .selector').click(function (e) {
        if (e.target.closest('.selector').classList[2] != 'active')
            renderSummaryBlock(e.target.closest('.selector').classList[1].split('-')[0]);
    });
}
function AnalyticsInit() {
}

// BLOCKS RENDER START
function renderSummaryBlock(entriesType) {
    var body = $("#analytics-page .main .card:first-child() .chart-holder");
    var main = $("#analytics-page .main .card:first-child() .chart-area");
    var loader = "<div class='loader'></div>";

    main.hide();
    body.append(loader);


    togglePageSelector(entriesType);
    $.when(getMonitors()).then(function (r1) {
        var monitors = r1.data;
        var period = $('#analytics-page .card:first-child .dropdown .visible-dropdown h6')[0].textContent.toLowerCase();

        var timestampObject = getAnalyticPagePeriod(period);
        var start = timestampObject.start1;
        var end = timestampObject.end1;
        var newPeriod = timestampObject.newPeriod;
        var oldPeriod = period;

        var counter = 0;
        var chartDataObject = [];

        var queries = [];
        for (monitor of monitors) {
            queries.push(`monitor_id=${monitor.id}&start=${start}&end=${end}&period=${newPeriod}`);
        }

        $.when(
            ...getRequestsArr(entriesType, queries)
        ).done(function (...results) {
            main.show();
            $('.loader').remove();
           
            var maxLength = getMaxLength(newPeriod)
            for (r of results) {
                var result = r[0].data;

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
                        if (period == 'year')
                            trafficData[maxLength - result.length + i] = result[i].count;                            
                        else
                            trafficData[i] = result[i].count;                            
                    }
                   
                } else if (entriesType == 'impression') {
                    for (var i = 0; i < result.length; i++) {
                        if (period == 'year')
                            impressionData[maxLength - result.length + i] = result[i].count;
                        else 
                            impressionData[i] = result[i].count;
                    }                    
                } else if (entriesType == 'gender') {                    
                    for (var i = 0; i < result.length; i++) {
                        if (period == 'year') {
                            maleData[maxLength - result.length + i] = result[i].males;
                            femaleData[maxLength - result.length + i] = result[i].females;
                        } else {
                            maleData[i] = result[i].males;
                            femaleData[i] = result[i].females;
                        }
                    }                     
                }

                chartDataObject.push({
                    id: monitors[counter].id,
                    name: monitors[counter].name,
                    result: { trafficData, impressionData, maleData, femaleData }
                });


                if (monitors[counter].id == monitors[monitors.length - 1].id) {
                    if (newPeriod == 'hour'){
                        chartDataObject['labels'] = getLargeChartLabels(newPeriod); 
                    }
                    else
                    chartDataObject['labels'] = getLabels(newPeriod, maxLength);
                
                    renderSummaryChart(chartDataObject, entriesType);
                    showSummaryBlockStats(chartDataObject, oldPeriod);
                }
                counter++;
            }
        });
    });
}
function renderSmallBlocks() {
    var body = $('#analytics-page .card:nth-child(2) .card-content');
    var main = $('#analytics-page .card:nth-child(2) .chart-blocks');
    var loader = "<div class='loader'></div>";
    main.hide();
    body.append(loader);


    var period = $('#analytics-page .card:nth-child(2) .period-dropdown .visible-dropdown h6')[0].textContent.toLowerCase();

    var monitorDropdown = $('#analytics-page .card:nth-child(2) .monitor-dropdown .visible-dropdown h6')[0];
    var id = monitorDropdown.dataset.id;
    $('#analytics-page .card:nth-child(2) .info-text h2')[0].textContent = monitorDropdown.textContent;

    var timestampObject = getAnalyticPagePeriod(period);
    var start = timestampObject.start1;
    var end = timestampObject.end1;
    var newPeriod = timestampObject.newPeriod;
    
    var query = `monitor_id=${id}&start=${start}&end=${end}&period=${newPeriod}`;

    $.when(
        $.ajax(request("GET_TRAFFIC_ENTRIES_V2", { query }, function (r) { }, true)),
        $.ajax(request("GET_IMPRESSION_ENTRIES_V2", { query }, function (r) { }, true)),
        $.ajax(request("GET_GENDER_ENTRIES_V2", { query }, function (r) { }, true))

    ).done(function (r1, r2, r3) {
        if (!r1[0].success) {
            showAlert('Failed to load info', 'error');
            return;
        }
        if (!r2[0].success) {
            showAlert('Failed to load info', 'error');
            return;
        }
        if (!r3[0].success) {
            showAlert('Failed to load info', 'error');
            return;
        }
        main.show();
        $('.loader').remove();

        trafficResult = r1[0].data;
        impressionResult = r2[0].data;
        genderResult = r3[0].data;

        var maxLength = getMaxLength(newPeriod);
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

        for (var i = 0; i < trafficResult.length; i++) {
            trafficData[maxLength - trafficResult.length + i] = trafficResult[i].count;
        }
        for (var i = 0; i < impressionResult.length; i++) {
            impressionData[maxLength - impressionResult.length + i - 1] = impressionResult[i].count;
        }        
        for (var i = 0; i < genderResult.length; i++) {
            maleData[maxLength - genderResult.length + i - 1] = genderResult[i].males;
            femaleData[maxLength - genderResult.length + i - 1] = genderResult[i].females;
        }       

        var labels = getLabels(newPeriod, maxLength);
        var chartData = { labels, trafficData, impressionData, maleData, femaleData }
        renderSmallBlockChart(chartData, 'traffic');
        renderSmallBlockChart(chartData, 'impression');
        renderSmallBlockChart(chartData, 'gender');
        showSmallBlockStats(chartData)
    });
}
function renderLargeBlock(entriesType) {
    var card = $('#analytics-page .large-' + entriesType + '  .card-body .large-chart-block');
    var main = $('#analytics-page .large-' + entriesType + ' .chart-area');
    var loader = "<div class='loader'></div>";
    main.hide();
    card.append(loader);

    $(card).find('.info h2').textContent = ucFirst(entriesType) + " Comparison Analytics";
    $(card).find('.info h2').textContent = ucFirst(entriesType) + " Comparison Analytics";

    var period = $('#analytics-page .large-' + entriesType + ' .period-dropdown .visible-dropdown h6')[0].textContent.toLowerCase();
    var id = $('#analytics-page .large-' + entriesType + ' .monitor-dropdown .visible-dropdown h6')[0].dataset.id;

    var maxLength = 0;
    var chartDataObject = [];


    var timestampObject = getAnalyticPagePeriod(period);

    var start1 = timestampObject.start1;
    var end1 = timestampObject.end1;
    var start2 = timestampObject.start2;
    var end2 = timestampObject.end2;
    var newPeriod = timestampObject.newPeriod;
    var oldPeriod = period;

    var queries = [
        `monitor_id=${id}&start=${start1}&end=${end1}&period=${newPeriod}`,
        `monitor_id=${id}&start=${start2}&end=${end2}&period=${newPeriod}`,
    ];

    $.when(...getRequestsArr(entriesType, queries)).done(function (...results) {
        main.show();
        $('.loader').remove();

        var maxLength = getMaxLength(newPeriod);
       
        for (r of results) {
            var result = r[0].data;
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
                    if (period == 'year') {
                        maleData[maxLength - result.length + i] = result[i].males;
                        femaleData[maxLength - result.length + i] = result[i].females;
                    } else {
                        maleData[i] = result[i].males;
                        femaleData[i] = result[i].females;
                    }
                }
            } else {
                for (var i = 0; i < result.length; i++) {
                    if (period == 'year') 
                        countData[maxLength - result.length + i] = result[i].count;   
                    else 
                        countData[i] = result[i].count;
                }
            }

            chartDataObject.push({
                id: monitor.id,
                name: monitor.name,
                result: { countData, maleData, femaleData }
            });

            chartDataObject['labels'] = getLargeChartLabels(newPeriod);
            chartDataObject['period'] = oldPeriod;
            renderLargeBlockChart(chartDataObject, entriesType);
        }
    });
}


// BLOCKS RENDER END

// CHARTS START
function renderSummaryChart(monitors, entriesType) {
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
                    data: monitor.result.maleData
                }, {
                    label: monitor.name + ' Female',
                    backgroundColor: colors[i + 1],
                    borderColor: colors[i + 1],
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
function renderSmallBlockChart(monitorsObject, entriesType) {
    $("#analytics-page .chart-blocks ." + entriesType + "-chart-block .small-chart-area").show();

    if ($("#analytics-page .chart-blocks ." + entriesType + "-chart-block canvas")[0]) {
        $("#analytics-page .chart-blocks ." + entriesType + "-chart-block canvas")[0].remove();
        $("#analytics-page .chart-blocks ." + entriesType + "-chart-block .chartjs-size-monitor").remove()
    }

    var body = $("#analytics-page .chart-blocks ." + entriesType + "-chart-block .small-chart-area");

    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#analytics-page .chart-blocks ." + entriesType + "-chart-block .small-chart-area canvas")[0];
    var ctx = canvas.getContext("2d");

    var datasets = [];
    var options = null;
    var chart = null;

    var gradientStroke = ctx.createLinearGradient(0, 130, 0, 50);
    gradientStroke.addColorStop(1, "rgba(72,72,176,0.1)");
    gradientStroke.addColorStop(0.4, "rgba(72,72,176,0.0)");
    gradientStroke.addColorStop(0, "rgba(119,52,169,0)");

    switch (entriesType) {
        case 'traffic':
            datasets = [{
                label: 'Traffic',
                backgroundColor: gradientStroke,
                borderColor: '#1f8ef1',
                pointBackgroundColor: '#1f8ef1',
                borderWidth: 2,
                data: monitorsObject.trafficData
            }];
            break;
        case 'impression':
            datasets = [{
                label: 'Views',
                backgroundColor: gradientStroke,
                borderColor: '#14bda8',
                pointBackgroundColor: '#14bda8',
                borderWidth: 2,
                data: monitorsObject.impressionData
            }];
            break;
        case 'gender':
            datasets = [{
                label: 'Male',
                borderColor: '#1edc6e',
                pointBackgroundColor: '#1edc6e',
                backgroundColor: "rgba(31, 142, 241, 0.1)",
                borderWidth: 2,
                data: monitorsObject.maleData
            }, {
                label: 'Female',
                borderColor: '#f11f92',
                pointBackgroundColor: '#f11f92',                
                backgroundColor: "rgba(241, 31, 146, 0.1)",
                borderWidth: 2,
                data: monitorsObject.femaleData
            }];
            break;
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
                },
            }],
        },
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monitorsObject.labels,
            datasets: datasets,
        },
        options: options,
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


    var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
    gradientStroke.addColorStop(1, "rgba(72,72,176,0.1)");
    gradientStroke.addColorStop(0.4, "rgba(72,72,176,0.0)");
    gradientStroke.addColorStop(0, "rgba(119,52,169,0)");

    var colors = ["#14bda8", "#1f8ef1", "#1f8ef1", "#f11f92", "#1f8ef1", "#f11f92",];
    var barBgColors = ["#1f8ef1", "#f11f92", gradientStroke, gradientStroke];
    var chartLabels = ["", " (1 " + monitorsObject.period + " previous)"]
    var bDash = [[], [15, 4, 4, 4]]
    for (monitor of monitorsObject) {
        switch (entriesType) {
            case 'traffic':
            case 'impression':
                type = 'line',
                    datasets.push({
                        label: ucFirst(entriesType) + chartLabels[i],
                        backgroundColor: gradientStroke,
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
                    data: monitor.result.maleData,
                }, {
                    label: 'Female' + chartLabels[j],
                    borderColor: colors[i + 2 + 1],
                    backgroundColor: barBgColors[i + 1],
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
                },
            }],
        },
    }


    chart = new Chart(ctx, {
        type: type,
        data: {
            labels: monitorsObject.labels,
            datasets: datasets,
        },

        options: options,
    });
}


// CHARTS END


// REQUESTS START
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
// REQUESTS END

function showSummaryBlockStats(dataObject, period) {
    $('#analytics-page .card:nth-child(1) h2')[0].textContent = 'Last ' + period + ' summary';

    var totalSum = getObjectTotalSum(dataObject);
    if (period == 'day')
        period = 'dai';

    for (span of $('#analytics-page .chart-selectors .selector div:nth-child(2) span')) {
        span.textContent = period + 'ly';
    }

    if (totalSum.traffic)
        $('#analytics-page .chart-selectors .traffic-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.traffic) + ' people';
    if (totalSum.impression)
        $('#analytics-page .chart-selectors .impression-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.impression) + ' people';
    if (totalSum.male)
        $('#analytics-page .chart-selectors .gender-selector>div:nth-child(3)')[0].textContent = numberWithCommas(totalSum.male) + ' M, ' + numberWithCommas(totalSum.female) + ' F';
}
function showSmallBlockStats(dataObject) {
    var trafficSum = getSum(dataObject.trafficData);
    var imperssionSum = getSum(dataObject.impressionData);
    var maleSum = getSum(dataObject.maleData);
    var femaleSum = getSum(dataObject.femaleData);
    
    $("#analytics-page .card:nth-child(2) .chart-blocks .traffic-chart-block .stats span")[0].textContent = numberWithCommas(trafficSum);
    $("#analytics-page .card:nth-child(2) .chart-blocks .impression-chart-block .stats span")[0].textContent = numberWithCommas(imperssionSum);
    $("#analytics-page .card:nth-child(2) .chart-blocks .gender-chart-block .stats span")[0].textContent = numberWithCommas(maleSum);
    $("#analytics-page .card:nth-child(2) .chart-blocks .gender-chart-block .stats span")[1].textContent = numberWithCommas(femaleSum);
   
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

function getLargeChartLabels(period) {
    var labels = [];

    if (period == 'hour') {
        var n = 24;
        var formatString = 'h a';
        var cur = moment().subtract(1, period);;
        var cur1 = moment();

        while (n > 0) {
            var date = cur.format(formatString) + ' - ' + cur1.format(formatString);
            labels.push(date);

            cur1.subtract(1, period);
            cur.subtract(1, period);
            n--;
        }
        labels.reverse();
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


function getAnalyticPagePeriod(period) {
    var cur = moment();
    switch (period.toLowerCase()) {
        case 'day':
            end1 = dateToTimestamp(cur.format("YYYY-MM-DD HH:mm:ss:MS"));
            cur.subtract(1, period);
            start1 = dateToTimestamp(cur.format("YYYY-MM-DD HH:mm:ss:MS"));

            end2 = dateToTimestamp(cur.format("YYYY-MM-DD HH:mm:ss:MS"));
            cur.subtract(1, period);
            start2 = dateToTimestamp(cur.format("YYYY-MM-DD HH:mm:ss:MS"));

            newPeriod = 'hour';
            break;
        case 'week':
            end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');

            end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            newPeriod = 'day';
            break;
        case 'month':
            end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');

            end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            newPeriod = 'week';
            break;
        case 'year':
            end1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start1 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'start');

            end2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            cur.subtract(1, period);
            start2 = dateToTimestamp(cur.format("YYYY-MM-DD"), 'end');
            newPeriod = 'month';
            break;
        default:
            break;
    }

    return { start1, end1, start2, end2, newPeriod };
}


function getRequestsArr(entriesType, queries) {
    var requestsArr = [];
    for (query of queries) {
        requestsArr.push(getDataOfMonitor(entriesType, query))
    }
    return requestsArr;
}

function addDropdowns(location, items) {
    var monitorsNames = items.monitorsNames;
    var monitorsIds = items.monitorsIds;
    addDropdown(location, 'monitor', { monitorsNames, monitorsIds });
    addDropdown(location, 'period', items.periods);
}

function addDropdown(location, type, items) {
    var dropListItems = '';
    var icon = '';
    var visibleTag = '';
    var selectText = '';
    if (type == 'period') {
        items.map(item => {
            dropListItems += `<div class = "dropdown-element">${item}</div>`;
        });

        visibleTag = `<h6>${items[2]}</h6>`;
        icon = '<i class="fa fa-clock" aria-hidden="true"></i>';
        selectText = 'timespan';
    }
    else if (type == 'monitor') {
        for (var i = 0; i < items.monitorsNames.length; i++) {
            dropListItems += `<div class = "dropdown-element" data-id=${items.monitorsIds[i]}>${items.monitorsNames[i]}</div>`;
        }

        visibleTag = `<h6 data-id="${items.monitorsIds[0]}">${items.monitorsNames[0]}</h6>`;
        icon = '<i class="fa fa-desktop" aria-hidden="true"></i>';
        selectText = 'monitor';
    }

    var dropdown = `
    <div class = 'dropdown ${type}-dropdown'>
        <div class = "visible-dropdown">
            ${visibleTag}
            <div class = "toggle-dropdown">
               ${icon}
                <i class="fa fa-caret-down" aria-hidden="true"></i>
            </div>
        </div>
        <div class="dropdown-list">
            <h6>Select ${selectText}</h6>
            ${dropListItems}
        </div>
    </div >`;


    location.append(dropdown);

    var dropdownBtn = $(location).find(`.${type}-dropdown .toggle-dropdown`);
    var dropdownList = $(location).find(`.${type}-dropdown .dropdown-list`);

    dropdownBtn.click(function (e) {
        dropdownList[0].classList.toggle('active');
    });

    location.click(function (e) {
        if (!e.target.closest('.toggle-dropdown'))
            dropdownList[0].classList.remove('active');
    });


    dropdownList.click(function (e) {
        var visibleDropdown = $(location).find(`.${type}-dropdown .visible-dropdown h6`)[0];
        if (e.target.className == 'dropdown-element' && e.target.textContent != visibleDropdown.textContent) {
            visibleDropdown.textContent = e.target.textContent;
            if (type == 'monitor')
            visibleDropdown.dataset.id = e.target.dataset.id;

            dropdownList[0].classList.toggle('active');
            startRenderFunction(e);
        }
    });
}

function startRenderFunction(e) {
    var target = e.target.closest('.card');

    if (target == $('#analytics-page .card:nth-child(1)')[0]) {
        var activeSelector = $('#analytics-page .chart-selectors .selector.active')[0];
        var selectors = $('#analytics-page .chart-selectors')[0].children;     

        for (var i = 0; i < selectors.length; i++) {
            if (selectors[i] != activeSelector) {                           
                renderSummaryBlock(selectors[i].classList[1].split('-')[0]);               
            }           
        }
        setTimeout(() => {
            renderSummaryBlock(activeSelector.classList[1].split('-')[0]);            
        }, 1000);     

    } else if (target == $('#analytics-page .card:nth-child(2)')[0]) {
        renderSmallBlocks();
    } else {
        var closestBlock = e.target.closest('.large-block');
        var closestBlockClass = closestBlock.classList[1].split('-')[1];
        renderLargeBlock(closestBlockClass);
    }
}

function getMaxLength(period) {
    var length = 0;
    switch (period) {
        case 'hour':
            length = 24;
            break;
        case 'day':
            length = 7;
            break;
        case 'week':
            length = 5;
            break;
        case 'month':
            length = 12;
        
            break;
                            
        default:
            break;
    }
    return length;
}