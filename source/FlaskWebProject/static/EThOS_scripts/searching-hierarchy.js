var names_order;
var summaries;
var json_tree;
var tree_dict;

//binary search tree

class TreeNode {
  constructor(value) {
    this.value = value;
    this.descendants = [];
  }
}
//takes json and returns a tree
function to_Tree(dict, names_order, current_node){
    
    var child_names = Object.keys(dict);
    console.log(child_names);
    if(child_names.length == 0){
        return(current_node);
    }else{
        for (child in child_names){
            var child_node = to_Tree(dict[child], names_order, new TreeNode(child));
            current_node.descendants.push(child_node);

         }
    }   
}

//end

function node_name_to_list(name, names_order, summaries){
    var list = [];
    for( char in name){
        if (name[char] != '-'){
            list.push([names_order[parseInt(name[char])], summaries[parseInt(name[char])]]);
        }
    }
    return list;
}
function node_name_to_abstract_list(name, names_order, summaries){
    var list = [];
    for( char in name){
        if (name[char] != '-'){
            list.push(summaries[parseInt(name[char])]);
        }
    }
    return list;
}

function keywordsRequest(side) {
    var abstracts_list = node_name_to_abstract_list(tree_dict['children'][side]['name'], names_order, summaries);

    console.log(abstracts_list);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            keywordGPTResponse(xmlHttp, side);
    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "keywordsRequest");
    FD.append("bodies", abstracts_list.toString());

    xmlHttp.open("POST", "/search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);
}

function summaryRequest(side) {
    var abstracts_list = node_name_to_abstract_list(tree_dict['children'][side]['name'], names_order, summaries);
    console.log(abstracts_list);
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            summaryGPTResponse(xmlHttp, side);
    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "summaryRequest");
    FD.append("bodies", abstracts_list.toString());


    xmlHttp.open("POST", "/search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);

}

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
    FD.append("papers", paper_list.toString);


    xmlHttp.open("POST", "/search", true); // false for synchronous request
    //xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);
}


function papers_response(xmlHttp_response) {
    var json_response = JSON.parse(xmlHttp_response.responseText);
    papers = [];
    for (var i = 0; i < json_response.paper_names.length; i++) {

        var thumnail_source = json_response.thumbnails[i].substring(16);
        var pdf_source = json_response.pdf_urls[i].substring(16);

        var PDF_Result_HTML = create_PDF_result_HTML(json_response.paper_names[i], json_response.previews[i], thumnail_source, pdf_source);
        papers.push[json_response.paper_names[i], json_response.previews[i],thumnail_source, pdf_source, PDF_Result_HTML]

    }
    return papers
}

function summaryGPTResponse(xmlHttp_response, side){
    var json_response = JSON.parse(xmlHttp_response.responseText);
    var text = json_response.keywords.choices[0].text
    console.log(text)
    let response_r =   document.getElementById("right_c_responses")
    let response_l =   document.getElementById("left_c_responses")
    let text_gpt = document.createElement('p')
    text_gpt.innerHTML = text
    if(side == 0){
        response_l.appendChild(text_gpt)
    }else{
        response_r.appendChild(text_gpt)
    }

}
function keywordGPTResponse(xmlHttp_response, side){
    var json_response = JSON.parse(xmlHttp_response.responseText);
    var text = json_response.keywords.choices[0].text
    console.log(text)
    let response_r =   document.getElementById("right_c_responses")
    let response_l =   document.getElementById("left_c_responses")
    let text_gpt = document.createElement('p')
    text_gpt.innerHTML = text
    if(side == 0){
        response_l.appendChild(text_gpt)
    }else{
        response_r.appendChild(text_gpt)
    }

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
}
//function to send the keywords to the flask server
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
    var json_response = JSON.parse(xmlHttp_response.responseText);
    tree_data = json_response;
    var linkage = tree_data[0];
    names_order = tree_data[1];
    
    summaries = tree_data[2];
    json_tree = tree_data[3];
    tree_dict = JSON.parse(json_tree);
    //cut out root node
    tree_dict = tree_dict['children'][0];

   
   
    var tree_box = document.getElementById("tree");
    tree_box.style = "display: inline-block;"
    refreshImage('den', '/get_image');

    //dump the json
    var summaries_para = document.getElementById('summaries');
    summaries_para.innerHTML = tree_data;



    var choices_zone = document.getElementById("choices-list");

    var left = node_name_to_list(tree_dict['children'][0]['name'], names_order, summaries);
    var right = node_name_to_list(tree_dict['children'][1]['name'], names_order, summaries);

    
    //list titles of theses in left and right subclusters
    for( x in left){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(left[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(left[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("left-list").appendChild(row);

    }

    for( x in right){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(right[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(right[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("right-list").appendChild(row);

    }




    
    

    
}
function keyword_response_2(xmlHttp_response){
    var json_response = JSON.parse(xmlHttp_response.responseText);
    tree_data = json_response;
    var linkage = tree_data[0];
    names_order = tree_data[1];
    
    summaries = tree_data[2];
    json_tree = tree_data[3];
    tree_dict = JSON.parse(json_tree);
    //cut out root node
    tree_dict = tree_dict['children'][0];

   var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            papers = papers_response(xmlHttp);
            console.log("good serch");
            console.log(papers)
   
    var tree_box = document.getElementById("tree");
    tree_box.style = "display: inline-block;"
    refreshImage('den', '/get_image');

    //dump the json
    var summaries_para = document.getElementById('summaries');
    summaries_para.innerHTML = tree_data;



    var choices_zone = document.getElementById("choices-list");

    var left = node_name_to_list(tree_dict['children'][0]['name'], names_order, summaries);
    var right = node_name_to_list(tree_dict['children'][1]['name'], names_order, summaries);

    
    //list titles of theses in left and right subclusters
    for( x in left){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(left[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(left[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("left-list").appendChild(row);

    }

    for( x in right){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(right[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(right[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("right-list").appendChild(row);

    }




    }
    xmlHttp.ontimeout = function (e) {
        dev_error("Error contacting server!");
    };
    var FD = new FormData();
    FD.append("message_tag", "papers_request_h");
    FD.append("ticket", 17);
    FD.append("papers", names_order.toString());


    xmlHttp.open("POST", "/search", true); // false for synchronous request
    xmlHttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttp.send(FD);

    
}
function left_traverse(){
    if (tree_dict['name'].length != 1){
    tree_dict_new = tree_dict['children'][0];
    
    if (tree_dict_new['name'].length >=3){

    document.getElementById("left-list").innerHTML = '';
    document.getElementById("right-list").innerHTML = '';
    document.getElementById("right_c_responses").innerHTML = '';
    document.getElementById("left_c_responses").innerHTML = '';


    var left = node_name_to_list(tree_dict_new['children'][0]['name'], names_order, summaries);
    var right = node_name_to_list(tree_dict_new['children'][1]['name'], names_order, summaries);

    
    //list titles of theses in left and right subclusters
    for( x in left){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(left[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(left[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("left-list").appendChild(row);

    }

    for( x in right){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(right[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(right[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("right-list").appendChild(row);


}
    //update tree dictionary

tree_dict = tree_dict_new
}
else{
    console.log('less than three theses')
    }

}
else{console.log('cant go deeper')}
}
function right_traverse(){
    if (tree_dict['name'].length != 1){
        tree_dict_new = tree_dict['children'][1];
    
    if (tree_dict_new['name'].length >=3){
    document.getElementById("right_c_responses").innerHTML = '';
    document.getElementById("left_c_responses").innerHTML = '';

    document.getElementById("left-list").innerHTML = '';
    document.getElementById("right-list").innerHTML = '';



    var left = node_name_to_list(tree_dict_new['children'][0]['name'], names_order, summaries);
    var right = node_name_to_list(tree_dict_new['children'][1]['name'], names_order, summaries);

    
    //list titles of theses in left and right subclusters
    for( x in left){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(left[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(left[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("left-list").appendChild(row);

    }

    for( x in right){
    var row = document.createElement("TR");                 // Create a <li> node
    var node = document.createElement("TD");                 // Create a <li> node
    var textnode = document.createTextNode(right[x][0]);         // Create a text node
    node.appendChild(textnode);  
    var node2 = document.createElement("TD");                 // Create a <li> node
    var textnode2 = document.createTextNode(right[x][1]);         // Create a text node
    node2.appendChild(textnode2);                               // Append the text to <li>
    row.appendChild(node)
    row.appendChild(node2)
    document.getElementById("right-list").appendChild(row);


    }
    //update tree dictionary
    tree_dict = tree_dict_new

}else{
    console.log('less than three theses')
    }

}
else{console.log('cant go deeper')}
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





//function to handle digging down the bst to find a useful cluster
function dig_tree(theses_summary, theses_title, tree){

} 

function set_n_keys(){
    let number = parseInt(document.getElementById("n-keys").value)
    let keyList = document.getElementById("keys")
    console.log(number)
    console.log(keyList.innerHTML)
    keyList.innerHTML = ""
    for (let x = 0; x<number; x++){
        console.log((x+1).toString() )
        keyList.innerHTML += '<div class="form-group" id="keyword_group_'+ (x+1).toString() +'">';
         keyList.innerHTML +='    <input type="text" name="keyword'+ (x+1).toString() +'" maxlength="100">';
        keyList.innerHTML +='    <input type="range" name="weight'+ (x+1).toString() +'" value="50" min="1" max="100" oninput="this.nextElementSibling.value = this.value">';
         keyList.innerHTML +='        <output>50</output>';
         keyList.innerHTML +='</div>';

    }
    console.log(keyList.innerHTML)
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



