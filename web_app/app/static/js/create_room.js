console.log("Create Room JS successfully loaded.");

var socket = io.connect('http://' + document.domain + ":" + location.port);

const pause = time => new Promise(resolve => setTimeout(resolve, time));
var CODE; 

// connect create room button to function
$( "#create_room_button" ).on("click", create_room);

socket.on('add_player_to_lobby', (name) => {
    console.log("added player!");
    add_player_to_lobby(name);
});

socket.on('remove_player_from_lobby', (name) => {
    remove_player_from_lobby(name);
});


function create_room(){
    let game_options = get_game_options();
    let code = create_room_code();
    CODE = code;
    game_options.code = code;

    $('#create_room_options').remove();
    // ask server to create game session
    socket.emit('create_game', game_options, function(val) {
	add_lobby_html(val);
	add_start_game_button();
    });
}


function get_game_options(){
    var game_opts = Object();

    // get game mode
    var ele = $("input[name='game_mode']");
    var mode;
    for (i = 0; i < ele.length; i++){
	if (ele[i].checked){
	    mode = ele[i].value;
	    break;
	}
    }
    game_opts.mode = mode;

    return game_opts;
}

function create_room_code(){
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var code = "";
  for (i = 0; i < 4; i++){
    index = Math.floor(Math.random() * alphabet.length);
    code += alphabet[index];
  }
  return code;
}


function add_lobby_html(code){
    room_container = $( "#room_container" );
    room_container.append('<h2 id="room_id">Room ID: </b2>');
    room_container.append('<h2>Connected Players:</p>');
    room_container.append('<ul id="player_list"/>');
    $("#room_id").append(code);
}

function add_player_to_lobby(name){
    console.log("added  player:", name);
    $('#player_list').append("<li>" + name + "</li>");
}

function remove_player_from_lobby(name){
    console.log("removing player from lobby!");
    console.log("name:", name);
    var ele = $("#player_list");
    for (i = 0; i < ele.length; i++){
	console.log(ele[i].innerText);
	if (ele[i].innerText === name){
	    console.log("found it!");
	    ele[i].remove();
	}
    }
}

function display_score(data){
    const title = "<h3>Score:</h3>";
    const score_board = "<ul id=score_board/>";
    var counter_display = '<h3 id="counter_display">Next round starts in ';
    counter_display += '<b id="count_number">5</b> seconds</h3>';
    let players = data['players'];
    console.log(players);
    $('#room_container').empty();
    $('#room_container').append(title);
    $('#room_container').append(score_board);
    for (player of players){
	console.log("name", player['name']);
	console.log("score", player['score']);
	$('#score_board').append('<li>' + player['name'] + " " +  player['score'] + '</li>');
    }
    console.log(counter_display);
    $('#room_container').append("<br><br>");
    $('#room_container').append(counter_display);
    countdown(5).then(request_trivia);
}

function request_trivia(){
    socket.emit('request_trivia', get_code(), function(trivia){
	present_trivia(trivia);
    });
}

function present_trivia(trivia){
    console.log(trivia);
    const time_board = '<h3><b id="count_number">30</b> seconds to answer</h3>';
    $('#room_container').empty();
    $('#room_container').append("<b>" + trivia + "</b>");
    $('#room_container').append("<br><br>");
    $('#room_container').append(time_board);
    prompt_response();
    countdown(30).then(round_finish);
}

function prompt_response(){
    socket.emit("prompt_response", get_code());
}

function round_finish(){
    socket.emit("answer_timeout", get_code());
    socket.emit("get_answers", get_code(), function(data){
	display_answer(data);
    });
}

function display_answer(data){
    // TODO
    console.log("got answer!");
    const trivia_answer = '<h3>Answer: ' + data['answer'] + '</h3>';
    const responses = '<h3>Responses:</h3>';
    const answer_list = '<ul id="answer_list"></ul>';
    $('#room_container').empty();
    $('#room_container').append(trivia_answer);
    $('#room_container').append("<br><br>");
    $('#room_container').append(responses);
    $('#room_container').append(answer_list);
    for (var player in data['player_answers']){
	let li = '<li>' + player + ': ';
	li += data['player_answers'][player]['answer'];
	if (data['player_answers'][player]['correct']){
	    li += ' (Correct)';
	} else {
	    li += ' (Incorrect)';
	}
	li += '</li>';
	$('#answer_list').append(li);
    }
    countdown(5).then( function(){
	socket.emit('request_scores', get_code(), function(data){
	    display_score(data);
	});
    });
}

async function countdown(seconds){
    let counter = seconds;
    while (counter > 0){
	await pause(1000);
	counter--;
	$('#count_number').text(counter.toString());
    }
}

function add_start_game_button(){
    let btn = '<button type=button id="start_game_btn"> ' + "Start Game!" + "</button>";
    $('#room_container').append(btn);
    $('#start_game_btn').on('click', start_game);
}

function get_code(){
    //return $('#room_id').text().replace("Room ID: ", "");
    return CODE;
}

function start_game(){
    console.log("starting game!");
    // TODO: error check (make sure there are players)
    console.log(get_code());
    socket.emit("start_game", get_code(), data => display_score(data));
}