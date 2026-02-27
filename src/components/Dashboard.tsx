import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { sortTasksByScore, calculateTaskScore } from '../utils';
import type { Task } from '../types';
import './Dashboard.css';

interface DashboardProps {
  onEditTask?: (task: Task) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onEditTask }) => {
  const { state, dispatch } = useApp();
  const { tasks, scoringRules } = state;
  const [recentlyCompletedTask, setRecentlyCompletedTask] = useState<Task | null>(null);
  const [showTagEdit, setShowTagEdit] = useState(false);
  const [editingTag, setEditingTag] = useState<'status' | 'dueDate' | 'duration' | 'growth' | 'scheduledStartTime' | null>(null);
  const [tagEditTask, setTagEditTask] = useState<Task | null>(null);
  const [tagEditValue, setTagEditValue] = useState<any>('');

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t => t.status === 'overdue');

  // 只对未完成的任务进行排序
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const sortedTasks = sortTasksByScore(incompleteTasks, scoringRules);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'overdue': return 'status-overdue';
      default: return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待办';
      case 'completed': return '已完成';
      case 'overdue': return '已逾期';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleCompleteTask = (task: Task) => {
    const updatedTask = { ...task, status: 'completed' as const };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    setRecentlyCompletedTask(updatedTask);
    setTimeout(() => setRecentlyCompletedTask(null), 3000);
  };

  const handleUndoComplete = () => {
    if (recentlyCompletedTask) {
      const updatedTask = { ...recentlyCompletedTask, status: 'pending' as const };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      setRecentlyCompletedTask(null);
    }
  };

  const handleTagClick = (task: Task, tag: 'status' | 'dueDate' | 'duration' | 'growth' | 'scheduledStartTime') => {
    setEditingTag(tag);
    setTagEditTask(task);
    switch (tag) {
      case 'status':
        setTagEditValue(task.status);
        break;
      case 'dueDate':
        setTagEditValue(task.dueDate);
        break;
      case 'duration':
        setTagEditValue(task.estimatedDuration);
        break;
      case 'growth':
        setTagEditValue(task.isGrowthTask);
        break;
      case 'scheduledStartTime':
        setTagEditValue(task.scheduledStartTime || '');
        break;
    }
    setShowTagEdit(true);
  };

  const handleTagEditSubmit = () => {
    if (!tagEditTask) return;

    let updatedTask: Task;
    switch (editingTag) {
      case 'status':
        updatedTask = { ...tagEditTask, status: tagEditValue };
        break;
      case 'dueDate':
        updatedTask = { ...tagEditTask, dueDate: tagEditValue };
        break;
      case 'duration':
        updatedTask = { ...tagEditTask, estimatedDuration: parseInt(tagEditValue) || 60 };
        break;
      case 'growth':
        updatedTask = { ...tagEditTask, isGrowthTask: tagEditValue };
        break;
      case 'scheduledStartTime':
        updatedTask = { ...tagEditTask, scheduledStartTime: tagEditValue };
        break;
      default:
        return;
    }

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    setShowTagEdit(false);
    setEditingTag(null);
    setTagEditTask(null);
    setTagEditValue('');
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return now.toLocaleString('zh-CN', options);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>📊 仪表盘</h1>
        <div className="current-info">
          <span className="current-time">{getCurrentDateTime()}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{pendingTasks.length}</div>
          <div className="stat-label">待办任务</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{completedTasks.length}</div>
          <div className="stat-label">已完成</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{overdueTasks.length}</div>
          <div className="stat-label">已逾期</div>
        </div>
      </div>

      <div className="tasks-section">
        <h2>🔥 优先级任务</h2>
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>暂无任务，点击右下角按钮添加新任务吧！</p>
          </div>
        ) : (
          <div className="tasks-list">
            {sortedTasks.slice(0, 10).map(task => (
              <div key={task.id} className="task-card" onClick={() => onEditTask?.(task)}>
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <div className="task-actions">
                    <span 
                      className={`status-badge ${getStatusBadgeClass(task.status)} tag-clickable`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagClick(task, 'status');
                      }}
                    >
                      {getStatusText(task.status)}
                    </span>
                    {task.status !== 'completed' && (
                      <button 
                        className="complete-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteTask(task);
                        }}
                      >
                        ✅
                      </button>
                    )}
                  </div>
                </div>
                {task.description && <p className="task-description">{task.description}</p>}
                <div className="task-footer">
                  <span 
                    className="task-date tag-clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(task, 'dueDate');
                    }}
                  >
                    📅 {formatDate(task.dueDate)}
                  </span>
                  <span 
                    className="task-time tag-clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(task, 'scheduledStartTime');
                    }}
                  >
                    ⏰ {task.scheduledStartTime ? new Date(task.scheduledStartTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  <span 
                    className="task-duration tag-clickable"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(task, 'duration');
                    }}
                  >
                    ⏱️ {task.estimatedDuration}分钟
                  </span>
                  <span className="task-score">⭐ {Math.round(calculateTaskScore(task, scoringRules))}</span>
                  {task.isGrowthTask && (
                    <span 
                      className="growth-badge tag-clickable"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagClick(task, 'growth');
                      }}
                    >
                      🌱 成长
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {recentlyCompletedTask && (
        <div className="undo-notification">
          <span>已完成任务：{recentlyCompletedTask.title}</span>
          <button className="undo-btn" onClick={handleUndoComplete}>
            撤回
          </button>
        </div>
      )}

      {showTagEdit && tagEditTask && editingTag && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowTagEdit(false)}>
          <div className="modal-content">
            <h2>编辑标签</h2>
            <div className="form-group">
              <label>
                {editingTag === 'status' && '任务状态'}
                {editingTag === 'dueDate' && '截止日期'}
                {editingTag === 'duration' && '预估耗时（分钟）'}
                {editingTag === 'growth' && '成长任务'}
                {editingTag === 'scheduledStartTime' && '计划开始时间'}
              </label>
              {editingTag === 'status' && (
                <select
                  value={tagEditValue}
                  onChange={(e) => setTagEditValue(e.target.value)}
                >
                  <option value="pending">待办</option>
                  <option value="completed">已完成</option>
                  <option value="overdue">已逾期</option>
                </select>
              )}
              {editingTag === 'dueDate' && (
                <input
                  type="date"
                  value={tagEditValue}
                  onChange={(e) => setTagEditValue(e.target.value)}
                />
              )}
              {editingTag === 'duration' && (
                <input
                  type="number"
                  value={tagEditValue}
                  onChange={(e) => setTagEditValue(e.target.value)}
                  min="1"
                />
              )}
              {editingTag === 'growth' && (
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={tagEditValue}
                    onChange={(e) => setTagEditValue(e.target.checked)}
                  />
                  是成长任务
                </label>
              )}
              {editingTag === 'scheduledStartTime' && (
                <input
                  type="datetime-local"
                  value={tagEditValue ? tagEditValue.slice(0, 16) : ''}
                  onChange={(e) => setTagEditValue(e.target.value ? e.target.value + ':00' : '')}
                />
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowTagEdit(false)}>
                取消
              </button>
              <button type="button" className="submit-btn" onClick={handleTagEditSubmit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
