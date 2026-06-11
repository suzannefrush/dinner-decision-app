'use client'

import { useState, useEffect, useMemo } from 'react';
import { ExternalLink, X, BookOpen, Copy, Plus } from 'lucide-react';

const MEAL_TYPES = ['plate', 'bowl', 'salad', 'soup', 'main', 'side'];

const DEFAULT_FILTERS = {
  cuisine: '',
  mealType: '',
  maxCookTime: '',
  ingredient: '',
  proteinForward: true,
};

const pad = (n) => String(n).padStart(2, '0');
const timeStamp = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [rolledAt, setRolledAt] = useState(null);
  const [copied, setCopied] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    name: '', cuisine: '', mealType: '', cookTime: '', ingredients: '', source: '',
  });

  useEffect(() => {
    loadRecipes();
    const lastId = localStorage.getItem('lastSelectedRecipeId');
    if (lastId) setLastSelectedId(parseInt(lastId));
  }, []);

  const loadRecipes = async () => {
    try {
      const res = await fetch('/api/recipes');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cuisineOptions = useMemo(
    () => [...new Set(recipes.map((r) => r.cuisine))].sort(),
    [recipes]
  );

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (filters.cuisine && recipe.cuisine !== filters.cuisine) return false;
      if (filters.mealType && recipe.meal_type !== filters.mealType) return false;
      const maxCook = parseInt(filters.maxCookTime);
      if (filters.maxCookTime && maxCook < 120 && recipe.cook_time > maxCook) return false;
      if (filters.ingredient) {
        const hasIngredient = recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(filters.ingredient.toLowerCase())
        );
        if (!hasIngredient) return false;
      }
      if (filters.proteinForward && Number(recipe.plan_supportive) !== 1) return false;
      return true;
    });
  }, [recipes, filters]);

  const matchCount = filteredRecipes.length;
  const activeFilterCount =
    (filters.cuisine ? 1 : 0) +
    (filters.mealType ? 1 : 0) +
    (filters.maxCookTime && parseInt(filters.maxCookTime) < 120 ? 1 : 0) +
    (filters.ingredient ? 1 : 0) +
    (!filters.proteinForward ? 1 : 0);

  const cookTimeNum = filters.maxCookTime ? parseInt(filters.maxCookTime) : 120;

  const selectRandomRecipe = () => {
    if (filteredRecipes.length === 0) return;
    setRolling(true);
    const available = filteredRecipes.filter((r) => r.id !== lastSelectedId);
    const pool = available.length > 0 ? available : filteredRecipes;
    const recipe = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      setSelectedRecipe(recipe);
      setLastSelectedId(recipe.id);
      setRolledAt(timeStamp(new Date()));
      localStorage.setItem('lastSelectedRecipeId', recipe.id.toString());
      setRolling(false);
    }, 280);
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const handleAddRecipe = async () => {
    if (!newRecipe.name || !newRecipe.cuisine || !newRecipe.mealType || !newRecipe.cookTime || !newRecipe.ingredients) {
      alert('Please fill in all required fields');
      return;
    }
    const ingredientList = newRecipe.ingredients.split('\n').filter((s) => s.trim());
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRecipe.name,
          cuisine: newRecipe.cuisine.toLowerCase(),
          meal_type: newRecipe.mealType.toLowerCase(),
          cook_time: parseInt(newRecipe.cookTime),
          ingredients: ingredientList,
          source: newRecipe.source || 'Personal collection',
        }),
      });
      if (!res.ok) throw new Error('Failed to add');
      await loadRecipes();
      setNewRecipe({ name: '', cuisine: '', mealType: '', cookTime: '', ingredients: '', source: '' });
      setShowAddRecipe(false);
    } catch (error) {
      console.error('Error adding recipe:', error);
    }
  };

  const handleCopyShare = () => {
    if (!selectedRecipe) return;
    const lines = [
      `🍽️ Tonight's Dinner: ${selectedRecipe.name}`,
      '',
      '📋 Shopping List:',
      ...selectedRecipe.ingredients.map((ing) => `• ${ing}`),
      '',
      `⏱️ Cook Time: ${selectedRecipe.cook_time} minutes`,
      `🌍 Cuisine: ${selectedRecipe.cuisine}`,
      `📖 Source: ${selectedRecipe.source || 'Personal'}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const label = 'font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted font-medium';
  const underlineField = 'w-full bg-transparent border-b border-ink/15 py-2 text-ink focus:outline-none focus:border-moss transition-colors placeholder:text-ink-muted/40';

  return (
    <div className="min-h-screen w-full bg-page text-ink p-4 lg:p-10 flex items-center justify-center font-sans">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl border border-ink/10 flex flex-col lg:flex-row overflow-hidden min-h-screen">

        {/* Sidebar */}
        <aside className="w-full lg:w-80 lg:shrink-0 bg-panel border-b lg:border-b-0 lg:border-r border-ink/10 p-8 lg:p-10 flex flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
          <header className="mb-10">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-muted block mb-2">
              Curation
            </span>
            <h2 className="text-3xl font-serif italic text-ink leading-tight">The Pantry</h2>
          </header>

          <div className="flex-1 space-y-8">
            {/* Cuisine */}
            <div>
              <label className={`${label} mb-3 block`}>Cuisine origin</label>
              <div className="relative">
                <select
                  value={filters.cuisine}
                  onChange={(e) => setFilters({ ...filters, cuisine: e.target.value })}
                  className={`${underlineField} appearance-none cursor-pointer pr-6`}
                >
                  <option value="">Any origin</option>
                  {cuisineOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <svg className="w-3.5 h-3.5 text-ink-muted absolute right-0 bottom-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Meal type pills */}
            <div>
              <label className={`${label} mb-3 block`}>Meal type</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters({ ...filters, mealType: '' })}
                  className={`px-3 py-1 rounded-full text-xs transition-all ${
                    filters.mealType === ''
                      ? 'bg-moss text-white border border-moss'
                      : 'border border-ink/15 text-ink-muted hover:border-moss hover:text-ink'
                  }`}
                >
                  Any
                </button>
                {MEAL_TYPES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setFilters({ ...filters, mealType: m })}
                    className={`px-3 py-1 rounded-full text-xs capitalize transition-all ${
                      filters.mealType === m
                        ? 'bg-moss text-white border border-moss'
                        : 'border border-ink/15 text-ink-muted hover:border-moss hover:text-ink'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cook time slider */}
            <div>
              <label className={`${label} mb-3 block`}>Time to table</label>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={cookTimeNum}
                onChange={(e) => setFilters({ ...filters, maxCookTime: e.target.value })}
                className="w-full h-1.5 bg-ink/10 rounded-full appearance-none cursor-pointer accent-moss"
              />
              <div className="flex justify-between mt-2 font-mono text-[10px] tracking-wider uppercase text-ink-muted">
                <span>15 min</span>
                <span>{cookTimeNum >= 120 ? 'Any' : `${cookTimeNum} min`}</span>
              </div>
            </div>

            {/* Ingredient */}
            <div>
              <label className={`${label} mb-3 block`}>Must include</label>
              <input
                type="text"
                value={filters.ingredient}
                onChange={(e) => setFilters({ ...filters, ingredient: e.target.value })}
                className={underlineField}
                placeholder="e.g. heirloom kale"
              />
            </div>

            {/* Protein forward toggle */}
            <div className="flex items-center justify-between">
              <label className={label}>Protein forward</label>
              <button
                role="switch"
                aria-checked={filters.proteinForward}
                onClick={() => setFilters({ ...filters, proteinForward: !filters.proteinForward })}
                className={`relative w-10 h-5 rounded-full p-1 transition-colors ${
                  filters.proteinForward ? 'bg-moss' : 'bg-ink/15'
                }`}
              >
                <span
                  className="block w-3 h-3 bg-white rounded-full shadow-sm transition-transform"
                  style={{ transform: filters.proteinForward ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted hover:text-clay transition-colors"
              >
                Clear preferences
              </button>
            )}
          </div>

          <footer className="mt-10 pt-6">
            <button
              onClick={selectRandomRecipe}
              disabled={matchCount === 0 || rolling || loading}
              className="w-full py-4 bg-moss-deep text-white rounded-lg text-sm font-medium tracking-wide uppercase hover:bg-ink transition-all active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {rolling ? 'Stirring the pot…' : selectedRecipe ? 'Try another' : 'Find inspiration'}
            </button>
            <div className="mt-4 flex justify-between font-mono text-[10px] tracking-wider uppercase text-ink-muted">
              <span>{matchCount} / {recipes.length} match</span>
              <span>{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'}</span>
            </div>
          </footer>
        </aside>

        {/* Main panel */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <div className="px-6 py-4 flex justify-end items-center border-b border-ink/8">
            <button
              onClick={() => setShowAddRecipe(true)}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink transition-colors"
            >
              + Add entry
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-y-auto">
            {loading ? (
              <EmptyState
                title="Gathering from the pantry…"
                body="One moment while the cards are pulled from the shelf."
              />
            ) : !selectedRecipe ? (
              <EmptyState
                title={matchCount === 0 ? 'Nothing fits those preferences' : 'Waiting for the seasons to shift…'}
                body={matchCount === 0
                  ? 'Loosen a filter on the left and try again.'
                  : 'Set your preferences on the left, then ask the pantry what\'s for dinner tonight.'}
              />
            ) : (
              <article className="p-10 lg:p-14 max-w-3xl">
                <div className="flex items-center gap-3 mb-6 flex-wrap font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                  <span>No. {pad(selectedRecipe.id)}</span>
                  <span className="text-ink/20">·</span>
                  <span>Rolled {rolledAt ?? '—'}</span>
                </div>

                <h2 className="text-4xl lg:text-5xl font-serif italic text-ink leading-[1.05] mb-8">
                  {selectedRecipe.name}
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-ink/10 pt-6 mb-8">
                  <MetaField label="Time" value={`${selectedRecipe.cook_time} min`} mono />
                  <MetaField label="Origin" value={selectedRecipe.cuisine} />
                  <MetaField label="Form" value={selectedRecipe.meal_type} />
                  <div className="space-y-1">
                    <span className={label}>Source</span>
                    {selectedRecipe.source && /^https?:\/\//.test(selectedRecipe.source) ? (
                      <a
                        href={selectedRecipe.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] text-ink border-b border-clay hover:text-clay inline-flex items-center gap-1"
                      >
                        Open
                        <ExternalLink className="w-3 h-3" strokeWidth={2} />
                      </a>
                    ) : (
                      <span className="block text-[15px] text-ink truncate">
                        {selectedRecipe.source || 'Personal'}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCopyShare}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink border border-ink/15 hover:border-moss rounded-lg px-4 py-2 transition-all mb-8"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={2} />
                  {copied ? 'Copied!' : 'Copy & Share'}
                </button>

                <div>
                  <h3 className={`${label} mb-4`}>Ingredients</h3>
                  <ul className="space-y-3">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <span className="text-clay mt-2 text-[6px]">●</span>
                        <span className="text-[15px] leading-relaxed text-ink">{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            )}
          </div>

          <footer className="px-6 py-4 border-t border-ink/8 flex justify-between items-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">
            <span className="hidden sm:inline">{recipes.length} recipes loaded</span>
            <span>Last roll {rolledAt ?? '—'}</span>
          </footer>
        </main>
      </div>

      {/* Add recipe modal */}
      {showAddRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-4 md:p-8"
          style={{ background: 'rgba(30,36,31,0.45)' }}
          onClick={() => setShowAddRecipe(false)}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-ink/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-ink/8 bg-panel flex items-center justify-between rounded-t-2xl">
              <div>
                <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-muted block">New entry</span>
                <h3 className="text-xl text-ink font-medium">Add to the pantry</h3>
              </div>
              <button onClick={() => setShowAddRecipe(false)} className="text-ink-muted hover:text-ink">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <FormField label="Recipe name" required>
                <input type="text" value={newRecipe.name} onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })} className={underlineField} placeholder="Chicken tikka masala" />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Cuisine" required>
                  <input type="text" value={newRecipe.cuisine} onChange={(e) => setNewRecipe({ ...newRecipe, cuisine: e.target.value })} className={underlineField} placeholder="indian" />
                </FormField>
                <FormField label="Meal type" required>
                  <input type="text" value={newRecipe.mealType} onChange={(e) => setNewRecipe({ ...newRecipe, mealType: e.target.value })} className={underlineField} placeholder="plate" />
                </FormField>
                <FormField label="Cook time (min)" required>
                  <input type="number" value={newRecipe.cookTime} onChange={(e) => setNewRecipe({ ...newRecipe, cookTime: e.target.value })} className={underlineField} placeholder="30" />
                </FormField>
              </div>
              <FormField label="Ingredients (one per line)" required>
                <textarea value={newRecipe.ingredients} onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })} className={`${underlineField} h-32 leading-relaxed`} placeholder={'1 lb chicken breast\n2 cups kale\n3 cloves garlic'} />
              </FormField>
              <FormField label="Source">
                <input type="text" value={newRecipe.source} onChange={(e) => setNewRecipe({ ...newRecipe, source: e.target.value })} className={underlineField} placeholder="URL or cookbook" />
              </FormField>
              <button
                onClick={handleAddRecipe}
                className="w-full py-4 bg-moss-deep text-white rounded-lg text-sm font-medium tracking-wide uppercase hover:bg-ink transition-all"
              >
                Add to pantry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
      <div className="max-w-md space-y-5">
        <div className="inline-flex p-4 rounded-full border border-ink/10">
          <BookOpen className="w-7 h-7 text-ink/20" strokeWidth={1} />
        </div>
        <h3 className="text-lg text-ink/70 font-medium">{title}</h3>
        <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>
    </div>
  );
}

function MetaField({ label, value, mono }) {
  const labelClass = 'font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted font-medium';
  return (
    <div className="space-y-1">
      <span className={labelClass}>{label}</span>
      <span className={`block text-[15px] text-ink capitalize ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-2">
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-muted font-medium block">
        {label} {required && <span className="text-clay">*</span>}
      </span>
      {children}
    </div>
  );
}
