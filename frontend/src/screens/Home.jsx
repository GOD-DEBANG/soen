import React, { useContext, useState, useEffect } from 'react'
import { UserContext } from '../context/user.context'
import axios from "../config/axios"
import { useNavigate } from 'react-router-dom'

const Home = () => {

    const { user } = useContext(UserContext)
    const [ isModalOpen, setIsModalOpen ] = useState(false)
    const [ projectName, setProjectName ] = useState('')
    const [ projectType, setProjectType ] = useState('Blank')
    const [ project, setProject ] = useState([])
    const [ search, setSearch ] = useState('')
    const [ sortBy, setSortBy ] = useState('recent') // recent | name
    const [ tagInput, setTagInput ] = useState('')
    const [ activeTags, setActiveTags ] = useState(new Set())
    const [ shareProject, setShareProject ] = useState(null)
    const [ showArchived, setShowArchived ] = useState(false)

    const navigate = useNavigate()

    function generateBoilerplate(type, name) {
        const readme = (title, description) => `# ${title}\n\n${description}\n\n## Getting Started\n- Install dependencies\n- Run the dev server\n- Explore the generated files in the left panel.\n`;

        if (type === 'Express API') {
            return {
                'package.json': { file: { contents: `{
  "name": "${name.toLowerCase().replace(/[^a-z0-9-]/g,'-')}",
  "version": "1.0.0",
  "type": "module",
  "scripts": { "start": "node server.js" },
  "dependencies": { "express": "^4.21.2", "cors": "^2.8.5", "morgan": "^1.10.0", "dotenv": "^16.4.7" }
}` } },
                'server.js': { file: { contents: `import 'dotenv/config'\nimport express from 'express'\nimport morgan from 'morgan'\nimport cors from 'cors'\n\nconst app = express()\napp.use(cors())\napp.use(morgan('dev'))\napp.use(express.json())\n\napp.get('/api/health', (req, res) => {\n  res.json({ ok: true, name: '${name}' })\n})\n\nconst port = process.env.PORT || 3000\napp.listen(port, () => console.log('API running on', port))\n` } },
                'README.md': { file: { contents: readme(name, 'Express REST API starter with CORS and logging.') } },
                'GUIDE.md': { file: { contents: `## ${name} - Developer Guide\n\n- Routes live in server.js (add routers as needed)\n- Use /api prefix for endpoints\n- Add .env for configuration (PORT, etc.)\n` } },
            };
        }
        if (type === 'Vite React') {
            return {
                'package.json': { file: { contents: `{
  "name": "${name.toLowerCase().replace(/[^a-z0-9-]/g,'-')}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": { "start": "vite" },
  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" },
  "devDependencies": { "vite": "^5.4.0" }
}` } },
                'index.html': { file: { contents: `<!doctype html>\n<html>\n  <head>\n    <meta charset='UTF-8' />\n    <meta name='viewport' content='width=device-width, initial-scale=1.0' />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id='root'></div>\n    <script type='module' src='/src/main.jsx'></script>\n  </body>\n</html>` } },
                'src/main.jsx': { file: { contents: `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App.jsx'\ncreateRoot(document.getElementById('root')).render(<App />)\n` } },
                'src/App.jsx': { file: { contents: `export default function App(){\n  return (<div style={{padding:20}}><h1>${name}</h1><p>Welcome to your React app.</p></div>)\n}` } },
                'README.md': { file: { contents: readme(name, 'Vite + React starter.') } },
                'GUIDE.md': { file: { contents: `## ${name} - Guide\n\n- Edit src/App.jsx to start building.\n- Vite dev server runs on port 5173 by default.\n` } }
            };
        }
        if (type === 'Next.js App') {
            return {
                'package.json': { file: { contents: `{
  "name": "${name.toLowerCase().replace(/[^a-z0-9-]/g,'-')}",
  "version": "1.0.0",
  "scripts": { "start": "next dev" },
  "dependencies": { "next": "^14.2.0", "react": "^18.2.0", "react-dom": "^18.2.0" }
}` } },
                'pages/index.js': { file: { contents: `export default function Home(){ return (<main style={{padding:20}}><h1>${name}</h1><p>Welcome to Next.js</p></main>) }` } },
                'README.md': { file: { contents: readme(name, 'Minimal Next.js starter (pages).') } },
                'GUIDE.md': { file: { contents: `## ${name} - Guide\n\n- Create pages in /pages.\n- API routes can go in /pages/api.\n` } }
            };
        }
        if (type === 'DSA (Algorithms)') {
            return {
                'README.md': { file: { contents: readme(name, 'Algorithms practice workspace. Add problems in /problems and solutions in multiple languages.') } },
                'GUIDE.md': { file: { contents: `## ${name} - Guide\n\n- Create files like problems/twoSum.js, problems/twoSum.py\n- Keep input/output examples in comments.\n` } },
                'problems/twoSum.js': { file: { contents: `// Return indices of two numbers adding to target\nexport function twoSum(nums, target){\n  const map=new Map();\n  for(let i=0;i<nums.length;i++){\n    const complement=target-nums[i];\n    if(map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}` } }
            };
        }
        if (type === 'Static Website') {
            return {
                'index.html': { file: { contents: `<!doctype html>\n<html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>${name}</title><link rel='stylesheet' href='styles.css'></head><body><h1>${name}</h1><p>Hello world.</p><script src='script.js'></script></body></html>` } },
                'styles.css': { file: { contents: `body{font-family:system-ui, sans-serif;padding:24px;background:#0b0b0c;color:#fff}` } },
                'script.js': { file: { contents: `console.log('Welcome to ${name}')` } },
                'README.md': { file: { contents: readme(name, 'Simple static website template.') } },
                'GUIDE.md': { file: { contents: `## ${name} - Guide\n\n- Edit index.html, styles.css, script.js.\n- Use a static host to deploy.\n` } }
            };
        }
        // Blank default
        return {
            'README.md': { file: { contents: readme(name, 'Blank project. Start adding files from the chat or editor.') } },
            'GUIDE.md': { file: { contents: `## ${name} - Guide\n\n- Use the chat with @ai to scaffold files.\n- Add collaborators from the left panel.\n` } }
        };
    }

    function createProject(e) {
        e.preventDefault()
        console.log({ projectName })

        const newProject = {
            _id: Date.now().toString(),
            name: projectName,
            users: [user ? user._id : 'default'],
            fileTree: generateBoilerplate(projectType, projectName)
        }

        const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]')
        const updatedProjects = [...existingProjects, newProject]
        localStorage.setItem('projects', JSON.stringify(updatedProjects))
        // meta
        const meta = JSON.parse(localStorage.getItem('projectMeta') || '{}')
        meta[newProject._id] = { favorite: false, archived: false, tags: [], lastOpened: Date.now() }
        localStorage.setItem('projectMeta', JSON.stringify(meta))
        setProject(updatedProjects)
        setIsModalOpen(false)
        setProjectName('')
    }

    useEffect(() => {
        const storedProjects = localStorage.getItem('projects')
        if (storedProjects) {
            setProject(JSON.parse(storedProjects))
        }
    }, [])

    function getMeta(id) {
        const meta = JSON.parse(localStorage.getItem('projectMeta') || '{}')
        return meta[id] || { favorite: false, archived: false, tags: [], lastOpened: 0 }
    }

    function setMeta(id, updater) {
        const meta = JSON.parse(localStorage.getItem('projectMeta') || '{}')
        meta[id] = { ...(meta[id] || {}), ...updater }
        localStorage.setItem('projectMeta', JSON.stringify(meta))
    }

    function toggleFavorite(id) {
        const m = getMeta(id)
        setMeta(id, { favorite: !m.favorite })
        setProject([ ...project ])
    }

    function archiveProject(id) {
        setMeta(id, { archived: true })
        setProject([ ...project ])
    }

    function unarchiveProject(id) {
        setMeta(id, { archived: false })
        setProject([ ...project ])
    }

    function addTagFilter(tag) {
        const next = new Set(activeTags)
        next.add(tag)
        setActiveTags(next)
    }

    function removeTagFilter(tag) {
        const next = new Set(activeTags)
        next.delete(tag)
        setActiveTags(next)
    }

    function createFromTemplate(templateName) {
        const name = `${templateName} ${new Date().toLocaleTimeString()}`
        setProjectName(name)
        setProjectType(templateName)
        const fakeEvent = { preventDefault: () => {} }
        createProject(fakeEvent)
    }

    return (
        <main className='min-h-screen w-screen relative bg-[#0B0B0C] text-white p-6 overflow-hidden'>
            <div className='pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[22rem] w-[48rem] rounded-full opacity-40 blur-[120px]'
                style={{ background: 'radial-gradient(ellipse at center, #7C3AED 10%, #4F46E5 40%, transparent 70%)' }} />

            <header className='relative z-10 flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                    <span className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30'>
                        <i className="ri-robot-2-fill"></i>
                    </span>
                    <h1 className='text-2xl font-semibold tracking-wide'>Projects</h1>
                </div>
                <div className='flex items-center gap-2'>
                    <button onClick={() => setIsModalOpen(true)} className='px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:text-white'>
                        New Project
                    </button>
                    <button
                        onClick={() => navigate('/developer')}
                        className='px-4 py-2 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-400'>
                        Developer
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className='relative z-10 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3'>
                <div className='flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2'>
                    <i className="ri-search-line text-zinc-400"></i>
                    <input value={search} onChange={e=>setSearch(e.target.value)} className='bg-transparent outline-none flex-grow text-sm' placeholder='Search projects...' />
                </div>
                <div className='flex items-center gap-2'>
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className='bg-white/5 border border-white/10 rounded-full px-3 py-2 text-sm outline-none'>
                        <option value='recent'>Sort: Recent</option>
                        <option value='name'>Sort: Name</option>
                    </select>
                    <button onClick={()=>setShowArchived(a=>!a)} className={`px-3 py-2 rounded-full text-sm border ${showArchived ? 'bg-purple-500 text-white border-transparent' : 'bg-white/5 border-white/10 text-zinc-200'}`}>
                        {showArchived ? 'Viewing: Archived' : 'Viewing: Active'}
                    </button>
                </div>
                <div className='flex items-center gap-2 flex-wrap'>
                    <div className='flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-2'>
                        <input value={tagInput} onChange={e=>setTagInput(e.target.value)} className='bg-transparent outline-none text-sm' placeholder='Add tag filter' />
                        <button onClick={()=>{ if(tagInput) { addTagFilter(tagInput.trim()); setTagInput('') } }} className='text-xs text-zinc-300'>Add</button>
                    </div>
                    {[...activeTags].map(t => (
                        <span key={t} className='flex items-center gap-1 text-xs bg-purple-500/20 border border-purple-400/30 rounded-full px-2 py-1'>#{t}<button onClick={()=>removeTagFilter(t)} className='opacity-70'>×</button></span>
                    ))}
                </div>
            </div>

            {/* Templates / Samples */}
            <div className='relative z-10 grid md:grid-cols-3 gap-4 mb-6'>
                {['Express API','Vite React','Next.js App'].map(t => (
                    <button key={t} onClick={()=>createFromTemplate(t)} className='group relative overflow-hidden p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-purple-400/40 text-left'>
                        <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none' style={{background:'radial-gradient(600px 120px at 0% 0%, rgba(124,58,237,0.12), transparent 40%)'}} />
                        <div className='flex items-center justify-between'>
                            <h3 className='font-semibold'>{t}</h3>
                            <i className="ri-add-circle-line text-zinc-400"></i>
                        </div>
                        <p className='text-xs text-zinc-400 mt-1'>Start from template</p>
                    </button>
                ))}
            </div>
            <div className="projects relative z-10 grid gap-4 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="project group relative overflow-hidden p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-purple-400/40 transition">
                    <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none' style={{background:'radial-gradient(600px 120px at 0% 0%, rgba(124,58,237,0.12), transparent 40%)'}} />
                    <div className='flex items-center gap-2'>
                        <span className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white shadow'>
                            <i className="ri-add-fill"></i>
                        </span>
                        <div>
                            <h2 className='font-semibold'>Create Project</h2>
                            <p className='text-xs text-zinc-400'>Start something new</p>
                        </div>
                    </div>
                </button>

                {
                    project
                        .filter(p => showArchived ? getMeta(p._id).archived : !getMeta(p._id).archived)
                        .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
                        .filter(p => activeTags.size === 0 || [...activeTags].every(t=> (getMeta(p._id).tags||[]).includes(t)))
                        .sort((a,b)=> sortBy==='name' ? a.name.localeCompare(b.name) : (getMeta(b._id).lastOpened||0)-(getMeta(a._id).lastOpened||0))
                        .map((project) => (
                        <div key={project._id}
                            onClick={() => {
                                navigate(`/project`, {
                                    state: { project }
                                })
                            }}
                            className="project group relative overflow-hidden cursor-pointer p-5 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:border-purple-400/40 min-w-52 transition">
                            <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none' style={{background:'radial-gradient(600px 120px at 0% 0%, rgba(124,58,237,0.12), transparent 40%)'}} />
                            <div className='flex items-center justify-between'>
                                <h2 className='font-semibold text-lg'>{project.name}</h2>
                                <div className='flex items-center gap-2'>
                                    <button onClick={(e)=>{ e.stopPropagation(); toggleFavorite(project._id) }} title='Favorite'>
                                        <i className={`${getMeta(project._id).favorite ? 'ri-star-fill text-yellow-400' : 'ri-star-line text-zinc-400'} group-hover:text-white`}></i>
                                    </button>
                                    <button onClick={(e)=>{ e.stopPropagation(); setShareProject(project) }} title='Share'>
                                        <i className="ri-user-shared-line text-zinc-400 group-hover:text-white"></i>
                                    </button>
                                    {showArchived ? (
                                        <button onClick={(e)=>{ e.stopPropagation(); unarchiveProject(project._id) }} title='Unarchive'>
                                            <i className="ri-inbox-unarchive-line text-zinc-400 group-hover:text-white"></i>
                                        </button>
                                    ) : (
                                        <button onClick={(e)=>{ e.stopPropagation(); archiveProject(project._id) }} title='Archive'>
                                            <i className="ri-archive-line text-zinc-400 group-hover:text-white"></i>
                                        </button>
                                    )}
                                    <i className="ri-arrow-right-up-line text-zinc-400 group-hover:text-white"></i>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                                <i className="ri-user-line"></i>
                                <span>{project.users.length} collaborators</span>
                            </div>

                        </div>
                    ))
                }


            </div>

            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F0F10] p-6 rounded-2xl border border-white/10 shadow-xl w-full max-w-md">
                        <h2 className="text-xl mb-4 font-semibold">Create New Project</h2>
                        <form onSubmit={createProject}>
                            <div className="mb-4">
                                <label className="block text-sm text-zinc-300 mb-1">Project Name</label>
                                <input
                                    onChange={(e) => setProjectName(e.target.value)}
                                    value={projectName}
                                    type="text" className="mt-1 block w-full p-2 rounded-lg bg-white/5 border border-white/10 outline-none" required />
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm text-zinc-300 mb-1'>Project Type</label>
                                <select value={projectType} onChange={e=>setProjectType(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none'>
                                    <option>Blank</option>
                                    <option>Express API</option>
                                    <option>Vite React</option>
                                    <option>Next.js App</option>
                                    <option>Static Website</option>
                                    <option>DSA (Algorithms)</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-200" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="px-4 py-2 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {shareProject && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#0F0F10] p-6 rounded-2xl border border-white/10 shadow-xl w-full max-w-md">
                        <h2 className='text-xl font-semibold mb-2'>Share “{shareProject.name}”</h2>
                        <p className='text-sm text-zinc-400 mb-4'>Invite collaborators (mock UI)</p>
                        <div className='flex gap-2 mb-3'>
                            <input className='flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none text-sm' placeholder='Email address' />
                            <select className='bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm outline-none'>
                                <option>Editor</option>
                                <option>Viewer</option>
                            </select>
                            <button className='px-3 rounded-lg bg-purple-500 text-white'>Add</button>
                        </div>
                        <div className='flex justify-end gap-2'>
                            <button onClick={()=>setShareProject(null)} className='px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-200'>Close</button>
                        </div>
                    </div>
                </div>
            )}


        </main>
    )
}

export default Home