export default function ForumThreadLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 h-10 max-w-md rounded-md bg-muted/40" />
      <div className="border-b border-border/50">
        <div className="mx-auto max-w-3xl space-y-2 py-4">
          <div className="h-8 w-2/3 rounded-md bg-muted/40" />
          <div className="h-4 w-40 rounded-md bg-muted/30" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl space-y-6 py-4">
        <div className="h-16 rounded-md bg-muted/30" />
        <div className="h-16 rounded-md bg-muted/30" />
      </div>
    </div>
  );
}
