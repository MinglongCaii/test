import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Frontend Demo</h1>
      <p className="text-gray-600 mb-8">
        A Next.js frontend connected to a NestJS backend.
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Login
        </Link>
        <Link href="/register" className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-50">
          Register
        </Link>
      </div>
    </div>
  );
}
