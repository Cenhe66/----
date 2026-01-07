const express = require('express');
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  db.all(`
    SELECT p.*, u.username as author_name,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `, (err, posts) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    res.json(posts);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT p.*, u.username as author_name
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `, [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch post' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    db.all(`
      SELECT c.*, u.username as author_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [id], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }
      res.json({ ...post, comments });
    });
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)',
    [title, content, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create post' });
      }
      res.status(201).json({
        message: 'Post created successfully',
        post: { id: this.lastID, title, content, user_id: userId }
      });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    db.run(
      'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update post' });
        }
        res.json({ message: 'Post updated successfully' });
      }
    );
  });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    db.run('DELETE FROM comments WHERE post_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete comments' });
      }

      db.run('DELETE FROM posts WHERE id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete post' });
        }
        res.json({ message: 'Post deleted successfully' });
      });
    });
  });
});

router.post('/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, post) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    db.run(
      'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)',
      [content, id, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create comment' });
        }
        res.status(201).json({
          message: 'Comment created successfully',
          comment: { id: this.lastID, content, post_id: id, user_id: userId }
        });
      }
    );
  });
});

router.delete('/:postId/comments/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  db.get('SELECT * FROM comments WHERE id = ?', [commentId], (err, comment) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    db.run('DELETE FROM comments WHERE id = ?', [commentId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete comment' });
      }
      res.json({ message: 'Comment deleted successfully' });
    });
  });
});

module.exports = router;
