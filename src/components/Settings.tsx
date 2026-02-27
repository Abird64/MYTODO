import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { llmService } from '../services/api';
import './Settings.css';

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const { scoringRules } = state;

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [model, setModel] = useState('');
  const [localScoringRules, setLocalScoringRules] = useState(scoringRules);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const config = llmService.getApiConfig();
    setApiKey(config.apiKey);
    setApiUrl(config.apiUrl);
    setModel(config.model);
  }, []);

  useEffect(() => {
    setLocalScoringRules(scoringRules);
  }, [scoringRules]);

  const handleSaveApiConfig = () => {
    llmService.setApiConfig(apiKey, apiUrl || undefined, model || undefined);
    setSaveMessage('API 配置已保存！');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveScoringRules = () => {
    dispatch({ type: 'UPDATE_SCORING_RULES', payload: localScoringRules });
    setSaveMessage('评分规则已保存！');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleResetData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>⚙️ 设置</h1>
      </div>

      {saveMessage && (
        <div className="save-message">{saveMessage}</div>
      )}

      <div className="settings-section">
        <h2>🔑 API 配置</h2>
        <div className="form-group">
          <label>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入您的 API Key"
          />
        </div>
        <div className="form-group">
          <label>API URL</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.openai.com/v1/chat/completions"
          />
        </div>
        <div className="form-group">
          <label>模型名称</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="deepseek-chat"
          />
        </div>
        <button className="save-btn" onClick={handleSaveApiConfig}>
          保存 API 配置
        </button>
      </div>

      <div className="settings-section">
        <h2>📊 评分规则</h2>
        <div className="form-group">
          <label>紧急度权重 ({localScoringRules.urgencyWeight})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localScoringRules.urgencyWeight}
            onChange={(e) => setLocalScoringRules({
              ...localScoringRules,
              urgencyWeight: parseFloat(e.target.value)
            })}
          />
        </div>
        <div className="form-group">
          <label>成长价值权重 ({localScoringRules.growthValueWeight})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localScoringRules.growthValueWeight}
            onChange={(e) => setLocalScoringRules({
              ...localScoringRules,
              growthValueWeight: parseFloat(e.target.value)
            })}
          />
        </div>
        <div className="form-group">
          <label>难度权重 ({localScoringRules.difficultyWeight})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localScoringRules.difficultyWeight}
            onChange={(e) => setLocalScoringRules({
              ...localScoringRules,
              difficultyWeight: parseFloat(e.target.value)
            })}
          />
        </div>
        <div className="form-group">
          <label>耗时权重 ({localScoringRules.durationWeight})</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={localScoringRules.durationWeight}
            onChange={(e) => setLocalScoringRules({
              ...localScoringRules,
              durationWeight: parseFloat(e.target.value)
            })}
          />
        </div>
        <div className="form-group">
          <label>成长任务倍数 ({localScoringRules.growthTaskMultiplier})</label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={localScoringRules.growthTaskMultiplier}
            onChange={(e) => setLocalScoringRules({
              ...localScoringRules,
              growthTaskMultiplier: parseFloat(e.target.value)
            })}
          />
        </div>
        <button className="save-btn" onClick={handleSaveScoringRules}>
          保存评分规则
        </button>
      </div>

      <div className="settings-section danger-zone">
        <h2>⚠️ 危险操作</h2>
        <button className="danger-btn" onClick={handleResetData}>
          重置所有数据
        </button>
      </div>
    </div>
  );
};

export default Settings;
