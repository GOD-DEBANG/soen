import React, { useState, useEffect, useContext, useRef } from 'react'
import { UserContext } from '../context/user.context'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../config/axios'
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket'
import Markdown from 'markdown-to-jsx'
import hljs from 'highlight.js';
import { getWebContainer } from '../config/webcontainer'


function SyntaxHighlightedCode(props) {
    const ref = useRef(null)

    React.useEffect(() => {
        if (ref.current && props.className?.includes('lang-') && window.hljs) {
            window.hljs.highlightElement(ref.current)

            // hljs won't reprocess the element unless this attribute is removed
            ref.current.removeAttribute('data-highlighted')
        }
    }, [ props.className, props.children ])

    return <code {...props} ref={ref} />
}


const Project = () => {

    const location = useLocation()
    const navigate = useNavigate()

    const [ isSidePanelOpen, setIsSidePanelOpen ] = useState(false)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ selectedUserId, setSelectedUserId ] = useState(new Set()) // Initialized as Set
    const [ project, setProject ] = useState(location.state.project)
    const [ message, setMessage ] = useState('')
    const { user } = useContext(UserContext)
    const messageBox = React.createRef()

    const [ users, setUsers ] = useState([])
    const [ messages, setMessages ] = useState([]) // New state variable for messages
    const [ fileTree, setFileTree ] = useState({})

    const [ currentFile, setCurrentFile ] = useState(null)
    const [ openFiles, setOpenFiles ] = useState([])

    const [ webContainer, setWebContainer ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    const [ runProcess, setRunProcess ] = useState(null)

    const [ isAiTyping, setIsAiTyping ] = useState(false)

    // Voice: speech recognition & recording
    const [ isListening, setIsListening ] = useState(false)
    const recognitionRef = useRef(null)
    const [ isRecording, setIsRecording ] = useState(false)
    const mediaRecorderRef = useRef(null)
    const recordedChunksRef = useRef([])

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }

            return newSelectedUserId;
        });


    }


    function addCollaborators() {

        const updatedProject = { ...project, users: [...new Set([...project.users, ...Array.from(selectedUserId)])] }
        setProject(updatedProject)

        // Update localStorage
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => p._id === project._id ? updatedProject : p)
        localStorage.setItem('projects', JSON.stringify(updatedProjects))

        setIsModalOpen(false)

    }

    const send = () => {

        const lowerMessage = message.toLowerCase();

        // Open currently running webcontainer app
        if (lowerMessage.includes("open the app") || lowerMessage.includes("open app")) {
            if (iframeUrl) {
                window.open(iframeUrl, '_blank');
                setMessage("");
                return;
            } else {
                alert("App is not running. Please run the project first.");
                setMessage("");
                return;
            }
        }

        // Natural language: open <app> (native) or open web <site>
        if (lowerMessage.startsWith("open ") || lowerMessage.startsWith("open web ")) {
            const isWeb = lowerMessage.startsWith("open web ");
            const name = lowerMessage.replace(isWeb ? "open web " : "open ", "").trim();

            if (isWeb) {
                // Simple web open: try direct known map, else search
                const webMap = {
                    "google": "https://www.google.com",
                    "youtube": "https://www.youtube.com",
                    "github": "https://github.com",
                    "gmail": "https://mail.google.com",
                    "maps": "https://maps.google.com",
                };
                const url = webMap[ name ] || `https://www.google.com/search?q=${encodeURIComponent(name)}`;
                window.open(url, '_blank');
                setMessage("");
                return;
            }

            // Native apps: try app link / scheme first, then fallback to store by OS
            const os = (() => {
                const ua = navigator.userAgent.toLowerCase();
                if (/android/.test(ua)) return 'android';
                if (/iphone|ipad|ipod/.test(ua)) return 'ios';
                if (/win/.test(ua)) return 'windows';
                if (/mac/.test(ua)) return 'mac';
                return 'web';
            })();

            // Registry of popular apps
            const registry = {
                youtube: {
                    android: { scheme: 'vnd.youtube://', store: 'market://details?id=com.google.android.youtube' },
                    ios: { scheme: 'youtube://', store: 'https://apps.apple.com/app/id544007664' },
                    windows: { scheme: 'https://www.youtube.com', store: 'https://www.microsoft.com/store/apps' },
                    mac: { scheme: 'https://www.youtube.com', store: 'https://apps.apple.com/us/genre/mac/id39' },
                },
                whatsapp: {
                    android: { scheme: 'whatsapp://', store: 'market://details?id=com.whatsapp' },
                    ios: { scheme: 'whatsapp://', store: 'https://apps.apple.com/app/id310633997' },
                    windows: { scheme: 'whatsapp://', store: 'https://www.microsoft.com/store/apps' },
                    mac: { scheme: 'whatsapp://', store: 'https://apps.apple.com/app/id1147396723' },
                },
                maps: {
                    android: { scheme: 'geo:0,0?q=', store: 'market://details?id=com.google.android.apps.maps' },
                    ios: { scheme: 'maps://', store: 'https://apps.apple.com/app/id915056765' },
                    windows: { scheme: 'bingmaps:', store: 'https://www.microsoft.com/store/apps' },
                    mac: { scheme: 'maps://', store: 'https://apps.apple.com/genre/ios/id36' },
                },
                phone: {
                    android: { scheme: 'tel:', store: 'market://details?id=com.google.android.dialer' },
                    ios: { scheme: 'tel:', store: 'https://apps.apple.com/genre/ios/id36' },
                    windows: { scheme: 'tel:', store: 'https://www.microsoft.com/store/apps' },
                    mac: { scheme: 'tel:', store: 'https://apps.apple.com/genre/mac/id39' },
                },
                email: {
                    android: { scheme: 'mailto:', store: 'market://details?id=com.google.android.gm' },
                    ios: { scheme: 'mailto:', store: 'https://apps.apple.com/genre/ios/id36' },
                    windows: { scheme: 'mailto:', store: 'https://www.microsoft.com/store/apps' },
                    mac: { scheme: 'mailto:', store: 'https://apps.apple.com/genre/mac/id39' },
                },
            };

            const key = name.replace(/\s+/g, '').toLowerCase();
            const entry = registry[ key ];
            if (entry && entry[ os ]) {
                const { scheme, store } = entry[ os ];
                // Try to open scheme; if blocked or not installed, open store fallback shortly after
                const timer = setTimeout(() => {
                    if (store) window.open(store, '_blank');
                }, 1200);
                try {
                    window.open(scheme, '_blank');
                } catch (e) {
                    clearTimeout(timer);
                    if (store) window.open(store, '_blank');
                }
                setMessage("");
                return;
            }

            // Unknown native app → send to platform store search
            const storeSearch = os === 'android'
                ? `https://play.google.com/store/search?q=${encodeURIComponent(name)}`
                : os === 'ios'
                    ? `https://apps.apple.com/us/search?term=${encodeURIComponent(name)}`
                    : os === 'windows'
                        ? `https://www.microsoft.com/store/search?q=${encodeURIComponent(name)}`
                        : `https://www.google.com/search?q=${encodeURIComponent(name)}`;
            window.open(storeSearch, '_blank');
            setMessage("");
            return;
        }

        const isAiMessage = message.includes('@ai');
        if (isAiMessage) {
            setIsAiTyping(true);
        }

        sendMessage('project-message', {
            message,
            sender: user,
            messageType: 'text'
        })
        setMessages(prevMessages => [ ...prevMessages, { sender: user, message, messageType: 'text' } ])
        setMessage("")

    }

    function WriteAiMessage(message) {

        const messageObject = JSON.parse(message)

        return (
            <div
                className='overflow-auto bg-slate-950 text-white rounded-sm p-2'
            >
                <Markdown
                    children={messageObject.text}
                    options={{
                        overrides: {
                            code: SyntaxHighlightedCode,
                        },
                    }}
                />
            </div>)
    }

    useEffect(() => {

        initializeSocket(project._id)

        if (!webContainer) {
            getWebContainer().then(container => {
                setWebContainer(container)
                console.log("container started")
            })
        }

        setFileTree(project.fileTree || {})

        receiveMessage('project-message', data => {

            console.log(data)

            if (data.sender._id == 'ai') {


                const message = JSON.parse(data.message)

                console.log(message)

                webContainer?.mount(message.fileTree)

                if (message.fileTree) {
                    setFileTree(message.fileTree || {})
                }
                // Speak AI text
                try {
                    const utter = new SpeechSynthesisUtterance(message.text)
                    utter.rate = 1
                    window.speechSynthesis.cancel()
                    window.speechSynthesis.speak(utter)
                } catch (e) { }

                setMessages(prevMessages => [ ...prevMessages, data ])
                setIsAiTyping(false)
            } else {


                setMessages(prevMessages => [ ...prevMessages, data ])
            }
        })

        axios.get('/users/all').then(res => {

            setUsers(res.data.users)

        }).catch(err => {

            console.log(err)

        })

    }, [])

    function saveFileTree(ft) {
        const updatedProject = { ...project, fileTree: ft }
        setProject(updatedProject)

        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = projects.map(p => p._id === project._id ? updatedProject : p)
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
    }


    // Removed appendIncomingMessage and appendOutgoingMessage functions

    function scrollToBottom() {
        messageBox.current.scrollTop = messageBox.current.scrollHeight
    }

    // Voice: STT
    function toggleListening() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            if (!SpeechRecognition) return;
            if (!recognitionRef.current) {
                const rec = new SpeechRecognition()
                rec.lang = 'en-US'
                rec.interimResults = true
                rec.continuous = true
                rec.onresult = (event) => {
                    let interim = ''
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcript = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            setMessage(prev => (prev ? prev + ' ' : '') + transcript)
                        } else {
                            interim += transcript
                        }
                    }
                }
                rec.onend = () => setIsListening(false)
                recognitionRef.current = rec
            }
            if (isListening) {
                recognitionRef.current.stop()
                setIsListening(false)
            } else {
                recognitionRef.current.start()
                setIsListening(true)
            }
        } catch (e) { }
    }

    // Voice: Recording
    async function startRecording() {
        try {
            if (isRecording) return;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mr = new MediaRecorder(stream)
            recordedChunksRef.current = []
            mr.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
            }
            mr.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64 = reader.result // data URL
                    sendMessage('project-message', {
                        message: '[voice message]',
                        sender: user,
                        messageType: 'audio',
                        audio: base64
                    })
                    setMessages(prev => [ ...prev, { sender: user, message: '[voice message]', messageType: 'audio', audio: base64 } ])
                }
                reader.readAsDataURL(blob)
            }
            mediaRecorderRef.current = mr
            mr.start()
            setIsRecording(true)
        } catch (e) { }
    }

    function stopRecording() {
        try {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop()
                mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
                setIsRecording(false)
            }
        } catch (e) { }
    }

    return (
        <main className='fixed inset-0 h-screen w-screen flex'>
            <section className="left relative flex flex-col h-screen w-full bg-[#0B0B0C] text-white">
                {/* Glow backdrop */}
                <div className='pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-80 w-[42rem] rounded-full opacity-40 blur-[90px]'
                    style={{ background: 'radial-gradient(ellipse at center, #7C3AED 10%, #4F46E5 40%, transparent 70%)' }} />
                <header className='relative flex items-center justify-between p-4 px-5 w-full bg-[#101013]/70 backdrop-blur border-b border-[#1C1C20] sticky top-0 z-10'>
                    <div className='flex items-center gap-2'>
                        <span className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30'>
                            <i className="ri-robot-2-fill"></i>
                        </span>
                        <p className='font-semibold tracking-wide'>Chat</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button className='text-purple-400 hover:text-purple-300' onClick={() => setIsModalOpen(true)} title='Add collaborator'>
                            <i className="ri-user-add-line"></i>
                        </button>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='text-zinc-300 hover:text-white' title='Collaborators'>
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>
                </header>
                <div className="conversation-area pb-28 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-4 flex-grow flex flex-col gap-3 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => {
                            const isAi = msg.sender._id === 'ai';
                            const isSelf = msg.sender._id == user._id.toString();
                            return (
                                <div key={index} className={`w-full flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`message flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                        <small className='opacity-60 text-[10px] mb-1'>{msg.sender.email}</small>
                                        <div className={`${isAi ? 'bg-white/5' : 'bg-white/7'} ${isSelf && '!bg-purple-500/90 !text-white'} text-zinc-100 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 max-w-[70%] leading-relaxed shadow-[0_10px_30px_-10px_rgba(124,58,237,0.35)]`}>
                                            {isAi ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {isAiTyping && (
                            <div className='flex items-center gap-2 text-xs text-zinc-400'>
                                <span className='inline-flex w-2 h-2 rounded-full bg-zinc-500 animate-pulse'></span>
                                AI is typing...
                                <button className='ml-2 text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white'>Stop Generation</button>
                            </div>
                        )}
                    </div>

                    {/* Floating input */}
                    <div className="inputField w-full flex items-center justify-center px-3 py-4 absolute bottom-2">
                        <div className='flex items-center gap-2 w-full max-w-3xl bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-[0_10px_30px_-10px_rgba(124,58,237,0.35)]'>
                            <button className='text-zinc-300 hover:text-white'><i className="ri-attachment-2"></i></button>
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                                className='bg-transparent placeholder-zinc-500 text-zinc-100 border-none outline-none flex-grow text-sm' type="text" placeholder='Type your message...' />
                            <button
                                onClick={toggleListening}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                title={isRecording ? 'Recording...' : (isListening ? 'Listening...' : 'Voice')}
                                className={`${isRecording ? 'text-red-400' : (isListening ? 'text-purple-400' : 'text-zinc-400')} hover:text-zinc-200`}>
                                <i className="ri-mic-line"></i>
                            </button>
                            <button
                                onClick={() => navigate('/developer')}
                                title='Developer'
                                className='text-zinc-400 hover:text-white'>
                                <i className="ri-code-s-slash-line"></i>
                            </button>
                        </div>
                        <button
                            onClick={send}
                            className='ml-2 w-11 h-11 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:bg-purple-400'>
                            <i className="ri-send-plane-2-fill"></i>
                        </button>
                    </div>
                </div>
                <div className={`sidePanel w-full h-full flex flex-col gap-2 bg-slate-50 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-4 p-2 bg-slate-200'>

                        <h1
                            className='font-semibold text-lg'
                        >Collaborators</h1>

                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>
                    <div className="users flex flex-col gap-2">

                        {project.users && project.users.map(user => {


                            return (
                                <div className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center">
                                    <div className='aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            )


                        })}
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user.id} className={`user cursor-pointer hover:bg-slate-200 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-slate-200' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-semibold text-lg'>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={addCollaborators}
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}

export default Project