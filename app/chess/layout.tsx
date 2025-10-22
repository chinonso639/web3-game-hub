export default function ChessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Chess socket provider is now global in app/layout.tsx
  return children;
}
