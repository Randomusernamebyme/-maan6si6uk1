import { getAuthToken } from "./auth";

// 創建操作日誌
export async function createActivityLog(
  action: string,
  targetType: "user" | "request" | "application" | "notification",
  targetId: string,
  description: string,
  changes?: Record<string, any>
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("請先登入");
    }

    const response = await fetch("/api/admin/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action,
        targetType,
        targetId,
        description,
        changes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "創建操作日誌失敗");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating activity log:", error);
    // 不拋出錯誤，避免影響主要操作
  }
}


