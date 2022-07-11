import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [data,setData] = useState({code: "import java.util.Scanner;\npublic class MatSym {\n    public static void main(String[]args) {\n       Scanner in = new Scanner(System.in);\nSystem.out.println(in.nextLine());\nSystem.out.println(in.nextLine());\n    }\n}",
    language: "java",
    input: "Hello\nWorld",});
    const [resData,setResData] = useState();
    const [val,setVal] = useState();


    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    function runCode(){
        
    
   fetch('https://codex-api.herokuapp.com/',{
            method:"POST",
            headers :{
                Accept:"application/json",
                "Content-Type": "application/json",
            },
            body:JSON.stringify({code: {val},
            language: "cpp",
            input: "",})
          }).then(res => res.json()
          .then(resdata =>{
            setResData(resdata);
            
          }))
          console.log(resData);

    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/logo.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <div className='titleBar'>
                    <div className='box'>
                        <select>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                            <option value="py">Python</option>
                            <option value="js">NodeJs</option>
                            <option value="c">C</option>
                            <option value="cs">C#</option>
                            <option value="go">GoLong</option>
                        </select>
                        </div>
                
                    <button className="btn runBtn" onClick={runCode}>
                        Run
                    </button>
                    
                </div>
                <div className='innerEditor'>
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                        setVal(code);
                    }}
                />
                <div className='outputDiv'>
                    <div className='upperOutput'>
                          {val}
                    </div>
                    <div className='upperOutput'>
                        {resData}
                    </div>

                </div>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
