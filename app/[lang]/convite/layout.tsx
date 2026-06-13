// app/[lang]/convite/layout.tsx
export const metadata = {
  title: 'Convite Especial - HelloCamp',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function ConviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}