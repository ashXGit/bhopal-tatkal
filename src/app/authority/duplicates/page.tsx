import { ReviewQueue } from "../review/ReviewQueue";

export const dynamic = "force-dynamic";

export default function Page() {
  return <ReviewQueue duplicatesOnly />;
}
