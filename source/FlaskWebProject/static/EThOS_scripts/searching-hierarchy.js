
function papersRequest(paper_list) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            papers_response(xmlHttp);
    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "papers_request");
    FD.append("ticket", 17);
    FD.append("papers", paper_list.toString());


    xmlHttp.open("POST", "/search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);
}


function summarisationRequest(paper_name) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            summarisation_response(xmlHttp);
    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "summarisation_request");
    FD.append("paper_name", paper_name);


    xmlHttp.open("POST", "/search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);
}
function summarisation_response(xmlHttp_response) {
    var json_response = JSON.parse(xmlHttp_response.responseText);

    $("#summarisation-title").text( json_response.title);
    $("#summarisation-body").text(json_response.summarisation);


}


function submit_keywords() {


    console.log("Submitting keywords");

    keywordsform = document.getElementById("keywords");
    var formData = new FormData(keywordsform);
    console.log(formData);
    var object = {};
    formData.forEach((value, key) => {
        // Reflect.has in favor of: object.hasOwnProperty(key)
        if(!Reflect.has(object, key)){
            object[key] = value;
            return;
        }
        if(!Array.isArray(object[key])){
            object[key] = [object[key]];    
        }
        object[key].push(value);
    });
    var json = JSON.stringify(object);
    console.log(json);
    send_keywords(json)
    event.preventDefault();
    transition_to_start();
}

function send_keywords(keyword_data) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            keyword_response(xmlHttp);
    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "keywords");
    FD.append("data", keyword_data);

    xmlHttp.open("POST", "/hierachy_search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);
}

function keyword_response(xmlHttp_response){
    console.log("good");

    var json_response = JSON.parse(xmlHttp_response.responseText);
    tree_data = json_response;
    console.log(tree_data)
    var tree_box = document.getElementById("tree");
    tree_box.style = "display: inline-block;"
    refreshImage('den', '/get_image');

    var summaries_para = document.getElementById('summaries');
    summaries_para.innerHTML = tree_data;
    console.log("done");
}
function submit_search(event) {
    request_all_papers_in_ticket();
    event.preventDefault();
    transition_to_results(title="Showing All Results");
}

function refreshImage(imgElement, imgURL){    
    // create a new timestamp 
    var timestamp = new Date().getTime();  
  
    var el = document.getElementById(imgElement);  
    console.log(el)
    var queryString = "?t=" + timestamp;    
   
    el.src = imgURL + queryString;    
}    

function create_PDF_result_HTML(paper_name ,preview, thumbnail_url, pdf_url) {
    var preview_split = preview.split(/\r?\n/);
    var preview_first_line = preview_split[0];
    var preview_rest = "";
    if (preview_split.length > 1) {
        for (var i = 1; i < preview_split.length; i++) {
            if (i == preview_split.length - 1) {
                preview_rest += preview_split[i];
            } else {
                preview_rest += preview_split[i] + "\n";
            }
            
        }
    }

    var PDF_Result_HTML =
        "<div class='row result-row'>" +
            "<div class='col-md-auto'>" +
            "<a href='#' onclick='transition_to_pdf_preview(\"" + pdf_url +"\")'>" +
                "<img src='" + thumbnail_url + "' class='rounded-lg pdf-thumbnail'>" +
            "</a>" +
            "</div>" +
            "<div class='col'>" +
            "<div class='card-block'>" +
        "<h2 class='card-title'>" + preview_first_line + "</h2>" +
            "<p style='margin:0;'>Summary:</p>" +
            "<p class='card-text'>" + preview_rest +"</p>" +
            //"<p class='card-text'>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>" +
            "<a href='#' class='btn btn-primary' onclick='transition_to_pdf_preview(\"" + pdf_url +"\")'>Preview PDF</a>" +
            "<a href='#' class='btn btn-primary' onclick='transition_to_summarisation(\"" + paper_name +"\")'>View Abstract</a>" +
            "<a href='" + pdf_url + "' target='_blank' class='btn btn-primary'>Download</a>" +
            "</div>" +
            "</div>" +
        "</div>";
    return PDF_Result_HTML;
}
