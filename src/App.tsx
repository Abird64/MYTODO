import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import Settings from './components/Settings';
import VoiceInputButton from './components/VoiceInputButton';
import { useApp } from './store/AppContext';
import type { Task } from './types';
import type { TaskParseResult } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'tasks' | 'settings'>('dashboard');
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const { state, dispatch } = useApp();

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setCurrentView('tasks');
  };

  const handleCloseTaskEdit = () => {
    setTaskToEdit(null);
  };

  const handleTaskCreated = (parsedTask: TaskParseResult) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: parsedTask.title,
      description: parsedTask.description,
      dueDate: parsedTask.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      scheduledStartTime: parsedTask.scheduledStartTime,
      scheduledEndTime: parsedTask.scheduledEndTime,
      estimatedDuration: parsedTask.estimatedDuration || 60,
      urgency: parsedTask.urgency || 5,
      growthValue: parsedTask.growthValue || 5,
      difficulty: parsedTask.difficulty || 5,
      status: 'pending',
      isGrowthTask: parsedTask.isGrowthTask || false,
      createdAt: new Date().toISOString(),
      repeatConfig: parsedTask.isRepeat ? {
        type: parsedTask.repeatType as 'daily' | 'weekly' | 'monthly' || 'daily',
        interval: parsedTask.repeatInterval || 1,
        endDate: parsedTask.repeatEndDate
      } : undefined
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
  };

  const handleTaskModified = (taskId: string, updates: any) => {
    // 查找匹配的任务
    const taskToUpdate = state.tasks.find(task => 
      task.title.includes(taskId) || 
      (task.description && task.description.includes(taskId))
    );

    if (taskToUpdate) {
      const updatedTask: Task = {
        ...taskToUpdate,
        ...updates
      };
      dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    }
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 仪表盘
        </button>
        <button
          className={`nav-btn ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => setCurrentView('tasks')}
        >
          ✅ 任务管理
        </button>
        <button
          className={`nav-btn ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          ⚙️ 设置
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard onEditTask={handleEditTask} />
        )}
        {currentView === 'tasks' && (
          <TaskManager
            initialTaskToEdit={taskToEdit}
            onClose={handleCloseTaskEdit}
          />
        )}
        {currentView === 'settings' && <Settings />}
      </main>

      {currentView !== 'settings' && (
        <VoiceInputButton 
          onTaskCreated={handleTaskCreated} 
          onTaskModified={handleTaskModified} 
        />
      )}
    </div>
  );
};

export default App;
