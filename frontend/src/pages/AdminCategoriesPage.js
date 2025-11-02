import React, { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    api.get("/category").then((res) => setCategories(res.data));
  }, []);

  const addCategory = () => {
    if (!newCategoryName.trim()) return alert("Category name required");
    api.post("/category", { name: newCategoryName.trim() })
      .then(() => {
        setNewCategoryName("");
        api.get("/category").then((res) => setCategories(res.data));
      });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Category Management</h2>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          className="border p-2 rounded flex-grow"
          placeholder="New Category Name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <button
          onClick={addCategory}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Add Category
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">Category List</h3>
      <ul className="list-disc ml-6">
        {categories.map((c) => (
          <li key={c.id} className="mb-1">
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
