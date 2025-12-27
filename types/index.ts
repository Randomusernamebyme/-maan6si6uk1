// 用戶角色類型
export type UserRole = 'volunteer' | 'admin';

// 服務範疇類型
export type ServiceField = '生活助手' | '社區拍檔' | '街坊樹窿';

// 用戶狀態類型
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// 委托狀態類型
export type RequestStatus = 'pending' | 'open' | 'published' | 'matched' | 'completed' | 'cancelled';

// 緊急程度類型
export type UrgencyLevel = 'urgent' | 'normal';

// 報名狀態類型
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

// User 介面（義工/管理員）
export interface User {
  // 基本資料
  uid: string; // Firebase Auth UID (主鍵)
  email: string; // 登入郵箱
  role: UserRole; // 角色

  // 個人資料
  displayName: string; // 點樣稱呼你?
  phone: string; // 電話號碼(WhatsApp)
  age: string; // 年齡

  // 義工專屬
  fields?: ServiceField[]; // 服務範疇
  skills?: string[]; // 你想提供的技能
  availability?: string[]; // 一星期內比較空間的日子 ['星期一', '星期六', ...]
  targetAudience?: string[]; // 想服務的對象 ['長者', '兒童', ...]
  goals?: string; // 想透過萬事屋完成的目標

  // 狀態
  status: UserStatus;
  interviewDate?: Date; // 面試日期
  interviewNotes?: string; // 面試記錄

  // 統計
  completedTasks?: number; // 完成的委托數

  // 系統欄位
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Request 介面（委托）
export interface Request {
  // 基本資料
  id: string; // 文檔ID (主鍵)

  // 委托者資料 (敏感, 只有admin可見)
  requester: {
    name: string; // 點樣稱呼你?
    phone: string; // 聯絡電話
    age: string; // 年齡
    district: string; // 居住地區
  };

  // 需求詳情
  description: string; // 有咩煩惱或者需求啊?
  fields: ServiceField[]; // 幫助範疇
  appreciation?: string; // 回報方式(例: 心意卡、煮餐飯)
  urgency?: UrgencyLevel; // 緊急程度
  requiredSkills?: string[]; // 需要的技能
  serviceType?: string; // 服務形式
  estimatedDuration?: string; // 預計時長

  // 後台管理
  status: RequestStatus;
  matchedVolunteerId?: string; // 配對的義工ID
  matchedAt?: Date; // 配對時間
  completedAt?: Date; // 完成時間
  adminNotes?: string; // 管理員備註

  // 系統欄位
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // 創建者ID (admin)
}

// Application 介面（報名記錄）
export interface Application {
  // 基本資料
  id: string; // 文檔ID (主鍵)
  requestId: string; // 委托ID
  volunteerId: string; // 義工ID

  // 報名資訊
  message?: string; // 義工的留言
  availableTime?: string; // 可服務時間
  status: ApplicationStatus;

  // 配對資訊
  matchedAt?: Date; // 配對時間
  completedAt?: Date; // 完成時間

  // 系統欄位
  createdAt: Date;
  updatedAt: Date;
}

// Notification 介面（通知）
export interface Notification {
  // 基本資料
  id: string; // 文檔ID (主鍵)
  userId: string; // 接收通知的用戶ID

  // 通知內容
  title: string; // 通知標題
  message: string; // 通知內容
  type: 'info' | 'success' | 'warning' | 'error'; // 通知類型

  // 關聯資料
  relatedRequestId?: string; // 相關委托ID
  relatedApplicationId?: string; // 相關報名ID

  // 狀態
  read: boolean; // 是否已讀
  readAt?: Date; // 已讀時間

  // 系統欄位
  createdAt: Date;
}

// ActivityLog 介面（操作日誌）
export interface ActivityLog {
  // 基本資料
  id: string; // 文檔ID (主鍵)
  userId: string; // 操作者ID
  action: string; // 操作類型
  targetType: 'user' | 'request' | 'application' | 'notification'; // 目標類型
  targetId: string; // 目標ID

  // 操作詳情
  description: string; // 操作描述
  changes?: Record<string, any>; // 變更內容

  // 系統欄位
  createdAt: Date;
}

