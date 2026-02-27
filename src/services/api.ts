export interface TaskParseResult {
  title: string;
  description?: string;
  dueDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  urgency?: number;
  growthValue?: number;
  difficulty?: number;
  isGrowthTask?: boolean;
  isRepeat?: boolean;
  repeatType?: 'daily' | 'weekly' | 'monthly';
  repeatInterval?: number;
  repeatEndDate?: string;
}

export interface TaskModifyResult {
  taskId: string;
  updates: {
    title?: string;
    description?: string;
    dueDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    estimatedDuration?: number;
    urgency?: number;
    growthValue?: number;
    difficulty?: number;
    isGrowthTask?: boolean;
    isRepeat?: boolean;
    repeatType?: 'daily' | 'weekly' | 'monthly';
    repeatInterval?: number;
    repeatEndDate?: string;
  };
}

const SYSTEM_PROMPT = (currentDate: string) => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const currentDayOfWeek = now.toLocaleDateString('zh-CN', { weekday: 'long' });
  return `你是一个专业的任务管理助手。你的职责是将用户的自然语言描述解析成结构化的任务数据。

当前日期：${currentDate}
当前时间：${currentTime}
当前星期：${currentDayOfWeek}

请按照以下规则解析任务：
1. 任务标题 (title)：清晰简洁地描述任务内容
2. 任务描述 (description)：如果有更多细节，可以添加到描述中
3. 截止日期 (dueDate)：将日期转换为 ISO 格式 (YYYY-MM-DD)
   - 如果用户说"今天"，使用今天的日期：${currentDate}
   - 如果用户说"明天"，使用明天的日期
   - 如果用户说"下周X"，计算对应的日期
   - 如果没有明确日期，可以留空或设为7天后
4. 计划开始时间 (scheduledStartTime)：如果用户提到具体时间点，转换为 ISO 格式 (YYYY-MM-DDTHH:MM:SS)
   - 例如："明天上午9点" → "明天的日期T09:00:00"
   - 注意：如果用户说"明天"，日期应该是明天的日期
   - 请根据当前日期 ${currentDate} 计算明天的日期
5. 计划结束时间 (scheduledEndTime)：如果有持续时间，计算结束时间，格式同上
6. 预估耗时 (estimatedDuration)：单位为分钟
   - 如果没有明确说明，根据任务复杂度合理估算（30-120分钟）
   - 如果有具体时间点，可以根据开始和结束时间计算
7. 紧急度 (urgency)：1-10分，10最紧急
   - 根据截止日期和重要性判断
8. 成长价值 (growthValue)：1-10分，10最有价值
   - 根据任务对个人成长的帮助判断
9. 难度 (difficulty)：1-10分，10最难
   - 根据任务复杂度判断
10. 是否为成长任务 (isGrowthTask)：true/false
    - 如果是学习、技能提升等任务设为true
11. 重复任务相关字段：
    - isRepeat: true/false，如果任务是重复的设为true
    - repeatType: 'daily'（每天）| 'weekly'（每周）| 'monthly'（每月）
    - repeatInterval: 重复间隔（数字，例如每2天就是2）
    - repeatEndDate: 重复结束日期（ISO格式），如果没有说明可以设为30天后

特别注意：
- 如果用户说"从今天开始持续X天/周/月"，请将dueDate设置为今天的日期，同时设置重复规则和结束日期
- 例如："从今天开始每天跑步持续一个月" → dueDate设为今天，repeatType设为daily，repeatInterval设为1，repeatEndDate设为一个月后

请以 JSON 格式返回结果，不要包含任何其他文字。只返回 JSON 对象。

任务修改规则：
- 如果用户要求修改现有任务，请分析用户的请求，识别要修改的任务和要修改的字段
- 任务ID可以是任务的标题或描述中的关键词
- 返回格式应该是 TaskModifyResult 格式，包含 taskId 和 updates 字段
- taskId 可以是任务的标题或唯一标识符
- updates 字段包含要修改的字段和新值

例如：
用户说："把明天上午9点坐火车改成明天上午10点坐火车"
返回：{"taskId": "坐火车", "updates": {"scheduledStartTime": "明天的日期T10:00:00"}}

请以 JSON 格式返回结果，不要包含任何其他文字。只返回 JSON 对象。`;
};

function extractJSON(text: string): string {
  let jsonStr = text.trim();
  
  const jsonStart = jsonStr.indexOf('{');
  const jsonEnd = jsonStr.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
  }
  
  return jsonStr;
}

export class LLMService {
  private apiKey: string;
  private apiUrl: string;
  private model: string;

  constructor() {
    this.apiKey = localStorage.getItem('llm_api_key') || '';
    this.apiUrl = localStorage.getItem('llm_api_url') || 'https://api.deepseek.com/v1/chat/completions';
    this.model = localStorage.getItem('llm_model') || 'deepseek-chat';
  }

  setApiConfig(apiKey: string, apiUrl?: string, model?: string) {
    this.apiKey = apiKey;
    if (apiUrl) {
      this.apiUrl = apiUrl;
    }
    if (model) {
      this.model = model;
    }
    localStorage.setItem('llm_api_key', apiKey);
    if (apiUrl) {
      localStorage.setItem('llm_api_url', apiUrl);
    }
    if (model) {
      localStorage.setItem('llm_model', model);
    }
  }

  getApiConfig() {
    return {
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      model: this.model
    };
  }

  async parseTaskFromText(text: string): Promise<TaskParseResult> {
    if (!this.apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      const now = new Date();
      // 使用本地时间获取日期，避免 UTC 时间导致的日期错误
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;
      const currentDayOfWeek = now.toLocaleDateString('zh-CN', { weekday: 'long' });
      console.log('当前日期:', currentDate);
      console.log('当前星期:', currentDayOfWeek);
      console.log('正在请求 API...');
      console.log('API URL:', this.apiUrl);
      console.log('Model:', this.model);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT(currentDate) },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          stream: false
        })
      });

      console.log('响应状态:', response.status);

      if (!response.ok) {
        let errorMessage = `API 请求失败: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('API 错误详情:', errorData);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          console.error('无法解析错误响应');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API 响应:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 返回格式不正确');
      }

      const content = data.choices[0].message.content;
      console.log('AI 返回内容:', content);
      
      const cleanedContent = extractJSON(content);
      console.log('清理后的内容:', cleanedContent);
      
      try {
        return JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON 解析失败:', parseError);
        console.error('尝试解析的内容:', cleanedContent);
        throw new Error('AI 返回的格式不是有效的 JSON，请稍后重试');
      }
    } catch (error) {
      console.error('LLM 解析失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查网络设置');
    }
  }

  async fillMissingFields(task: Partial<TaskParseResult>): Promise<TaskParseResult> {
    const filledTask: TaskParseResult = {
      title: task.title || '未命名任务',
      description: task.description,
      dueDate: task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedDuration: task.estimatedDuration || 60,
      urgency: task.urgency || 5,
      growthValue: task.growthValue || 5,
      difficulty: task.difficulty || 5,
      isGrowthTask: task.isGrowthTask || false
    };
    return filledTask;
  }

  async modifyTaskFromText(text: string): Promise<TaskModifyResult> {
    if (!this.apiKey) {
      throw new Error('请先配置 API Key');
    }

    try {
      const now = new Date();
      // 使用本地时间获取日期，避免 UTC 时间导致的日期错误
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`;
      const currentDayOfWeek = now.toLocaleDateString('zh-CN', { weekday: 'long' });
      console.log('当前日期:', currentDate);
      console.log('当前星期:', currentDayOfWeek);
      console.log('正在请求 API 修改任务...');
      console.log('API URL:', this.apiUrl);
      console.log('Model:', this.model);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT(currentDate) },
            { role: 'user', content: text }
          ],
          temperature: 0.7,
          stream: false
        })
      });

      console.log('响应状态:', response.status);

      if (!response.ok) {
        let errorMessage = `API 请求失败: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('API 错误详情:', errorData);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          console.error('无法解析错误响应');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('API 响应:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 返回格式不正确');
      }

      const content = data.choices[0].message.content;
      console.log('AI 返回内容:', content);
      
      const cleanedContent = extractJSON(content);
      console.log('清理后的内容:', cleanedContent);
      
      try {
        return JSON.parse(cleanedContent) as TaskModifyResult;
      } catch (parseError) {
        console.error('JSON 解析失败:', parseError);
        console.error('尝试解析的内容:', cleanedContent);
        throw new Error('AI 返回的格式不是有效的 JSON，请稍后重试');
      }
    } catch (error) {
      console.error('LLM 解析失败:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('网络连接失败，请检查网络设置');
    }
  }
}

export class VoiceService {
  private recognition: any;
  private isListening: boolean = false;

  constructor() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'zh-CN';
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  startListening(onResult: (text: string) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.('您的浏览器不支持语音识别');
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.isListening = false;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      onError?.(`语音识别错误: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const llmService = new LLMService();
export const voiceService = new VoiceService();
