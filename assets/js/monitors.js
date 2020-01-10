function MonitorsInit() {
    var main = $("#monitors-page .main");
    var monitorsTable = $(".card-data");
    main.hide();
    var body = $(document.body);
    var loader = "<div class='loader'></div>";
    body.append(loader);
    var monitors = null;
    var trafic = null;
    (function() {
        $.when(
            $.ajax(request("GET_MONITORS", {}, function(r) {}, true)),
            $.ajax(
                request(
                    "GET_TRAFFIC_BY_DAYS",
                    { query: "days=" + 14 },
                    function(r) {},
                    true
                )
            )
        ).done(function(r1, r2) {
            if (!r1[0].success) {
                alertify.error("Failed to load monitors");
                return;
            }
            if (!r2[0].success) {
                alertify.error("Failed to load monitors");
                return;
            }
            monitors = r1[0].data;
            trafic = r2[0].data;
            $(".loader").remove();
            main.show();
            charts();
        });
    })();

    function charts() {
        if (monitors.length == 0) {
            monitorsTable.append(
                "<tr>" +
                    " <td>" +
                    " <i>No monitors</i>" +
                    "</td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "<td></td>" +
                    "</tr>"
            );
        } else {
            monitors.map(function(e, i) {
                monitorsTable.append(
                    "<tr id='mon-" +
                        i +
                        "'>" +
                        " <td class='mon-preview' id='preview-" +
                        i +
                        "'>" +
                        "</td>" +
                        "<td>" +
                        "<div class='name'> " +
                        e.name +
                        " </div>" +
                        "</td>" +
                        "<td class='trand'>" +
                        "<div class='chart-area'></div>" +
                        "</td>" +
                        "<td class='m-btns'>" +
                        "<a href='dashboard/monitors/view-" +
                        e.id +
                        "' id='view-b-i' class='view-btn'>View</a>" +
                        "</td>" +
                        "</tr>"
                );
                renderChart(i);
            });
        }
    }

    var duration = "day";
    var start = moment()
        .subtract(1, "week")
        .valueOf();
    var end = moment().valueOf();
    function renderChart(index) {
        var body = $("#monitors-page #mon-" + index + " .trand .chart-area");
        var preview = $("#monitors-page #mon-" + index + " #preview-" + index);
        body.append("<div class='l-w'>" + loader + "</div>");
        preview.append("<div class='l-w'>" + loader + "</div>");
        var id = monitors[index].id;

        request("GET_MONITOR_THUMBNAIL", { params: id }, function(r) {
            var thumbnail = r.data;
            var image = "data:image/jpg;base64," + thumbnail;
            $(
                "#monitors-page #mon-" + index + " #preview-" + index + " .l-w"
            ).remove();
            $(preview).append("<img src='" + image + "' alt='Preview'>");
        });

        var query =
            "start=" +
            start +
            "&end=" +
            end +
            "&monitor_id=" +
            id +
            "&duration=" +
            duration;
        (function() {
            $.when(
                $.ajax(
                    request(
                        "GET_TRAFFIC_ENTRIES",
                        { query: query },
                        function(r) {},
                        true
                    )
                ),
                $.ajax(
                    request(
                        "GET_IMPRESSION_ENTRIES",
                        { query: query },
                        function(r) {},
                        true
                    )
                ),
                $.ajax(
                    request(
                        "GET_GENDER_ENTRIES",
                        { query: query },
                        function(r) {},
                        true
                    )
                )
            ).done(function(r1, r2, r3) {
                if (!r1[0].success) {
                    alertify.error(r1[0].msg);
                    return;
                }
                if (!r2[0].success) {
                    alertify.error(r2[0].msg);
                    return;
                }
                if (!r3[0].success) {
                    alertify.error(r3[0].msg);
                    return;
                }
                trafficResult = r1[0];
                impressionResult = r2[0];
                genderResult = r3[0];

                var cur = moment();
                var n = 7;
                var labels = [];
                var data = [];
                var impressionData = [];
                var maleData = [];
                var femaleData = [];
                for (var i = 0; i < n; i++) {
                    data.push(0);
                    impressionData.push(0);
                    maleData.push(0);
                    femaleData.push(0);
                }
                while (n > 0) {
                    labels.push(cur.format("ddd"));
                    cur.subtract(1, "d");
                    n--;
                }
                trafficResult.data.map(function(x) {
                    var diff = moment
                        .duration(moment().diff(moment(x.time)))
                        .asDays();
                    data[data.length - Math.floor(diff)] += x.total;
                });
                impressionResult.data.map(function(x) {
                    var diff = moment
                        .duration(moment().diff(moment(x.time)))
                        .asDays();
                    impressionData[impressionData.length - Math.ceil(diff)] +=
                        x.total;
                });
                genderResult.data.map(function(x) {
                    var diff = moment
                        .duration(moment().diff(moment(x.time)))
                        .asDays();
                    maleData[maleData.length - Math.ceil(diff)] += x.males;
                    femaleData[femaleData.length - Math.ceil(diff)] +=
                        x.females;
                });
                dataGend(
                    labels.reverse(),
                    data,
                    impressionData,
                    maleData,
                    femaleData
                );
                $("#monitors-page #mon-" + index + " .trand .l-w").remove();
            });
        })();

        function dataGend(labels, data, impressionData, maleData, femaleData) {
            body.append(
                '<canvas class="chartjs-render-monitor monitor-graphic-1"></canvas>'
            );
            var canvas = $("#mon-" + index + " .trand canvas")[0];
            var ctx = canvas.getContext("2d");
            var gradientStroke = ctx.createLinearGradient(0, 230, 0, 50);
            gradientStroke.addColorStop(1, "rgba(72,72,176,0.1)");
            gradientStroke.addColorStop(0.4, "rgba(72,72,176,0.0)");
            gradientStroke.addColorStop(0, "rgba(119,52,169,0)"); //purple colors

            var d = {
                labels: labels,
                datasets: [
                    {
                        label: "Counted",
                        type: "line",
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
                        lineTension: 0.3,
                        data: data
                    },
                    {
                        label: "Views",
                        type: "line",
                        fill: true,
                        backgroundColor: gradientStroke,
                        borderColor: "#14bda8",
                        borderWidth: 2,
                        borderDash: [],
                        borderDashOffset: 0.0,
                        pointBackgroundColor: "#14bda8",
                        pointBorderColor: "rgba(255,255,255,0)",
                        pointHoverBackgroundColor: "#14bda8",
                        pointBorderWidth: 20,
                        pointHoverRadius: 4,
                        pointHoverBorderWidth: 15,
                        pointRadius: 4,
                        lineTension: 0.3,
                        data: impressionData
                    },
                    {
                        fill: true,
                        label: "Male",
                        backgroundColor: "rgba(31, 142, 241, 0.1)",
                        borderColor: "#1f8ef1",
                        borderWidth: 2,
                        borderDash: [],
                        borderDashOffset: 0.0,
                        pointBackgroundColor: "#12db66",
                        pointBorderColor: "rgba(255,255,255,0)",
                        pointHoverBackgroundColor: "#12db66",
                        pointBorderWidth: 20,
                        pointHoverRadius: 4,
                        pointHoverBorderWidth: 15,
                        pointRadius: 4,
                        lineTension: 0.3,
                        data: maleData
                    },
                    {
                        fill: true,
                        label: "Female",
                        backgroundColor: "rgba(241, 31, 146, 0.1)",
                        borderColor: "#f11f92",
                        borderWidth: 2,
                        borderDash: [],
                        borderDashOffset: 0.0,
                        pointBackgroundColor: "#f11f92",
                        pointBorderColor: "rgba(255,255,255,0)",
                        pointHoverBackgroundColor: "#f11f92",
                        pointBorderWidth: 20,
                        pointHoverRadius: 4,
                        pointHoverBorderWidth: 15,
                        pointRadius: 4,
                        lineTension: 0.3,
                        data: femaleData
                    }
                ]
            };
            var options = JSON.parse(JSON.stringify(chartExample2.options));
            options.scales.yAxes = [
                {
                    ticks: { beginAtZero: true, precision: 0 },
                    gridLines: {
                        drawBorder: false,
                        color: "rgba(29,140,248,0.0)",
                        zeroLineColor: "transparent"
                    }
                }
            ];
            var chart = new Chart(ctx, {
                type: "line",
                data: d,
                options: options
            });
        }
    }
}
