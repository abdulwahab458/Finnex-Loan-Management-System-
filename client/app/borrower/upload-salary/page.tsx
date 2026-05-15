'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { CheckCircle, FileText, LogOut, Upload } from 'lucide-react';

export default function UploadSalaryPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('salarySlip', file);

      const response = await api.post('/borrower/upload-salary', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFilePath(response.data.filePath);
      setUploadedFileName(response.data.originalName);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (filePath) {
      sessionStorage.setItem('salarySlipUrl', filePath);
      sessionStorage.setItem('salarySlipOriginalName', uploadedFileName);
      router.push('/borrower/loan-config');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white/50">Step 2 of 4</div>
              <Link
                href="/login?logout=true"
                onClick={(e) => {
                  e.preventDefault();
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="text-sm text-red-600 hover:underline"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              </Link>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Upload Salary Slip</h1>
          <p className="text-white/65 mb-6">
            Upload your latest salary slip (PDF, JPG, or PNG). Maximum file size: 5MB.
          </p>

          {error && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-rose-100 mb-4">
              {error}
            </div>
          )}

          {filePath && (
            <div className="rounded-2xl border border-green-300/20 bg-green-500/10 px-4 py-3 text-green-100 mb-4">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                File uploaded successfully: {uploadedFileName}
              </span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-6">
            <div>
              <div className="block text-white/75 font-medium mb-4">Select File</div>
              <div className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-sky-400 transition bg-white/5">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <div className="mb-4 flex justify-center">
                    <FileText className="h-16 w-16 text-sky-400" />
                  </div>
                  <p className="text-white font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-white/60 mt-2">PDF, JPG, PNG (max. 5MB)</p>
                  {file && <p className="text-sky-300 font-medium mt-3">Selected: {file.name}</p>}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Uploading...' : <><Upload className="h-4 w-4" /> Upload File</>}
            </button>
          </form>

          {filePath && (
            <button
              onClick={handleContinue}
              className="inline-flex w-full items-center justify-center gap-2 mt-4 rounded-lg bg-green-600 py-2 font-medium text-white transition hover:bg-green-700"
            >
              <span>Continue to Next Step</span>
              <Upload className="h-4 w-4 rotate-90" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
