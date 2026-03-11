import { redirect } from "next/navigation";

export default function PublicRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/?requestId=${params.id}`);
}
