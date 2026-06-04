import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRight,
  CheckCircle,
  Package,
  Users,
  TrendingUp,
  Smartphone,
  BookOpen,
  Key,
  ShoppingBag,
  FileText,
  Watch,
  Shirt,
} from 'lucide-react';
import { useRecentItems, useItemStats } from '../hooks/useItems';
import { ItemCard } from '../components/items/ItemCard';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const CATEGORY_CARDS = [
  { icon: <Smartphone size={22} />, label: 'Electronics', value: 'electronics', color: 'bg-blue-50 text-blue-600' },
  { icon: <Shirt size={22} />, label: 'Clothing', value: 'clothing', color: 'bg-purple-50 text-purple-600' },
  { icon: <Watch size={22} />, label: 'Accessories', value: 'accessories', color: 'bg-amber-50 text-amber-600' },
  { icon: <FileText size={22} />, label: 'Documents', value: 'documents', color: 'bg-red-50 text-red-600' },
  { icon: <Key size={22} />, label: 'Keys', value: 'keys', color: 'bg-emerald-50 text-emerald-600' },
  { icon: <ShoppingBag size={22} />, label: 'Bags', value: 'bags', color: 'bg-orange-50 text-orange-600' },
  { icon: <BookOpen size={22} />, label: 'Books', value: 'books', color: 'bg-sky-50 text-sky-600' },
  { icon: <Package size={22} />, label: 'Other', value: 'other', color: 'bg-slate-50 text-slate-600' },
];

const STEPS = [
  {
    number: '01',
    title: 'Report Your Item',
    description: 'Submit a detailed report with photos, location, and contact info for your lost or found item.',
    color: 'bg-blue-600',
  },
  {
    number: '02',
    title: 'Search Listings',
    description: 'Browse through posted items using filters by category, location, date, and keyword search.',
    color: 'bg-blue-700',
  },
  {
    number: '03',
    title: 'Make Contact',
    description: 'Connect directly with the reporter through our secure messaging system to arrange a handover.',
    color: 'bg-blue-800',
  },
];

export function Home() {
  const navigate = useNavigate();
  const { data: recentItems, isLoading } = useRecentItems();
  const { data: stats } = useItemStats();
  const [search, setSearch] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/lost?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-32 right-20 w-40 h-40 rounded-full border border-white" />
          <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full border border-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-blue-200 mb-6 border border-white/10">
              <MapPin size={14} />
              Your University Lost & Found Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Lost Something on{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                Campus?
              </span>
            </h1>
            <p className="text-lg md:text-xl text-blue-200 mb-10 leading-relaxed max-w-2xl mx-auto">
              The official university platform for reporting and recovering lost & found items. Fast, easy, and trusted by the campus community.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mb-8">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for your lost item…"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-900 text-sm font-medium bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg"
              >
                Search
              </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/post')}
                className="bg-white text-blue-700 hover:bg-blue-50"
              >
                Report an Item
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/lost')}
                className="border-white/40 text-white hover:bg-white/10"
              >
                Browse Listings
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalLost ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Lost Items Reported</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{stats?.totalFound ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Found Items Posted</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{stats?.totalResolved ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">Items Reunited</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Browse by Category</h2>
          <p className="text-slate-500 text-sm">Find your item faster by filtering through categories</p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORY_CARDS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => navigate(`/lost?category=${cat.value}`)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200 group"
            >
              <div className={`p-3 rounded-xl ${cat.color} group-hover:scale-110 transition-transform duration-200`}>
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-slate-600">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Items */}
      <section className="bg-slate-50 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Recent Listings</h2>
              <p className="text-slate-500 text-sm mt-1">Latest lost & found reports from campus</p>
            </div>
            <Link
              to="/lost"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-10 w-10" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(recentItems ?? []).map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">How It Works</h2>
          <p className="text-slate-500 text-sm">Three simple steps to find or return a lost item</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="relative text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-2/3 w-1/2 h-0.5 bg-slate-200" />
              )}
              <div
                className={`w-16 h-16 ${step.color} text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}
              >
                <span className="text-xl font-bold">{step.number}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Found something? Return it today.</h2>
          <p className="text-blue-200 mb-8 max-w-md mx-auto">
            Help someone get their belongings back. Post a found item and be a campus hero.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/post')}
              className="bg-white text-blue-700 hover:bg-blue-50"
            >
              Post Found Item
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/register')}
              className="border-white/40 text-white hover:bg-white/10"
            >
              Create Free Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
