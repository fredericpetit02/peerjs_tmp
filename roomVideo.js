const selfVideoContainer = document.getElementById("selfVideoContainer");
const distantVideoContainer = document.getElementById("distantVideoContainer");
const myVideo = document.createElement("video");
myVideo.muted = true;

//  ____________________________________________________________
// |                                                            |*
// |               PeerJS                                       |*
// |____________________________________________________________|*
const customGenerationFunction = (Math.random().toString(36) + '-chipouille').substr(2);
const myPeer = new Peer(customGenerationFunction, {
    secure: true, 
    host: 'xxxxxxxxxxxx', 
    port: xxxxx, 
    secure: true, 
    path: '/peerjs', 
    debug: 3, 
    config: {"iceServers": [
        {
            "iceTransportPolicy": "relay",
            "urls": "stun:stun.l.google.com:19302"
        },
        {
            "iceTransportPolicy": "relay",
            "urls": 'turn:numb.viagenie.ca',
            "credential": 'muazkh',
            "username": 'webrtc@live.com'
        }
      ],
    }
});
//const myPeer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443, debug:3});
let peers = {};

//  ____________________________________________________________
// |                                                            |*
// |               navigator.mediaDevices()                     |*
// |____________________________________________________________|*
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        let myPeerDiv = document.getElementById('myPeerId');
        if (myPeerDiv) {
            myPeerDiv.append(myPeer.id); 
        }
        appConsole("ROOMS => ITEM 'stream' ↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴↴", stream);
        addVideoStream(myVideo, stream, "self");

        // Answer the call, providing our mediaStream
        myPeer.on("call", (call) => {
            appConsole("ROOMS => answer the call.");
            call.answer(stream);
            const video = document.createElement("video");
            call.on("stream", (userVideoStream) => {
                addVideoStream(video, userVideoStream, "distant");
            }, function(err) {
                appConsole("ROOMS => Fail 1", err);
            });
        });

        // user-connected event
        socket.on("user-connected", (userId) => {
            appConsole("ROOMS =>  PeerJS (distant) user "+userId+" connected to the current room.");
            connectToNewUser(userId, stream);
        });  
});

//  ____________________________________________________________
// |                                                            |*
// |               PeerJS STARTING (w. join-room event)         |*
// |____________________________________________________________|*
myPeer.on("open", (id) => {
    appConsole("ROOMS => Hello ! (roomId "+ROOM_ID+" :: PeerJS (self) user "+id+".");
    socket.emit("join-room", ROOM_ID, id);
});

//  ____________________________________________________________
// |                                                            |*
// |               SOCKET.IO                                    |*
// |____________________________________________________________|*
socket.on("user-disconnected", (userId) => {
    appConsole("ROOMS => Bye ! (userId "+userId+".");
    if (peers[userId]) {
        peers[userId].close();
    }
});

//  ____________________________________________________________
// |                                                            |*
// |               connectToNewUser()                           |*
// |____________________________________________________________|*
function connectToNewUser(userId, stream) {
    appConsole("ROOMS => connectToNewUser() called by PeerJS (distant) user "+userId+".");
    // Call a peer, providing our mediaStream
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");
    console.log(call);
    // after here, problems ...
    call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream, "distant");
    }, function(err) {
        console.log("ROOMS => Fail 2", err);
    });
    call.on('close', () => {
        video.remove();
    });
    peers[userId] = call;
}

//  ____________________________________________________________
// |                                                            |*
// |               addVideoStream()                             |*
// |____________________________________________________________|*
function addVideoStream(video, stream, origin) {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    // test origin
    if (origin === "self") {
        selfVideoContainer.append(video);
        appConsole("ROOMS => function addVideoStream (self) addevent.");
    } else {
        distantVideoContainer.append(video);
        appConsole("ROOMS => function addVideoStream (distant) addevent.");
    }
}
