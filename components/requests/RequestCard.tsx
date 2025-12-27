"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Request, RequestStatus } from "@/types"
import { formatDate } from "@/lib/utils"

interface RequestCardProps {
  request: Request
  onApply?: (requestId: string) => void
  showRequester?: boolean
  showActions?: boolean
}

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  matched: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
}

const statusLabels: Record<RequestStatus, string> = {
  pending: "待配對",
  matched: "已配對",
  in_progress: "進行中",
  completed: "已完成",
  cancelled: "已取消",
}

export function RequestCard({ request, onApply, showRequester = false, showActions = true }: RequestCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">委托 #{request.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              創建時間: {formatDate(request.createdAt)}
            </CardDescription>
          </div>
          <Badge className={statusColors[request.status]}>
            {statusLabels[request.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">服務範疇</h4>
          <div className="flex flex-wrap gap-2">
            {request.fields.map((field) => (
              <Badge key={field} variant="outline">
                {field}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">需求描述</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {showRequester && (
          <div>
            <h4 className="font-semibold mb-2">委托者資訊</h4>
            <div className="text-sm space-y-1">
              <p>姓名: {request.requester.name}</p>
              <p>電話: {request.requester.phone}</p>
              <p>年齡: {request.requester.age}</p>
              <p>地區: {request.requester.district}</p>
            </div>
          </div>
        )}

        {request.appreciation && (
          <div>
            <h4 className="font-semibold mb-2">感謝方式</h4>
            <p className="text-sm text-muted-foreground">{request.appreciation}</p>
          </div>
        )}
      </CardContent>
      {showActions && onApply && request.status === "pending" && (
        <CardFooter>
          <Button onClick={() => onApply(request.id)} className="w-full">
            報名此委托
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

