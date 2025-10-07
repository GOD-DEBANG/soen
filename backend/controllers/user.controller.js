// User controllers removed - database integration will be added later
// For now, using localStorage-based authentication in frontend

export const getAllUsersController = async (req, res) => {
    // Return mock users for now - will be replaced with database later
    const mockUsers = [
        { _id: 'user1', email: 'user1@example.com' },
        { _id: 'user2', email: 'user2@example.com' },
        { _id: 'user3', email: 'user3@example.com' }
    ];
    
    return res.status(200).json({
        users: mockUsers
    });
}
