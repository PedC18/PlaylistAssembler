var redirect_uri = 'http://localhost:3000/playlist/'; 

var spotify_client_id = '9f6d09d009334625827646cd4ac23d96';
var client_secret = '';
var accessToken = null;
var refreshToken = null;

const TOKEN = "https://accounts.spotify.com/api/token";
const AUTHORIZE_SPOTIFY = "https://accounts.spotify.com/authorize"
const SPFY_SEARCH = "https://api.spotify.com/v1/search";
const SPFY_PROFILE = "https://api.spotify.com/v1/me"
const SPFY_CREATE_PLAYLIST = "https://api.spotify.com/v1/users/"
const SPFY_ADD_SONG = "https://api.spotify.com/v1/playlists/"

//User id for modify his profile
var userId;


//Lists for alocate all songs
var songList = [];
var songsIds = [];
var not_found = 0;
//Playlist parameters
var playlistTitle;
var playlistId;

//Variable string for the list of songs
/** Integer "streaming" to indicate the streaming service, obeys the following pattern: 
 *  -1 : not setted
 *   1 : spotify
 *   2 : deezer
 *   3 : applemusic
 */ 
var streaming = -1; 


export function onPageLoad(){
    var queryString = window.location.search 
    if(queryString.length > 0){
        debugger;
        streaming = localStorage.getItem("streaming");
        //if(streaming === null){window.history.pushState("", "", redirect_uri);}
        switch(streaming){
            case "1":
                spfy_handleRedirect(queryString);
        }
        
    }
}




//Funcoes API Spotify
function handleSpfyAuthResponse(){
    if ( this.status === 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token !== undefined ){
            accessToken = data.access_token;
            localStorage.setItem("access_token", accessToken);
        }
        if ( data.refresh_token  !== undefined ){
            refreshToken = data.refresh_token;
            localStorage.setItem("refresh_token", refreshToken);
        }
        spfy_getUserId()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    let auth = spotify_client_id + ':' + client_secret;
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(auth));
    xhr.send(body);
    xhr.onload = handleSpfyAuthResponse
}

async function spfy_fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + spotify_client_id;
    body += "&client_secret=" + client_secret;
    await callAuthorizationApi(body);
}


function spfy_handleRedirect(qstring){
    const urlparam = new URLSearchParams(qstring);
    var spfy_code = urlparam.get('code');
    spfy_fetchAccessToken(spfy_code);
    window.history.pushState("", "", redirect_uri);
}

export function requestAuthSpotify(){
    streaming = 1;
    localStorage.setItem("streaming", streaming.toString());
    //setPlaylistInfo();
    let url = AUTHORIZE_SPOTIFY;
    url += "?client_id=" + spotify_client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=playlist-modify-public user-read-private";
    window.location.href = url;
}

function spfy_callAPI(method, url, body, callback){
    accessToken = localStorage.getItem("access_token");
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken)
    xhr.send(body);
    xhr.onload = callback;
}

function handleSpfyAddRes(){
    var data = JSON.parse(this.responseText);
    if(this.status == 201){alert("Playlist montada com sucesso.")}
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function spfy_addSongs(ids){
    let url = SPFY_ADD_SONG;
    url += playlistId + '/tracks';
    let body = JSON.stringify({"uris" : ids});
    debugger;
    spfy_callAPI('POST', url, body, handleSpfyAddRes);
}

function handleSpfySearchRes(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        var songId = "spotify:track:";
        if(data.tracks.total == 0){alert("Music not found."); not_found++;}
        else {
            songId += data.tracks.items[0].id.toString();
            songsIds.push(songId);
        }
        if(songList.length == songsIds.length + not_found){spfy_addSongs(songsIds);}
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function spfy_searchSongs(){
    //Get all music spotify Ids
    for(var i in songList){
        let url = SPFY_SEARCH + "?q=";
        url += songList[i];
        url += "&type=track";
        url += "&limit=1";
        setTimeout(spfy_callAPI('GET', url, null, handleSpfySearchRes), 100);
    }
}

function handleSpfyCreatePlaylistRes(){
    if(this.status === 201){
        var data = JSON.parse(this.responseText);
        playlistId = data.id;
        localStorage.setItem("playlist_id", playlistId);
        spfy_searchSongs();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

export function createPlaylist(title, songs){
    debugger;
    playlistTitle = title;
    songList = songs;
    localStorage.setItem("songList", songList);
    switch(streaming){
        case "1":
            spfy_createPlaylist();
    }
}


function spfy_createPlaylist(){
    if(playlistTitle == ""){playlistTitle = "QUEBRAPASSOS BALA DE EUCALIPTO";}
    let desc = "Playlist created using PlaylistAssembler.";
    let url = SPFY_CREATE_PLAYLIST + userId + "/playlists";
    let body = JSON.stringify({"name": playlistTitle + "" , "description": desc});
    spfy_callAPI('POST', url, body, handleSpfyCreatePlaylistRes);
}


function handleSpfyProfileRes(){
    if ( this.status === 200 ){
        var data = JSON.parse(this.responseText);
        userId = data.id;
        localStorage.setItem("user_id", userId);
        console.log(userId);
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function spfy_getUserId(){
    spfy_callAPI('GET', SPFY_PROFILE, null, handleSpfyProfileRes);
}