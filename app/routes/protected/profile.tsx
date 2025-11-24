// src/app/routes/(protected)/profile.route.tsx
import { useLoaderData } from "react-router-dom"

export default function Profile() {
  const { user } = useLoaderData() as { user: any }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Xin chào, {user.username}!</h1>
      <p>Role: {user.role}</p>
      <p>ID: {user.id}</p>
    </div>
  )
}