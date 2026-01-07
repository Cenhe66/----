import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await postsAPI.getById(id);
      setPost(response.data);
    } catch (err) {
      setError('获取帖子详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这个帖子吗？')) return;

    try {
      await postsAPI.delete(id);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || '删除失败');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      await postsAPI.addComment(id, { content: comment });
      setComment('');
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.error || '评论失败');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      await postsAPI.deleteComment(id, commentId);
      fetchPost();
    } catch (err) {
      alert(err.response?.data?.error || '删除评论失败');
    }
  };

  if (loading) return <div className="container">加载中...</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!post) return <div className="container">帖子不存在</div>;

  return (
    <div className="container">
      <Link to="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
        ← 返回列表
      </Link>

      <div className="card">
        <h1>{post.title}</h1>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
          作者: {post.author_name} | {new Date(post.created_at).toLocaleString('zh-CN')}
          {post.updated_at !== post.created_at && ` | 更新于 ${new Date(post.updated_at).toLocaleString('zh-CN')}`}
        </p>
        <div style={{ marginTop: '20px', lineHeight: '1.6' }}>
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index} style={{ marginBottom: '10px' }}>
              {paragraph}
            </p>
          ))}
        </div>
        {(user?.id === post.user_id || user?.role === 'admin') && (
          <div style={{ marginTop: '20px' }}>
            <Link to={`/posts/${post.id}/edit`}>
              <button className="secondary">编辑</button>
            </Link>
            <button className="danger" onClick={handleDelete} style={{ marginLeft: '10px' }}>
              删除
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>评论 ({post.comments?.length || 0})</h3>
        {user && (
          <form onSubmit={handleAddComment} style={{ marginTop: '20px' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写下你的评论..."
              rows="3"
              required
            />
            <button type="submit" className="primary">发表评论</button>
          </form>
        )}

        <div style={{ marginTop: '20px' }}>
          {post.comments?.length === 0 ? (
            <p>暂无评论</p>
          ) : (
            post.comments.map(comment => (
              <div key={comment.id} className="comment">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{comment.author_name}</strong>
                  <span style={{ color: '#666', fontSize: '12px' }}>
                    {new Date(comment.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <p style={{ marginTop: '10px' }}>{comment.content}</p>
                {(user?.id === comment.user_id || user?.role === 'admin') && (
                  <button
                    className="danger"
                    onClick={() => handleDeleteComment(comment.id)}
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    删除
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
