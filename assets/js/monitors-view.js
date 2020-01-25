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
            addOptionsBlock(r3[0].data);


            getChartData(id);

        });

        // setInterval(() => { getChartData(id); }, 15000);
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
    // addOptionsBlock();
}


function getChartData(id) {
    var displayType = $('#view-page .display-dropdown input')[0].value.toLowerCase();
    if (displayType == 'custom')
        getCustomChartData(id);
    else
        getSegmentsChartData(id);
}

function getCustomChartData(id) {
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
        btnMain.show();
        $('.loader').remove();
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
        renderChart(chartData);

        $('#view-page .chart-selector div').click(function (e) {
            var selectorBlock = $('#view-page .chart-selector');
            for (selector of selectorBlock[0].children) {
                if (e.target == selector)
                    selector.classList.add('active');
                else
                    selector.classList.remove('active');
            }
            renderChart(chartData);
        });
    });
}

function getSegmentsChartData(id) {
    var period = $('#view-page .period-dropdown .dropdown-input')[0].value.toLowerCase();
    var sChildren = $('#view-page .segment-dropdown .dropdown-visible .variants')[0].children;

    var segments = [];
    for (var i = 0; i < sChildren.length - 1; i++) {
        segments.push({ start: sChildren[i].dataset.start, end: sChildren[i].dataset.end, name: sChildren[i].textContent });
    }
    // console.log(segments)

    var queries = [];
    for (segment of segments) {
        queries.push(`monitor_id=${id}&start=${segment.start}&end=${segment.end}&period=${period}`);
    }

    console.log(queries)
    var trafficArr = [];
    var impressionArr = [];
    var genderArr = [];
    $.when(
        ...getRequestsArr('traffic', queries),
        ...getRequestsArr('traffic', queries),
        ...getRequestsArr('traffic', queries)).done(function (...result) {
            console.log(result)
            debugger
            for (var i = 1; i <= segments.length; i++) {
                for (var j = 1; j <= 3; j++){
                    if (j == 1)
                        trafficArr.push(result[(i * j) - j])
                    else if (j== 2)
                        impressionArr.push(result[(i * j) - j])
                    else if (j == 3)
                        genderArr.push(result[(i * j) - j]);
                } 
            }
            console.log(trafficArr);
            console.log(impressionArr);
            console.log(genderArr);
            



    });











}




function renderChart(chartData) {
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
        modal.fadeOut();
    });

    modal.fadeIn();
}

function showViewPageStats(chartData) {
    $('#view-page .options-block .stats div:nth-child(1) span')[0].textContent = numberWithCommas(getSum(chartData.trafficData));
    $('#view-page .options-block .stats div:nth-child(2) span')[0].textContent = numberWithCommas(getSum(chartData.postitveData));
    $('#view-page .options-block .stats div:nth-child(3) span')[0].textContent = numberWithCommas(getSum(chartData.maleData)) + "/" + numberWithCommas(getSum(chartData.femaleData));
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

function addOptionsBlock(segments) {
    var id = getCookie("view_token");
    var displayTypes = ['Custom', 'By segment'];
    var displayVariants = `<div class="dropdown-list-variant active" data-id="${0}">${displayTypes[0]}</div>`;
    for (var i = 1; i < displayTypes.length; i++) {
        displayVariants += `<div class="dropdown-list-variant" data-id="${i}">${displayTypes[i]}</div>`
    }

    var periods = ["Hour", "Day", "Week", "Fortnight", "Month", "Year"];
    var periodVariants = `<div class="dropdown-list-variant active" data-id="${0}">${periods[0]}</div>`;
    for (var i = 1; i < periods.length; i++) {
        periodVariants += `<div class="dropdown-list-variant" data-id="${i}">${periods[i]}</div>`
    }

    var segmentsVariants = '';
    for (var i = 0; i < segments.length; i++) {
        segmentsVariants += `<div class="dropdown-list-variant" data-id="${i}" data-start="${segments[i].start}" data-end="${segments[i].end}">${segments[i].name}</div>`
    }

    var stringDate = dateForInput(new Date());

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
        '<i class="fa fa-chevron-down selector" aria-hidden="true"></i>	' +
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
        `<input class="dropdown-input" value="${periods[0]}"></input>` +
        '</div > ' +
        '<div class = "selectors">' +
        '<i class="fa fa-chevron-down selector" aria-hidden="true"></i>	' +
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
        '<i class="fa fa-times selector" aria-hidden="true"></i>	' +
        '<i class="fa fa-chevron-down selector" aria-hidden="true"></i>	' +
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


    $('#view-page .refresh-btn').click(function () {
        getChartData(id);
    });

    $('#view-page #startInput').change(function () { getChartData(id); })
    $('#view-page #endInput').change(function () { getChartData(id); })
}

function timestampToDate(ts) {
    var d = new Date();
    d.setTime(ts);
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
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

    $(location).find('.dropdown-list-variant').click(function (e) {
        if (e.target.classList[1] !== 'no-options') {
            var dropdownList = $(location).find('.dropdown-list')[0];

            for (elem of dropdownList.children) {
                elem.classList.remove('active');
            }

            $(this)[0].classList.add('active');
            $(location).find('input')[0].value = $(this)[0].textContent;
            dropdownList.classList.toggle('active');

            if (location.className.includes('display')) {
                $('#view-page .options .form-group:nth-child(5)')[0].classList.toggle('active');
                $('#view-page .options .form-group:nth-child(3)')[0].classList.toggle('active');
                $('#view-page .options .form-group:nth-child(4)')[0].classList.toggle('active');
            }

        }
    });
}


function addSegmentDropdown(location) {
    $(location).find('.dropdown-list')
    $(location).find('.dropdown-visible').click(function (e) {
        if (e.target !== $('.selectedVariant .fa')[0]) {
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
        input.before(`<div class = "selectedVariant" data-start=${variant.dataset.start} data-end=${variant.dataset.end} data-id=${variant.dataset.id}><div class = "text">${value}</div><i class="fa fa-times" aria-hidden="true"></i></div>`);

        $(location).find(' .selectedVariant .fa-times').click(function () {
            $(location).find(` .dropdown-list-variant[data-id="${this.parentNode.dataset.id}"]`)[0].classList.remove('active');
            this.parentNode.remove()
        });

        $('#view-page .selectors .fa-times').click(function (e) {
            e.stopPropagation();
            var variants = $(location).find('.variants')[0].children;
            for (var i = 0; i < variants.length - 1; i++) {
                $(variants[i]).find('.fa').click();
            }
        });
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