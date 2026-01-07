import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await postsAPI.getAll();
      setPosts(response.data);
    } catch (err) {
      setError('获取帖子列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个帖子吗？')) return;

    try {
      await postsAPI.delete(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  if (loading) return <div className="container">加载中...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>帖子列表</h1>
        {user && (
          <Link to="/posts/new">
            <button className="primary">创建新帖子</button>
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="card">
          <p>暂无帖子</p>
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="card post-item">
            <h2>
              <Link to={`/posts/${post.id}`}>{post.title}</Link>
            </h2>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
              作者: {post.author_name} | {new Date(post.created_at).toLocaleString('zh-CN')} | 
              评论数: {post.comment_count || 0}
            </p>
            <p style={{ marginTop: '10px' }}>
              {post.content.substring(0, 200)}
              {post.content.length > 200 && '...'}
            </p>
            {(user?.id === post.user_id || user?.role === 'admin') && (
              <div style={{ marginTop: '15px' }}>
                <Link to={`/posts/${post.id}/edit`}>
                  <button className="secondary">编辑</button>
                </Link>
                <button
                  className="danger"
                  onClick={() => handleDelete(post.id)}
                  style={{ marginLeft: '10px' }}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default PostList;
