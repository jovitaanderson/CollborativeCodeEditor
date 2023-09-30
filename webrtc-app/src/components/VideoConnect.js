import React, { useEffect, useState, useRef } from "react";
import "../css/videochat.css";
import { Link } from "react-router-dom";

import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";

import Peer from "simple-peer";
import { CopyToClipboard } from "react-copy-to-clipboard";

//CSS
import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import IconButton from "@mui/material/IconButton";
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import HomeIcon from '@mui/icons-material/Home';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PersonIcon from '@mui/icons-material/Person';


import io from "socket.io-client";
const IO_PORT = 5000;
const socket = io.connect(`http://localhost:${IO_PORT}`); //Connect to backend socket.io server

const useStyles = makeStyles((theme) => ({
  circleButton: {
    borderRadius: "50%",
    width: "64px",
    height: "64px",
    backgroundColor: "#E2DAC4",
    "&:hover": {
      backgroundColor: "#D9C19D", 
    },
    "&:active": {
      backgroundColor: "#A32A1F", 
    },
  },
  textfield: {
    backgroundColor: "#E2DAC4",
    width: "200px",
  }
}));

function VideoConnect() {
  const classes = useStyles();
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [otherStream, setOtherStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  //const editorRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [otherMicOn, setOtherMicOn] = useState(true);
  const [otherCameraOn, setOtherCameraOn] = useState(true);

  const [editorText, setEditorText] = useState("");

  useEffect(() => {
    const getOtherMediaWithStatus = async () => {
      try {
        const otherStream = navigator.mediaDevices.getUserMedia({
          video: otherCameraOn,
          audio: otherMicOn,
        });
        setOtherStream(otherStream);
        userVideo.current.srcObject = otherStream;
      } catch (err) {
        if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          //required track is missing
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          //webcam or mic are already in use
        } else if (
          err.name === "OverconstrainedError" ||
          err.name === "ConstraintNotSatisfiedError"
        ) {
          //constraints can not be satisfied by avb. devices
        } else if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          //permission denied in browser
        } else if (err.name === "TypeError" || err.name === "TypeError") {
          //empty constraints object
        } else {
          console.error("Error accessing user media:", err);
        }
      
        const otherStream = null;
        setOtherStream(otherStream);
        userVideo.current.srcObject = otherStream;
      }
    };

    const getUserMediaWithStatus = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraOn,
          audio: micOn,
        });
        setStream(stream);
        myVideo.current.srcObject = stream;
      } catch (err) {
        if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          //required track is missing
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          //webcam or mic are already in use
        } else if (
          err.name === "OverconstrainedError" ||
          err.name === "ConstraintNotSatisfiedError"
        ) {
          //constraints can not be satisfied by avb. devices
        } else if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          //permission denied in browser
        } else if (err.name === "TypeError" || err.name === "TypeError") {
          //empty constraints object
        } else {
          console.error("Error accessing user media:", err);
        }

        const stream = null;
        setStream(stream);
        myVideo.current.srcObject = stream;
      }
    };

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    socket.on("initial-editor-content", (initialContent) => {
      setEditorText(initialContent);
    });

    // Listen for changes from Socket.io and update the editor
    socket.on("editor-changed", (text) => {
      if (editorText !== text) {
        setEditorText(text);
      }
    });

    socket.on("otherUserToggledMic", ({ userId, micState }) => {
      if (userId !== socket.id) { // @TODO If the user who toggled mic is not the current user (Required to change by parsing userId)
        setOtherMicOn(micState);
      }
    });

    socket.on("otherUserToggledCamera", ({ userId, cameraState }) => {
      if (userId !== socket.id) { // @TODO If the user who toggled camera is not the current user (Required to change by parsing userId)
        setOtherCameraOn(cameraState);
      }
    });
    // Call the getUserMedia function whenever micOn or cameraOn changes
    getUserMediaWithStatus();
    getOtherMediaWithStatus();
  }, [micOn, cameraOn, otherMicOn, otherCameraOn]);

  const handleEditorChange = (newValue) => {
    setEditorText(newValue);
    socket.emit("editor-change", newValue);
  };

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream : stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  const toggleMic = () => {
    setMicOn((prevMicOn) => !prevMicOn);
    socket.emit("toggleMic", micOn);
  };

  const toggleCamera = () => {
    setCameraOn((prevCameraOn) => !prevCameraOn);
    socket.emit("toggleMic", cameraOn);
  };

  return (
    <div className="container">
      <div className="left-panel">
        <div className="video-container">
          <video
            className="video-player"
            autoPlay
            playsInline
            ref={myVideo}
          />
          <video
            className="video-player"
            playsInline
            ref={userVideo}
            autoPlay
          />
        </div>

        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <Typography variant="h4">{name} is calling...</Typography>
              <IconButton
                className={classes.circleButton}
                color="primary" // You can change the color as needed
                size="small"
                onClick={answerCall}
                alt="answercall"
                disableRipple={true}
              >
                <CallIcon />
              </IconButton>
            </div>
          ) : null}
        </div>

        <div id="controls">
          <IconButton
            className={classes.circleButton}
            color="primary" // You can change the color as needed
            size="small"
            onClick={() => { callUser(idToCall); }}
            disableRipple={true}
          >
            <CallIcon />
          </IconButton>

          <CopyToClipboard text={me}>
            <IconButton
              className={classes.circleButton}
              color="primary" // You can change the color as needed
              size="small"
              disableRipple={true}
            >
              <ContentPasteIcon />
            </IconButton>
          </CopyToClipboard>
          <Link to="/">
            <IconButton
              className={classes.circleButton}
              color="primary" // You can change the color as needed
              size="small"
              onClick={() => { leaveCall(); }}
              disableRipple={true}
            >
              <HomeIcon />
            </IconButton>
          </Link>

          <IconButton
            className={classes.circleButton}
            color="primary" // You can change the color as needed
            size="small"
            onClick={() => toggleCamera()}
            disableRipple={true}
          >
            {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>

          <IconButton
            className={classes.circleButton}
            color="primary" // You can change the color as needed
            size="small"
            onClick={() => toggleMic()}
            disableRipple={true}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
          <TextField
            className={classes.textfield}
            variant="outlined"
            color="secondary"
            value={idToCall}
            onChange={(e) => setIdToCall(e.target.value)}
          />
        </div>
        
      </div>
      <div className="right-panel">
        <Editor
          height="100%"
          width="100%"
          theme="vs-dark"
          value={editorText}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
}

export default VideoConnect;


//to fix: when user  disable cam/mic, it doesn disable for other user, figure out css?, code editor doesnt clear? (need a unique room name for code editor)
