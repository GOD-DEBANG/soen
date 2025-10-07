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

        // Check for opening specific apps
        if (lowerMessage.startsWith("open ")) {
            const appName = lowerMessage.replace("open ", "").trim();
            const appSchemes = {
                "calculator": "calculator://",
                "camera": "camera://",
                "maps": "maps://",
                "phone": "tel://",
                "email": "mailto://",
                "google": "https://google.com",
                "youtube": "https://youtube.com",
            };
            if (appSchemes[appName]) {
                try {
                    window.open(appSchemes[appName], '_blank');
                    setMessage("");
                    return;
                } catch (e) {
                    alert(`Unable to open ${appName}. It may not be available on this device.`);
                    setMessage("");
                    return;
                }
            }
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
            <section className="left relative flex flex-col h-screen min-w-96 bg-[#0F0F10] text-white">
                <header className='flex items-center justify-between p-3 px-4 w-full bg-[#151517] border-b border-[#202023] sticky top-0 z-10'>
                    <div className='flex items-center gap-2'>
                        <span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black font-semibold'>
                            <i className="ri-robot-2-fill"></i>
                        </span>
                        <p className='font-semibold'>Chat</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button className='text-amber-400 hover:text-amber-300' onClick={() => setIsModalOpen(true)} title='Add collaborator'>
                            <i className="ri-user-add-line"></i>
                        </button>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='text-zinc-300 hover:text-white' title='Collaborators'>
                            <i className="ri-group-fill"></i>
                        </button>
                    </div>
                </header>
                <div className="conversation-area pb-20 flex-grow flex flex-col h-full relative">

                    <div
                        ref={messageBox}
                        className="message-box p-3 flex-grow flex flex-col gap-2 overflow-auto max-h-full scrollbar-hide">
                        {messages.map((msg, index) => {
                            const isAi = msg.sender._id === 'ai';
                            const isSelf = msg.sender._id == user._id.toString();
                            return (
                                <div key={index} className={`message flex flex-col w-fit ${isSelf ? 'ml-auto items-end' : 'items-start'}`}>
                                    <small className='opacity-60 text-[10px] mb-1'>{msg.sender.email}</small>
                                    <div className={`${isAi ? 'bg-[#1E1F22] text-zinc-100' : 'bg-[#2A2B2F] text-zinc-100'} ${isSelf && '!bg-amber-400 !text-black'} rounded-2xl px-4 py-3 max-w-[70%] leading-relaxed shadow-sm`}>
                                        {isAi ? WriteAiMessage(msg.message) : <p>{msg.message}</p>}
                                    </div>
                                </div>
                            )
                        })}
                        {isAiTyping && (
                            <div className='flex items-center gap-2 text-xs text-zinc-400'>
                                <span className='inline-flex w-2 h-2 rounded-full bg-zinc-500 animate-pulse'></span>
                                AI is typing...
                                <button className='ml-2 text-[11px] px-2 py-1 rounded-full bg-[#1E1F22] text-zinc-300 hover:text-white'>Stop Generation</button>
                            </div>
                        )}
                    </div>

                    <div className="inputField w-full flex items-center gap-2 px-3 py-3 bg-[#0F0F10] border-t border-[#202023] absolute bottom-0">
                        <div className='flex items-center gap-2 flex-grow bg-[#17181A] border border-[#24252A] rounded-full px-3 py-2'>
                            <button className='text-zinc-400 hover:text-zinc-200'><i className="ri-attachment-2"></i></button>
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                                className='bg-transparent placeholder-zinc-500 text-zinc-100 border-none outline-none flex-grow text-sm' type="text" placeholder='Hi, can I help you?' />
                            <button
                                onClick={toggleListening}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                title={isRecording ? 'Recording...' : (isListening ? 'Listening...' : 'Voice')}
                                className={`${isRecording ? 'text-red-400' : (isListening ? 'text-amber-400' : 'text-zinc-400')} hover:text-zinc-200`}>
                                <i className="ri-mic-line"></i>
                            </button>
                        </div>
                        <button
                            onClick={send}
                            className='w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow hover:bg-amber-300'>
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

            <section className="right  bg-red-50 flex-grow h-full flex">

                <div className="explorer h-full max-w-64 min-w-52 bg-slate-200">
                    <div className="file-tree w-full">
                        {
                            Object.keys(fileTree).map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentFile(file)
                                        setOpenFiles([ ...new Set([ ...openFiles, file ]) ])
                                    }}
                                    className="tree-element cursor-pointer p-2 px-4 flex items-center gap-2 bg-slate-300 w-full">
                                    <p
                                        className='font-semibold text-lg'
                                    >{file}</p>
                                </button>))

                        }
                    </div>

                </div>


                <div className="code-editor flex flex-col flex-grow h-full shrink">

                    <div className="top flex justify-between w-full">

                        <div className="files flex">
                            {
                                openFiles.map((file, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentFile(file)}
                                        className={`open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 ${currentFile === file ? 'bg-slate-400' : ''}`}>
                                        <p
                                            className='font-semibold text-lg'
                                        >{file}</p>
                                    </button>
                                ))
                            }
                        </div>

                        <div className="actions flex gap-2">
                            <button
                                onClick={async () => {
                                    await webContainer.mount(fileTree)


                                    const installProcess = await webContainer.spawn("npm", [ "install" ])



                                    installProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    if (runProcess) {
                                        runProcess.kill()
                                    }

                                    let tempRunProcess = await webContainer.spawn("npm", [ "start" ]);

                                    tempRunProcess.output.pipeTo(new WritableStream({
                                        write(chunk) {
                                            console.log(chunk)
                                        }
                                    }))

                                    setRunProcess(tempRunProcess)

                                    webContainer.on('server-ready', (port, url) => {
                                        console.log(port, url)
                                        setIframeUrl(url)
                                    })

                                }}
                                className='p-2 px-4 bg-slate-300 text-white'
                            >
                                run
                            </button>


                        </div>
                    </div>
                    <div className="bottom flex flex-grow max-w-full shrink overflow-auto">
                        {
                            fileTree[ currentFile ] && (
                                <div className="code-editor-area h-full overflow-auto flex-grow bg-slate-50">
                                    <pre
                                        className="hljs h-full">
                                        <code
                                            className="hljs h-full outline-none"
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => {
                                                const updatedContent = e.target.innerText;
                                                const ft = {
                                                    ...fileTree,
                                                    [ currentFile ]: {
                                                        file: {
                                                            contents: updatedContent
                                                        }
                                                    }
                                                }
                                                setFileTree(ft)
                                                saveFileTree(ft)
                                            }}
                                            dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', fileTree[ currentFile ].file.contents).value }}
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                paddingBottom: '25rem',
                                                counterSet: 'line-numbering',
                                            }}
                                        />
                                    </pre>
                                </div>
                            )
                        }
                    </div>

                </div>

                {iframeUrl && webContainer &&
                    (<div className="flex min-w-96 flex-col h-full">
                        <div className="address-bar">
                            <input type="text"
                                onChange={(e) => setIframeUrl(e.target.value)}
                                value={iframeUrl} className="w-full p-2 px-4 bg-slate-200" />
                        </div>
                        <iframe src={iframeUrl} className="w-full h-full"></iframe>
                    </div>)
                }


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