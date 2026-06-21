import db from '../models/index.js';

export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await db.User.findOne({
      where: { email },
      attributes: ['id', 'name', 'role'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Error resolving internal user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
