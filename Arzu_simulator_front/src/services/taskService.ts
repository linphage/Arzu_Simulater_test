import { API_CONFIG } from '../config/api';
import axiosInstance from '../utils/axiosInstance';

export interface CreateTaskRequest {
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate: string;
  alarm?: string;
  repeatDays?: number;
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    completed: boolean;
    completed_at: string | null;
    focus_time: number | null;
    pomodoro_count: number;
    due_date: string;
    alarm: string;
    repeat_days: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

function convertPriorityToBackend(priority: string): string {
  const priorityMap: Record<string, string> = {
    '金卡': '金',
    '银卡': '银',
    '铜卡': '铜',
    '石卡': '石'
  };
  return priorityMap[priority] || '铜';
}

function parseChineseDateToISO(dateStr: string, timeStr: string): string {
  const currentYear = new Date().getFullYear();
  
  const dateMatch = dateStr.match(/(\d+)月(\d+)日/);
  if (!dateMatch) {
    throw new Error('Invalid date format');
  }
  
  const month = parseInt(dateMatch[1]) - 1;
  const day = parseInt(dateMatch[2]);
  
  let hour = 0;
  let minute = 0;
  
  const timeMatch = timeStr.match(/(上午|下午|晚上)?(\d+):(\d+)/);
  if (timeMatch) {
    const period = timeMatch[1];
    hour = parseInt(timeMatch[2]);
    minute = parseInt(timeMatch[3]);
    
    if (period === '下午' && hour < 12) {
      hour += 12;
    } else if (period === '上午' && hour === 12) {
      hour = 0;
    } else if (period === '晚上' && hour < 12) {
      hour += 12;
    }
  }
  
  const year = currentYear;
  const monthStr = String(month + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  
  return `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:00+08:00`;
}

function calculateAlarmTime(dueDate: string, reminderOption: string): string {
  console.log('🔧 calculateAlarmTime 输入:', { dueDate, reminderOption });
  
  const isoMatch = dueDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!isoMatch) {
    console.error('❌ dueDate 格式错误:', dueDate);
    throw new Error(`Invalid dueDate format: ${dueDate}`);
  }
  
  const year = parseInt(isoMatch[1]);
  const month = parseInt(isoMatch[2]) - 1;
  const day = parseInt(isoMatch[3]);
  const hour = parseInt(isoMatch[4]);
  const minute = parseInt(isoMatch[5]);
  
  console.log('📅 解析后的时间:', { year, month, day, hour, minute });
  
  const reminderMinutes: Record<string, number> = {
    '无': 0,
    '前5分钟': 5,
    '前10分钟': 10,
    '前30分钟': 30
  };
  
  const minutesToSubtract = reminderMinutes[reminderOption] || 0;
  
  const dueDateTime = new Date(year, month, day, hour, minute, 0);
  console.log('⏰ dueDateTime:', dueDateTime, 'isValid:', !isNaN(dueDateTime.getTime()));
  
  const alarmTime = new Date(dueDateTime.getTime() - minutesToSubtract * 60 * 1000);
  console.log('⏰ alarmTime:', alarmTime, 'isValid:', !isNaN(alarmTime.getTime()));
  
  const alarmYear = alarmTime.getFullYear();
  const alarmMonth = String(alarmTime.getMonth() + 1).padStart(2, '0');
  const alarmDay = String(alarmTime.getDate()).padStart(2, '0');
  const alarmHour = String(alarmTime.getHours()).padStart(2, '0');
  const alarmMinute = String(alarmTime.getMinutes()).padStart(2, '0');
  
  const result = `${alarmYear}-${alarmMonth}-${alarmDay}T${alarmHour}:${alarmMinute}:00+08:00`;
  console.log('✅ calculateAlarmTime 输出:', result);
  
  return result;
}

function encodeRepeatDays(repeatConfig: string, selectedWeekdays: number[]): number {
  if (repeatConfig === '无' || selectedWeekdays.length === 0) {
    return 0;
  }
  
  let bitmask = 0;
  
  selectedWeekdays.forEach(dayValue => {
    if (dayValue === 0) {
      bitmask |= (1 << 6);
    } else {
      bitmask |= (1 << (dayValue - 1));
    }
  });
  
  return bitmask;
}

export const taskService = {
  async createTask(
    title: string,
    description: string,
    category: string,
    priority: string,
    dateStr: string,
    timeStr: string,
    reminder: string,
    repeat: string,
    selectedWeekdays: number[]
  ): Promise<TaskResponse> {
    const dueDate = parseChineseDateToISO(dateStr, timeStr);
    const alarm = calculateAlarmTime(dueDate, reminder);
    const repeatDays = encodeRepeatDays(repeat, selectedWeekdays);
    const backendPriority = convertPriorityToBackend(priority);
    
    const requestBody: CreateTaskRequest = {
      title,
      description,
      category,
      priority: backendPriority,
      dueDate: dueDate,
      alarm: alarm,
      repeatDays: repeatDays
    };
    
    console.log('📤 发送任务创建请求:', requestBody);
    console.log('📝 提醒设置:', reminder, '→ alarm:', alarm);
    console.log('📝 重复设置:', repeat, '选中的星期:', selectedWeekdays, '→ repeatDays:', repeatDays);
    
    const response = await axiosInstance.post('/api/v1/tasks', requestBody);
    const result = response.data;
    console.log('✅ 任务创建成功:', result);
    return result;
  },

  async createOfficeTask(
    title: string,
    description: string,
    category: string,
    priority: string
  ): Promise<TaskResponse> {
    const backendPriority = convertPriorityToBackend(priority);
    
    const requestBody = {
      title,
      description,
      category,
      priority: backendPriority
    };
    
    console.log('🏢 发送办公室任务创建请求:', requestBody);
    
    const response = await axiosInstance.post('/api/v1/tasks/office', requestBody);
    const result = response.data;
    console.log('✅ 办公室任务创建成功:', result);
    return result;
  },
  
  async getUserTasks(params?: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
    completed?: boolean;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString());
    
    const response = await axiosInstance.get('/api/v1/tasks', { params });
    
    return response.data;
  },

  async deleteTask(taskId: string, deleteReason: string): Promise<void> {
    console.log('🗑️ 发送删除任务请求:', { taskId, deleteReason });
    
    await axiosInstance.delete(`/api/v1/tasks/${taskId}`, {
      data: { deleteReason }
    });
    console.log('✅ 任务删除成功');
  },

  async updateTask(
    taskId: string,
    updates: {
      category?: string;
      priority?: string;
      dueDate?: string;
      startTime?: string;
    },
    changeReason: string
  ): Promise<TaskResponse> {
    console.log('📝 发送任务更新请求:', { taskId, updates, changeReason });
    
    const requestBody: any = {
      changeReason
    };

    if (updates.category) {
      requestBody.category = updates.category;
    }

    if (updates.priority) {
      const backendPriority = convertPriorityToBackend(updates.priority);
      requestBody.priority = backendPriority;
    }

    if (updates.dueDate && updates.startTime) {
      const dueDate = parseChineseDateToISO(updates.dueDate, updates.startTime);
      requestBody.dueDate = dueDate;
    }

    console.log('📤 转换后的更新请求:', requestBody);

    const response = await axiosInstance.patch(`/api/v1/tasks/${taskId}`, requestBody);
    const result = response.data;
    console.log('✅ 任务更新成功:', result);
    return result;
  },

  async updateTaskCompletionFromPomodoro(
    taskId: string,
    sessionId: number,
    markAsCompleted: boolean,
    completedAt?: string
  ): Promise<TaskResponse> {
    console.log('📝 发送番茄钟任务完成状态更新请求:', { taskId, sessionId, markAsCompleted, completedAt });

    const requestBody = {
      markAsCompleted,
      completedAt
    };

    const response = await axiosInstance.post(
      `/api/v1/tasks/${taskId}/pomodoro/${sessionId}/complete`,
      requestBody
    );
    const result = response.data;
    console.log('✅ 任务完成状态更新成功:', result);
    return result;
  },

  async completeTask(taskId: string): Promise<TaskResponse> {
    console.log('📝 发送任务完成请求:', { taskId });
    const response = await axiosInstance.put(`/api/v1/tasks/${taskId}/complete`);
    const result = response.data;
    console.log('✅ 任务标记为已完成:', result);
    return result;
  }
};

export { convertPriorityToBackend, parseChineseDateToISO, calculateAlarmTime, encodeRepeatDays };
