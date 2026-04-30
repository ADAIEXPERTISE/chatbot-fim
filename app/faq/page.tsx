"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface FAQ {
  id: number;
  question: string;
  response: string;
}

interface Category {
  category_id: number;
  category_name: string;
  faqs: FAQ[];
}

export default function FAQPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch('/api/faq');
        if (!response.ok) throw new Error('Failed to fetch FAQ');
        const data: Category[] = await response.json();
        setCategories(data);
        // Initialize all categories as expanded
        const initialExpanded: Record<number, boolean> = {};
        data.forEach(cat => {
          initialExpanded[cat.category_id] = true;
        });
        setExpanded(initialExpanded);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpanded(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Erreur: {error}</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-3xl font-bold">FAQ - Foire</h1>
        <p className="mb-6 text-gray-600">Retrouvez ici les questions fréquentes du salon.</p>

        <section className="space-y-6">
          {categories.map((category) => (
            <div key={category.category_id}>
              <h2 
                className="text-xl font-semibold mb-4 cursor-pointer flex items-center hover:text-gray-700 transition-colors"
                onClick={() => toggleCategory(category.category_id)}
              >
                {category.category_name}
                <span className="ml-2 text-gray-500">
                  {expanded[category.category_id] ? '▼' : '▶'}
                </span>
              </h2>
              {expanded[category.category_id] && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  {category.faqs.map((faq) => (
                    <div key={faq.id} className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium">{faq.question}</h3>
                      <p className="mt-2 text-gray-700">{faq.response}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="mt-8 flex gap-3">
          <Link href="/" className="rounded-lg bg-[#2d4a53] px-4 py-2 text-white hover:bg-[#233d45] transition">
            Retour au chatbot
          </Link>
        </div>
      </div>
    </main>
  );
}
