import React, { useState, useEffect } from 'react';
import { Trash2, TrendingUp, TrendingDown, DollarSign, PiggyBank, RefreshCw, Edit2, MinusCircle, CheckSquare, Square, History } from 'lucide-react';

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
  const [showEditValues, setShowEditValues] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [capitalPerson, setCapitalPerson] = useState('nick');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [newPortfolioValue, setNewPortfolioValue] = useState('');
  const [editNickValue, setEditNickValue] = useState('');
  const [editJoeyValue, setEditJoeyValue] = useState('');
  const [editPortfolioTotal, setEditPortfolioTotal] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [depositHistoryPerson, setDepositHistoryPerson] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminNickCapital, setAdminNickCapital] = useState('');
  const [adminJoeyCapital, setAdminJoeyCapital] = useState('');
  const [adminPortfolio, setAdminPortfolio] = useState('');
  const [adminNickValue, setAdminNickValue] = useState('');
  const [adminJoeyValue, setAdminJoeyValue] = useState('');
  const [adminNickOwnership, setAdminNickOwnership] = useState('');
  const [adminJoeyOwnership, setAdminJoeyOwnership] = useState('');
  const [adjustmentMode, setAdjustmentMode] = useState('recalculate'); // 'recalculate' or 'independent'

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

    // Get ownership percentages from the latest entry if it exists
    let nickOwnership, joeyOwnership;
    if (entries.length > 0) {
      nickOwnership = parseFloat(entries[0].nick_ownership) || 0;
      joeyOwnership = parseFloat(entries[0].joey_ownership) || 0;
    } else {
      // No entries yet, calculate from capital
      if (totalCapital > 0) {
        nickOwnership = (nickCapital / totalCapital) * 100;
        joeyOwnership = (joeyCapital / totalCapital) * 100;
      } else {
        // No capital invested yet - default to Nick 100%
        nickOwnership = 100;
        joeyOwnership = 0;
      }
    }

    // Ensure ownership percentages are valid
    const ownershipSum = nickOwnership + joeyOwnership;
    if (ownershipSum > 0 && Math.abs(ownershipSum - 100) > 0.01) {
      // Normalize to 100%
      nickOwnership = (nickOwnership / ownershipSum) * 100;
      joeyOwnership = (joeyOwnership / ownershipSum) * 100;
    }

    // Calculate values based on portfolio and ownership
    const nickValue = portfolioNum > 0 ? (portfolioNum * nickOwnership) / 100 : 0;
    const joeyValue = portfolioNum > 0 ? (portfolioNum * joeyOwnership) / 100 : 0;

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
    const portfolioVal = parseFloat(portfolioValue);
    if (isNaN(portfolioVal) || portfolioVal < 0) {
      alert('Please enter a valid portfolio value (must be 0 or greater)');
      return;
    }

    // Prevent extremely large values
    if (portfolioVal > 1000000000) {
      alert('Portfolio value is too large');
      return;
    }

    try {
      setLoading(true);
      const previousValue = getLatestPortfolio();
      const dailyPL = portfolioVal - previousValue;

      const stats = calculateStats(portfolioVal);

      const entryData = {
        entry_type: 'trade',
        portfolio_value: portfolioVal,
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
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    // Prevent extremely large amounts
    if (amount > 1000000000) {
      alert('Amount is too large');
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

      // Get current portfolio value at the time of investment
      const portfolioAtInvestment = getLatestPortfolio();
      
      // Get current ownership and exact values from the latest entry
      let nickCurrentValue, joeyCurrentValue;
      if (entries.length > 0) {
        nickCurrentValue = parseFloat(entries[0].nick_value) || 0;
        joeyCurrentValue = parseFloat(entries[0].joey_value) || 0;
      } else {
        // No entries yet - starting from zero
        nickCurrentValue = 0;
        joeyCurrentValue = 0;
      }
      
      const newNickCapital = capitalPerson === 'nick' ? nickCapital + amount : nickCapital;
      const newJoeyCapital = capitalPerson === 'joey' ? joeyCapital + amount : joeyCapital;
      
      // Portfolio increases by the new capital investment
      const newPortfolio = portfolioAtInvestment + amount;
      
      // Calculate ownership and values
      let nickOwnership, joeyOwnership, nickValue, joeyValue;
      
      if (portfolioAtInvestment === 0 || (nickCurrentValue === 0 && joeyCurrentValue === 0)) {
        // First investment - whoever invests gets 100%
        if (capitalPerson === 'nick') {
          nickValue = amount;
          joeyValue = 0;
          nickOwnership = 100;
          joeyOwnership = 0;
        } else {
          nickValue = 0;
          joeyValue = amount;
          nickOwnership = 0;
          joeyOwnership = 100;
        }
      } else {
        // Subsequent investment - person's value increases, other stays same
        if (capitalPerson === 'nick') {
          nickValue = nickCurrentValue + amount;
          joeyValue = joeyCurrentValue;
        } else {
          joeyValue = joeyCurrentValue + amount;
          nickValue = nickCurrentValue;
        }
        
        // Recalculate ownership percentages
        if (newPortfolio > 0) {
          nickOwnership = (nickValue / newPortfolio) * 100;
          joeyOwnership = (joeyValue / newPortfolio) * 100;
        } else {
          nickOwnership = 50;
          joeyOwnership = 50;
        }
      }
      
      // Ensure ownership sums to exactly 100%
      const ownershipSum = nickOwnership + joeyOwnership;
      if (Math.abs(ownershipSum - 100) > 0.001) {
        nickOwnership = (nickOwnership / ownershipSum) * 100;
        joeyOwnership = (joeyOwnership / ownershipSum) * 100;
      }

      const entryData = {
        entry_type: 'capital',
        portfolio_value: newPortfolio,
        capital_person: capitalPerson,
        capital_amount: amount,
        nick_capital: newNickCapital,
        joey_capital: newJoeyCapital,
        nick_ownership: nickOwnership,
        joey_ownership: joeyOwnership,
        nick_value: nickValue,
        joey_value: joeyValue,
        nick_pl: nickValue - newNickCapital,
        joey_pl: joeyValue - newJoeyCapital,
        notes: `${capitalPerson === 'nick' ? 'Nick' : 'Joey'} added ${formatCurrency(amount)} at portfolio value ${formatCurrency(portfolioAtInvestment)}`
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
    if (!confirm('Delete this entry? All values will be restored to the previous entry state.')) return;

    try {
      setLoading(true);
      
      // Find the entry being deleted
      const entryToDelete = entries.find(e => e.id === id);
      
      if (!entryToDelete) {
        throw new Error('Entry not found');
      }
      
      // If it's a capital or withdrawal entry, reverse the capital change
      if ((entryToDelete.entry_type === 'capital' || entryToDelete.entry_type === 'withdrawal') && 
          entryToDelete.capital_person && entryToDelete.capital_amount) {
        const amount = parseFloat(entryToDelete.capital_amount);
        const person = entryToDelete.capital_person;
        
        // Reverse the capital change
        await fetch(`${API_URL}/update-capital`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person, amount: -amount })
        });
      }
      
      // Delete the entry
      const response = await fetch(`${API_URL}/delete-entry`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Failed to delete entry');
      
      await loadData();
      setSelectedEntries(new Set());
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntrySelection = (id) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map(e => e.id)));
    }
  };

  const deleteSelectedEntries = async () => {
    if (selectedEntries.size === 0) {
      alert('No entries selected');
      return;
    }

    if (!confirm(`Delete ${selectedEntries.size} selected entries? All capital changes will be reversed.`)) return;

    try {
      setLoading(true);
      
      // First, reverse any capital/withdrawal entries
      const entriesToDelete = entries.filter(e => selectedEntries.has(e.id));
      const capitalReversals = entriesToDelete
        .filter(e => (e.entry_type === 'capital' || e.entry_type === 'withdrawal') && 
                     e.capital_person && e.capital_amount)
        .map(e => ({
          person: e.capital_person,
          amount: -parseFloat(e.capital_amount)
        }));
      
      // Group capital reversals by person and sum them
      const capitalChanges = capitalReversals.reduce((acc, { person, amount }) => {
        if (!acc[person]) acc[person] = 0;
        acc[person] += amount;
        return acc;
      }, {});
      
      // Apply capital reversals
      await Promise.all(
        Object.entries(capitalChanges).map(([person, amount]) =>
          fetch(`${API_URL}/update-capital`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ person, amount })
          })
        )
      );
      
      // Delete all selected entries
      await Promise.all(
        Array.from(selectedEntries).map(id =>
          fetch(`${API_URL}/delete-entry`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          })
        )
      );
      
      await loadData();
      setSelectedEntries(new Set());
    } catch (err) {
      console.error('Error deleting entries:', err);
      alert('Failed to delete entries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const withdrawCapital = async () => {
    const amount = parseFloat(capitalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    // Get current portfolio and calculate current values
    const currentPortfolio = getLatestPortfolio();
    if (currentPortfolio <= 0) {
      alert('No funds available to withdraw');
      return;
    }

    const currentStats = calculateStats(currentPortfolio);
    const currentValue = capitalPerson === 'nick' ? currentStats.nickValue : currentStats.joeyValue;
    
    // Ensure withdrawal doesn't exceed current value (with small tolerance)
    if (amount > currentValue + 0.01) {
      alert(`Cannot withdraw more than current value owed (${formatCurrency(currentValue)})`);
      return;
    }

    // If withdrawing entire value, use exact current value to avoid rounding issues
    const finalAmount = Math.abs(amount - currentValue) < 0.01 ? currentValue : amount;

    try {
      setLoading(true);

      // Update capital in database (negative amount for withdrawal)
      const response = await fetch(`${API_URL}/update-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: capitalPerson, amount: -finalAmount })
      });

      if (!response.ok) throw new Error('Failed to update capital');

      // Calculate new portfolio after withdrawal
      const newPortfolio = Math.max(0, currentPortfolio - finalAmount);
      
      const newNickCapital = Math.max(0, capitalPerson === 'nick' ? nickCapital - finalAmount : nickCapital);
      const newJoeyCapital = Math.max(0, capitalPerson === 'joey' ? joeyCapital - finalAmount : joeyCapital);
      
      // Calculate ownership and values
      let nickOwnership, joeyOwnership, nickValue, joeyValue;
      
      if (newPortfolio <= 0.01) {
        // Portfolio effectively empty
        nickOwnership = 50;
        joeyOwnership = 50;
        nickValue = 0;
        joeyValue = 0;
      } else {
        if (capitalPerson === 'nick') {
          // Nick is withdrawing
          nickValue = Math.max(0, currentStats.nickValue - finalAmount);
          joeyValue = currentStats.joeyValue;
        } else {
          // Joey is withdrawing
          joeyValue = Math.max(0, currentStats.joeyValue - finalAmount);
          nickValue = currentStats.nickValue;
        }
        
        // Calculate ownership percentages
        nickOwnership = (nickValue / newPortfolio) * 100;
        joeyOwnership = (joeyValue / newPortfolio) * 100;
        
        // Normalize to 100%
        const ownershipSum = nickOwnership + joeyOwnership;
        if (ownershipSum > 0 && Math.abs(ownershipSum - 100) > 0.001) {
          nickOwnership = (nickOwnership / ownershipSum) * 100;
          joeyOwnership = (joeyOwnership / ownershipSum) * 100;
        }
      }

      const entryData = {
        entry_type: 'withdrawal',
        portfolio_value: newPortfolio,
        capital_person: capitalPerson,
        capital_amount: -finalAmount,
        nick_capital: newNickCapital,
        joey_capital: newJoeyCapital,
        nick_ownership: nickOwnership,
        joey_ownership: joeyOwnership,
        nick_value: nickValue,
        joey_value: joeyValue,
        nick_pl: nickValue - newNickCapital,
        joey_pl: joeyValue - newJoeyCapital,
        notes: `${capitalPerson === 'nick' ? 'Nick' : 'Joey'} withdrew ${formatCurrency(finalAmount)}`
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
        joey_pl: stats.joeyPL,
        entry_date: editingEntry.entry_date // Preserve original timestamp
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

  const openEditValues = () => {
    const currentPortfolio = getLatestPortfolio();
    setEditPortfolioTotal(currentPortfolio.toString());
    setEditNickValue(currentStats.nickValue.toFixed(2));
    setEditJoeyValue(currentStats.joeyValue.toFixed(2));
    setShowEditValues(true);
  };

  const updateValues = async () => {
    const newPortfolio = parseFloat(editPortfolioTotal);
    const newNickValue = parseFloat(editNickValue);
    const newJoeyValue = parseFloat(editJoeyValue);

    if (isNaN(newPortfolio) || newPortfolio < 0) {
      alert('Please enter a valid portfolio value');
      return;
    }

    // If only portfolio total is changed, calculate values based on current ownership
    const portfolioChanged = newPortfolio !== getLatestPortfolio();
    const valuesChanged = newNickValue !== currentStats.nickValue || newJoeyValue !== currentStats.joeyValue;

    let finalNickValue, finalJoeyValue;

    if (portfolioChanged && !valuesChanged) {
      // Portfolio changed but individual values didn't - adjust proportionally
      finalNickValue = (newPortfolio * currentStats.nickOwnership) / 100;
      finalJoeyValue = (newPortfolio * currentStats.joeyOwnership) / 100;
    } else {
      // Individual values were changed - validate they add up
      if (isNaN(newNickValue) || newNickValue < 0 || isNaN(newJoeyValue) || newJoeyValue < 0) {
        alert('Please enter valid values for Nick and Joey');
        return;
      }

      const totalValues = newNickValue + newJoeyValue;
      if (Math.abs(totalValues - newPortfolio) > 0.01) {
        alert(`Nick's current value + Joey's current value must equal the Portfolio Total.\n\nNick: ${formatCurrency(newNickValue)}\nJoey: ${formatCurrency(newJoeyValue)}\nSum: ${formatCurrency(totalValues)}\n\nPortfolio Total: ${formatCurrency(newPortfolio)}\n\nDifference: ${formatCurrency(Math.abs(totalValues - newPortfolio))}\n\nNote: These are current portfolio values, not capital contributions.`);
        return;
      }

      finalNickValue = newNickValue;
      finalJoeyValue = newJoeyValue;
    }

    try {
      setLoading(true);

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

      // Calculate new ownership percentages
      const nickOwnership = (finalNickValue / newPortfolio) * 100;
      const joeyOwnership = (finalJoeyValue / newPortfolio) * 100;

      // Find the entry before the latest for daily P/L
      const previousValue = entries.length > 1 
        ? parseFloat(entries[1].portfolio_value)
        : 0;
      const dailyPL = newPortfolio - previousValue;

      // Create new entry with updated values
      const entryData = {
        entry_type: latestEntry.entry_type,
        portfolio_value: newPortfolio,
        ticker: latestEntry.ticker,
        trade_type: latestEntry.trade_type,
        contracts: latestEntry.contracts,
        notes: latestEntry.notes,
        daily_pl: previousValue > 0 ? dailyPL : 0,
        capital_person: latestEntry.capital_person,
        capital_amount: latestEntry.capital_amount,
        nick_capital: nickCapital,
        joey_capital: joeyCapital,
        nick_ownership: nickOwnership,
        joey_ownership: joeyOwnership,
        nick_value: finalNickValue,
        joey_value: finalJoeyValue,
        nick_pl: finalNickValue - nickCapital,
        joey_pl: finalJoeyValue - joeyCapital
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      
      setShowEditValues(false);
      setEditPortfolioTotal('');
      setEditNickValue('');
      setEditJoeyValue('');
    } catch (err) {
      console.error('Error updating values:', err);
      alert('Failed to update values: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDepositHistory = (person) => {
    return entries
      .filter(e => e.entry_type === 'capital' && e.capital_person === person)
      .map(e => ({
        id: e.id,
        date: e.entry_date,
        amount: parseFloat(e.capital_amount),
        portfolioBefore: entries.length > 0 ? (
          entries.find(prev => new Date(prev.entry_date) < new Date(e.entry_date) && prev.entry_type !== 'capital')?.portfolio_value || 0
        ) : 0,
        portfolioAfter: parseFloat(e.portfolio_value),
        ownershipAfter: person === 'nick' ? parseFloat(e.nick_ownership) : parseFloat(e.joey_ownership)
      }));
  };

  const openDepositHistory = (person) => {
    setDepositHistoryPerson(person);
    setShowDepositHistory(true);
  };

  const openAdminPanel = () => {
    const currentPortfolio = getLatestPortfolio();
    setAdminPortfolio(currentPortfolio.toString());
    setAdminNickCapital(nickCapital.toString());
    setAdminJoeyCapital(joeyCapital.toString());
    setAdminNickValue(currentStats.nickValue.toFixed(2));
    setAdminJoeyValue(currentStats.joeyValue.toFixed(2));
    setAdminNickOwnership(currentStats.nickOwnership.toFixed(2));
    setAdminJoeyOwnership(currentStats.joeyOwnership.toFixed(2));
    setShowAdminPanel(true);
  };

  const applyAdminChanges = async () => {
    const portfolio = parseFloat(adminPortfolio);
    const nickCap = parseFloat(adminNickCapital);
    const joeCap = parseFloat(adminJoeyCapital);
    const nickVal = parseFloat(adminNickValue);
    const joeVal = parseFloat(adminJoeyValue);
    const nickOwn = parseFloat(adminNickOwnership);
    const joeOwn = parseFloat(adminJoeyOwnership);

    // Validation
    if (isNaN(portfolio) || portfolio < 0) {
      alert('Invalid portfolio value');
      return;
    }
    if (isNaN(nickCap) || nickCap < 0 || isNaN(joeCap) || joeCap < 0) {
      alert('Invalid capital values');
      return;
    }
    if (isNaN(nickVal) || nickVal < 0 || isNaN(joeVal) || joeVal < 0) {
      alert('Invalid current values');
      return;
    }
    if (isNaN(nickOwn) || isNaN(joeOwn)) {
      alert('Invalid ownership percentages');
      return;
    }

    // Check if values make sense
    if (adjustmentMode === 'independent') {
      // In independent mode, just warn if things don't add up
      if (Math.abs(nickVal + joeVal - portfolio) > 0.01) {
        if (!confirm(`Warning: Nick value + Joey value (${formatCurrency(nickVal + joeVal)}) doesn't equal portfolio (${formatCurrency(portfolio)}). Continue anyway?`)) {
          return;
        }
      }
      if (Math.abs(nickOwn + joeOwn - 100) > 0.1) {
        if (!confirm(`Warning: Ownership percentages don't add to 100% (${(nickOwn + joeOwn).toFixed(2)}%). Continue anyway?`)) {
          return;
        }
      }
    } else {
      // Recalculate mode - ensure consistency
      const totalOwnership = nickOwn + joeOwn;
      if (totalOwnership === 0) {
        alert('Ownership percentages cannot both be zero');
        return;
      }
    }

    try {
      setLoading(true);

      // Update capital values in database
      await fetch(`${API_URL}/update-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: 'nick', amount: nickCap - nickCapital })
      });

      await fetch(`${API_URL}/update-capital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: 'joey', amount: joeCap - joeyCapital })
      });

      let finalNickVal, finalJoeVal, finalNickOwn, finalJoeOwn;

      if (adjustmentMode === 'recalculate') {
        // Normalize ownership to 100%
        const totalOwn = nickOwn + joeOwn;
        finalNickOwn = (nickOwn / totalOwn) * 100;
        finalJoeOwn = (joeOwn / totalOwn) * 100;

        // Recalculate values based on ownership
        finalNickVal = (portfolio * finalNickOwn) / 100;
        finalJoeVal = (portfolio * finalJoeOwn) / 100;
      } else {
        // Use exact values entered
        finalNickVal = nickVal;
        finalJoeVal = joeVal;
        finalNickOwn = nickOwn;
        finalJoeOwn = joeOwn;
      }

      // Create a correction entry
      const entryData = {
        entry_type: 'trade',
        portfolio_value: portfolio,
        ticker: null,
        trade_type: null,
        contracts: null,
        notes: `Admin adjustment (${adjustmentMode} mode)`,
        daily_pl: 0,
        nick_capital: nickCap,
        joey_capital: joeCap,
        nick_ownership: finalNickOwn,
        joey_ownership: finalJoeOwn,
        nick_value: finalNickVal,
        joey_value: finalJoeVal,
        nick_pl: finalNickVal - nickCap,
        joey_pl: finalJoeVal - joeCap
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      setShowAdminPanel(false);
      alert('Values updated successfully');
    } catch (err) {
      console.error('Error applying admin changes:', err);
      alert('Failed to apply changes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const restoreToHistoryPoint = async (entry) => {
    if (!confirm(`Restore all values to this point in history (${formatDate(entry.entry_date)})? This will create a new entry with these exact values.`)) {
      return;
    }

    try {
      setLoading(true);

      // Calculate capital differences
      const nickCapDiff = parseFloat(entry.nick_capital) - nickCapital;
      const joeCapDiff = parseFloat(entry.joey_capital) - joeyCapital;

      // Update capital if needed
      if (Math.abs(nickCapDiff) > 0.01) {
        await fetch(`${API_URL}/update-capital`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person: 'nick', amount: nickCapDiff })
        });
      }

      if (Math.abs(joeCapDiff) > 0.01) {
        await fetch(`${API_URL}/update-capital`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ person: 'joey', amount: joeCapDiff })
        });
      }

      // Create new entry with restored values
      const entryData = {
        entry_type: 'trade',
        portfolio_value: parseFloat(entry.portfolio_value),
        ticker: null,
        trade_type: null,
        contracts: null,
        notes: `Restored to ${formatDate(entry.entry_date)}`,
        daily_pl: 0,
        nick_capital: parseFloat(entry.nick_capital),
        joey_capital: parseFloat(entry.joey_capital),
        nick_ownership: parseFloat(entry.nick_ownership),
        joey_ownership: parseFloat(entry.joey_ownership),
        nick_value: parseFloat(entry.nick_value),
        joey_value: parseFloat(entry.joey_value),
        nick_pl: parseFloat(entry.nick_pl),
        joey_pl: parseFloat(entry.joey_pl)
      };

      await fetch(`${API_URL}/add-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData)
      });

      await loadData();
      alert('Successfully restored to history point');
    } catch (err) {
      console.error('Error restoring to history point:', err);
      alert('Failed to restore: ' + err.message);
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
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-white">Current Stats</h2>
            <button
              onClick={openEditValues}
              disabled={loading || entries.length === 0}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Edit all values"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Values</span>
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-slate-400 text-sm mb-2">Portfolio Value</div>
              <div className="text-3xl font-bold text-blue-400">
                {formatCurrency(getLatestPortfolio())}
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
          <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-2xl shadow-2xl p-6 border border-red-700">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              Nick's Position
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-red-200">Total Invested</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(nickCapital)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-red-200">Ownership</span>
                <span className="text-2xl font-bold text-white flex items-center gap-1">
                  {formatPercent(currentStats.nickOwnership)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-red-200">Current Value</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(currentStats.nickValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-red-700">
                <span className="text-red-200">Profit/Loss</span>
                <span className={`text-2xl font-bold flex items-center gap-1 ${currentStats.nickPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {currentStats.nickPL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatCurrency(currentStats.nickPL)}
                </span>
              </div>
              
              <div className="bg-red-950 rounded-lg p-4 mt-4">
                <div className="text-sm text-red-300 mb-1">Amount Owed to Nick</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(currentStats.nickValue)}
                </div>
              </div>
              
              <button
                onClick={() => openDepositHistory('nick')}
                className="w-full mt-4 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                View Deposit History
              </button>
            </div>
          </div>

          {/* Joey's Box */}
          <div className="bg-gradient-to-br from-cyan-900 to-blue-800 rounded-2xl shadow-2xl p-6 border border-cyan-700">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              Joey's Position
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Total Invested</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(joeyCapital)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Ownership</span>
                <span className="text-2xl font-bold text-white flex items-center gap-1">
                  {formatPercent(currentStats.joeyOwnership)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-cyan-200">Current Value</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(currentStats.joeyValue)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-cyan-700">
                <span className="text-cyan-200">Profit/Loss</span>
                <span className={`text-2xl font-bold flex items-center gap-1 ${currentStats.joeyPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {currentStats.joeyPL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {formatCurrency(currentStats.joeyPL)}
                </span>
              </div>
              
              <div className="bg-cyan-950 rounded-lg p-4 mt-4">
                <div className="text-sm text-cyan-300 mb-1">Amount Owed to Joey</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(currentStats.joeyValue)}
                </div>
              </div>
              
              <button
                onClick={() => openDepositHistory('joey')}
                className="w-full mt-4 bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                View Deposit History
              </button>
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
          <button
            onClick={openAdminPanel}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            <Edit2 className="w-5 h-5" />
            Admin Panel
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
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Nick
                    </button>
                    <button
                      onClick={() => setCapitalPerson('joey')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'joey'
                          ? 'bg-cyan-600 text-white'
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
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Nick ({formatCurrency(calculateStats(getLatestPortfolio()).nickValue)})
                    </button>
                    <button
                      onClick={() => setCapitalPerson('joey')}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        capitalPerson === 'joey'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Joey ({formatCurrency(calculateStats(getLatestPortfolio()).joeyValue)})
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
                    Maximum: {formatCurrency(
                      capitalPerson === 'nick' 
                        ? calculateStats(getLatestPortfolio()).nickValue 
                        : calculateStats(getLatestPortfolio()).joeyValue
                    )}
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ Withdrawing will reduce your current value owed and the portfolio total.
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

        {/* Edit Values Modal */}
        {showEditValues && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-lg w-full border border-slate-700">
              <h3 className="text-2xl font-bold text-white mb-6">Edit All Values</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
                  <p className="text-blue-300 text-sm">
                    💡 Edit the portfolio total to reflect market gains/losses. Nick and Joey's values will adjust proportionally based on their ownership.
                  </p>
                  <p className="text-blue-300 text-xs mt-2">
                    Or manually adjust individual values - they must add up to the portfolio total.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Portfolio Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPortfolioTotal}
                    onChange={(e) => {
                      const newTotal = e.target.value;
                      setEditPortfolioTotal(newTotal);
                      // Auto-update individual values proportionally
                      if (newTotal && !isNaN(parseFloat(newTotal))) {
                        const ratio = parseFloat(newTotal) / getLatestPortfolio();
                        setEditNickValue((currentStats.nickValue * ratio).toFixed(2));
                        setEditJoeyValue((currentStats.joeyValue * ratio).toFixed(2));
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-300 mb-2">
                      Nick's Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editNickValue}
                      onChange={(e) => setEditNickValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-red-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Joey's Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editJoeyValue}
                      onChange={(e) => setEditJoeyValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-cyan-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Sum of values:</span>
                    <span className={`font-medium ${
                      Math.abs((parseFloat(editNickValue) || 0) + (parseFloat(editJoeyValue) || 0) - (parseFloat(editPortfolioTotal) || 0)) < 0.02
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {formatCurrency((parseFloat(editNickValue) || 0) + (parseFloat(editJoeyValue) || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowEditValues(false);
                      setEditPortfolioTotal('');
                      setEditNickValue('');
                      setEditJoeyValue('');
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateValues}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Update All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Panel Modal */}
        {showAdminPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-yellow-600 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">⚙️ Admin Panel</h3>
              <p className="text-slate-300 text-sm mb-6">Manually adjust all system values. Use with caution!</p>
              
              <div className="space-y-6">
                {/* Adjustment Mode Selection */}
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                  <label className="block text-sm font-medium text-yellow-300 mb-3">
                    Adjustment Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        value="recalculate"
                        checked={adjustmentMode === 'recalculate'}
                        onChange={(e) => setAdjustmentMode(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-white font-medium">Recalculate (Recommended)</div>
                        <div className="text-slate-400 text-xs">Values will be recalculated based on ownership percentages. Ownership will be normalized to 100%.</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        value="independent"
                        checked={adjustmentMode === 'independent'}
                        onChange={(e) => setAdjustmentMode(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="text-white font-medium">Independent (Advanced)</div>
                        <div className="text-slate-400 text-xs">All values will be set exactly as entered, even if they don't add up correctly.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Capital Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Nick's Total Invested
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminNickCapital}
                      onChange={(e) => setAdminNickCapital(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-red-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Joey's Total Invested
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminJoeyCapital}
                      onChange={(e) => setAdminJoeyCapital(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-cyan-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Portfolio Value */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Portfolio Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adminPortfolio}
                    onChange={(e) => setAdminPortfolio(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Current Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Nick's Current Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminNickValue}
                      onChange={(e) => setAdminNickValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-red-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={adjustmentMode === 'recalculate'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Joey's Current Value
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminJoeyValue}
                      onChange={(e) => setAdminJoeyValue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-cyan-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      disabled={adjustmentMode === 'recalculate'}
                    />
                  </div>
                </div>

                {/* Ownership Percentages */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-red-300 mb-2">
                      Nick's Ownership %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminNickOwnership}
                      onChange={(e) => setAdminNickOwnership(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-red-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                      Joey's Ownership %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adminJoeyOwnership}
                      onChange={(e) => setAdminJoeyOwnership(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-cyan-600 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sum of Values:</span>
                    <span className={`font-medium ${
                      Math.abs((parseFloat(adminNickValue) || 0) + (parseFloat(adminJoeyValue) || 0) - (parseFloat(adminPortfolio) || 0)) < 0.01
                        ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {formatCurrency((parseFloat(adminNickValue) || 0) + (parseFloat(adminJoeyValue) || 0))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sum of Ownership:</span>
                    <span className={`font-medium ${
                      Math.abs((parseFloat(adminNickOwnership) || 0) + (parseFloat(adminJoeyOwnership) || 0) - 100) < 0.1
                        ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {((parseFloat(adminNickOwnership) || 0) + (parseFloat(adminJoeyOwnership) || 0)).toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAdminPanel(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={applyAdminChanges}
                    disabled={loading}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                  >
                    Apply Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit History Modal */}
        {showDepositHistory && depositHistoryPerson && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto border border-slate-700">
              <div className={`sticky top-0 ${depositHistoryPerson === 'nick' ? 'bg-gradient-to-r from-red-900 to-red-800' : 'bg-gradient-to-r from-cyan-900 to-blue-800'} px-6 py-4 border-b ${depositHistoryPerson === 'nick' ? 'border-red-700' : 'border-cyan-700'}`}>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <History className="w-6 h-6" />
                  {depositHistoryPerson === 'nick' ? "Nick's" : "Joey's"} Deposit History
                </h2>
              </div>

              <div className="p-6">
                {getDepositHistory(depositHistoryPerson).length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">No deposits yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {getDepositHistory(depositHistoryPerson).map((deposit, index) => (
                      <div key={deposit.id} className={`rounded-lg p-5 border ${depositHistoryPerson === 'nick' ? 'bg-red-900/20 border-red-700' : 'bg-cyan-900/20 border-cyan-700'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-slate-400 text-sm mb-1">
                              Deposit #{getDepositHistory(depositHistoryPerson).length - index}
                            </div>
                            <div className="text-white text-lg font-medium">
                              {formatDate(deposit.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-sm mb-1">Amount</div>
                            <div className={`text-2xl font-bold ${depositHistoryPerson === 'nick' ? 'text-green-400' : 'text-orange-400'}`}>
                              {formatCurrency(deposit.amount)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-600">
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Portfolio After</div>
                            <div className="text-white font-medium">
                              {formatCurrency(deposit.portfolioAfter)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-xs mb-1">Ownership After</div>
                            <div className="text-white font-medium">
                              {formatPercent(deposit.ownershipAfter)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className={`rounded-lg p-5 border ${depositHistoryPerson === 'nick' ? 'bg-red-900/30 border-red-600' : 'bg-cyan-900/30 border-cyan-600'}`}>
                      <div className="text-center">
                        <div className="text-slate-300 text-sm mb-2">Total Deposited</div>
                        <div className={`text-3xl font-bold ${depositHistoryPerson === 'nick' ? 'text-red-400' : 'text-cyan-400'}`}>
                          {formatCurrency(
                            getDepositHistory(depositHistoryPerson).reduce((sum, d) => sum + d.amount, 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowDepositHistory(false);
                      setDepositHistoryPerson(null);
                    }}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition-all"
                  >
                    Close
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">History</h2>
              <div className="flex gap-3 items-center">
                {!deleteMode ? (
                  <button
                    onClick={() => setDeleteMode(true)}
                    disabled={loading}
                    className="bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Mode
                  </button>
                ) : (
                  <>
                    <button
                      onClick={toggleSelectAll}
                      disabled={loading}
                      className="text-slate-300 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                      {selectedEntries.size === entries.length ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      <span className="text-sm">
                        {selectedEntries.size === entries.length ? 'Deselect All' : 'Select All'}
                      </span>
                    </button>
                    {selectedEntries.size > 0 && (
                      <button
                        onClick={deleteSelectedEntries}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete {selectedEntries.size} Selected
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDeleteMode(false);
                        setSelectedEntries(new Set());
                      }}
                      disabled={loading}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 font-medium"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              {entries.map((entry, index) => {
                // Calculate individual P/L for this entry compared to previous
                const previousEntry = entries[index + 1];
                let nickEntryPL = 0;
                let joeyEntryPL = 0;
                
                if (entry.entry_type === 'trade' && previousEntry) {
                  nickEntryPL = parseFloat(entry.nick_value) - parseFloat(previousEntry.nick_value);
                  joeyEntryPL = parseFloat(entry.joey_value) - parseFloat(previousEntry.joey_value);
                }
                
                return (
                <div key={entry.id} className={`rounded-lg p-4 border ${
                  selectedEntries.has(entry.id)
                    ? 'bg-blue-900/30 border-blue-500'
                    : entry.entry_type === 'capital' 
                    ? 'bg-purple-900/20 border-purple-700'
                    : 'bg-slate-700/50 border-slate-600'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {deleteMode && (
                        <button
                          onClick={() => toggleEntrySelection(entry.id)}
                          disabled={loading}
                          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 mt-1"
                        >
                          {selectedEntries.has(entry.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <div className="flex-1">
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
                    </div>
                    {!deleteMode && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => restoreToHistoryPoint(entry)}
                          disabled={loading}
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 p-2 rounded-lg transition-all disabled:opacity-50"
                          title="Restore to this point"
                        >
                          <History className="w-5 h-5" />
                        </button>
                        {entry.entry_type === 'trade' && (
                          <button
                            onClick={() => openEditEntry(entry)}
                            disabled={loading}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 p-2 rounded-lg transition-all disabled:opacity-50"
                            title="Edit entry"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          disabled={loading}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 rounded-lg transition-all disabled:opacity-50"
                          title="Delete entry"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
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
                      <div className="text-red-400 font-medium">
                        {formatPercent(entry.nick_ownership)}
                      </div>
                      {entry.entry_type === 'trade' && previousEntry && (
                        <div className={`text-xs font-medium mt-1 ${nickEntryPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {nickEntryPL >= 0 ? '+' : ''}{formatCurrency(nickEntryPL)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-slate-400 text-xs mb-1">Joey</div>
                      <div className="text-cyan-400 font-medium">
                        {formatPercent(entry.joey_ownership)}
                      </div>
                      {entry.entry_type === 'trade' && previousEntry && (
                        <div className={`text-xs font-medium mt-1 ${joeyEntryPL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {joeyEntryPL >= 0 ? '+' : ''}{formatCurrency(joeyEntryPL)}
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.notes && (
                    <div className="mt-3 text-slate-300 text-sm italic">
                      "{entry.notes}"
                    </div>
                  )}
                </div>
              );
              })}
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
