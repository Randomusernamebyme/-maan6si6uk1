import { redirect } from "next/navigation";

export default function VolunteerRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/volunteer/dashboard?requestId=${params.id}`);
}
