// Project controllers removed - database integration will be added later
// For now, using localStorage-based project management in frontend

export const getAllProject = async (req, res) => {
    // Return empty array for now - projects are managed in localStorage
    return res.status(200).json({
        projects: []
    });
}

export const getProjectById = async (req, res) => {
    const { projectId } = req.params;
    
    // Return mock project for now
    const mockProject = {
        _id: projectId,
        name: 'Sample Project',
        users: ['user1', 'user2'],
        fileTree: {}
    };
    
    return res.status(200).json({
        project: mockProject
    });
}
