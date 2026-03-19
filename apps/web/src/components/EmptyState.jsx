export function EmptyState({ message, children }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
