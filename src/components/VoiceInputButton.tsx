import React, { useState, useRef, useEffect } from 'react';
import { voiceService, llmService } from '../services/api';
import type { TaskParseResult, TaskModifyResult } from '../services/api';
import './VoiceInputButton.css';

interface VoiceInputButtonProps {
  onTaskCreated?: (parsedTask: TaskParseResult) => void;
  onTaskModified?: (taskId: string, updates: any) => void;
}

const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTaskCreated, onTaskModified }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleStartListening = () => {
    if (!voiceService.isSupported()) {
      setError('您的浏览器不支持语音识别');
      return;
    }

    setIsListening(true);
    setError(null);

    voiceService.startListening(
      (text) => {
        setIsListening(false);
        setTextInput(text);
        setShowModal(true);
      },
      (err) => {
        setIsListening(false);
        setError(err);
      }
    );
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  const handleProcessText = async () => {
    if (!textInput.trim()) {
      setError('请输入任务描述');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 检查输入是否包含修改任务的关键词
      const modifyKeywords = ['修改', '更改', '变更', '调整', '改成', '改为', '更新'];
      const isModifyRequest = modifyKeywords.some(keyword => textInput.includes(keyword));

      if (isModifyRequest) {
        // 处理任务修改请求
        const modifyResult = await llmService.modifyTaskFromText(textInput);
        onTaskModified?.(modifyResult.taskId, modifyResult.updates);
      } else {
        // 处理任务创建请求
        const parsedTask = await llmService.parseTaskFromText(textInput);
        onTaskCreated?.(parsedTask);
      }

      setShowModal(false);
      setTextInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualInput = () => {
    setShowModal(true);
  };

  useEffect(() => {
    if (showModal && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showModal]);

  return (
    <>
      <div className="voice-input-container">
        <button
          className="voice-input-button"
          onClick={handleManualInput}
          onContextMenu={(e) => {
            e.preventDefault();
            handleStartListening();
          }}
          title="左键手动输入，右键语音输入"
        >
          <span className="button-icon">
            {isListening ? '🎤' : '✨'}
          </span>
        </button>
        {isListening && (
          <button
            className="stop-listening-btn"
            onClick={handleStopListening}
          >
            停止
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <h2>创建新任务</h2>
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleProcessText();
                }
              }}
              placeholder="描述您的任务，例如：&quot;明天下午3点之前完成项目报告，大概需要2小时&quot;"
              rows={4}
              className="task-input"
            />
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowModal(false);
                  setTextInput('');
                  setError(null);
                }}
              >
                取消
              </button>
              <button
                className="submit-btn"
                onClick={handleProcessText}
                disabled={isProcessing}
              >
                {isProcessing ? '处理中...' : 'AI 解析并创建'}
              </button>
            </div>
            <p className="hint">提示：左键点击按钮手动输入，右键点击使用语音输入</p>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceInputButton;
