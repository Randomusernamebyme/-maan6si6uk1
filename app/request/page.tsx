import Link from "next/link";
import { RequestSubmissionForm } from "@/components/requests/RequestSubmissionForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubmitRequestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 返回首頁
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">提交委托請求</CardTitle>
            <CardDescription>
              請填寫以下資料，我們會盡快為您配對合適的義工
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RequestSubmissionForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

