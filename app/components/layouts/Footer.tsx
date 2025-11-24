// src/app/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container py-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} <span className="font-semibold">CinemaPro</span>. 
          Quản lý rạp chiếu phim hiện đại.
        </p>
        <p className="mt-2">
          Phát triển bởi <span className="font-medium">Team DevPro</span>
        </p>
      </div>
    </footer>
  )
}