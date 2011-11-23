(function(){
    var script_elements = document.getElementsByTagName('script')
      , this_script, match_absolute, host
      , i = script_elements.length;

    while(i--) {
        if ((script_elements[i].getAttribute("src") || "").indexOf("/probe-include.js") > -1) {
            this_script = script_elements[i];
            break;
        }
    }

    match_absolute = this_script.getAttribute("src").match(new RegExp('https?://[^/]*'))
    host = (match_absolute && match_absolute[0]) || window.location.protocol + "//" + window.location.host;

    var f = document.createElement('iframe');
    f.setAttribute('style', 'position: absolute; left: -500px; top: -500px;');
    f.setAttribute('src', host + "/iframe.html");

    document.getElementsByTagName("body")[0].appendChild(f);

})();