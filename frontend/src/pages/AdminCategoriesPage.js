import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    setLoading(true);
    api.get("/category")
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    api.post("/category", { name: newCategoryName.trim() })
      .then(() => {
        setNewCategoryName("");
        fetchCategories();
      })
      .catch(() => alert("Failed to add category"));
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = (id) => {
    if (!editingName.trim()) {
      alert("Category name is required");
      return;
    }

    api.put(`/category/${id}`, { id, name: editingName.trim() })
      .then(() => {
        cancelEdit();
        fetchCategories();
      })
      .catch(() => alert("Failed to update category"));
  };

  const deleteCategory = (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    api.delete(`/category/${id}`)
      .then(() => fetchCategories())
      .catch(() => alert("Failed to delete category"));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Category Management</h2>
        <p className="text-gray-600">Organize your products into categories for easier management</p>
      </div>

      {/* Add New Category Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Category
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
            placeholder="Enter category name..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Categories List
          <span className="ml-auto text-sm font-normal text-gray-500">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 mb-2">No categories yet</p>
            <p className="text-sm text-gray-400">Add your first category to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition hover:shadow-md"
              >
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full border-2 border-blue-500 rounded p-2 focus:outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(category.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(category.id)}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition text-sm font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">
                            {category.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{category.name}</h4>
                          <p className="text-xs text-gray-500">ID: {category.id}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(category)}
                        className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}