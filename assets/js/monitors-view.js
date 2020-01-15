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


            var toggleMonitorBtn = $('#view-page .switch input');
            toggleMonitorBtn.click(function (e) {
                monitorToggle(e.target.dataset.id)
            });
            var addSegmentBtn = $('#view-page .add-segment');
            addSegmentBtn.click(function (e) {
                e.preventDefault();
                e.stopPropagation();
                showModal();
            });
        });












        var duration = "day";
        var start = 1577826000000;  //01.01.2020
        var end = 1579121999999;    //15.01.2020
        var period = 1577826000000; //01.01.2020

        let query = `monitor_id=${id}&start=${start}&end=${end}&period=day`;

        
        $.when(
            $.ajax(request("GET_TRAFFIC_ENTRIES_V2", { query }, function (r) { }, true)),
            $.ajax(request("GET_IMPRESSION_ENTRIES_V2", { query }, function (r) { }, true)),
            $.ajax(request("GET_GENDER_ENTRIES_V2", { query }, function (r) { }, true)),
           
          
        ).done(function (r1,r2,r3) {
            console.log(r1);
            console.log(r2);
            console.log(r3);
           
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

            traficResults = r1[0].data;            
            impressionResults = r2[0].data;
            genderResults = r3[0].data;

            
            loadChart();
        });
    })();
}


function loadChart() {

}

function showModal() {
    var modal = $("#view-page .modal");
    var title = $("#view-page .modal .modal-title");
    var content = $("#view-page .modal .modal-body");
    var footer = $("#view-page .modal .modal-footer");

    var nowDate = new Date();
    var stringDate = dateForInput(nowDate);
    console.log(stringDate)

    title.html("Create segment");
    content.html(
        '<form class=""> <div class="position-relative form-group"><label for="segment_name" class="">Name</label><input id="segment_name" name="segment_name" type="text" class="form-control"value=""> </div><div class="position-relative form-group"><label for="segment_start" class="">Start date</label><input id="segment_start" name="segment_start" max="'+ stringDate +'" type="date" class="form-control" value="'+ stringDate +'"> </div><div class="position-relative form-group"><label for="segment_end" class="">End date</label><input id="segment_end"name="segment_end" min="'+ stringDate +'" type="date" class="form-control"value="'+ stringDate +'"></div></form>'
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
            }, function (r1) { }, true)),

        ).done(function (r1) {
            console.log(r1);
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
    var dateInMs = (new Date(date)).getTime();
    return dateInMs;
}


function dateForInput(date) {

    var stringDate = date.getFullYear();
    stringDate += '-' + (('0' + (date.getMonth() + 1)).slice(-2));
    stringDate += '-' + date.getDate();
    return stringDate;
}