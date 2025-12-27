"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ServiceField, Request } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const requestSchema = z.object({
  requester: z.object({
    name: z.string().min(1, "請輸入姓名"),
    phone: z.string().min(1, "請輸入電話號碼"),
    age: z.string().min(1, "請輸入年齡"),
    district: z.string().min(1, "請輸入居住地區"),
  }),
  description: z.string().min(1, "請輸入需求描述"),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個服務範疇"),
  appreciation: z.string().optional(),
})

type RequestFormValues = z.infer<typeof requestSchema>

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"]

interface RequestFormProps {
  onSubmit: (data: Omit<Request, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>
  initialData?: Partial<Request>
  loading?: boolean
}

export function RequestForm({ onSubmit, initialData, loading = false }: RequestFormProps) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requester: {
        name: initialData?.requester?.name || "",
        phone: initialData?.requester?.phone || "",
        age: initialData?.requester?.age || "",
        district: initialData?.requester?.district || "",
      },
      description: initialData?.description || "",
      fields: initialData?.fields || [],
      appreciation: initialData?.appreciation || "",
    },
  })

  const handleSubmit = async (data: RequestFormValues) => {
    await onSubmit({
      requester: data.requester,
      description: data.description,
      fields: data.fields,
      appreciation: data.appreciation,
      status: "pending",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>創建新委托</CardTitle>
        <CardDescription>請填寫委托者的詳細資訊和需求</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">委托者資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requester.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>姓名 *</FormLabel>
                      <FormControl>
                        <Input placeholder="委托者姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requester.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>電話號碼 *</FormLabel>
                      <FormControl>
                        <Input placeholder="+852 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requester.age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年齡 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: 65" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requester.district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>居住地區 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: 堅尼地城" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="fields"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>服務範疇 *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {SERVICE_FIELDS.map((fieldValue) => (
                      <label
                        key={fieldValue}
                        className="flex items-center space-x-2 cursor-pointer p-2 border rounded hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={field.value.includes(fieldValue)}
                          onChange={(e) => {
                            const value = field.value
                            if (e.target.checked) {
                              field.onChange([...value, fieldValue])
                            } else {
                              field.onChange(value.filter((v) => v !== fieldValue))
                            }
                          }}
                          className="rounded"
                        />
                        <span>{fieldValue}</span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>需求描述 *</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="請詳細描述委托者的需求和煩惱..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appreciation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>感謝方式</FormLabel>
                  <FormControl>
                    <Input placeholder="例如: 心意卡、煮餐飯" {...field} />
                  </FormControl>
                  <FormDescription>委托者希望如何感謝義工（選填）</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "創建中..." : "創建委托"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

