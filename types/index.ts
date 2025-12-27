// 用戶角色
export type UserRole = "volunteer" | "admin"

// 服務範疇
export type ServiceField = "生活助手" | "社區拍檔" | "街坊樹窿"

// 用戶狀態
export type UserStatus = "pending" | "approved" | "rejected" | "suspended"

// 委托狀態
export type RequestStatus = "pending" | "matched" | "in_progress" | "completed" | "cancelled"

// 報名狀態
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "completed"

// 用戶介面
export interface User {
  // 基本資料
  uid: string // Firebase Auth UID (主鍵)
  email: string // 登入郵箱
  role: UserRole // 角色

  // 個人資料
  displayName: string // 點樣稱呼你?
  phone: string // 電話號碼(WhatsApp)
  age: string // 年齡

  // 義工專屬
  fields?: ServiceField[] // 服務範疇
  skills?: string[] // 你想提供職技能
  availability?: string[] // 一星期內比較空間的日子
  targetAudience?: string[] // 想服務職對象
  goals?: string // 想辱萬事屋完成職目標

  // 狀態
  status: UserStatus
  interviewDate?: Date // 面試日期
  interviewNotes?: string // 面試記錄

  // 統計
  completedTasks: number // 完成的委托數
  rating?: number // 評分(未來功能)

  // 系統欄位
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

// 委托介面
export interface Request {
  // 基本資料
  id: string // 文檔ID (主鍵)

  // 委托者資料 (敏感, 只有admin可見)
  requester: {
    name: string // 點樣稱呼你?
    phone: string // 聯絡電話
    age: string // 年齡
    district: string // 居住地區
  }

  // 需求詳情
  description: string // 有咩煩惱或者需求啊?
  fields: ServiceField[] // 幫助範疇
  appreciation?: string // 報告方式(例: 心意卡、煮餐飯)

  // 後台管理
  status: RequestStatus
  assignedVolunteerId?: string // 配對的義工ID
  adminNotes?: string // 管理員備註

  // 系統欄位
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

// 報名記錄介面
export interface Application {
  id: string // 文檔ID (主鍵)
  requestId: string // 委托ID
  volunteerId: string // 義工ID
  volunteerName: string // 義工名稱
  status: ApplicationStatus
  message?: string // 義工的留言
  adminNotes?: string // 管理員備註

  // 系統欄位
  createdAt: Date
  updatedAt: Date
}

// 通知介面
export interface Notification {
  id: string // 文檔ID (主鍵)
  userId: string // 接收者ID
  type: "application_accepted" | "application_rejected" | "request_assigned" | "request_completed" | "system"
  title: string
  message: string
  relatedId?: string // 相關ID (如requestId或applicationId)
  read: boolean

  // 系統欄位
  createdAt: Date
}

// 操作日誌介面
export interface ActivityLog {
  id: string // 文檔ID (主鍵)
  userId: string // 操作者ID
  action: string // 操作類型
  targetType: "user" | "request" | "application" | "system"
  targetId: string // 目標ID
  details?: Record<string, any> // 詳細資訊

  // 系統欄位
  createdAt: Date
}

