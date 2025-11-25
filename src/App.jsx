import React, { useState, useEffect } from 'react';
import { Trash2, TrendingUp, TrendingDown, DollarSign, PiggyBank, RefreshCw, Edit2, MinusCircle } from 'lucide-react';

function App() {
  // Capital tracking
  const [nickCapital, setNickCapital] = useState(600);
  const [joeyCapital, setJoeyCapital] = useState(0);
  
  // Daily entry inputs
  const [entries, setEntries] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [contracts, setContracts] = useState('');
  const [ticker, setTicker] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI state
  const [showAddCapital, setShowAddCapital] = useState(false);
  const [showWithdrawCapital, setShowWithdrawCapital] = useState(false);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [showEditPortfolio, setShowEditPortfolio] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [capitalPerson, setCapitalPerson] = useState('nick');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [newPortfolioValue, setNewPortfolioValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API base URL - works for both Netlify and Vercel
  const API_URL = typeof window !== 'undefined' && window.location.hostname.includes('vercel')
    ? '/api'
    : '/.netlify/functions';

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch capital
      const capitalRes = await fetch(`${API_URL}/get-capital`);
      if (!capitalRes.ok) throw new Error('Failed to fetch capital');
      const capitalData = await capitalRes.json();
      
      capitalData.forEach(c => {
        if (c.person === 'nick') setNickCapital(parseFloat(c.total_invested));
        if (c.person === 'joey') setJoeyCapital(parseFloat(c.total_invested));
      });

      // Fetch entries
      const entriesRes = await fetch(`${API_URL}/get-entries`);
      if (!entriesRes.ok) throw new Error('Failed to fetch entries');
      const entriesData = await entriesRes.json();
      setEntries(entriesData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateStats = (portfolio) => {
    const portfolioNum = parseFloat(portfolio) || 0;
    const totalCapital = nickCapital + joeyCapital;

    const nickOwnership = totalCapital > 0 ? (nickCapital / totalCapital) * 100 : 100;
    const joeyOwnership = totalCapital > 0 ? (joeyCapital / totalCapital) * 100 : 0;

    const nickValue = (portfolioNum * nickOwnership) / 100;
    const joeyValue = (portfolioNum * joeyOwnership) / 100;

    const nickPL = nickValue - nickCapital;
    const joeyPL = joeyValue - joeyCapital;

    const totalPL = portfolioNum - totalCapital;

    return {
      nickOwnership,
      joeyOwnership,
      nickValue,
      joeyValue,
      nickPL,
      joeyPL,
      totalPL,
      totalCapital
    };
  };

  const getLatestPortfolio = () => {
    if (entries.length === 0) return 0;
    return parseFloat(entries[0].portfolio_value);
  };

  const currentStats = calculateStats(getLatestPortfolio());

  const addDailyEntry = async () => {
    if (!portfolioValue || parseFloat(portfolioValue) <= 0) {
      alert('Please enter a valid portfolio value');
      return;
    }

    try {
      setLoading(true);
      const previousValue = getLatestPortfolio();
      const dailyPL = parseFloat(portfolioValue) - previousValue;

      const stats = calculateStats(portfolioValue);

      const entryData = {
        entry_type: 'trade',
        portfolio_value: parseFloat(portfolioValue),
        ticker: ticker || null,
        trade_type: tradeType || null,
        contracts: contracts || null,
        notes: notes || null,
        daily_pl: previousValue > 0 ? dailyPL : 0,
        nick_capital: nickCapital,
        joey_capital: joeyCapital,
        nick_ownership: stats.nickOwnership,
        joey_ownership: stats.joeyOwnership,
        nick_value: stats.nickValue,
        joey_value: stats.joeyValue,
        nick_pl: stats.nickPL,
        joey_pl: stats.joeyPL
      };

      const response = await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      if (!response.ok) throw new Error('Failed to add entry');

      // Reload data
      await loadData();
      
      // Clear form
      setPortfolioValue('');
      setTradeType('');
      setContracts('');
      setTicker('');
      setNotes('');
    } catch (err) {
      console.error('Error adding entry:', err);
      alert('Failed to add entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCapital = async () => {
    const amount = parseFloat(capitalAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Update capital in database
      const response = await fetch(`${API_URL}/update-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: capitalPerson, amount })
      });

      if (!response.ok) throw new Error('Failed to update capital');

      // Create capital injection entry
      const currentPortfolio = getLatestPortfolio() + amount;
      const newNickCapital = capitalPerson === 'nick' ? nickCapital + amount : nickCapital;
      const newJoeyCapital = capitalPerson === 'joey' ? joeyCapital + amount : joeyCapital;
      
      // Calculate new stats with updated capital
      const totalCapital = newNickCapital + newJoeyCapital;
      const nickOwnership = totalCapital > 0 ? (newNickCapital / totalCapital) * 100 : 100;
      const joeyOwnership = totalCapital > 0 ? (newJoeyCapital / totalCapital) * 100 : 0;
      const nickValue = (currentPortfolio * nickOwnership) / 100;
      const joeyValue = (currentPortfolio * joeyOwnership) / 100;

      const entryData = {
        entry_type: 'capital',
        portfolio_value: currentPortfolio,
        capital_person: capitalPerson,
        capital_amount: amount,
        nick_capital: newNickCapital,
        joey_capital: newJoeyCapital,
        nick_ownership: nickOwnership,
        joey_ownership: joeyOwnership,
        nick_value: nickValue,
        joey_value: joeyValue,
        nick_pl: nickValue - newNickCapital,
        joey_pl: joeyValue - newJoeyCapital
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      // Reload all data
      await loadData();
      
      setShowAddCapital(false);
      setCapitalAmount('');
    } catch (err) {
      console.error('Error adding capital:', err);
      alert('Failed to add capital: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry? This cannot be undone.')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/delete-entry`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Failed to delete entry');
      
      await loadData();
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawCapital = async () => {
    const amount = parseFloat(capitalAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const currentCapital = capitalPerson === 'nick' ? nickCapital : joeyCapital;
    if (amount > currentCapital) {
      alert(`Cannot withdraw more than current capital (${formatCurrency(currentCapital)})`);
      return;
    }

    try {
      setLoading(true);

      // Update capital in database (negative amount for withdrawal)
      const response = await fetch(`${API_URL}/update-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: capitalPerson, amount: -amount })
      });

      if (!response.ok) throw new Error('Failed to update capital');

      // Create withdrawal entry
      const currentPortfolio = getLatestPortfolio() - amount;
      const newNickCapital = capitalPerson === 'nick' ? nickCapital - amount : nickCapital;
      const newJoeyCapital = capitalPerson === 'joey' ? joeyCapital - amount : joeyCapital;
      
      // Calculate new stats with updated capital
      const totalCapital = newNickCapital + newJoeyCapital;
      const nickOwnership = totalCapital > 0 ? (newNickCapital / totalCapital) * 100 : 100;
      const joeyOwnership = totalCapital > 0 ? (newJoeyCapital / totalCapital) * 100 : 0;
      const nickValue = (currentPortfolio * nickOwnership) / 100;
      const joeyValue = (currentPortfolio * joeyOwnership) / 100;

      const entryData = {
        entry_type: 'withdrawal',
        portfolio_value: currentPortfolio,
        capital_person: capitalPerson,
        capital_amount: -amount,
        nick_capital: newNickCapital,
        joey_capital: newJoeyCapital,
        nick_ownership: nickOwnership,
        joey_ownership: joeyOwnership,
        nick_value: nickValue,
        joey_value: joeyValue,
        nick_pl: nickValue - newNickCapital,
        joey_pl: joeyValue - newJoeyCapital,
        notes: `${capitalPerson === 'nick' ? 'Nick' : 'Joey'} withdrew ${formatCurrency(amount)}`
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      
      setShowWithdrawCapital(false);
      setCapitalAmount('');
    } catch (err) {
      console.error('Error withdrawing capital:', err);
      alert('Failed to withdraw capital: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditEntry = (entry) => {
    setEditingEntry(entry);
    setPortfolioValue(entry.portfolio_value);
    setTicker(entry.ticker || '');
    setTradeType(entry.trade_type || '');
    setContracts(entry.contracts || '');
    setNotes(entry.notes || '');
    setShowEditEntry(true);
  };

  const updateEntry = async () => {
    if (!portfolioValue || parseFloat(portfolioValue) <= 0) {
      alert('Please enter a valid portfolio value');
      return;
    }

    try {
      setLoading(true);

      // Delete old entry
      await fetch(`${API_URL}/delete-entry`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingEntry.id })
      });

      // Calculate stats for new entry
      const stats = calculateStats(portfolioValue);
      
      // Find previous entry for daily P/L calculation
      const entryIndex = entries.findIndex(e => e.id === editingEntry.id);
      const previousValue = entryIndex < entries.length - 1 
        ? parseFloat(entries[entryIndex + 1].portfolio_value)
        : 0;
      const dailyPL = parseFloat(portfolioValue) - previousValue;

      const entryData = {
        entry_type: editingEntry.entry_type,
        portfolio_value: parseFloat(portfolioValue),
        ticker: ticker || null,
        trade_type: tradeType || null,
        contracts: contracts || null,
        notes: notes || null,
        daily_pl: previousValue > 0 ? dailyPL : 0,
        capital_person: editingEntry.capital_person,
        capital_amount: editingEntry.capital_amount,
        nick_capital: nickCapital,
        joey_capital: joeyCapital,
        nick_ownership: stats.nickOwnership,
        joey_ownership: stats.joeyOwnership,
        nick_value: stats.nickValue,
        joey_value: stats.joeyValue,
        nick_pl: stats.nickPL,
        joey_pl: stats.joeyPL
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      
      setShowEditEntry(false);
      setEditingEntry(null);
      setPortfolioValue('');
      setTradeType('');
      setContracts('');
      setTicker('');
      setNotes('');
    } catch (err) {
      console.error('Error updating entry:', err);
      alert('Failed to update entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePortfolioValue = async () => {
    const newValue = parseFloat(newPortfolioValue);
    if (!newValue || newValue < 0) {
      alert('Please enter a valid portfolio value');
      return;
    }

    try {
      setLoading(true);

      // Get the latest entry to update
      const latestEntry = entries[0];
      if (!latestEntry) {
        alert('No entries to update. Please create an entry first.');
        return;
      }

      // Delete the latest entry
      await fetch(`${API_URL}/delete-entry`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: latestEntry.id })
      });

      // Calculate stats for new portfolio value
      const stats = calculateStats(newValue);
      
      // Find the entry before the latest for daily P/L
      const previousValue = entries.length > 1 
        ? parseFloat(entries[1].portfolio_value)
        : 0;
      const dailyPL = newValue - previousValue;

      // Create new entry with updated portfolio value
      const entryData = {
        entry_type: latestEntry.entry_type,
        portfolio_value: newValue,
        ticker: latestEntry.ticker,
        trade_type: latestEntry.trade_type,
        contracts: latestEntry.contracts,
        notes: latestEntry.notes,
        daily_pl: previousValue > 0 ? dailyPL : 0,
        capital_person: latestEntry.capital_person,
        capital_amount: latestEntry.capital_amount,
        nick_capital: nickCapital,
        joey_capital: joeyCapital,
        nick_ownership: stats.nickOwnership,
        joey_ownership: stats.joeyOwnership,
        nick_value: stats.nickValue,
        joey_value: stats.joeyValue,
        nick_pl: stats.nickPL,
        joey_pl: stats.joeyPL
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      
      setShowEditPortfolio(false);
      setNewPortfolioValue('');
    } catch (err) {
      console.error('Error updating portfolio value:', err);
      alert('Failed to update portfolio value: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (num) => {
    return `${parseFloat(num).toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-8 max-w-md">
          <h2 className="text-white text-xl font-bold mb-4">Error Loading Data</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Trading Tracker
            </h1>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-slate-400 text-lg">Nick & Joey's Portfolio</p>
        </div>

        {/* Current Stats Summary */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 mb-8 border border-slate-700">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Portfolio Value</div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-bold text-blue-400">
                  {formatCurrency(getLatestPortfolio())}
                </div>
                <button
                  onClick={() => {
                    setNewPortfolioValue(getLatestPortfolio().toString());
                    setShowEditPortfolio(true);
                  }}
                  disabled={loading || entries.length === 0}
                  className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Edit portfolio value"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Total Invested</div>
              <div className="text-3xl font-bold text-slate-300">
                {formatCurrency(currentStats.totalCapital)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Total P/L</div>
              <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${currentStats.totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {currentStats.totalPL >= 0 ? <TrendingUp className="w-7 h-7" /> : <TrendingDown className="w-7 h-7" />}
                {formatCurrency(currentStats.totalPL)}
              </div>
            </div>
          </div>
        </div>

        {/* Live Position Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Nick's Box */}
          <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-2xl shadow-2xl p-6 border border-green-700">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              Nick's Position
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-green-200">Total Invested</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(nickCapital)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-green-200">Ownership</span>
                <span className="text-2xl font-bold text-white flex items-center gap-1">
                  {formatPercent(currentStats.nickOwnership)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-green-200">Current Value</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(currentStats.nickValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-green-700">
                <span className="text-green-200">Profit/Loss</span>
                <span className={`text-2xl font-bold flex items-center gap-1 ${currentStats.nickPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {currentStats.nickPL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatCurrency(currentStats.nickPL)}
                </span>
              </div>
              
              <div className="bg-green-950 rounded-lg p-4 mt-4">
                <div className="text-sm text-green-300 mb-1">Amount Owed to Nick</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(currentStats.nickValue)}
                </div>
              </div>
            </div>
          </div>

          {/* Joey's Box */}
          <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-2xl shadow-2xl p-6 border border-orange-700">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              Joey's Position
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-orange-200">Total Invested</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(joeyCapital)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-orange-200">Ownership</span>
                <span className="text-2xl font-bold text-white flex items-center gap-1">
                  {formatPercent(currentStats.joeyOwnership)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-orange-200">Current Value</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(currentStats.joeyValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-orange-700">
                <span className="text-orange-200">Profit/Loss</span>
                <span className={`text-2xl font-bold flex items-center gap-1 ${currentStats.joeyPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {currentStats.joeyPL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatCurrency(currentStats.joeyPL)}
                </span>
              </div>
              
              <div className="bg-orange-950 rounded-lg p-4 mt-4">
                <div className="text-sm text-orange-300 mb-1">Amount Owed to Joey</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(currentStats.joeyValue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Withdraw Capital Buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setShowAddCapital(true)}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            <PiggyBank className="w-5 h-5" />
            Add Capital
          </button>
          <button
            onClick={() => setShowWithdrawCapital(true)}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            <MinusCircle className="w-5 h-5" />
            Withdraw Capital
          </button>
        </div>

        {/* Add Capital Modal */}
        {showAddCapital && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">Add Capital</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Who is investing?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCapitalPerson('nick')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'nick'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Nick
                    </button>
                    <button
                      onClick={() => setCapitalPerson('joey')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'joey'
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Joey
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddCapital(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCapital}
                    disabled={loading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Add Capital
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Capital Modal */}
        {showWithdrawCapital && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">Withdraw Capital</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Who is withdrawing?
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCapitalPerson('nick')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'nick'
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Nick ({formatCurrency(nickCapital)})
                    </button>
                    <button
                      onClick={() => setCapitalPerson('joey')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'joey'
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Joey ({formatCurrency(joeyCapital)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Amount to Withdraw
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="0.00"
                  />
                  <div className="text-xs text-slate-400 mt-2">
                    Maximum: {formatCurrency(capitalPerson === 'nick' ? nickCapital : joeyCapital)}
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Withdrawing capital will reduce both the portfolio value and ownership percentage.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowWithdrawCapital(false);
                      setCapitalAmount('');
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={withdrawCapital}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Entry Modal */}
        {showEditEntry && editingEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Entry</h3>
              
              {editingEntry.entry_type === 'trade' ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Portfolio Value *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={portfolioValue}
                        onChange={(e) => setPortfolioValue(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ticker Symbol
                      </label>
                      <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SPY, AAPL, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Trade Type
                      </label>
                      <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select...</option>
                        <option value="Call">Call</option>
                        <option value="Put">Put</option>
                        <option value="Stock">Stock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Contracts / Shares
                      </label>
                      <input
                        type="text"
                        value={contracts}
                        onChange={(e) => setContracts(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1, 10, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Strike price, expiry, strategy, etc."
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowEditEntry(false);
                        setEditingEntry(null);
                        setPortfolioValue('');
                        setTradeType('');
                        setContracts('');
                        setTicker('');
                        setNotes('');
                      }}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateEntry}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                    >
                      Update Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-300 mb-4">
                    Capital and withdrawal entries cannot be edited directly.
                  </p>
                  <p className="text-slate-400 text-sm mb-6">
                    To correct these entries, please delete and create a new one.
                  </p>
                  <button
                    onClick={() => {
                      setShowEditEntry(false);
                      setEditingEntry(null);
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-all"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Portfolio Value Modal */}
        {showEditPortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit Portfolio Value</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    💡 This will update the most recent entry's portfolio value and recalculate all stats.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Current Portfolio Value
                  </label>
                  <div className="text-2xl font-bold text-slate-400 mb-4">
                    {formatCurrency(getLatestPortfolio())}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Portfolio Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPortfolioValue}
                    onChange={(e) => setNewPortfolioValue(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditPortfolio(false);
                      setNewPortfolioValue('');
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updatePortfolioValue}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Update Value
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Entry Card */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 mb-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            Daily Trade Entry
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New Portfolio Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={portfolioValue}
                onChange={(e) => setPortfolioValue(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SPY, AAPL, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Trade Type
              </label>
              <select
                value={tradeType}
                onChange={(e) => setTradeType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="Call">Call</option>
                <option value="Put">Put</option>
                <option value="Stock">Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contracts / Shares
              </label>
              <input
                type="text"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1, 10, etc."
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Strike price, expiry, strategy, etc."
              rows="2"
            />
          </div>

          <button
            onClick={addDailyEntry}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Daily Entry'}
          </button>
        </div>

        {/* History */}
        {entries.length > 0 && (
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">History</h2>
            
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className={`rounded-lg p-4 border ${
                  entry.entry_type === 'capital' 
                    ? 'bg-purple-900/20 border-purple-700'
                    : 'bg-slate-700/50 border-slate-600'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white font-medium text-lg">
                        {formatDate(entry.entry_date)}
                      </div>
                      {entry.entry_type === 'capital' ? (
                        <div className="text-purple-300 text-sm font-medium mt-1">
                          💰 {entry.capital_person === 'nick' ? 'Nick' : 'Joey'} added {formatCurrency(entry.capital_amount)}
                        </div>
                      ) : entry.entry_type === 'withdrawal' ? (
                        <div className="text-red-300 text-sm font-medium mt-1">
                          💸 {entry.capital_person === 'nick' ? 'Nick' : 'Joey'} withdrew {formatCurrency(Math.abs(entry.capital_amount))}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-sm mt-1">
                          {entry.ticker && entry.ticker !== 'N/A' ? `${entry.ticker} - ` : ''}
                          {entry.trade_type && entry.trade_type !== 'N/A' ? `${entry.trade_type}` : ''}
                          {entry.contracts && entry.contracts !== 'N/A' ? ` (${entry.contracts})` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {entry.entry_type === 'trade' && (
                        <button
                          onClick={() => openEditEntry(entry)}
                          disabled={loading}
                          className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                          title="Edit entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Portfolio</div>
                      <div className="text-white font-medium">
                        {formatCurrency(entry.portfolio_value)}
                      </div>
                    </div>
                    
                    {entry.entry_type === 'trade' && entry.daily_pl !== undefined && (
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Daily P/L</div>
                        <div className={`font-medium ${parseFloat(entry.daily_pl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(entry.daily_pl)}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Nick</div>
                      <div className="text-green-400 font-medium">
                        {formatPercent(entry.nick_ownership)}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Joey</div>
                      <div className="text-orange-400 font-medium">
                        {formatPercent(entry.joey_ownership)}
                      </div>
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="mt-3 text-slate-300 text-sm italic">
                      "{entry.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {entries.length === 0 && !loading && (
          <div className="bg-slate-800 rounded-2xl shadow-2xl p-12 text-center border border-slate-700">
            <p className="text-slate-400 text-lg">No entries yet. Add your first daily entry above! 📈</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
