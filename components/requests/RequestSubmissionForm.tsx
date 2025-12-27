"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorDisplay } from "@/components/ui/error";
import { Loading } from "@/components/ui/loading";
import { ServiceField } from "@/types";

const requestSchema = z.object({
  requesterName: z.string().min(1, "請輸入您的稱呼"),
  requesterPhone: z.string().min(1, "請輸入聯絡電話"),
  requesterAge: z.string().min(1, "請輸入年齡"),
  requesterDistrict: z.string().min(1, "請輸入居住地區"),
  description: z.string().min(10, "請詳細描述您的需求（至少10個字）"),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個幫助範疇"),
  appreciation: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"];

export function RequestSubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      fields: [],
    },
  });

  const selectedFields = watch("fields") || [];

  const toggleField = (field: ServiceField) => {
    const currentFields = watch("fields") || [];
    const newFields = currentFields.includes(field)
      ? currentFields.filter((f) => f !== field)
      : [...currentFields, field];
    setValue("fields", newFields as any, { shouldValidate: true });
  };

  const onSubmit = async (data: RequestFormData) => {
    try {
      setError("");
      setLoading(true);
      setSuccess(false);

      const requestData = {
        requester: {
          name: data.requesterName,
          phone: data.requesterPhone,
          age: data.requesterAge,
          district: data.requesterDistrict,
        },
        description: data.description,
        fields: data.fields,
        appreciation: data.appreciation,
      };

      const response = await fetch("/api/requests/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失敗");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "提交失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-6 mb-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            提交成功！
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            您的委托請求已提交，我們會盡快為您配對合適的義工。
          </p>
        </div>
        <p className="text-sm text-muted-foreground">正在返回首頁...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <ErrorDisplay message={error} />}

      <div className="space-y-4">
        <h3 className="font-semibold">委托者資料</h3>

        <div className="space-y-2">
          <Label htmlFor="requesterName">點樣稱呼你？ *</Label>
          <Input
            id="requesterName"
            {...register("requesterName")}
            placeholder="您的稱呼"
            className="bg-background"
          />
          {errors.requesterName && (
            <p className="text-sm text-destructive">{errors.requesterName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesterPhone">聯絡電話 *</Label>
          <Input
            id="requesterPhone"
            {...register("requesterPhone")}
            placeholder="您的電話號碼"
            className="bg-background"
          />
          {errors.requesterPhone && (
            <p className="text-sm text-destructive">{errors.requesterPhone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesterAge">年齡 *</Label>
          <Input
            id="requesterAge"
            {...register("requesterAge")}
            placeholder="您的年齡"
            className="bg-background"
          />
          {errors.requesterAge && (
            <p className="text-sm text-destructive">{errors.requesterAge.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="requesterDistrict">居住地區 *</Label>
          <Input
            id="requesterDistrict"
            {...register("requesterDistrict")}
            placeholder="例如：堅尼地城"
            className="bg-background"
          />
          {errors.requesterDistrict && (
            <p className="text-sm text-destructive">{errors.requesterDistrict.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold">需求詳情</h3>

        <div className="space-y-2">
          <Label>幫助範疇 *</Label>
          <p className="text-sm text-muted-foreground mb-2">
            請選擇您需要的幫助範疇（可多選）
          </p>
          <div className="space-y-2">
            {SERVICE_FIELDS.map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${field}`}
                  checked={selectedFields.includes(field)}
                  onCheckedChange={() => toggleField(field)}
                />
                <Label htmlFor={`field-${field}`} className="font-normal cursor-pointer">
                  {field}
                </Label>
              </div>
            ))}
          </div>
          {errors.fields && (
            <p className="text-sm text-destructive">{errors.fields.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">有咩煩惱或者需求啊？ *</Label>
          <textarea
            id="description"
            {...register("description")}
            placeholder="請詳細描述您的需求..."
            rows={6}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appreciation">回報方式（選填）</Label>
          <Input
            id="appreciation"
            {...register("appreciation")}
            placeholder="例如：心意卡、煮餐飯"
            className="bg-background"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loading size="sm" /> : "提交委托請求"}
      </Button>
    </form>
  );
}

