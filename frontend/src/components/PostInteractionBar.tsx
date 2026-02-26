'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Heart, MessageSquare, Share2, Send, Edit2, Trash2, Reply } from 'lucide-react';
import type { Comment } from '@/types';
import Image from 'next/image';

const USE_REAL_API = true;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Helper for authenticated requests
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Check common keys
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  }
  return null;
};

const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

interface PostInteractionBarProps {
  initialLikes: number;
  initialComments: number;
  initialCommentsData?: Comment[];
  postId: string;
  children?: React.ReactNode;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
  onReply: (id: string, replyContent: string) => void;
}

function CommentItem({ comment, onLike, onDelete, onEdit, onReply }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSaveEdit = () => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
  };

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4A261] to-[#E50914] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative overflow-hidden">
          {comment.author.avatar && (comment.author.avatar.startsWith('/') || comment.author.avatar.startsWith('http')) ? (
              <Image src={comment.author.avatar} alt={comment.author.name} fill sizes="32px" className="object-cover" />
          ) : (
              comment.author.name.charAt(0)
          )}
      </div>
      <div className="flex-1">
          <div className="bg-gray-50 p-3 rounded-xl rounded-tl-none">
            <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-gray-900">{comment.author.name}</span>
                <span className="text-xs text-gray-400">{comment.createdAt}</span>
            </div>
            
            {isEditing ? (
              <div className="mt-1">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#E50914] bg-white resize-none"
                  rows={2}
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSaveEdit} className="text-xs bg-[#E50914] text-white px-2 py-1 rounded-md hover:bg-[#cc0812]">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700">{comment.content}</p>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 pl-1">
            <button 
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${comment.isLiked ? 'text-[#E50914]' : 'text-gray-500 hover:text-[#E50914]'}`}
            >
              <Heart size={12} className={comment.isLiked ? 'fill-[#E50914]' : ''} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
              Like
            </button>
            
            <button 
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Reply size={12} />
              Reply
            </button>

            {comment.isOwner && (
              <>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <Edit2 size={12} />
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#E50914] transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && (
             <div className="mt-2 flex gap-2">
                <input 
                  type="text" 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-[#E50914]"
                />
                <button 
                  onClick={handleSendReply}
                  disabled={!replyContent.trim()}
                  className="text-[#E50914] disabled:text-gray-300"
                >
                  <Send size={14} />
                </button>
             </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 pl-3 border-l-2 border-gray-100 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  onLike={onLike} 
                  onDelete={onDelete} 
                  onEdit={onEdit}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default function PostInteractionBar({ 
  initialLikes, 
  initialComments,
  initialCommentsData, 
  postId,
  children,
  className = ""
}: PostInteractionBarProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [commentsCount, setCommentsCount] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  
  // Pagination & Sorting State
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [sortOrder, setSortOrder] = useState<'recent' | 'relevant'>('recent');
  const [isInputFocused, setIsInputFocused] = useState(false);

  // API Integration: Fetch Comments
  // Fetch comments from backend (paginated, nested)
  React.useEffect(() => {
    if (USE_REAL_API && showComments) {
      const fetchComments = async () => {
        try {
          const res = await authenticatedFetch(`/api/posts/${postId}/comments?page=1&limit=20`);
          setComments(res.comments || res || []);
        } catch (error) {
          console.error('Failed to fetch comments:', error);
        }
      };
      fetchComments();
    }
  }, [showComments, postId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (liked) {
        await authenticatedFetch(`/api/posts/${postId}/unlike`, { method: 'POST' });
        setLiked(false);
        setLikes(prev => prev - 1);
      } else {
        await authenticatedFetch(`/api/posts/${postId}/like`, { method: 'POST' });
        setLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to like/unlike post:', err);
      // Revert on error
      setLiked(!liked);
    }
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowComments(!showComments);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
  };
  
  const handleAddComment = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const newComment: Comment = await authenticatedFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText })
      });
      setComments([newComment, ...comments]);
      setCommentsCount(prev => prev + 1);
      setCommentText('');
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await authenticatedFetch(`/api/comments/${commentId}/like`, {
        method: 'POST'
      });
      const updateLikes = (list: Comment[]): Comment[] =>
        list.map(c => {
          if (c.id === commentId) {
            return { ...c, isLiked: res.liked, likes: res.likesCount };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateLikes(c.replies) };
          }
          return c;
        });
      setComments(updateLikes(comments));
    } catch (err) {
      alert('Failed to like comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await authenticatedFetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Accept': '*/*'
        }
      });
      const deleteFromList = (list: Comment[]): Comment[] =>
        list.filter(c => {
          if (c.id === commentId) return false;
          if (c.replies && c.replies.length > 0) {
            c.replies = deleteFromList(c.replies);
          }
          return true;
        });
      setComments(deleteFromList(comments));
      setCommentsCount(prev => prev - 1);
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const updated = await authenticatedFetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: newContent })
      });
      const editInList = (list: Comment[]): Comment[] =>
        list.map(c => {
          if (c.id === commentId) {
            return { ...c, content: updated.content || newContent };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: editInList(c.replies) };
          }
          return c;
        });
      setComments(editInList(comments));
    } catch (err) {
      alert('Failed to edit comment');
    }
  };

  const handleReplyComment = async (parentId: string, replyContent: string) => {
    try {
      const reply: Comment = await authenticatedFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent, parentId })
      });
      const addReply = (list: Comment[]): Comment[] =>
        list.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), reply] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addReply(c.replies) };
          }
          return c;
        });
      setComments(addReply(comments));
      setCommentsCount(prev => prev + 1);
    } catch (err) {
      alert('Failed to reply to comment');
    }
  };

  const sortedComments = useMemo(() => {
      const sorted = [...comments];
      if (sortOrder === 'recent') {
          sorted.sort((a, b) => b.timestamp - a.timestamp);
      } else {
          sorted.sort((a, b) => b.likes - a.likes);
      }
      return sorted;
  }, [comments, sortOrder]);

  const visibleComments = sortedComments.slice(0, visibleCommentsCount);
  const hasMoreComments = comments.length > visibleCommentsCount;

  const handleLoadMore = (e?: React.MouseEvent) => {
      e?.preventDefault();
      setVisibleCommentsCount(prev => prev + 5);
  };

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastCommentRef = useCallback((node: HTMLDivElement) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreComments) {
        handleLoadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [hasMoreComments]);

  return (
      <div className={`pt-4 border-t border-gray-100 ${className}`} onClick={e => e.preventDefault()}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
           <div className="flex items-center gap-6">
              <div 
                  role="button"
                  onClick={handleLike}
                  className={`flex items-center gap-2 transition-colors group cursor-pointer ${liked ? 'text-[#E50914]' : 'text-gray-500 hover:text-[#E50914]'}`}
              >
                 <Heart size={20} className={liked ? 'fill-[#E50914]' : 'group-hover:fill-[#E50914]'} />
                 <span className="text-sm font-medium">{likes}</span>
              </div>
              <div 
                  role="button"
                  onClick={handleCommentClick}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#E50914] transition-colors cursor-pointer"
              >
                 <MessageSquare size={20} />
                 <span className="text-sm font-medium">{commentsCount}</span>
              </div>
              <div 
                  role="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#E50914] transition-colors cursor-pointer"
              >
                 <Share2 size={20} />
                 <span className="text-sm font-medium">Share</span>
              </div>
           </div>
           {children && <div onClick={e => e.preventDefault()}>{children}</div>}
        </div>
        
        {showComments && (
           <div className="mt-4 pt-4 border-t border-gray-50 w-full animate-in fade-in slide-in-from-top-2 duration-200 cursor-default" onClick={e => e.preventDefault()}>
              
              {/* Sorting Controls */}
              {comments.length > 0 && (
                <div className="flex justify-end mb-4">
                  <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <button 
                      onClick={(e) => { e.preventDefault(); setSortOrder('recent'); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortOrder === 'recent' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Recent
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); setSortOrder('relevant'); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${sortOrder === 'relevant' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Relevant
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {comments.length > 0 ? (
                 <div className="mb-4 space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {visibleComments.map((c, index) => (
                      <div key={c.id} ref={index === visibleComments.length - 1 ? lastCommentRef : null}>
                        <CommentItem 
                           comment={c} 
                           onLike={handleLikeComment}
                           onDelete={handleDeleteComment}
                           onEdit={handleEditComment}
                           onReply={handleReplyComment}
                        />
                      </div>
                    ))}
                    
                    {/* Loading Indicator */}
                    {hasMoreComments && (
                      <div className="pt-2 flex justify-center">
                          <div className="w-6 h-6 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                 </div>
              ) : (
                  <div className="mb-4 text-center text-gray-400 text-sm italic">
                      No comments yet. Be the first to share your thoughts!
                  </div>
              )}
              
              {/* Input */}
              {isInputFocused && <div className="h-[50px] md:hidden" />} {/* Placeholder to prevent layout jump on mobile */}
              <div 
                className={`flex gap-2 transition-all ${isInputFocused ? 'fixed left-0 right-0 p-3 bg-white border-t border-gray-200 z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-none md:shadow-none' : ''}`}
                style={isInputFocused ? { bottom: '0', position: 'fixed' } : {}}
              >
                 <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onFocus={() => {
                        setIsInputFocused(true);
                        // Force layout update for mobile keyboards
                        if (window.visualViewport) {
                            window.scrollTo(0, 0); // Reset scroll to avoid jumpiness
                        }
                    }}
                    onBlur={() => {
                        setTimeout(() => setIsInputFocused(false), 100);
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914]"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') handleAddComment(e);
                    }}
                 />
                 <button 
                    onClick={handleAddComment}
                    className={`p-2 rounded-full transition-all ${commentText.trim() ? 'bg-[#E50914] text-white hover:bg-[#cc0812] shadow-md' : 'bg-gray-100 text-gray-400'}`}
                    disabled={!commentText.trim()}
                 >
                    <Send size={16} />
                 </button>
              </div>
           </div>
        )}
      </div>
  );
}
