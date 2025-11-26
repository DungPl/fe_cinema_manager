// app/root.tsx  ← ĐẶT ĐÚNG TÊN VÀ ĐÚNG VỊ TRÍ NÀY!
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import { Link } from "react-router-dom";
import { Toaster } from "~/components/ui/sonner"
import "./app.css"; // giữ css của bạn

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">{error.status}</h1>
        <p className="text-xl mt-4">{error.statusText || "Page Not Found"}</p>
        <Link to="/" className="mt-8 inline-block underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
      <pre className="mt-8 text-left bg-gray-100 p-4 rounded overflow-x-auto">
        {message}
      </pre>
    </div>
  );
}