import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <p className="text-sm font-medium text-blue-600 mb-3">404</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h1>
      <p className="text-gray-500 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="text-sm font-medium text-blue-600 hover:text-blue-500 underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
