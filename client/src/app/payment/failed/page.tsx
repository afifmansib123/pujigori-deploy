"use client"
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'processing_error':
        return 'There was an error processing your payment. Please try again.';
      case 'validation_failed':
        return 'Payment validation failed. Please contact support.';
      case 'donation_not_found':
        return 'Donation record not found. Please contact support.';
      case 'payment_failed':
        return 'Payment was not successful. Please try again.';
      default:
        return 'Payment could not be completed. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">{getErrorMessage(error)}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
            {reason && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Reason:</strong> {reason}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Home
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6">
          If you continue to experience issues, please contact support.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailed() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}