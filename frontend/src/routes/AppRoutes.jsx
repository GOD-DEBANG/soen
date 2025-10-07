import React from 'react'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Home from '../screens/Home'
import Project from '../screens/Project'
import Developer from '../screens/Developer'
import Landing from '../screens/Landing'

const AppRoutes = () => {
    return (
        <BrowserRouter>

            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/projects" element={<Home />} />
                <Route path="/project" element={<Project />} />
                <Route path="/developer" element={<Developer />} />
            </Routes>

        </BrowserRouter>
    )
}

export default AppRoutes
