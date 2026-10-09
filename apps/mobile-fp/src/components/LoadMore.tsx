import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-xl"
      disabled={loading}
      onClick={onLoadMore}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      Load more
    </Button>
  );
}
