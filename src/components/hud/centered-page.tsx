interface CenteredPageProps {
  children: React.ReactNode;
  /** Key hint grid for keyboard-navigable pages. Even when omitted, the
   *  footer slot still reserves its height so the centered area above it
   *  is the exact same size on every page — keeping the ShellBox at one
   *  fixed screen position so the ViewTransition morph between routes
   *  never jumps. Also bounds the page to the viewport so it never needs
   *  its own scrollbar; overflow scrolls inside the ShellBox instead. */
  hint?: React.ReactNode;
}

export function CenteredPage({ children, hint }: CenteredPageProps) {
  return (
    <main className="flex h-dvh flex-col gap-6 overflow-hidden p-6">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {children}
      </div>
      <div className="flex h-[120px] shrink-0 items-center justify-center">
        {hint}
      </div>
    </main>
  );
}
