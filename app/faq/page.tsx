"use client";

// import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SlArrowDown, SlArrowUp } from "react-icons/sl";

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

  //Ggestion des sessions
  // const { data: session, status } = useSession();
  const router = useRouter();
  // useEffect(() => {
  //   if (status === "loading") return;

  //   if (!session?.user) {
  //     router.push("/signup");
  //   } else {
  //     console.log(session);
  //   }
  // }, [status, session, router]);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch("/api/faq");
        if (!response.ok) throw new Error("Failed to fetch FAQ");
        const data: Category[] = await response.json();
        setCategories(data);
        // Initialize all categories as expanded
        const initialExpanded: Record<number, boolean> = {};
        data.forEach((cat) => {
          initialExpanded[cat.category_id] = false;
        });
        setExpanded(initialExpanded);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchFAQ();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpanded((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Erreur: {error}
      </div>
    );

  return (
    <main className="flex flex-col items-center justify-start h-full min-h-screen bg-zinc-50 p-1 text-zinc-900 overflow-y-hidden">
      <div className="flex items-start justify-start flex-col h-full mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-2">
        <h1 className="mb-4 text-3xl font-bold">FAQs</h1>
        <p className="mb-6 text-gray-600">
          Retrouvez dans cette section les réponses aux questions les plus
          fréquemment posées au sujet du salon.
        </p>

        <section className="space-y-4 w-full p-3">
          {categories.map((category) => (
            <div key={category.category_id} className="w-full">
              <h2
                className="text-xl font-semibold mb-4 cursor-pointer flex items-center justify-between hover:text-gray-700 transition-colors"
                onClick={() => toggleCategory(category.category_id)}
              >
                {category.category_name.toLocaleUpperCase()}
                <span
                  className={`ml-2 text-gray-500 py-1 px-6 transform transition-all duration-300 ${
                    expanded[category.category_id]
                      ? "rotate-180 scale-110"
                      : "rotate-0 scale-100"
                  }`}
                >
                  <SlArrowDown />
                </span>
              </h2>
              {expanded[category.category_id] && (
                <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                  {category.faqs.map((faq) => (
                    <div key={faq.id} className="border-b border-gray-200 pb-4">
                      <h3 className="text-md font-medium font-semibold">
                        {faq.question}
                      </h3>
                      <p className="mt-2 text-gray-700 text-wrap">
                        {faq.response}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="mt-8 flex gap-3">
          <Link
            href="/"
            className="rounded-lg bg-[#2d4a53] px-4 py-2 text-white hover:bg-[#233d45] transition"
          >
            Retour
          </Link>
        </div>
      </div>
    </main>
  );
}
