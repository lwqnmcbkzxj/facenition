$(document).ready(function() {
    var main = $(".main");
    main.hide();
    var monitors = null;
    var trafic = null;
    (function() {
        // request("GET_MONITORS", {}, function(r) {
        //     console.log(r);
        //     if (!r.success) {
        //         alertify.error("Failed to load monitors");
        //         return;
        //     }
        //     monitors = r.data;
        //     console.log(monitors);
        // });
        // request("GET_TRAFFIC_BY_DAYS", { query: "days=" + 14 }, function(r) {
        //     if (!r.success) {
        //         alertify.error("Failed to load monitors");
        //         return;
        //     }
        //     trafic = r.data;
        // });
    })();
});
