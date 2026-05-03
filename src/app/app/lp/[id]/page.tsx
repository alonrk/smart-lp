import { LpEditor } from "./lp-editor";

export default async function LpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LpEditor id={id} />;
}
