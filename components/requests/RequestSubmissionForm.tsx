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
import { SuccessAnimation } from "@/components/ui/success-animation";
import { ServiceField } from "@/types";

// 香港電話號碼驗證：8位數字（可選前綴如+852或852）
const phoneRegex = /^(\+?852[-.\s]?)?[2-9]\d{7}$/;

const requestSchema = z.object({
  requesterName: z.string().min(1, "請輸入您的稱呼"),
  requesterPhone: z
    .string()
    .min(1, "請輸入聯絡電話")
    .regex(phoneRegex, "請輸入有效的香港電話號碼（8位數字）"),
  requesterAge: z.enum(["12-24", "25-37", "38-50", "51-63", "64-76", "76或以上"], {
    required_error: "請選擇年齡範圍",
  }),
  requesterDistrict: z.enum(["九龍", "港島", "新界", "離島"], {
    required_error: "請選擇居住地區",
  }),
  description: z.string().min(20, "請詳細描述您的需求（至少20個字）"),
  fields: z.array(z.enum(["生活助手", "社區拍檔", "街坊樹窿"])).min(1, "請至少選擇一個幫助範疇"),
  appreciation: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

const SERVICE_FIELDS: ServiceField[] = ["生活助手", "社區拍檔", "街坊樹窿"];
const AGE_RANGES = ["12-24", "25-37", "38-50", "51-63", "64-76", "76或以上"] as const;
const DISTRICTS = ["九龍", "港島", "新界", "離島"] as const;

export function RequestSubmissionForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string>("");

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
  const selectedAge = watch("requesterAge");
  const selectedDistrict = watch("requesterDistrict");

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
      setShowSuccess(false);

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

      const result = await response.json();
      setTrackingNumber(result.trackingNumber || result.id);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "提交失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            <Label htmlFor="requesterPhone">留低你嘅聯絡電話 (可WhatsApp) *</Label>
            <Input
              id="requesterPhone"
              {...register("requesterPhone")}
              placeholder="例如：91234567"
              className="bg-background"
            />
            {errors.requesterPhone && (
              <p className="text-sm text-destructive">{errors.requesterPhone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              請輸入8位數字（例如：91234567）
            </p>
          </div>

          <div className="space-y-2">
            <Label>年齡 *</Label>
            <div className="space-y-2">
              {AGE_RANGES.map((age) => (
                <div key={age} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`age-${age}`}
                    value={age}
                    {...register("requesterAge")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`age-${age}`} className="font-normal cursor-pointer">
                    {age}
                  </Label>
                </div>
              ))}
            </div>
            {errors.requesterAge && (
              <p className="text-sm text-destructive">{errors.requesterAge.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>居住地區 *</Label>
            <div className="space-y-2">
              {DISTRICTS.map((district) => (
                <div key={district} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`district-${district}`}
                    value={district}
                    {...register("requesterDistrict")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`district-${district}`} className="font-normal cursor-pointer">
                    {district}
                  </Label>
                </div>
              ))}
            </div>
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
              placeholder="請詳細描述您的需求（至少20個字）..."
              rows={6}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              最少需要20個字
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appreciation">你會用咩形式報答我地嘅義工？例子:心意卡、煮餐飯（選填）</Label>
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

      {showSuccess && (
        <SuccessAnimation
          trackingNumber={trackingNumber}
          onComplete={() => {
            router.push("/");
            router.refresh();
          }}
        />
      )}
    </>
  );
}
