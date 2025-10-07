import React, { useEffect, useState } from 'react'
import axios from '../config/axios'
import { getWebContainer } from '../config/webcontainer'

const Developer = () => {

    const [ projectName, setProjectName ] = useState('my-express-app')
    const [ language, setLanguage ] = useState('javascript')
    const [ mode, setMode ] = useState('generate') // generate | test | review
    const [ prompt, setPrompt ] = useState('')
    const [ codeInput, setCodeInput ] = useState('')
    const [ result, setResult ] = useState(null)
    const [ output, setOutput ] = useState('')
    const [ fileTree, setFileTree ] = useState({})
    const [ webContainer, setWebContainer ] = useState(null)
    const [ runProcess, setRunProcess ] = useState(null)
    const [ iframeUrl, setIframeUrl ] = useState(null)

    useEffect(() => {
        getWebContainer().then(setWebContainer).catch(() => {})
    }, [])

    const generateExpressBoilerplate = () => {
        const files = {
            'package.json': `{
  "name": "${projectName}",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^4.21.2", "cors": "^2.8.5", "morgan": "^1.10.0", "dotenv": "^16.4.7" }
}`,
            'server.js': `import 'dotenv/config'\nimport express from 'express'\nimport morgan from 'morgan'\nimport cors from 'cors'\n\nconst app = express()\napp.use(cors())\napp.use(morgan('dev'))\napp.use(express.json())\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from ${projectName}' })\n})\n\nconst port = process.env.PORT || 3000\napp.listen(port, () => console.log('Server running on', port))\n`
        }

        const zipPreview = Object.entries(files).map(([ k, v ]) => `// ${k}\n${v}`).join('\n\n')
        setOutput(zipPreview)
        setFileTree(Object.keys(files).reduce((acc, path) => {
            acc[path] = { file: { contents: files[path] } }
            return acc
        }, {}))
    }

    const buildAIPrompt = () => {
        const base = `You are a senior software engineer. Output JSON only as {"text": string, "fileTree"?: object}. Language: ${language}.`;
        if (mode === 'generate') {
            return `${base}\nCreate ${language} code for: ${prompt}. If web server requested and language is javascript, include a runnable Node project with package.json and scripts.`
        }
        if (mode === 'test') {
            return `${base}\nWrite tests for the following code. Include instructions and, if JavaScript, include runnable test setup.\n\nCODE:\n${codeInput}`
        }
        return `${base}\nFind bugs and suggest fixes. Provide corrected code.\n\nCODE:\n${codeInput}`
    }

    const runAI = async () => {
        try {
            setResult({ loading: true })
            const res = await axios.get('/ai/get-result', { params: { prompt: buildAIPrompt() } })
            const data = JSON.parse(res.data)
            setResult(data)
            if (data.fileTree) {
                setFileTree(data.fileTree)
                setOutput(JSON.stringify(data.fileTree, null, 2))
            } else {
                setOutput(data.text || '')
            }
        } catch (e) {
            setResult({ error: e.message })
        }
    }

    const runNodeProject = async () => {
        if (!webContainer || !fileTree || Object.keys(fileTree).length === 0) return;
        await webContainer.mount(fileTree)
        const install = await webContainer.spawn('npm', [ 'install' ])
        install.output.pipeTo(new WritableStream({ write(chunk) { console.log(chunk) } }))
        if (runProcess) { runProcess.kill() }
        const proc = await webContainer.spawn('npm', [ 'start' ])
        proc.output.pipeTo(new WritableStream({ write(chunk) { console.log(chunk) } }))
        setRunProcess(proc)
        webContainer.on('server-ready', (port, url) => setIframeUrl(url))
    }

    return (
        <main className='min-h-screen w-screen bg-[#0F0F10] text-white'>
            <header className='flex items-center justify-between px-6 py-3 border-b border-[#202023] sticky top-0 bg-[#0F0F10] z-10'>
                <div className='flex items-center gap-2'>
                    <span className='inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-black'>
                        <i className="ri-code-s-slash-line"></i>
                    </span>
                    <h1 className='font-semibold'>Developer</h1>
                </div>
                <a href='/' className='text-zinc-300 hover:text-white text-sm'>Back</a>
            </header>

            <section className='max-w-6xl mx-auto px-4 py-6'>
                <div className='bg-[#151517] border border-[#202023] rounded-2xl p-4'>
                    <div className='flex flex-wrap items-center gap-3 mb-3'>
                        <div className='flex items-center gap-2'>
                            <button onClick={() => setMode('generate')} className={`px-3 py-1.5 rounded-full text-sm ${mode==='generate'?'bg-amber-400 text-black':'bg-[#0F0F10] text-zinc-300 border border-[#24252A]'}`}>Generate</button>
                            <button onClick={() => setMode('test')} className={`px-3 py-1.5 rounded-full text-sm ${mode==='test'?'bg-amber-400 text-black':'bg-[#0F0F10] text-zinc-300 border border-[#24252A]'}`}>Test</button>
                            <button onClick={() => setMode('review')} className={`px-3 py-1.5 rounded-full text-sm ${mode==='review'?'bg-amber-400 text-black':'bg-[#0F0F10] text-zinc-300 border border-[#24252A]'}`}>Review</button>
                        </div>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className='bg-[#0F0F10] border border-[#24252A] rounded-full px-3 py-1.5 outline-none text-sm'>
                            <option value='javascript'>JavaScript</option>
                            <option value='python'>Python</option>
                            <option value='java'>Java</option>
                            <option value='cpp'>C++</option>
                            <option value='go'>Go</option>
                            <option value='rust'>Rust</option>
                            <option value='typescript'>TypeScript</option>
                        </select>
                        {mode==='generate' && (
                            <>
                                <input value={projectName} onChange={e => setProjectName(e.target.value)} className='bg-[#0F0F10] border border-[#24252A] rounded-full px-3 py-1.5 outline-none text-sm' placeholder='Project name' />
                                <button onClick={generateExpressBoilerplate} className='px-3 py-1.5 rounded-full bg-[#0F0F10] border border-[#24252A] text-zinc-300 text-sm hover:text-white'>Sample Express</button>
                            </>
                        )}
                    </div>

                    {mode==='generate' && (
                        <div className='flex gap-3'>
                            <input value={prompt} onChange={e=>setPrompt(e.target.value)} className='flex-grow bg-[#0F0F10] border border-[#24252A] rounded-2xl px-4 py-3 outline-none text-sm' placeholder='Describe what to generate...' />
                            <button onClick={runAI} className='px-4 py-2 rounded-2xl bg-amber-400 text-black text-sm font-medium hover:bg-amber-300'>Generate</button>
                        </div>
                    )}
                    {mode!=='generate' && (
                        <div className='flex flex-col gap-2'>
                            <textarea value={codeInput} onChange={e=>setCodeInput(e.target.value)} className='bg-[#0F0F10] border border-[#24252A] rounded-2xl px-4 py-3 outline-none text-sm min-h-44' placeholder='Paste your code here...'></textarea>
                            <div className='flex justify-end'>
                                <button onClick={runAI} className='px-4 py-2 rounded-2xl bg-amber-400 text-black text-sm font-medium hover:bg-amber-300'>Run</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className='mt-6 grid lg:grid-cols-2 gap-4'>
                    <div className='bg-[#151517] border border-[#202023] rounded-2xl p-4'>
                        <h3 className='font-semibold mb-2'>Result</h3>
                        <pre className='bg-[#0F0F10] border border-[#24252A] rounded-lg p-3 overflow-auto text-xs whitespace-pre-wrap'>{output || '// Results will appear here.'}</pre>
                        {result?.error && <p className='text-red-400 text-xs mt-2'>Error: {result.error}</p>}
                    </div>
                    <div className='bg-[#151517] border border-[#202023] rounded-2xl p-4'>
                        <h3 className='font-semibold mb-2'>Run (JavaScript projects)</h3>
                        <div className='flex gap-2 mb-2'>
                            <button onClick={runNodeProject} className='px-3 py-1.5 rounded-full bg-amber-400 text-black text-sm hover:bg-amber-300'>Run</button>
                            {iframeUrl && <a className='px-3 py-1.5 rounded-full bg-[#0F0F10] border border-[#24252A] text-zinc-300 text-sm' href={iframeUrl} target='_blank'>Open App</a>}
                        </div>
                        {iframeUrl ? (
                            <iframe src={iframeUrl} className='w-full h-72 rounded-lg border border-[#24252A]'></iframe>
                        ) : (
                            <p className='text-sm text-zinc-400'>Mount and run Node apps generated by AI or the sample Express template.</p>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Developer


