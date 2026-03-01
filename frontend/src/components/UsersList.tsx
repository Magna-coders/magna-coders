import React, { useEffect, useState } from 'react';
import { getUsers, User } from '../services/users';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.users);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading users...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Members</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
            <img
                src={user.avatar_url || 'https://via.placeholder.com/50'}
                alt={user.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="font-semibold">{user.username}</h3>
              <p className="text-gray-500 text-sm">@{user.username}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersList;
