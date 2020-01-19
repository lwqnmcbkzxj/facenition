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
    // renderLargeBlock('impression');
    // renderLargeBlock('gender');






    main.show();
    $('.loader').remove();



    $('#analytics-page .chart-selectors .selector').click(function (e) {
        if (e.target.closest('.selector').classList[2] != 'active')
            renderSummatyBlock(e.target.closest('.selector').classList[1].split('-')[0]);
    });
}
function AnalyticsInit() { }



function renderSummatyBlock(entriesType) {
    toggleActivePageSelector(entriesType);
    $.when(getMonitors()).then(function (r1) {
        var monitors = r1.data;

        var start = 1578776400000;
        var end = 1579381199999;
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
                    chartGend(chartDataObject, entriesType);
                    console.log(chartDataObject)
                    showAnalyticsPageStats(chartDataObject);
                }
                counter++;
            });


        }
    });
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

function getMonitors() {
    return $.ajax(request("GET_MONITORS", {}, function (r) {
        if (!r.success) {
            showAlert('Failed to load monitors', 'error');
            return;
        }
    }, true));
}

function getMonitor(id) {
    return $.ajax(request("GET_MONITOR", {params: id}, function (r) {
        if (!r.success) {
            showAlert('Failed to load monitors', 'error');
            return;
        }
    }, true));
}


function chartGend(monitors, entriesType) {
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
                        borderColor: colors[i + 1],
                        borderWidth: 1,
                        data: monitor.result.trafficData
                    });
                break;
            case 'impression':
                type = 'line';
                datasets.push({
                    label: monitor.name,
                    borderColor: colors[i + 1],
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
                    stack: 0,
                    barThickness: 60,
                    data: monitor.result.maleData
                }, {
                    label: monitor.name + ' Female',
                    backgroundColor: colors[i + 1],
                    borderColor: colors[i + 1],
                    barThickness: 60,
                    borderWidth: 1,
                    stack: 0,
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

        var start = 1578776400000;
        var end = 1579381199999;
        var period = 'day';
        
        var query = `monitor_id=${monitor.id}&start=${start}&end=${end}&period=${period}`;

        $.when(
            getDataOfMonitor(entriesType, query)
        ).done(function (r) {
            // console.log(r.data)
            // renderLargeBlockChart(r.data)



            
        });













        
    });

    // renderLargeBlockChart()
}


function renderLargeBlockChart() {
    $("#analytics-page .main .card:nth-child(2) .chart-area").show();

    if ($('#analytics-page .card:nth-child(2) canvas')[0]) {
        $('#analytics-page .card:nth-child(2) canvas')[0].remove();
        $('#analytics-page .card:nth-child(2) .chartjs-size-monitor').remove()
    }
    var body = $('#analytics-page .card:nth-child(2) .chart-area');
    body.append(
        '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
    );
    var canvas = $("#analytics-page .card:nth-child(2) canvas")[0];
    var ctx = canvas.getContext("2d");

    var i = 0;
    var type = '';

    var datasets = [];
    var options = null;
    var chart = null;

    var colors = ["#1f8ef1", "#14bda8", "#1f8ef1", "#f11f92"];
   
    
        switch (entriesType) {
            case 'traffic':
            case 'impression':
                type = 'line',
                    datasets.push({
                        label: monitor.name,
                        backgroundColor: 'transparent',
                        borderColor: colors[i],
                        borderWidth: 1,
                        data: monitor.result.trafficData
                    });
                break;           
            case 'gender':
                var chartLabels = ["", " (1 day previous)"]
                
                type = 'bar';
                datasets.push({
                    label: 'Male' + chartLabels[i],
                    backgroundColor: colors[i],
                    borderColor: colors[i],
                    borderWidth: 1,
                    stack: 0,
                    barThickness: 60,
                    data: monitor.result.maleData
                }, {
                    label: 'Female' + chartLabels[i],
                    backgroundColor: colors[i + 1],
                    borderColor: colors[i + 1],
                    barThickness: 60,
                    borderWidth: 1,
                    stack: 0,
                    data: monitor.result.femaleData
                });
                i++;
            default:
                break;
        }
        i++;
    

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





function showAnalyticsPageStats(dataObject, period) {
    var totalSum = getTotalSum(dataObject);
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

function getTotalSum(dataObject) {
    var totalSum = {
        traffic: 0,
        impression: 0,
        male: 0,
        female: 0,
    }

    for (elem of dataObject) {
        totalSum.traffic += getSum(elem.result.trafficData);
        totalSum.impression += getSum(elem.result.impressionData);
        totalSum.male += getSum(elem.result.maleData);
        totalSum.female += getSum(elem.result.femaleData);
    }
    return totalSum;
}

function toggleActivePageSelector(entriesType) {
    var selectorBlock = $('#analytics-page .chart-selectors');

    for (selector of selectorBlock[0].children) {
        if (entriesType == selector.classList[1].split('-')[0])
            selector.classList.add('active');
        else
            selector.classList.remove('active');
    }
}


