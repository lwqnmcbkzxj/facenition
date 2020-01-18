function MonitorsViewInit() {
    var body = $("#view-page");
    var infoCard = $("#view-page .main .card:nth-child(1) ");
    var segmentsTable = $('#view-page #segments-table-content');
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

        ).done(function (r1, r2) {
            if (!r1[0].success) {
                showAlert('Failed to load monitor', 'error');
                return;
            }
            if (!r2[0].success) {
                showAlert('Failed to load thumbnail', 'error');
                return;
            }

            monitor = r1[0].data;
            var img = r2[0].data;
            var isCheckBoxActive = monitor.active ? 'checked' : 'none';
            infoCard.empty();
            infoCard.append(
                "<div class = 'card-body'>" +
                "<div><img src='data:image/jpg;base64," + img + "' alt = /></div>" +
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
            showSegments(monitor.id);


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
        });

        var displayOptions = ['Custom', 'By segment'];
        var displaySelect = '<select name="" id="displayTypeSelect">';
        for (var i = 0; i < displayOptions.length; i++) {
            displaySelect += '<option value = ' + displayOptions[i].toLowerCase() + '> ' + displayOptions[i] + '</option>'
        }
        displaySelect += '</select>';
        var periodOptions = ["Hour", "Day", "Week", "Fortnight", "Month", "Year"];
        var periodSelect = '<select name="" id="timePeriodSelect">';
        for (var i = 0; i < periodOptions.length; i++) {
            periodSelect += '<option value = ' + periodOptions[i].toLowerCase() + '> ' + periodOptions[i] + '</option>'
        }
        periodSelect += '</select>';

        var stringDate = dateForInput(new Date());
        var optionsContent = $('#view-page .options-block .options');

        optionsContent.append(
            '<form class="">' +
            '<div class= "position-relative form-group">' +
            '<label  class="">Display type</label>' +
            displaySelect +
            '</div> ' +
            '<div class= "position-relative form-group" >' +
            '<label class="">Group by time period</label>' +
            periodSelect +
            '</div> ' +
            '<div class= "position-relative form-group" > ' +
            '<label for="segment_start" class="">Start date</label>' +
            '<input id="startInput" name="start" max="' + stringDate + '" type="date" class="form-control" value="' + stringDate + '"> ' +
            '</div>' +
            '<div class="position-relative form-group">' +
            '<label for="segment_end" class="">End date</label>' +
            '<input id="endInput" name="end" min="' + stringDate + '" type="date" class="form-control" value="' + stringDate + '">' +
            '</div>' +
            '</form>'
        );

        loadChartData(id);
        $('#view-page .refresh-btn').click(function () {
            loadChartData(id);
        });
        $('#view-page #startInput').change(function () { loadChartData(id); })
        $('#view-page #endInput').change(function () { loadChartData(id); })

        $('#view-page #displayTypeSelect').change(function () { loadChartData(id); })
        $('#view-page #timePeriodSelect').change(function () { loadChartData(id); })
    })();
}


function loadChartData(id) {
    var start = dateToTimestamp($('#view-page #startInput')[0].value);
    var end = dateToTimestamp($('#view-page #endInput')[0].value) + 86400000 - 1;
    var period = $('#view-page #timePeriodSelect')[0].value;

    var query = `monitor_id=${id}&start=${start}&end=${end}&period=${period}`;

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

        trafficResult = r1[0].data;
        impressionResult = r2[0].data;
        genderResult = r3[0].data;

        var n = Math.max(trafficResult.length, impressionResult.length, genderResult.length);
        var labels = [];
        var trafficData = [];

        var postitveData = [];
        var negativeData = [];

        var maleData = [];
        var femaleData = [];
        for (var i = 0; i < n; i++) {
            trafficData.push(0);

            postitveData.push(0);
            negativeData.push(0);

            maleData.push(0);
            femaleData.push(0);
        }
        
        var labels = getLabels(period, n);

        for (var i = 0; i < trafficResult.length; i++) {
            trafficData[i] = trafficResult[i].count;
        }

        for (var i = 0; i < impressionResult.length; i++) {
            postitveData[i] = impressionResult[i].positive;
            negativeData[i] = impressionResult[i].negative;

        }
        for (var i = 0; i < genderResult.length; i++) {
            maleData[i] = genderResult[i].males;
            femaleData[i] = genderResult[i].females;
        }

        var chartData = { labels, trafficData, postitveData, negativeData, maleData, femaleData }
        dataGend(chartData);

        $('#view-page .chart-selector div').click(function (e) {
            var selectorBlock = $('#view-page .chart-selector');
            for (selector of selectorBlock[0].children) {
                if (e.target == selector)
                    selector.classList.add('active');
                else
                    selector.classList.remove('active');

                dataGend(chartData);
            }
        });
    });
}

function dataGend(chartData) {
    var labels = chartData.labels;
    var trafficData = chartData.trafficData;
    var postitveData = chartData.postitveData;
    var negativeData = chartData.negativeData;
    var maleData = chartData.maleData;
    var femaleData = chartData.femaleData;

    showStats(chartData);
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

function showModal() {
    var modal = $("#view-page .modal");
    var title = $("#view-page .modal .modal-title");
    var content = $("#view-page .modal .modal-body");
    var footer = $("#view-page .modal .modal-footer");

    var nowDate = new Date();
    var stringDate = dateForInput(nowDate);

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
    var createSegment = $("#view-page .modal .btn-sumbit");
    createSegment.click(function (e) {
        e.stopPropagation();
        $.when(
            $.ajax(request("CREATE_MONITOR_SEGMENT", {
                params: id,
                name: segmentName.val(),
                start: dateToTimestamp(segmentStart.val()),
                end: dateToTimestamp(segmentEnd.val())
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
        modal.fadeOut();
    });

    modal.fadeIn();
}

function showStats(chartData) {
    
    $('#view-page .options-block .stats div:nth-child(1) span')[0].textContent = numberWithCommas(getSum(chartData.trafficData));
    $('#view-page .options-block .stats div:nth-child(2) span')[0].textContent = numberWithCommas(getSum(chartData.postitveData));
    $('#view-page .options-block .stats div:nth-child(3) span')[0].textContent = numberWithCommas(getSum(chartData.maleData)) + "/" + numberWithCommas(getSum(chartData.femaleData));
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
    var main = $("#view-page .main");
    var segmentsTable = $('#view-page #segments-table-content');

    $.when(
        $.ajax(request("GET_MONITOR_SEGMENTS", { params: id }, function (r) { }, true)),
    ).done(function (r1) {
        if (!r1.success) {
            showAlert('Failed to monitor segments', 'error')
            return;
        }

        $(".loader").remove();
        main.show();

        var monitorSerments = r1.data;
        segmentsTable.empty();
        if (monitorSerments.length === 0) {
            segmentsTable.append(
                "<tr><td class='td'><i>No segments available! Create one above</i></td> <td></td> <td></td> <td></td> </tr>"
            );
        } else {
            monitorSerments.map(segment => {
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

function timestampToDate(ts) {
    var d = new Date();
    d.setTime(ts);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function dateToTimestamp(date) {
    var dateInMs = (new Date(date));
    dateInMs.setHours(0);
    return dateInMs.getTime();
}

function dateForInput(date) {
    var stringDate = date.getFullYear();
    stringDate += '-' + (('0' + (date.getMonth() + 1)).slice(-2));
    stringDate += '-' + date.getDate();
    return stringDate;
}

function getLabels(period, n) {
    var labels = [];

    var formatString = '';
    var additionalFormat = '';
    var cur = moment();
    var cur1 = moment();
    cur1.add(1, period);

    switch (period) {
        case 'hour':
            formatString = 'ddd h a';
            additionalFormat = 'h a';
            break;
        case 'day':
            formatString = 'ddd DD/MM';            
            break;
        case 'week':
            formatString = 'DD/MM';
            additionalFormat = 'DD/MM';
            break;
        case 'fortnight':
        //Moment.js not includes function for fortnight(2 weeks)
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

function getSum(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function numberWithCommas(number) {
    numberStr = number.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(numberStr))
    	numberStr = numberStr.replace(pattern, "$1,$2");
    return numberStr;
}