import { redirect } from "next/navigation";

export default function GalleryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/gallery?postId=${params.id}`);
}
