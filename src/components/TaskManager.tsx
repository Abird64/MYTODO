import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { sortTasksByScore, calculateTaskScore } from '../utils';
import type { Task, TaskStatus } from '../types';
import './TaskManager.css';

interface TaskManagerProps {
  initialTaskToEdit?: Task | null;
  onClose?: () => void;
}

const TaskManager: React.FC<TaskManagerProps> = ({ initialTaskToEdit, onClose }) => {
  const { state, dispatch } = useApp();
  const { tasks, scoringRules } = state;
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTagEdit, setShowTagEdit] = useState(false);
  const [editingTag, setEditingTag] = useState<'status' | 'dueDate' | 'duration' | 'growth' | null>(null);
  const [tagEditTask, setTagEditTask] = useState<Task | null>(null);
  const [tagEditValue, setTagEditValue] = useState<any>('');
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scheduledStartTime: undefined,
    estimatedDuration: 60,
    urgency: 5,
    growthValue: 5,
    difficulty: 5,
    status: 'pending',
    isGrowthTask: false,
  });

  useEffect(() => {
    if (initialTaskToEdit) {
      setEditingTask(initialTaskToEdit);
      setFormData(initialTaskToEdit);
      setShowForm(true);
    }
  }, [initialTaskToEdit]);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filter);

  const sortedTasks = sortTasksByScore(filteredTasks, scoringRules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (editingTask) {
      const updatedTask: Task = {
        ...editingTask,
        ...formData as Task,
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        title: formData.title || '',
        description: formData.description,
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
        estimatedDuration: formData.estimatedDuration || 60,
        urgency: formData.urgency || 5,
        growthValue: formData.growthValue || 5,
        difficulty: formData.difficulty || 5,
        status: formData.status || 'pending',
        isGrowthTask: formData.isGrowthTask || false,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scheduledStartTime: undefined,
      estimatedDuration: 60,
      urgency: 5,
      growthValue: 5,
      difficulty: 5,
      status: 'pending',
      isGrowthTask: false,
    });
    setEditingTask(null);
    setShowForm(false);
    onClose?.();
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'REMOVE_TASK', payload: id });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData(task);
    setShowForm(true);
  };

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="task-manager">
      <div className="task-manager-header">
        <h1>✅ 任务管理</h1>
        <button className="add-task-btn" onClick={() => setShowForm(true)}>
          ➕ 新建任务
        </button>
      </div>

      <div className="filter-bar">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          待办
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          已完成
        </button>
        <button 
          className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilter('overdue')}
        >
          已逾期
        </button>
      </div>

      {showForm && (
        <div className="task-form-overlay" onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div className="task-form">
            <h2>{editingTask ? '编辑任务' : '新建任务'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>任务标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入任务标题"
                  required
                />
              </div>

              <div className="form-group">
                <label>任务描述</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="输入任务描述"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>截止日期</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>计划开始时间</label>
                  <input
                    type="time"
                    value={formData.scheduledStartTime ? new Date(formData.scheduledStartTime).toTimeString().substring(0, 5) : ''}
                    onChange={(e) => {
                      if (formData.dueDate) {
                        const date = formData.dueDate;
                        const time = e.target.value;
                        setFormData({ ...formData, scheduledStartTime: `${date}T${time}:00` });
                      }
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>预估耗时（分钟）</label>
                  <input
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 60 })}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>紧急度 (1-10)</label>
                  <input
                    type="number"
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>成长价值 (1-10)</label>
                  <input
                    type="number"
                    value={formData.growthValue}
                    onChange={(e) => setFormData({ ...formData, growthValue: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>难度 (1-10)</label>
                  <input
                    type="number"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) || 5 })}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  >
                    <option value="pending">待办</option>
                    <option value="completed">已完成</option>
                    <option value="overdue">已逾期</option>
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isGrowthTask}
                      onChange={(e) => setFormData({ ...formData, isGrowthTask: e.target.checked })}
                    />
                    成长任务
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  取消
                </button>
                <button type="submit" className="submit-btn">
                  {editingTask ? '保存修改' : '创建任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tasks-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            <p>暂无任务</p>
          </div>
        ) : (
          sortedTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-actions">
                  <button className="edit-btn" onClick={() => handleEdit(task)}>
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(task.id)}>
                    🗑️
                  </button>
                </div>
              </div>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-footer">
                  <span 
                    className={`status-badge ${getStatusBadgeClass(task.status)} tag-clickable`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(task, 'status');
                    }}
                  >
                    {getStatusText(task.status)}
                  </span>
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
          ))
        )}
      </div>

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
                  onChange={(e) => setTagEditValue(e.target.value as TaskStatus)}
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

export default TaskManager;
