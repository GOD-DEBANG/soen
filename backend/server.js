import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3001;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


io.use(async (socket, next) => {
    try {
        const projectId = socket.handshake.query.projectId || 'default';
        socket.project = { _id: projectId };
        socket.user = { userId: 'default' };
        next();
    } catch (error) {
        next(error);
    }
});


io.on('connection', socket => {
    socket.roomId = (socket.project && socket.project._id ? String(socket.project._id) : 'default')


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {

            try {
                const prompt = message.replace('@ai', '');

                const result = await generateResult(prompt);
                console.log('AI Result:', result);

                io.to(socket.roomId).emit('project-message', {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            } catch (error) {
                console.error('AI Error:', error);
                io.to(socket.roomId).emit('project-message', {
                    message: JSON.stringify({ text: 'Sorry, I encountered an error. Please try again.' }),
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            }

            return
        }


    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})