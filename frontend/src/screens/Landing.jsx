import React from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
    const navigate = useNavigate()

    return (
        <main className='min-h-screen w-screen relative bg-[#0B0B0C] text-white overflow-hidden'>
            {/* Glow background */}
            <div className='pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[28rem] w-[60rem] rounded-full opacity-40 blur-[120px]'
                style={{ background: 'radial-gradient(ellipse at center, #7C3AED 10%, #4F46E5 40%, transparent 70%)' }} />

            <header className='flex items-center justify-between px-6 py-4 relative z-10'>
                <div className='flex items-center gap-2'>
                    <span className='inline-flex items-center justify-center w-9 h-9 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30'>
                        <i className="ri-robot-2-fill"></i>
                    </span>
                    <h1 className='font-semibold tracking-wide'>Verve</h1>
                </div>
                <div className='flex items-center gap-2'>
                    <button onClick={() => navigate('/login')} className='px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-200 hover:text-white'>Log In</button>
                    <button onClick={() => navigate('/register')} className='px-4 py-2 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-400'>Sign Up</button>
                </div>
            </header>

            <section className='max-w-6xl mx-auto px-6 pt-16 relative z-10'>
                <div className='rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8'>
                    <div className='flex items-center gap-2 text-xs text-zinc-400 mb-6'>
                        <span className='inline-flex w-2 h-2 rounded-full bg-purple-400'></span>
                        <span>AI Chat Assistant</span>
                    </div>
                    <div className='flex flex-col items-center text-center gap-6'>
                        <div className='w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/70 to-indigo-500/70 blur-[1px] shadow-[0_20px_80px_-20px_rgba(124,58,237,0.5)] flex items-center justify-center'>
                            <div className='w-40 h-40 rounded-full bg-[#0B0B0C] border border-white/10'></div>
                        </div>
                        <h2 className='text-4xl md:text-6xl font-semibold tracking-tight'>Intelligent AI Chat Assistant</h2>
                        <p className='max-w-2xl text-zinc-400'>Welcome to Verve AI Assistant. Ask anything and see how our AI can help you.</p>
                        <div className='flex gap-3'>
                            <button onClick={() => navigate('/projects')} className='px-6 py-2.5 rounded-full bg-purple-500 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-400'>Get Started</button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Landing


