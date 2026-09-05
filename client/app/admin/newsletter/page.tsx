'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../layout/layout';
import axios from 'axios';
import {
  Mail,
  Users,
  Send,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  Tag,
  BookOpen,
  Eye,
} from 'lucide-react';
import { API_URL } from '../../utils/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token.replace(/['"]+/g, '')}`;
  return config;
});

interface Subscriber {
  _id: string;
  email: string;
  status: 'active' | 'unconfirmed' | 'unsubscribed';
  source: string;
  subscribedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
}

interface ProductItem {
  _id: string;
  title: string;
  price: number;
  images?: string[];
  description?: string;
}

interface OfferItem {
  _id: string;
  title: string;
  discountPercent?: number;
  offerPrice: number;
  originalPrice?: number;
  description?: string;
  storeName?: string;
}

export default function AdminNewsletterPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'compose'>('subscribers');

  // Stats & List State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    active: 0,
    unsubscribed: 0,
    unconfirmed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Compose State
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignBody, setCampaignBody] = useState('');
  const [testEmail, setTestEmail] = useState('');

  // Selected attachments
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [availableOffers, setAvailableOffers] = useState<OfferItem[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);

  // Sending status
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchProductsAndOffers();
  }, [page, statusFilter]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/admin/newsletter/subscribers', {
        params: {
          search: searchQuery || undefined,
          status: statusFilter,
          page,
          limit: 25,
        },
      });

      if (res.data?.success) {
        setSubscribers(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.meta) setTotalPages(res.data.meta.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load subscribers:', err);
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to fetch subscribers' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndOffers = async () => {
    try {
      const [prodRes, offerRes] = await Promise.allSettled([
        axiosInstance.get('/products?limit=20'),
        axiosInstance.get('/offers?limit=20'),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data?.data) {
        setAvailableProducts(prodRes.value.data.data);
      }
      if (offerRes.status === 'fulfilled' && offerRes.value.data?.data) {
        setAvailableOffers(offerRes.value.data.data);
      }
    } catch (err) {
      console.error('Failed to load products/offers for digest:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubscribers();
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return;
    try {
      const res = await axiosInstance.delete(`/admin/newsletter/subscribers/${id}`);
      if (res.data?.success) {
        setActionAlert({ type: 'success', message: 'Subscriber deleted successfully' });
        fetchSubscribers();
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to delete' });
    }
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleOfferSelect = (id: string) => {
    setSelectedOfferIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSendTestEmail = async () => {
    if (!campaignSubject.trim()) {
      return setActionAlert({ type: 'error', message: 'Please enter a Subject before sending a test.' });
    }

    setIsSendingTest(true);
    setActionAlert(null);

    const selectedProducts = availableProducts.filter((p) => selectedProductIds.includes(p._id));
    const selectedOffers = availableOffers.filter((o) => selectedOfferIds.includes(o._id));

    try {
      const res = await axiosInstance.post('/admin/newsletter/send', {
        subject: campaignSubject,
        title: campaignTitle,
        body: campaignBody,
        products: selectedProducts,
        offers: selectedOffers,
        testEmailOnly: true,
        adminEmail: testEmail.trim() || undefined,
      });

      if (res.data?.success) {
        setActionAlert({ type: 'success', message: `Test email sent to ${res.data.data?.recipient || 'your inbox'}` });
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to send test email' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendBroadcast = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setActionAlert(null);

    const selectedProducts = availableProducts.filter((p) => selectedProductIds.includes(p._id));
    const selectedOffers = availableOffers.filter((o) => selectedOfferIds.includes(o._id));

    try {
      const res = await axiosInstance.post('/admin/newsletter/send', {
        subject: campaignSubject,
        title: campaignTitle,
        body: campaignBody,
        products: selectedProducts,
        offers: selectedOffers,
        testEmailOnly: false,
      });

      if (res.data?.success) {
        setActionAlert({
          type: 'success',
          message: `Campaign successfully dispatched to ${res.data.data?.successCount || stats.active} active subscribers!`,
        });
        setCampaignSubject('');
        setCampaignTitle('');
        setCampaignBody('');
        setSelectedProductIds([]);
        setSelectedOfferIds([]);
        setActiveTab('subscribers');
        fetchSubscribers();
      }
    } catch (err: any) {
      setActionAlert({ type: 'error', message: err.response?.data?.message || 'Failed to dispatch broadcast' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <Mail className="text-[#0FA3B1]" size={28} /> Newsletter & Subscribers
            </h1>
            <p className="text-slate-500 text-sm">Manage subscriber audience and broadcast newsletters, digests & offers</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-200 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'subscribers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Audience ({stats.totalSubscribers})
            </button>
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'compose' ? 'bg-[#FF0000] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send size={14} /> Compose Campaign
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionAlert && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-semibold border ${
              actionAlert.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionAlert.message}</span>
            </div>
            <button onClick={() => setActionAlert(null)} className="text-xs underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Audience</span>
              <Users size={18} className="text-[#0FA3B1]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalSubscribers}</div>
            <div className="text-xs text-slate-400 mt-1">All time registered</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active</span>
              <UserCheck size={18} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.active}</div>
            <div className="text-xs text-slate-400 mt-1">Receiving broadcasts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unconfirmed</span>
              <Mail size={18} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.unconfirmed}</div>
            <div className="text-xs text-slate-400 mt-1">Pending verification</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unsubscribed</span>
              <UserX size={18} className="text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-500">{stats.unsubscribed}</div>
            <div className="text-xs text-slate-400 mt-1">Opted out</div>
          </div>
        </div>

        {/* TAB 1: SUBSCRIBERS LIST */}
        {activeTab === 'subscribers' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search subscriber by email..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0FA3B1]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Search
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <Filter size={14} className="text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="unconfirmed">Unconfirmed</option>
                    <option value="unsubscribed">Unsubscribed</option>
                  </select>
                </div>

                <button
                  onClick={fetchSubscribers}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                  title="Refresh List"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-16 flex justify-center">
                  <Loader2 className="animate-spin text-[#0FA3B1]" size={36} />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">No newsletter subscribers found.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="py-3.5 px-6">Subscriber Email</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Source</th>
                      <th className="py-3.5 px-6">Joined Date</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {subscribers.map((s) => (
                      <tr key={s._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 font-semibold text-slate-900">{s.email}</td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.status === 'unconfirmed'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 capitalize">{s.source?.replace('_', ' ') || 'Footer'}</td>
                        <td className="py-4 px-6 text-slate-500">
                          {new Date(s.subscribedAt || (s as any).createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(s._id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition"
                            title="Remove Subscriber"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPOSE & BROADCAST CAMPAIGN */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Campaign Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#FF0000]" /> Campaign Details
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="e.g. 🎁 Weekend Flash Deals & New Products on Remise"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#0FA3B1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="e.g. Handpicked Deals Just For You"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#0FA3B1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Main Message / Announcement
                  </label>
                  <textarea
                    rows={4}
                    value={campaignBody}
                    onChange={(e) => setCampaignBody(e.target.value)}
                    placeholder="Write your custom message or promotion summary here..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:bg-white focus:border-[#0FA3B1] resize-none"
                  />
                </div>
              </div>

              {/* Product Digest Selector */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#0FA3B1]" /> Include Products in Digest (
                    {selectedProductIds.length} Selected)
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Select products from the catalog to embed rich product cards directly in the newsletter.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {availableProducts.map((p) => {
                    const isSelected = selectedProductIds.includes(p._id);
                    return (
                      <div
                        key={p._id}
                        onClick={() => toggleProductSelect(p._id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                          isSelected ? 'bg-teal-50 border-[#0FA3B1]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="accent-[#0FA3B1]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">{p.title}</div>
                          <div className="text-xs font-semibold text-[#0FA3B1]">₹{(p.price || 0).toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Offer Selector */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Tag size={18} className="text-[#FF0000]" /> Include Special Offers (
                    {selectedOfferIds.length} Selected)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {availableOffers.map((o) => {
                    const isSelected = selectedOfferIds.includes(o._id);
                    return (
                      <div
                        key={o._id}
                        onClick={() => toggleOfferSelect(o._id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                          isSelected ? 'bg-rose-50 border-rose-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="accent-[#FF0000]" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">{o.title}</div>
                          <div className="text-xs text-rose-600 font-bold">
                            ₹{(o.offerPrice || 0).toLocaleString('en-IN')}{' '}
                            {o.discountPercent ? `(${o.discountPercent}% OFF)` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Test & Dispatch Controls */}
            <div className="space-y-6">
              {/* Test Email Box */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Eye size={16} className="text-slate-600" /> Send Test Preview
                </h3>
                <p className="text-xs text-slate-500">Send an exact preview copy to your email before blasting.</p>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@example.com (or defaults)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#0FA3B1]"
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest || isSending}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSendingTest ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {isSendingTest ? 'Sending Test...' : 'Send Test Email'}
                </button>
              </div>

              {/* Broadcast Dispatch Box */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-white">
                  <Send size={18} className="text-[#0FA3B1]" /> Broadcast to Audience
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This will dispatch the newsletter to <strong className="text-white">{stats.active}</strong> active & verified subscribers via the Resend delivery engine.
                </p>

                <div className="bg-white/10 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-200">
                  <div className="flex justify-between">
                    <span>Recipients:</span>
                    <strong className="text-emerald-400">{stats.active} Active</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Products Attached:</span>
                    <strong>{selectedProductIds.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Offers Attached:</span>
                    <strong>{selectedOfferIds.length}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSending || stats.active === 0 || !campaignSubject.trim()}
                  className="w-full py-3.5 bg-[#FF0000] hover:bg-[#e00000] active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {isSending ? 'Broadcasting...' : `Send to ${stats.active} Subscribers`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
              <div className="w-14 h-14 bg-red-50 text-[#FF0000] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Send size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Confirm Newsletter Broadcast</h3>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Are you sure you want to broadcast <strong>"{campaignSubject}"</strong> to{' '}
                <strong className="text-[#FF0000]">{stats.active} active subscribers</strong>?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBroadcast}
                  className="flex-1 py-2.5 bg-[#FF0000] hover:bg-[#e00000] text-white font-bold rounded-xl text-xs transition shadow-md shadow-red-500/20"
                >
                  Yes, Send Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
