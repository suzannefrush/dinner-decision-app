'use client'

import React, { useState, useEffect } from 'react';
import { ChefHat, Filter, ShoppingCart, Share2, Plus, X, RefreshCw, Clock, Utensils } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cuisine: '',
    mealType: '',
    maxCookTime: '',
    ingredient: ''
  });

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    cuisine: '',
    mealType: '',
    cookTime: '',
    ingredients: '',
    source: ''
  });

  // Load recipes from Supabase
  useEffect(() => {
    loadRecipes();
    
    const lastId = localStorage.getItem('lastSelectedRecipeId');
    if (lastId) {
      setLastSelectedId(parseInt(lastId));
    }
  }, []);

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      alert('Error loading recipes. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const cuisineOptions = [...new Set(recipes.map(r => r.cuisine))].sort();
  const mealTypeOptions = [...new Set(recipes.map(r => r.meal_type))].sort();

  const getFilteredRecipes = () => {
    return recipes.filter(recipe => {
      if (filters.cuisine && recipe.cuisine !== filters.cuisine) return false;
      if (filters.mealType && recipe.meal_type !== filters.mealType) return false;
      if (filters.maxCookTime && recipe.cook_time > parseInt(filters.maxCookTime)) return false;
      if (filters.ingredient) {
        const hasIngredient = recipe.ingredients.some(ing => 
          ing.toLowerCase().includes(filters.ingredient.toLowerCase())
        );
        if (!hasIngredient) return false;
      }
      return true;
    });
  };

  const selectRandomRecipe = () => {
    const filtered = getFilteredRecipes();
    const available = filtered.filter(r => r.id !== lastSelectedId);
    
    if (available.length === 0) {
      if (filtered.length === 0) {
        alert('No recipes match your filters!');
        return;
      }
      const recipe = filtered[Math.floor(Math.random() * filtered.length)];
      setSelectedRecipe(recipe);
      setLastSelectedId(recipe.id);
      localStorage.setItem('lastSelectedRecipeId', recipe.id.toString());
    } else {
      const recipe = available[Math.floor(Math.random() * available.length)];
      setSelectedRecipe(recipe);
      setLastSelectedId(recipe.id);
      localStorage.setItem('lastSelectedRecipeId', recipe.id.toString());
    }
  };

  const copyToClipboard = () => {
    const text = `🍽️ Tonight's Dinner: ${selectedRecipe.name}

📋 Shopping List:
${selectedRecipe.ingredients.map(ing => `• ${ing}`).join('\n')}

⏱️ Cook Time: ${selectedRecipe.cook_time} minutes
🌍 Cuisine: ${selectedRecipe.cuisine}
📖 Source: ${selectedRecipe.source}`;

    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard! Ready to share with your partner.');
    });
  };

  const handleAddRecipe = async () => {
    if (!newRecipe.name || !newRecipe.cuisine || !newRecipe.mealType || !newRecipe.cookTime || !newRecipe.ingredients) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    const ingredientList = newRecipe.ingredients.split('\n').filter(s => s.trim());
    
    const recipe = {
      name: newRecipe.name,
      cuisine: newRecipe.cuisine.toLowerCase(),
      meal_type: newRecipe.mealType.toLowerCase(),
      cook_time: parseInt(newRecipe.cookTime),
      main_ingredients: ingredientList.map(ing => {
        const match = ing.match(/[a-zA-Z\s]+/);
        return match ? match[0].trim().toLowerCase() : ing.toLowerCase();
      }),
      ingredients: ingredientList,
      source: newRecipe.source || 'Personal collection'
    };
    
    try {
      const { error } = await supabase
        .from('recipes')
        .insert([recipe]);

      if (error) throw error;

      // Reload recipes
      await loadRecipes();
      
      setNewRecipe({
        name: '', cuisine: '', mealType: '', cookTime: '',
        ingredients: '', source: ''
      });
      setShowAddRecipe(false);
      alert('Recipe added successfully!');
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert('Error adding recipe. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-orange-600 animate-pulse" />
          <p className="text-gray-600">Loading recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ChefHat className="w-10 h-10 text-orange-600" />
            <h1 className="text-4xl font-bold text-gray-800">What's for Dinner?</h1>
          </div>
          <p className="text-gray-600">Let us decide so you don't have to</p>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap justify-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Filter className="w-5 h-5" />
            Filters {Object.values(filters).some(f => f) && '✓'}
          </button>
          <button
            onClick={() => setShowAddRecipe(!showAddRecipe)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Add Recipe
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Filter Recipes</h2>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cuisine</label>
                <select
                  value={filters.cuisine}
                  onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Any</option>
                  {cuisineOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meal Type</label>
                <select
                  value={filters.mealType}
                  onChange={(e) => setFilters({...filters, mealType: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Any</option>
                  {mealTypeOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Cook Time (minutes)</label>
                <input
                  type="number"
                  value={filters.maxCookTime}
                  onChange={(e) => setFilters({...filters, maxCookTime: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Must Include Ingredient</label>
                <input
                  type="text"
                  value={filters.ingredient}
                  onChange={(e) => setFilters({...filters, ingredient: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., kale"
                />
              </div>
            </div>
            <button
              onClick={() => setFilters({cuisine: '', mealType: '', maxCookTime: '', ingredient: ''})}
              className="mt-4 text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}

        {showAddRecipe && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Recipe</h2>
              <button onClick={() => setShowAddRecipe(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Recipe Name *</label>
                <input
                  type="text"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Chicken Tikka Masala"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cuisine *</label>
                  <input
                    type="text"
                    value={newRecipe.cuisine}
                    onChange={(e) => setNewRecipe({...newRecipe, cuisine: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., asian"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meal Type *</label>
                  <input
                    type="text"
                    value={newRecipe.mealType}
                    onChange={(e) => setNewRecipe({...newRecipe, mealType: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., soup"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cook Time (min) *</label>
                  <input
                    type="number"
                    value={newRecipe.cookTime}
                    onChange={(e) => setNewRecipe({...newRecipe, cookTime: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ingredients List (one per line) *</label>
                <textarea
                  value={newRecipe.ingredients}
                  onChange={(e) => setNewRecipe({...newRecipe, ingredients: e.target.value})}
                  className="w-full p-2 border rounded h-32"
                  placeholder="1 lb chicken breast&#10;2 cups kale&#10;3 cloves garlic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source (optional)</label>
                <input
                  type="text"
                  value={newRecipe.source}
                  onChange={(e) => setNewRecipe({...newRecipe, source: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., NY Times Cooking"
                />
              </div>
              <button
                onClick={handleAddRecipe}
                className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add Recipe
              </button>
            </div>
          </div>
        )}

        {!selectedRecipe ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Utensils className="w-16 h-16 mx-auto mb-4 text-orange-400" />
            <p className="text-gray-600 mb-6">
              {getFilteredRecipes().length} recipe{getFilteredRecipes().length !== 1 ? 's' : ''} available
              {Object.values(filters).some(f => f) && ' with current filters'}
            </p>
            <button
              onClick={selectRandomRecipe}
              className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
              What Should I Make?
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedRecipe.name}</h2>
                <div className="flex gap-4 text-sm text-gray-600 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedRecipe.cook_time} min
                  </span>
                  <span>• {selectedRecipe.cuisine}</span>
                  <span>• {selectedRecipe.meal_type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping List
              </h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 mt-1">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedRecipe.source && (
              <p className="text-sm text-gray-500 mb-6">Source: {selectedRecipe.source}</p>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={copyToClipboard}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                Copy & Share
              </button>
              <button
                onClick={selectRandomRecipe}
                className="px-6 py-3 border-2 border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Pick Another
              </button>
            </div>
          </div>
        )}

        <div className="text-center mt-8 text-sm text-gray-500">
          You have {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your collection
        </div>
      </div>
    </div>
  );
}