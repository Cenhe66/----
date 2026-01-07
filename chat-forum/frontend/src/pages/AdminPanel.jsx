import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('无权访问');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (err) {
      setError('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.error || '更新失败');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('确定要删除这个用户吗？')) return;

    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (loading) return <div className="container">加载中...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>管理员面板</h1>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>用户管理</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>用户名</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>邮箱</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>角色</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>注册时间</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>{u.id}</td>
                <td style={{ padding: '10px' }}>{u.username}</td>
                <td style={{ padding: '10px' }}>{u.email}</td>
                <td style={{ padding: '10px' }}>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === user.id}
                    style={{ padding: '5px' }}
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
                <td style={{ padding: '10px' }}>
                  {new Date(u.created_at).toLocaleString('zh-CN')}
                </td>
                <td style={{ padding: '10px' }}>
                  {u.id !== user.id && (
                    <button
                      className="danger"
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      删除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
