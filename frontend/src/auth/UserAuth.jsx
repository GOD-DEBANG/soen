import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../context/user.context'
import axios from '../config/axios'

const UserAuth = ({ children }) => {

    const { user, setUser } = useContext(UserContext)
    const [ loading, setLoading ] = useState(true)
    const token = localStorage.getItem('token')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const res = await axios.get('/users/profile')
                    setUser(res.data.user)
                    setLoading(false)
                } catch (error) {
                    localStorage.removeItem('token')
                    navigate('/login')
                }
            } else {
                navigate('/login')
            }
        }

        if (!user) {
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [token, user, navigate, setUser])

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <>
            {children}</>
    )
}

export default UserAuth