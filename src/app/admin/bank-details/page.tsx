"use client";

import { useState, useEffect } from 'react';
import { Building2, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface BankDetails {
  id?: number;
  details: string;
}

export default function BankDetailsPage() {
  const [bankDetails, setBankDetails] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load existing bank details
  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch('/api/admin/bank-details');
      const data = await response.json();
      
      if (data.success && data.data) {
        setBankDetails(data.data.details || '');
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
      setError('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!bankDetails.trim()) {
      setError('Please enter bank details');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/bank-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          details: bankDetails
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Bank details saved successfully!');
      } else {
        setError(data.error || 'Failed to save bank details');
      }
    } catch (err) {
      console.error('Error saving bank details:', err);
      setError('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bank Details Management</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Configure bank account details that will be shown to customers when they select bank transfer payment option.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span>{message}</span>
            </div>
          )}

          {/* Bank Details Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Account Details
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Enter the complete bank details exactly as you want customers to see them. Include all necessary information such as bank name, account name, account number, routing number, etc.
            </p>
            <textarea
              value={bankDetails}
              onChange={(e) => {
                setBankDetails(e.target.value);
                setMessage('');
                setError('');
              }}
              placeholder="Bank Name: First National Bank&#10;Account Name: Dano Airways Inc.&#10;Account Number: 1234567890&#10;Routing Number: 021000021&#10;&#10;Additional Instructions:&#10;Please include your booking ID in the transfer description"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
            />
            <p className="text-xs text-gray-500 mt-2">
              This text will be displayed exactly as entered to customers choosing bank transfer payment.
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Customer Preview:</h3>
            <div className="bg-white border border-gray-200 rounded p-4 text-sm font-mono whitespace-pre-line min-h-[120px]">
              {bankDetails || "No bank details configured yet..."}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving || !bankDetails.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
