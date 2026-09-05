'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailCheck, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Send } from 'lucide-react';
import { API_URL } from '../utils/api';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resubscribe state
  const [resubscribeEmail, setResubscribeEmail] = useState('');
  const [isResubscribing, setIsResubscribing] = useState(false);
  const [resubscribeMsg, setResubscribeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('No unsubscribe token provided. If you want to unsubscribe, please use the link in your email.');
      return;
    }

    const performUnsubscribe = async () => {
      try {
        const res = await fetch(`${API_URL}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setSuccess(true);
        } else {
          setErrorMessage(data.message || 'Invalid or expired unsubscribe link.');
        }
      } catch (err) {
        console.error('Unsubscribe error:', err);
        setErrorMessage('Failed to connect to the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    performUnsubscribe();
  }, [token]);

  const handleResubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubscribeEmail.trim() || isResubscribing) return;

    setIsResubscribing(true);
    setResubscribeMsg(null);

    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resubscribeEmail.trim(), source: 'unsubscribe_page' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResubscribeMsg({ type: 'success', text: 'You have successfully resubscribed to Remise newsletter!' });
        setResubscribeEmail('');
      } else {
        setResubscribeMsg({ type: 'error', text: data.message || 'Failed to resubscribe.' });
      }
    } catch {
      setResubscribeMsg({ type: 'error', text: 'Connection failed. Please try again.' });
    } finally {
      setIsResubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        {/* Header Logo */}
        <div className="mb-6 flex justify-center">
          <Link href="/" className="text-2xl font-black text-slate-900 flex items-center gap-1">
            R<span className="text-[#FF0000]">E</span>mise
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#0FA3B1]" size={36} />
            <p className="text-slate-600 text-sm font-medium">Processing your unsubscribe request...</p>
          </div>
        ) : success ? (
          <div>
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <MailCheck size={32} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">You have unsubscribed</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              You will no longer receive weekly newsletters, deal digests, or product notifications from Remise.
            </p>

            {/* Changed your mind box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 mb-6 text-left">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Changed your mind?</h3>
              <p className="text-xs text-slate-500 mb-3">Re-enter your email to restore your subscription anytime:</p>
              <form onSubmit={handleResubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={resubscribeEmail}
                  onChange={(e) => setResubscribeEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0FA3B1]"
                />
                <button
                  type="submit"
                  disabled={isResubscribing}
                  className="bg-[#0FA3B1] hover:bg-[#0d8b97] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition disabled:opacity-60"
                >
                  <Send size={12} /> {isResubscribing ? 'Saving...' : 'Resubscribe'}
                </button>
              </form>
              {resubscribeMsg && (
                <p className={`text-xs font-semibold mt-2 ${resubscribeMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {resubscribeMsg.text}
                </p>
              )}
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-[#0FA3B1] transition"
            >
              <ArrowLeft size={16} /> Return to Remise Homepage
            </Link>
          </div>
        ) : (
          <div>
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Unable to Unsubscribe</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{errorMessage}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#FF0000] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#e00000] transition"
            >
              <ArrowLeft size={16} /> Go to Homepage
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#0FA3B1]" size={36} /></div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
