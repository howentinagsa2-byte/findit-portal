import React, { useState, useEffect } from 'react';
import { Search, PlusCircle, ShieldCheck, Tag, MapPin, Calendar, X, CheckCircle, AlertCircle, User, LogOut, Lock, LayoutDashboard, Trash2, CheckSquare } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'Student' });
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('All Items');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [currentView, setCurrentView] = useState('catalog'); // 'catalog' or 'admin'

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');

  const [newItem, setNewItem] = useState({
    title: '',
    category: 'Electronics',
    status: 'Found',
    location: '',
    description: '',
    postedBy: '',
    dateLostOrFound: new Date().toISOString().split('T')[0]
  });

  const [claimProof, setClaimProof] = useState('');
  const categories = ['All Items', 'Electronics', 'IDs & Documents', 'Personal Items', 'Keys & Wallets'];

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/api/items?category=${encodeURIComponent(activeTab)}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, searchQuery]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setCurrentUser(data.user);
      setAuthMode(null);
      setAuthForm({ name: '', email: '', password: '', role: 'Student' });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.location) return;

    try {
      const res = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          postedBy: currentUser ? currentUser.name : 'Guest User',
          imageUrl: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&q=80'
        })
      });
      if (res.ok) {
        setIsReportModalOpen(false);
        setNewItem({ title: '', category: 'Electronics', status: 'Found', location: '', description: '', postedBy: '', dateLostOrFound: new Date().toISOString().split('T')[0] });
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimProof) return;

    try {
      const res = await fetch(`${API_URL}/api/items/${selectedItemForClaim._id}/claim`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submittedBy: currentUser ? currentUser.name : 'Anonymous Student', proofText: claimProof })
      });
      if (res.ok) {
        setClaimSuccessMessage('Claim submitted successfully! University Security will review your proof.');
        setTimeout(() => {
          setClaimSuccessMessage('');
          setSelectedItemForClaim(null);
          setClaimProof('');
          fetchItems();
        }, 2500);
      }
    } catch (err) {
      console.error('Failed to submit claim:', err);
    }
  };

  const handleResolveItem = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/items/${id}/resolve`, { method: 'PATCH' });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error('Failed to resolve item:', err);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`${API_URL}/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) fetchItems();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const isAdmin = currentUser && currentUser.email.toLowerCase() === 'finditadmin@gmail.com';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Top Header */}
      <header className="bg-indigo-950 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('catalog')}>
            <div className="bg-indigo-600 p-2 rounded-xl shadow-inner">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">FindIt</h1>
              <p className="text-xs text-indigo-200">Campus Lost and Found Portal</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAdmin && (
              <button 
                onClick={() => setCurrentView(currentView === 'admin' ? 'catalog' : 'admin')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  currentView === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-900/80 text-indigo-200 border border-indigo-700'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{currentView === 'admin' ? 'View Catalog' : 'Admin Panel'}</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-indigo-900/80 px-3 py-1.5 rounded-xl border border-indigo-700">
                  <User className="h-4 w-4 text-indigo-300" />
                  <span className="text-xs font-bold">{currentUser.name} {isAdmin && '(Admin)'}</span>
                </div>
                <button 
                  onClick={() => { setCurrentUser(null); setCurrentView('catalog'); }}
                  className="p-2 bg-indigo-900 hover:bg-rose-900/80 text-indigo-200 hover:text-white rounded-xl transition cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setAuthMode('login')}
                  className="px-4 py-2 text-xs font-bold text-indigo-200 hover:text-white transition cursor-pointer"
                >
                  Log In
                </button>
                <button 
                  onClick={() => setAuthMode('signup')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-md cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Report Item</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {currentView === 'admin' && isAdmin ? (
          /* ADMIN DASHBOARD VIEW */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-indigo-100">
                  Secure Security Control Center
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Management Panel</h2>
                <p className="text-slate-600 text-sm mt-1">Review pending ownership claims, oversee active listings, and manage campus resolutions.</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center min-w-[120px]">
                  <span className="block text-xl font-black text-amber-600">
                    {items.filter(i => i.status === 'Claim Pending').length}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Pending Claims</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center min-w-[120px]">
                  <span className="block text-xl font-black text-indigo-600">{items.length}</span>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Total Items</span>
                </div>
              </div>
            </div>

            {/* Admin Table / List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>All Registry Items & Claims</span>
                <span className="text-xs text-slate-500 font-normal">Authorized User: howenbotortinagsa@gmail.com</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center space-x-4">
                      <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            item.status === 'Found' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Claim Pending' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            item.status === 'Resolved' ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">{item.category}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" /> {item.location} • Posted by {item.postedBy}
                        </p>
                        {item.claimProof && item.claimProof.proofText && (
                          <div className="mt-2.5 bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl text-xs text-amber-900">
                            <span className="font-bold">Claim Proof ({item.claimProof.submittedBy}):</span> "{item.claimProof.proofText}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      {item.status === 'Claim Pending' && (
                        <button 
                          onClick={() => handleResolveItem(item._id)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
                        >
                          <CheckSquare className="h-4 w-4" /> Verify & Resolve
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteItem(item._id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD CATALOG VIEW */
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="max-w-2xl">
                <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-indigo-100">
                  Official University System
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Campus Lost & Found Catalog</h2>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  Securely report lost belongings or claim recovered campus items verified by University Security and Student Services.
                </p>
              </div>

              <div className="flex gap-4 w-full lg:w-auto">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-center flex-1 lg:w-36 shadow-sm">
                  <span className="block text-2xl font-black text-emerald-600">88%</span>
                  <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase mt-0.5 block">Recovery Rate</span>
                </div>
                <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 text-center flex-1 lg:w-36 shadow-sm">
                  <span className="block text-2xl font-black text-indigo-600">{items.length}</span>
                  <span className="text-[10px] font-bold tracking-widest text-indigo-700 uppercase mt-0.5 block">Active Listings</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs and Search Bar */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm ${
                      activeTab === category
                        ? 'bg-indigo-950 text-white shadow'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, location, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm transition"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col group">
                  <div className="relative h-56 bg-slate-100 overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <span
                      className={`absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md ${
                        item.status === 'Found' ? 'bg-emerald-500 text-white' :
                        item.status === 'Claim Pending' ? 'bg-amber-500 text-white animate-pulse' :
                        item.status === 'Resolved' ? 'bg-slate-600 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold mb-1.5 uppercase tracking-wider">
                        <Tag className="h-3.5 w-3.5" />
                        <span>{item.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug mb-2">{item.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{item.dateLostOrFound}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedItemForClaim(item)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Claim Item →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* MODAL: Login / Sign Up */}
      {authMode && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <button 
              onClick={() => { setAuthMode(null); setAuthError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {authMode === 'login' ? 'Welcome Back to FindIt' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {authMode === 'login' ? 'Enter your credentials to access your portal.' : 'Register to submit claims or manage listings.'}
            </p>

            {authError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Howen Botor Tinagsa"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@university.edu"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => { setAuthMode(null); setAuthError(''); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  {authMode === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Report Item */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Post Lost or Found Item</h3>
            <p className="text-xs text-slate-500 mb-5">Fill in the details to publish to the campus registry.</p>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Casio Calculator / ID Lanyard" 
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={newItem.status}
                    onChange={(e) => setNewItem({...newItem, status: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="Found">Found</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select 
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="IDs & Documents">IDs & Documents</option>
                    <option value="Personal Items">Personal Items</option>
                    <option value="Keys & Wallets">Keys & Wallets</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Location Lost / Found</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Main Gate / Room 304" 
                  value={newItem.location}
                  onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description & Identifying Marks</label>
                <textarea 
                  rows="3"
                  placeholder="Provide color, brand, or unique details..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 shadow-md cursor-pointer"
                >
                  Post Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Submit Claim */}
      {selectedItemForClaim && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100">
            <button 
              onClick={() => setSelectedItemForClaim(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Submit Proof of Ownership</h3>
            <p className="text-xs text-slate-500 mb-4">Item: <span className="font-semibold text-slate-800">{selectedItemForClaim.title}</span></p>

            {claimSuccessMessage ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{claimSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 flex gap-2.5 leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>Please provide hidden identifiers (serial numbers, sticker placements, or specific contents) to verify ownership with security.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proof Description</label>
                  <textarea 
                    rows="4"
                    required
                    placeholder="Describe specific details only the true owner would know..."
                    value={claimProof}
                    onChange={(e) => setClaimProof(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedItemForClaim(null)}
                    className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500 shadow-md cursor-pointer"
                  >
                    Submit Claim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}